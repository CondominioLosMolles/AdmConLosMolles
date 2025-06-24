// js/sheets.js
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

// --- Nombres de las Hojas ---
const SHEET_RESIDENTES = 'Residentes';
const SHEET_PROVEEDORES = 'Proveedores'; // <-- NUEVA HOJA
const SHEET_PAGOS_GC = 'Pagos_GC';
const SHEET_CONFIG_TIMC = 'Config_TIMC';
const SHEET_EGRESOS = 'Egresos';
const SHEET_CATEGORIAS_EGRESOS = 'Categorias_Egresos';
const SHEET_MANTENCIONES = 'Mantenciones'; // Ahora usado para "Tareas"
const SHEET_MULTAS = 'Multas';
const SHEET_ASAMBLEAS = 'Asambleas';
const SHEET_COMUNICACIONES = 'Comunicaciones';
const SHEET_CONFIGURACION = 'Configuracion';
const MAIN_DRIVE_FOLDER_NAME = 'Los Molles';

// --- IDs de las Hojas ---
// (Asegúrate de tener el ID de la nueva hoja de Proveedores si necesitas operaciones de borrado complejas)
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PROVEEDORES = 705052879; // ¡OJO! Este ID es un ejemplo, debes obtener el real de tu hoja.
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;


// --- FUNCIONES DE PROVEEDORES ---
async function obtenerProveedores() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarProveedor(datos) {
    const proveedores = await obtenerProveedores();
    const lastId = proveedores.length > 0 && proveedores[proveedores.length-1][0] ? parseInt(proveedores[proveedores.length-1][0]) : 0;
    datos[0] = (lastId + 1).toString(); // Asigna el nuevo ID
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [datos] }
    });
}

async function actualizarProveedor(datos) {
    const proveedores = await obtenerProveedores();
    const rowIndex = proveedores.findIndex(p => p[0] === datos[0]);
    if (rowIndex === -1) throw new Error('Proveedor no encontrado para actualizar.');
    const rowToUpdate = rowIndex + 2; // +1 por header, +1 por índice base 0
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A${rowToUpdate}:H${rowToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: [datos] }
    });
}

async function eliminarProveedor(id) {
    const proveedores = await obtenerProveedores();
    const rowIndex = proveedores.findIndex(p => p[0] === id);
    if (rowIndex === -1) throw new Error('Proveedor no encontrado para eliminar.');
    const rowToDelete = rowIndex + 2;
    // La eliminación de filas requiere una operación más compleja (batchUpdate)
    // que necesita el GID (Sheet ID) de la hoja.
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_PROVEEDORES, // <-- Necesitas el GID real de tu hoja 'Proveedores'
                        dimension: "ROWS",
                        startIndex: rowToDelete - 1,
                        endIndex: rowToDelete
                    }
                }
            }]
        }
    });
}

// ... (El resto de tus funciones de sheets.js como obtenerResidentes, agregarEgreso, etc., permanecen aquí sin cambios)
// -------- FUNCIONES DE GOOGLE DRIVE --------
async function findFolderId(name, parentId = 'root') {
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false and '${parentId}' in parents`;
    const response = await gapi.client.drive.files.list({ q: q, fields: 'files(id)', spaces: 'drive' });
    return response.result.files.length > 0 ? response.result.files[0].id : null;
}
async function createFolder(name, parentId = 'root') {
    const metadata = { name: name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
    const response = await gapi.client.drive.files.create({ resource: metadata, fields: 'id' });
    return response.result.id;
}
async function buscarOCrearRutaDeEgreso(nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);
    let carpetaPagosId = await findFolderId('Pagos', carpetaPrincipalId);
    if (!carpetaPagosId) carpetaPagosId = await createFolder('Pagos', carpetaPrincipalId);
    const nombreCarpetaMes = `${nombreMes} ${anio}`;
    let carpetaMesId = await findFolderId(nombreCarpetaMes, carpetaPagosId);
    if (!carpetaMesId) carpetaMesId = await createFolder(nombreCarpetaMes, carpetaPagosId);
    return carpetaMesId;
}
async function subirComprobante(file, folderId) {
    const metadata = { name: file.name, parents: [folderId] };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
        body: formData,
    });
    return response.json();
}
// -------- FUNCIONES DE CONFIGURACIÓN GLOBAL --------
async function obtenerConfiguracion() { /* ...código existente... */ }
async function actualizarConfiguracion(key, value) { /* ...código existente... */ }
// -------- FUNCIONES DE RESIDENTES --------
async function obtenerResidentes() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_RESIDENTES}!A2:AC` }); return res.result.values || []; } // Ampliado a AC
// ... resto de funciones de residentes ...
// -------- GASTOS COMUNES Y TIMC --------
async function obtenerPagosGC() { /* ...código existente... */ }
// ... resto de funciones de GC y TIMC ...
// -------- CONTABILIDAD (EGRESOS) --------
async function obtenerEgresos() { /* ...código existente... */ }
async function agregarEgreso(datos) { /* ...código existente... */ }
// ... resto de funciones de egresos y categorías ...
// -------- MANTENCIONES --------
async function obtenerMantenciones() { const res = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MANTENCIONES}!A2:H` }); return res.result.values || []; }
async function agregarMantencion(datos) { const mantenciones = await obtenerMantenciones(); const lastId = mantenciones.length > 0 && mantenciones[mantenciones.length - 1][0] ? parseInt(mantenciones[mantenciones.length - 1][0]) : 0; datos[0] = (lastId + 1).toString(); await gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${SHEET_MANTENCIONES}!A:H`, valueInputOption: 'USER_ENTERED', resource: { values: [datos] } }); }
// ... resto de funciones (multas, asambleas, etc) ...
