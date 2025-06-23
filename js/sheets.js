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
const SHEET_CONFIGURACION = 'Configuracion'; // NUEVO

// --- IDs de las Hojas (para operaciones de borrado) ---
// (Se mantienen los IDs existentes)
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;


// -------- FUNCIONES DE CONFIGURACIÓN GLOBAL (NUEVO) --------
async function obtenerConfiguracion() {
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONFIGURACION}!A:B`,
    });
    const values = response.result.values || [];
    const config = {};
    values.forEach(row => {
        if (row[0] && row[1]) {
            config[row[0]] = row[1];
        }
    });
    return config;
}

async function actualizarConfiguracion(key, value) {
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONFIGURACION}!A:A`,
    });
    const keys = response.result.values || [];
    const rowIndex = keys.findIndex(row => row[0] === key);
    if (rowIndex === -1) {
        // Si la clave no existe, la añade al final
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIGURACION}!A:B`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [[key, value]] }
        });
    } else {
        // Si la clave existe, actualiza el valor en la columna B
        const rowToUpdate = rowIndex + 1;
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIGURACION}!B${rowToUpdate}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [[value]] }
        });
    }
}


// -------- FUNCIONES DE RESIDENTES (sin cambios, solo se incluyen para integridad) --------
async function obtenerResidentes() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_RESIDENTES}!A2:M` }); return res.result.values || []; }
async function agregarResidente(datos) { const residentes = await obtenerResidentes(); const lastId = residentes.length > 0 && residentes[residentes.length-1][0] ? parseInt(residentes[residentes.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_RESIDENTES}!A:M`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } });}
async function actualizarResidente(datos) { const residentes = await obtenerResidentes(); const idx = residentes.findIndex(r => r[0] === datos[0]); if (idx === -1) throw new Error('Residente no encontrado'); const row = idx + 2; await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_RESIDENTES}!A${row}:M${row}`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } });}
async function actualizarSaldoConvenioEnSheet(rowNumber, nuevoSaldo) { if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar."); await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_RESIDENTES}!M${rowNumber}`, valueInputOption: 'USER_ENTERED', resource: { values: [[nuevoSaldo]] } });}
async function eliminarResidente(id) { const residentes = await obtenerResidentes(); const idx = residentes.findIndex(r => r[0] === id); if (idx === -1) throw new Error('Residente no encontrado'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_RESIDENTES, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } });}

// -------- GASTOS COMUNES Y TIMC (sin cambios) --------
async function obtenerPagosGC() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!A2:S` }); return res.result.values || []; }
async function agregarPagoGC(datos) { const pagos = await obtenerPagosGC(); const lastId = pagos.length > 0 && pagos[pagos.length-1][0] ? parseInt(pagos[pagos.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!A:S`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function obtenerTIMCs() { try { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!A2:C` }); return res.result.values || []; } catch (err) { console.error("ERROR AL OBTENER TIMC:", err); if (err.result && err.result.error.message.includes("Unable to parse range")) { throw new Error(`No se pudo encontrar la hoja llamada '${SHEET_CONFIG_TIMC}'. Revisa que el nombre sea exacto.`); } throw err; } }
async function guardarTIMC(anio, mes, valor) { try { const todosLosTIMCs = await obtenerTIMCs(); const filaExistenteIndex = todosLosTIMCs.findIndex(fila => fila[0] == anio && fila[1] == mes); if (filaExistenteIndex !== -1) { const filaParaActualizar = filaExistenteIndex + 2; await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!C${filaParaActualizar}`, valueInputOption: 'USER_ENTERED', resource: { values: [[valor]] } }); } else { const nuevaFila = [anio, mes, valor]; await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_CONFIG_TIMC}!A:C`, valueInputOption: 'USER_ENTERED', resource: { values: [nuevaFila] } }); } } catch (err) { console.error("ERROR AL GUARDAR TIMC:", err); throw err; } }

// -------- CONTABILIDAD (EGRESOS) (sin cambios) --------
async function obtenerEgresos() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_EGRESOS}!A2:H` }); return res.result.values || []; }
async function agregarEgreso(datos) { const egresos = await obtenerEgresos(); const lastId = egresos.length > 0 && egresos[egresos.length-1][0] ? parseInt(egresos[egresos.length-1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_EGRESOS}!A:H`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function eliminarEgreso(id) { const egresos = await obtenerEgresos(); const idx = egresos.findIndex(e => e[0] === id); if (idx === -1) throw new Error('No encontrado'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_EGRESOS, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } }); }

// ... (Resto de funciones de Mantenciones, Multas, etc. se mantienen igual)
// -------- MANTENCIONES --------
async function obtenerMantenciones() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MANTENCIONES}!A2:H` }); return res.result.values || []; }
async function agregarMantencion(datos) { const mantenciones = await obtenerMantenciones(); const lastId = mantenciones.length > 0 && mantenciones[mantenciones.length - 1][0] ? parseInt(mantenciones[mantenciones.length - 1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MANTENCIONES}!A:H`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
async function eliminarMantencion(id) { const mantenciones = await obtenerMantenciones(); const idx = mantenciones.findIndex(m => m[0] === id); if (idx === -1) throw new Error('No encontrada'); const row = idx + 2; await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: SHEET_ID_MANTENCIONES, dimension: "ROWS", startIndex: row - 1, endIndex: row } } }] } }); }
// ... etc.

// -------- FUNCIONES DE CORREO Y COMPROBANTES (sin cambios) --------
async function enviarCorreo(destinatarios, asunto, mensaje) { const toField = Array.isArray(destinatarios) ? destinatarios.join(',') : destinatarios; const email = `To: ${toField}\r\nSubject: ${asunto}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${mensaje}`; const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_'); await gapi.client.gmail.users.messages.send({ userId: 'me', resource: { raw: base64EncodedEmail } });}
async function marcarComprobanteEnviado(rowNumber) { if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar."); await gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_PAGOS_GC}!S${rowNumber}`, valueInputOption: 'USER_ENTERED', resource: { values: [['SI']] } });}
