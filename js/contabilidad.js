// js/contabilidad.js
// Módulo Contabilidad: muestra ingresos y egresos, permite agregar egresos y exportar

async function cargarContabilidad() {
  limpiarMainContent();
  mostrarSpinner();

  let pagos = [], egresos = [];
  try {
    pagos = await obtenerPagosGC();
    egresos = await obtenerEgresos();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Contabilidad</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <button class="btn" id="btnAgregarEgreso">Agregar Egreso</button>
      <button class="btn secondary" id="btnExportarIngresos">Exportar Ingresos</button>
      <button class="btn secondary" id="btnExportarEgresos">Exportar Egresos</button>
    </div>
    <div style="margin-bottom:32px;">
      <h3>Ingresos (Pagos y Multas)</h3>
      <div id="tablaIngresos"></div>
    </div>
    <div>
      <h3>Egresos</h3>
      <div id="tablaEgresos"></div>
    </div>
    <div id="modalEgreso" style="display:none;"></div>
  `;

  // Render ingresos
  function renderTablaIngresos() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Nombre Residente</th>
            <th>N° Parcela</th>
            <th>Periodo</th>
            <th>Monto Pagado</th>
            <th>Multa</th>
            <th>Fecha Pago</th>
            <th>Método Pago</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const p of pagos) {
      html += `<tr>
        <td>${p[1]}</td>
        <td>${p[2]}</td>
        <td>${p[4]}</td>
        <td>${p[6]}</td>
        <td>${p[10]}</td>
        <td>${p[13]}</td>
        <td>${p[14]}</td>
        <td>${p[15]}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaIngresos').innerHTML = html;
  }
  renderTablaIngresos();

  // Render egresos
  function renderTablaEgresos() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Proveedor</th>
            <th>RUT Proveedor</th>
            <th>Monto</th>
            <th>Factura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const e of egresos) {
      html += `<tr>
        <td>${e[1]}</td>
        <td>${e[2]}</td>
        <td>${e[3]}</td>
        <td>${e[4]}</td>
        <td>${e[5]}</td>
        <td>${e[6]}</td>
        <td>${e[7] ? `<a href="${e[7]}" target="_blank">Ver</a>` : ''}</td>
        <td>
          <button class="btn secondary btn-eliminar-egreso" data-id="${e[0]}">🗑️</button>
        </td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaEgresos').innerHTML = html;
  }
  renderTablaEgresos();

  // Exportar ingresos
  document.getElementById('btnExportarIngresos').onclick = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre Residente","N° Parcela","Periodo","Monto Pagado","Multa","Fecha Pago","Método Pago","Estado"],
      ...pagos.map(p => [p[1],p[2],p[4],p[6],p[10],p[13],p[14],p[15]])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
    XLSX.writeFile(wb, "Ingresos.xlsx");
  };

  // Exportar egresos
  document.getElementById('btnExportarEgresos').onclick = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Fecha","Categoría","Descripción","Proveedor","RUT Proveedor","Monto","Factura"],
      ...egresos.map(e => [e[1],e[2],e[3],e[4],e[5],e[6],e[7]])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Egresos");
    XLSX.writeFile(wb, "Egresos.xlsx");
  };

  // Modal agregar egreso
  document.getElementById('btnAgregarEgreso').onclick = () => mostrarModalEgreso();

  function mostrarModalEgreso() {
    const modal = document.getElementById('modalEgreso');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div>
        <h3>Agregar Egreso</h3>
        <form id="formEgreso">
          <label>Fecha</label>
          <input name="fecha" required type="date">
          <label>Categoría</label>
          <select name="categoria" required>
            <option>Remuneraciones</option>
            <option>Servicios Básicos</option>
            <option>Mantención</option>
            <option>Administrativo</option>
            <option>Otros</option>
          </select>
          <label>Descripción</label>
          <input name="descripcion" required>
          <label>Proveedor</label>
          <input name="proveedor" required>
          <label>RUT Proveedor</label>
          <input name="rutProveedor" required>
          <label>Monto</label>
          <input name="monto" required type="number">
          <label>Factura</label>
          <input name="factura" id="inputFactura" type="file" accept="image/*,application/pdf">
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn secondary" type="button" id="btnCerrarModalEgreso">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModalEgreso').onclick = () => modal.style.display = 'none';
    document.getElementById('formEgreso').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fecha = fd.get('fecha');
      const categoria = fd.get('categoria');
      const descripcion = fd.get('descripcion');
      const proveedor = fd.get('proveedor');
      const rutProveedor = fd.get('rutProveedor');
      const monto = fd.get('monto');
      const file = fd.get('factura');
      let idFacturaDrive = '';
      mostrarSpinner();
      try {
        if (file && file.size > 0) {
          // Debes obtener el ID de la carpeta de egresos en Drive
          const carpetaId = await obtenerCarpetaDriveEgresos(); // Implementa en drive.js
          const res = await subirComprobante(file, carpetaId);
          idFacturaDrive = res.id;
        }
        await agregarEgreso([
          '', // ID autoincremental
          fecha,
          categoria,
          descripcion,
          proveedor,
          rutProveedor,
          monto,
          idFacturaDrive
        ]);
        modal.style.display = 'none';
        egresos = await obtenerEgresos();
        renderTablaEgresos();
        mostrarMensaje('Egreso registrado');
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  // Eliminar egreso
  document.getElementById('tablaEgresos').onclick = async (e) => {
    if (e.target.classList.contains('btn-eliminar-egreso')) {
      const id = e.target.dataset.id;
      if (confirm('¿Está seguro de que desea eliminar este egreso?')) {
        mostrarSpinner();
        try {
          await eliminarEgreso(id); // Implementa en sheets.js
          egresos = await obtenerEgresos();
          renderTablaEgresos();
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
document.querySelector('[data-module="contabilidad"]').addEventListener('click', cargarContabilidad);
