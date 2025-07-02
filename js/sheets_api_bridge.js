// js/sheets_api_bridge.js - VERSIÓN FINAL CON FETCH API

// El ID de tu script de Google ahora se toma desde sheets.js
const SCRIPT_URL = `https://script.google.com/macros/s/${SCRIPT_ID}/exec`;

/**
 * Función genérica para llamar al backend de Apps Script usando fetch.
 * @param {string} functionName - El nombre de la función a llamar en Code.gs.
 * @param {Array<any>} args - Un array con los argumentos para la función.
 * @returns {Promise<any>}
 */
// js/sheets_api_bridge.js -> MODIFICADO

async function runGAS(functionName, ...args) {
  const token = gapi.client.getToken();
  if (!token) {
    throw new Error("Usuario no autenticado. No se puede llamar al script.");
  }

  // Lógica para manejar la solicitud de verificación (preflight)
  const preflightResponse = await fetch(SCRIPT_URL, {
    method: 'OPTIONS',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json'
    },
    body: 'OPTIONS', // Enviamos un cuerpo simple para ser detectado por Apps Script
    redirect: 'follow'
  });

  if (!preflightResponse.ok) {
     throw new Error(`Error en la verificación CORS: ${preflightResponse.statusText}`);
  }

  // Si la verificación es exitosa, procedemos con la solicitud POST real
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      functionName: functionName,
      parameters: args,
    }),
    redirect: 'follow'
  });

  if (!response.ok) {
    const errorResult = await response.json();
    throw new Error(`Error del servidor: ${errorResult.error?.message || response.statusText}`);
  }

  const result = await response.json();
  if (result.error) {
     throw new Error(`Error en la ejecución del script: ${result.error.message}`);
  }
  
  return result.response;
}

// --- El resto de las funciones no cambian, ya que usan runGAS ---

async function agregarPagoGC(datosParaSheet) {
  console.log("Enviando datos de nuevo pago al servidor:", datosParaSheet);
  return await runGAS('agregarPagoGC_GS', datosParaSheet);
}

async function actualizarPagoGC(datosParaActualizar) {
  console.log("Enviando datos de actualización de pago al servidor:", datosParaActualizar);
  return await runGAS('actualizarPagoGC_GS', datosParaActualizar);
}

async function actualizarSaldoFavorResidente(rowNumber, nuevoSaldo) {
  return await runGAS('actualizarSaldoFavorResidente_GS', rowNumber, nuevoSaldo);
}

async function actualizarSaldoConvenioEnSheet(rowNumber, nuevoSaldo) {
    console.log(`Actualizando saldo convenio para fila ${rowNumber} a ${nuevoSaldo}`);
    // Asegúrate de tener una función "actualizarSaldoConvenio_GS" en tu Code.gs
    return await runGAS('actualizarSaldoConvenio_GS', rowNumber, nuevoSaldo);
}

async function enviarCorreo(destinatario, asunto, cuerpoHtml) {
  console.log("Solicitando envío de correo al servidor...");
  return await runGAS('enviarCorreoComprobante_GS', destinatario, asunto, cuerpoHtml);
}

async function marcarComprobanteEnviado(rowNum) {
  console.log(`Marcando comprobante como enviado para fila: ${rowNum}`);
  return await runGAS('marcarComprobanteEnviado_GS', rowNum);
}

async function obtenerResidentes() {
    return await runGAS('obtenerDatos_GS', 'Residentes');
}

async function obtenerPagosGC() {
    return await runGAS('obtenerDatos_GS', 'Pagos_GC');
}

async function obtenerTIMCs() {
    return await runGAS('obtenerDatos_GS', 'Config_TIMC');
}

async function guardarTIMC(anio, mes, valor) {
    return await runGAS('guardarTIMC_GS', anio, mes, valor);
}
