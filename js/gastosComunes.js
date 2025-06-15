let pagosData = [];
let timcPorMes = {};

function showGastosComunes() {
  document.querySelectorAll('.main-content > div').forEach(sec => sec.style.display = 'none');
  document.getElementById('gastos-comunes-section').style.display = 'block';
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  Array.from(document.querySelectorAll('.nav-link')).find(link => link.textContent.includes('Gastos Comunes')).classList.add('active');
  cargarGastosComunes();
}

function cargarGastosComunes() {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A2:Q'
  }).then(response => {
    const rows = response.result.values || [];
    pagosData = rows.map(row => ({
      id: row[0],
      nombre: row[1],
      rut: row[2],
      parcela: row[3],
      fecha: row[4],
      metodo: row[5],
      monto: Number(row[6]) || 0,
      interes: Number(row[7]) || 0,
      multa: Number(row[8]) || 0,
      total: Number(row[9]) || 0,
      periodo: row[10],
      observacion: row[11],
      deuda: Number(row[12]) || 0,
      archivo: row[13],
    }));
    renderizarPagos();
  });
}

function renderizarPagos() {
  const filtro = document.getElementById('busqueda-gastos')?.value.trim().toLowerCase() || '';
  const tbody = document.getElementById('tbody-gastos');
  tbody.innerHTML = '';

  pagosData
    .filter(g =>
      g.nombre.toLowerCase().includes(filtro) ||
      g.rut.toLowerCase().includes(filtro) ||
      String(g.parcela).includes(filtro)
    )
    .forEach(g => {
      tbody.innerHTML += `
        <tr>
          <td>${g.nombre}</td>
          <td>${g.rut}</td>
          <td>${g.parcela}</td>
          <td>${g.fecha}</td>
          <td>$${g.monto.toLocaleString('es-CL')}</td>
          <td>${g.interes}%</td>
          <td>${g.multa}%</td>
          <td>$${g.total.toLocaleString('es-CL')}</td>
          <td>
            <button class="acciones-btn" title="Editar" onclick="abrirModalGasto('${g.id}')">&#9998;</button>
            <button class="acciones-btn" title="Eliminar" onclick="eliminarGasto('${g.id}')">&#128465;</button>
          </td>
        </tr>
      `;
    });
}

function filtrarGastosComunes() {
  renderizarPagos();
}
function abrirModalGasto(id = '') {
  const modal = document.getElementById('modal-gasto');
  modal.style.display = 'block';

  const form = modal.querySelector('form');
  const gasto = pagosData.find(g => g.id === id) || {};

  form.idGasto.value = gasto.id || '';
  form.nombre.value = gasto.nombre || '';
  form.rut.value = gasto.rut || '';
  form.parcela.value = gasto.parcela || '';
  form.fecha.value = gasto.fecha || '';
  form.metodo.value = gasto.metodo || 'Transferencia';
  form.monto.value = gasto.monto || '';
  form.periodo.value = gasto.periodo || '';
  form.observacion.value = gasto.observacion || '';
}

function cerrarModalGasto() {
  document.getElementById('modal-gasto').style.display = 'none';
}

function guardarGasto(event) {
  event.preventDefault();
  const form = event.target;

  const monto = Number(form.monto.value);
  const fechaPago = new Date(form.fecha.value);
  const periodo = form.periodo.value;
  const [año, mes] = periodo.split('-');
  const vencimiento = new Date(Number(año), Number(mes) - 1, 10);
  const hoy = new Date();
  const interes = (fechaPago > vencimiento) ? (timcPorMes[periodo] || 0) : 0;
  const mesesAtraso = Math.max(0, hoy.getMonth() + 1 - Number(mes));
  const multa = mesesAtraso * 0.25;
  const total = Math.round(monto + monto * interes / 100 + monto * multa / 100);

  const nuevo = {
    id: form.idGasto.value || Date.now().toString(),
    nombre: form.nombre.value,
    rut: form.rut.value,
    parcela: form.parcela.value,
    fecha: form.fecha.value,
    metodo: form.metodo.value,
    monto,
    interes,
    multa,
    total,
    periodo,
    observacion: form.observacion.value
  };

  // Guardar en Google Sheets (simplificado)
  const fila = [
    nuevo.id, nuevo.nombre, nuevo.rut, nuevo.parcela, nuevo.fecha, nuevo.metodo,
    nuevo.monto, nuevo.interes, nuevo.multa, nuevo.total, nuevo.periodo,
    nuevo.observacion, 0, '', '' // deuda, archivo, etc.
  ];

  gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A2',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [fila]
    }
  }).then(() => {
    cerrarModalGasto();
    cargarGastosComunes();
    enviarComprobantePorCorreo(nuevo);
    alert('✅ Pago registrado y comprobante enviado.');
  });
}
function registrarTIMC() {
  const periodo = document.getElementById('periodo-timc').value;
  const timc = parseFloat(document.getElementById('valor-timc').value);
  if (!periodo || isNaN(timc)) return alert('Falta ingresar período y valor TIMC');

  timcPorMes[periodo] = timc;

  const fila = [[periodo, timc]];
  gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'TIMC!A2',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: fila
    }
  }).then(() => {
    alert('✅ TIMC registrado');
    renderizarTablaTIMC();
  });
}

function renderizarTablaTIMC() {
  const cuerpo = document.getElementById('tabla-timc-body');
  cuerpo.innerHTML = '';
  Object.entries(timcPorMes).forEach(([mes, valor]) => {
    cuerpo.innerHTML += `
      <tr>
        <td style="padding: 4px 8px;">${mes}</td>
        <td style="padding: 4px 8px;">${valor.toFixed(2)}%</td>
      </tr>`;
  });
}
function enviarComprobantePorCorreo(pago) {
  const asunto = `Comprobante de Pago - Gasto Común Parcela ${pago.parcela}`;
  const mensaje = `
Estimado/a ${pago.nombre},

Le informamos que su pago ha sido recepcionado por la administración del Condominio Los Molles.

📌 Parcela: ${pago.parcela}  
📅 Periodo: ${pago.periodo}  
💵 Monto pagado: $${pago.monto.toLocaleString('es-CL')}  
📈 Interés: ${pago.interes.toFixed(2)}%  
⚠️ Multa: ${pago.multa.toFixed(2)}%  
💰 Total aplicado: $${pago.total.toLocaleString('es-CL')}  

Este pago ha sido registrado exitosamente.  
Gracias por mantenerse al día con sus obligaciones comunitarias.

Atentamente,  
Administración Condominio Los Molles
`;

  // Buscar el correo del residente
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Residentes!A2:H'
  }).then(res => {
    const data = res.result.values;
    const fila = data.find(r => r[5] === pago.parcela);
    const correo = fila ? fila[3] : null;
    if (!correo) return console.warn('No se encontró correo del residente');

    gapi.client.gmail.users.messages.send({
      userId: 'me',
      resource: {
        raw: btoa(
          `To: ${correo}\r\n` +
          `Subject: ${asunto}\r\n\r\n` +
          mensaje
        ).replace(/\+/g, '-').replace(/\//g, '_')
      }
    });
  });
}
