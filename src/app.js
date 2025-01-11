//app.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const analyzeRoutes = require('./routes/analyze');
const documentRoutes = require('./routes/document');
require('dotenv').config();

const app = express();

// Configuración de CORS más permisiva
const corsOptions = {
    origin: function(origin, callback) {
        // Permitir solicitudes sin origen (como las de Postman)
        // y solicitudes desde cualquier origen en desarrollo
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Aplicar CORS antes de otros middleware
app.use(cors(corsOptions));

// Resto de middleware
app.use(helmet());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/api', analyzeRoutes);
app.use('/api', documentRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.send('API de accesibilidad funcionando');
});

// Manejador de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        details: err.message
    });
});

module.exports = app;