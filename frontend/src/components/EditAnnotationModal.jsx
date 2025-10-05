import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit } from 'lucide-react';
import { Button } from './ui/button';

const EditAnnotationModal = ({ isOpen, onClose, annotation, onSave }) => {
    const [fieldName, setFieldName] = useState('');
    const [fieldHeader, setFieldHeader] = useState('');

    useEffect(() => {
        if (annotation) {
            setFieldName(annotation.field_name || '');
            setFieldHeader(annotation.field_header || '');
        }
    }, [annotation]);

    const handleSave = () => {
        if (!fieldName.trim()) {
            return;
        }
        onSave({
            field_name: fieldName,
            field_header: fieldHeader
        });
        onClose();
    };

    const handleCancel = () => {
        setFieldName(annotation?.field_name || '');
        setFieldHeader(annotation?.field_header || '');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Dialog Content */}
                    <motion.div
                        className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
                                   rounded-lg shadow-xl max-w-md w-full z-10"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <Edit className="text-blue-500" size={24} />
                                <h3 className="text-lg font-semibold">Edit Annotation</h3>
                            </div>
                            <Button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Update the field name and header for this annotation.
                            </p>

                            {/* Field Name Input */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="field-name"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Field Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="field-name"
                                    type="text"
                                    value={fieldName}
                                    onChange={(e) => setFieldName(e.target.value)}
                                    placeholder="Enter field name"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-800 
                                             text-gray-900 dark:text-gray-100
                                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             transition-colors"
                                    autoFocus
                                />
                            </div>

                            {/* Field Header Input */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="field-header"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Field Header
                                </label>
                                <input
                                    id="field-header"
                                    type="text"
                                    value={fieldHeader}
                                    onChange={(e) => setFieldHeader(e.target.value)}
                                    placeholder="Enter field header (optional)"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-lg bg-white dark:bg-gray-800 
                                             text-gray-900 dark:text-gray-100
                                             placeholder:text-gray-400 dark:placeholder:text-gray-500
                                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                             transition-colors"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 
                                      bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                            <Button
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium 
                                        border border-gray-300 dark:border-gray-600 
                                        rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 
                                        transition-colors cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!fieldName.trim()}
                                className="px-4 py-2 text-white font-medium rounded-lg transition-colors
                                         bg-blue-600 hover:bg-blue-700
                                         disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditAnnotationModal;