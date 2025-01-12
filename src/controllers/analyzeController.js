// analyzeController.js
const { scanPage } = require('../services/accessibilityScanner');

exports.analyzeURL = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                status: 'error',
                message: 'URL no proporcionada'
            });
        }

        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({
                status: 'error',
                message: 'URL inválida'
            });
        }

        console.log(`Iniciando análisis de accesibilidad para: ${url}`);
        const scanResults = await scanPage(url);
        
        res.status(200).json({
            status: 'success',
            data: {
                url,
                timestamp: new Date().toISOString(),
                results: scanResults
            }
        });
    } catch (error) {
        console.error('Error en el análisis:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Error interno del servidor'
        });
    }
};