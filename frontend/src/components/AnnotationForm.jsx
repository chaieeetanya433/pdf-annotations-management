// src/components/AnnotationForm.jsx
import React from "react";

const AnnotationForm = ({ data, onChange, onSave, disabled }) => {
    const fieldTypes = ['CharField', 'DateField', 'NumberField', 'EmailField', 'TextAreaField', 'BooleanField'];

    return (
        <div>
            <h4 className="text-lg font-semibold mb-3">Field Configuration</h4>
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium">Field Name *</label>
                    <input type="text" value={data.field_name} onChange={e => onChange({ ...data, field_name: e.target.value })} className="w-full px-3 py-2 border rounded mt-1" />
                </div>

                <div>
                    <label className="text-sm font-medium">Field Header</label>
                    <input type="text" value={data.field_header} onChange={e => onChange({ ...data, field_header: e.target.value })} className="w-full px-3 py-2 border rounded mt-1" />
                </div>

                <div>
                    <label className="text-sm font-medium">Field Type</label>
                    <select value={data.field_type} onChange={e => onChange({ ...data, field_type: e.target.value })} className="w-full px-3 py-2 border rounded mt-1">
                        {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium">Placeholder</label>
                    <input type="text" value={data.placeholder} onChange={e => onChange({ ...data, placeholder: e.target.value })} className="w-full px-3 py-2 border rounded mt-1" />
                </div>

                <div>
                    <label className="text-sm font-medium">Max Length</label>
                    <input type="number" value={data.max_length} onChange={e => onChange({ ...data, max_length: Number(e.target.value || 0) })} className="w-full px-3 py-2 border rounded mt-1" />
                </div>

                <div className="flex items-center gap-2">
                    <input id="required" type="checkbox" checked={data.required} onChange={e => onChange({ ...data, required: e.target.checked })} />
                    <label htmlFor="required" className="text-sm">Required</label>
                </div>

                <button onClick={onSave} disabled={disabled} className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                    Save Field Annotation
                </button>
            </div>
        </div>
    );
};

export default AnnotationForm;
