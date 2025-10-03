// src/components/AnnotationList.jsx
import React from "react";
import { Trash2, Edit2 } from "lucide-react";

const AnnotationList = ({ annotations, onEdit, onDelete }) => {
    if (!annotations || annotations.length === 0) {
        return <div className="text-gray-500">No annotations yet</div>;
    }

    return (
        <div className="space-y-2 max-h-72 overflow-y-auto">
            {annotations.map(ann => (
                <div key={ann.id || ann.field_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                        <div className="font-medium text-sm">{ann.field_name}</div>
                        <div className="text-xs text-gray-500">Page {ann.page} • {ann.field_type}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(ann)} title="Edit" className="text-blue-600 p-1 hover:text-blue-800"><Edit2 size={16} /></button>
                        <button onClick={() => onDelete(ann)} title="Delete" className="text-red-600 p-1 hover:text-red-800"><Trash2 size={16} /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AnnotationList;
