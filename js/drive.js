// ===== INTEGRACIÓN CON GOOGLE DRIVE =====

class GoogleDriveAPI {
    constructor() {
        this.foldersStructure = {
            root: 'Los Molles',
            contabilidad: 'Contabilidad',
            parcelasPagos: 'Parcelas Pagos',
            egresos: 'Egresos',
            mantenciones: 'Mantenciones',
            asambleas: 'Asambleas'
        };
        this.folderIds = {};
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return gapi.auth2.getAuthInstance().isSignedIn.get();
    }

    // Inicializar estructura de carpetas
    async initializeFolders() {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            // Buscar o crear carpeta raíz
            const rootFolderId = await this.findOrCreateFolder(this.foldersStructure.root);
            this.folderIds.root = rootFolderId;

            // Buscar o crear carpeta de contabilidad
            const contabilidadFolderId = await this.findOrCreateFolder(
                this.foldersStructure.contabilidad, 
                rootFolderId
            );
            this.folderIds.contabilidad = contabilidadFolderId;

            // Buscar o crear subcarpetas
            this.folderIds.parcelasPagos = await this.findOrCreateFolder(
                this.foldersStructure.parcelasPagos,
                contabilidadFolderId
            );

            this.folderIds.egresos = await this.findOrCreateFolder(
                this.foldersStructure.egresos,
                contabilidadFolderId
            );

            this.folderIds.mantenciones = await this.findOrCreateFolder(
                this.foldersStructure.mantenciones,
                contabilidadFolderId
            );

            this.folderIds.asambleas = await this.findOrCreateFolder(
                this.foldersStructure.asambleas,
                rootFolderId
            );

            // Crear carpetas para cada parcela
            await this.createParcelaFolders();

            return this.folderIds;
        } catch (error) {
            console.error('Error inicializando carpetas:', error);
            throw error;
        }
    }

    // Crear carpetas para cada parcela (1-26)
    async createParcelaFolders() {
        const parcelasPagosFolderId = this.folderIds.parcelasPagos;
        
        for (let i = 1; i <= 26; i++) {
            const folderName = `Parcela ${i}`;
            const folderId = await this.findOrCreateFolder(folderName, parcelasPagosFolderId);
            this.folderIds[`parcela${i}`] = folderId;
        }
    }

    // Buscar o crear una carpeta
    async findOrCreateFolder(name, parentId = null) {
        try {
            // Buscar carpeta existente
            let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            if (parentId) {
                query += ` and '${parentId}' in parents`;
            }

            const searchResponse = await gapi.client.drive.files.list({
                q: query,
                fields: 'files(id, name)'
            });

            const folders = searchResponse.result.files;
            
            if (folders && folders.length > 0) {
                return folders[0].id;
            }

            // Crear carpeta si no existe
            const createResponse = await gapi.client.drive.files.create({
                resource: {
                    name: name,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: parentId ? [parentId] : undefined
                },
                fields: 'id'
            });

            return createResponse.result.id;
        } catch (error) {
            console.error(`Error buscando/creando carpeta ${name}:`, error);
            throw error;
        }
    }

    // Subir archivo
    async uploadFile(file, folderId, fileName = null) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const metadata = {
                name: fileName || file.name,
                parents: [folderId]
            };

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
            form.append('file', file);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
                method: 'POST',
                headers: new Headers({
                    'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                }),
                body: form
            });

            if (!response.ok) {
                throw new Error(`Error subiendo archivo: ${response.statusText}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error subiendo archivo:', error);
            throw error;
        }
    }

    // Subir comprobante de pago para una parcela
    async uploadComprobantePago(file, nParcela, fileName = null) {
        await this.ensureFoldersInitialized();
        
        const parcelaFolderId = this.folderIds[`parcela${nParcela}`];
        if (!parcelaFolderId) {
            throw new Error(`Carpeta para parcela ${nParcela} no encontrada`);
        }

        const finalFileName = fileName || `comprobante_${Date.now()}_${file.name}`;
        return await this.uploadFile(file, parcelaFolderId, finalFileName);
    }

    // Subir factura de egreso
    async uploadFacturaEgreso(file, fileName = null) {
        await this.ensureFoldersInitialized();
        
        const egresosFolderId = this.folderIds.egresos;
        const finalFileName = fileName || `factura_${Date.now()}_${file.name}`;
        return await this.uploadFile(file, egresosFolderId, finalFileName);
    }

    // Subir comprobante de mantención
    async uploadComprobanteMantencion(file, fileName = null) {
        await this.ensureFoldersInitialized();
        
        const mantencionesFolderId = this.folderIds.mantenciones;
        const finalFileName = fileName || `mantencion_${Date.now()}_${file.name}`;
        return await this.uploadFile(file, mantencionesFolderId, finalFileName);
    }

    // Subir acta de asamblea
    async uploadActaAsamblea(file, fileName = null) {
        await this.ensureFoldersInitialized();
        
        const asambleasFolderId = this.folderIds.asambleas;
        const finalFileName = fileName || `acta_${Date.now()}_${file.name}`;
        return await this.uploadFile(file, asambleasFolderId, finalFileName);
    }

    // Obtener información de un archivo
    async getFileInfo(fileId) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink'
            });

            return response.result;
        } catch (error) {
            console.error('Error obteniendo información del archivo:', error);
            throw error;
        }
    }

    // Eliminar archivo
    async deleteFile(fileId) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.drive.files.delete({
                fileId: fileId
            });

            return response.result;
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            throw error;
        }
    }

    // Listar archivos en una carpeta
    async listFilesInFolder(folderId, pageSize = 100) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                pageSize: pageSize,
                fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
                orderBy: 'modifiedTime desc'
            });

            return response.result.files || [];
        } catch (error) {
            console.error('Error listando archivos:', error);
            throw error;
        }
    }

    // Listar comprobantes de una parcela
    async listComprobantesParcela(nParcela) {
        await this.ensureFoldersInitialized();
        
        const parcelaFolderId = this.folderIds[`parcela${nParcela}`];
        if (!parcelaFolderId) {
            throw new Error(`Carpeta para parcela ${nParcela} no encontrada`);
        }

        return await this.listFilesInFolder(parcelaFolderId);
    }

    // Asegurar que las carpetas estén inicializadas
    async ensureFoldersInitialized() {
        if (Object.keys(this.folderIds).length === 0) {
            await this.initializeFolders();
        }
    }

    // Crear enlace de descarga directo
    getDownloadLink(fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }

    // Crear enlace de vista previa
    getPreviewLink(fileId) {
        return `https://drive.google.com/file/d/${fileId}/view`;
    }

    // Compartir archivo (hacer público)
    async shareFile(fileId, role = 'reader', type = 'anyone') {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.drive.permissions.create({
                fileId: fileId,
                resource: {
                    role: role,
                    type: type
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error compartiendo archivo:', error);
            throw error;
        }
    }

    // Buscar archivos por nombre
    async searchFiles(query, folderId = null) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            let searchQuery = `name contains '${query}' and trashed=false`;
            if (folderId) {
                searchQuery += ` and '${folderId}' in parents`;
            }

            const response = await gapi.client.drive.files.list({
                q: searchQuery,
                fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
                orderBy: 'modifiedTime desc'
            });

            return response.result.files || [];
        } catch (error) {
            console.error('Error buscando archivos:', error);
            throw error;
        }
    }

    // Obtener espacio de almacenamiento usado
    async getStorageInfo() {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const response = await gapi.client.drive.about.get({
                fields: 'storageQuota'
            });

            const quota = response.result.storageQuota;
            return {
                limit: parseInt(quota.limit),
                usage: parseInt(quota.usage),
                usageInDrive: parseInt(quota.usageInDrive),
                usageInDriveTrash: parseInt(quota.usageInDriveTrash)
            };
        } catch (error) {
            console.error('Error obteniendo información de almacenamiento:', error);
            throw error;
        }
    }
}

// Crear instancia global
window.driveAPI = new GoogleDriveAPI();

// Exportar para uso en otros módulos
window.GoogleDriveAPI = GoogleDriveAPI;

