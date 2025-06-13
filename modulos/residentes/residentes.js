export let residentesDataCache = [];

export async function cargarResidentes() {
  let res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Residentes!A2:I',
  });
  residentesDataCache = res.result.values || [];
  renderResidentes();
}

export function renderResidentes() {
  const filtro = document.getElementById('busqueda-residente').value.trim().toLowerCase();
  const tbody = document.getElementById('tbody-residentes');
  tbody.innerHTML = '';
  residentesDataCache
    .filter((row) => {
      return (
        row[1]?.toLowerCase().includes(filtro) ||
        row[2]?.toLowerCase().includes(filtro) ||
        String(row[3] || '').includes(filtro)
      );
    })
    .forEach((row) => {
      let estado = row[7] || '';
      let estadoClass =
        estado === 'Activo' ? 'estado-activo' : estado === 'Moroso' ? 'estado-moroso' : 'estado-inactivo';
      tbody.innerHTML += `
      <tr>
        <td>${row[1] || ''}</td>
        <td>${row[2] || ''}</td>
        <td>${row[3] || ''}</td>
        <td>${row[4] || ''}</td>
        <td>${row[5] || ''}</td>
        <td>${row[6] || ''}</td>
        <td><span class="estado-chip ${estadoClass}">${estado}</span></td>
        <td>${row[8] ? '$' + Number(row[8]).toLocaleString('es-CL') : ''}</td>
        <td>
          <button class="acciones-btn" title="Editar" onclick="abrirModalResidente('${row[0]}')">&#9998;</button>
          <button class="acciones-btn" title="Eliminar" onclick="eliminarResidente('${row[0]}')">&#128465;</button>
        </td>
      </tr>
    `;
    });
}

export function filtrarResidentes() {
  renderResidentes();
}

export function abrirModalResidente(id = null) {
  document.getElementById('modal-residente-bg').style.display = 'flex';
  if (id) {
    let row = residentesDataCache.find((r) => r[0] === id);
    document.getElementById('modal-titulo').innerText = 'Editar Residente';
    document.getElementById('residente-id').value = row[0];
    document.getElementById('res-nombre').value = row[1] || '';
    document.getElementById('res-rut').value = row[2] || '';
    document.getElementById('res-parcela').value = row[3] || '';
    document.getElementById('res-direccion').value = row[4] || '';
    document.getElementById('res-email').value = row[5] || '';
    document.getElementById('res-telefono').value = row[6] || '';
    document.getElementById('res-estado').value = row[7] || 'Activo';
    document.getElementById('res-gasto').value = row[8] || '';
  } else {
    document.getElementById('modal-titulo').innerText = 'Agregar Residente';
    document.getElementById('form-residente').reset();
    document.getElementById('residente-id').value = '';
  }
}

export function cerrarModalResidente() {
  document.getElementById('modal-residente-bg').style.display = 'none';
}

export async function guardarResidente(e) {
  e.preventDefault();
  const id = document.getElementById('residente-id').value;
  const values = [
    id || Date.now().toString(),
    document.getElementById('res-nombre').value,
    document.getElementById('res-rut').value,
    document.getElementById('res-parcela').value,
    document.getElementById('res-direccion').value,
    document.getElementById('res-email').value,
    document.getElementById('res-telefono').value,
    document.getElementById('res-estado').value,
    document.getElementById('res-gasto').value,
  ];
  if (id) {
    let idx = residentesDataCache.findIndex((r) => r[0] === id);
    if (idx > -1) {
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Residentes!A${idx + 2}:I${idx + 2}`,
        valueInputOption: 'RAW',
        values: [values],
      });
    }
  } else {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Residentes!A2:I',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      values: [values],
    });
  }
  cerrarModalResidente();
  cargarResidentes();
}

export async function eliminarResidente(id) {
  if (!confirm('¿Está seguro de que desea eliminar a este residente?')) return;
  let idx = residentesDataCache.findIndex((r) => r[0] === id);
  if (idx > -1) {
    const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.result.sheets.find((s) => s.properties.title === 'Residentes');
    const sheetId = sheet ? sheet.properties.sheetId : 0;
    await gapi.client.sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: idx + 1,
              endIndex: idx + 2,
            },
          },
        },
      ],
    });
    cargarResidentes();
  }
}
