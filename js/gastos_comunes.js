// js/gastos_comunes.js

// Estado local simulado (reemplaza con llamadas reales a Google Sheets)
let timc = {};
let gastosComunes = [];
let residentes = [];

// Meses para desplegables y cálculos
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Función principal para cargar el módulo
async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  // Simula carga de datos (reemplaza con tu API)
  await cargarDatosSimulados();

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Gastos Comunes</h2>
    <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
      <div style="flex:1; max-width: 60%;">
        <label for="select-parcela">N° Parcela:</label><br>
        <input list="lista-parcelas" id="select-parcela" placeholder="1-26" style="width:80px; padding:5px;">
        <datalist id="lista-parcelas">
          ${Array.from({length:26},(_,i) => `<option value="${i+1}">`).join('')}
        </datalist>
      </div>
      <div style="flex:1; max-width: 30%;">
        <label for="input-anio">Año:</label><br>
        <input type="number" id="input-anio" value="${new Date().getFullYear()}" style="width:100px; padding:5px;">
      </div>
      <div id="mini-timc" style="border:1px solid #ccc; padding:8px; font-size:0.85em; max-width: 250px; background:#fafafa;">
        <strong>Tasas TIMC por Mes</strong>
        <table style="width:100%; font-size:0.85em; border-collapse: collapse; margin-top:6px;">
          <tbody id="timc-visual"></tbody>
        </table>
      </div>
    </div>

    <section id="detalle-gastos">
      <h3>Detalle de Gastos Comunes</h3>
      <table class="table" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Nombre Residente</th>
            <th>N° Parcela</th>
            <th>Valor Gasto Común</th>
            <th>Periodo</th>
            <th>Fecha Vencimiento</th>
            <th>Monto Pagado</th>
            <th>Saldo</th>
            <th>Interés</th>
            <th>Multa 1/4</th>
            <th>Meses Impagos</th>
            <th>Deuda Total</th>
            <th>Fecha Pago</th>
            <th>Método Pago</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody id="tbody-gastos">
          <tr><td colspan="14" style="text-align:center; padding:10px;">Seleccione parcela y año para ver los datos.</td></tr>
        </tbody>
      </table>
      <button class="btn" id="btnAgregarGasto">Agregar Gasto Común</button>
    </section>

    <div id="modalGasto" class="modal" style="display:none;">
      <div class="modal-content" style="max-width:600px; padding:20px;">
        <span class="close" id="cerrarModal" style="float:right; cursor:pointer; font-size:1.5em;">&times;</span>
        <h3>Agregar Gasto Común</h3>
        <form id="formGastoComun" style="display:flex; flex-wrap: wrap; gap:15px;">
          <div style="flex:1 1 100px;">
            <label for="inputNParcela">N° Parcela:</label>
            <input type="number" id="inputNParcela" min="1" max="26" required style="width:100%; padding:5px;">
          </div>
          <div style="flex:1 1 200px;">
            <label for="inputNombreResidente">Nombre Residente:</label>
            <input type="text" id="inputNombreResidente" readonly style="width:100%; padding:5px; background:#eee;">
          </div>
          <div style="flex:1 1 150px;">
            <label for="inputValorGasto">Valor Gasto Común:</label>
            <input type="number" id="inputValorGasto" readonly style="width:100%; padding:5px; background:#eee;">
          </div>
          <div style="flex:1 1 150px;">
            <label for="inputFechaPago">Fecha Pago:</label>
            <input type="date" id="inputFechaPago" required style="width:100%; padding:5px;">
          </div>
          <div style="flex:1 1 150px;">
            <label for="selectMesPago">Mes:</label>
            <select id="selectMesPago" required style="width:100%; padding:5px;">
              ${meses.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
          <div style="flex:1 1 150px;">
            <label for="inputMontoPagado">Monto Pagado:</label>
            <input type="number" id="inputMontoPagado" min="0" step="0.01" required style="width:100%; padding:5px;">
          </div>
          <div style="flex:1 1 150px;">
            <label for="selectMetodoPago">Método Pago:</label>
            <select id="selectMetodoPago" required style="width:100%; padding:5px;">
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </div>
          <div style="flex:1 1 100%;">
            <label for="inputComprobante">Comprobante Pago:</label>
            <input type="file" id="inputComprobante" style="width:100%; padding:5px;">
          </div>
          <div style="flex:1 1 100%; text-align:right;">
            <button type="submit" class="btn">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  actualizarMiniTablaTimc();
  filtrarDatos();

  // Eventos
  document.getElementById('btn-guardar-timc')?.addEventListener('click', guardarTimc);
  document.getElementById('select-parcela').addEventListener('input', filtrarDatos);
  document.getElementById('input-anio').addEventListener('input', filtrarDatos);

  document.getElementById('btnAgregarGasto').addEventListener('click', () => {
    document.getElementById('modalGasto').style.display = 'flex';
  });

  document.getElementById('cerrarModal').addEventListener('click', () => {
    document.getElementById('modalGasto').style.display = 'none';
    document.getElementById('formGastoComun').reset();
  });

  document.getElementById('inputNParcela').addEventListener('input', rellenarDatosResidente);

  document.getElementById('formGastoComun').addEventListener('submit', guardarGastoComun);

  ocultarSpinner();
}

// Funciones auxiliares (simuladas, reemplaza con tus llamadas reales)

async function cargarDatosSimulados() {
  // Simula carga de residentes
  residentes = [
    { N_Parcela: 1, Nombre_Completo: 'Juan Pérez', Valor_Gasto_Comun: 50000 },
    { N_Parcela: 2, Nombre_Completo: 'María Gómez', Valor_Gasto_Comun: 45000 },
    { N_Parcela: 3, Nombre_Completo: 'Carlos Díaz', Valor_Gasto_Comun: 52000 },
    // ... hasta parcela 26
  ];

  // Simula TIMC
  timc = {
    Enero: 0.5, Febrero: 0.5, Marzo: 0.5, Abril: 0.5, Mayo: 0.5, Junio: 0.5,
    Julio: 0.5, Agosto: 0.5, Septiembre: 0.5, Octubre: 0.5, Noviembre: 0.5, Diciembre: 0.5
  };

  // Simula gastos comunes
  gastosComunes = [
    {
      Nombre_Residente: 'Juan Pérez',
      N_Parcela: 1,
      Valor_Gasto_Comun: 50000,
      Periodo: 'Junio',
      Fecha_Vencimiento: '2025-06-10',
      Monto_Pagado: 45000,
      Deuda_Total: 6000,
      Interes: 1000,
      Multa_1_4: 1500,
      Meses_Inpagos: 1,
      Fecha_Pago: '2025-06-15',
      Metodo_Pago: 'Transferencia',
      Estado: 'Mora'
    },
    // Más registros...
  ];
}

function actualizarMiniTablaTimc() {
  const tbody = document.getElementById('timc-visual');
  if (!tbody) return;
  tbody.innerHTML = '';
  for (const mes of meses) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="border:1px solid #ccc; padding:4px;">${mes}</td><td style="border:1px solid #ccc; padding:4px; text-align:right;">${timc[mes] ?? 0}</td>`;
    tbody.appendChild(tr);
  }
}

function filtrarDatos() {
  const parcela = parseInt(document.getElementById('select-parcela').value);
  const anio = parseInt(document.getElementById('input-anio').value);

  if (!parcela || parcela < 1 || parcela > 26 || !anio) {
    mostrarMensajeTabla('Seleccione parcela (1-26) y año válidos.');
    return;
  }

  const filtrados = gastosComunes.filter(gasto =>
    gasto.N_Parcela === parcela &&
    new Date(gasto.Fecha_Vencimiento).getFullYear() === anio
  );

  if (filtrados.length === 0) {
    mostrarMensajeTabla('No hay registros para la parcela y año seleccionados.');
    return;
  }

  mostrarGastosEnTabla(filtrados);
}

function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById('tbody-gastos');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:10px;">${mensaje}</td></tr>`;
}

function mostrarGastosEnTabla(gastos) {
  const tbody = document.getElementById('tbody-gastos');
  if (!tbody) return;
  tbody.innerHTML = '';

  gastos.forEach(gasto => {
    const saldo = gasto.Monto_Pagado - (gasto.Deuda_Total - gasto.Interes - gasto.Multa_1_4);
    const mesIndex = meses.indexOf(gasto.Periodo);
    const timcMes = timc[gasto.Periodo] ?? 0;
    const interesCalculado = gasto.Valor_Gasto_Comun * timcMes / 100 / 12;
    const multa = (gasto.Valor_Gasto_Comun / 4) * gasto.Meses_Inpagos;
    const deudaTotal = gasto.Valor_Gasto_Comun + interesCalculado + multa;

    let estado = 'Al día';
    const hoy = new Date();
    const vencimiento = new Date(gasto.Fecha_Vencimiento);
    vencimiento.setDate(10);
    if (hoy > vencimiento && deudaTotal > 0) estado = 'Mora';
    if (deudaTotal <= 0) estado = 'Pagado';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="border:1px solid #ccc; padding:8px;">${gasto.Nombre_Residente}</td>
      <td style="border:1px solid #ccc; padding:8px;">${gasto.N_Parcela}</td>
      <td style="border:1px solid #ccc; padding:8px;">$${gasto.Valor_Gasto_Comun.toLocaleString()}</td>
      <td style="border:1px solid #ccc; padding:8px;">${gasto.Periodo}</td>
      <td style="border:1px solid #ccc; padding:8px;">${gasto.Fecha_Vencimiento}</td>
      <td style="border:1px solid #ccc; padding:8px;">$${gasto.Monto_Pagado.toLocaleString()}</td>
      <td style="border:1px solid #ccc; padding:8px;">$${saldo.toLocaleString()}</td>
      <td style="border:1px solid #ccc; padding:8px;">$${interesCalculado.toFixed(2)}</td>
      <td style="border:1px solid #ccc; padding:8px;">$${multa.toFixed(2)}</td>
      <td style="border:1px solid #ccc; padding:8px;">${gasto.Meses_Inpagos}</td>
      <td style="border:1px solid #ccc; padding:8px;">$${deudaTotal.toFixed(2)}</td>
      <td style="border:1px solid #ccc; padding:8px;">${gasto.Fecha_Pago}</td>
      <td style="border:1px solid #ccc; padding:8px;">${gasto.Metodo_Pago}</td>
      <td style="border:1px solid #ccc; padding:8px;">${estado}</td>
    `;
    tbody.appendChild(tr);
  });
}

function rellenarDatosResidente() {
  const nParcela = parseInt(document.getElementById('inputNParcela').value);
  const nombreInput = document.getElementById('inputNombreResidente');
  const valorInput = document.getElementById('inputValorGasto');

  if (!nParcela || nParcela < 1 || nParcela > 26) {
    nombreInput.value = '';
    valorInput.value = '';
    return;
  }

  const residente = residentes.find(r => r.N_Parcela === nParcela);
  if (residente) {
    nombreInput.value = residente.Nombre_Completo;
    valorInput.value = residente.Valor_Gasto_Comun;
  } else {
    nombreInput.value = '';
    valorInput.value = '';
  }
}

function guardarGastoComun(e) {
  e.preventDefault();

  const nParcela = parseInt(document.getElementById('inputNParcela').value);
  const nombreResidente = document.getElementById('inputNombreResidente').value.trim();
  const valorGasto = parseFloat(document.getElementById('inputValorGasto').value);
  const fechaPago = document.getElementById('inputFechaPago').value;
  const mesPago = document.getElementById('selectMesPago').value;
  const montoPagado = parseFloat(document.getElementById('inputMontoPagado').value);
  const metodoPago = document.getElementById('selectMetodoPago').value;

  if (!nParcela || !nombreResidente || !fechaPago || !mesPago || isNaN(montoPagado) || montoPagado < 0) {
    alert('Por favor, completa todos los campos correctamente.');
    return;
  }

  const anioPago = new Date(fechaPago).getFullYear();
  const mesIndex = meses.indexOf(mesPago);
  const fechaVenc = new Date(anioPago, mesIndex, 10);
  const fechaVencStr = fechaVenc.toISOString().split('T')[0];

  const hoy = new Date();
  let mesesImpagos = 0;
  if (hoy > fechaVenc) {
    mesesImpagos = Math.floor((hoy.getFullYear() - fechaVenc.getFullYear()) * 12 + (hoy.getMonth() - fechaVenc.getMonth()));
    if (hoy.getDate() > 10) mesesImpagos += 1;
  }

  const timcMes = timc[mesPago] ?? 0;
  const interes = valorGasto * timcMes / 100 / 12;
  const multa = (valorGasto / 4) * mesesImpagos;
  const deudaTotal = valorGasto + interes + multa;

  let estado = 'Al día';
  if (mesesImpagos > 0 && deudaTotal > 0) estado = 'Mora';
  if (deudaTotal <= 0) estado = 'Pagado';

  gastosComunes.push({
    Nombre_Residente: nombreResidente,
    N_Parcela: nParcela,
    Valor_Gasto_Comun: valorGasto,
    Periodo: mesPago,
    Fecha_Vencimiento: fechaVencStr,
    Monto_Pagado: montoPagado,
    Deuda_Total: deudaTotal,
    Interes: interes,
    Multa_1_4: multa,
    Meses_Inpagos: mesesImpagos,
    Fecha_Pago: fechaPago,
    Metodo_Pago: metodoPago,
    Estado: estado
  });

  alert('Gasto común guardado correctamente.');
  document.getElementById('modalGasto').style.display = 'none';
  document.getElementById('formGastoComun').reset();
  filtrarDatos();

  // TODO: Implementa integración real con Google Sheets y Drive para guardar datos y subir comprobantes
}

function limpiarMainContent() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
}

function mostrarSpinner() {
  // Implementa según tu app
}

function ocultarSpinner() {
  // Implementa según tu app
}

function mostrarMensaje(msg, tipo = 'info') {
  // Implementa según tu app
}

// Exporta la función para que se use desde index.html
window.cargarGastosComunes = cargarGastosComunes;
