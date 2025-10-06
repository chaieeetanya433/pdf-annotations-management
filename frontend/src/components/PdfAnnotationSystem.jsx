// components/pdf-annotation/PDFAnnotationSystem.jsx
import { motion, AnimatePresence } from 'framer-motion';
import usePDFAnnotation from '../hooks/usePDFAnnotation';
import Header from './Header';
import MappingMode from './MappingMode';
import ExecutiveMode from './ExecutiveMode';
import Dialog from './Dialog';
import EditAnnotationModal from './EditAnnotationModal';
import DocumentsMode from './DocumentMode';
import ConfirmDialog from './ConfirmDialog';

const PDFAnnotationSystem = () => {
  const {
    mode,
    setMode,
    pdfFile,
    pdfDoc,
    pdfPages,
    currentPage,
    setCurrentPage,
    zoom,
    setZoom,
    annotations,
    formFields,
    highlightedField,
    canvasRef,
    fileInputRef,
    formId,
    dialog,
    showDialog,
    closeDialog,
    fieldMetadata,
    setFieldMetadata,
    selectedAnnotation,
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
    isLoadingDocuments,
    handleDeleteDocument,
    handleSelectDocument,
    currentDocument,
    deleteConfirmDialog,
    confirmDeleteDocument,
    cancelDeleteDocument,
    loadDocuments
  } = usePDFAnnotation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          mode={mode}
          setMode={setMode}
          currentDocument={currentDocument}
          fetchAnnotations={fetchAnnotations}
          loadDocuments={loadDocuments}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'documents' && (
              <DocumentsMode
                documents={documents}
                isLoadingDocuments={isLoadingDocuments}
                handleSelectDocument={handleSelectDocument}
                handleDeleteDocument={handleDeleteDocument}
                setMode={setMode}
                fileInputRef={fileInputRef}
                handleFileUpload={handleFileUpload}
              />
            )}

            {mode === 'mapping' && (
              <MappingMode
                pdfDoc={pdfDoc}
                pdfPages={pdfPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                zoom={zoom}
                setZoom={setZoom}
                annotations={annotations}
                highlightedField={highlightedField}
                canvasRef={canvasRef}
                handleMouseDown={handleMouseDown}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                saveToDB={saveToDB}
                fieldMetadata={fieldMetadata}
                setFieldMetadata={setFieldMetadata}
                selectedAnnotation={selectedAnnotation}
                saveAnnotation={saveAnnotation}
                handleEditAnnotation={handleEditAnnotation}
                handleDeleteAnnotation={handleDeleteAnnotation}
              />
            )}

            {mode === 'executive' && (
              <ExecutiveMode
                formFields={formFields}
                highlightedField={highlightedField}
                handleFieldClick={handleFieldClick}
                pdfDoc={pdfDoc}
                pdfPages={pdfPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                canvasRef={canvasRef}
                setMode={setMode}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <Dialog
          isOpen={dialog.isOpen}
          onClose={closeDialog}
          title={dialog.title}
          type={dialog.type}
        >
          <p>{dialog.message}</p>
        </Dialog>

        <EditAnnotationModal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, annotation: null })}
          annotation={editModal.annotation}
          onSave={handleSaveEditedAnnotation}
        />

        <ConfirmDialog
          isOpen={deleteConfirmDialog.isOpen}
          onConfirm={confirmDeleteDocument}
          onCancel={cancelDeleteDocument}
          title="Delete Document"
          message="Are you sure you want to delete this document? This action cannot be undone and will remove all associated annotations."
        />
      </div>
    </div>
  );
};

export default PDFAnnotationSystem;