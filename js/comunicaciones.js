// js/comunicaciones.js
// --- VERSIÓN CORREGIDA ---

async function cargarComunicaciones() {
    limpiarMainContent();
    mostrarSpinner();

    let residentes = [], comunicaciones = [];
    try {
        [residentes, comunicaciones] = await Promise.all([
            obtenerResidentes(),
            obtenerComunicaciones()
        ]);
    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
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

          <label for="inputAdjuntos"><b>Adjuntar Archivos</b></label>
          <input type="file" id="inputAdjuntos" class="form-control" multiple>

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
                    <td>${c[3] === 'Comunidad' ? 'Toda la Comunidad' : c[3]}</td>
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
        let mensajeBase = formData.get('mensaje');
        let destinatarios = [];
        if (selectDestinatarioTipo.value === 'todos') {
            destinatarios = residentes;
        } else {
            const idsSeleccionados = Array.from(document.querySelectorAll('.residente-checkbox:checked')).map(cb => cb.value);
            destinatarios = residentes.filter(r => idsSeleccionados.includes(r[0]));
        }
        if (destinatarios.length === 0) {
            ocultarSpinner();
            return mostrarMensaje('Debe seleccionar al menos un destinatario.', 'error');
        }
        try {
            // Lógica de envío simplificada para registrar el evento
            const esEnvioMasivo = selectDestinatarioTipo.value === 'todos';
            
            if (esEnvioMasivo) {
                // Para envíos masivos, se puede registrar un solo evento
                await agregarComunicacion([ null, 'TODOS', 'N/A', 'Comunidad', 'N/A', new Date().toISOString(), asunto, mensajeBase ]);
            }

            for (const res of destinatarios) {
                const email = res[5];
                let mensajePersonalizado = mensajeBase.replace(/{nombre_residente}/g, res[1]).replace(/{n_parcela}/g, res[3]);
                
                // Si no es masivo, se registra individualmente
                if (!esEnvioMasivo) {
                    await agregarComunicacion([ null, res[0], res[3], res[1], email, new Date().toISOString(), asunto, mensajePersonalizado ]);
                }
                
                // Aquí iría la lógica de envío de correo real
                // await enviarCorreo(email, asunto, mensajePersonalizado);
            }
            
            comunicaciones = await obtenerComunicaciones();
            renderTablaComunicaciones();
            mostrarMensaje(`Comunicación registrada para ${destinatarios.length} residente(s) con éxito.`);
            formComunicacion.reset();
            document.querySelectorAll('.residente-checkbox:checked').forEach(cb => cb.checked = false);
            destinatariosContainer.style.display = 'none';
            selectDestinatarioTipo.value = 'todos';
        } catch (error) {
            mostrarMensaje('Error al registrar la comunicación: ' + error.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });

    renderTablaComunicaciones();
    ocultarSpinner();
}
