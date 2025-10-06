// components/pdf-annotation/components/ConfirmDialog.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
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
                        onClick={onCancel}
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
                                <AlertTriangle className="text-red-500" size={24} />
                                <h3 className="text-lg font-semibold">{title}</h3>
                            </div>
                            <button
                                onClick={onCancel}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-200">{message}</p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                            <Button
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium rounded-lg 
                  border border-gray-300 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 
                  transition-colors"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={onConfirm}
                                className="px-4 py-2 text-white cursor-pointer font-medium rounded-lg bg-red-600 hover:bg-red-700 
                  transition-colors"
                            >
                                Delete
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;