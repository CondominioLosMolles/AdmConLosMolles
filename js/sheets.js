// js/sheets.js
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

// --- Nombres de las Hojas ---
const SHEET_RESIDENTES = 'Residentes';
const SHEET_PAGOS_GC = 'Pagos_GC';
const SHEET_CONFIG_TIMC = 'Config_TIMC';
const SHEET_EGRESOS = 'Egresos';
const SHEET_MANTENCIONES = 'Mantenciones';
const SHEET_MULTAS = 'Multas';
const SHEET_ASAMBLEAS = 'Asambleas';
const SHEET_COMUNICACIONES = 'Comunicaciones';

// --- IDs de las Hojas (para operaciones de borrado) ---
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;


// -------- RESIDENTES --------
async function obtenerResidentes() { /* ...código existente... */ }
async function agregarResidente(datos) { /* ...código existente... */ }
async function actualizarResidente(datos) { /* ...código existente... */ }
async function eliminarResidente(id) { /* ...código existente... */ }

// -------- GASTOS COMUNES Y TIMC --------
async function obtenerPagosGC() { /* ...código existente... */ }
async function agregarPagoGC(datos) { /* ...código existente... */ }
async function obtenerTIMCs() { /* ...código existente... */ }
async function guardarTIMC(anio, mes, valor) { /* ...código existente... */ }

// -------- CONTABILIDAD (EGRESOS) --------
async function obtenerEgresos() { /* ...código existente... */ }

// -------- MANTENCIONES --------
async function obtenerMantenciones() { /* ...código existente... */ }

// -------- ASAMBLEAS --------
async function obtenerAsambleas() { /* ...código existente... */ }

// -------- COMUNICACIONES --------
async function obtenerComunicaciones() { /* ...código existente... */ }


// -------- MULTAS (FUNCIONES NUEVAS Y EXISTENTES) --------

// Obtiene todas las multas
async function obtenerMultas() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_MULTAS}!A2:G`,
  });
  return res.result.values || [];
}

// Agrega una nueva multa al final de la hoja
async function agregarMulta(datos) {
  const multas = await obtenerMultas();
  const lastId = multas.length > 0 && multas[multas.length - 1][0] ? parseInt(multas[multas.length - 1][0]) : 0;
  datos[0] = (lastId + 1).toString(); // Asigna un nuevo ID
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_MULTAS}!A:G`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}

// Actualiza una fila de multa existente (para registrar el pago)
async function actualizarMulta(datos) {
  const multas = await obtenerMultas();
  const idx = multas.findIndex(m => m[0] === datos[0]);
  if (idx === -1) throw new Error('Multa no encontrada para actualizar.');
  const row = idx + 2; // +2 porque los datos empiezan en la fila 2
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_MULTAS}!A${row}:G${row}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [datos] }
  });
}

// Elimina una fila de multa por su ID
async function eliminarMulta(id) {
  const multas = await obtenerMultas();
  const idx = multas.findIndex(m => m[0] === id);
  if (idx === -1) throw new Error('Multa no encontrada para eliminar.');
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
