const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

// RESIDENTES
async function obtenerResidentes() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Residentes!A2:I',
  });
  return res.result.values || [];
}
async function agregarResidente(datos) {
  const residentes = await obtenerResidentes();
  const lastId = residentes.length > 0 ? parseInt(residentes[residentes.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Residentes!A:I',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function actualizarResidente(datos) {
  const residentes = await obtenerResidentes();
  const idx = residentes.findIndex(r => r[0] === datos[0]);
  if (idx === -1) throw new Error('No encontrado');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Residentes!A${row}:I${row}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function eliminarResidente(id) {
  const residentes = await obtenerResidentes();
  const idx = residentes.findIndex(r => r[0] === id);
  if (idx === -1) throw new Error('No encontrado');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// PAGOS_GC
async function obtenerPagosGC() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A2:Q',
  });
  return res.result.values || [];
}
async function agregarPagoGC(datos) {
  const pagos = await obtenerPagosGC();
  const lastId = pagos.length > 0 ? parseInt(pagos[ pagos.length-1 ][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A:Q',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
// Implementa funciones similares para actualizar/eliminar pagos y para los otros módulos (Egresos, Mantenciones, etc.) según lo necesites.
