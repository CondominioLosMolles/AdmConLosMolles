// js/asambleas.js
// Módulo Asambleas: tabla, programación, notificación masiva, subida de acta a Drive

async function cargarAsambleas() {
  limpiarMainContent();
  mostrarSpinner();

  let asambleas = [];
  try {
    asambleas = await obtenerAsambleas();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar asambleas: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 24px;">
      <h2>Asambleas</h2>
      <button class="btn" id="btnProgramarAsamblea">Programar Asamblea</button>
    </div>
    <div id="tablaAsambleas" class="table-container"></div>
    <div id="modalAsambleaContainer"></div>
  `;

  function renderTablaAsambleas() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acta</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    if (asambleas && asambleas.length > 0) {
        asambleas.sort((a,b) => new Date(b[1]) - new Date(a[1])).forEach(a => {
            html += `<tr>
                <td>${a[1] ? new Date(a[1].replace(/-/g, '/')).toLocaleDateString('es-CL') : 'N/A'}</td>
                <td>${a[2] || ''}</td>
                <td style="white-space: normal;">${a[3] || ''}</td>
                <td>${a[4] || ''}</td>
                <td>${a[5] ? `<a href="${a[5]}" class="btn btn-sm" target="_blank">Ver Acta</a>` : 'No disponible'}</td>
                <td>
                <button class="btn btn-sm danger btn-eliminar-asamblea" data-id="${a[0]}">🗑️</button>
                </td>
            </tr>`;
        });
    } else {
        html += `<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay asambleas registradas.</td></tr>`;
    }
    
    html += '</tbody></table>';
    document.getElementById('tablaAsambleas').innerHTML = html;
  }
  renderTablaAsambleas();

  document.getElementById('btnProgramarAsamblea').onclick = () => mostrarModalAsamblea();

  function mostrarModalAsamblea() {
    const cuerpoHtml = `
      <form id="formAsamblea">
        <label>Fecha</label>
        <input name="fecha" required type="date" value="${new Date().toISOString().split('T')[0]}">
        <label>Tipo</label>
        <select name="tipo" required>
          <option value="Ordinaria">Ordinaria</option>
          <option value="Extraordinaria">Extraordinaria</option>
        </select>
        <label>Descripción / Puntos a tratar</label>
        <textarea name="descripcion" required rows="4"></textarea>
        <label>Estado</label>
        <select name="estado" required>
          <option value="Programada">Programada</option>
          <option value="Realizada">Realizada</option>
          <option value="Cancelada">Cancelada</option>
        </select>
        <label>Acta (PDF, Opcional)</label>
        <input name="acta" type="file" accept=".pdf,.doc,.docx">
      </form>
    `;
    
    const guardarFn = async () => {
      const form = document.getElementById('formAsamblea');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const fecha = fd.get('fecha');
      const tipo = fd.get('tipo');
      const descripcion = fd.get('descripcion');
      const estado = fd.get('estado');
      const file = form.querySelector('[name="acta"]').files[0];
      let linkActa = '';

      mostrarSpinner();
      try {
        if (file && file.size > 0) {
          const carpetaAsambleasId = await findFolderId('Asambleas', CARPETA_BASE_ID) || await createFolder('Asambleas', CARPETA_BASE_ID);
          const res = await subirComprobante(file, carpetaAsambleasId); // Reutiliza la función de subir
          linkActa = res.webViewLink;
        }

        await agregarAsamblea(['', fecha, tipo, descripcion, estado, linkActa]);

        const residentes = await obtenerResidentes();
        const emails = residentes.filter(r => r[7] === 'Activo' && r[5]).map(r => r[5]);
        
        const asunto = `Convocatoria a Asamblea ${tipo} - Condominio Los Molles`;
        const mensajeHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>${asunto}</title></head>
            <body style="font-family: Arial, sans-serif; margin: 20px; padding: 0;">
                <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
                    <h2>Convocatoria a Asamblea</h2>
                    <p>Estimados Residentes,</p>
                    <p>Se les convoca a una <b>Asamblea ${tipo}</b> que se llevará a cabo en la siguiente fecha:</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #2a7ca3;">${new Date(fecha.replace(/-/g, '/')).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <h3>Puntos a Tratar:</h3>
                    <p style="white-space: pre-wrap;">${descripcion}</p>
                    <p>Su participación es fundamental para la toma de decisiones de nuestra comunidad.</p>
                    <br>
                    <p>Atentamente,<br><b>La Administración</b><br>Condominio Los Molles</p>
                </div>
            </body>
            </html>
        `;

        await enviarCorreo(emails, asunto, mensajeHtml);
        
        ocultarModalGlobal();
        cargarAsambleas();
        mostrarMensaje('Asamblea programada y notificada a todos los residentes activos.');

      } catch (e) {
        mostrarMensaje('Error al guardar asamblea: ' + e.message, 'error');
      } finally {
        ocultarSpinner();
      }
    };

    mostrarModalGlobal('Programar Asamblea', cuerpoHtml, guardarFn, 'large');
  }

  document.getElementById('tablaAsambleas').onclick = async (e) => {
    const eliminarBtn = e.target.closest('.btn-eliminar-asamblea');
    if (eliminarBtn) {
      const id = eliminarBtn.dataset.id;
      if (confirm('¿Está seguro de que desea eliminar esta asamblea?')) {
        mostrarSpinner();
        try {
          await eliminarAsamblea(id);
          asambleas = asambleas.filter(a => a[0] !== id);
          renderTablaAsambleas();
          mostrarMensaje('Asamblea eliminada.');
        } catch (e) {
          mostrarMensaje('Error al eliminar: ' + e.message, 'error');
        } finally {
          ocultarSpinner();
        }
      }
    }
  };

  ocultarSpinner();
}
