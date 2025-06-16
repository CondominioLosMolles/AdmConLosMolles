// js/sheets.js
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

// Sheet IDs según el orden de las hojas en tu Google Sheet.
// Cambia estos valores si el gid de la hoja es diferente.
// Para obtener el sheetId correcto, abre la hoja y mira la URL: ...#gid=XXXXXXXX
const SHEET_ID_RESIDENTES = 0;    // Cambia por el gid real de la hoja "Residentes"
const SHEET_ID_PAGOS_GC = 1330360081;
const SHEET_ID_EGRESOS = 1288949745;
const SHEET_ID_MANTENCIONES = 1359064608;
const SHEET_ID_MULTAS = 1647433509;
const SHEET_ID_ASAMBLEAS = 1350299373;
const SHEET_ID_COMUNICACIONES = 1221698899;

// -------- RESIDENTES --------
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
            sheetId: SHEET_ID_RESIDENTES,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// -------- PAGOS_GC --------
async function obtenerPagosGC() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A2:Q',
  });
  return res.result.values || [];
}
async function agregarPagoGC(datos) {
  const pagos = await obtenerPagosGC();
  const lastId = pagos.length > 0 ? parseInt(pagos[pagos.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A:Q',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function actualizarPagoGC(datos) {
  const pagos = await obtenerPagosGC();
  const idx = pagos.findIndex(p => p[0] === datos[0]);
  if (idx === -1) throw new Error('No encontrado');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Pagos_GC!A${row}:Q${row}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function eliminarPagoGC(id) {
  const pagos = await obtenerPagosGC();
  const idx = pagos.findIndex(p => p[0] === id);
  if (idx === -1) throw new Error('No encontrado');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: SHEET_ID_PAGOS_GC,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// -------- EGRESOS --------
async function obtenerEgresos() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Egresos!A2:H',
  });
  return res.result.values || [];
}
async function agregarEgreso(datos) {
  const egresos = await obtenerEgresos();
  const lastId = egresos.length > 0 ? parseInt(egresos[egresos.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Egresos!A:H',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function eliminarEgreso(id) {
  const egresos = await obtenerEgresos();
  const idx = egresos.findIndex(e => e[0] === id);
  if (idx === -1) throw new Error('No encontrado');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: SHEET_ID_EGRESOS,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// -------- MANTENCIONES --------
async function obtenerMantenciones() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Mantenciones!A2:H',
  });
  return res.result.values || [];
}
async function agregarMantencion(datos) {
  const mantenciones = await obtenerMantenciones();
  const lastId = mantenciones.length > 0 ? parseInt(mantenciones[mantenciones.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Mantenciones!A:H',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function eliminarMantencion(id) {
  const mantenciones = await obtenerMantenciones();
  const idx = mantenciones.findIndex(m => m[0] === id);
  if (idx === -1) throw new Error('No encontrado');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: SHEET_ID_MANTENCIONES,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// -------- MULTAS --------
async function obtenerMultas() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Multas!A2:G',
  });
  return res.result.values || [];
}
async function agregarMulta(datos) {
  const multas = await obtenerMultas();
  const lastId = multas.length > 0 ? parseInt(multas[multas.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Multas!A:G',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function actualizarMulta(datos) {
  const multas = await obtenerMultas();
  const idx = multas.findIndex(m => m[0] === datos[0]);
  if (idx === -1) throw new Error('No encontrada');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Multas!A${row}:G${row}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function eliminarMulta(id) {
  const multas = await obtenerMultas();
  const idx = multas.findIndex(m => m[0] === id);
  if (idx === -1) throw new Error('No encontrada');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: SHEET_ID_MULTAS,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// -------- ASAMBLEAS --------
async function obtenerAsambleas() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Asambleas!A2:F',
  });
  return res.result.values || [];
}
async function agregarAsamblea(datos) {
  const asambleas = await obtenerAsambleas();
  const lastId = asambleas.length > 0 ? parseInt(asambleas[asambleas.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Asambleas!A:F',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
async function eliminarAsamblea(id) {
  const asambleas = await obtenerAsambleas();
  const idx = asambleas.findIndex(a => a[0] === id);
  if (idx === -1) throw new Error('No encontrada');
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: SHEET_ID_ASAMBLEAS,
            dimension: "ROWS",
            startIndex: row - 1,
            endIndex: row
          }
        }
      }]
    }
  });
}

// -------- COMUNICACIONES --------
async function obtenerComunicaciones() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Comunicaciones!A2:H',
  });
  return res.result.values || [];
}
async function agregarComunicacion(datos) {
  const comunicaciones = await obtenerComunicaciones();
  const lastId = comunicaciones.length > 0 ? parseInt(comunicaciones[comunicaciones.length-1][0]) : 0;
  datos[0] = (lastId + 1).toString();
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Comunicaciones!A:H',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}
