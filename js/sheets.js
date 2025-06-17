// js/sheets.js
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

// Sheet IDs según el orden de las hojas en tu Google Sheet.
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;

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

// -------- OTRAS FUNCIONES (EGRESOS, MANTENCIONES, ETC.) --------
// ... (Aquí van el resto de tus funciones que no necesitan cambios)
async function obtenerEgresos(){const res=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:SPREADSHEET_ID,range:'Egresos!A2:H'});return res.result.values||[]}
async function agregarEgreso(e){const t=await obtenerEgresos();const s=t.length>0?parseInt(t[t.length-1][0]):0;e[0]=(s+1).toString(),await gapi.client.sheets.spreadsheets.values.append({spreadsheetId:SPREADSHEET_ID,range:'Egresos!A:H',valueInputOption:'USER_ENTERED',resource:{values:[e]}})}
async function eliminarEgreso(e){const t=await obtenerEgresos();const s=t.findIndex(t=>t[0]===e);if(-1===s)throw new Error('No encontrado');const a=s+2;await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:SPREADSHEET_ID,resource:{requests:[{deleteDimension:{range:{sheetId:SHEET_ID_EGRESOS,dimension:"ROWS",startIndex:a-1,endIndex:a}}}]}})}
async function obtenerMantenciones(){const res=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:SPREADSHEET_ID,range:'Mantenciones!A2:H'});return res.result.values||[]}
async function agregarMantencion(e){const t=await obtenerMantenciones();const s=t.length>0?parseInt(t[t.length-1][0]):0;e[0]=(s+1).toString(),await gapi.client.sheets.spreadsheets.values.append({spreadsheetId:SPREADSHEET_ID,range:'Mantenciones!A:H',valueInputOption:'USER_ENTERED',resource:{values:[e]}})}
async function eliminarMantencion(e){const t=await obtenerMantenciones();const s=t.findIndex(t=>t[0]===e);if(-1===s)throw new Error('No encontrado');const a=s+2;await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:SPREADSHEET_ID,resource:{requests:[{deleteDimension:{range:{sheetId:SHEET_ID_MANTENCIONES,dimension:"ROWS",startIndex:a-1,endIndex:a}}}]}})}
async function obtenerMultas(){const res=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:SPREADSHEET_ID,range:'Multas!A2:G'});return res.result.values||[]}
async function agregarMulta(e){const t=await obtenerMultas();const s=t.length>0?parseInt(t[t.length-1][0]):0;e[0]=(s+1).toString(),await gapi.client.sheets.spreadsheets.values.append({spreadsheetId:SPREADSHEET_ID,range:'Multas!A:G',valueInputOption:'USER_ENTERED',resource:{values:[e]}})}
async function actualizarMulta(e){const t=await obtenerMultas();const s=t.findIndex(t=>t[0]===e[0]);if(-1===s)throw new Error('No encontrada');const a=s+2;await gapi.client.sheets.spreadsheets.values.update({spreadsheetId:SPREADSHEET_ID,range:`Multas!A${a}:G${a}`,valueInputOption:'USER_ENTERED',resource:{values:[e]}})}
async function eliminarMulta(e){const t=await obtenerMultas();const s=t.findIndex(t=>t[0]===e);if(-1===s)throw new Error('No encontrada');const a=s+2;await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:SPREADSHEET_ID,resource:{requests:[{deleteDimension:{range:{sheetId:SHEET_ID_MULTAS,dimension:"ROWS",startIndex:a-1,endIndex:a}}}]}})}
async function obtenerAsambleas(){const res=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:SPREADSHEET_ID,range:'Asambleas!A2:F'});return res.result.values||[]}
async function agregarAsamblea(e){const t=await obtenerAsambleas();const s=t.length>0?parseInt(t[t.length-1][0]):0;e[0]=(s+1).toString(),await gapi.client.sheets.spreadsheets.values.append({spreadsheetId:SPREADSHEET_ID,range:'Asambleas!A:F',valueInputOption:'USER_ENTERED',resource:{values:[e]}})}
async function eliminarAsamblea(e){const t=await obtenerAsambleas();const s=t.findIndex(t=>t[0]===e);if(-1===s)throw new Error('No encontrada');const a=s+2;await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:SPREADSHEET_ID,resource:{requests:[{deleteDimension:{range:{sheetId:SHEET_ID_ASAMBLEAS,dimension:"ROWS",startIndex:a-1,endIndex:a}}}]}})}
async function obtenerComunicaciones(){const res=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:SPREADSHEET_ID,range:'Comunicaciones!A2:H'});return res.result.values||[]}
async function agregarComunicacion(e){const t=await obtenerComunicaciones();const s=t.length>0?parseInt(t[t.length-1][0]):0;e[0]=(s+1).toString(),await gapi.client.sheets.spreadsheets.values.append({spreadsheetId:SPREADSHEET_ID,range:'Comunicaciones!A:H',valueInputOption:'USER_ENTERED',resource:{values:[e]}})}


// -------- FUNCIÓN AGREGADA PARA GUARDAR TIMC (VERSIÓN FINAL Y ROBUSTA) --------
async function guardarTMCenSheet(anio, mes, tmc) {
  const todosLosPagos = await obtenerPagosGC();
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const nombreMes = meses[mes - 1];

  // ***** INICIO DE LA CORRECCIÓN *****
  // Se crean los DOS formatos de fecha posibles para buscar en la hoja.
  const formatoNombreMes = `${nombreMes} ${anio}`;
  const mesFormateado = String(mes).padStart(2, '0'); // Convierte 6 en "06"
  const formatoNumeroMes = `${anio}-${mesFormateado}`;
  // ***** FIN DE LA CORRECCIÓN *****

  const actualizaciones = [];
  todosLosPagos.forEach((fila, index) => {
    const periodoEnSheet = fila[4]; // Columna E es "Periodo"
    if (periodoEnSheet) {
      const periodoEnSheetLower = periodoEnSheet.toLowerCase().trim();

      // ***** INICIO DE LA CORRECCIÓN *****
      // Ahora la función busca si el periodo coincide con CUALQUIERA de los dos formatos.
      if (periodoEnSheetLower === formatoNombreMes.toLowerCase() || periodoEnSheetLower === formatoNumeroMes) {
        actualizaciones.push({
          range: `Pagos_GC!J${index + 2}`, // Escribe en la columna J
          values: [[tmc]]
        });
      }
      // ***** FIN DE LA CORRECCIÓN *****
    }
  });

  if (actualizaciones.length === 0) {
    console.log(`No se encontraron registros para el período que coincida con "${formatoNombreMes}" o "${formatoNumeroMes}". No se actualizó el TIMC.`);
    return;
  }

  await gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: actualizaciones
    }
  });
}
