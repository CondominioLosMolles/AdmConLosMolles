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


// -------- FUNCIONES PARA GOOGLE SHEETS DE RESIDENTES --------

async function obtenerResidentes() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A2:M` 
    });
    return res.result.values || [];
}

async function agregarResidente(datos) {
    const residentes = await obtenerResidentes();
    const lastId = residentes.length > 0 && residentes[residentes.length-1][0] ? parseInt(residentes[residentes.length-1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A:M`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [datos] }
    });
}

async function actualizarResidente(datos) {
    const residentes = await obtenerResidentes();
    const idx = residentes.findIndex(r => r[0] === datos[0]);
    if (idx === -1) throw new Error('Residente no encontrado');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A${row}:M${row}`, 
        valueInputOption: 'USER_ENTERED',
        resource: { values: [datos] }
    });
}

async function actualizarSaldoConvenioEnSheet(rowNumber, nuevoSaldo) {
    if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar.");
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!M${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [[nuevoSaldo]] }
    });
}

async function eliminarResidente(id) {
    const residentes = await obtenerResidentes();
    const idx = residentes.findIndex(r => r[0] === id);
    if (idx === -1) throw new Error('Residente no encontrado');
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

// -------- GASTOS COMUNES Y TIMC --------
async function obtenerPagosGC() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!A2:S` }); return res.result.values || []; }
async function agregarPagoGC(datos) { const pagos = await obtenerPagosGC(); const lastId = pagos.length > 0 && pagos[pagos.length-1][0] ? parseInt(pagos[pagos.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!A:S`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function obtenerTIMCs() { try { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!A2:C` }); return res.result.values || []; } catch (err) { console.error("ERROR AL OBTENER TIMC:", err); if (err.result && err.result.error.message.includes("Unable to parse range")) { throw new Error(`No se pudo encontrar la hoja llamada '${SHEET_CONFIG_TIMC}'. Revisa que el nombre sea exacto.`); } throw err; } }
async function guardarTIMC(anio, mes, valor) { try { const todosLosTIMCs = await obtenerTIMCs(); const filaExistenteIndex = todosLosTIMCs.findIndex(fila => fila[0] == anio && fila[1] == mes); if (filaExistenteIndex !== -1) { const filaParaActualizar = filaExistenteIndex + 2; await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!C${filaParaActualizar}`, valueInputOption: 'USER_ENTERED', resource: { values: [[valor]] } }); } else { const nuevaFila = [anio, mes, valor]; await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!A:C`, valueInputOption: 'USER_ENTERED', resource: { values: [nuevaFila] } }); } } catch (err) { console.error("ERROR AL GUARDAR TIMC:", err); throw err; } }

// -------- CONTABILIDAD (EGRESOS) --------
async function obtenerEgresos() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_EGRESOS}!A2:H` }); return res.result.values || []; }
async function agregarEgreso(datos) { const egresos = await obtenerEgresos(); const lastId = egresos.length > 0 && egresos[egresos.length-1][0] ? parseInt(egresos[egresos.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_EGRESOS}!A:H`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function eliminarEgreso(id) { const egresos = await obtenerEgresos(); const idx = egresos.findIndex(e => e[0] === id); if (idx === -1) throw new Error('No encontrado'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_EGRESOS, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } }); }

// -------- MANTENCIONES --------
async function obtenerMantenciones() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MANTENCIONES}!A2:H` }); return res.result.values || []; }
async function agregarMantencion(datos) { const mantenciones = await obtenerMantenciones(); const lastId = mantenciones.length > 0 && mantenciones[mantenciones.length - 1][0] ? parseInt(mantenciones[mantenciones.length - 1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MANTENCIONES}!A:H`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function eliminarMantencion(id) { const mantenciones = await obtenerMantenciones(); const idx = mantenciones.findIndex(m => m[0] === id); if (idx === -1) throw new Error('No encontrada'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_MANTENCIONES, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } }); }

// -------- MULTAS --------
async function obtenerMultas() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MULTAS}!A2:G` }); return res.result.values || []; }
async function agregarMulta(datos) { const multas = await obtenerMultas(); const lastId = multas.length > 0 && multas[multas.length - 1][0] ? parseInt(multas[multas.length - 1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MULTAS}!A:G`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function actualizarMulta(datos) { const multas = await obtenerMultas(); const idx = multas.findIndex(m => m[0] === datos[0]); if (idx === -1) throw new Error('Multa no encontrada para actualizar.'); const row = idx + 2; await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MULTAS}!A${row}:G${row}`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function eliminarMulta(id) { const multas = await obtenerMultas(); const idx = multas.findIndex(m => m[0] === id); if (idx === -1) throw new Error('Multa no encontrada para eliminar.'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_MULTAS, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } }); }

// -------- ASAMBLEAS --------
async function obtenerAsambleas() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_ASAMBLEAS}!A2:F` }); return res.result.values || []; }
async function agregarAsamblea(datos) { const asambleas = await obtenerAsambleas(); const lastId = asambleas.length > 0 && asambleas[asambleas.length - 1][0] ? parseInt(asambleas[asambleas.length - 1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_ASAMBLEAS}!A:F`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function eliminarAsamblea(id) { const asambleas = await obtenerAsambleas(); const idx = asambleas.findIndex(a => a[0] === id); if (idx === -1) throw new Error('No encontrada'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_ASAMBLEAS, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } }); }

// -------- COMUNICACIONES --------
async function obtenerComunicaciones() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_COMUNICACIONES}!A2:H` }); return res.result.values || []; }
async function agregarComunicacion(datos) { const comunicaciones = await obtenerComunicaciones(); const lastId = comunicaciones.length > 0 && comunicaciones[comunicaciones.length-1][0] ? parseInt(comunicaciones[comunicaciones.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_COMUNICACIONES}!A:H`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }

// -------- FUNCIONES DE CORREO Y COMPROBANTES --------
async function enviarCorreo(destinatarios, asunto, mensaje) {
  const toField = Array.isArray(destinatarios) ? destinatarios.join(',') : destinatarios;
  const email =
    `To: ${toField}\r\n` +
    `Subject: ${asunto}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    `${mensaje}`;
  const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');
  await gapi.client.gmail.users.messages.send({
    userId: 'me',
    resource: { raw: base64EncodedEmail }
  });
}

// NUEVO: Función para marcar un comprobante como enviado en la hoja Pagos_GC
async function marcarComprobanteEnviado(rowNumber) {
    if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar.");
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PAGOS_GC}!S${rowNumber}`, // Columna S
        valueInputOption: 'USER_ENTERED',
        resource: { values: [['SI']] }
    });
}
