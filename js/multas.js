// js/multas.js
// Módulo Multas: tabla, alta de multa, pago de multa, notificación automática por Gmail

async function cargarMultas() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [], multas = [];
  try {
    residentes = await obtenerResidentes();
    multas = await obtenerMultas();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar multas: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 24px;">
      <h2>Multas</h2>
      <button class="btn" id="btnAgregarMulta">Cursar Multa</button>
    </div>
    <div id="tablaMultas" class="table-container"></div>
    <div id="modalMultaContainer"></div>
  `;

  // Render tabla
  function renderTablaMultas() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Residente</th>
            <th>Parcela</th>
            <th>Fecha Infracción</th>
            <th>Descripción</th>
            <th>Monto</th>
            <th>Estado</th>
            <th>Fecha Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    if (multas && multas.length > 0) {
        multas.sort((a,b) => new Date(b[2]) - new Date(a[2])).forEach(m => {
          const residente = residentes.find(r => r[0] === m[1]);
          html += `<tr>
            <td>${residente ? residente[1] : 'N/A'}</td>
            <td>${residente ? residente[3] : 'N/A'}</td>
            <td>${m[2] ? new Date(m[2].replace(/-/g, '/')).toLocaleDateString('es-CL') : 'N/A'}</td>
            <td style="white-space:normal;">${m[3]}</td>
            <td>$${parseFloat(m[4] || 0).toLocaleString('es-CL')}</td>
            <td><span class="estado-tag ${m[5] === 'Pagada' ? 'estado-pagado' : 'estado-moroso'}">${m[5]}</span></td>
            <td>${m[6] ? new Date(m[6].replace(/-/g, '/')).toLocaleDateString('es-CL') : ''}</td>
            <td>
              ${m[5] === 'Pendiente' ? `<button class="btn btn-sm secondary btn-pagar-multa" data-id="${m[0]}">Registrar Pago</button>` : ''}
              <button class="btn btn-sm danger btn-eliminar-multa" data-id="${m[0]}">🗑️</button>
            </td>
          </tr>`;
        });
    } else {
        html += `<tr><td colspan="8" style="text-align:center; padding: 20px;">No hay multas registradas.</td></tr>`;
    }
    
    html += '</tbody></table>';
    document.getElementById('tablaMultas').innerHTML = html;
  }
  renderTablaMultas();

  // Modal agregar multa
  document.getElementById('btnAgregarMulta').onclick = () => mostrarModalMulta();

  function mostrarModalMulta() {
    const modalContainer = document.getElementById('modalMultaContainer');
    const cuerpoHtml = `
      <form id="formMulta">
        <label>Residente</label>
        <select name="idResidente" id="selectResidenteMulta" required>
          <option value="">Seleccione...</option>
          ${residentes.map(r => `<option value="${r[0]}">${r[1]} (Parcela ${r[3]})</option>`).join('')}
        </select>
        <label>Fecha Infracción</label>
        <input name="fechaInfraccion" required type="date" value="${new Date().toISOString().split('T')[0]}">
        <label>Descripción</label>
        <textarea name="descripcion" required rows="3"></textarea>
        <label>Monto</label>
        <input name="monto" required type="number" min="0">
      </form>
    `;

    const guardarFn = async () => {
        const form = document.getElementById('formMulta');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const fd = new FormData(form);
        const idResidente = fd.get('idResidente');
        const residente = residentes.find(r => r[0] === idResidente);
        if (!residente || !residente[5]) {
            mostrarMensaje('El residente seleccionado no es válido o no tiene un email registrado.', 'error');
            return;
        }
        
        const fechaInfraccion = fd.get('fechaInfraccion');
        const descripcion = fd.get('descripcion');
        const monto = fd.get('monto');
        
        mostrarSpinner();
        try {
            await agregarMulta([
            null, // ID autoincremental
            idResidente,
            fechaInfraccion,
            descripcion,
            monto,
            'Pendiente',
            ''
            ]);
            
            await enviarCorreo(
            residente[5],
            'Notificación de Multa - Condominio Los Molles',
            `<p>Estimado/a ${residente[1]},</p><p>Le informamos que se le ha cursado una multa por el siguiente motivo: <b>${descripcion}</b>.</p><p>La infracción ocurrió con fecha <b>${new Date(fechaInfraccion.replace(/-/g, '/')).toLocaleDateString('es-CL')}</b> y el monto asociado es de <b>$${parseFloat(monto).toLocaleString('es-CL')}</b>.</p><p>Para regularizar esta situación, por favor póngase en contacto con la administración.</p><p>Atentamente,<br>Administración Condominio Los Molles</p>`
            );

            ocultarModalGlobal();
            multas = await obtenerMultas();
            renderTablaMultas();
            mostrarMensaje('Multa registrada y notificada con éxito.', 'success');
        } catch (e) {
            mostrarMensaje('Error al guardar la multa: ' + e.message, 'error');
        } finally {
            ocultarSpinner();
        }
    };
    
    mostrarModalGlobal("Cursar Nueva Multa", cuerpoHtml, guardarFn);
  }

  // Registrar pago de multa y eliminar multa
  document.getElementById('tablaMultas').onclick = async (e) => {
    const pagarBtn = e.target.closest('.btn-pagar-multa');
    const eliminarBtn = e.target.closest('.btn-eliminar-multa');

    if (pagarBtn) {
      const id = pagarBtn.dataset.id;
      const multa = multas.find(m => m[0] === id);
      if (!multa) return;

      if (confirm('¿Está seguro de que desea registrar esta multa como PAGADA?')) {
        mostrarSpinner();
        try {
          multa[5] = 'Pagada';
          multa[6] = new Date().toISOString().split('T')[0];
          await actualizarMulta(multa);
          multas = await obtenerMultas(); // Recargar datos
          renderTablaMultas();
          mostrarMensaje('Pago de multa registrado.', 'success');
        } catch (err) {
          mostrarMensaje('Error al registrar pago: ' + err.message, 'error');
        } finally {
          ocultarSpinner();
        }
      }
    }

    if (eliminarBtn) {
      const id = eliminarBtn.dataset.id;
      if (confirm('¿Está seguro de que desea ELIMINAR esta multa? Esta acción no se puede deshacer.')) {
        mostrarSpinner();
        try {
          await eliminarMulta(id);
          multas = multas.filter(m => m[0] !== id); // Actualizar localmente
          renderTablaMultas();
          mostrarMensaje('Multa eliminada.', 'success');
        } catch (err) {
          mostrarMensaje('Error al eliminar: ' + err.message, 'error');
        } finally {
          ocultarSpinner();
        }
      }
    }
  };

  ocultarSpinner();
}
