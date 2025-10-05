// components/pdf-annotation/hooks/usePDFAnnotation.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadPDF, saveAnnotations, fetchAnnotations, updateAnnotation as apiUpdateAnnotation, deleteAnnotation as apiDeleteAnnotation } from '../helpers/api';
import { loadPDF, renderPage } from '../helpers/pdfRenderer';

const usePDFAnnotation = () => {
    const [mode, setMode] = useState('upload');
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pdfPages, setPdfPages] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [annotations, setAnnotations] = useState([]);
    const [selectedAnnotation, setSelectedAnnotation] = useState(null);
    const [formFields, setFormFields] = useState([]);
    const [highlightedField, setHighlightedField] = useState(null);
    const [editModal, setEditModal] = useState({
        isOpen: false,
        annotation: null
    });

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const [processId] = useState(49);
    const [formId] = useState(20);

    const [dialog, setDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    const fieldTypes = ['CharField', 'DateField', 'NumberField', 'EmailField', 'TextAreaField', 'BooleanField'];

    const [fieldMetadata, setFieldMetadata] = useState({
        field_name: '',
        field_header: '',
        field_type: 'CharField',
        placeholder: '',
        required: false,
        max_length: 50
    });

    const showDialog = useCallback((title, message, type = 'info') => {
        setDialog({
            isOpen: true,
            title,
            message,
            type
        });
    }, []);

    const closeDialog = useCallback(() => {
        setDialog(prev => ({ ...prev, isOpen: false }));
    }, []);

    // --- File upload & PDF loading ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            showDialog('Invalid File', 'Please upload a valid PDF file', 'error');
            return;
        }

        try {
            const res = await uploadPDF(file, processId, formId);
            console.log('Uploaded PDF:', res);

            setPdfFile(file);

            const pdf = await loadPDF(file);
            setPdfDoc(pdf);

            const pages = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                pages.push({ pageNumber: i, width: null, height: null });
            }
            setPdfPages(pages);

            setMode('mapping');
            setCurrentPage(0);
        } catch (err) {
            console.error('Upload error:', err);
            showDialog('Upload Failed', 'Failed to upload or load PDF. Please try again.', 'error');
        }
    };

    // Render PDF page + overlays
    useEffect(() => {
        if ((mode === 'mapping' || mode === 'executive') && pdfDoc) {
            (async () => {
                try {
                    const canvas = canvasRef.current;
                    if (!canvas) return;

                    const { width, height } = await renderPage(pdfDoc, currentPage + 1, canvas, zoom);
                    setPdfPages(prev => prev.map(p => p.pageNumber === currentPage + 1 ? { ...p, width, height } : p));

                    const ctx = canvas.getContext('2d');

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
                } catch (err) {
                    console.error('Render error:', err);
                    showDialog('Render Error', 'Failed to render PDF page. Please try again.', 'error');
                }
            })();
        }
    }, [currentPage, zoom, annotations, highlightedField, mode, pdfDoc, showDialog]);

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

        (async () => {
            if (pdfDoc) {
                await renderPage(pdfDoc, currentPage + 1, canvas, zoom);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

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

        if (bbox[2] - bbox[0] > 10 && bbox[3] - bbox[1] > 10) {
            setSelectedAnnotation({ bbox, page: currentPage + 1 });
        }

        setIsDrawing(false);
        setStartPoint(null);
    };

    // --- Save a single annotation locally ---
    const saveAnnotation = () => {
        if (!selectedAnnotation || !fieldMetadata.field_name) {
            showDialog('Missing Information', 'Please draw a box and fill in field details', 'error');
            return;
        }

        const newAnnotation = {
            id: Date.now().toString(),
            field_id: Date.now().toString(),
            process: processId,
            form_id: formId,
            field_name: fieldMetadata.field_name,
            field_header: fieldMetadata.field_header,
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

        showDialog('Annotation Saved', 'Annotation saved locally. Click "Save All Annotations to Database" to persist.', 'success');
    };

    // --- Save all annotations to backend ---
    const saveToDB = async () => {
        if (annotations.length === 0) {
            showDialog('No Annotations', 'No annotations to save.', 'error');
            return;
        }

        try {
            const newAnns = annotations.filter(a => !a._saved);
            const existingAnns = annotations.filter(a => a._saved);

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
                setAnnotations(prev => prev.map(a => ({ ...a, _saved: true })));
            }

            for (const ann of existingAnns) {
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

            showDialog('Success', `Saved ${annotations.length} annotations to database!`, 'success');
        } catch (err) {
            console.error('Save error:', err);
            showDialog('Save Failed', 'Failed to save annotations. Please check your connection and try again.', 'error');
        }
    };

    // --- Load annotations from backend ---
    const loadFromDB = async () => {
        try {
            console.log('Fetching annotations for process:', processId, 'form:', formId);
            const res = await fetchAnnotations(processId, formId);
            console.log('Fetched annotations:', res);

            if (!res) {
                throw new Error('No response from server');
            }

            if (!Array.isArray(res)) {
                throw new Error('Invalid response format: expected an array');
            }

            if (res.length > 0) {
                const mapped = res.map(ann => {
                    const bbox = ann.annotation && ann.annotation.bbox ?
                        [ann.annotation.bbox.x1, ann.annotation.bbox.y1, ann.annotation.bbox.x2, ann.annotation.bbox.y2] :
                        [0, 0, 0, 0];

                    return {
                        id: ann.id || ann.field_id,
                        field_id: ann.field_id || ann.id,
                        field_name: ann.field_name,
                        field_header: ann.field_header,
                        bbox: bbox,
                        page: ann.annotation ? ann.annotation.page : 1,
                        field_type: ann.field_type,
                        metadata: {
                            required: ann.required || false,
                            max_length: ann.max_length || 50,
                            placeholder: ann.placeholder || ''
                        },
                        process: parseInt(ann.process_id) || processId,
                        form_id: parseInt(ann.form_id) || formId,
                        scale: 1,
                        _saved: true
                    };
                });

                setAnnotations(mapped);

                const fields = res.map(ann => ({
                    id: ann.id || ann.field_id,
                    name: ann.field_name,
                    header: ann.field_header,
                    type: ann.field_type,
                    placeholder: ann.placeholder || '',
                    required: ann.required || false,
                    value: '',
                    annotation: {
                        bbox: ann.annotation ? ann.annotation.bbox : { x1: 0, y1: 0, x2: 0, y2: 0 },
                        page: ann.annotation ? ann.annotation.page : 1
                    }
                }));

                setFormFields(fields);
            } else {
                setAnnotations([]);
                setFormFields([]);
                console.log('No annotations found for this form');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setAnnotations([]);
            setFormFields([]);
            showDialog('Fetch Failed', `Failed to fetch annotations: ${err.message || 'Unknown error'}. Please check your connection and try again.`, 'error');
        }
    };

    // --- Handle clicking a field in executive mode ---
    const handleFieldClick = (field) => {
        setHighlightedField(field.id);
        setCurrentPage(field.annotation.page - 1);

        setTimeout(() => {
            canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    // --- Delete annotation handler ---
    const handleDeleteAnnotation = async (localId) => {
        try {
            const ann = annotations.find(a => a.id === localId || a.field_id === localId);
            if (!ann) return;

            if (ann._saved) {
                await apiDeleteAnnotation(ann.field_id);
            }

            setAnnotations(prev => prev.filter(a => a.id !== localId && a.field_id !== localId));
            showDialog('Success', 'Annotation deleted successfully', 'success');
        } catch (err) {
            console.error('Delete error:', err);
            showDialog('Delete Failed', 'Failed to delete annotation. Please try again.', 'error');
        }
    };

    // --- Edit annotation metadata ---
    // Replace the handleEditAnnotation function with:
    const handleEditAnnotation = (localId) => {
        const ann = annotations.find(a => a.id === localId || a.field_id === localId);
        if (!ann) return;

        setEditModal({
            isOpen: true,
            annotation: ann
        });
    };

    // Add this new function to handle the save from modal:
    const handleSaveEditedAnnotation = async (updatedData) => {
        const ann = editModal.annotation;
        if (!ann) return;

        const updatedLocal = {
            ...ann,
            field_name: updatedData.field_name,
            field_header: updatedData.field_header
        };

        setAnnotations(prev => prev.map(a =>
            (a.id === ann.id || a.field_id === ann.field_id ? updatedLocal : a)
        ));

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
                showDialog('Success', 'Annotation updated on server', 'success');
            } catch (err) {
                console.error('Update error:', err);
                showDialog('Update Failed', 'Failed to update annotation on server. Please try again.', 'error');
            }
        } else {
            showDialog('Local Update', 'Annotation updated locally. Save to DB to persist.', 'info');
        }
    };

    return {
        mode,
        setMode,
        pdfFile,
        pdfDoc,
        pdfPages,
        currentPage,
        setCurrentPage,
        zoom,
        setZoom,
        isDrawing,
        setIsDrawing,
        startPoint,
        setStartPoint,
        annotations,
        selectedAnnotation,
        setSelectedAnnotation,
        formFields,
        highlightedField,
        canvasRef,
        fileInputRef,
        processId,
        formId,
        dialog,
        fieldTypes,
        fieldMetadata,
        setFieldMetadata,
        showDialog,
        closeDialog,
        handleFileUpload,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        saveAnnotation,
        saveToDB,
        loadFromDB,
        handleFieldClick,
        handleDeleteAnnotation,
        handleEditAnnotation,
        editModal,
        setEditModal,
        handleSaveEditedAnnotation
    };
};

export default usePDFAnnotation;