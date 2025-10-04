// components/pdf-annotation/components/UploadMode.jsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const UploadMode = ({ handleFileUpload, fileInputRef, pdfFile }) => {
    const inputRef = useRef(null);

    const handleUploadClick = () => {
        inputRef.current?.click();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Card className="overflow-hidden">
                <CardContent className="p-8">
                    <div className="border-4 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                            <h3 className="text-xl font-semibold mb-2">Upload PDF Document</h3>
                            <p className="text-gray-600 mb-4">Select a PDF file to start mapping fields</p>
                            <input
                                ref={(el) => {
                                    inputRef.current = el;
                                    if (fileInputRef) fileInputRef.current = el;
                                }}
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button onClick={handleUploadClick} className="bg-blue-600 hover:bg-blue-700">
                                Choose PDF File
                            </Button>
                            {pdfFile && (
                                <motion.p
                                    className="mt-4 text-sm text-green-600 font-medium"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    ✓ {pdfFile.name} loaded
                                </motion.p>
                            )}
                        </motion.div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default UploadMode;