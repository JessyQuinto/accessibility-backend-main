# Accessibility Backend Project

This project is an accessibility analysis backend service built with Node.js and Express. It allows users to submit URLs for accessibility scanning and generates reports based on the findings.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Technologies Used](#technologies-used)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd accessibility-backend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and specify the desired port (optional):
   ```
   PORT=3000
   ```

## Usage

To start the server, run:
```
npm run dev
```
This will start the server using Nodemon, which automatically restarts the server on file changes.

## Uso de Credenciales para Configuración

Para el correcto funcionamiento del proyecto, es necesario configurar las credenciales correspondientes en el archivo `.env`. Asegúrese de proporcionar las credenciales del servicio que esté utilizando. Las variables requeridas son:

```env
BLOB_CONNECTION_STRING="Blobstorage Key"
AZURE_DOCUMENT_KEY=<CLAVE_DEL_SERVICIO_AZURE_DOCUMENT>
```

### Notas Importantes

1. **BLOB_CONNECTION_STRING**: Debe contener la cadena de conexión para su cuenta de almacenamiento de Azure Blob. Reemplace `<NOMBRE_DEL_SERVICIO_BLOB>` con el nombre de su cuenta de Blob y `<CLAVE_DEL_SERVICIO_BLOB>` con la clave correspondiente.

2. **AZURE_DOCUMENT_KEY**: Reemplace `<CLAVE_DEL_SERVICIO_AZURE_DOCUMENT>` con la clave proporcionada para su servicio de documentos de Azure.

> **Nota:** Estas credenciales son sensibles y no deben ser compartidas ni incluidas en el control de versiones. Se recomienda agregarlas al archivo `.gitignore` y almacenar una copia segura en un sistema de gestión de secretos si es necesario.



## Endpoints

- **POST /api/analyze**
  - Description: Analyzes the provided URL for accessibility issues.
  - Request Body: 
    ```json
    {
      "url": "https://example.com"
    }
    ```
  - Response: Returns a JSON object with the analysis results or an error message if the URL is invalid.

## Technologies Used

- Node.js
- Express
- CORS
- dotenv
- body-parser
- Puppeteer
- axe-core
- PDFKit

## License

This project is licensed under the MIT License.
