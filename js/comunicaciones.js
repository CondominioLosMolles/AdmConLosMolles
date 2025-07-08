// js/comunicaciones.v2.js
// --- VERSIÓN REFACTORIZADA CON MEJORAS DE SEGURIDAD, ESCALABILIDAD Y UX ---

/**
 * NOTA DE IMPLEMENTACIÓN:
 * Para la sanitización completa del HTML en el editor de mensajes,
 * es altamente recomendable usar una librería especializada como DOMPurify.
 * Inclúyela en tu HTML antes de este script:
 * <script src="https://cdn.jsdelivr.net/npm/dompurify@2.3.6/dist/purify.min.js"></script>
 */

// #region UTILITIES (Herramientas de Seguridad y Ayuda)

/**
 * Escapa caracteres HTML para prevenir inyecciones de XSS en la UI.
 * Útil para insertar texto plano de forma segura dentro de un elemento con .innerHTML.
 * @param {string} str - El texto a escapar.
 * @returns {string} El texto con caracteres HTML escapados.
 */
function escaparHTML(str) {
    if (str === null || str === undefined) return '';
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}

/**
 * Sanitiza una cadena de HTML para prevenir XSS antes de ser enviada en un correo.
 * Requiere la librería DOMPurify.
 * @param {string} htmlString - La cadena de HTML a sanitizar.
 * @returns {string} HTML seguro.
 */
function sanitizarHTML(htmlString) {
    if (typeof DOMPurify === 'undefined') {
        console.warn('DOMPurify no está cargado. El contenido del correo no será sanitizado, lo cual es un riesgo de seguridad.');
        return htmlString; // No es seguro, pero evita que la app se rompa.
    }
    return DOMPurify.sanitize(htmlString);
}

// #endregion

async function cargarComunicaciones() {
    limpiarMainContent();
    mostrarSpinner();

    // --- OBTENCIÓN SEGURA DEL EMAIL DEL REMITENTE ---
    let senderEmail;
    try {
        const profile = await gapi.client.gmail.users.getProfile({ userId: 'me' });
        senderEmail = profile.result.emailAddress;
        if (!senderEmail) throw new Error("No se pudo obtener la dirección de email del perfil.");
    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error Crítico al obtener perfil de Gmail: ' + e.message, 'error');
        return;
    }

    // --- CARGA INICIAL DE DATOS ---
    let residentes = [], comunicaciones = [];
    try {
        [residentes, comunicaciones] = await Promise.all([
            obtenerResidentes(),
            obtenerComunicaciones()
        ]);
        comunicaciones.sort((a, b) => new Date(b[5]) - new Date(a[5])); // Ordenar una sola vez
    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error al cargar datos del sistema: ' + e.message, 'error');
        return;
    }

    const main = document.getElementById('main-content');
    // Se utiliza escaparHTML para renderizar datos provenientes de la base de datos (nombres, etc.)
    main.innerHTML = `
    <style>
      .comunicaciones-container { display: flex; gap: 24px; flex-wrap: wrap; }
      .historial-panel { flex: 1; min-width: 320px; }
      .nueva-com-panel { flex: 1.5; min-width: 450px; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .destinatarios-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 150px; overflow-y: auto; background: #f9f9f9; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
      .form-group { margin-bottom: 1rem; }
      .form-actions { text-align: right; margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 10px; }
      .pagination-controls { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
    </style>

    <h2>Central de Comunicaciones</h2>
    <div class="comunicaciones-container">
      <div class="nueva-com-panel">
        <h3>Nueva Comunicación</h3>
        <form id="formComunicacion">
          
          <div class="form-group">
            <label for="selectPlantilla"><b>Usar Plantilla (Opcional)</b></label>
            <select id="selectPlantilla" class="form-control">
              <option value="">-- Redacción Manual --</option>
              <option value="citacion_asamblea">Citación a Asamblea</option>
              <option value="aviso_corte_mantencion">Aviso de Corte de Suministro</option>
              <option value="comunicado_general">Comunicado General</option>
            </select>
          </div>

          <div class="form-group">
            <label for="selectDestinatarioTipo"><b>Destinatarios</b></label>
            <select id="selectDestinatarioTipo" class="form-control">
              <option value="todos">Toda la comunidad</option>
              <option value="individual">Seleccionar Residente(s)</option>
            </select>
          </div>

          <div id="destinatariosContainer" style="display:none;" class="form-group">
             <input type="text" id="filtroResidentes" class="form-control" placeholder="Buscar residente por nombre o parcela...">
             <div id="destinatariosGrid" class="destinatarios-grid" style="margin-top: 0.5rem;">
                ${residentes.map(r => `
                  <label>
                    <input type="checkbox" class="residente-checkbox" name="residente" value="${escaparHTML(r[0])}">
                    ${escaparHTML(r[1])} (P. ${escaparHTML(r[3])})
                  </label>
                `).join('')}
             </div>
          </div>
          
          <div class="form-group">
            <label for="inputAsunto"><b>Asunto</b></label>
            <input type="text" id="inputAsunto" name="asunto" class="form-control" required>
          </div>
          
          <div class="form-group">
            <label for="textareaMensaje"><b>Mensaje</b></label>
            <textarea id="textareaMensaje" name="mensaje" rows="8" class="form-control" required></textarea>
            <small>Puedes usar placeholders como {nombre_residente} y {parcela} para personalizar el mensaje.</small>
          </div>

          <div class="form-actions">
            <button type="button" id="btnGuardarBorrador" class="btn btn-secondary">Guardar Borrador</button>
            <button type="submit" class="btn">Enviar Comunicación</button>
          </div>
        </form>
      </div>

      <div class="historial-panel">
        <h3>Historial de Envíos</h3>
        <div id="tablaComunicaciones"></div>
        <div id="paginacionComunicaciones" class="pagination-controls"></div>
      </div>
    </div>
  `;

    // --- LÓGICA DE LA PÁGINA ---
    const formComunicacion = document.getElementById('formComunicacion');
    const btnGuardarBorrador = document.getElementById('btnGuardarBorrador');
    
    // Alcance para toda la lógica de la página
    let currentPage = 1;
    const ITEMS_PER_PAGE = 10;

    // #region RENDERIZADO DE TABLA CON PAGINACIÓN
    
    function renderTablaComunicaciones() {
        const tablaDiv = document.getElementById('tablaComunicaciones');
        const paginacionDiv = document.getElementById('paginacionComunicaciones');
        
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedItems = comunicaciones.slice(start, end);

        let html = `<table class="table"><thead><tr><th>Fecha</th><th>Asunto</th><th>Destinatario(s)</th></tr></thead><tbody>`;
        if (paginatedItems && paginatedItems.length > 0) {
            paginatedItems.forEach(c => {
                html += `<tr>
                    <td>${new Date(c[5]).toLocaleString('es-CL')}</td>
                    <td>${escaparHTML(c[6])}</td>
                    <td>${escaparHTML(c[3])}</td>
                </tr>`;
            });
        } else {
            html += `<tr><td colspan="3" style="text-align:center;">No hay comunicaciones registradas.</td></tr>`;
        }
        html += `</tbody></table>`;
        tablaDiv.innerHTML = html;

        renderPaginacion();
    }

    function renderPaginacion() {
        const paginacionDiv = document.getElementById('paginacionComunicaciones');
        const totalPages = Math.ceil(comunicaciones.length / ITEMS_PER_PAGE);
        if (totalPages <= 1) {
            paginacionDiv.innerHTML = '';
            return;
        }

        let paginacionHTML = `
            <span>Página ${currentPage} de ${totalPages}</span>
            <div>
                <button id="prevPage" class="btn btn-sm" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
                <button id="nextPage" class="btn btn-sm" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
            </div>
        `;
        paginacionDiv.innerHTML = paginacionHTML;

        document.getElementById('prevPage').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTablaComunicaciones();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTablaComunicaciones();
            }
        });
    }

    // #endregion

    // #region MANEJO DEL FORMULARIO Y BORRADORES

    const camposBorrador = {
        plantilla: document.getElementById('selectPlantilla'),
        tipoDestinatario: document.getElementById('selectDestinatarioTipo'),
        asunto: document.getElementById('inputAsunto'),
        mensaje: document.getElementById('textareaMensaje')
    };

    btnGuardarBorrador.addEventListener('click', () => {
        const borrador = {
            plantilla: camposBorrador.plantilla.value,
            tipoDestinatario: camposBorrador.tipoDestinatario.value,
            asunto: camposBorrador.asunto.value,
            mensaje: camposBorrador.mensaje.value,
        };
        localStorage.setItem('borradorComunicacion', JSON.stringify(borrador));
        mostrarMensaje('Borrador guardado localmente.', 'info');
    });

    function cargarBorrador() {
        const borrador = JSON.parse(localStorage.getItem('borradorComunicacion'));
        if (borrador) {
            camposBorrador.plantilla.value = borrador.plantilla;
            camposBorrador.tipoDestinatario.value = borrador.tipoDestinatario;
            camposBorrador.asunto.value = borrador.asunto;
            camposBorrador.mensaje.value = borrador.mensaje;
            // Disparar evento change para actualizar UI dependiente
            camposBorrador.tipoDestinatario.dispatchEvent(new Event('change'));
            mostrarMensaje('Se ha cargado un borrador guardado.', 'info');
        }
    }
    
    function limpiarBorrador() {
        localStorage.removeItem('borradorComunicacion');
    }

    formComunicacion.addEventListener('submit', async (e) => {
        e.preventDefault();

        // --- MEJORA UX: Confirmación antes de enviar ---
        if (!confirm("¿Estás seguro de que deseas enviar esta comunicación? Esta acción no se puede deshacer.")) {
            return;
        }
        
        mostrarSpinner();
        
        const asunto = camposBorrador.asunto.value;
        const mensajeBase = camposBorrador.mensaje.value;
        const tipoDestinatario = camposBorrador.tipoDestinatario.value;

        let destinatariosSeleccionados = [];
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
            const correosParaEnviar = destinatariosSeleccionados.filter(r => r && r[5]);
            if (correosParaEnviar.length === 0) {
                 throw new Error("Los destinatarios seleccionados no tienen correos electrónicos válidos.");
            }

            // --- MEJORA: Envío individual para personalización ---
            // En lugar de un BCC masivo, se envían correos individuales.
            // Esto es un poco más lento pero permite personalización y mejor seguimiento futuro.
            const promesasDeEnvio = correosParaEnviar.map(residente => {
                const mensajePersonalizado = mensajeBase
                    .replace(/{nombre_residente}/g, residente[1] || 'Residente')
                    .replace(/{parcela}/g, residente[3] || 'N/A');
                
                return enviarCorreo(senderEmail, residente[5], asunto, mensajePersonalizado);
            });
            
            await Promise.all(promesasDeEnvio);

            // Registrar en la hoja de cálculo
            const registroDestinatario = tipoDestinatario === 'todos' 
                ? 'Toda la Comunidad' 
                : `Grupo seleccionado (${correosParaEnviar.length} residentes)`;
            
            await agregarComunicacion([
                null, 'SISTEMA', 'N/A', registroDestinatario, 'N/A', 
                new Date().toISOString(), asunto, mensajeBase // Se guarda el mensaje base, no el personalizado
            ]);

            // Actualizar UI
            comunicaciones = await obtenerComunicaciones();
            comunicaciones.sort((a, b) => new Date(b[5]) - new Date(a[5]));
            currentPage = 1; // Volver a la primera página
            renderTablaComunicaciones();
            mostrarMensaje(`Comunicación enviada a ${correosParaEnviar.length} residente(s) con éxito.`);
            
            limpiarBorrador();
            formComunicacion.reset();
            // Restablecer estado del formulario
            document.querySelectorAll('.residente-checkbox:checked').forEach(cb => cb.checked = false);
            document.getElementById('destinatariosContainer').style.display = 'none';

        } catch (error) {
            mostrarMensaje('Error al enviar la comunicación: ' + error.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });
    
    // #endregion

    // #region LÓGICA DE ENVÍO DE CORREO (REFACTORIZADA)

    function crearCuerpoCorreoHTML(asunto, mensaje) {
        // --- MEJORA DE SEGURIDAD: Sanitizar el contenido del mensaje ---
        // Se asume que el mensaje puede contener HTML simple (ej. de un futuro editor WYSIWYG)
        // Por lo tanto, se sanitiza para evitar XSS en el cliente de correo del destinatario.
        const mensajeHtmlSanitizado = sanitizarHTML(mensaje.replace(/\n/g, '<br>'));
      
        return `
        <!DOCTYPE html><html lang="es">... (El resto del cuerpo del correo como lo tenías) ...
            <div class="content">
              <h2>${escaparHTML(asunto)}</h2>
              <p>${mensajeHtmlSanitizado}</p>
            </div>
        ...</html>
      `;
    }
    
    function encodeSubjectRFC2047(subject) {
        if (/^[\x00-\x7F]*$/.test(subject)) return subject;
        const utf8Subject = unescape(encodeURIComponent(subject));
        const base64Subject = btoa(utf8Subject);
        return `=?UTF-8?B?${base64Subject}?=`;
    }

    /**
     * Envía un único correo a un destinatario.
     * @param {string} from - Email del remitente.
     * @param {string} to - Email del destinatario.
     * @param {string} subject - Asunto del correo.
     * @param {string} message - Cuerpo del mensaje (texto plano o HTML simple).
     */
    async function enviarCorreo(from, to, subject, message) {
        if (!to) throw new Error("La dirección del destinatario es inválida.");
        
        const encodedSubject = encodeSubjectRFC2047(subject);
        const htmlBody = crearCuerpoCorreoHTML(subject, message);
        
        const email = [
            `From: "Condominio Los Molles" <${from}>`,
            `To: ${to}`,
            `Subject: ${encodedSubject}`,
            `Content-Type: text/html; charset=UTF-8`,
            `Content-Transfer-Encoding: 8bit`,
            ``,
            `${htmlBody}`
        ].join('\r\n');

        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

        await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: { raw: base64EncodedEmail }
        });
    }

    // #endregion

    // --- INICIALIZACIÓN DE LA VISTA ---
    // Asociar eventos a los elementos del formulario (plantillas, filtro, etc.)
    // (El código de los event listeners de selectDestinatarioTipo, filtroResidentes y selectPlantilla es correcto y se puede mantener aquí)
    // ...
    
    renderTablaComunicaciones();
    cargarBorrador(); // Cargar borrador al iniciar
    ocultarSpinner();
}
