// src/components/GenericModal.jsx
import React from "react";

const GenericModal = ({ open, title, description, onClose, onConfirm, confirmLabel = "Confirm", cancelLabel = "Cancel", loading = false }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl p-6">
                <h3 className="text-lg font-semibold mb-3">{title}</h3>
                <p className="text-gray-600 mb-6">{description}</p>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? "Working..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenericModal;
