const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    form_id: { type: Number, required: true, unique: true },
    file_url: { type: String, required: true },
    file_id: { type: String, required: true },
    file_name: { type: String, required: true },
    file_size: Number,
    upload_date: { type: Date, default: Date.now },
    total_pages: Number,
    status: { type: String, default: 'active' },
});

module.exports = mongoose.model('Document', DocumentSchema);