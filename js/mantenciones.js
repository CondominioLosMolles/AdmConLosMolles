// js/mantenciones.js
// Módulo Mantenciones: tabla, filtro por estado, alta de mantención, subida de comprobante a Drive

async function cargarMantenciones() {
  limpiarMainContent();
  mostrarSpinner();

  let mantenciones = [];
  try {
    mantenciones = await obtenerMantenciones();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar mantenciones: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Mantenciones</h2>
    <div style="margin-bottom:24px;display:flex;gap:16px;align-items:center;">
      <label>Filtrar por estado:
        <select id="filtroEstadoMant">
          <option value="">Todos</option>
          <option>Pendiente</option>
          <option>En Progreso</option>
          <option>Completada</option>
          <option>Urgente</option>
        </select>
      </label>
      <button class="btn" id="btnAgregarMantencion">Agregar Mantención</button>
    </div>
    <div id="tablaMantenciones"></div>
    <div id="modalMantencion" style="display:none;"></div>
  `;

  // Render tabla
  function renderTablaMantenciones(estado = '') {
    const datos = estado ? mantenciones.filter(m => m[5] === estado) : mantenciones;
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Encargado</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Costo Total</th>
            <th>Comprobante</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const m of datos) {
      html += `<tr>
        <td>${m[1]}</td>
        <td>${m[2]}</td>
        <td>${m[3]}</td>
        <td>${m[4]}</td>
        <td>${m[5]}</td>
        <td>${m[6]}</td>
        <td>${m[7] ? `<a href="${m[7]}" target="_blank">Ver</a>` : ''}</td>
        <td>
          <button class="btn secondary btn-eliminar-mant" data-id="${m[0]}">🗑️</button>
        </td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaMantenciones').innerHTML = html;
  }
  renderTablaMantenciones();

  // Filtro
  document.getElementById('filtroEstadoMant').onchange = (e) => {
    renderTablaMantenciones(e.target.value);
  };

  // Modal agregar mantención
  document.getElementById('btnAgregarMantencion').onclick = () => mostrarModalMantencion();

  function mostrarModalMantencion() {
    const modal = document.getElementById('modalMantencion');
    modal.style.display = 'block';
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;max-width:500px;margin:40px auto;box-shadow:0 2px 8px #0001;">
        <h3>Agregar Mantención</h3>
        <form id="formMantencion">
          <label>Fecha</label>
          <input name="fecha" required type="date">
          <label>Encargado</label>
          <input name="encargado" required>
          <label>Tipo</label>
          <input name="tipo" required>
          <label>Descripción</label>
          <input name="descripcion" required>
          <label>Estado</label>
          <select name="estado" required>
            <option>Pendiente</option>
            <option>En Progreso</option>
            <option>Completada</option>
            <option>Urgente</option>
          </select>
          <label>Costo Total</label>
          <input name="costo" required type="number">
          <label>Comprobante</label>
          <input name="comprobante" id="inputComprobanteMant" type="file" accept="image/*,application/pdf">
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn secondary" type="button" id="btnCerrarModalMant">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModalMant').onclick = () => modal.style.display = 'none';
    document.getElementById('formMantencion').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fecha = fd.get('fecha');
      const encargado = fd.get('encargado');
      const tipo = fd.get('tipo');
      const descripcion = fd.get('descripcion');
      const estado = fd.get('estado');
      const costo = fd.get('costo');
      const file = fd.get('comprobante');
      let idComprobanteDrive = '';
      mostrarSpinner();
      try {
        if (file && file.size > 0) {
          // Debes obtener el ID de la carpeta de mantenciones en Drive
          const carpetaId = await obtenerCarpetaDriveMantenciones(); // Implementa en drive.js
          const res = await subirComprobante(file, carpetaId);
          idComprobanteDrive = res.id;
        }
        await agregarMantencion([
          '', // ID autoincremental
          fecha,
          encargado,
          tipo,
          descripcion,
          estado,
          costo,
          idComprobanteDrive
        ]);
        modal.style.display = 'none';
        mantenciones = await obtenerMantenciones();
        renderTablaMantenciones();
        mostrarMensaje('Mantención registrada');
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  // Eliminar mantención
  document.getElementById('tablaMantenciones').onclick = async (e) => {
    if (e.target.classList.contains('btn-eliminar-mant')) {
      const id = e.target.dataset.id;
      if (confirm('¿Está seguro de que desea eliminar esta mantención?')) {
        mostrarSpinner();
        try {
          await eliminarMantencion(id); // Implementa en sheets.js
          mantenciones = await obtenerMantenciones();
          renderTablaMantenciones();
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
document.querySelector('[data-module="mantenciones"]').addEventListener('click', cargarMantenciones);
