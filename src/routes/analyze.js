//C:\Users\Jessy\source\repos\accessibility-backend\src\routes\analyze.js
const express = require('express');
const { analyzeURL } = require('../controllers/analyzeController');
const { generatePDF } = require('../services/reportGenerator');
const router = express.Router();
const cors = require('cors');

router.post('/analyze', analyzeURL);

router.post('/generate-pdf', (req, res) => {
    const { results, outputPath } = req.body;

    if (!results || !outputPath) {
        return res.status(400).json({ error: 'Faltan resultados o ruta de salida' });
    }

    try {
        generatePDF(results, outputPath);
        res.status(200).json({ message: 'Informe PDF generado correctamente', path: outputPath });
    } catch (err) {
        res.status(500).json({ error: `Error al generar el PDF: ${err.message}` });
    }
});

module.exports = router;
