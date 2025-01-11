// src/controllers/documentController.js
const documentAnalyzer = require('../services/documentAnalyzer');

const documentController = {
    analyzeDocument: async (req, res, next) => {
        console.log('Recibida solicitud para analizar documento');
        console.log('Body:', req.body);

        const { documentUrl } = req.body;

        if (!documentUrl) {
            console.log('Error: URL del documento no proporcionada');
            return res.status(400).json({
                status: 'error',
                message: 'URL del documento no proporcionada',
                code: 'DOCUMENT_URL_REQUIRED'
            });
        }

        try {
            console.log(`Iniciando análisis del documento: ${documentUrl}`);
            const results = await documentAnalyzer.analyzeDocument(documentUrl);
            console.log('Análisis completado exitosamente');
            res.status(200).json(results);
        } catch (err) {
            console.error('Error en el controlador:', err);
            
            if (err.message.includes('URL del documento inválida')) {
                return res.status(400).json({
                    status: 'error',
                    message: err.message,
                    code: 'INVALID_URL'
                });
            }
            
            if (err.message.includes('Error de autenticación')) {
                return res.status(401).json({
                    status: 'error',
                    message: err.message,
                    code: 'AUTH_ERROR'
                });
            }
            
            next(err);
        }
    },

    analyzeDocumentUpload: async (req, res, next) => {
        console.log('Recibida solicitud para analizar documento subido');
        
        if (!req.file) {
            console.log('Error: No se proporcionó ningún archivo');
            return res.status(400).json({
                status: 'error',
                message: 'No se proporcionó ningún archivo',
                code: 'FILE_REQUIRED'
            });
        }

        try {
            console.log('Iniciando análisis del documento subido');
            const results = await documentAnalyzer.analyzeDocumentFromBuffer(req.file.buffer);
            console.log('Análisis completado exitosamente');
            res.status(200).json(results);
        } catch (err) {
            console.error('Error en el controlador:', err);
            next(err);
        }
    },

    testConnection: async (req, res) => {
        try {
            const isConnected = await documentAnalyzer.testConnection();
            if (isConnected) {
                res.status(200).json({
                    status: 'success',
                    message: 'Conexión exitosa con Azure Document Intelligence'
                });
            } else {
                res.status(500).json({
                    status: 'error',
                    message: 'No se pudo establecer conexión con Azure Document Intelligence'
                });
            }
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Error al probar la conexión',
                details: error.message
            });
        }
    }
};

module.exports = documentController;