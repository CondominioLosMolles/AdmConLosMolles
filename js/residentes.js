// js/residentes.js
async function cargarResidentes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [];
  try {
    residentes = await obtenerResidentes();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar residentes: ' + e.message, 'error');
    return;
  }

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
          <td>
            <span class="estado-tag estado-${estado.toLowerCase()}">${estado}</span>
          </td>
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

  document.getElementById('busquedaResidente').addEventListener('input', e => {
    renderTabla(e.target.value);
  });

  document.getElementById('btnExportarResidentes').onclick = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre Completo", "RUT", "N° Parcela", "Dirección", "Email", "Teléfono", "Estado", "Valor Gasto Común"],
      ...residentes.map(r => r.slice(1,9))
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Residentes.xlsx");
  };

  function mostrarModalResidente(datos = null) {
    const modal = document.getElementById('modalResidente');
    modal.style.display = 'flex';
    const isEdit = !!datos;
    modal.innerHTML = `
      <div>
        <h3 style="margin-bottom:18px;">${isEdit ? 'Editar' : 'Agregar'} Residente</h3>
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
          <div style="margin-top:18px;text-align:right;">
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
          await actualizarResidente(data);
        } else {
          await agregarResidente(data);
        }
        modal.style.display = 'none';
        cargarResidentes();
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  document.getElementById('btnAgregarResidente').onclick = () => mostrarModalResidente();

  document.getElementById('tablaResidentes').onclick = async (e) => {
    if (e.target.classList.contains('btn-editar')) {
      const id = e.target.dataset.id;
      const datos = residentes.find(r => r[0] === id);
      mostrarModalResidente(datos);
    }
    if (e.target.classList.contains('btn-eliminar')) {
      const id = e.target.dataset.id;
      if (!confirm('¿Está seguro de que desea eliminar a este residente?')) return;
      mostrarSpinner();
      try {
        // Busca el índice real en la hoja actualizada
        const residentesActualizados = await obtenerResidentes();
        const idx = residentesActualizados.findIndex(r => r[0] === id);
        if (idx === -1) throw new Error('No encontrado');
        const row = idx + 2;
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: SHEET_ID_RESIDENTES, // Asegúrate que esté bien definido en sheets.js
                  dimension: "ROWS",
                  startIndex: row - 1,
                  endIndex: row
                }
              }
            }]
          }
        });
        mostrarMensaje('Residente eliminado correctamente');
        cargarResidentes();
      } catch (e) {
        mostrarMensaje('Error al eliminar: ' + (e.result?.error?.message || e.message || e), 'error');
      }
      ocultarSpinner();
    }
  };

  ocultarSpinner();
}

document.querySelector('[data-module="residentes"]').addEventListener('click', cargarResidentes);
