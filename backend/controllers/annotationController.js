const Annotation = require('../models/Annotation.js');

// Save bulk annotations
exports.saveBulkAnnotations = async (req, res) => {
    try {
        const annotations = req.body;
        if (!Array.isArray(annotations)) {
            return res.status(400).json({ error: 'Expected array of annotations' });
        }
        const saved = await Annotation.insertMany(annotations);
        res.json({ success: true, count: saved.length, data: saved });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Fetch annotations
exports.fetchAnnotations = async (req, res) => {
    try {
        const { process_id, form_id } = req.body;
        const annotations = await Annotation.find({ process: process_id, form_id });
        const formatted = annotations.map(ann => ({
            id: ann.field_id,
            annotation: {
                bbox: { x1: ann.bbox[0], y1: ann.bbox[1], x2: ann.bbox[2], y2: ann.bbox[3] },
                page: ann.page,
                field_id: ann.field_id,
                field_name: ann.field_name,
                field_header: ann.field_header,
                process: ann.process,
                form_id: ann.form_id
            },
            table_name: `table_${ann.process}_qc`,
            field_name: ann.field_name,
            field_type: ann.field_type,
            max_length: ann.metadata.max_length || 0,
            group: 1,
            placeholder: ann.metadata.placeholder,
            required: ann.metadata.required,
            field_options: "[]",
            types: ann.field_type.toLowerCase().replace('field', ''),
            validation_code: ann.metadata.validation_code,
            regex_ptn: ann.metadata.regex_ptn,
            process_id: ann.process.toString()
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update annotation
exports.updateAnnotation = async (req, res) => {
    try {
        const updated = await Annotation.findOneAndUpdate(
            { field_id: req.params.id },
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete annotation
exports.deleteAnnotation = async (req, res) => {
    try {
        await Annotation.findOneAndDelete({ field_id: req.params.id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get annotations by process
exports.getAnnotationsByProcess = async (req, res) => {
    try {
        const annotations = await Annotation.find({ process: req.params.process_id });
        res.json(annotations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
