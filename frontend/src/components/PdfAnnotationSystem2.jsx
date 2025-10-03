// src/PDFAnnotationSystem.jsx
import React, { useState, useRef, useEffect } from "react";
import { Upload, ZoomIn, ZoomOut, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { uploadPDF, saveAnnotations, fetchAnnotations, updateAnnotation as apiUpdateAnnotation, deleteAnnotation as apiDeleteAnnotation } from "../helpers/api";
import { loadPDF } from "../helpers/pdfRenderer";

import AppToaster from "./Toaster";
import GenericModal from "./GenericModal";
import PDFUploader from "./PDFUploader";
import PDFCanvas from "./PDFCanvas";
import AnnotationForm from "./AnnotationForm";
import AnnotationList from "./AnnotationList";

import toast from "react-hot-toast";

// convert pixel -> normalized
const pixelToNormalized = (bbox, pageWidth, pageHeight) => {
    return [
        bbox[0] / pageWidth,
        bbox[1] / pageHeight,
        bbox[2] / pageWidth,
        bbox[3] / pageHeight,
    ];
};

// convert normalized -> pixel
const normalizedToPixel = (bbox, pageWidth, pageHeight) => {
    return [
        bbox[0] * pageWidth,
        bbox[1] * pageHeight,
        bbox[2] * pageWidth,
        bbox[3] * pageHeight,
    ];
};

const PDFAnnotationSystem = () => {
    const [mode, setMode] = useState("upload");
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pdfPages, setPdfPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [editingAnnotation, setEditingAnnotation] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, ann: null, onConfirm: null });
    const [loading, setLoading] = useState(false);
    const [currentDocumentId, setCurrentDocumentId] = useState(null);

    const fileInputRef = useRef(null);

    const [processId] = useState(49);
    const [formId] = useState(20);

    const [fieldMetadata, setFieldMetadata] = useState({
        field_name: "",
        field_header: "",
        field_type: "CharField",
        placeholder: "",
        required: false,
        max_length: 50
    });

    // Reset form to defaults
    const resetForm = () => {
        setFieldMetadata({
            field_name: "",
            field_header: "",
            field_type: "CharField",
            placeholder: "",
            required: false,
            max_length: 50
        });
        setSelectedAnnotation(null);
        setEditingAnnotation(null);
    };

    // --- upload handler ---
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") {
            toast.error("Please upload a valid PDF file");
            return;
        }

        try {
            setLoading(true);
            const res = await uploadPDF(file, processId, formId);
            console.log("Uploaded PDF:", res);

            // Store document ID from upload response
            const documentId = res?.document_id || res?.id || `doc_${Date.now()}`;
            setCurrentDocumentId(documentId);

            setPdfFile(file);
            const pdf = await loadPDF(file);
            setPdfDoc(pdf);

            const pages = Array.from({ length: pdf.numPages }, (_, i) => ({
                pageNumber: i + 1,
                width: null,
                height: null
            }));
            setPdfPages(pages);
            setMode("mapping");
            setCurrentPage(0);
            setAnnotations([]); // Reset annotations for new document
            toast.success("PDF loaded — you can start mapping fields");
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Failed to upload or load PDF");
        } finally {
            setLoading(false);
        }
    };

    // --- load annotations from backend ---
    const loadFromDB = async () => {
        if (!currentDocumentId) {
            console.warn("No document ID available");
            return;
        }

        try {
            setLoading(true);
            const res = await fetchAnnotations(processId, formId, currentDocumentId);
            if (!res || !Array.isArray(res)) {
                toast("No annotations found for this document", { icon: "ℹ️" });
                setAnnotations([]);
                return;
            }

            const mapped = res
                .filter(item => item.document_id === currentDocumentId || item.process === processId)
                .map(item => {
                    const ann = item.annotation || {};
                    let bbox = item.bbox || ann.bbox || ann?.bbox?.normalized || null;

                    if (bbox && typeof bbox === "object" && !Array.isArray(bbox)) {
                        if ("x1" in bbox) {
                            bbox = [bbox.x1, bbox.y1, bbox.x2, bbox.y2];
                        } else if ("x_min" in bbox) {
                            bbox = [bbox.x_min, bbox.y_min, bbox.x_max, bbox.y_max];
                        }
                    }

                    const normalized = bbox && bbox.every(v => typeof v === "number" && v <= 1);

                    return {
                        ...item,
                        id: item.id || item.field_id,
                        field_id: item.field_id || item.id,
                        bbox,
                        page: item.page || (ann && ann.page) || 1,
                        field_name: item.field_name || item.annotation?.field_name || item.name,
                        field_type: item.field_type || item.types || "CharField",
                        document_id: currentDocumentId,
                        metadata: {
                            placeholder: item.placeholder || item.metadata?.placeholder || "",
                            required: item.required || item.metadata?.required || false,
                            max_length: item.max_length || item.metadata?.max_length || 0
                        },
                        _saved: true,
                        _normalized: normalized
                    };
                });

            setAnnotations(mapped);
            toast.success(`Loaded ${mapped.length} annotations for this document`);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to fetch annotations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if ((mode === "mapping" || mode === "executive") && pdfDoc && currentDocumentId) {
            loadFromDB();
        }
    }, [mode, pdfDoc, currentDocumentId]);

    const handleStartDrawing = (point) => {
        // Clear any editing state when starting new drawing
        if (editingAnnotation) {
            resetForm();
        }
    };

    const handleDrawing = ({ start, current }) => {
        // optional preview
    };

    const handleFinishDrawing = ({ bbox, page }) => {
        if ((bbox[2] - bbox[0]) < 8 || (bbox[3] - bbox[1]) < 8) {
            toast.error("Box too small - draw a larger area");
            return;
        }

        setSelectedAnnotation({ bbox, page });
        setEditingAnnotation(null);
        resetForm();
        toast("Box captured — fill field metadata below", { icon: "✍️" });
    };

    // Save new annotation
    const saveAnnotationLocal = () => {
        if (!selectedAnnotation || !fieldMetadata.field_name.trim()) {
            toast.error("Draw a box and provide field name");
            return;
        }

        const id = Date.now().toString();
        const newAnn = {
            id,
            field_id: id,
            process: processId,
            form_id: formId,
            document_id: currentDocumentId,
            field_name: fieldMetadata.field_name.trim(),
            field_header: fieldMetadata.field_header.trim(),
            bbox: selectedAnnotation.bbox,
            page: selectedAnnotation.page,
            scale: zoom,
            field_type: fieldMetadata.field_type,
            metadata: {
                required: fieldMetadata.required,
                max_length: fieldMetadata.max_length,
                placeholder: fieldMetadata.placeholder
            },
            _saved: false
        };

        setAnnotations(prev => [...prev, newAnn]);
        resetForm();
        toast.success("Annotation added — remember to 'Save All' to persist");
    };

    // Save all annotations to backend
    const persistAll = async () => {
        if (!annotations || annotations.length === 0) {
            toast.error("Nothing to save");
            return;
        }

        const newAnns = annotations.filter(a => !a._saved);
        const existingAnns = annotations.filter(a => a._saved);

        const payload = newAnns.map(ann => ({
            process: ann.process,
            form_id: ann.form_id,
            document_id: currentDocumentId,
            field_id: ann.field_id,
            field_name: ann.field_name,
            field_header: ann.field_header,
            bbox: ann.bbox,
            page: ann.page,
            scale: ann.scale,
            field_type: ann.field_type,
            metadata: ann.metadata
        }));

        try {
            setLoading(true);

            if (payload.length > 0) {
                const created = await saveAnnotations(payload);
                console.log("Bulk saved:", created);
            }

            for (const ann of existingAnns) {
                try {
                    await apiUpdateAnnotation(ann.field_id, {
                        process: ann.process,
                        form_id: ann.form_id,
                        document_id: currentDocumentId,
                        field_id: ann.field_id,
                        field_name: ann.field_name,
                        field_header: ann.field_header,
                        bbox: ann.bbox,
                        page: ann.page,
                        scale: ann.scale,
                        field_type: ann.field_type,
                        metadata: ann.metadata
                    });
                } catch (err) {
                    console.warn("Update failed for", ann.field_id, err);
                }
            }

            setAnnotations(prev => prev.map(a => ({ ...a, _saved: true })));
            toast.success(`All annotations saved successfully`);
        } catch (err) {
            console.error("Persist error:", err);
            toast.error("Failed to persist annotations");
        } finally {
            setLoading(false);
        }
    };

    const onDeleteRequest = (ann) => {
        setConfirmModal({
            open: true,
            ann,
            onConfirm: async () => {
                try {
                    setConfirmModal(m => ({ ...m, open: false }));
                    if (ann._saved) {
                        await apiDeleteAnnotation(ann.field_id);
                    }
                    setAnnotations(prev => prev.filter(a => a.id !== ann.id && a.field_id !== ann.field_id));

                    // Clear form if this was being edited
                    if (editingAnnotation?.id === ann.id) {
                        resetForm();
                    }

                    toast.success("Annotation deleted");
                } catch (err) {
                    console.error("Delete error:", err);
                    toast.error("Failed to delete annotation");
                }
            }
        });
    };

    const onEditRequest = (ann) => {
        // Populate form with annotation data
        setEditingAnnotation(ann);
        setSelectedAnnotation(null);
        setFieldMetadata({
            field_name: ann.field_name,
            field_header: ann.field_header || "",
            field_type: ann.field_type,
            placeholder: ann.metadata?.placeholder || "",
            required: ann.metadata?.required || false,
            max_length: ann.metadata?.max_length || 50
        });

        // Navigate to annotation's page
        setCurrentPage(ann.page - 1);
        toast.info(`Editing: ${ann.field_name}`);
    };

    const saveEdit = async () => {
        if (!editingAnnotation || !fieldMetadata.field_name.trim()) {
            toast.error("Field name is required");
            return;
        }

        const updated = {
            ...editingAnnotation,
            field_name: fieldMetadata.field_name.trim(),
            field_header: fieldMetadata.field_header.trim(),
            field_type: fieldMetadata.field_type,
            metadata: {
                placeholder: fieldMetadata.placeholder,
                required: fieldMetadata.required,
                max_length: fieldMetadata.max_length
            }
        };

        setAnnotations(prev => prev.map(a =>
            (a.id === updated.id || a.field_id === updated.field_id) ? updated : a
        ));

        if (updated._saved) {
            try {
                await apiUpdateAnnotation(updated.field_id, {
                    process: updated.process,
                    form_id: updated.form_id,
                    document_id: currentDocumentId,
                    field_id: updated.field_id,
                    field_name: updated.field_name,
                    field_header: updated.field_header,
                    bbox: updated.bbox,
                    page: updated.page,
                    scale: updated.scale,
                    field_type: updated.field_type,
                    metadata: updated.metadata
                });
                toast.success("Annotation updated");
            } catch (err) {
                console.error("Update error:", err);
                toast.error("Failed to update on server");
            }
        } else {
            toast("Annotation updated locally — save to persist", { icon: "💾" });
        }

        resetForm();
    };

    const getPixelAnnotations = () => {
        const { width, height } = pdfPages[currentPage] || {};
        if (!width || !height) return annotations;

        return annotations.map(a => {
            if (a._normalized && a.bbox) {
                return { ...a, bbox: normalizedToPixel(a.bbox, width, height) };
            }
            return a;
        });
    };

    // Zoom controls
    const handleZoomIn = () => setZoom(prev => Math.min(3, prev + 0.25));
    const handleZoomOut = () => setZoom(prev => Math.max(0.5, prev - 0.25));
    const handleZoomReset = () => setZoom(1);

    // Page navigation
    const goToPreviousPage = () => setCurrentPage(prev => Math.max(0, prev - 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(pdfPages.length - 1, prev + 1));

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <AppToaster />
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">PDF Field Mapping System</h1>
                            <p className="text-gray-600 mt-2">Upload PDFs, draw bounding boxes, and configure form fields with metadata</p>
                            {currentDocumentId && (
                                <p className="text-sm text-blue-600 mt-1">Document ID: {currentDocumentId}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { setMode("upload"); resetForm(); }}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${mode === "upload"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                <Upload className="inline mr-2" size={18} />
                                Upload
                            </button>
                            <button
                                onClick={() => { setMode("mapping"); resetForm(); }}
                                disabled={!pdfFile}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${mode === "mapping"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Map Fields
                            </button>
                            <button
                                onClick={() => { setMode("executive"); resetForm(); }}
                                disabled={!pdfFile}
                                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${mode === "executive"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <Eye className="inline mr-2" size={18} />
                                Review
                            </button>
                        </div>
                    </div>
                </div>

                {/* Upload Mode */}
                {mode === "upload" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PDFUploader fileInputRef={fileInputRef} onChoose={handleFileUpload} />
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h4 className="font-semibold text-lg mb-3">Usage Guidelines</h4>
                            <ul className="text-sm text-gray-600 space-y-2">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    Use clear, high-resolution PDFs for accurate field detection
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    Draw bounding boxes tightly around target fields
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    Configure field metadata immediately after drawing
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2">•</span>
                                    Click "Save All" to persist annotations to database
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Mapping Mode */}
                {mode === "mapping" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                            {/* PDF Controls */}
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <h3 className="text-lg font-semibold">
                                    Page {currentPage + 1} of {pdfPages.length}
                                </h3>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleZoomOut}
                                        disabled={zoom <= 0.5}
                                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Zoom Out"
                                    >
                                        <ZoomOut size={18} />
                                    </button>
                                    <button
                                        onClick={handleZoomReset}
                                        className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
                                    >
                                        {Math.round(zoom * 100)}%
                                    </button>
                                    <button
                                        onClick={handleZoomIn}
                                        disabled={zoom >= 3}
                                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        title="Zoom In"
                                    >
                                        <ZoomIn size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Canvas */}
                            <div className="border-2 border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                                <PDFCanvas
                                    pdfDoc={pdfDoc}
                                    pageNumber={currentPage + 1}
                                    zoom={zoom}
                                    annotations={[...getPixelAnnotations(), ...(selectedAnnotation ? [{ ...selectedAnnotation, id: "temp" }] : [])]}
                                    highlightedField={editingAnnotation?.field_id}
                                    onStartDrawing={handleStartDrawing}
                                    onDrawing={handleDrawing}
                                    onFinishDrawing={handleFinishDrawing}
                                />
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between items-center gap-2 mb-4">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 0}
                                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    {annotations.filter(a => a.page === currentPage + 1).length} fields on this page
                                </span>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === pdfPages.length - 1}
                                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={persistAll}
                                disabled={loading || annotations.length === 0}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
                            >
                                <Save className="inline mr-2" size={18} />
                                {loading ? "Saving..." : `Save All Annotations (${annotations.filter(a => !a._saved).length} unsaved)`}
                            </button>
                        </div>

                        {/* Form & List */}
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="mb-4">
                                <AnnotationForm
                                    data={selectedAnnotation || fieldMetadata}
                                    onChange={(updated) => {
                                        if (selectedAnnotation) {
                                            // Editing an existing annotation
                                            setSelectedAnnotation({ ...selectedAnnotation, ...updated, metadata: updated });
                                        } else {
                                            // New annotation
                                            setFieldMetadata(updated);
                                        }
                                    }}
                                    onSave={() => {
                                        if (selectedAnnotation && selectedAnnotation._saved) {
                                            saveEdit(selectedAnnotation);
                                        } else if (selectedAnnotation) {
                                            saveAnnotationLocal();
                                        }
                                    }}
                                    disabled={
                                        !(selectedAnnotation || fieldMetadata.field_name)
                                    }
                                />
                            </div>

                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-semibold mb-3 text-lg">
                                    Annotations ({annotations.length})
                                </h4>
                                <AnnotationList
                                    annotations={annotations}
                                    onEdit={(ann) => setSelectedAnnotation(ann)}  // Prefill
                                    onDelete={(ann) => onDeleteRequest(ann)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Executive/Review Mode */}
                {mode === "executive" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Fields List */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="font-semibold mb-4 text-xl">
                                Mapped Fields ({annotations.length})
                            </h3>
                            <div className="space-y-2 max-h-[700px] overflow-y-auto">
                                {annotations.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <p className="mb-2">No fields mapped yet</p>
                                        <p className="text-sm">Switch to Map mode to create annotations</p>
                                    </div>
                                ) : (
                                    annotations
                                        .filter(a => a.process === processId)
                                        .map(field => (
                                        <div
                                            key={field.id}
                                            onClick={() => {
                                                setCurrentPage(field.page - 1);
                                                toast(`Viewing: ${field.field_name}`, { icon: "👁️" });
                                            }}
                                            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">
                                                        {field.field_header || field.field_name}
                                                        {field.metadata?.required && <span className="text-red-500 ml-1">*</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Page {field.page} • {field.field_type}
                                                    </div>
                                                    {field.metadata?.placeholder && (
                                                        <div className="text-xs text-gray-400 mt-1 italic">
                                                            "{field.metadata.placeholder}"
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`px-2 py-1 rounded text-xs font-medium ${field._saved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                    {field._saved ? "Saved" : "Unsaved"}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* PDF Preview */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-xl">PDF Preview</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleZoomOut} disabled={zoom <= 0.5} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40">
                                        <ZoomOut size={16} />
                                    </button>
                                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium">
                                        {Math.round(zoom * 100)}%
                                    </span>
                                    <button onClick={handleZoomIn} disabled={zoom >= 3} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40">
                                        <ZoomIn size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="border-2 border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                                <PDFCanvas
                                    pdfDoc={pdfDoc}
                                    pageNumber={currentPage + 1}
                                    zoom={zoom}
                                    annotations={getPixelAnnotations().filter(a => a.page === currentPage + 1)}
                                    highlightedField={null}
                                    onStartDrawing={() => { }}
                                    onDrawing={() => { }}
                                    onFinishDrawing={() => { }}
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 0}
                                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} />
                                    Previous
                                </button>
                                <div className="px-4 py-2 text-sm font-medium">
                                    Page {currentPage + 1} / {pdfPages.length}
                                </div>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === pdfPages.length - 1}
                                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                <GenericModal
                    open={confirmModal.open}
                    title="Delete Annotation"
                    description={`Are you sure you want to delete "${confirmModal.ann?.field_name}"? This action cannot be undone.`}
                    onClose={() => setConfirmModal({ open: false, ann: null, onConfirm: null })}
                    onConfirm={() => confirmModal.onConfirm && confirmModal.onConfirm()}
                    confirmLabel="Delete"
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default PDFAnnotationSystem;