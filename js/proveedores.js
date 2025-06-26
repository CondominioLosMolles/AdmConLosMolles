// js/proveedores.js - Versión Corregida y Completa

// =================================================================
// ===== FUNCIONES DE COMUNICACIÓN CON GOOGLE APPS SCRIPT =====
// Estas funciones son el "puente" para hablar con tu hoja de cálculo.
// =================================================================

function obtenerProveedores() {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .obtenerProveedores_GS();
  });
}

function agregarProveedor(datosProveedor) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .agregarProveedor_GS(datosProveedor);
  });
}

function actualizarProveedor(datosProveedor) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .actualizarProveedor_GS(datosProveedor);
  });
}

function eliminarProveedor(id) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .eliminarProveedor_GS(id);
  });
}


// =================================================================
// ===== CÓDIGO DE LA INTERFAZ DE USUARIO (TU CÓDIGO ORIGINAL) =====
// =================================================================

async function cargarProveedores() {
  limpiarMainContent();
  mostrarSpinner();
  let proveedores = [];
  try {
    // Esta llamada ahora funcionará porque la función está definida arriba
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
  document.getElementById('btnNuevoProveedor').addEventListener('click', () => mostrarFormularioProveedor(null));
  ocultarSpinner();
}

function renderTablaProveedores(proveedores) {
  const container = document.getElementById('tablaProveedoresContainer');
  let html = `<table class="table">
    <thead><tr><th>Nombre Empresa</th><th>RUT</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>Especialidad</th><th>Acciones</th></tr></thead>
    <tbody>`;
  if (proveedores.length > 0) {
    proveedores.forEach(p => {
      html += `
        <tr>
          <td>${p[1] || ''}</td><td>${p[2] || ''}</td><td>${p[3] || ''}</td>
          <td>${p[4] || ''}</td><td>${p[5] || ''}</td><td>${p[6] || ''}</td>
          <td>
            <button class="btn btn-sm secondary btn-edit" data-id="${p[0]}">Editar</button>
            <button class="btn btn-sm danger btn-delete" data-id="${p[0]}">Eliminar</button>
          </td>
        </tr>`;
    });
  } else {
    html += `<tr><td colspan="7" style="text-align:center; padding:20px;">No hay proveedores registrados.</td></tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      // Esta llamada también funcionará ahora
      const proveedor = (await obtenerProveedores()).find(prov => prov[0] == id);
      if(proveedor) mostrarFormularioProveedor(proveedor);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
        mostrarSpinner();
        try {
          // Y esta...
          await eliminarProveedor(id);
          renderTablaProveedores(await obtenerProveedores());
          mostrarMensaje('Proveedor eliminado.', 'success');
        } catch (err) { mostrarMensaje('Error al eliminar: ' + err.message, 'error'); } 
        finally { ocultarSpinner(); }
      }
    });
  });
}

function mostrarFormularioProveedor(proveedor) {
    const esNuevo = proveedor === null;
    const id = esNuevo ? '' : proveedor[0];
    const titulo = esNuevo ? 'Agregar Nuevo Proveedor' : 'Editar Proveedor';

    const cuerpoHtml = `
        <form id="form-proveedor-global">
            <input type="hidden" name="id" value="${id}">
            <div class="form-grid">
              <div><label>Nombre Empresa</label><input type="text" name="nombre_empresa" value="${esNuevo ? '' : proveedor[1]}" required></div>
              <div><label>RUT Empresa</label><input type="text" name="rut_empresa" value="${esNuevo ? '' : proveedor[2] || ''}"></div>
              <div><label>Nombre Contacto</label><input type="text" name="nombre_contacto" value="${esNuevo ? '' : proveedor[3] || ''}"></div>
              <div><label>Teléfono Contacto</label><input type="text" name="telefono_contacto" value="${esNuevo ? '' : proveedor[4] || ''}"></div>
              <div><label>Email Contacto</label><input type="email" name="email_contacto" value="${esNuevo ? '' : proveedor[5] || ''}"></div>
              <div><label>Especialidad</label><input type="text" name="especialidad" value="${esNuevo ? '' : proveedor[6] || ''}" placeholder="Ej: Gasfitería..."></div>
              <div style="grid-column: 1 / -1;"><label>Comentarios</label><textarea name="comentarios">${esNuevo ? '' : proveedor[7] || ''}</textarea></div>
            </div>
        </form>
    `;

    const guardarFn = async () => {
        const form = document.getElementById('form-proveedor-global');
        const formData = new FormData(form);
        const datosProveedor = [
          formData.get('id'), formData.get('nombre_empresa'), formData.get('rut_empresa'),
          formData.get('nombre_contacto'), formData.get('telefono_contacto'), formData.get('email_contacto'),
          formData.get('especialidad'), formData.get('comentarios')
        ];

        if (!datosProveedor[1]) {
            mostrarMensaje('El nombre de la empresa es obligatorio.', 'error');
            return;
        }

        mostrarSpinner();
        try {
            if (esNuevo) {
                // ...y esta llamada también es correcta ahora.
                await agregarProveedor(datosProveedor);
                mostrarMensaje('Proveedor agregado con éxito.', 'success');
            } else {
                await actualizarProveedor(datosProveedor);
                mostrarMensaje('Proveedor actualizado con éxito.', 'success');
            }
            ocultarModalGlobal();
            renderTablaProveedores(await obtenerProveedores());
        } catch (err) { mostrarMensaje('Error al guardar: ' + err.message, 'error'); }
        finally { ocultarSpinner(); }
    };

    mostrarModalGlobal(titulo, cuerpoHtml, guardarFn, 'large');
}
