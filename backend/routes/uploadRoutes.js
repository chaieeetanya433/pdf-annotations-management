const express = require('express');
const router = express.Router();
const { uploadPDF } = require('../controllers/uploadController.js');
const upload = require('../middleware/upload.js');

router.post('/upload-pdf', upload.single('pdf'), uploadPDF);

module.exports = router;
