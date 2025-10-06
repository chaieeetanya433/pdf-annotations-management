const mongoose = require('mongoose');

const AnnotationSchema = new mongoose.Schema({
    form_id: { type: Number, required: true }, // Only form_id needed
    field_id: Number,
    field_name: String,
    field_header: String,
    bbox: [Number],
    page: Number,
    scale: Number,
    field_type: String,
    metadata: {
        required: Boolean,
        max_length: Number,
        placeholder: String,
        validation_code: String,
        regex_ptn: String,
    },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Annotation', AnnotationSchema);