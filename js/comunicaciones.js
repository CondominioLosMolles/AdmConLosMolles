// js/comunicaciones.js
// Módulo Comunicaciones: historial, envío de mensajes, integración Gmail y registro en Sheets

async function cargarComunicaciones() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [], comunicaciones = [];
  try {
    residentes = await obtenerResidentes();
    comunicaciones = await obtenerComunicaciones();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Comunicaciones</h2>
    <div style="margin-bottom:24px;">
      <button class="btn" id="btnNuevaComunicacion">Nueva Comunicación</button>
    </div>
    <div id="tablaComunicaciones"></div>
    <div id="modalComunicacion" style="display:none;"></div>
  `;

  // Render historial
  function renderTablaComunicaciones() {
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha Envío</th>
            <th>Residente</th>
            <th>N° Parcela</th>
            <th>Email</th>
            <th>Asunto</th>
            <th>Mensaje</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const c of comunicaciones) {
      html += `<tr>
        <td>${c[5]}</td>
        <td>${c[3]}</td>
        <td>${c[2]}</td>
        <td>${c[4]}</td>
        <td>${c[6]}</td>
        <td>${c[7]}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaComunicaciones').innerHTML = html;
  }
  renderTablaComunicaciones();

  // Modal nueva comunicación
  document.getElementById('btnNuevaComunicacion').onclick = () => mostrarModalComunicacion();

  function mostrarModalComunicacion() {
    const modal = document.getElementById('modalComunicacion');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div>
        <h3>Nueva Comunicación</h3>
        <form id="formComunicacion">
          <label>Residente</label>
          <select name="idResidente" id="selectResidente" required>
            <option value="">Seleccione...</option>
            ${residentes.map(r => `<option value="${r[0]}">${r[1]} (Parcela ${r[3]})</option>`).join('')}
          </select>
          <label>Email</label>
          <input name="email" id="inputEmailCom" required readonly>
          <label>Asunto</label>
          <input name="asunto" required>
          <label>Mensaje</label>
          <textarea name="mensaje" required rows="4"></textarea>
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">Enviar</button>
            <button class="btn secondary" type="button" id="btnCerrarModalCom">Cancelar</button>
          </div>
        </form>
      </div>
    `;

    // Autocompletar email
    document.getElementById('selectResidente').onchange = (e) => {
      const id = e.target.value;
      const r = residentes.find(r => r[0] === id);
      document.getElementById('inputEmailCom').value = r ? r[5] : '';
    };

    document.getElementById('btnCerrarModalCom').onclick = () => modal.style.display = 'none';

    document.getElementById('formComunicacion').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const idResidente = fd.get('idResidente');
      const residente = residentes.find(r => r[0] === idResidente);
      if (!residente) {
        mostrarMensaje('Residente no válido', 'error');
        return;
      }
      const email = fd.get('email');
      const asunto = fd.get('asunto');
      const mensaje = fd.get('mensaje');
      const fechaEnvio = new Date().toISOString().slice(0, 16).replace('T', ' ');
      mostrarSpinner();
      try {
        // Enviar correo
        await enviarCorreo(email, asunto, mensaje);
        // Registrar en Sheets
        await agregarComunicacion([
          '', // ID autoincremental
          idResidente,
          residente[3], // N_Parcela
          residente[1], // Nombre_Completo
          email,
          fechaEnvio,
          asunto,
          mensaje
        ]);
        modal.style.display = 'none';
        comunicaciones = await obtenerComunicaciones();
        renderTablaComunicaciones();
        mostrarMensaje('Comunicación enviada');
      } catch (e) {
        mostrarMensaje('Error al enviar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  ocultarSpinner();
}

// Evento de menú
document.querySelector('[data-module="comunicaciones"]').addEventListener('click', cargarComunicaciones);
