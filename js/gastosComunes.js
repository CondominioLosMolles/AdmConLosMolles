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
