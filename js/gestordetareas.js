// js/mantenciones.js - Versión Corregida con Modal Global

async function cargarMantenciones() {
  limpiarMainContent();
  mostrarSpinner();
  let tareas = [];
  try {
    tareas = await obtenerMantenciones();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar tareas: ' + e.message, 'error');
    return;
  }
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Gestor de Tareas y Servicios</h2>
      <button class="btn" id="btnNuevaTarea">Nueva Tarea/Servicio</button>
    </div>
    <div id="tablaTareasContainer" style="overflow-x:auto;"></div>
  `;
  renderTablaTareas(tareas);
  document.getElementById('btnNuevaTarea').addEventListener('click', () => mostrarFormularioTarea(null));
  ocultarSpinner();
}

function renderTablaTareas(tareas) {
    const container = document.getElementById('tablaTareasContainer');
    let html = `<table class="table">
    <thead><tr><th>Fecha Creación</th><th>Título Tarea</th><th>Proveedor Asignado</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>`;
    if (tareas.length > 0) {
        tareas.sort((a, b) => new Date(b[1]) - new Date(a[1])).forEach(t => {
            const id = t[0] || '', fecha = t[1] ? new Date(t[1]).toLocaleDateString('es-CL') : 'N/A',
                titulo = t[2] || 'Sin título', proveedor = t[4] || 'No asignado', estado = t[6] || 'Pendiente';
            html += `
            <tr>
                <td>${fecha}</td><td>${titulo}</td><td>${proveedor}</td>
                <td><span class="badge status-${estado.toLowerCase().replace(/ /g, '-')}">${estado}</span></td>
                <td><button class="btn btn-sm secondary ver-gestionar-btn" data-id="${id}">Ver/Gestionar</button></td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay tareas registradas.</td></tr>`;
    }
    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll('.ver-gestionar-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const tarea = (await obtenerMantenciones()).find(t => t[0] === id);
            if (tarea) mostrarFormularioTarea(tarea);
        });
    });
}

async function mostrarFormularioTarea(tarea) {
    const esNueva = tarea === null;
    const titulo = esNueva ? 'Nueva Tarea o Servicio' : 'Gestionar Tarea';
    const proveedores = await obtenerProveedores();

    const cuerpoHtml = `
        <form id="form-tarea-global">
            <input type="hidden" name="id" value="${esNueva ? '' : tarea[0]}">
            <div class="form-grid">
              <div><label>Título</label><input type="text" name="titulo" value="${esNueva ? '' : tarea[2] || ''}" required></div>
              <div><label>Fecha Creación</label><input type="date" name="fecha_creacion" value="${esNueva ? new Date().toISOString().split('T')[0] : tarea[1] || ''}" required></div>
              <div style="grid-column: 1 / -1;"><label>Descripción</label><textarea name="descripcion" rows="3">${esNueva ? '' : tarea[3] || ''}</textarea></div>
              <div>
                <label>Proveedor Asignado</label>
                <select name="proveedor">
                  <option value="">-- Sin Asignar --</option>
                  ${proveedores.map(p => `<option value="${p[1]}" ${!esNueva && tarea[4] === p[1] ? 'selected' : ''}>${p[1]}</option>`).join('')}
                </select>
              </div>
              <div>
                <label>Estado</label>
                <select name="estado">
                  <option value="Cotizando" ${!esNueva && tarea[6] === 'Cotizando' ? 'selected' : ''}>Cotizando</option>
                  <option value="Aprobado" ${!esNueva && tarea[6] === 'Aprobado' ? 'selected' : ''}>Aprobado</option>
                  <option value="En Proceso" ${!esNueva && tarea[6] === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                  <option value="Finalizado" ${!esNueva && tarea[6] === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                  <option value="Cancelado" ${!esNueva && tarea[6] === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
              </div>
            </div>
            <div id="bitacora-container" style="margin-top: 1.5rem;">
              <h4>Bitácora de Interacciones</h4>
              <div id="historial-bitacora" style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-bottom: 10px; background: #f9f9f9;">
                ${esNueva || !tarea[7] ? '<p>No hay interacciones registradas.</p>' : tarea[7].split(';').map(n => n.trim() ? `<p style="margin-bottom:5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${n}</p>` : '').join('')}
              </div>
              <div style="display:flex; gap:10px;"><input type="text" id="nuevaNotaBitacora" placeholder="Añadir nota..." style="flex-grow:1;"><button class="btn secondary" type="button" id="btnAgregarNota">Agregar</button></div>
            </div>
        </form>
    `;

    const guardarFn = async () => {
        const form = document.getElementById('form-tarea-global');
        const formData = new FormData(form);
        const notas = Array.from(document.querySelectorAll('#historial-bitacora p')).map(p => p.textContent).filter(t => t !== 'No hay interacciones registradas.').join('; ');
        const datosTarea = [
            formData.get('id'), formData.get('fecha_creacion'), formData.get('titulo'),
            formData.get('descripcion'), formData.get('proveedor'), '', formData.get('estado'), notas
        ];
        mostrarSpinner();
        try {
            if (esNueva) {
                await agregarMantencion(datosTarea);
                mostrarMensaje('Tarea creada.', 'success');
            } else {
                // await actualizarMantencion(datosTarea); // Se necesita esta función en sheets.js
                mostrarMensaje('Actualización aún no implementada.', 'info');
            }
            ocultarModalGlobal();
            await cargarMantenciones();
        } catch (err) { mostrarMensaje('Error al guardar: ' + err.message, 'error'); }
        finally { ocultarSpinner(); }
    };

    mostrarModalGlobal(titulo, cuerpoHtml, guardarFn, 'large');

    document.getElementById('btnAgregarNota').addEventListener('click', () => {
        const inputNota = document.getElementById('nuevaNotaBitacora');
        if (inputNota.value.trim()) {
            const historialDiv = document.getElementById('historial-bitacora');
            if (historialDiv.innerHTML.includes('No hay interacciones')) historialDiv.innerHTML = '';
            const fechaNota = new Date().toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            historialDiv.innerHTML += `<p style="margin-bottom:5px; border-bottom: 1px solid #eee; padding-bottom: 5px;"><b>${fechaNota}:</b> ${inputNota.value.trim()}</p>`;
            inputNota.value = '';
        }
    });
}
