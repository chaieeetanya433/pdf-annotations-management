const express = require('express');
const router = express.Router();
const {
    saveBulkAnnotations,
    fetchAnnotations,
    updateAnnotation,
    deleteAnnotation,
    getAnnotationsByProcess
} = require('../controllers/annotationController.js');

router.post('/pdf-annotation-mappings/bulk', saveBulkAnnotations);
router.post('/fetch-create-table', fetchAnnotations);
router.put('/pdf-annotation-mappings/:id', updateAnnotation);
router.delete('/pdf-annotation-mappings/:id', deleteAnnotation);
router.get('/annotations/:process_id', getAnnotationsByProcess);

module.exports = router;
