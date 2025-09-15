// VERSIÓN DEFINITIVAMENTE CORREGIDA
// js/sheets.js

// ID de tu Hoja de Cálculo
const SPREADSHEET_ID = '1LwA_L8nfAh8TNhyb4xHjiAXetvik_eqxY6HX9jMNU0Y';

// ID de tu Script
const SCRIPT_ID = 'AKfycbx774iPzBIhQPc7lxoCdj04p0luLxKugKgeUGcNuIsTt_nPlHkIE3NQ275NHYptI7Hy3g';
window.SCRIPT_ID = SCRIPT_ID;

// --- Nombres de las Hojas ---
const SHEET_RESIDENTES = 'Residentes';
const SHEET_PROVEEDORES = 'Proveedores';
const SHEET_PAGOS_GC = 'Pagos_GC';
const SHEET_CONFIG_TIMC = 'Config_TIMC';
const SHEET_EGRESOS = 'Egresos';
const SHEET_INGRESOS_EXTRA = 'Ingresos_Extra';
const SHEET_CATEGORIAS_EGRESOS = 'Categorias_Egresos';
const SHEET_MANTENCIONES = 'Mantenciones';
const SHEET_MULTAS = 'Multas';
const SHEET_ASAMBLEAS = 'Asambleas';
const SHEET_COMUNICACIONES = 'Comunicaciones';
const SHEET_CONFIGURACION = 'Configuracion';
const SHEET_CONVENIOS = 'Convenios';
const SHEET_CUOTAS_CONVENIO = 'Cuotas_Convenio';
const MAIN_DRIVE_FOLDER_NAME = 'Los Molles';

// --- IDs de las Hojas (para operaciones internas de la API) ---
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PROVEEDORES = 705052879;
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;


// -------- FUNCIONES DE GOOGLE DRIVE --------
async function findFolderId(name, parentId = 'root') {
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false and '${parentId}' in parents`;
    const response = await gapi.client.drive.files.list({
        q: q,
        fields: 'files(id)',
        spaces: 'drive'
    });
    return response.result.files.length > 0 ? response.result.files[0].id : null;
}

async function createFolder(name, parentId = 'root') {
    const metadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };
    const response = await gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id'
    });
    return response.result.id;
}

async function buscarOCrearRutaDeComprobantes(nombreCarpetaParcela, nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);

    let carpetaPagosId = await findFolderId('Pagos', carpetaPrincipalId);
    if (!carpetaPagosId) carpetaPagosId = await createFolder('Pagos', carpetaPrincipalId);

    let carpetaParcelaId = await findFolderId(nombreCarpetaParcela, carpetaPagosId);
    if (!carpetaParcelaId) carpetaParcelaId = await createFolder(nombreCarpetaParcela, carpetaPagosId);

    const nombreCarpetaMes = `${nombreMes} ${anio}`;
    let carpetaMesId = await findFolderId(nombreCarpetaMes, carpetaParcelaId);
    if (!carpetaMesId) carpetaMesId = await createFolder(nombreCarpetaMes, carpetaParcelaId);

    return carpetaMesId;
}

async function buscarOCrearRutaDeEgreso(nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) {
        throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);
    }
    let carpetaEgresosId = await findFolderId('Egresos', carpetaPrincipalId);
    if (!carpetaEgresosId) {
        carpetaEgresosId = await createFolder('Egresos', carpetaPrincipalId);
    }
    let carpetaAnioId = await findFolderId(anio.toString(), carpetaEgresosId);
    if (!carpetaAnioId) {
        carpetaAnioId = await createFolder(anio.toString(), carpetaEgresosId);
    }
    let carpetaMesId = await findFolderId(nombreMes, carpetaAnioId);
    if (!carpetaMesId) {
        carpetaMesId = await createFolder(nombreMes, carpetaAnioId);
    }
    return carpetaMesId;
}

async function buscarOCrearRutaDeIngreso(nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) {
        throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);
    }

    let carpetaIngresosId = await findFolderId('Ingresos', carpetaPrincipalId);
    if (!carpetaIngresosId) {
        carpetaIngresosId = await createFolder('Ingresos', carpetaPrincipalId);
    }

    let carpetaAnioId = await findFolderId(anio.toString(), carpetaIngresosId);
    if (!carpetaAnioId) {
        carpetaAnioId = await createFolder(anio.toString(), carpetaIngresosId);
    }

    let carpetaMesId = await findFolderId(nombreMes, carpetaAnioId);
    if (!carpetaMesId) {
        carpetaMesId = await createFolder(nombreMes, carpetaAnioId);
    }

    return carpetaMesId;
}

async function subirComprobante(file, folderId) {
    const metadata = {
        name: file.name,
        parents: [folderId]
    };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], {
        type: 'application/json'
    }));
    formData.append('file', file);
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
        }),
        body: formData,
    });
    return response.json();
}
// -------- CONFIGURACIÓN GLOBAL --------
async function obtenerConfiguracion() {
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONFIGURACION}!A:B`,
    });
    const values = response.result.values || [];
    const config = {};
    values.forEach(row => {
        if (row[0] && row[1]) config[row[0]] = row[1];
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
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIGURACION}!A:B`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [key, value]
                ]
            }
        });
    } else {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIGURACION}!B${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [value]
                ]
            }
        });
    }
}
// -------- RESIDENTES --------
async function obtenerResidentes() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A2:T`
    });
    return res.result.values || [];
}

async function agregarResidente(datos) {
    const residentes = await obtenerResidentes();
    const lastId = residentes.length > 0 && residentes[residentes.length - 1][0] ? parseInt(residentes[residentes.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A:T`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarResidente(datos) {
    const residentes = await obtenerResidentes();
    const idx = residentes.findIndex(r => r[0] === datos[0]);
    if (idx === -1) throw new Error('Residente no encontrado');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A${row}:T${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarSaldoConvenioEnSheet(rowNumber, nuevoSaldo) {
    if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar.");
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!M${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [
                [nuevoSaldo]
            ]
        }
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
// -------- PROVEEDORES --------
async function obtenerProveedores() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarProveedor(datosProveedor) {
    datosProveedor[0] = `P-${Date.now()}`;
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datosProveedor]
        }
    });
}

async function actualizarProveedor(datosProveedor) {
    const proveedores = await obtenerProveedores();
    const idProveedor = datosProveedor[0];
    const rowIndex = proveedores.findIndex(p => p[0] === idProveedor);

    if (rowIndex === -1) {
        throw new Error('Proveedor no encontrado para actualizar.');
    }
    const rowToUpdate = rowIndex + 2;

    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A${rowToUpdate}:H${rowToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datosProveedor]
        }
    });
}

async function eliminarProveedor(id) {
    const proveedores = await obtenerProveedores();
    const rowIndex = proveedores.findIndex(p => p[0] === id);

    if (rowIndex === -1) {
        throw new Error('Proveedor no encontrado para eliminar.');
    }
    const rowToDelete = rowIndex + 1;

    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_PROVEEDORES,
                        dimension: "ROWS",
                        startIndex: rowToDelete,
                        endIndex: rowToDelete + 1
                    }
                }
            }]
        }
    });
}
// -------- GASTOS COMUNES Y TIMC --------
async function obtenerPagosGC() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_PAGOS_GC}!A2:V`
        });
        return response.result.values || [];
    } catch (err) {
        console.error("Error grave en obtenerPagosGC:", err);
        return [];
    }
}

async function agregarPagoGC(datos) {
    const uniqueId = `PGC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    datos[0] = uniqueId;
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PAGOS_GC}!A:V`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarPagoGC(datos) {
    try {
        const response = await gapi.client.request({
            'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
            'method': 'POST',
            'body': {
                'function': 'actualizarPagoGC_GS',
                'parameters': [datos]
            }
        });

        const result = response.result;
        if (result.error) {
            throw new Error(result.error.details || 'Error en el script de Google.');
        }
        return result.response?.result;

    } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        console.error('Error al llamar a actualizarPagoGC_GS:', errorMessage);
        throw new Error(`Error del cliente al actualizar el pago: ${errorMessage}`);
    }
}

async function actualizarSaldoFavorResidente(rowNumber, nuevoSaldo) {
    if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar el saldo a favor.");

    try {
        const response = await gapi.client.request({
            'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
            'method': 'POST',
            'body': {
                'function': 'actualizarSaldoFavorResidente_GS',
                'parameters': [rowNumber, nuevoSaldo]
            }
        });

        const result = response.result;
        if (result.error) {
            throw new Error(result.error.details || 'Error en el script de Google al actualizar saldo a favor.');
        }
        return result.response?.result;

    } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        console.error('Error al llamar a actualizarSaldoFavorResidente_GS:', errorMessage);
        throw new Error(`Error del cliente al actualizar saldo a favor: ${errorMessage}`);
    }
}

async function marcarComprobanteEnviado(rowNum) {
    if (!rowNum || rowNum < 2) {
        throw new Error("Se requiere un número de fila válido para actualizar.");
    }
    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_PAGOS_GC}!S${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    ['SI']
                ]
            }
        });
    } catch (err) {
        console.error("Error al marcar el comprobante como enviado en Google Sheets:", err);
        throw new Error("No se pudo actualizar el estado del comprobante en la hoja de cálculo.");
    }
}


async function obtenerTIMCs() {
    try {
        const res = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIG_TIMC}!A2:C`
        });
        return res.result.values || [];
    } catch (err) {
        console.error("ERROR AL OBTENER TIMC:", err);
        throw err;
    }
}

async function guardarTIMC(anio, mes, valor) {
    try {
        const todos = await obtenerTIMCs();
        const idx = todos.findIndex(fila => fila[0] == anio && fila[1] == mes);
        if (idx !== -1) {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_CONFIG_TIMC}!C${idx + 2}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [valor]
                    ]
                }
            });
        } else {
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_CONFIG_TIMC}!A:C`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [anio, mes, valor]
                    ]
                }
            });
        }
    } catch (err) {
        console.error("ERROR AL GUARDAR TIMC:", err);
        throw err;
    }
}

async function obtenerEstadoDeCuenta(parcela) {
    const pagos = await obtenerPagosGC();
    return pagos
        .filter(p => p[2] == parcela)
        .map(p => ({
            idPago: p[0],
            periodo: p[4],
            descripcion: p[19] || `Gasto Común ${p[4]}`,
            deudaPendiente: parseFloat(p[12] || 0),
            estado: p[15],
            fechaPago: p[13],
            montoPagado: parseFloat(p[6] || 0),
            fechaVencimiento: p[5]
        }));
}

// -------- CONTABILIDAD (INGRESOS Y EGRESOS) --------
async function obtenerIngresosExtra() {
    try {
        const res = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_INGRESOS_EXTRA}!A2:G`
        });
        return res.result.values || [];
    } catch (err) {
        console.error("Error al obtener ingresos extra. Asegúrate que la hoja 'Ingresos_Extra' existe.", err);
        return [];
    }
}

async function agregarIngresoExtra(datos) {
    const ingresos = await obtenerIngresosExtra();
    const lastId = ingresos.length > 0 && ingresos[ingresos.length - 1][0] ? parseInt(ingresos[ingresos.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_INGRESOS_EXTRA}!A:G`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function obtenerCategoriasEgresos() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CATEGORIAS_EGRESOS}!A2:A`,
    });
    const values = res.result.values || [];
    return values.flat();
}

async function obtenerEgresos() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_EGRESOS}!A2:J`
    });
    return res.result.values || [];
}

async function agregarEgreso(datos) {
    const egresos = await obtenerEgresos();
    const lastId = egresos.length > 0 && egresos[egresos.length - 1][0] ? parseInt(egresos[egresos.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_EGRESOS}!A:J`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
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

// -------- CONVENIOS Y CUOTAS --------
async function obtenerConvenios() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONVENIOS}!A2:Z`
    });
    return res.result.values || [];
}

async function obtenerCuotasConvenio() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CUOTAS_CONVENIO}!A2:Z`
    });
    return res.result.values || [];
}
// --- Helpers de escritura a Google Sheets (para Convenios) ---

/**
 * Inserta filas en la hoja indicada.
 * @param {string} sheetName - Nombre de la hoja (p.ej. "Convenios" o "Cuotas_Convenio")
 * @param {Array<Array<any>>} rows - Arreglo de filas [[...], [...]]
 */
async function appendSheetData(sheetName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("appendSheetData: rows vacío o inválido.");
  }
  // Requiere gapi inicializado y SPREADSHEET_ID definido (ya lo tienes al inicio de este archivo)
  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: { values: rows }
  });
}

/** Agrega 1 fila a la hoja "Convenios" (compatibilidad con módulos antiguos). */
async function agregarConvenio(rows) {
  return appendSheetData(SHEET_CONVENIOS, rows);
}

/** Agrega N filas a la hoja "Cuotas_Convenio" (compatibilidad con módulos antiguos). */
async function agregarCuotasConvenio(rows) {
  return appendSheetData(SHEET_CUOTAS_CONVENIO, rows);
}

// -------- MANTENCIONES / TAREAS --------
async function obtenerTareas() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANTENCIONES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarTarea(datos) {
    const tareas = await obtenerTareas();
    const lastId = tareas.length > 0 && tareas[tareas.length - 1][0] ? parseInt(tareas[tareas.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANTENCIONES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarTarea(datos) {
    const tareas = await obtenerTareas();
    const rowIndex = tareas.findIndex(t => t[0] === datos[0]);
    if (rowIndex === -1) throw new Error('Tarea no encontrada para actualizar.');
    const rowToUpdate = rowIndex + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANTENCIONES}!A${rowToUpdate}:H${rowToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function eliminarTarea(id) {
    const tareas = await obtenerTareas();
    const idx = tareas.findIndex(t => t[0] === id);
    if (idx === -1) throw new Error('Tarea no encontrada para eliminar.');
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
        range: `${SHEET_MULTAS}!A2:G`
    });
    return res.result.values || [];
}

async function agregarMulta(datos) {
    const multas = await obtenerMultas();
    const lastId = multas.length > 0 && multas[multas.length - 1][0] ? parseInt(multas[multas.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MULTAS}!A:G`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarMulta(datos) {
    const multas = await obtenerMultas();
    const idx = multas.findIndex(m => m[0] === datos[0]);
    if (idx === -1) throw new Error('Multa no encontrada para actualizar.');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MULTAS}!A${row}:G${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

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
// -------- ASAMBLEAS --------
async function obtenerAsambleas() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_ASAMBLEAS}!A2:F`
    });
    return res.result.values || [];
}

async function agregarAsamblea(datos) {
    const asambleas = await obtenerAsambleas();
    const lastId = asambleas.length > 0 && asambleas[asambleas.length - 1][0] ? parseInt(asambleas[asambleas.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_ASAMBLEAS}!A:F`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
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
        range: `${SHEET_COMUNICACIONES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarComunicacion(datos) {
    const comunicaciones = await obtenerComunicaciones();
    const lastId = comunicaciones.length > 0 && comunicaciones[comunicaciones.length - 1][0] ? parseInt(comunicaciones[comunicaciones.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_COMUNICACIONES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}
// -------- FUNCIONES DE CORREO --------
// ===============================================================
async function enviarCorreo(destinatario, asunto, cuerpo) {
  try {
    const response = await gapi.client.request({
      'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
      'method': 'POST',
      'body': {
        'function': 'enviarCorreoComprobante_GS',
        'parameters': [destinatario, asunto, cuerpo]
      }
    });

    const result = response.result;
    if (result.error) {
      throw new Error(result.error.details || 'Error en el script de Google para enviar correo.');
    }
    return result.response?.result;

  } catch (err) {
    const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
    console.error('Error al llamar a enviarCorreoComprobante_GS:', errorMessage);
    throw new Error(`Error del cliente al enviar correo: ${errorMessage}`);
  }
}
// Append genérico (fila(s)) a cualquier hoja
async function appendSheetData(sheetName, rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('appendSheetData: rows vacío.');
  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows }
  });
}

// Busca la fila de una cuota por ID (col A) y devuelve { rowIndex, values }
async function findCuotaRowById(cuotaId) {
  const range = `${SHEET_CUOTAS_CONVENIO}!A:K`;
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID, range
  });
  const rows = res.result.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === cuotaId) return { rowIndex: i + 1, values: rows[i] };
  }
  return null;
}

// Actualiza pago de cuota: suma monto en G, recalcula H, setea I; opcionalmente setea link (J)
async function updateCuotaPago(cuotaId, monto, linkComprobante) {
  const found = await findCuotaRowById(cuotaId);
  if (!found) throw new Error(`No se encontró la cuota ${cuotaId}`);

  const row = found.values.slice();
  const rowIndex = found.rowIndex;

  const montoCuota = Number(row[5] || 0);               // F
  const pagadoAcum = Number(row[6] || 0) + Number(monto || 0); // G
  const saldo      = Math.max(0, montoCuota - pagadoAcum);     // H
  const estado     = saldo === 0 ? 'Pagado' : 'Pendiente';     // I

  row[6] = String(pagadoAcum);  // G
  row[7] = String(saldo);       // H
  row[8] = estado;              // I
  if (linkComprobante) row[9] = linkComprobante; // J

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_CUOTAS_CONVENIO}!A${rowIndex}:J${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return { estado, saldo, pagadoAcum, link: row[9] || '' };
}

// ======= Google Drive helpers para “Parcela N / Convenio pagos” =======

// Crea/encuentra carpeta hija dentro de un parentId
async function ensureChildFolder(parentId, childName) {
  const q = `'${parentId}' in parents and name = '${childName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const list = await gapi.client.drive.files.list({ q, fields: "files(id,name)" });
  if (list.result.files && list.result.files.length) return list.result.files[0].id;
  const create = await gapi.client.drive.files.create({
    resource: { name: childName, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id"
  });
  return create.result.id;
}

// Busca la carpeta raíz “Los Molles”, luego “Parcela N”, luego “Convenio pagos”
async function ensureFolderConvenioPagos(nParcela) {
  // Si ya tienes otra raíz, cambia el nombre aquí:
  const ROOT_NAME = 'Los Molles';
  // Buscar raíz
  const rootList = await gapi.client.drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${ROOT_NAME}' and trashed=false`,
    fields: 'files(id,name)'
  });
  if (!rootList.result.files || !rootList.result.files.length) {
    throw new Error(`No se encontró la carpeta raíz de Drive: "${ROOT_NAME}"`);
  }
  const rootId = rootList.result.files[0].id;

  const carpetaParcelaId = await ensureChildFolder(rootId, `Parcela ${nParcela}`);
  const carpetaConvenioId = await ensureChildFolder(carpetaParcelaId, 'Convenio pagos');
  return carpetaConvenioId;
}

// Sube archivo binario a Drive y devuelve {id, webViewLink}
async function subirComprobante(file, folderId) {
  const metadata = { name: file.name, parents: [folderId] };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + gapi.auth.getToken().access_token }),
      body: formData
    }
  );
  return resp.json();
}

// Sube comprobante a Parcela N / Convenio pagos y guarda link en J
async function attachReceiptAndLink(cuotaId, nParcela, file) {
  const folderId = await ensureFolderConvenioPagos(nParcela); // crea "Parcela X/Convenio pagos"
  const uploaded = await subirComprobante(file, folderId);    // sube el archivo

  // Permiso: cualquiera con el enlace puede ver
  try {
    await gapi.client.drive.permissions.create({
      fileId: uploaded.id,
      resource: { role: "reader", type: "anyone" }
    });
  } catch (e) {
    console.warn("No se pudo abrir permisos públicos para el comprobante:", e);
  }

  // Obtener link visible
  const info = await gapi.client.drive.files.get({
    fileId: uploaded.id,
    fields: "webViewLink,webContentLink"
  });
  const link = info.result.webViewLink || info.result.webContentLink || uploaded.webViewLink || "";

  // Guardar el link en la cuota (columna J)
  await updateCuotaPago(cuotaId, 0, link); // sin fecha → solo vincula link
  return link;
}


// === Ahora acepta fechaPago opcional y escribe en columna K
async function updateCuotaPago(cuotaId, monto, linkComprobante, fechaPago) {
  const found = await findCuotaRowById(cuotaId);
  if (!found) throw new Error(`No se encontró la cuota ${cuotaId}`);

  const row = found.values.slice();
  const rowIndex = found.rowIndex;

  const montoCuota = Number(row[5] || 0);                 // F
  const pagadoAcum = Number(row[6] || 0) + Number(monto || 0); // G
  const saldo      = Math.max(0, montoCuota - pagadoAcum);     // H
  const estado     = saldo === 0 ? 'Pagado' : 'Pendiente';     // I

  row[6] = String(pagadoAcum);  // G: Monto_Pagado_Acumulado
  row[7] = String(saldo);       // H: Saldo_Cuota
  row[8] = estado;              // I: Estado
  if (linkComprobante) row[9] = linkComprobante; // J: Link_Comprobante
  if (fechaPago) row[10] = fechaPago;           // K: Fecha_Pago (nueva)

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_CUOTAS_CONVENIO}!A${rowIndex}:K${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return { estado, saldo, pagadoAcum, link: row[9] || '', fechaPago: row[10] || '' };
}
