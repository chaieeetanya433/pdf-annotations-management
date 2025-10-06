const Document = require('../models/Document.js');
const Annotation = require('../models/Annotation.js');
const cloudinary = require('cloudinary').v2;

exports.getDocumentPDF = async (req, res) => {
    try {
        const { file_id } = req.params;

        // Get the file from Cloudinary
        const result = cloudinary.api.resource(file_id, {
            resource_type: 'raw'
        });

        // Stream the file to the client
        const stream = cloudinary.v2.api.download(file_id, {
            resource_type: 'raw'
        });

        res.setHeader('Content-Type', 'application/pdf');
        stream.pipe(res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createDocument = async (req, res) => {
    try {
        const { form_id, file_url, file_id, file_name, file_size, total_pages } = req.body;

        const document = new Document({
            form_id,
            file_url,
            file_id,
            file_name,
            file_size,
            total_pages
        });

        const saved = await document.save();
        res.json({ success: true, data: saved });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all documents
exports.getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find({ status: 'active' })
            .sort({ upload_date: -1 });

        const documentsWithCount = await Promise.all(
            documents.map(async (doc) => {
                const annotationCount = await Annotation.countDocuments({
                    form_id: doc.form_id
                });

                return {
                    ...doc.toObject(),
                    annotation_count: annotationCount
                };
            })
        );

        res.json(documentsWithCount);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single document with annotations
exports.getDocumentWithAnnotations = async (req, res) => {
    try {
        const { document_id } = req.params;

        const document = await Document.findById(document_id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const annotations = await Annotation.find({
            form_id: document.form_id
        });

        res.json({
            document: document,
            annotations: annotations
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete document
exports.deleteDocument = async (req, res) => {
    try {
        const { document_id } = req.params;

        const document = await Document.findById(document_id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        document.status = 'deleted';
        await document.save();

        res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
