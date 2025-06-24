// js/comunicaciones.js

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
      .comunicaciones-container { display: flex; gap: 24px; }
      .historial-panel { flex: 1; }
      .nueva-com-panel { flex: 1.5; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .destinatarios-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 150px; overflow-y: auto; background: #f9f9f9; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
      .destinatarios-grid label { display: block; }
    </style>

    <h2>Central de Comunicaciones</h2>
    <div class="comunicaciones-container">
      <div class="nueva-com-panel">
        <h3>Nueva Comunicación</h3>
        <form id="formComunicacion">
          
          <label for="selectPlantilla"><b>Usar Plantilla (Opcional)</b></label>
          <select id="selectPlantilla" class="form-control mb-3">
            <option value="">-- Redacción Manual --</option>
            <option value="recordatorio_pago">Recordatorio de Pago Gasto Común</option>
            <option value="citacion_asamblea">Citación a Asamblea</option>
            <option value="aviso_corte_mantencion">Aviso de Corte de Suministro por Mantención</option>
            <option value="comunicado_general">Comunicado General</option>
          </select>

          <label for="selectDestinatarioTipo"><b>Destinatarios</b></label>
          <select id="selectDestinatarioTipo" class="form-control mb-2">
            <option value="todos">Toda la comunidad</option>
            <option value="individual">Seleccionar Residente(s)</option>
          </select>

          <div id="destinatariosContainer" style="display:none;" class="mb-3">
             <input type="text" id="filtroResidentes" class="form-control mb-2" placeholder="Buscar residente por nombre o parcela...">
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
          <input type="text" id="inputAsunto" name="asunto" class="form-control mb-3" required>
          
          <label for="textareaMensaje"><b>Mensaje</b></label>
          <textarea id="textareaMensaje" name="mensaje" rows="8" class="form-control mb-3" required></textarea>

          <label for="inputAdjuntos"><b>Adjuntar Archivos</b></label>
          <input type="file" id="inputAdjuntos" class="form-control" multiple>

          <div class="text-right mt-4">
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
        comunicaciones.sort((a, b) => new Date(b[5]) - new Date(a[5])).forEach(c => {
            html += `<tr>
                <td>${new Date(c[5]).toLocaleString('es-CL')}</td>
                <td>${c[6]}</td>
                <td>${c[3] === 'Comunidad' ? 'Toda la Comunidad' : c[3]}</td>
            </tr>`;
        });
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
        const hoy = new Date();
        const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        const nombreProximoMes = proximoMes.toLocaleString('es-CL', { month: 'long' });

        switch(e.target.value) {
            case 'recordatorio_pago':
                inputAsunto.value = `Recordatorio de Pago de Gasto Común - ${nombreProximoMes.charAt(0).toUpperCase() + nombreProximoMes.slice(1)}`;
                textareaMensaje.value = `Estimado(a) residente de la parcela {n_parcela},\n\nJunto con saludar, le recordamos que el vencimiento para el pago del gasto común correspondiente al mes de ${nombreProximoMes} es el día 10.\n\nEl pago oportuno de los gastos comunes es una obligación de todos los copropietarios, según lo estipulado en la Ley 21.442, y es fundamental para el correcto mantenimiento y funcionamiento de nuestra comunidad.\n\nPuede consultar el detalle de su boleta y realizar el pago a través de los canales habituales.\n\nAtentamente,\nLa Administración.`;
                break;
            case 'citacion_asamblea':
                inputAsunto.value = "Citación a Asamblea de Copropietarios";
                textareaMensaje.value = "Estimados residentes,\n\nSe les cita a participar de la Asamblea [Ordinaria/Extraordinaria] de Copropietarios, que se realizará el día [FECHA] a las [HORA] en [LUGAR].\n\nTabla a tratar:\n1. ...\n2. ...\n\nSu participación es de suma importancia para la toma de decisiones de nuestra comunidad, en conformidad con la Ley 21.442.\n\nSaludos cordiales,\nEl Comité de Administración.";
                break;
            case 'aviso_corte_mantencion':
                 inputAsunto.value = "Aviso de Corte Programado de Suministro";
                 textareaMensaje.value = "Estimados residentes,\n\nLes informamos que el día [FECHA] se realizará un corte programado del suministro de [Agua/Luz] entre las [HORA_INICIO] y las [HORA_FIN] por motivos de mantención de las redes.\n\nLamentamos las molestias que esto pueda ocasionar y agradecemos su comprensión.\n\nAtentamente,\nLa Administración.";
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
        const archivos = document.getElementById('inputAdjuntos').files;
        
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
            for (const res of destinatarios) {
                const email = res[5];
                let mensajePersonalizado = mensajeBase.replace(/{nombre_residente}/g, res[1]).replace(/{n_parcela}/g, res[3]);
                
                await enviarCorreo(email, asunto, mensajePersonalizado);
                
                await agregarComunicacion([
                    null, res[0], res[3], res[1], email,
                    new Date().toISOString(), asunto, mensajePersonalizado
                ]);
            }
            
            if (selectDestinatarioTipo.value === 'todos') {
                 await agregarComunicacion([ null, 'TODOS', 'N/A', 'Comunidad', 'N/A', new Date().toISOString(), asunto, mensajeBase ]);
            }

            comunicaciones = await obtenerComunicaciones();
            renderTablaComunicaciones();
            mostrarMensaje(`Comunicación enviada a ${destinatarios.length} residente(s) con éxito.`);
            
            // --- CÓDIGO CORREGIDO PARA LIMPIAR EL FORMULARIO ---
            formComunicacion.reset();
            document.querySelectorAll('.residente-checkbox:checked').forEach(cb => cb.checked = false);
            destinatariosContainer.style.display = 'none';
            selectDestinatarioTipo.value = 'todos';
            // --- FIN DE LA CORRECCIÓN ---

        } catch (error) {
            mostrarMensaje('Error al enviar la comunicación: ' + error.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });

    renderTablaComunicaciones();
    ocultarSpinner();
}

document.querySelector('[data-module="comunicaciones"]').addEventListener('click', cargarComunicaciones);
