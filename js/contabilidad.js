// js/contabilidad.js
// Módulo Contabilidad: muestra ingresos y egresos, permite agregar egresos y exportar

async function cargarContabilidad() {
  limpiarMainContent();
  mostrarSpinner();

  let pagos = [], egresos = [];
  try {
    pagos = await obtenerPagosGC();
    egresos = await obtenerEgresos();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Contabilidad</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <button class="btn" id="btnAgregarEgreso">Agregar Egreso</button>
      <button class="btn secondary" id="btnExportarIngresos">Exportar Ingresos</button>
      <button class="btn secondary" id="btnExportarEgresos">Exportar Egresos</button>
    </div>
    <div style="margin-bottom:32px;">
      <h3>Ingresos (Pagos y Multas)</h3>
      <div id="tablaIngresos"></div>
    </div>
    <div>
      <h3>Egresos</h3>
      <div id="tablaEgresos"></div>
    </div>
    <div id="modalEgreso" style="display:none;"></div>
  `;

  // (… todas las funciones internas como renderTablaIngresos, mostrarModalEgreso, exportar, eliminar … siguen igual …)

  ocultarSpinner();
}

// Evento de menú
document.querySelector('[data-module="contabilidad"]').addEventListener('click', cargarContabilidad);

// ✅ FUNCIÓN FALTANTE AGREGADA ABAJO
async function obtenerEgresos() {
  const sheetId = SPREADSHEET_ID; // Ya está definido globalmente en tu sistema
  const range = 'Egresos!A2:H';   // Asume encabezados en la fila 1 y datos desde A2

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const values = response.result.values;
    return values || [];
  } catch (error) {
    console.error("Error al obtener egresos:", error);
    throw new Error("No se pudieron cargar los egresos");
  }
}
