// js/comunicaciones.js
// --- VERSIÓN FINAL CORREGIDA Y FUNCIONAL ---

async function cargarComunicaciones() {
    limpiarMainContent();
    mostrarSpinner();

    // --- OBTENCIÓN DE EMAIL SIN USAR gapi.auth2 ---
    // Se usa gapi.client, que ya está autenticado en tu flujo, para obtener el email del remitente.
    let senderEmail;
    try {
        const profile = await gapi.client.gmail.users.getProfile({ userId: 'me' });
        senderEmail = profile.result.emailAddress;
        if (!senderEmail) {
            throw new Error("No se pudo obtener la dirección de email desde el perfil de Gmail.");
        }
    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error Crítico al obtener perfil de Gmail: ' + e.message, 'error');
        return;
    }

    let residentes = [], comunicaciones = [];
    try {
        [residentes, comunicaciones] = await Promise.all([
            obtenerResidentes(),
            obtenerComunicaciones()
        ]);
    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error al cargar datos del sistema: ' + e.message, 'error');
        return;
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
    <style>
      .comunicaciones-container { display: flex; gap: 24px; flex-wrap: wrap; }
      .historial-panel { flex: 1; min-width: 300px; }
      .nueva-com-panel { flex: 1.5; min-width: 400px; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .destinatarios-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 150px; overflow-y: auto; background: #f9f9f9; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
      .destinatarios-grid label { display: block; }
    </style>

    <h2>Central de Comunicaciones</h2>
    <div class="comunicaciones-container">
      <div class="nueva-com-panel">
        <h3>Nueva Comunicación</h3>
        <form id="formComunicacion">
          
          <label for="selectPlantilla"><b>Usar Plantilla (Opcional)</b></label>
          <select id="selectPlantilla" class="form-control" style="margin-bottom: 1rem;">
            <option value="">-- Redacción Manual --</option>
            <option value="citacion_asamblea">Citación a Asamblea</option>
            <option value="aviso_corte_mantencion">Aviso de Corte de Suministro por Mantención</option>
            <option value="comunicado_general">Comunicado General</option>
          </select>

          <label for="selectDestinatarioTipo"><b>Destinatarios</b></label>
          <select id="selectDestinatarioTipo" class="form-control" style="margin-bottom: 0.5rem;">
            <option value="todos">Toda la comunidad</option>
            <option value="individual">Seleccionar Residente(s)</option>
          </select>

          <div id="destinatariosContainer" style="display:none; margin-bottom: 1rem;">
             <input type="text" id="filtroResidentes" class="form-control" placeholder="Buscar residente por nombre o parcela..." style="margin-bottom: 0.5rem;">
             <div id="destinatariosGrid" class="destinatarios-grid">
                ${residentes.map(r => `
                  <label>
                    <input type="checkbox" class="residente-checkbox" name="residente" value="${r[0]}">
                    ${r[1]} (P. ${r[3]})
                  </label>
                `).join('')}
             </div>
          </div>
          
          <label for="inputAsunto"><b>Asunto</b></label>
          <input type="text" id="inputAsunto" name="asunto" class="form-control" style="margin-bottom: 1rem;" required>
          
          <label for="textareaMensaje"><b>Mensaje</b></label>
          <textarea id="textareaMensaje" name="mensaje" rows="8" class="form-control" style="margin-bottom: 1rem;" required></textarea>

          <label for="inputAdjuntos"><b>Adjuntar Archivos (Funcionalidad futura)</b></label>
          <input type="file" id="inputAdjuntos" class="form-control" multiple disabled>

          <div style="text-align: right; margin-top: 1.5rem;">
            <button type="submit" class="btn">Enviar Comunicación</button>
          </div>
        </form>
      </div>

      <div class="historial-panel">
        <h3>Historial de Envíos</h3>
        <div id="tablaComunicaciones" style="overflow-x:auto;"></div>
      </div>
    </div>
  `;

    const tablaComunicacionesDiv = document.getElementById('tablaComunicaciones');
    const selectDestinatarioTipo = document.getElementById('selectDestinatarioTipo');
    const destinatariosContainer = document.getElementById('destinatariosContainer');
    const filtroResidentes = document.getElementById('filtroResidentes');
    const formComunicacion = document.getElementById('formComunicacion');
    const selectPlantilla = document.getElementById('selectPlantilla');
    const inputAsunto = document.getElementById('inputAsunto');
    const textareaMensaje = document.getElementById('textareaMensaje');

    function renderTablaComunicaciones() {
        let html = `<table class="table"><thead><tr><th>Fecha</th><th>Asunto</th><th>Destinatario(s)</th></tr></thead><tbody>`;
        if (comunicaciones && comunicaciones.length > 0) {
            comunicaciones.sort((a, b) => new Date(b[5]) - new Date(a[5])).forEach(c => {
                html += `<tr>
                    <td>${new Date(c[5]).toLocaleString('es-CL')}</td>
                    <td>${c[6]}</td>
                    <td>${c[3]}</td>
                </tr>`;
            });
        } else {
            html += `<tr><td colspan="3" style="text-align:center;">No hay comunicaciones registradas.</td></tr>`;
        }
        html += `</tbody></table>`;
        tablaComunicacionesDiv.innerHTML = html;
    }

    selectDestinatarioTipo.addEventListener('change', (e) => {
        destinatariosContainer.style.display = e.target.value === 'individual' ? 'block' : 'none';
    });

    filtroResidentes.addEventListener('input', (e) => {
        const filtro = e.target.value.toLowerCase();
        document.querySelectorAll('#destinatariosGrid label').forEach(label => {
            label.style.display = label.textContent.toLowerCase().includes(filtro) ? 'block' : 'none';
        });
    });
    
    selectPlantilla.addEventListener('change', (e) => {
        switch(e.target.value) {
            case 'citacion_asamblea':
                inputAsunto.value = "Citación a Asamblea de Copropietarios";
                textareaMensaje.value = "Estimados residentes,\n\nSe les cita a participar de la Asamblea [Ordinaria/Extraordinaria] de Copropietarios, que se realizará el día [FECHA] a las [HORA] en [LUGAR].\n\nTabla a tratar:\n1. ...\n2. ...\n\nSu participación es de suma importancia para la toma de decisiones de nuestra comunidad, en conformidad con la Ley 21.442.\n\nSaludos cordiales,\nEl Comité de Administración.";
                break;
            case 'aviso_corte_mantencion':
                 inputAsunto.value = "Aviso de Corte Programado de Suministro";
                 textareaMensaje.value = "Estimados residentes,\n\nLes informamos que el día [FECHA] se realizará un corte programado del suministro de [Agua/Luz] entre las [HORA_INICIO] y las [HORA_FIN] por motivos de mantención de las redes.\n\nLamentamos las molestias que esto pueda ocasionar y agradecemos su comprensión.\n\nAtentamente,\nLa Administración.";
                break;
             case 'comunicado_general':
                 inputAsunto.value = "Comunicado de la Administración";
                 textareaMensaje.value = "Estimados residentes,\n\n[ESCRIBIR AQUÍ EL COMUNICADO]\n\nAtentamente,\nLa Administración.";
                 break;
            default:
                inputAsunto.value = "";
                textareaMensaje.value = "";
                break;
        }
    });

    formComunicacion.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarSpinner();
        
        const formData = new FormData(e.target);
        const asunto = formData.get('asunto');
        const mensajeBase = formData.get('mensaje');
        
        let destinatariosSeleccionados = [];
        const tipoDestinatario = selectDestinatarioTipo.value;

        if (tipoDestinatario === 'todos') {
            destinatariosSeleccionados = residentes;
        } else {
            const idsSeleccionados = Array.from(document.querySelectorAll('.residente-checkbox:checked')).map(cb => cb.value);
            if (idsSeleccionados.length === 0) {
                ocultarSpinner();
                return mostrarMensaje('Debe seleccionar al menos un destinatario.', 'error');
            }
            destinatariosSeleccionados = residentes.filter(r => idsSeleccionados.includes(r[0]));
        }

        try {
            const correosParaEnviar = destinatariosSeleccionados.map(r => r[5]).filter(Boolean);

            if (correosParaEnviar.length === 0) {
                 throw new Error("Los destinatarios seleccionados no tienen correos electrónicos registrados.");
            }

            // Se utiliza la variable 'senderEmail' obtenida al inicio con gapi.client
            await enviarCorreoBCC(senderEmail, correosParaEnviar, asunto, mensajeBase);

            const registroDestinatario = tipoDestinatario === 'todos' 
                ? 'Toda la Comunidad' 
                : `Grupo seleccionado (${destinatariosSeleccionados.length} residentes)`;
            
            await agregarComunicacion([
                null, 'SISTEMA', 'N/A', registroDestinatario, 'N/A', 
                new Date().toISOString(), asunto, mensajeBase
            ]);

            comunicaciones = await obtenerComunicaciones();
            renderTablaComunicaciones();
            mostrarMensaje(`Comunicación enviada a ${destinatariosSeleccionados.length} residente(s) con éxito.`);
            
            formComunicacion.reset();
            selectPlantilla.value = "";
            document.querySelectorAll('.residente-checkbox:checked').forEach(cb => cb.checked = false);
            destinatariosContainer.style.display = 'none';
            selectDestinatarioTipo.value = 'todos';

        } catch (error) {
            mostrarMensaje('Error al enviar la comunicación: ' + error.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });
    
    function crearCuerpoCorreoHTML(asunto, mensaje) {
        const mensajeHtml = mensaje.replace(/\n/g, '<br>');
        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${asunto}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .header { background-color: #2c3e50; color: #ffffff; padding: 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 30px; color: #333333; line-height: 1.6; font-size: 16px; }
            .content h2 { color: #2c3e50; font-size: 20px; margin-top:0; }
            .content p { margin-bottom: 1em; }
            .footer { background-color: #f8f9fa; color: #888888; padding: 20px; text-align: center; font-size: 12px; border-top: 1px solid #e0e0e0;}
            .footer p { margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Condominio Los Molles</h1>
            </div>
            <div class="content">
              <h2>${asunto}</h2>
              <p>${mensajeHtml}</p>
            </div>
            <div class="footer">
              <p>Este es un correo electrónico generado automáticamente por el sistema de administración.</p>
              <p>Por favor, no responda directamente a este mensaje.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    function encodeSubjectRFC2047(subject) {
        if (/^[\x00-\x7F]*$/.test(subject)) return subject;
        const utf8Subject = unescape(encodeURIComponent(subject));
        const base64Subject = btoa(utf8Subject);
        return `=?UTF-8?B?${base64Subject}?=`;
    }

    async function enviarCorreoBCC(senderEmail, destinatarios, asunto, mensaje) {
        if (!destinatarios || destinatarios.length === 0) throw new Error("No se proporcionaron destinatarios.");
        if (!senderEmail) throw new Error("La dirección del remitente es inválida.");
        
        const bccField = destinatarios.join(',');
        const encodedSubject = encodeSubjectRFC2047(asunto);
        const htmlBody = crearCuerpoCorreoHTML(asunto, mensaje);
        
        const email =
            `To: ${senderEmail}\r\n` +
            `Bcc: ${bccField}\r\n` +
            `Subject: ${encodedSubject}\r\n` +
            `Content-Type: text/html; charset=UTF-8\r\n` +
            `Content-Transfer-Encoding: 8bit\r\n\r\n` +
            `${htmlBody}`;

        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

        await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: { raw: base64EncodedEmail }
        });
    }

    renderTablaComunicaciones();
    ocultarSpinner();
}
