// js/gastos_comunes.js

const SHEET_PAGOS_GC = 'Pagos_GC';
const SHEET_RESIDENTES = 'Residentes';

// Utilidades para obtener meses y helpers
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Carga el módulo Gastos Comunes
async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  // Cargar datos necesarios
  let pagos = [];
  let residentes = [];
  try {
    pagos = await obtenerPagosGC();
    residentes = await obtenerResidentes();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  // Estado UI
  let parcelaSeleccionada = '';
  let añoSeleccionado = new Date().getFullYear().toString();

  // Render UI
  renderUI();

  function renderUI() {
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <h2>Gastos Comunes</h2>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;">
        <div style="flex:2;min-width:260px;">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:12px;">
            <label>N° Parcela:</label>
            <input id="gcParcela" type="number" min="1" max="26" style="width:60px;" placeholder="1-26" value="${parcelaSeleccionada}">
            <label>Año:</label>
            <input id="gcAnio" type="number" min="2020" max="2100" style="width:80px;" value="${añoSeleccionado}">
          </div>
          <div style="display:flex;gap:18px;align-items:end;">
            <form id="formTimc" style="display:flex;gap:8px;align-items:end;">
              <div>
                <label style="font-size:0.97em;">Ingresar TIMC mensual</label>
                <input id="timcValor" type="number" step="0.01" min="0" placeholder="Ej: 0.5" style="width:80px;">
              </div>
              <div>
                <label style="font-size:0.97em;">Mes</label>
                <select id="timcMes">
                  ${MESES.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('')}
                </select>
              </div>
              <button class="btn" type="submit" style="padding:7px 16px;">Guardar TIMC</button>
            </form>
            <div id="timcMsg" style="font-size:0.93em;color:#1ba94c;margin-left:8px;"></div>
          </div>
        </div>
        <div style="flex:1;min-width:210px;max-width:270px;">
          <div style="background:#f5faff;border-radius:8px;padding:12px 16px;box-shadow:0 1px 6px #4e91f91a;">
            <div style="font-weight:600;margin-bottom:6px;font-size:1.08em;text-align:right;">TIMC por Mes (${añoSeleccionado})</div>
            <table style="width:100%;font-size:0.98em;">
              <tbody id="tablaTimcMes"></tbody>
            </table>
          </div>
        </div>
      </div>
      <hr style="margin:18px 0 14px 0;">
      <h3 style="margin-bottom:8px;">Detalle de Gastos Comunes</h3>
      <div id="tablaGastosComunes"></div>
    `;

    document.getElementById('gcParcela').addEventListener('input', e => {
      parcelaSeleccionada = e.target.value;
      renderTablaGastos();
    });
    document.getElementById('gcAnio').addEventListener('input', e => {
      añoSeleccionado = e.target.value;
      renderTablaTimc();
      renderTablaGastos();
    });
    document.getElementById('formTimc').onsubmit = async (e) => {
      e.preventDefault();
      await guardarTimc();
    };

    renderTablaTimc();
    renderTablaGastos();
  }

  function renderTablaTimc() {
    // Mostrar TIMC por mes para el año seleccionado
    const timcPorMes = {};
    pagos.forEach(pg => {
      const periodo = pg[4] || ''; // Ej: "2025-06"
      const [anio, mes] = periodo.split('-');
      const timc = pg[9] || '';
      if (anio === añoSeleccionado && mes && timc) timcPorMes[mes] = timc;
    });
    let html = '';
    for (let i = 1; i <= 12; i++) {
      const mesStr = i.toString().padStart(2, '0');
      html += `<tr>
        <td style="padding:2px 6px;text-align:left;">${MESES[i-1]}</td>
        <td style="padding:2px 6px;text-align:right;">${timcPorMes[mesStr] || '-'}</td>
      </tr>`;
    }
    document.getElementById('tablaTimcMes').innerHTML = html;
  }

  async function guardarTimc() {
    const timc = document.getElementById('timcValor').value.trim();
    const mes = document.getElementById('timcMes').value;
    if (!timc || isNaN(timc) || timc <= 0) {
      mostrarMensaje('Ingrese un valor TIMC válido', 'error');
      return;
    }
    // Busca si ya existe un registro para ese año/mes (puede ser por parcela 0 o un registro general)
    const periodo = `${añoSeleccionado}-${mes.padStart(2,'0')}`;
    let idx = pagos.findIndex(pg => (pg[4] === periodo && (!parcelaSeleccionada || pg[2] === parcelaSeleccionada)));
    if (idx === -1) {
      // Insertar nuevo registro de TIMC (puedes ajustar lógica según tu modelo)
      const nuevaFila = [
        '', // ID_Pago (autoincremental)
        '', // Nombre_Residente
        parcelaSeleccionada || '', // N_Parcela (vacío si es global)
        '', // Valor_Gasto_Comun
        periodo, // Periodo
        '', // Fecha_Vencimiento
        '', // MontoPagado
        '', // Saldo Pendiente o a favor
        '', // Interes
        timc, // TIMC
        '', // Multa_1/4
        '', // Meses_Inpagos
        '', // Deuda_Total
        '', // Fecha_Pago
        '', // Metodo_Pago
        '', // Estado
        ''  // ID_Comprobante_Drive
      ];
      await agregarPagoGC(nuevaFila);
      pagos.push(nuevaFila);
    } else {
      // Actualizar registro existente
      pagos[idx][9] = timc;
      await actualizarPagoGC(pagos[idx]);
    }
    mostrarMensaje('TIMC guardado correctamente');
    document.getElementById('timcValor').value = '';
    renderTablaTimc();
  }

  function renderTablaGastos() {
    // Filtrar por parcela y año
    let filtrados = pagos.filter(pg => {
      const periodo = pg[4] || '';
      const [anio, ] = periodo.split('-');
      if (parcelaSeleccionada && pg[2] !== parcelaSeleccionada) return false;
      if (añoSeleccionado && anio !== añoSeleccionado) return false;
      return pg[1] && pg[2]; // Solo filas con residente y parcela
    });

    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Nombre Residente</th>
            <th>N° Parcela</th>
            <th>Valor GC</th>
            <th>Periodo</th>
            <th>Vencimiento</th>
            <th>Monto Pagado</th>
            <th>Saldo</th>
            <th>Interés</th>
            <th>TIMC</th>
            <th>Multa 1/4</th>
            <th>Meses Impagos</th>
            <th>Deuda Total</th>
            <th>Fecha Pago</th>
            <th>Método</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const pg of filtrados) {
      const [
        id, nombre, parcela, valorGC, periodo, fechaVenc, montoPagado, saldo, interes, timc,
        multa, mesesImp, deudaTotal, fechaPago, metodo, estado
      ] = pg;

      // Fecha de vencimiento: día 10 del mes del periodo
      let venc = '';
      if (periodo) {
        const [anio, mes] = periodo.split('-');
        venc = `${anio}-${mes}-10`;
      }

      html += `
        <tr>
          <td title="${nombre}">${nombre || '-'}</td>
          <td title="${parcela}">${parcela || '-'}</td>
          <td title="${valorGC}">${valorGC || '-'}</td>
          <td title="${periodo}">${periodo || '-'}</td>
          <td title="${venc}">${venc || '-'}</td>
          <td title="${montoPagado}">${montoPagado || '-'}</td>
          <td title="${saldo}">${saldo || '-'}</td>
          <td title="${interes}">${interes || '-'}</td>
          <td title="${timc}">${timc || '-'}</td>
          <td title="${multa}">${multa || '-'}</td>
          <td title="${mesesImp}">${mesesImp || '-'}</td>
          <td title="${deudaTotal}">${deudaTotal || '-'}</td>
          <td title="${fechaPago}">${fechaPago || '-'}</td>
          <td title="${metodo}">${metodo || '-'}</td>
          <td title="${estado}">${estado || '-'}</td>
        </tr>
      `;
    }
    html += '</tbody></table>';
    document.getElementById('tablaGastosComunes').innerHTML = html;
  }

  ocultarSpinner();
}

// --- FUNCIONES DE INTEGRACIÓN CON SHEETS ---

// Lee todos los pagos GC
async function obtenerPagosGC() {
  const resp = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_PAGOS_GC
  });
  return resp.result.values ? resp.result.values.slice(1) : [];
}

// Lee todos los residentes
async function obtenerResidentes() {
  const resp = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_RESIDENTES
  });
  return resp.result.values ? resp.result.values.slice(1) : [];
}

// Agrega un pago GC (incluye TIMC)
async function agregarPagoGC(fila) {
  await gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_PAGOS_GC,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [fila] }
  });
}

// Actualiza un pago GC (por fila, requiere lógica para encontrar la fila real si es necesario)
async function actualizarPagoGC(fila) {
  // Busca por Periodo y Parcela
  const pagos = await obtenerPagosGC();
  const idx = pagos.findIndex(pg => pg[4] === fila[4] && pg[2] === fila[2]);
  if (idx === -1) return;
  const row = idx + 2;
  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_PAGOS_GC}!A${row}:Q${row}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [fila] }
  });
}

// --- FIN FUNCIONES SHEETS ---

// Asegúrate de que el menú dispare cargarGastosComunes al hacer click
document.querySelector('[data-module="gastos-comunes"]').addEventListener('click', cargarGastosComunes);
