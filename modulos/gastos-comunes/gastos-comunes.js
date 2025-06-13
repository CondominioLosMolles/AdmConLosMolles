export let gastosComunesData = [];

export function filtrarGastosComunes() {
  const filtro = document.getElementById('busqueda-gastos').value.trim().toLowerCase();
  const tbody = document.getElementById('tbody-gastos');
  tbody.innerHTML = '';
  gastosComunesData
    .filter(gasto =>
      gasto.nombre.toLowerCase().includes(filtro) ||
      gasto.rut.toLowerCase().includes(filtro) ||
      String(gasto.parcela).includes(filtro)
    )
    .forEach(gasto => {
      tbody.innerHTML += `
        <tr>
          <td>${gasto.nombre}</td>
          <td>${gasto.rut}</td>
          <td>${gasto.parcela}</td>
          <td>${gasto.fecha}</td>
          <td>$${Number(gasto.monto).toLocaleString('es-CL')}</td>
          <td>${gasto.interes}%</td>
          <td>${gasto.multa}%</td>
          <td>$${Number(gasto.total).toLocaleString('es-CL')}</td>
          <td>
            <button class="acciones-btn" title="Editar" onclick="abrirModalGasto('${gasto.id}')">&#9998;</button>
            <button class="acciones-btn" title="Eliminar" onclick="eliminarGasto('${gasto.id}')">&#128465;</button>
          </td>
        </tr>
      `;
    });
}

export async function cargarGastosComunes() {
  try {
    const res = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pagos_GC!A2:Q',
    });
    const rows = res.result.values || [];
    gastosComunesData = rows.map(row => ({
      id: row[0],
      nombre: row[1],
      rut: row[2],
      parcela: row[3],
      fecha: row[4],
      monto: Number(row[6]) || 0,
      interes: Number(row[7]) || 0,
      multa: Number(row[8]) || 0,
      total: Number(row[9]) || 0
    }));
    filtrarGastosComunes();
  } catch (error) {
    console.error('Error al cargar gastos comunes:', error);
  }
}

export function abrirModalGasto(id = null) {
  document.getElementById('modal-gasto-bg').style.display = 'flex';
  if (id) {
    const gasto = gastosComunesData.find(g => g.id === id);
    if (!gasto) return;
    document.getElementById('modal-gasto-titulo').innerText = 'Editar Gasto Común';
    document.getElementById('gasto-id').value = gasto.id;
    document.getElementById('gasto-residente').value = gasto.nombre;
    document.getElementById('gasto-rut').value = gasto.rut;
    document.getElementById('gasto-parcela').value = gasto.parcela;
    document.getElementById('gasto-fecha').value = gasto.fecha;
    document.getElementById('gasto-monto').value = gasto.monto;
    document.getElementById('gasto-interes').value = gasto.interes;
    document.getElementById('gasto-multa').value = gasto.multa;
    document.getElementById('gasto-total').value = gasto.total;
  } else {
    document.getElementById('modal-gasto-titulo').innerText = 'Agregar Gasto Común';
    document.getElementById('form-gasto').reset();
    document.getElementById('gasto-id').value = '';
    document.getElementById('gasto-total').value = '';
  }
}

export function cerrarModalGasto() {
  document.getElementById('modal-gasto-bg').style.display = 'none';
}

export function calcularTotal() {
  const monto = Number(document.getElementById('gasto-monto').value) || 0;
  const interes = Number(document.getElementById('gasto-interes').value) || 0;
  const multa = Number(document.getElementById('gasto-multa').value) || 0;
  const total = monto + (monto * interes / 100) + (monto * multa / 100);
  document.getElementById('gasto-total').value = total.toFixed(0);
}

document.getElementById('gasto-monto')?.addEventListener('input', calcularTotal);
document.getElementById('gasto-interes')?.addEventListener('input', calcularTotal);
document.getElementById('gasto-multa')?.addEventListener('input', calcularTotal);

export async function guardarGasto(event) {
  event.preventDefault();
  const id = document.getElementById('gasto-id').value || Date.now().toString();
  const nombre = document.getElementById('gasto-residente').value.trim();
  const rut = document.getElementById('gasto-rut').value.trim();
  const parcela = document.getElementById('gasto-parcela').value.trim();
  const fecha = document.getElementById('gasto-fecha').value;
  const monto = Number(document.getElementById('gasto-monto').value);
  const interes = Number(document.getElementById('gasto-interes').value);
  const multa = Number(document.getElementById('gasto-multa').value);
  const total = Number(document.getElementById('gasto-total').value);

  if (!nombre || !rut || !parcela || !fecha || monto <= 0) {
    alert('Por favor, complete todos los campos correctamente.');
    return;
  }

  const fila = [id, nombre, rut, parcela, fecha, '', monto, interes, multa, total];

  try {
    if (document.getElementById('gasto-id').value) {
      const idx = gastosComunesData.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Gasto no encontrado para editar.');
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Pagos_GC!A${idx + 2}:J${idx + 2}`,
        valueInputOption: 'RAW',
        values: [fila],
      });
    } else {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Pagos_GC!A2:J',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        values: [fila],
      });
    }
    cerrarModalGasto();
    cargarGastosComunes();
  } catch (error) {
    alert('Error al guardar el gasto común: ' + error.message);
  }
}

export async function eliminarGasto(id) {
  if (!confirm('¿Está seguro de que desea eliminar este gasto común?')) return;
  try {
    const spreadsheet = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheet = spreadsheet.result.sheets.find(s => s.properties.title === 'Pagos_GC');
    const sheetId = sheet ? sheet.properties.sheetId : 0;
    const idx = gastosComunesData.findIndex(g => g.id === id);
    if (idx === -1) throw new Error('Gasto común no encontrado.');
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
    cargarGastosComunes();
  } catch (error) {
    alert('Error al eliminar el gasto común: ' + error.message);
  }
}
