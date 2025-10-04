// components/pdf-annotation/components/Header.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Upload, Edit2, Eye } from 'lucide-react';

const Header = ({ mode, setMode, pdfFile, loadFromDB }) => {
  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg p-6 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-2">PDF Field Mapping & Annotation System</h1>
      <p className="text-gray-600">Upload PDF, map fields with bounding boxes, and manage annotations</p>

      <div className="flex gap-3 mt-4">
        <Button
          onClick={() => setMode('upload')}
          variant={mode === 'upload' ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <Upload size={18} />
          Upload PDF
        </Button>

        <Button
          onClick={() => { setMode('mapping'); loadFromDB(); }}
          disabled={!pdfFile}
          variant={mode === 'mapping' ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <Edit2 size={18} />
          Mapping Mode
        </Button>

        <Button
          onClick={() => { setMode('executive'); loadFromDB(); }}
          disabled={!pdfFile}
          variant={mode === 'executive' ? 'default' : 'outline'}
          className="flex items-center gap-2"
        >
          <Eye size={18} />
          Executive View
        </Button>
      </div>
    </motion.div>
  );
};

export default Header;