const express = require('express');
const router = express.Router();
const {
  saveBulkAnnotations,
  fetchAnnotations,
  updateAnnotation,
  deleteAnnotation,
  getAnnotationsByForm
} = require('../controllers/annotationController.js');

router.post('/pdf-annotation-mappings/bulk', saveBulkAnnotations);
router.post('/fetch-create-table', fetchAnnotations);
router.put('/pdf-annotation-mappings/:id', updateAnnotation);
router.delete('/pdf-annotation-mappings/:id', deleteAnnotation);
router.get('/annotations/:form_id', getAnnotationsByForm); // Changed from process_id

module.exports = router;