const { BlobServiceClient } = require('@azure/storage-blob');
require('dotenv').config();

// Create BlobServiceClient
const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.BLOB_CONNECTION_STRING
);

// Upload JSON to Blob Storage
exports.uploadJsonToBlob = async (containerName, blobName, jsonData) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        await containerClient.createIfNotExists();

        const blobClient = containerClient.getBlockBlobClient(blobName);
        const jsonString = JSON.stringify(jsonData, null, 2);

        await blobClient.upload(jsonString, Buffer.byteLength(jsonString), {
            blobHTTPHeaders: {
                blobContentType: 'application/json'
            }
        });

        console.log(`JSON subido exitosamente: ${blobName}`);
        return {
            url: blobClient.url,
            name: blobName,
            container: containerName
        };
    } catch (error) {
        console.error('Error al subir a Blob Storage:', error);
        throw new Error(`Error al subir a Blob Storage: ${error.message}`);
    }
};