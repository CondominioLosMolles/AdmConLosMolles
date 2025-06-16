// js/asambleas.js
// Módulo Asambleas: tabla, programación, notificación masiva, subida de acta a Drive

async function cargarAsambleas() {
  limpiarMainContent();
  mostrarSpinner();

  let asambleas = [];
  try {
    asambleas = await obtenerAsambleas();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar asambleas: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Asambleas</h2>
    <div style="margin-bottom:24px;">
      <button class="btn" id="btnProgramarAsamblea">Programar Asamblea</button>
    </div>
    <div id="tablaAsambleas"></div>
    <div id="modalAsamblea" style="display:none;"></div>
  `;

  // Render tabla
  function renderTablaAsambleas() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const a of asambleas) {
      html += `<tr>
        <td>${a[1]}</td>
        <td>${a[2]}</td>
        <td>${a[3]}</td>
        <td>${a[4]}</td>
        <td>${a[5] ? `<a href="${a[5]}" target="_blank">Ver</a>` : ''}</td>
        <td>
          <button class="btn secondary btn-eliminar-asamblea" data-id="${a[0]}">🗑️</button>
        </td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaAsambleas').innerHTML = html;
  }
  renderTablaAsambleas();

  // Modal programar asamblea
  document.getElementById('btnProgramarAsamblea').onclick = () => mostrarModalAsamblea();

  function mostrarModalAsamblea() {
    const modal = document.getElementById('modalAsamblea');
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;max-width:500px;margin:40px auto;box-shadow:0 2px 8px #0001;">
        <h3>Programar Asamblea</h3>
        <form id="formAsamblea">
          <label>Fecha</label>
          <input name="fecha" required type="date">
          <label>Tipo</label>
          <select name="tipo" required>
            <option>Ordinaria</option>
            <option>Extraordinaria</option>
          </select>
          <label>Descripción</label>
          <input name="descripcion" required>
          <label>Estado</label>
          <select name="estado" required>
            <option>Programada</option>
            <option>Realizada</option>
            <option>Cancelada</option>
          </select>
          <label>Acta (PDF)</label>
          <input name="acta" id="inputActa" type="file" accept="application/pdf">
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn secondary" type="button" id="btnCerrarModalAsamblea">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModalAsamblea').onclick = () => modal.style.display = 'none';
    document.getElementById('formAsamblea').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fecha = fd.get('fecha');
      const tipo = fd.get('tipo');
      const descripcion = fd.get('descripcion');
      const estado = fd.get('estado');
      const file = fd.get('acta');
      let idActaDrive = '';
      mostrarSpinner();
      try {
        if (file && file.size > 0) {
          // Debes obtener el ID de la carpeta de asambleas en Drive
          const carpetaId = await obtenerCarpetaDriveAsambleas(); // Implementa en drive.js
          const res = await subirComprobante(file, carpetaId);
          idActaDrive = res.id;
        }
        await agregarAsamblea([
          '', // ID autoincremental
          fecha,
          tipo,
          descripcion,
          estado,
          idActaDrive
        ]);
        // Notificación masiva a todos los residentes activos
        const residentes = await obtenerResidentes();
        const emails = residentes.filter(r => r[7] === 'Activo').map(r => r[5]);
        for (const email of emails) {
          await enviarCorreo(
            email,
            `Convocatoria Asamblea ${tipo}`,
            `Estimado/a, se le cita a la asamblea <b>${tipo}</b> el día <b>${fecha}</b>.<br>Detalle: ${descripcion}.`
          );
        }
        modal.style.display = 'none';
        asambleas = await obtenerAsambleas();
        renderTablaAsambleas();
        mostrarMensaje('Asamblea programada y notificada');
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  // Eliminar asamblea
  document.getElementById('tablaAsambleas').onclick = async (e) => {
    if (e.target.classList.contains('btn-eliminar-asamblea')) {
      const id = e.target.dataset.id;
      if (confirm('¿Está seguro de que desea eliminar esta asamblea?')) {
        mostrarSpinner();
        try {
          await eliminarAsamblea(id); // Implementa en sheets.js
          asambleas = await obtenerAsambleas();
          renderTablaAsambleas();
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
document.querySelector('[data-module="asambleas"]').addEventListener('click', cargarAsambleas);
