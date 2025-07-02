// js/sheets_api_bridge.js

/**
 * Función genérica para manejar las llamadas a google.script.run con Promesas (async/await)
 * @param {string} functionName - El nombre de la función a llamar en el servidor (en Code.gs).
 * @param {...any} args - Los argumentos a pasar a la función del servidor.
 * @returns {Promise<any>}
 */
function runGAS(functionName, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName](...args);
  });
}

// --- Definiciones de las funciones que llamará gastos_comunes.js ---

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

// Las funciones para obtener datos también deben usar este puente
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
