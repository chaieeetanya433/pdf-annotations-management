// src/components/PDFUploader.jsx
import React from "react";
import { Upload } from "lucide-react";

const PDFUploader = ({ fileInputRef, onChoose }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition">
                <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-xl font-semibold mb-2">Upload PDF Document</h3>
                <p className="text-gray-600 mb-4">Select a PDF file to start mapping fields</p>
                <input ref={fileInputRef} type="file" accept="application/pdf" onChange={onChoose} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                    Choose PDF File
                </button>
            </div>
        </div>
    );
};

export default PDFUploader;
