// PDFAnnotationSystem.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, Save, Eye, Download, Trash2, Edit2, CheckSquare } from 'lucide-react';
import { uploadPDF, saveAnnotations, fetchAnnotations, updateAnnotation as apiUpdateAnnotation, deleteAnnotation as apiDeleteAnnotation } from '../helpers/api';
import { loadPDF, renderPage } from '../helpers/pdfRenderer';

const PDFAnnotationSystem = () => {
    const [mode, setMode] = useState('upload'); // upload, mapping, executive
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pdfPages, setPdfPages] = useState([]); // { pageNumber, width, height }
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [annotations, setAnnotations] = useState([]); // local annotation objects
    const [selectedAnnotation, setSelectedAnnotation] = useState(null); // { bbox, page }
    const [formFields, setFormFields] = useState([]);
    const [highlightedField, setHighlightedField] = useState(null);

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const [processId] = useState(49);
    const [formId] = useState(20);

    const fieldTypes = ['CharField', 'DateField', 'NumberField', 'EmailField', 'TextAreaField', 'BooleanField'];

    const [fieldMetadata, setFieldMetadata] = useState({
        field_name: '',
        field_header: '',
        field_type: 'CharField',
        placeholder: '',
        required: false,
        max_length: 50
    });

    // --- File upload & PDF loading ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            alert('Please upload a valid PDF file');
            return;
        }

        try {
            // Upload to backend (Cloudinary via API) - optional, keep the response
            const res = await uploadPDF(file, processId, formId);
            console.log('Uploaded PDF:', res);

            setPdfFile(file);

            // Load PDF with pdf.js
            const pdf = await loadPDF(file);
            setPdfDoc(pdf);

            // Prepare page metadata (we fetch page viewport sizes by rendering first page at scale 1 temporarily)
            const pages = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                // we'll get width/height on demand when rendering to canvas, but keep page numbers
                pages.push({ pageNumber: i, width: null, height: null });
            }
            setPdfPages(pages);

            setMode('mapping');
            setCurrentPage(0);
            // Slight delay to let canvas render effect run
        } catch (err) {
            console.error('Upload error:', err);
            alert('Failed to upload or load PDF');
        }
    };

    // Render PDF page + overlays whenever relevant state changes
    useEffect(() => {
        if ((mode === 'mapping' || mode === 'executive') && pdfDoc) {
            (async () => {
                try {
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    // Render PDF page to canvas using helper (scale = zoom)
                    const { width, height } = await renderPage(pdfDoc, currentPage + 1, canvas, zoom);

                    // Save page size if not set
                    setPdfPages(prev => prev.map(p => p.pageNumber === currentPage + 1 ? { ...p, width, height } : p));

                    // Now draw overlays (annotations) on top of the rendered PDF
                    const ctx = canvas.getContext('2d');

                    // Draw annotations for current page
                    annotations
                        .filter(ann => ann.page === currentPage + 1)
                        .forEach(ann => {
                            const isHighlighted = highlightedField === ann.field_id || highlightedField === ann.id;
                            ctx.strokeStyle = isHighlighted ? '#10b981' : '#3b82f6';
                            ctx.fillStyle = isHighlighted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.12)';
                            ctx.lineWidth = isHighlighted ? 3 : 2;

                            // ann.bbox stored in PDF pixel coordinates (x1,y1,x2,y2)
                            const x = ann.bbox[0] * zoom;
                            const y = ann.bbox[1] * zoom;
                            const w = (ann.bbox[2] - ann.bbox[0]) * zoom;
                            const h = (ann.bbox[3] - ann.bbox[1]) * zoom;

                            ctx.fillRect(x, y, w, h);
                            ctx.strokeRect(x, y, w, h);

                            // label
                            ctx.fillStyle = isHighlighted ? '#065f46' : '#1e3a8a';
                            ctx.font = `bold ${12 * zoom}px Arial`;
                            ctx.fillText(ann.field_name || 'field', x + 4 * zoom, y + 12 * zoom);
                        });

                    // If user is drawing a new box, draw dashed outline
                    if (isDrawing && startPoint) {
                        // We don't have the current mouse coords here, so handleMouseMove draws ephemeral outline.
                        // This is kept to ensure background is rendered when drawing starts.
                    }
                } catch (err) {
                    console.error('Render error:', err);
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, zoom, annotations, highlightedField, mode, pdfDoc]);

    // --- Mouse handlers for mapping mode (drawing) ---
    const handleMouseDown = (e) => {
        if (mode !== 'mapping') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        setIsDrawing(true);
        setStartPoint({ x, y });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || mode !== 'mapping') return;
        const canvas = canvasRef.current;
        if (!canvas || !startPoint) return;
        const ctx = canvas.getContext('2d');
        // Re-render PDF page to clear previous temp drawings
        (async () => {
            if (pdfDoc) {
                await renderPage(pdfDoc, currentPage + 1, canvas, zoom);
            } else {
                // fallback: clear
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            // draw existing annotations overlay again
            annotations
                .filter(ann => ann.page === currentPage + 1)
                .forEach(ann => {
                    const isHighlighted = highlightedField === ann.field_id || highlightedField === ann.id;
                    ctx.strokeStyle = isHighlighted ? '#10b981' : '#3b82f6';
                    ctx.fillStyle = isHighlighted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.12)';
                    ctx.lineWidth = isHighlighted ? 3 : 2;

                    const x = ann.bbox[0] * zoom;
                    const y = ann.bbox[1] * zoom;
                    const w = (ann.bbox[2] - ann.bbox[0]) * zoom;
                    const h = (ann.bbox[3] - ann.bbox[1]) * zoom;

                    ctx.fillRect(x, y, w, h);
                    ctx.strokeRect(x, y, w, h);

                    ctx.fillStyle = isHighlighted ? '#065f46' : '#1e3a8a';
                    ctx.font = `bold ${12 * zoom}px Arial`;
                    ctx.fillText(ann.field_name || 'field', x + 4 * zoom, y + 12 * zoom);
                });

            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / zoom;
            const y = (e.clientY - rect.top) / zoom;

            ctx.strokeStyle = '#ef4444';
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 2;
            ctx.strokeRect(
                startPoint.x * zoom,
                startPoint.y * zoom,
                (x - startPoint.x) * zoom,
                (y - startPoint.y) * zoom
            );
            ctx.setLineDash([]);
        })();
    };

    const handleMouseUp = (e) => {
        if (!isDrawing || mode !== 'mapping') return;
        const canvas = canvasRef.current;
        if (!canvas || !startPoint) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;

        const bbox = [
            Math.min(startPoint.x, x),
            Math.min(startPoint.y, y),
            Math.max(startPoint.x, x),
            Math.max(startPoint.y, y)
        ];

        // require minimum pixel size
        if (bbox[2] - bbox[0] > 10 && bbox[3] - bbox[1] > 10) {
            // bbox currently in PDF canvas coordinates (pixels)
            setSelectedAnnotation({ bbox, page: currentPage + 1 });
        }

        setIsDrawing(false);
        setStartPoint(null);
    };

    // --- Save a single annotation locally (then user will call saveToDB to persist) ---
    const saveAnnotation = () => {
        if (!selectedAnnotation || !fieldMetadata.field_name) {
            alert('Please draw a box and fill in field details');
            return;
        }

        const newAnnotation = {
            // id: local unique id
            id: Date.now().toString(),
            // field_id should be assigned by backend ideally; use timestamp locally
            field_id: Date.now().toString(),
            process: processId,
            form_id: formId,
            field_name: fieldMetadata.field_name,
            field_header: fieldMetadata.field_header,
            bbox: selectedAnnotation.bbox, // in pixel coords relative to rendered page at scale=1 (we stored using current zoom)
            page: selectedAnnotation.page,
            scale: zoom,
            field_type: fieldMetadata.field_type,
            metadata: {
                required: fieldMetadata.required,
                max_length: fieldMetadata.max_length,
                placeholder: fieldMetadata.placeholder
            },
            // mark as not-yet-saved to backend
            _saved: false
        };

        setAnnotations(prev => [...prev, newAnnotation]);
        setSelectedAnnotation(null);
        setFieldMetadata({
            field_name: '',
            field_header: '',
            field_type: 'CharField',
            placeholder: '',
            required: false,
            max_length: 50
        });

        alert('Annotation saved locally. Click "Save All Annotations to Database" to persist.');
    };

    // --- Save all annotations to backend (uses saveAnnotations for new ones; updateAnnotation for saved ones) ---
    const saveToDB = async () => {
        if (annotations.length === 0) {
            alert('No annotations to save.');
            return;
        }

        try {
            // Split annotations into new and existing
            const newAnns = annotations.filter(a => !a._saved);
            const existingAnns = annotations.filter(a => a._saved);

            // For new annotations, call saveAnnotations in bulk (assumes backend supports bulk create/upsert)
            if (newAnns.length > 0) {
                const payload = newAnns.map(ann => ({
                    process: ann.process,
                    form_id: ann.form_id,
                    field_id: ann.field_id,
                    field_name: ann.field_name,
                    field_header: ann.field_header,
                    bbox: ann.bbox,
                    page: ann.page,
                    scale: ann.scale,
                    field_type: ann.field_type,
                    metadata: ann.metadata
                }));

                const res = await saveAnnotations(payload);
                console.log('Saved new annotations:', res);

                // Mark them as saved and attach any backend ids if returned.
                // If backend returns created objects, map them back. Here we'll assume success and mark saved.
                setAnnotations(prev => prev.map(a => ({ ...a, _saved: true })));
            }

            // For existing annotations, call updateAnnotation for each
            for (const ann of existingAnns) {
                // Build update payload - your API might expect a different shape
                const updatePayload = {
                    process: ann.process,
                    form_id: ann.form_id,
                    field_id: ann.field_id,
                    field_name: ann.field_name,
                    field_header: ann.field_header,
                    bbox: ann.bbox,
                    page: ann.page,
                    scale: ann.scale,
                    field_type: ann.field_type,
                    metadata: ann.metadata
                };
                try {
                    const updated = await apiUpdateAnnotation(ann.field_id, updatePayload);
                    console.log('Updated annotation', ann.field_id, updated);
                } catch (err) {
                    console.warn('Failed to update annotation', ann.field_id, err);
                }
            }

            alert(`Saved ${annotations.length} annotations to database!`);
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save annotations');
        }
    };

    // --- Load annotations from backend and map to local coordinate system ---
    const loadFromDB = async () => {
        try {
            const res = await fetchAnnotations(processId, formId);
            console.log('Fetched annotations:', res);

            if (res && res.length > 0) {
                // Map backend annotations to local representation.
                // We assume backend bbox are same coordinate system as PDF pixels when created,
                // so we keep them as-is. If backend stores normalized coords, scale appropriately.
                const mapped = res.map(ann => ({
                    ...ann,
                    id: ann.field_id,
                    _saved: true
                }));

                setAnnotations(mapped);

                // Build form fields list for executive view
                const fields = res.map(ann => ({
                    id: ann.field_id,
                    name: ann.field_name,
                    header: ann.field_header,
                    type: ann.field_type,
                    placeholder: ann.metadata?.placeholder || '',
                    required: ann.metadata?.required || false,
                    value: '',
                    annotation: {
                        bbox: { x1: ann.bbox[0], y1: ann.bbox[1], x2: ann.bbox[2], y2: ann.bbox[3] },
                        page: ann.page
                    }
                }));

                setFormFields(fields);
            } else {
                setAnnotations([]);
                setFormFields([]);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            alert('Failed to fetch annotations');
        }
    };

    // --- Handle clicking a field in executive mode: highlight and move to page ---
    const handleFieldClick = (field) => {
        setHighlightedField(field.id);
        setCurrentPage(field.annotation.page - 1);

        // Smooth scroll to canvas
        setTimeout(() => {
            canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    // --- Delete annotation handler (calls backend delete API if saved) ---
    const handleDeleteAnnotation = async (localId) => {
        try {
            const ann = annotations.find(a => a.id === localId || a.field_id === localId);
            if (!ann) return;

            if (ann._saved) {
                await apiDeleteAnnotation(ann.field_id);
            }

            setAnnotations(prev => prev.filter(a => a.id !== localId && a.field_id !== localId));
            alert('Annotation deleted successfully');
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete annotation');
        }
    };

    // --- Edit annotation metadata inline and call updateAnnotation if saved ---
    const handleEditAnnotation = async (localId) => {
        const ann = annotations.find(a => a.id === localId || a.field_id === localId);
        if (!ann) return;

        // Simple inline prompt for demo; swap with a modal/form for production
        const newName = window.prompt('Edit field name', ann.field_name || '');
        if (newName === null) return; // cancelled

        const updatedLocal = { ...ann, field_name: newName };
        setAnnotations(prev => prev.map(a => (a.id === localId || a.field_id === localId ? updatedLocal : a)));

        if (ann._saved) {
            try {
                const payload = {
                    process: updatedLocal.process,
                    form_id: updatedLocal.form_id,
                    field_id: updatedLocal.field_id,
                    field_name: updatedLocal.field_name,
                    field_header: updatedLocal.field_header,
                    bbox: updatedLocal.bbox,
                    page: updatedLocal.page,
                    scale: updatedLocal.scale,
                    field_type: updatedLocal.field_type,
                    metadata: updatedLocal.metadata
                };
                await apiUpdateAnnotation(updatedLocal.field_id, payload);
                alert('Annotation updated on server');
            } catch (err) {
                console.error('Update error:', err);
                alert('Failed to update annotation on server');
            }
        } else {
            alert('Annotation updated locally. Save to DB to persist.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF Field Mapping & Annotation System</h1>
                    <p className="text-gray-600">Upload PDF, map fields with bounding boxes, and manage annotations</p>

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setMode('upload')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            <Upload className="inline mr-2" size={18} />
                            Upload PDF
                        </button>

                        <button
                            onClick={() => { setMode('mapping'); loadFromDB(); }}
                            disabled={!pdfFile}
                            className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'mapping' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Edit2 className="inline mr-2" size={18} />
                            Mapping Mode
                        </button>

                        <button
                            onClick={() => { setMode('executive'); loadFromDB(); }}
                            disabled={!pdfFile}
                            className={`px-4 py-2 rounded-lg font-medium transition ${mode === 'executive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <Eye className="inline mr-2" size={18} />
                            Executive View
                        </button>
                    </div>
                </div>

                {/* Upload Mode */}
                {mode === 'upload' && (
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition">
                            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                            <h3 className="text-xl font-semibold mb-2">Upload PDF Document</h3>
                            <p className="text-gray-600 mb-4">Select a PDF file to start mapping fields</p>
                            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileUpload} className="hidden" />
                            <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
                                Choose PDF File
                            </button>
                            {pdfFile && (
                                <p className="mt-4 text-sm text-green-600 font-medium">✓ {pdfFile.name} loaded</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Mapping Mode */}
                {mode === 'mapping' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* PDF Canvas */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold">PDF Page {currentPage + 1} of {pdfPages.length}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 bg-gray-200 rounded hover:bg-gray-300"><ZoomOut size={20} /></button>
                                    <span className="px-3 py-2 bg-gray-100 rounded font-medium">{Math.round(zoom * 100)}%</span>
                                    <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 bg-gray-200 rounded hover:bg-gray-300"><ZoomIn size={20} /></button>
                                </div>
                            </div>

                            <div className="border-2 border-gray-300 rounded-lg overflow-auto max-h-[600px] bg-gray-50">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    className="cursor-crosshair w-full"
                                />
                            </div>

                            <div className="flex justify-between mt-4">
                                <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Previous Page</button>
                                <button onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))} disabled={currentPage === pdfPages.length - 1} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Next Page</button>
                            </div>

                            <button onClick={saveToDB} className="w-full mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">
                                <Save className="inline mr-2" size={20} />
                                Save All Annotations to Database
                            </button>
                        </div>

                        {/* Field Metadata / Annotations List */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">Field Configuration</h3>

                            {selectedAnnotation && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                                    <p className="text-sm text-green-800">✓ Box drawn on page {selectedAnnotation.page}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Field Name *</label>
                                    <input type="text" value={fieldMetadata.field_name} onChange={(e) => setFieldMetadata({ ...fieldMetadata, field_name: e.target.value })} placeholder="e.g., Application_Date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Field Header</label>
                                    <input type="text" value={fieldMetadata.field_header} onChange={(e) => setFieldMetadata({ ...fieldMetadata, field_header: e.target.value })} placeholder="e.g., Account Details" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Field Type</label>
                                    <select value={fieldMetadata.field_type} onChange={(e) => setFieldMetadata({ ...fieldMetadata, field_type: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                        {fieldTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Placeholder</label>
                                    <input type="text" value={fieldMetadata.placeholder} onChange={(e) => setFieldMetadata({ ...fieldMetadata, placeholder: e.target.value })} placeholder="e.g., Enter date" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Length</label>
                                    <input type="number" value={fieldMetadata.max_length} onChange={(e) => setFieldMetadata({ ...fieldMetadata, max_length: parseInt(e.target.value || '0') })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div className="flex items-center">
                                    <input type="checkbox" checked={fieldMetadata.required} onChange={(e) => setFieldMetadata({ ...fieldMetadata, required: e.target.checked })} className="mr-2" />
                                    <label className="text-sm font-medium">Required Field</label>
                                </div>

                                <button onClick={saveAnnotation} disabled={!selectedAnnotation || !fieldMetadata.field_name} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                    <CheckSquare className="inline mr-2" size={18} />
                                    Save Field Annotation
                                </button>
                            </div>

                            {/* Annotations List */}
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2">Saved Annotations ({annotations.length})</h4>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {annotations.map(ann => (
                                        <div key={ann.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{ann.field_name}</p>
                                                <p className="text-xs text-gray-600">Page {ann.page} • {ann.field_type}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleEditAnnotation(ann.id)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteAnnotation(ann.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Executive Mode */}
                {mode === 'executive' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Form Fields */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h3 className="text-xl font-semibold mb-4">Form Fields</h3>
                            <p className="text-sm text-gray-600 mb-4">Click any field to highlight its location on the PDF</p>

                            <div className="space-y-4 max-h-[700px] overflow-y-auto">
                                {formFields.map(field => (
                                    <div key={field.id} onClick={() => handleFieldClick(field)} className={`p-4 border-2 rounded-lg cursor-pointer transition ${highlightedField === field.id ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <label className="font-medium text-gray-700">{field.header || field.name}</label>
                                            {field.required && <span className="text-red-500 text-sm">*</span>}
                                        </div>

                                        {field.type === 'DateField' && (<input type="date" placeholder={field.placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />)}
                                        {field.type === 'NumberField' && (<input type="number" placeholder={field.placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />)}
                                        {field.type === 'EmailField' && (<input type="email" placeholder={field.placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />)}
                                        {field.type === 'TextAreaField' && (<textarea placeholder={field.placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} />)}
                                        {field.type === 'BooleanField' && (<div className="flex items-center"><input type="checkbox" className="mr-2" /><span className="text-sm">{field.placeholder}</span></div>)}
                                        {field.type === 'CharField' && (<input type="text" placeholder={field.placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />)}

                                        <p className="text-xs text-gray-500 mt-2">Page {field.annotation.page} • {field.type}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* PDF Preview */}
                        <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
                            <h3 className="text-xl font-semibold mb-4">PDF Preview</h3>

                            <div className="border-2 border-gray-300 rounded-lg overflow-auto max-h-[700px] bg-gray-50">
                                <canvas ref={canvasRef} className="w-full" />
                            </div>

                            <div className="flex justify-between mt-4">
                                <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Previous</button>
                                <span className="px-4 py-2 font-medium">Page {currentPage + 1} / {pdfPages.length}</span>
                                <button onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))} disabled={currentPage === pdfPages.length - 1} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFAnnotationSystem;
