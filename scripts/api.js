// scripts/api.js - Funciones para interactuar con Google Sheets
class GoogleSheetsAPI {
  constructor() {
    this.spreadsheetId = CONFIG.SPREADSHEET_ID;
  }

  async getSheetData(sheetName) {
    try {
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:Z1000`
      });
      
      const values = response.result.values || [];
      const headers = values[0] || [];
      
      return values.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });
    } catch (error) {
      console.error('Error obteniendo datos:', error);
      showError('No se pudieron cargar los datos. Intente nuevamente.');
      return [];
    }
  }

  async appendRow(sheetName, data) {
    try {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: sheetName,
        valueInputOption: "RAW"
      }, {
        values: [data]
      });
      
      showSuccess('Registro guardado exitosamente');
      return true;
    } catch (error) {
      console.error('Error guardando:', error);
      showError('No se pudo guardar el registro');
      return false;
    }
  }
}

const sheetsAPI = new GoogleSheetsAPI();
window.sheetsAPI = sheetsAPI;
