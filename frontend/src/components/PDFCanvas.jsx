// src/components/PDFCanvas.jsx
import React, { useEffect, useRef } from "react";
import { renderPage } from "../helpers/pdfRenderer";

/**
 * props:
 *  pdfDoc, pageNumber (1-indexed), zoom, annotations (array), highlightedField,
 *  onStartDrawing, onDrawing, onFinishDrawing
 */
const PDFCanvas = ({ pdfDoc, pageNumber, zoom, annotations = [], highlightedField, onStartDrawing, onDrawing, onFinishDrawing }) => {
    const canvasRef = useRef(null);

    // Render page when pdfDoc, pageNumber, or zoom change
    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!pdfDoc || !canvasRef.current) return;
            try {
                await renderPage(pdfDoc, pageNumber, canvasRef.current, zoom);
                // Draw overlays
                const ctx = canvasRef.current.getContext("2d");
                annotations
                    .filter(a => a.page === pageNumber)
                    .forEach(ann => {
                        const isHighlighted = highlightedField === ann.field_id || highlightedField === ann.id;
                        ctx.strokeStyle = isHighlighted ? "#10b981" : "#3b82f6";
                        ctx.fillStyle = isHighlighted ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)";
                        ctx.lineWidth = isHighlighted ? 3 : 2;

                        const x = ann.bbox[0] * zoom;
                        const y = ann.bbox[1] * zoom;
                        const w = (ann.bbox[2] - ann.bbox[0]) * zoom;
                        const h = (ann.bbox[3] - ann.bbox[1]) * zoom;
                        ctx.fillRect(x, y, w, h);
                        ctx.strokeRect(x, y, w, h);

                        ctx.fillStyle = isHighlighted ? "#065f46" : "#1e3a8a";
                        ctx.font = `bold ${12 * zoom}px Arial`;
                        ctx.fillText(ann.field_name || "field", x + 6 * zoom, y + 14 * zoom);
                    });
                if (highlightedField === "new" && startRef.current) {
                    const { x, y } = startRef.current;
                    const rect = toPdfCoords({ clientX: x, clientY: y });
                    ctx.strokeStyle = "#f59e0b"; // amber for draft
                    ctx.lineWidth = 2;
                    ctx.strokeRect(rect.x, rect.y, 50, 30); // or actual drawn bbox
                }
            } catch (err) {
                console.error("PDFCanvas render error:", err);
            }
        })();
        return () => { isMounted = false; };
    }, [pdfDoc, pageNumber, zoom, annotations, highlightedField]);

    // Drawing state is managed by parent via callbacks
    const dragging = useRef(false);
    const startRef = useRef(null);

    const toPdfCoords = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
    };

    const handleMouseDown = (e) => {
        dragging.current = true;
        const p = toPdfCoords(e);
        startRef.current = p;
        onStartDrawing && onStartDrawing(p);
    };

    const handleMouseMove = (e) => {
        if (!dragging.current) return;
        const p = toPdfCoords(e);
        onDrawing && onDrawing({ start: startRef.current, current: p });
    };

    const handleMouseUp = (e) => {
        if (!dragging.current) return;
        dragging.current = false;
        const p = toPdfCoords(e);
        const s = startRef.current;
        onFinishDrawing && onFinishDrawing({
            bbox: [Math.min(s.x, p.x), Math.min(s.y, p.y), Math.max(s.x, p.x), Math.max(s.y, p.y)],
            page: pageNumber
        });
        startRef.current = null;
    };

    return (
        <div className="w-full bg-gray-50 border rounded">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="w-full cursor-crosshair"
                style={{ display: "block", maxWidth: "100%" }}
            />
        </div>
    );
};

export default PDFCanvas;
