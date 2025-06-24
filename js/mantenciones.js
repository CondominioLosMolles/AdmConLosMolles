// js/mantenciones.js - Versión Final para "Gestor de Tareas"

/**
 * Carga la vista principal del Gestor de Tareas y Servicios.
 * Esta es la función que debe ser llamada desde el index.html.
 */
async function cargarMantenciones() {
  limpiarMainContent();
  mostrarSpinner();

  let tareas = [];
  try {
    // Reutilizamos la función de la hoja 'Mantenciones', pero ahora la data representa "tareas"
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
  document.getElementById('btnNuevaTarea').addEventListener('click', () => mostrarModalTarea(null));

  ocultarSpinner();
}

/**
 * Dibuja la tabla de tareas en el contenedor principal.
 * @param {Array} tareas - El array de tareas obtenido de la hoja de cálculo.
 */
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
    tareas.sort((a, b) => new Date(b[1]) - new Date(a[1])).forEach(t => {
      // Asumimos la siguiente estructura de columnas en la hoja "Mantenciones":
      // A(0): ID, B(1): Fecha, C(2): Título, D(3): Descripción, E(4): Proveedor, F(5): Costo, G(6): Estado, H(7): Bitácora
      const id = t[0] || '';
      const fecha = t[1] ? new Date(t[1]).toLocaleDateString('es-CL') : 'N/A';
      const titulo = t[2] || 'Sin título';
      const proveedor = t[4] || 'No asignado';
      const estado = t[6] || 'Pendiente';
      
      html += `
        <tr>
          <td>${fecha}</td>
          <td>${titulo}</td>
          <td>${proveedor}</td>
          <td><span class="badge status-${estado.toLowerCase().replace(/ /g, '-')}">${estado}</span></td>
          <td>
            <button class="btn btn-sm secondary ver-gestionar-btn" data-id="${id}">Ver/Gestionar</button>
          </td>
        </tr>`;
    });
  } else {
    html += `<tr><td colspan="5" style="text-align:center; padding: 20px;">No hay tareas o servicios registrados.</td></tr>`;
  }
  
  html += `</tbody></table>`;
  container.innerHTML = html;
  
  // Añadir listeners a los nuevos botones
  container.querySelectorAll('.ver-gestionar-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const todasLasTareas = await obtenerMantenciones();
        const tareaSeleccionada = todasLasTareas.find(t => t[0] === id);
        if (tareaSeleccionada) {
            mostrarModalTarea(tareaSeleccionada);
        } else {
            mostrarMensaje('Error: No se pudo encontrar la tarea seleccionada.', 'error');
        }
    });
  });
}

/**
 * Muestra el modal para agregar o editar una tarea.
 * @param {Array|null} tarea - La tarea a editar, o null si es una nueva tarea.
 */
async function mostrarModalTarea(tarea) {
  const esNueva = tarea === null;
  let proveedores = [];
  try {
      proveedores = await obtenerProveedores();
  } catch (e) {
      mostrarMensaje('No se pudieron cargar los proveedores. ' + e.message, 'error');
  }

  const modal = document.createElement('div');
  // Usamos los IDs de tu CSS para el modal
  modal.id = 'modalMantencion'; 
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content large">
      <h3>${esNueva ? 'Nueva Tarea o Servicio' : 'Gestionar Tarea'}</h3>
      <form id="formTarea">
        <input type="hidden" name="id" value="${esNueva ? '' : tarea[0]}">
        <div class="form-grid">
          <div><label>Título de la Tarea</label><input type="text" name="titulo" value="${esNueva ? '' : tarea[2] || ''}" required></div>
          <div><label>Fecha de Creación</label><input type="date" name="fecha_creacion" value="${esNueva ? new Date().toISOString().split('T')[0] : tarea[1] || ''}" required></div>
          
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
        
        <div id="bitacora-container" style="margin-top: 1.5rem;">
          <h4>Bitácora de Interacciones</h4>
          <div id="historial-bitacora" style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; border-radius: 4px; margin-bottom: 10px; background: #f9f9f9;">
            ${esNueva || !tarea[7] ? '<p>No hay interacciones registradas.</p>' : tarea[7].split(';').map(n => n.trim() ? `<p style="margin-bottom:5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${n}</p>` : '').join('')}
          </div>
          <div style="display:flex; gap:10px;">
            <input type="text" id="nuevaNotaBitacora" placeholder="Añadir nueva nota. Ej: Se aprobó presupuesto por email." style="flex-grow:1;">
            <button class="btn secondary" type="button" id="btnAgregarNota">Agregar Nota</button>
          </div>
        </div>

        <div style="text-align: right; margin-top: 2rem;">
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
          const fechaNota = new Date().toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          historialDiv.innerHTML += `<p style="margin-bottom:5px; border-bottom: 1px solid #eee; padding-bottom: 5px;"><b>${fechaNota}:</b> ${nota}</p>`;
          inputNota.value = '';
      }
  });

  modal.querySelector('#btnCerrarModal').addEventListener('click', () => modal.remove());
  
  modal.querySelector('#formTarea').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const notas = Array.from(document.querySelectorAll('#historial-bitacora p'))
          .map(p => p.textContent)
          .filter(t => t !== 'No hay interacciones registradas.')
          .join('; ');
      
      const datosTarea = [
        formData.get('id'),
        formData.get('fecha_creacion'),
        formData.get('titulo'),
        formData.get('descripcion'),
        formData.get('proveedor'),
        '', // Columna F (Costo_Estimado) - vacía por ahora
        formData.get('estado'),
        notas
      ];

      mostrarSpinner();
      try {
          if(esNueva){
              await agregarMantencion(datosTarea); // Reutilizamos la función de sheets.js
              mostrarMensaje('Tarea creada con éxito.', 'success');
          } else {
              // Esta función necesitaría ser creada en sheets.js si quieres editar
              // await actualizarMantencion(datosTarea); 
              mostrarMensaje('Funcionalidad de actualizar aún no implementada.', 'info');
          }
          modal.remove();
          await cargarMantenciones(); // Recargar la vista principal
      } catch (err) {
          mostrarMensaje('Error al guardar tarea: ' + err.message, 'error');
      } finally {
          ocultarSpinner();
      }
  });
}
