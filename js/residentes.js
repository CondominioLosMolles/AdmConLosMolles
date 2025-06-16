// js/residentes.js
// Módulo Residentes: Tabla, búsqueda, alta, edición, eliminación y exportación

async function cargarResidentes() {
  limpiarMainContent();
  mostrarSpinner();

  // 1. Obtener datos desde Google Sheets
  let residentes = [];
  try {
    residentes = await obtenerResidentes(); // Función definida en sheets.js
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar residentes: ' + e.message, 'error');
    return;
  }

  // 2. Renderizar búsqueda y botón agregar/exportar
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Residentes</h2>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <input type="text" id="busquedaResidente" placeholder="Buscar por nombre, RUT o N° Parcela" style="width:40%;"/>
      <div>
        <button class="btn" id="btnAgregarResidente">Agregar Residente</button>
        <button class="btn secondary" id="btnExportarResidentes">Descargar Excel</button>
      </div>
    </div>
    <div id="tablaResidentes"></div>
    <div id="modalResidente" style="display:none;"></div>
  `;

  // 3. Renderizar tabla
  function renderTabla(filtro = '') {
    const filtrados = residentes.filter(r => {
      const [id, nombre, rut, parcela, direccion, email, tel, estado, valorGC] = r;
      const str = `${nombre} ${rut} ${parcela}`.toLowerCase();
      return str.includes(filtro.toLowerCase());
    });

    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>RUT</th>
            <th>N° Parcela</th>
            <th>Dirección</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Valor Gasto Común</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const r of filtrados) {
      const [id, nombre, rut, parcela, direccion, email, tel, estado, valorGC] = r;
      html += `
        <tr>
          <td>${nombre}</td>
          <td>${rut}</td>
          <td>${parcela}</td>
          <td>${direccion}</td>
          <td>${email}</td>
          <td>${tel}</td>
          <td>${estado}</td>
          <td>${valorGC}</td>
          <td>
            <button class="btn secondary btn-editar" data-id="${id}">✏️</button>
            <button class="btn secondary btn-eliminar" data-id="${id}">🗑️</button>
          </td>
        </tr>
      `;
    }
    html += '</tbody></table>';
    document.getElementById('tablaResidentes').innerHTML = html;
  }
  renderTabla();

  // 4. Búsqueda en tiempo real
  document.getElementById('busquedaResidente').addEventListener('input', e => {
    renderTabla(e.target.value);
  });

  // 5. Exportar a Excel
  document.getElementById('btnExportarResidentes').onclick = () => {
    // Usa SheetJS para exportar
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre Completo", "RUT", "N° Parcela", "Dirección", "Email", "Teléfono", "Estado", "Valor Gasto Común"],
      ...residentes.map(r => r.slice(1,9))
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Residentes.xlsx");
  };

  // 6. Formulario agregar/editar residente
  function mostrarModalResidente(datos = null) {
    const modal = document.getElementById('modalResidente');
    modal.style.display = 'block';
    const isEdit = !!datos;
    modal.innerHTML = `
      <div style="background:#fff;padding:24px;border-radius:8px;max-width:400px;margin:40px auto;box-shadow:0 2px 8px #0001;">
        <h3>${isEdit ? 'Editar' : 'Agregar'} Residente</h3>
        <form id="formResidente">
          <input type="hidden" name="id" value="${datos ? datos[0] : ''}">
          <label>Nombre Completo</label>
          <input name="nombre" required value="${datos ? datos[1] : ''}">
          <label>RUT</label>
          <input name="rut" required value="${datos ? datos[2] : ''}">
          <label>N° Parcela</label>
          <input name="parcela" required value="${datos ? datos[3] : ''}">
          <label>Dirección</label>
          <input name="direccion" required value="${datos ? datos[4] : ''}">
          <label>Email</label>
          <input name="email" type="email" required value="${datos ? datos[5] : ''}">
          <label>Teléfono</label>
          <input name="tel" required value="${datos ? datos[6] : ''}">
          <label>Estado</label>
          <select name="estado" required>
            <option value="Activo" ${datos && datos[7]==='Activo'?'selected':''}>Activo</option>
            <option value="Moroso" ${datos && datos[7]==='Moroso'?'selected':''}>Moroso</option>
            <option value="Inactivo" ${datos && datos[7]==='Inactivo'?'selected':''}>Inactivo</option>
          </select>
          <label>Valor Gasto Común</label>
          <input name="valorGC" required type="number" value="${datos ? datos[8] : ''}">
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">${isEdit ? 'Guardar Cambios' : 'Agregar'}</button>
            <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModal').onclick = () => modal.style.display = 'none';
    document.getElementById('formResidente').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = [
        fd.get('id') || '', // ID
        fd.get('nombre'),
        fd.get('rut'),
        fd.get('parcela'),
        fd.get('direccion'),
        fd.get('email'),
        fd.get('tel'),
        fd.get('estado'),
        fd.get('valorGC')
      ];
      mostrarSpinner();
      try {
        if (isEdit) {
          await actualizarResidente(data); // Implementa en sheets.js
        } else {
          await agregarResidente(data); // Implementa en sheets.js
        }
        modal.style.display = 'none';
        cargarResidentes();
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  // 7. Botón agregar
  document.getElementById('btnAgregarResidente').onclick = () => mostrarModalResidente();

  // 8. Acciones editar/eliminar
  document.getElementById('tablaResidentes').onclick = async (e) => {
    if (e.target.classList.contains('btn-editar')) {
      const id = e.target.dataset.id;
      const datos = residentes.find(r => r[0] === id);
      mostrarModalResidente(datos);
    }
    if (e.target.classList.contains('btn-eliminar')) {
      const id = e.target.dataset.id;
      if (confirm('¿Está seguro de que desea eliminar a este residente?')) {
        mostrarSpinner();
        try {
          await eliminarResidente(id); // Implementa en sheets.js
          cargarResidentes();
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
document.querySelector('[data-module="residentes"]').addEventListener('click', cargarResidentes);
