import React from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import FieldConfigForm from './FieldConfigForm';
import AnnotationsList from './AnnotationsList';

const MappingMode = ({
    pdfDoc,
    pdfPages,
    currentPage,
    setCurrentPage,
    zoom,
    setZoom,
    annotations,
    highlightedField,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    saveToDB,
    fieldMetadata,
    setFieldMetadata,
    selectedAnnotation,
    saveAnnotation,
    handleEditAnnotation,
    handleDeleteAnnotation
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Canvas */}
            <motion.div
                className="lg:col-span-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>PDF Page {currentPage + 1} of {pdfPages.length}</CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                                >
                                    <ZoomOut size={20} />
                                </Button>
                                <span className="px-3 py-2 bg-gray-100 rounded font-medium">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                                >
                                    <ZoomIn size={20} />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className={`${currentPage === 0 ? '' : 'cursor-pointer'}`}
                            >
                                Previous Page
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))}
                                disabled={currentPage === pdfPages.length - 1}
                                className={`${currentPage === pdfPages.length - 1 ? '' : 'cursor-pointer'}`}
                            >
                                Next Page
                            </Button>
                        </div>

                        <Button
                            onClick={saveToDB}
                            className="w-full mt-4 bg-green-600 hover:bg-green-700 cursor-pointer"
                        >
                            <Save className="inline mr-2" size={20} />
                            Save All Annotations to Database
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Field Metadata / Annotations List */}
            <motion.div
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <FieldConfigForm
                    fieldMetadata={fieldMetadata}
                    setFieldMetadata={setFieldMetadata}
                    selectedAnnotation={selectedAnnotation}
                    saveAnnotation={saveAnnotation}
                />

                <AnnotationsList
                    annotations={annotations}
                    handleEditAnnotation={handleEditAnnotation}
                    handleDeleteAnnotation={handleDeleteAnnotation}
                />
            </motion.div>
        </div>
    );
};

export default MappingMode;