/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de interacción con Google Sheets API
 */

/**
 * Clase para manejar la interacción con Google Sheets API
 */
class SheetsAPI {
    /**
     * Constructor
     */
    constructor() {
        this.spreadsheetId = CONFIG.SPREADSHEET_ID;
        this.sheets = CONFIG.SHEETS;
    }

    /**
     * Obtiene los datos de una hoja específica
     * @param {string} sheetName - Nombre de la hoja
     * @returns {Promise<Array>} - Datos de la hoja
     */
    async getSheetData(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: sheetName
            });

            const values = response.result.values || [];

            // Si hay datos, convertir a objetos usando la primera fila como encabezados
            if (values.length > 0) {
                const headers = values[0];
                return values.slice(1).map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
            }

            return [];
        } catch (error) {
            console.error('Error al obtener datos de la hoja:', error);
            showError('Error al obtener datos: ' + error.message);
            return [];
        }
    }

    /**
     * Agrega una fila a una hoja específica
     * @param {string} sheetName - Nombre de la hoja
     * @param {Array} rowData - Datos de la fila a agregar
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async appendRow(sheetName, rowData) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: sheetName,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [rowData]
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error al agregar fila:', error);
            showError('Error al agregar datos: ' + error.message);
            throw error;
        }
    }

    /**
     * Actualiza una fila en una hoja específica
     * @param {string} sheetName - Nombre de la hoja
     * @param {number} rowIndex - Índice de la fila a actualizar (base 1, ej. fila 2)
     * @param {Array} rowData - Nuevos datos para la fila
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async updateRow(sheetName, rowIndex, rowData) {
        try {
            // Usar rowIndex directamente sin ajuste adicional
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [rowData]
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error al actualizar fila:', error);
            showError('Error al actualizar datos: ' + error.message);
            throw error;
        }
    }

    /**
     * Elimina una fila de una hoja específica
     * @param {string} sheetName - Nombre de la hoja
     * @param {number} rowIndex - Índice de la fila a eliminar (base 1, ej. fila 2)
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async deleteRow(sheetName, rowIndex) {
        try {
            // Ajustar el índice para la API de Google Sheets
            const sheetsResponse = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const sheet = sheetsResponse.result.sheets.find(s => s.properties.title === sheetName);
            if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada`);

            const sheetId = sheet.properties.sheetId;

            // Usar índices correctos: startIndex es base 0, endIndex es exclusivo
            const response = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [
                        {
                            deleteDimension: {
                                range: {
                                    sheetId: sheetId,
                                    dimension: 'ROWS',
                                    startIndex: rowIndex - 1, // Convertir a base 0
                                    endIndex: rowIndex // Ej: si rowIndex es 2, elimina fila 2
                                }
                            }
                        }
                    ]
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error al eliminar fila:', error);
            showError('Error al eliminar datos: ' + error.message);
            throw error;
        }
    }

    /**
     * Obtiene los encabezados de una hoja específica
     * @param {string} sheetName - Nombre de la hoja
     * @returns {Promise<Array>} - Encabezados de la hoja
     */
    async getSheetHeaders(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!1:1`
            });

            return response.result.values[0] || [];
        } catch (error) {
            console.error('Error al obtener encabezados:', error);
            showError('Error al obtener encabezados: ' + error.message);
            return [];
        }
    }

    /**
     * Crea una nueva hoja en el documento
     * @param {string} sheetName - Nombre de la nueva hoja
     * @param {Array} headers - Encabezados para la nueva hoja
     * @returns {Promise<Object>} - Resultado de la operación
     */
    async createSheet(sheetName, headers) {
        try {
            // Primero, crear la hoja
            const createResponse = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: sheetName
                                }
                            }
                        }
                    ]
                }
            });

            // Luego, agregar los encabezados
            if (headers && headers.length > 0) {
                await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [headers]
                    }
                });
            }

            return createResponse.result;
        } catch (error) {
            console.error('Error al crear hoja:', error);
            showError('Error al crear hoja: ' + error.message);
            throw error;
        }
    }

    /**
     * Verifica si una hoja existe en el documento
     * @param {string} sheetName - Nombre de la hoja a verificar
     * @returns {Promise<boolean>} - true si la hoja existe, false en caso contrario
     */
    async sheetExists(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            return response.result.sheets.some(sheet => sheet.properties.title === sheetName);
        } catch (error) {
            console.error('Error al verificar existencia de hoja:', error);
            showError('Error al verificar hoja: ' + error.message);
            return false;
        }
    }
}

// Instancia global de la API de Sheets
const sheetsAPI = new SheetsAPI();
