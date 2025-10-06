const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure storage
// const storage = new CloudinaryStorage({
//     cloudinary,
//     params: {
//         folder: 'pdf_uploads', // Cloudinary folder
//         resource_type: 'auto',  // required for PDFs (not images)
//         format: async (req, file) => 'pdf', // enforce pdf format
//         access_mode: 'public', 
//         type: 'upload'
//     }
// });

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'pdf_uploads',
    resource_type: 'auto',
    format: async (req, file) => 'pdf',
    access_mode: 'public', // This is the key setting
    type: 'upload'
  }
});

const upload = multer({ storage });

module.exports = upload;
