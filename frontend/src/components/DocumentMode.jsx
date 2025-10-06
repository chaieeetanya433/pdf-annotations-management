import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Trash2, Calendar, Hash, FileCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const DocumentsMode = ({
    documents,
    isLoadingDocuments,
    handleSelectDocument,
    handleDeleteDocument,
    setMode,
    fileInputRef,
    handleFileUpload
}) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="overflow-hidden">
                    <CardContent className="p-8">
                        <div
                            onClick={handleUploadClick}
                            className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition cursor-pointer"
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                            >
                                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                                <h3 className="text-xl font-semibold mb-2">Upload PDF Document</h3>
                                <p className="text-gray-600 mb-4">Select a PDF file to start mapping fields</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleUploadClick();
                                    }}
                                    className="bg-blue-600 cursor-pointer hover:bg-blue-700"
                                >
                                    Choose PDF File
                                </Button>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Document Library */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle className="text-2xl">Document Library</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Manage your uploaded PDF documents and their annotations
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingDocuments ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-700 mb-2">No Documents Found</h3>
                                <p className="text-gray-500 mb-6">Upload your first PDF to get started</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                    {documents.map((doc) => (
                                        <motion.div
                                            key={doc._id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                                                <CardContent className="p-4">
                                                    <div
                                                        onClick={() => handleSelectDocument(doc)}
                                                        className="space-y-3"
                                                    >
                                                        {/* File Icon and Name */}
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                                                <FileText size={32} className="text-blue-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                                                    {doc.file_name}
                                                                </h3>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {formatFileSize(doc.file_size)}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Document Stats */}
                                                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Hash size={16} className="text-gray-400" />
                                                                <span className="text-gray-600">
                                                                    {doc.total_pages || 'N/A'} pages
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <FileCheck size={16} className="text-gray-400" />
                                                                <span className="text-gray-600">
                                                                    {doc.annotation_count || 0} fields
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Upload Date */}
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                            <Calendar size={14} />
                                                            <span>{formatDate(doc.upload_date)}</span>
                                                        </div>

                                                        {/* Form ID Badge */}
                                                        <div className="flex items-center justify-between pt-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                Form ID: {doc.form_id}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Delete Button */}
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteDocument(doc._id);
                                                            }}
                                                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                                        >
                                                            <Trash2 size={16} className="mr-2" />
                                                            Delete Document
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Stats Summary */}
            {documents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText size={24} className="text-blue-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Total Documents</p>
                                            <p className="text-2xl font-bold text-gray-800">{documents.length}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileCheck size={24} className="text-green-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Total Annotations</p>
                                            <p className="text-2xl font-bold text-gray-800">
                                                {documents.reduce((sum, doc) => sum + (doc.annotation_count || 0), 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Hash size={24} className="text-purple-600" />
                                        <div>
                                            <p className="text-sm text-gray-600">Total Pages</p>
                                            <p className="text-2xl font-bold text-gray-800">
                                                {documents.reduce((sum, doc) => sum + (doc.total_pages || 0), 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default DocumentsMode;