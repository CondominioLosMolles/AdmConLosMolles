// js/gastos_comunes.js

// Estado simulado (reemplaza con carga real de Google Sheets)
let timc = {
  Enero: 0, Febrero: 0, Marzo: 0, Abril: 0, Mayo: 0, Junio: 0,
  Julio: 0, Agosto: 0, Septiembre: 0, Octubre: 0, Noviembre: 0, Diciembre: 0
};
let gastosComunes = [];
let residentes = [
  { N_Parcela: 1, Nombre_Completo: 'Juan Pérez', Valor_Gasto_Comun: 50000 },
  { N_Parcela: 2, Nombre_Completo: 'María Gómez', Valor_Gasto_Comun: 45000 },
  { N_Parcela: 3, Nombre_Completo: 'Carlos Díaz', Valor_Gasto_Comun: 52000 },
  // Completa hasta parcela 26
];

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Función para cargar el módulo
function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Gastos Comunes</h2>

    <section style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap;">
      <div style="flex:1; min-width: 150px;">
        <label for="select-parcela">N° Parcela:</label><br>
        <input list="lista-parcelas" id="select-parcela" placeholder="1-26" style="width:80px; padding:5px;">
        <datalist id="lista-parcelas">
          ${Array.from({length:26},(_,i)=>`<option value="${i+1}">`).join('')}
        </datalist>
      </div>
      <div style="flex:1; min-width: 150px;">
        <label for="input-anio">Año:</label><br>
        <input type="number" id="input-anio" value="${new Date().getFullYear()}" style="width:100px; padding:5px;">
      </div>
      <div style="flex:1; min-width: 200px;">
        <label>Ingresar TIMC</label><br>
        <select id="select-mes-timc" style="padding:5px; width:120px; margin-right:8px;">
          ${meses.map(m=>`<option value="${m}">${m}</option>`).join('')}
        </select>
        <input type="number" id="input-timc" placeholder="Valor TIMC" style="width:80px; padding:5px; margin-right:8px;">
        <button id="btn-guardar-timc" style="padding:6px 12px;">Agregar TIMC</button>
      </div>

      <div id="mini-timc" style="border:1px solid #ccc; padding:8px; font-size:0.85em; max-width: 250px; background:#fafafa;">
        <strong>Tasas TIMC por Mes</strong>
        <table style="width:100%; font-size:0.85em; border-collapse: collapse; margin-top:6px;">
          <tbody id="timc-visual"></tbody>
        </table>
      </div>
    </section>

    <section id="detalle-gastos" style="position:relative;">
      <h3>Detalle de Gastos Comunes</h3>
      <div style="overflow-x:auto;">
        <table class="table" style="width:100%; border-collapse: collapse; table-layout: fixed;">
          <thead>
            <tr>
              <th style="border:1px solid #ccc; padding:8px;">Nombre Residente</th>
              <th style="border:1px solid #ccc; padding:8px;">N° Parcela</th>
              <th style="border:1px solid #ccc; padding:8px;">Valor Gasto Común</th>
              <th style="border:1px solid #ccc; padding:8px;">Periodo</th>
              <th style="border:1px solid #ccc; padding:8px;">Fecha Vencimiento</th>
              <th style="border:1px solid #ccc; padding:8px;">Monto Pagado</th>
              <th style="border:1px solid #ccc; padding:8px;">Saldo</th>
              <th style="border:1px solid #ccc; padding:8px;">Interés</th>
              <th style="border:1px solid #ccc; padding:8px;">Multa 1/4</th>
              <th style="border:1px solid #ccc; padding:8px;">Meses Impagos</th>
              <th style="border:1px solid #ccc; padding:8px;">Deuda Total</th>
              <th style="border:1px solid #ccc; padding:8px;">Fecha Pago</th>
              <th style="border:1px solid #ccc; padding:8px;">Método Pago</th>
              <th style="border:1px solid #ccc; padding:8px;">Estado</th>
            </tr>
          </thead>
          <tbody id="tbody-gastos">
            <tr><td colspan="14" style="text-align:center; padding:10px;">Seleccione parcela y año para ver los datos.</td></tr>
          </tbody>
        </table>
      </div>

      <button id="btnAgregarGasto" title="Agregar Gasto Común" style="
        position: fixed;
        bottom: 30px;
        right: 30px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">+</button>
    </section>

    <div id="modalGasto" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); justify-content:center; align-items:center; z-index:1000;">
      <div style="background:#fff; padding:20px; border-radius:8px; max-width:600px; width:90%; max-height:90vh; overflow-y:auto; box-shadow:0 0 10px rgba(0,0,0,0.3);">
        <h3>Agregar Gasto Común</h3>
        <form id="formGastoComun" style="display:flex; flex-wrap: wrap; gap:15px; align-items:flex-end;">
          <div style="flex:1 1 100px;">
            <label for="inputNParcela">N° Parcela:</label>
            <input type="number" id="inputNParcela" min="1" max="26" required style="width:100%; padding:5px;">
          </div>
          <div style="flex:1 1 250px;">
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
            <button type="submit" style="padding:8px 20px;">Guardar</button>
            <button type="button" id="btnCerrarModal" style="padding:8px 20px; margin-left:10px;">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  actualizarMiniTablaTimc();
  filtrarDatos();

  // Eventos
  document.getElementById('btn-guardar-timc').addEventListener('click', guardarTimc);
  document.getElementById('select-parcela').addEventListener('input', filtrarDatos);
  document.getElementById('input-anio').addEventListener('input', filtrarDatos);

  document.getElementById('btnAgregarGasto').addEventListener('click', () => {
    document.getElementById('modalGasto').style.display = 'flex';
  });

  document.getElementById('btnCerrarModal').addEventListener('click', () => {
    document.getElementById('modalGasto').style.display = 'none';
    document.getElementById('formGastoComun').reset();
  });

  document.getElementById('inputNParcela').addEventListener('input', rellenarDatosResidente);

  document.getElementById('formGastoComun').addEventListener('submit', guardarGastoComun);

  ocultarSpinner();
}

// Actualiza la mini tabla TIMC compacta (2 líneas horizontales)
function actualizarMiniTablaTimc() {
  const tbody = document.getElementById('timc-visual');
  tbody.innerHTML = '';

  // Creamos dos filas para mostrar meses en dos líneas horizontales
  const fila1 = document.createElement('tr');
  const fila2 = document.createElement('tr');

  for (let i = 0; i < meses.length; i += 2) {
    // Mes superior
    const th1 = document.createElement('th');
    th1.style.border = '1px solid #ccc';
    th1.style.padding = '4px';
    th1.style.textAlign = 'center';
    th1.textContent = meses[i];
    fila1.appendChild(th1);

    // Mes inferior
    const th2 = document.createElement('th');
    th2.style.border = '1px solid #ccc';
    th2.style.padding = '4px';
    th2.style.textAlign = 'center';
    if (meses[i + 1]) {
      th2.textContent = meses[i + 1];
    } else {
      th2.textContent = '';
    }
    fila2.appendChild(th2);
  }

  tbody.appendChild(fila1);
  tbody.appendChild(fila2);

  // Segunda fila con valores TIMC
  const filaValores1 = document.createElement('tr');
  const filaValores2 = document.createElement('tr');

  for (let i = 0; i < meses.length; i += 2) {
    const td1 = document.createElement('td');
    td1.style.border = '1px solid #ccc';
    td1.style.padding = '4px';
    td1.style.textAlign = 'center';
    td1.textContent = timc[meses[i]] ?? 0;
    filaValores1.appendChild(td1);

    const td2 = document.createElement('td');
    td2.style.border = '1px solid #ccc';
    td2.style.padding = '4px';
    td2.style.textAlign = 'center';
    if (meses[i + 1]) {
      td2.textContent = timc[meses[i + 1]] ?? 0;
    } else {
      td2.textContent = '';
    }
    filaValores2.appendChild(td2);
  }

  tbody.appendChild(filaValores1);
  tbody.appendChild(filaValores2);
}

// Guarda TIMC (simulado, reemplaza con integración real)
function guardarTimc() {
  const mes = document.getElementById('select-mes-timc').value;
  const valor = parseFloat(document.getElementById('input-timc').value);
  if (isNaN(valor) || valor < 0) {
    alert('Ingresa un valor TIMC válido.');
    return;
  }
  timc[mes] = valor;
  actualizarMiniTablaTimc();
  alert(`TIMC para ${mes} guardado: ${valor}`);

  // TODO: Implementar guardado en Google Sheets (hoja Pagos_GC, columna TIMC)
}

// Filtra y muestra gastos comunes según parcela y año
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
  tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:10px;">${mensaje}</td></tr>`;
}

function mostrarGastosEnTabla(gastos) {
  const tbody = document.getElementById('tbody-gastos');
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

// Rellena datos del residente al ingresar número de parcela en el modal
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

// Guarda gasto común (simulado)
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

  // TODO: Implementar integración real con Google Sheets y Drive
}

// Funciones auxiliares para limpiar y mostrar spinner/mensajes (implementa según tu app)
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

// Exporta la función para que tu app la use
window.cargarGastosComunes = cargarGastosComunes;
