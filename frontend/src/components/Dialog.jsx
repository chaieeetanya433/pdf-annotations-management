// components/pdf-annotation/components/Dialog.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Check, Info } from 'lucide-react';

const Dialog = ({ isOpen, onClose, title, children, type = 'info' }) => {
    const getIcon = () => {
        switch (type) {
            case 'error': return <AlertCircle className="text-red-500" size={24} />;
            case 'success': return <Check className="text-green-500" size={24} />;
            default: return <Info className="text-blue-500" size={24} />;
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'error': return 'bg-red-600 hover:bg-red-700';
            case 'success': return 'bg-green-600 hover:bg-green-700';
            default: return 'bg-blue-600 hover:bg-blue-700';
        }
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
                                {getIcon()}
                                <h3 className="text-lg font-semibold">{title}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-200">{children}</p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
                            <button
                                onClick={onClose}
                                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors ${getButtonColor()}`}
                            >
                                OK
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Dialog;
