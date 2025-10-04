// components/pdf-annotation/components/ExecutiveMode.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';

const ExecutiveMode = ({
    formFields,
    highlightedField,
    handleFieldClick,
    pdfDoc,
    pdfPages,
    currentPage,
    setCurrentPage,
    canvasRef,
    setMode
}) => {
    const renderFieldInput = (field) => {
        const commonProps = {
            placeholder: field.placeholder,
            className: "w-full"
        };

        switch (field.type) {
            case 'DateField':
                return <Input type="date" disabled {...commonProps} />;
            case 'NumberField':
                return <Input type="number" disabled {...commonProps} />;
            case 'EmailField':
                return <Input type="email" disabled {...commonProps} />;
            case 'TextAreaField':
                return <Textarea {...commonProps} disabled rows={3} />;
            case 'BooleanField':
                return (
                    <div className="flex items-center">
                        <Checkbox id={`field-${field.id}`} className="mr-2" />
                        <Label htmlFor={`field-${field.id}`}>{field.placeholder}</Label>
                    </div>
                );
            case 'CharField':
            default:
                return <Input type="text" disabled {...commonProps} />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Fields */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle>Form Fields</CardTitle>
                        <p className="text-sm text-gray-600">Click any field to highlight its location on the PDF</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[700px] overflow-y-auto">
                            <AnimatePresence>
                                {formFields.length > 0 ? (
                                    formFields.map(field => (
                                        <motion.div
                                            key={field.id}
                                            onClick={() => handleFieldClick(field)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition ${highlightedField === field.id
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                                }`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Label className="font-medium text-gray-700">
                                                    {field.header || field.name}
                                                </Label>
                                                {field.required && (
                                                    <span className="text-red-500 text-sm">*</span>
                                                )}
                                            </div>
                                            {renderFieldInput(field)}
                                            <p className="text-xs text-gray-500 mt-2">
                                                Page {field.annotation.page} • {field.type}
                                            </p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        className="text-center py-8"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <p className="text-gray-500">No form fields found. Please go to Mapping Mode to create annotations.</p>
                                        <Button
                                            onClick={() => setMode('mapping')}
                                            className="mt-4"
                                        >
                                            Go to Mapping Mode
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* PDF Preview */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <Card className="sticky top-6">
                    <CardHeader>
                        <CardTitle>PDF Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border-2 border-gray-300 rounded-lg overflow-auto max-h-[700px] bg-gray-50">
                            <canvas ref={canvasRef} className="w-full" />
                        </div>

                        <div className="flex justify-between mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                            >
                                Previous
                            </Button>
                            <span className="px-4 py-2 font-medium">
                                Page {currentPage + 1} / {pdfPages.length}
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(Math.min(pdfPages.length - 1, currentPage + 1))}
                                disabled={currentPage === pdfPages.length - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default ExecutiveMode;