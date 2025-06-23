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
async function obtenerPagosGC() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!A2:R` }); return res.result.values || []; }
async function agregarPagoGC(datos) { const pagos = await obtenerPagosGC(); const lastId = pagos.length > 0 && pagos[pagos.length-1][0] ? parseInt(pagos[pagos.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!A:R`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function obtenerTIMCs() { try { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!A2:C` }); return res.result.values || []; } catch (err) { console.error("ERROR AL OBTENER TIMC:", err); if (err.result && err.result.error.message.includes("Unable to parse range")) { throw new Error(`No se pudo encontrar la hoja llamada '${SHEET_CONFIG_TIMC}'. Revisa que el nombre sea exacto.`); } throw err; } }
async function guardarTIMC(anio, mes, valor) { try { const todosLosTIMCs = await obtenerTIMCs(); const filaExistenteIndex = todosLosTIMCs.findIndex(fila => fila[0] == anio && fila[1] == mes); if (filaExistenteIndex !== -1) { const filaParaActualizar = filaExistenteIndex + 2; await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!C${filaParaActualizar}`, valueInputOption: 'USER_ENTERED', resource: { values: [[valor]] } }); } else { const nuevaFila = [anio, mes, valor]; await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!A:C`, valueInputOption: 'USER_ENTERED', resource: { values: [nuevaFila] } }); } } catch (err) { console.error("ERROR AL GUARDAR TIMC:", err); throw err; } }

// --- FUNCIÓN PARA ENVIAR CORREOS PROPORCIONADA POR TI ---
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


// -------- Aquí van el resto de tus funciones de sheets.js (Egresos, Mantenciones, etc.) --------
// ...
