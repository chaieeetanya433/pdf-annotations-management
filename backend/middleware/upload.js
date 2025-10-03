const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'pdf_uploads', // Cloudinary folder
        resource_type: 'auto',  // required for PDFs (not images)
        format: async (req, file) => 'pdf' // enforce pdf format
    }
});

const upload = multer({ storage });

module.exports = upload;
