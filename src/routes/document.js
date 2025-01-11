// src/routes/document.js
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');
const router = express.Router();

// Configurar multer para manejar la carga de archivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Ruta de prueba de conexión
router.get('/test-document-service', documentController.testConnection);

// Ruta para analizar documento por URL
router.post('/analyze-document', documentController.analyzeDocument);

// Ruta para analizar documento subido
router.post('/analyze-document-upload', upload.single('file'), documentController.analyzeDocumentUpload);

module.exports = router;