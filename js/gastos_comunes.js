// js/gastos_comunes.js

// Variables de estado locales (puedes reemplazar con integración real a Google Sheets)
let timc = {}; // { 'Enero': valor, 'Febrero': valor, ... }
let gastosComunes = []; // Lista de gastos comunes cargados
let residentes = []; // Lista de residentes con { N_Parcela, Nombre_Completo, Valor_Gasto_Comun }

// Meses para desplegables y cálculos
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Función principal para cargar el módulo
function cargarGastosComunes() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Gastos Comunes</h2>

    <!-- Barra superior con filtros y TIMC -->
    <section id="filtros-timc" style="display:flex; gap:20px; align-items:center; margin-bottom:30px; flex-wrap: wrap;">

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

    <!-- Visualización TIMC anual -->
    <section id="visual-timc" style="margin-bottom:30px;">
      <h3>Tasas TIMC por Mes</h3>
      <div id="timc-visual" style="display:flex; gap:15px; flex-wrap: wrap;"></div>
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
    </section>

    <!-- Formulario Agregar Gasto Común -->
    <section id="form-agregar-gasto" style="margin-top:40px; border-top:1px solid #ccc; padding-top:20px;">
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
        <div>
          <button type="submit" style="padding:8px 20px;">Guardar Gasto Común</button>
        </div>
      </form>
    </section>
  `;

  // Cargar datos iniciales (simulados)
  cargarDatosSimulados();

  // Actualizar visualización TIMC
  actualizarVisualTimc();

  // Eventos
  document.getElementById('btn-guardar-timc').addEventListener('click', guardarTimc);
  document.getElementById('select-parcela').addEventListener('input', filtrarDatos);
  document.getElementById('input-anio').addEventListener('input', filtrarDatos);
  document.getElementById('input-n-parcela').addEventListener('input', rellenarDatosResidente);
  document.getElementById('form-gasto-comun').addEventListener('submit', guardarGastoComun);

  // Inicial filtro
  filtrarDatos();
}

// Simula cargar datos de residentes y gastos comunes (reemplaza con tu API/Google Sheets)
function cargarDatosSimulados() {
  residentes = [
    { N_Parcela: 1, Nombre_Completo: 'Juan Pérez', Valor_Gasto_Comun: 50000 },
    { N_Parcela: 2, Nombre_Completo: 'María Gómez', Valor_Gasto_Comun: 45000 },
    { N_Parcela: 3, Nombre_Completo: 'Carlos Díaz', Valor_Gasto_Comun: 52000 },
    // ... hasta parcela 26
  ];

  // Simula TIMC anual (puedes cargar desde Google Sheets)
  timc = {
    Enero: 0.5, Febrero: 0.5, Marzo: 0.5, Abril: 0.5, Mayo: 0.5, Junio: 0.5,
    Julio: 0.5, Agosto: 0.5, Septiembre: 0.5, Octubre: 0.5, Noviembre: 0.5, Diciembre: 0.5
  };

  // Simula gastos comunes (deberás cargar desde Pagos_GC)
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

// Actualiza la visualización de TIMC anual en forma horizontal
function actualizarVisualTimc() {
  const cont = document.getElementById('timc-visual');
  cont.innerHTML = '';
  for (const mes of meses) {
    const div = document.createElement('div');
    div.style.border = '1px solid #ccc';
    div.style.padding = '6px 10px';
    div.style.borderRadius = '4px';
    div.style.minWidth = '80px';
    div.style.textAlign = 'center';
    div.style.background = '#f0f0f0';
    div.style.marginBottom = '6px';
    div.textContent = `${mes}: ${timc[mes] ?? 0}`;
    cont.appendChild(div);
  }
}

// Guarda el TIMC ingresado para el mes seleccionado (simulado)
function guardarTimc() {
  const mes = document.getElementById('select-mes-timc').value;
  const valor = parseFloat(document.getElementById('input-timc').value);
  if (isNaN(valor) || valor < 0) {
    alert('Ingresa un valor TIMC válido.');
    return;
  }
  timc[mes] = valor;
  actualizarVisualTimc();
  alert(`TIMC para ${mes} guardado: ${valor}`);
  // Aquí integra la lógica para guardar en Google Sheets hoja Pagos_GC columna TIMC
}

// Filtra y muestra los gastos comunes según parcela y año seleccionados
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

// Muestra mensaje en la tabla de gastos
function mostrarMensajeTabla(mensaje) {
  const tbody = document.getElementById('tbody-gastos');
  tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:10px;">${mensaje}</td></tr>`;
}

// Muestra los gastos comunes en la tabla
function mostrarGastosEnTabla(gastos) {
  const tbody = document.getElementById('tbody-gastos');
  tbody.innerHTML = '';

  gastos.forEach(gasto => {
    // Calcula saldo
    const saldo = gasto.Monto_Pagado - (gasto.Deuda_Total - gasto.Interes - gasto.Multa_1_4);
    // Calcula interés según fórmula: Valor_Gasto_Comun * TIMC / 100 / 12
    const mesIndex = meses.indexOf(gasto.Periodo);
    const timcMes = timc[gasto.Periodo] ?? 0;
    const interesCalculado = gasto.Valor_Gasto_Comun * timcMes / 100 / 12;

    // Calcula multa 1/4 del gasto común
    const multa = (gasto.Valor_Gasto_Comun / 4) * gasto.Meses_Inpagos;

    // Calcula deuda total
    const deudaTotal = gasto.Valor_Gasto_Comun + interesCalculado + multa;

    // Estado
    let estado = 'Al día';
    const hoy = new Date();
    const vencimiento = new Date(gasto.Fecha_Vencimiento);
    vencimiento.setDate(10); // día 10 del mes
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

// Al ingresar N° parcela en el formulario, rellena nombre y valor gasto común
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
  // Comprobante archivo (no se guarda en esta demo)
  // const comprobante = document.getElementById('input-comprobante').files[0];

  if (!nParcela || !nombreResidente || !fechaPago || !mesPago || isNaN(montoPagado) || montoPagado < 0) {
    alert('Por favor, completa todos los campos correctamente.');
    return;
  }

  // Calcula fecha de vencimiento (día 10 del mes seleccionado y año de fechaPago)
  const anioPago = new Date(fechaPago).getFullYear();
  const mesIndex = meses.indexOf(mesPago);
  const fechaVenc = new Date(anioPago, mesIndex, 10);
  const fechaVencStr = fechaVenc.toISOString().split('T')[0];

  // Calcula meses impagos (simplificado)
  const hoy = new Date();
  let mesesImpagos = 0;
  if (hoy > fechaVenc) {
    mesesImpagos = Math.floor((hoy.getFullYear() - fechaVenc.getFullYear()) * 12 + (hoy.getMonth() - fechaVenc.getMonth()));
    if (hoy.getDate() > 10) mesesImpagos += 1;
  }

  // Calcula interés
  const timcMes = timc[mesPago] ?? 0;
  const interes = valorGasto * timcMes / 100 / 12;

  // Calcula multa 1/4 por meses impagos
  const multa = (valorGasto / 4) * mesesImpagos;

  // Calcula deuda total
  const deudaTotal = valorGasto + interes + multa;

  // Estado
  let estado = 'Al día';
  if (mesesImpagos > 0 && deudaTotal > 0) estado = 'Mora';
  if (deudaTotal <= 0) estado = 'Pagado';

  // Agrega nuevo gasto común a la lista (simulado)
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
  document.getElementById('form-gasto-comun').reset();
  filtrarDatos();

  // Aquí debes integrar la lógica para guardar en Google Sheets hoja Pagos_GC y subir comprobante a Drive
}

// Exporta la función para que tu app la use
window.cargarGastosComunes = cargarGastosComunes;
