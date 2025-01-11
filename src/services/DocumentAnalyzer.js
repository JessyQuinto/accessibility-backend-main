require('dotenv').config();
const { DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const { AzureKeyCredential } = require("@azure/ai-form-recognizer");

class DocumentAnalyzerService {
    constructor() {
        this.endpoint = process.env.AZURE_DOCUMENT_ENDPOINT;
        this.apiKey = process.env.AZURE_DOCUMENT_KEY;
        
        
        console.log('Inicializando DocumentAnalyzerService');
        console.log(`Endpoint: ${this.endpoint}`);
        console.log('Creando cliente de Azure Document Intelligence...');
        
        try {
            this.client = new DocumentAnalysisClient(
                this.endpoint,
                new AzureKeyCredential(this.apiKey)
            );
            console.log('Cliente de Azure Document Intelligence creado exitosamente');
        } catch (error) {
            console.error('Error al crear el cliente de Azure:', error);
            throw error;
        }
    }

    async analyzeDocument(documentUrl) {
        console.log(`Iniciando análisis de documento desde URL: ${documentUrl}`);
        
        try {
            // Validar URL
            new URL(documentUrl);
            
            console.log('Iniciando el análisis con Azure...');
            const poller = await this.client.beginAnalyzeDocumentFromUrl(
                "prebuilt-document",
                documentUrl
            );
            
            console.log('Esperando resultados del análisis...');
            const result = await poller.pollUntilDone();
            
            console.log('Análisis completado exitosamente');
            console.log('Resultado:', JSON.stringify(result, null, 2));
            
            return {
                status: 'success',
                data: {
                    metadata: {
                        status: result.status,
                        createdDateTime: result.createdDateTime,
                        lastUpdatedDateTime: result.lastUpdatedDateTime
                    },
                    content: {
                        text: result.content,
                        pages: result.pages?.map(page => ({
                            pageNumber: page.pageNumber,
                            angle: page.angle,
                            dimensions: {
                                width: page.width,
                                height: page.height,
                                unit: page.unit
                            },
                            words: page.words?.map(word => ({
                                content: word.content,
                                confidence: word.confidence,
                                boundingBox: word.polygon,
                                span: word.span
                            }))
                        })),
                        tables: result.tables?.map(table => ({
                            rowCount: table.rowCount,
                            columnCount: table.columnCount,
                            cells: table.cells?.map(cell => ({
                                rowIndex: cell.rowIndex,
                                columnIndex: cell.columnIndex,
                                content: cell.content,
                                boundingRegions: cell.boundingRegions
                            }))
                        }))
                    }
                }
            };
        } catch (error) {
            console.error('Error durante el análisis del documento:', error);
            
            if (error instanceof TypeError && error.message.includes('URL')) {
                throw new Error('URL del documento inválida');
            }
            
            if (error.code === 'InvalidRequest') {
                throw new Error('Solicitud inválida: El documento no pudo ser procesado');
            }
            
            if (error.statusCode === 401) {
                throw new Error('Error de autenticación con Azure: Verifique las credenciales');
            }
            
            throw new Error(`Error al analizar el documento: ${error.message}`);
        }
    }

    async analyzeDocumentFromBuffer(buffer) {
        console.log('Iniciando análisis de documento desde buffer');
        
        try {
            if (!buffer || buffer.length === 0) {
                throw new Error('Buffer vacío o inválido');
            }

            console.log('Iniciando el análisis con Azure...');
            const poller = await this.client.beginAnalyzeDocument(
                "prebuilt-document",
                buffer
            );
            
            console.log('Esperando resultados del análisis...');
            const result = await poller.pollUntilDone();
            
            console.log('Análisis completado exitosamente');
            
            return {
                status: 'success',
                data: {
                    metadata: {
                        status: result.status,
                        createdDateTime: result.createdDateTime,
                        lastUpdatedDateTime: result.lastUpdatedDateTime
                    },
                    content: {
                        text: result.content,
                        pages: result.pages?.map(page => ({
                            pageNumber: page.pageNumber,
                            angle: page.angle,
                            dimensions: {
                                width: page.width,
                                height: page.height,
                                unit: page.unit
                            },
                            words: page.words?.map(word => ({
                                content: word.content,
                                confidence: word.confidence,
                                boundingBox: word.polygon,
                                span: word.span
                            }))
                        }))
                    }
                }
            };
        } catch (error) {
            console.error('Error durante el análisis del documento:', error);
            throw new Error(`Error al analizar el documento: ${error.message}`);
        }
    }

    async testConnection() {
        try {
            console.log('Probando conexión con Azure Document Intelligence...');
            // Intentamos analizar un documento pequeño de prueba
            const testUrl = 'https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-layout.pdf';
            await this.analyzeDocument(testUrl);
            console.log('Conexión exitosa con Azure Document Intelligence');
            return true;
        } catch (error) {
            console.error('Error al probar la conexión:', error);
            return false;
        }
    }
}

module.exports = new DocumentAnalyzerService();