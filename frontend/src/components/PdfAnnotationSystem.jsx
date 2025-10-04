// components/pdf-annotation/PDFAnnotationSystem.jsx
import { motion, AnimatePresence } from 'framer-motion';
import usePDFAnnotation from '../hooks/usePDFAnnotation';
import Header from './Header';
import UploadMode from './UploadMode';
import MappingMode from './MappingMode';
import ExecutiveMode from './ExecutiveMode';
import Dialog from './Dialog';

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
    processId,
    formId,
    dialog,
    showDialog,
    closeDialog,
    fieldMetadata,
    setFieldMetadata,
    selectedAnnotation,
    setSelectedAnnotation,
    isDrawing,
    setIsDrawing,
    startPoint,
    setStartPoint,
    handleFileUpload,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    saveAnnotation,
    saveToDB,
    loadFromDB,
    handleFieldClick,
    handleDeleteAnnotation,
    handleEditAnnotation
  } = usePDFAnnotation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <Header 
          mode={mode} 
          setMode={setMode} 
          pdfFile={pdfFile} 
          loadFromDB={loadFromDB} 
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'upload' && (
              <UploadMode 
                handleFileUpload={handleFileUpload} 
                fileInputRef={fileInputRef} 
                pdfFile={pdfFile} 
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
      </div>
    </div>
  );
};

export default PDFAnnotationSystem;