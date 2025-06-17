// js/multas.js
// Módulo Multas: tabla, alta de multa, pago de multa, notificación automática por Gmail

async function cargarMultas() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [], multas = [];
  try {
    residentes = await obtenerResidentes();
    multas = await obtenerMultas();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar multas: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Multas</h2>
    <div style="margin-bottom:24px;">
      <button class="btn" id="btnAgregarMulta">Cursar Multa</button>
    </div>
    <div id="tablaMultas"></div>
    <div id="modalMulta" style="display:none;"></div>
  `;

  // Render tabla
  function renderTablaMultas() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Residente</th>
            <th>Parcela</th>
            <th>Fecha Infracción</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const m of multas) {
      const residente = residentes.find(r => r[0] === m[1]);
      html += `<tr>
        <td>${residente ? residente[1] : '-'}</td>
        <td>${residente ? residente[3] : '-'}</td>
        <td>${m[2]}</td>
        <td>${m[3]}</td>
        <td>${m[4]}</td>
        <td>${m[5]}</td>
        <td>${m[6] || ''}</td>
        <td>
          ${m[5] === 'Pendiente' ? `<button class="btn secondary btn-pagar-multa" data-id="${m[0]}">Registrar Pago</button>` : ''}
          <button class="btn secondary btn-eliminar-multa" data-id="${m[0]}">🗑️</button>
        </td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaMultas').innerHTML = html;
  }
  renderTablaMultas();

  // Modal agregar multa
  document.getElementById('btnAgregarMulta').onclick = () => mostrarModalMulta();

  function mostrarModalMulta() {
    const modal = document.getElementById('modalMulta');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div>
        <h3>Cursar Multa</h3>
        <form id="formMulta">
          <label>Residente</label>
          <select name="idResidente" id="selectResidenteMulta" required>
            <option value="">Seleccione...</option>
            ${residentes.map(r => `<option value="${r[0]}">${r[1]} (Parcela ${r[3]})</option>`).join('')}
          </select>
          <label>Fecha Infracción</label>
          <input name="fechaInfraccion" required type="date">
          <label>Descripción</label>
          <input name="descripcion" required>
          <label>Monto</label>
          <input name="monto" required type="number">
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn secondary" type="button" id="btnCerrarModalMulta">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModalMulta').onclick = () => modal.style.display = 'none';
    document.getElementById('formMulta').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const idResidente = fd.get('idResidente');
      const residente = residentes.find(r => r[0] === idResidente);
      if (!residente) {
        mostrarMensaje('Residente no válido', 'error');
        return;
      }
      const fechaInfraccion = fd.get('fechaInfraccion');
      const descripcion = fd.get('descripcion');
      const monto = fd.get('monto');
      mostrarSpinner();
      try {
        await agregarMulta([
          '', // ID autoincremental
          idResidente,
          fechaInfraccion,
          descripcion,
          monto,
          'Pendiente',
          ''
        ]);
        // Notificación automática por Gmail
        await enviarCorreo(
          residente[5],
          'Notificación de Multa',
          `Estimado/a ${residente[1]},<br>Se le ha cursado una multa por: <b>${descripcion}</b> con fecha ${fechaInfraccion} por un monto de $${monto}.<br>Por favor regularice su situación.`
        );
        modal.style.display = 'none';
        multas = await obtenerMultas();
        renderTablaMultas();
        mostrarMensaje('Multa registrada y notificada');
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  // Registrar pago de multa y eliminar multa
  document.getElementById('tablaMultas').onclick = async (e) => {
    // Pago
    if (e.target.classList.contains('btn-pagar-multa')) {
      const id = e.target.dataset.id;
      const multa = multas.find(m => m[0] === id);
      if (!multa) return;
      if (confirm('¿Registrar esta multa como pagada?')) {
        mostrarSpinner();
        try {
          multa[5] = 'Pagada';
          multa[6] = new Date().toISOString().slice(0, 10);
          await actualizarMulta(multa); // Implementa en sheets.js
          multas = await obtenerMultas();
          renderTablaMultas();
        } catch (e) {
          mostrarMensaje('Error al registrar pago: ' + e.message, 'error');
        }
        ocultarSpinner();
      }
    }
    // Eliminar
    if (e.target.classList.contains('btn-eliminar-multa')) {
      const id = e.target.dataset.id;
      if (confirm('¿Está seguro de que desea eliminar esta multa?')) {
        mostrarSpinner();
        try {
          await eliminarMulta(id); // Implementa en sheets.js
          multas = await obtenerMultas();
          renderTablaMultas();
        } catch (e) {
          mostrarMensaje('Error al eliminar: ' + e.message, 'error');
        }
        ocultarSpinner();
      }
    }
  };

  ocultarSpinner();
}

// Evento de menú
document.querySelector('[data-module="multas"]').addEventListener('click', cargarMultas);
