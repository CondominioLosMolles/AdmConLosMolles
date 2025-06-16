// js/gastos_comunes.js

// Estado local (debes reemplazar con carga real desde Google Sheets)
let timc = {};
let gastosComunes = [];
let residentes = [];

// Meses para desplegables y cálculos
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Función principal para cargar el módulo
function cargarGastosComunes() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2 style="display:flex; justify-content: space-between; align-items: center;">
      Gastos Comunes
      <div id="mini-timc" style="border:1px solid #ccc; padding:8px; font-size:0.85em; max-width: 250px; background:#fafafa;">
        <strong>Tasas TIMC por Mes</strong>
        <table style="width:100%; font-size:0.85em; border-collapse: collapse; margin-top:6px;">
          <tbody id="timc-visual"></tbody>
        </table>
      </div>
    </h2>

    <!-- Barra superior con filtros y TIMC -->
    <section id="filtros-timc" style="display:flex; gap:20px; align-items:center; margin-bottom:20px; flex-wrap: wrap;">

      <div>
        <label for="select-parcela">N° Parcela:</label><br>
        <input list="lista-parcelas" id="select-parcela" placeholder="1-26" style="width:80px; padding:5px;">
        <datalist id="lista-parcelas">
          ${Array.from({length:26},(_,i)=>`<option value="${i+1}">`).join('')}
        </datalist>
      </div>

      <div>
        <label for="input-anio">Año:</label><br>
        <input type="number" id="input-anio" value="${new Date().getFullYear()}" style="width:100px; padding:5px;">
      </div>

      <div>
        <label for="select-mes-timc">Mes TIMC:</label><br>
        <select id="select-mes-timc" style="padding:5px;">
          ${meses.map(m=>`<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>

      <div>
        <label for="input-timc">Valor TIMC:</label><br>
        <input type="number" id="input-timc" placeholder="Ej: 45" style="width:80px; padding:5px;">
      </div>

      <div style="align-self:flex-end;">
        <button id="btn-guardar-timc" style="padding:8px 15px;">Guardar TIMC</button>
      </div>
    </section>

    <!-- Tabla detalle gastos comunes -->
    <section id="detalle-gastos">
      <h3>Detalle de Gastos Comunes</h3>
      <table id="tabla-gastos" style="width:100%; border-collapse: collapse;">
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
      <button id="btn-abrir-form" style="margin-top:15px; padding:8px 20px;">Agregar Gasto Común</button>
    </section>

    <!-- Modal para agregar gasto común -->
    <div id="modal-gasto" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); justify-content:center; align-items:center; z-index:1000;">
      <div style="background:#fff; padding:20px; border-radius:8px; max-width:700px; width:90%; max-height:90vh; overflow-y:auto; box-shadow:0 0 10px rgba(0,0,0,0.3);">
        <h3>Agregar Gasto Común</h3>
        <form id="form-gasto-comun" style="display:flex; flex-wrap: wrap; gap:15px; align-items:flex-end;">
          <div>
            <label for="input-n-parcela">N° Parcela:</label><br>
            <input type="number" id="input-n-parcela" min="1" max="26" required style="padding:5px; width:100px;">
          </div>
          <div>
            <label for="input-nombre-residente">Nombre Residente:</label><br>
            <input type="text" id="input-nombre-residente" readonly style="padding:5px; width:250px; background:#eee;">
          </div>
          <div>
            <label for="input-valor-gasto">Valor Gasto Común:</label><br>
            <input type="number" id="input-valor-gasto" readonly style="padding:5px; width:120px; background:#eee;">
          </div>
          <div>
            <label for="input-fecha-pago">Fecha Pago:</label><br>
            <input type="date" id="input-fecha-pago" required style="padding:5px; width:160px;">
          </div>
          <div>
            <label for="select-mes-pago">Mes:</label><br>
            <select id="select-mes-pago" required style="padding:5px; width:120px;">
              ${meses.map(m=>`<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
          <div>
            <label for="input-monto-pagado">Monto Pagado:</label><br>
            <input type="number" id="input-monto-pagado" min="0" step="0.01" required style="padding:5px; width:120px;">
          </div>
          <div>
            <label for="select-metodo-pago">Método Pago:</label><br>
            <select id="select-metodo-pago" required style="padding:5px; width:140px;">
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </div>
          <div>
            <label>Comprobante Pago:</label><br>
            <input type="file" id="input-comprobante" style="padding:5px;">
          </div>
          <div style="flex-basis: 100%; text-align: right;">
            <button type="button" id="btn-cerrar-modal" style="margin-right:10px; padding:8px 15px;">Cancelar</button>
            <button type="submit" style="padding:8px 20px;">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Carga datos simulados (reemplaza con llamadas reales a Google Sheets)
  cargarDatosSimulados();

  // Actualiza mini tabla TIMC
  actualizarMiniTablaTimc();

  // Eventos
  document.getElementById('btn-guardar-timc').addEventListener('click', guardarTimc);
  document.getElementById('select-parcela').addEventListener('input', filtrarDatos);
  document.getElementById('input-anio').addEventListener('input', filtrarDatos);

  document.getElementById('btn-abrir-form').addEventListener('click', () => {
    document.getElementById('modal-gasto').style.display = 'flex';
  });
  document.getElementById('btn-cerrar-modal').addEventListener('click', () => {
    document.getElementById('modal-gasto').style.display = 'none';
    document.getElementById('form-gasto-comun').reset();
  });

  document.getElementById('input-n-parcela').addEventListener('input', rellenarDatosResidente);
  document.getElementById('form-gasto-comun').addEventListener('submit', guardarGastoComun);

  filtrarDatos();
}

// Actualiza la mini tabla TIMC compacta
function actualizarMiniTablaTimc() {
  const tbody = document.getElementById('timc-visual');
  tbody.innerHTML = '';
  for (const mes of meses) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="border:1px solid #ccc; padding:4px;">${mes}</td><td style="border:1px solid #ccc; padding:4px; text-align:right;">${timc[mes] ?? 0}</td>`;
    tbody.appendChild(tr);
  }
}

// Guarda TIMC en Google Sheets (placeholder - debes implementar integración real)
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

  // TODO: Implementa llamada a tu API o Google Sheets para guardar el valor en hoja "Pagos_GC" columna TIMC
  // Ejemplo: guardarTimcEnGoogleSheets(mes, valor);
}

// Filtra y muestra gastos comunes según parcela y año
function filtrarDatos() {
  const parcela = parseInt(document.getElementById('select-parcela').value);
  const anio = parseInt(document.getElementById('input-anio').value);

  if (!parcela || parcela < 1 || parcela > 26 || !anio) {
    mostrarMensajeTabla('Seleccione parcela (1-26) y año válidos.');
    return;
  }

  // Filtra gastos comunes por parcela y año (simulado)
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

// Al ingresar N° parcela en el modal, rellena nombre y valor gasto común
function rellenarDatosResidente() {
  const nParcela = parseInt(document.getElementById('input-n-parcela').value);
  const nombreInput = document.getElementById('input-nombre-residente');
  const valorInput = document.getElementById('input-valor-gasto');

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

// Guarda un nuevo gasto común (simulado)
function guardarGastoComun(event) {
  event.preventDefault();

  const nParcela = parseInt(document.getElementById('input-n-parcela').value);
  const nombreResidente = document.getElementById('input-nombre-residente').value.trim();
  const valorGasto = parseFloat(document.getElementById('input-valor-gasto').value);
  const fechaPago = document.getElementById('input-fecha-pago').value;
  const mesPago = document.getElementById('select-mes-pago').value;
  const montoPagado = parseFloat(document.getElementById('input-monto-pagado').value);
  const metodoPago = document.getElementById('select-metodo-pago').value;

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
  document.getElementById('modal-gasto').style.display = 'none';
  document.getElementById('form-gasto-comun').reset();
  filtrarDatos();

  // TODO: Implementa la integración para guardar en Google Sheets hoja Pagos_GC y subir comprobante a Drive
}

// Simula carga inicial de datos (reemplaza con tu integración real)
function cargarDatosSimulados() {
  residentes = [
    { N_Parcela: 1, Nombre_Completo: 'Juan Pérez', Valor_Gasto_Comun: 50000 },
    { N_Parcela: 2, Nombre_Completo: 'María Gómez', Valor_Gasto_Comun: 45000 },
    { N_Parcela: 3, Nombre_Completo: 'Carlos Díaz', Valor_Gasto_Comun: 52000 },
    // Agrega más residentes hasta parcela 26
  ];

  timc = {
    Enero: 0.5, Febrero: 0.5, Marzo: 0.5, Abril: 0.5, Mayo: 0.5, Junio: 0.5,
    Julio: 0.5, Agosto: 0.5, Septiembre: 0.5, Octubre: 0.5, Noviembre: 0.5, Diciembre: 0.5
  };

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
    // Más registros simulados...
  ];
}

// Exporta la función para que tu app la use
window.cargarGastosComunes = cargarGastosComunes;
