import { useState, useRef, useEffect, useCallback } from 'react';
import {
  uploadPDF,
  saveAnnotations,
  fetchAnnotations as apiFetchAnnotations,
  updateAnnotation as apiUpdateAnnotation,
  deleteAnnotation as apiDeleteAnnotation,
  createDocument,
  getAllDocuments,
  getDocumentWithAnnotations,
  deleteDocument as apiDeleteDocument
} from '../helpers/api';
import { loadPDF, renderPage } from '../helpers/pdfRenderer';

const usePDFAnnotation = () => {
  const [mode, setMode] = useState('documents');
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

  // Document management states
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    documentId: null
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formId, setFormId] = useState(null);

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

  // Fetch all documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    try {
      const docs = await getAllDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
      showDialog('Error', 'Failed to load documents', 'error');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showDialog('Invalid File', 'Please upload a valid PDF file', 'error');
      return;
    }

    try {
      const newFormId = Date.now();
      const uploadRes = await uploadPDF(file, newFormId);

      const pdf = await loadPDF(file);
      setPdfDoc(pdf);

      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pages.push({ pageNumber: i, width: null, height: null });
      }
      setPdfPages(pages);

      const documentData = {
        form_id: newFormId,
        file_url: uploadRes.file_url,
        file_id: uploadRes.file_id,
        file_name: file.name,
        file_size: file.size,
        total_pages: pdf.numPages
      };

      const docRes = await createDocument(documentData);
      setCurrentDocument(docRes.data);
      setFormId(newFormId);
      setPdfFile(file);

      setAnnotations([]);
      setFormFields([]);

      setMode('mapping');
      setCurrentPage(0);

      await loadDocuments();
      showDialog('Success', 'PDF uploaded successfully', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showDialog('Upload Failed', 'Failed to upload or load PDF. Please try again.', 'error');
    }
  };

  // Load annotations from backend
  const fetchAnnotations = async () => {
    if (!formId) return;

    try {
      const fetchedAnnotations = await apiFetchAnnotations(formId);

      const mapped = fetchedAnnotations.map(ann => ({
        id: ann.id || ann.field_id,
        field_id: ann.field_id || ann.id,
        field_name: ann.field_name,
        field_header: ann.field_header,
        bbox: ann.annotation?.bbox ?
          [ann.annotation.bbox.x1, ann.annotation.bbox.y1, ann.annotation.bbox.x2, ann.annotation.bbox.y2] :
          [0, 0, 0, 0],
        page: ann.annotation?.page || 1,
        field_type: ann.field_type,
        metadata: {
          required: ann.required || false,
          max_length: ann.max_length || 50,
          placeholder: ann.placeholder || ''
        },
        form_id: parseInt(ann.form_id) || formId,
        scale: 1,
        _saved: true
      }));

      setAnnotations(mapped);

      // Update form fields for executive mode
      const fields = mapped.map(ann => ({
        id: ann.id,
        name: ann.field_name,
        header: ann.field_header,
        type: ann.field_type,
        placeholder: ann.metadata.placeholder || '',
        required: ann.metadata.required || false,
        value: '',
        annotation: {
          bbox: {
            x1: ann.bbox[0],
            y1: ann.bbox[1],
            x2: ann.bbox[2],
            y2: ann.bbox[3]
          },
          page: ann.page
        }
      }));

      setFormFields(fields);
    } catch (err) {
      console.error('Error fetching annotations:', err);
      showDialog('Fetch Error', 'Failed to fetch annotations', 'error');
    }
  };

  // Load a specific document
  const handleSelectDocument = async (document) => {
    try {
      setIsLoadingDocuments(true);

      const { document: doc, annotations: annots } = await getDocumentWithAnnotations(document._id);

      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const file = new File([blob], doc.file_name, { type: 'application/pdf' });

      const pdf = await loadPDF(file);
      setPdfDoc(pdf);

      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pages.push({ pageNumber: i, width: null, height: null });
      }
      setPdfPages(pages);

      setCurrentDocument(doc);
      setPdfFile(file);
      setFormId(doc.form_id);

      const mapped = annots.map(ann => ({
        id: ann._id,
        field_id: ann.field_id,
        field_name: ann.field_name,
        field_header: ann.field_header,
        bbox: ann.bbox,
        page: ann.page,
        field_type: ann.field_type,
        metadata: ann.metadata,
        form_id: ann.form_id,
        scale: ann.scale || 1,
        _saved: true
      }));

      setAnnotations(mapped);

      const fields = mapped.map(ann => ({
        id: ann.id,
        name: ann.field_name,
        header: ann.field_header,
        type: ann.field_type,
        placeholder: ann.metadata.placeholder || '',
        required: ann.metadata.required || false,
        value: '',
        annotation: {
          bbox: {
            x1: ann.bbox[0],
            y1: ann.bbox[1],
            x2: ann.bbox[2],
            y2: ann.bbox[3]
          },
          page: ann.page
        }
      }));

      setFormFields(fields);
      setMode('executive');
      setCurrentPage(0);

      showDialog('Success', 'Document loaded successfully', 'success');
    } catch (err) {
      console.error('Error loading document:', err);
      showDialog('Error', 'Failed to load document', 'error');
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Delete document with confirmation dialog
  const handleDeleteDocument = (documentId) => {
    setDeleteConfirmDialog({
      isOpen: true,
      documentId
    });
  };

  const confirmDeleteDocument = async () => {
    const documentId = deleteConfirmDialog.documentId;
    setDeleteConfirmDialog({ isOpen: false, documentId: null });

    try {
      await apiDeleteDocument(documentId);
      showDialog('Success', 'Document deleted successfully', 'success');
      await loadDocuments();

      if (currentDocument && currentDocument._id === documentId) {
        setCurrentDocument(null);
        setPdfFile(null);
        setPdfDoc(null);
        setAnnotations([]);
        setFormFields([]);
        setMode('documents');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      showDialog('Error', 'Failed to delete document', 'error');
    }
  };

  const cancelDeleteDocument = () => {
    setDeleteConfirmDialog({ isOpen: false, documentId: null });
  };

  // Render PDF page + overlays - FIX: Force initial render
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

  // Mouse handlers
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

  // Save annotation
  const saveAnnotation = () => {
    if (!selectedAnnotation || !fieldMetadata.field_name) {
      showDialog('Missing Information', 'Please draw a box and fill in field details', 'error');
      return;
    }

    const newAnnotation = {
      id: Date.now().toString(),
      field_id: Date.now().toString(),
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

  // Save to DB
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

        await saveAnnotations(payload);
        setAnnotations(prev => prev.map(a => ({ ...a, _saved: true })));
      }

      for (const ann of existingAnns) {
        const updatePayload = {
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
          await apiUpdateAnnotation(ann.field_id, updatePayload);
        } catch (err) {
          console.warn('Failed to update annotation', ann.field_id, err);
        }
      }

      // Refresh annotations after save
      await fetchAnnotations();

      showDialog('Success', `Saved ${annotations.length} annotations to database!`, 'success');
    } catch (err) {
      console.error('Save error:', err);
      showDialog('Save Failed', 'Failed to save annotations. Please check your connection and try again.', 'error');
    }
  };

  // Field click
  const handleFieldClick = (field) => {
    setHighlightedField(field.id);
    setCurrentPage(field.annotation.page - 1);

    setTimeout(() => {
      canvasRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  // Delete annotation
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

  // Edit annotation
  const handleEditAnnotation = (localId) => {
    const ann = annotations.find(a => a.id === localId || a.field_id === localId);
    if (!ann) return;

    setEditModal({
      isOpen: true,
      annotation: ann
    });
  };

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
    annotations,
    selectedAnnotation,
    formFields,
    highlightedField,
    canvasRef,
    fileInputRef,
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
    fetchAnnotations,
    handleFieldClick,
    handleDeleteAnnotation,
    handleEditAnnotation,
    editModal,
    setEditModal,
    handleSaveEditedAnnotation,
    documents,
    currentDocument,
    isLoadingDocuments,
    loadDocuments,
    handleSelectDocument,
    handleDeleteDocument,
    deleteConfirmDialog,
    confirmDeleteDocument,
    cancelDeleteDocument
  };
};

export default usePDFAnnotation;