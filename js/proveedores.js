// js/proveedores.js

// --- VISTA PRINCIPAL DEL MÓDULO DE PROVEEDORES ---
async function cargarProveedores() {
  limpiarMainContent();
  mostrarSpinner();

  let proveedores = [];
  try {
    proveedores = await obtenerProveedores();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar proveedores: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Gestión de Proveedores</h2>
      <button class="btn" id="btnNuevoProveedor">Agregar Proveedor</button>
    </div>
    <div id="tablaProveedoresContainer" style="overflow-x:auto;"></div>
  `;

  renderTablaProveedores(proveedores);
  document.getElementById('btnNuevoProveedor').addEventListener('click', () => mostrarModalProveedor(null, proveedores, renderTablaProveedores));

  ocultarSpinner();
}

// --- RENDERIZA LA TABLA DE PROVEEDORES ---
function renderTablaProveedores(proveedores) {
  const container = document.getElementById('tablaProveedoresContainer');
  let html = `<table class="table">
    <thead>
      <tr>
        <th>Nombre Empresa</th>
        <th>RUT</th>
        <th>Contacto</th>
        <th>Teléfono</th>
        <th>Email</th>
        <th>Especialidad</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>`;

  if (proveedores.length > 0) {
    proveedores.forEach(p => {
      html += `
        <tr>
          <td>${p[1] || ''}</td>
          <td>${p[2] || ''}</td>
          <td>${p[3] || ''}</td>
          <td>${p[4] || ''}</td>
          <td>${p[5] || ''}</td>
          <td>${p[6] || ''}</td>
          <td>
            <button class="btn btn-sm secondary btn-edit" data-id="${p[0]}">Editar</button>
            <button class="btn btn-sm danger btn-delete" data-id="${p[0]}">Eliminar</button>
          </td>
        </tr>`;
    });
  } else {
    html += `<tr><td colspan="7">No hay proveedores registrados.</td></tr>`;
  }

  html += `</tbody></table>`;
  container.innerHTML = html;

  // Listeners para botones de la tabla
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const proveedoresActuales = await obtenerProveedores();
      const proveedor = proveedoresActuales.find(prov => prov[0] === id);
      mostrarModalProveedor(proveedor, proveedoresActuales, renderTablaProveedores);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
        mostrarSpinner();
        try {
          await eliminarProveedor(id);
          const proveedoresActualizados = await obtenerProveedores();
          renderTablaProveedores(proveedoresActualizados);
          mostrarMensaje('Proveedor eliminado con éxito.');
        } catch (err) {
          mostrarMensaje('Error al eliminar proveedor: ' + err.message, 'error');
        } finally {
          ocultarSpinner();
        }
      }
    });
  });
}

// --- MUESTRA EL MODAL PARA AGREGAR/EDITAR PROVEEDOR ---
function mostrarModalProveedor(proveedor, proveedores, callback) {
  const esNuevo = proveedor === null;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${esNuevo ? 'Agregar Nuevo' : 'Editar'} Proveedor</h3>
      <form id="formProveedor">
        <input type="hidden" name="id" value="${esNuevo ? '' : proveedor[0]}">
        <div class="form-grid">
          <div><label>Nombre Empresa</label><input type="text" name="nombre_empresa" value="${esNuevo ? '' : proveedor[1]}" required></div>
          <div><label>RUT Empresa</label><input type="text" name="rut_empresa" value="${esNuevo ? '' : proveedor[2]}"></div>
          <div><label>Nombre Contacto</label><input type="text" name="nombre_contacto" value="${esNuevo ? '' : proveedor[3]}"></div>
          <div><label>Teléfono Contacto</label><input type="text" name="telefono_contacto" value="${esNuevo ? '' : proveedor[4]}"></div>
          <div><label>Email Contacto</label><input type="email" name="email_contacto" value="${esNuevo ? '' : proveedor[5]}"></div>
          <div><label>Especialidad</label><input type="text" name="especialidad" value="${esNuevo ? '' : proveedor[6]}" placeholder="Ej: Gasfitería, Electricidad..."></div>
          <div style="grid-column: 1 / -1;"><label>Comentarios</label><textarea name="comentarios">${esNuevo ? '' : proveedor[7] || ''}</textarea></div>
        </div>
        <div class="text-right mt-4">
          <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
          <button class="btn" type="submit">Guardar</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);

  modal.querySelector('#btnCerrarModal').addEventListener('click', () => modal.remove());
  
  modal.querySelector('#formProveedor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datosProveedor = [
      formData.get('id'),
      formData.get('nombre_empresa'),
      formData.get('rut_empresa'),
      formData.get('nombre_contacto'),
      formData.get('telefono_contacto'),
      formData.get('email_contacto'),
      formData.get('especialidad'),
      formData.get('comentarios')
    ];

    mostrarSpinner();
    try {
      if (esNuevo) {
        await agregarProveedor(datosProveedor);
        mostrarMensaje('Proveedor agregado con éxito.');
      } else {
        await actualizarProveedor(datosProveedor);
        mostrarMensaje('Proveedor actualizado con éxito.');
      }
      modal.remove();
      const proveedoresActualizados = await obtenerProveedores();
      callback(proveedoresActualizados);
    } catch (err) {
      mostrarMensaje('Error al guardar: ' + err.message, 'error');
    } finally {
      ocultarSpinner();
    }
  });
}
