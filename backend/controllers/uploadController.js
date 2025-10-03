exports.uploadPDF = async (req, res) => {
    try {
        const { process_id, form_id } = req.body;

        res.json({
            success: true,
            file_url: req.file.path,     // Cloudinary URL
            file_id: req.file.filename,  // Cloudinary public_id
            process_id,
            form_id
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
