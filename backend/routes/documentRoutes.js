const express = require('express');
const router = express.Router();
const {
  createDocument,
  getAllDocuments,
  getDocumentWithAnnotations,
  deleteDocument,
  getDocumentPDF
} = require('../controllers/documentController.js');

router.post('/documents', createDocument);
router.get('/documents', getAllDocuments); // Changed from /documents/process/:process_id
router.get('/documents/:document_id', getDocumentWithAnnotations);
router.delete('/documents/:document_id', deleteDocument);
router.get('/documents/pdf/:file_id', getDocumentPDF);

module.exports = router;