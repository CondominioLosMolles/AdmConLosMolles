class SheetsAPI {
    constructor() {
        this.spreadsheetId = CONFIG.SPREADSHEET_ID;
        this.sheets = CONFIG.SHEETS;
    }

    async getSheetData(sheetName) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: sheetName
            });

            const values = response.result.values || [];
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

    async appendRow(sheetName, rowData) {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: sheetName,
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                resource: { values: [rowData] }
            });
            return response.result;
        } catch (error) {
            console.error('Error al agregar fila:', error);
            showError('Error al agregar datos: ' + error.message);
            throw error;
        }
    }

    async updateRow(sheetName, rowIndex, rowData) {
        try {
            const adjustedRowIndex = rowIndex + 1;
            const response = await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `${sheetName}!A${adjustedRowIndex}`,
                valueInputOption: 'USER_ENTERED',
                resource: { values: [rowData] }
            });
            return response.result;
        } catch (error) {
            console.error('Error al actualizar fila:', error);
            showError('Error al actualizar datos: ' + error.message);
            throw error;
        }
    }

    async deleteRow(sheetName, rowIndex) {
        try {
            const sheetsResponse = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const sheet = sheetsResponse.result.sheets.find(s => s.properties.title === sheetName);
            if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada`);

            const sheetId = sheet.properties.sheetId;

            const response = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId,
                                dimension: 'ROWS',
                                startIndex: rowIndex - 1,
                                endIndex: rowIndex
                            }
                        }
                    }]
                }
            });

            return response.result;
        } catch (error) {
            console.error('Error al eliminar fila:', error);
            showError('Error al eliminar datos: ' + error.message);
            throw error;
        }
    }

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

    async createSheet(sheetName, headers) {
        try {
            const createResponse = await gapi.client.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: { title: sheetName }
                        }
                    }]
                }
            });

            if (headers && headers.length > 0) {
                await gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    resource: { values: [headers] }
                });
            }

            return createResponse.result;
        } catch (error) {
            console.error('Error al crear hoja:', error);
            showError('Error al crear hoja: ' + error.message);
            throw error;
        }
    }

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

const sheetsAPI = new SheetsAPI();
