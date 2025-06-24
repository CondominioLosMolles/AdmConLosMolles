// js/mantenciones.js

// --- VISTA PRINCIPAL DEL GESTOR DE TAREAS Y SERVICIOS ---
async function cargarMantenciones() {
  limpiarMainContent();
  mostrarSpinner();

  let tareas = [];
  try {
    tareas = await obtenerMantenciones(); // Reutilizamos la función, pero ahora la data representa "tareas"
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
  document.getElementById('btnNuevaTarea').addEventListener('click', () => mostrarModalTarea(null));

  ocultarSpinner();
}

// --- RENDERIZA LA TABLA DE TAREAS ---
function renderTablaTareas(tareas) {
  const container = document.getElementById('tablaTareasContainer');
  let html = `<table class="table">
    <thead>
      <tr>
        <th>Fecha Creación</th>
        <th>Título Tarea</th>
        <th>Proveedor Asignado</th>
        <th>Estado</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>`;

  if (tareas.length > 0) {
    // Ordenar por fecha de creación descendente
    tareas.sort((a, b) => new Date(b[1]) - new Date(a[1])).forEach(t => {
      html += `
        <tr>
          <td>${new Date(t[1]).toLocaleDateString('es-CL')}</td>
          <td>${t[2] || ''}</td>
          <td>${t[4] || 'No asignado'}</td>
          <td><span class="badge status-${(t[6] || '').toLowerCase().replace(' ', '-')}">${t[6] || 'Pendiente'}</span></td>
          <td>
            <button class="btn btn-sm" data-id="${t[0]}">Ver/Gestionar</button>
          </td>
        </tr>`;
    });
  } else {
    html += `<tr><td colspan="5">No hay tareas o servicios registrados.</td></tr>`;
  }
  
  html += `</tbody></table>`;
  container.innerHTML = html;
  
  // Listener para el botón Ver/Gestionar (a desarrollar)
}


// --- MUESTRA EL MODAL PARA AGREGAR/EDITAR TAREA ---
async function mostrarModalTarea(tarea) {
  const esNueva = tarea === null;
  const proveedores = await obtenerProveedores();

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content large">
      <h3>${esNueva ? 'Nueva Tarea o Servicio' : 'Gestionar Tarea'}</h3>
      <form id="formTarea">
        <input type="hidden" name="id" value="${esNueva ? '' : tarea[0]}">
        <div class="form-grid">
          <div><label>Título de la Tarea</label><input type="text" name="titulo" value="${esNueva ? '' : tarea[2]}" required></div>
          <div><label>Fecha de Creación</label><input type="date" name="fecha_creacion" value="${esNueva ? new Date().toISOString().split('T')[0] : tarea[1]}" required></div>
          
          <div style="grid-column: 1 / -1;"><label>Descripción Detallada del Requerimiento</label><textarea name="descripcion" rows="4">${esNueva ? '' : tarea[3] || ''}</textarea></div>

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
        
        <div id="bitacora-container" class="mt-4">
          <h4>Bitácora de Interacciones</h4>
          <div id="historial-bitacora" style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-bottom: 10px; background: #f9f9f9;">
            ${esNueva || !tarea[7] ? '<p>No hay interacciones registradas.</p>' : tarea[7].split(';').map(n => `<p style="margin-bottom:5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${n}</p>`).join('')}
          </div>
          <div style="display:flex; gap:10px;">
            <input type="text" id="nuevaNotaBitacora" placeholder="Añadir nueva nota. Ej: Se aprobó presupuesto por email." style="flex-grow:1;">
            <button class="btn secondary" type="button" id="btnAgregarNota">Agregar a Bitácora</button>
          </div>
        </div>

        <div class="text-right mt-4">
          <button class="btn secondary" type="button" id="btnCerrarModal">Cerrar</button>
          <button class="btn" type="submit">Guardar Tarea</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Lógica de la bitácora
  document.getElementById('btnAgregarNota').addEventListener('click', () => {
      const inputNota = document.getElementById('nuevaNotaBitacora');
      const nota = inputNota.value.trim();
      if(nota) {
          const historialDiv = document.getElementById('historial-bitacora');
          if(historialDiv.innerHTML.includes('<p>No hay interacciones registradas.</p>')) historialDiv.innerHTML = '';
          const fechaNota = new Date().toLocaleString('es-CL');
          historialDiv.innerHTML += `<p style="margin-bottom:5px; border-bottom: 1px solid #eee; padding-bottom: 5px;"><b>${fechaNota}:</b> ${nota}</p>`;
          inputNota.value = '';
      }
  });

  modal.querySelector('#btnCerrarModal').addEventListener('click', () => modal.remove());
  
  modal.querySelector('#formTarea').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const notas = Array.from(document.querySelectorAll('#historial-bitacora p')).map(p => p.textContent).join(';');
      
      const datosTarea = [
        formData.get('id'),
        formData.get('fecha_creacion'),
        formData.get('titulo'),
        formData.get('descripcion'),
        formData.get('proveedor'),
        '', // Columna F (Costo_Estimado) - se puede agregar después
        formData.get('estado'),
        notas
      ];

      mostrarSpinner();
      try {
          // Lógica para guardar/actualizar tarea (requiere nuevas funciones en sheets.js)
          if(esNueva){
              await agregarMantencion(datosTarea); // Reutilizamos, pero es una "Tarea"
              mostrarMensaje('Tarea creada con éxito');
          } else {
              // await actualizarMantencion(datosTarea); // Necesitaríamos esta función
              mostrarMensaje('Funcionalidad de actualizar no implementada aún.');
          }
          modal.remove();
          const tareasActualizadas = await obtenerMantenciones();
          renderTablaTareas(tareasActualizadas);
      } catch (err) {
          mostrarMensaje('Error al guardar tarea: ' + err.message, 'error');
      } finally {
          ocultarSpinner();
      }
  });
}
