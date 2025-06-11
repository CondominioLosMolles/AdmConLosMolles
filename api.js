// Gestión de APIs de Google (Sheets, Drive, Gmail)
class GoogleAPIManager {
    constructor() {
        this.sheetsAPI = null;
        this.driveAPI = null;
        this.gmailAPI = null;
        this.isInitialized = false;
    }

    // Inicializar las APIs de Google
    async init() {
        try {
            if (!window.authManager.isAuthenticated()) {
                throw new Error('Usuario no autenticado');
            }

            // Cargar las APIs necesarias
            await this.loadAPIs();
            this.isInitialized = true;
            console.log('APIs de Google inicializadas correctamente');
        } catch (error) {
            console.error('Error inicializando APIs de Google:', error);
            throw error;
        }
    }

    // Cargar las APIs de Google
    async loadAPIs() {
        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: CONFIG.API_KEY,
                        discoveryDocs: [
                            'https://sheets.googleapis.com/$discovery/rest?version=v4',
                            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                            'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
                        ]
                    });
                    
                    this.sheetsAPI = gapi.client.sheets;
                    this.driveAPI = gapi.client.drive;
                    this.gmailAPI = gapi.client.gmail;
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    // === GOOGLE SHEETS METHODS ===

    // Leer datos de una hoja específica
    async readSheet(sheetName, range = '') {
        try {
            const fullRange = range ? `${sheetName}!${range}` : sheetName;
            const response = await this.sheetsAPI.spreadsheets.values.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: fullRange
            });
            
            return response.result.values || [];
        } catch (error) {
            console.error(`Error leyendo hoja ${sheetName}:`, error);
            throw error;
        }
    }

    // Escribir datos en una hoja específica
    async writeSheet(sheetName, range, values) {
        try {
            const response = await this.sheetsAPI.spreadsheets.values.update({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${sheetName}!${range}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values
                }
            });
            
            return response.result;
        } catch (error) {
            console.error(`Error escribiendo en hoja ${sheetName}:`, error);
            throw error;
        }
    }

    // Agregar fila a una hoja
    async appendToSheet(sheetName, values) {
        try {
            const response = await this.sheetsAPI.spreadsheets.values.append({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: sheetName,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [values]
                }
            });
            
            return response.result;
        } catch (error) {
            console.error(`Error agregando fila a ${sheetName}:`, error);
            throw error;
        }
    }

    // Eliminar fila de una hoja
    async deleteRow(sheetName, rowIndex) {
        try {
            // Primero obtener el ID de la hoja
            const spreadsheet = await this.sheetsAPI.spreadsheets.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID
            });
            
            const sheet = spreadsheet.result.sheets.find(s => s.properties.title === sheetName);
            if (!sheet) {
                throw new Error(`Hoja ${sheetName} no encontrada`);
            }
            
            const sheetId = sheet.properties.sheetId;
            
            // Eliminar la fila
            const response = await this.sheetsAPI.spreadsheets.batchUpdate({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex,
                                endIndex: rowIndex + 1
                            }
                        }
                    }]
                }
            });
            
            return response.result;
        } catch (error) {
            console.error(`Error eliminando fila de ${sheetName}:`, error);
            throw error;
        }
    }

    // === GOOGLE DRIVE METHODS ===

    // Crear carpeta en Google Drive
    async createFolder(name, parentId = null) {
        try {
            const metadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder'
            };
            
            if (parentId) {
                metadata.parents = [parentId];
            }
            
            const response = await this.driveAPI.files.create({
                resource: metadata
            });
            
            return response.result;
        } catch (error) {
            console.error('Error creando carpeta:', error);
            throw error;
        }
    }

    // Buscar archivo o carpeta por nombre
    async findFile(name, mimeType = null) {
        try {
            let query = `name='${name}'`;
            if (mimeType) {
                query += ` and mimeType='${mimeType}'`;
            }
            
            const response = await this.driveAPI.files.list({
                q: query,
                fields: 'files(id, name, mimeType, parents)'
            });
            
            return response.result.files;
        } catch (error) {
            console.error('Error buscando archivo:', error);
            throw error;
        }
    }

    // Subir archivo a Google Drive
    async uploadFile(file, fileName, parentId = null) {
        try {
            const metadata = {
                name: fileName
            };
            
            if (parentId) {
                metadata.parents = [parentId];
            }
            
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', file);
            
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${window.authManager.getAccessToken()}`
                },
                body: form
            });
            
            if (!response.ok) {
                throw new Error('Error subiendo archivo');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            throw error;
        }
    }

    // === GMAIL METHODS ===

    // Enviar email
    async sendEmail(to, subject, body, attachments = []) {
        try {
            // Crear el mensaje en formato RFC 2822
            let message = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/html; charset=utf-8',
                '',
                body
            ].join('\n');
            
            // Codificar en base64
            const encodedMessage = btoa(unescape(encodeURIComponent(message)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            
            const response = await this.gmailAPI.users.messages.send({
                userId: 'me',
                resource: {
                    raw: encodedMessage
                }
            });
            
            return response.result;
        } catch (error) {
            console.error('Error enviando email:', error);
            throw error;
        }
    }

    // === UTILITY METHODS ===

    // Verificar si las APIs están inicializadas
    checkInitialized() {
        if (!this.isInitialized) {
            throw new Error('APIs de Google no inicializadas');
        }
    }

    // Obtener estructura de carpetas de Drive
    async ensureFolderStructure() {
        try {
            const folders = CONFIG.DRIVE_FOLDERS;
            const createdFolders = {};
            
            // Crear carpeta raíz
            let rootFolder = await this.findFile('LosMolles', 'application/vnd.google-apps.folder');
            if (rootFolder.length === 0) {
                rootFolder = await this.createFolder('LosMolles');
                createdFolders.root = rootFolder.id;
            } else {
                createdFolders.root = rootFolder[0].id;
            }
            
            // Crear subcarpetas
            const subfolders = [
                { name: 'Contabilidad', parent: 'root' },
                { name: 'Parcela Pagos', parent: 'contabilidad' },
                { name: 'Egresos', parent: 'contabilidad' },
                { name: 'Mantenciones', parent: 'contabilidad' },
                { name: 'Asambleas', parent: 'root' }
            ];
            
            for (const folder of subfolders) {
                const parentId = folder.parent === 'root' ? createdFolders.root : createdFolders[folder.parent];
                let existingFolder = await this.findFile(folder.name, 'application/vnd.google-apps.folder');
                
                if (existingFolder.length === 0 || !existingFolder.some(f => f.parents && f.parents.includes(parentId))) {
                    const newFolder = await this.createFolder(folder.name, parentId);
                    createdFolders[folder.name.toLowerCase().replace(' ', '_')] = newFolder.id;
                } else {
                    const validFolder = existingFolder.find(f => f.parents && f.parents.includes(parentId));
                    createdFolders[folder.name.toLowerCase().replace(' ', '_')] = validFolder.id;
                }
            }
            
            return createdFolders;
        } catch (error) {
            console.error('Error creando estructura de carpetas:', error);
            throw error;
        }
    }
}

// Crear instancia global del gestor de APIs
window.googleAPI = new GoogleAPIManager();

