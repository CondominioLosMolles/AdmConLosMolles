// js/gastos_comunes.js

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado', 'ComprobanteURL'
];

async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [];
  let pagosGC_obj = [];
  let timcData = {};

  try {
    const [residentes_data, pagosGC_raw, timcs_raw] = await Promise.all([
        obtenerResidentes(),
        obtenerPagosGC(),
        obtenerTIMCs()
    ]);
    
    residentes = residentes_data || [];
    pagosGC_obj = (pagosGC_raw || []).map(fila => {
        let obj = {};
        ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; });
        if (obj.Periodo) {
            const anioMatch = obj.Periodo.match(/\d{4}/);
            obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
        }
        return obj;
    }).filter(p => p.N_Parcela);

    (timcs_raw || []).forEach(fila => {
        const [anio, mes, valor] = fila;
        if (!timcData[anio]) timcData[anio] = {};
        timcData[anio][mes] = parseFloat(valor);
    });

  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error');
    return;
  }
  
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
      
      <section class="widget">
        <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1;"><label for="filtroParcela"><b>N° Parcela:</b></label><input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;"></div>
          <div style="flex: 1;"><label for="filtroAnio"><b>Año:</b></label><input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;"></div>
        </datalist>
        </div>
        <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
        <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
      </section>

      <section class="widget">
         <h4 style="margin-top:0;">Configuración de TIMC</h4>
         <div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;">
            <div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div>
            <div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div>
            <button id="btnGuardarTMC" class="btn">Guardar en Sheet</button>
         </div>
         <div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div>
      </section>
    </div>
    
    <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Gastos</h3><div style="overflow-x:auto;"><table class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
    
    <div id="modalGC" class="modal" style="display:none;"><div><h3>Agregar Gasto Común</h3><form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;"><div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div><div style="flex: 1 1 300px;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div><div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div><div style="flex: 1 1 180px;"><label>Monto Pagado</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div><div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div><div style="flex: 1 1 100%;"><label>Comprobante</label><input type="file" name="Comprobante" id="inputComprobanteGC"></div><div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div></form></div></div>

    <div id="modalComprobante" class="modal" style="display:none;">
      <div>
        <h3>Enviar Comprobante de Pago</h3>
        <form id="formEnviarComprobante" style="display:flex; flex-wrap:wrap; gap:15px;">
          <div style="flex: 1 1 150px;">
            <label>N° Parcela</label>
            <select name="N_Parcela" id="selectParcelaComprobante" required><option value="">Seleccione...</option>${residentes.map(r => `<option value="${r[3]}">${r[3]}</option>`).join('')}</select>
          </div>
          <div style="flex: 1 1 150px;">
            <label>Mes del Gasto Común</label>
            <select name="Mes" id="selectMesComprobante" required><option value="">Seleccione...</option>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select>
          </div>
          <div style="flex: 1 1 100%;">
             <label>Email del Residente</label>
             <input type="email" id="inputEmailComprobante" readonly style="background:#eee;">
          </div>
          <div style="flex: 1 1 100%;">
             <label>Asunto del Correo</label>
             <input type="text" id="inputAsuntoComprobante" readonly style="background:#eee;">
          </div>
          <div style="flex: 1 1 100%;">
            <label>Mensaje de Confirmación (Previsualización)</label>
            <textarea id="mensajeComprobante" rows="6" readonly style="background:#eee;"></textarea>
          </div>
          <div style="flex: 1 1 100%; text-align: right; margin-top: 20px;">
            <button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button>
            <button class="btn" type="submit">Enviar Correo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  const tbodyGastos = document.getElementById('tbody-gastos');
  const theadGastos = document.getElementById('thead-gastos');

  // Todas las funciones de renderizado y eventos van aquí...
  
  ocultarSpinner();
  
  // Asignación de todos los eventos
  asignarEventos(residentes, pagosGC_obj, timcData);
  
  // Carga inicial
  filtrarYRenderizar(residentes, pagosGC_obj, timcData);
  actualizarVistaTIMC(timcData);
}

// Se agrupan todas las asignaciones de eventos en una sola función para mayor orden
function asignarEventos(residentes, pagosGC_obj, timcData) {
    const anioFiltroEl = document.getElementById('filtroAnio');
    
    document.getElementById('filtroParcela').addEventListener('input', () => filtrarYRenderizar(residentes, pagosGC_obj, timcData));
    anioFiltroEl.addEventListener('input', () => {
        actualizarVistaTIMC(timcData);
        filtrarYRenderizar(residentes, pagosGC_obj, timcData);
    });

    document.getElementById('btnGuardarTMC').addEventListener('click', async () => { /* ... código existente ... */ });
    
    const modalGC = document.getElementById('modalGC');
    document.getElementById('btnAbrirModalGasto').addEventListener('click', () => modalGC.style.display = 'flex');
    document.getElementById('btnCerrarModal').addEventListener('click', () => modalGC.style.display = 'none');
    document.getElementById('inputNParcela').addEventListener('input', (e) => {
        const res = residentes.find(r => r[3] == e.target.value);
        document.getElementById('inputNombreResidente').value = res ? res[1] : '';
        document.getElementById('inputValorGastoComun').value = res ? parseFloat(res[8]).toLocaleString('es-CL', {style:'currency', currency:'CLP'}) : '';
    });

    document.getElementById('formGastoComun').addEventListener('submit', async (e) => { /* ... código corregido ... */ });

    // --- CORRECCIÓN 2: Lógica para el nuevo modal de Enviar Comprobante ---
    const modalComprobante = document.getElementById('modalComprobante');
    document.getElementById('btnAbrirModalComprobante').addEventListener('click', () => modalComprobante.style.display = 'flex');
    document.getElementById('btnCerrarModalComprobante').addEventListener('click', () => modalComprobante.style.display = 'none');

    const selectParcelaComp = document.getElementById('selectParcelaComprobante');
    const selectMesComp = document.getElementById('selectMesComprobante');
    const inputEmailComp = document.getElementById('inputEmailComprobante');
    const inputAsuntoComp = document.getElementById('inputAsuntoComprobante');
    const mensajeComp = document.getElementById('mensajeComprobante');

    function actualizarInfoComprobante() {
        const parcela = selectParcelaComp.value;
        const mesIndex = selectMesComp.value;
        const anio = anioFiltroEl.value;
        
        const residente = residentes.find(r => r[3] == parcela);
        if (residente) {
            inputEmailComp.value = residente[5]; // Columna F = email
        } else {
            inputEmailComp.value = '';
        }

        if (parcela && mesIndex !== "" && anio && residente) {
            const mesNombre = MESES[mesIndex];
            const pago = pagosGC_obj.find(p => p.N_Parcela == parcela && p.Periodo && p.Periodo.toLowerCase().startsWith(mesNombre.toLowerCase()) && p.anio == anio);
            
            if (pago) {
                inputAsuntoComp.value = `COMPROBANTE PAGO GASTO COMÚN (${pago.Periodo}, PARCELA ${pago.N_Parcela})`;
                mensajeComp.value = `Estimado/a ${residente[1]},\n\nConfirmamos la recepción de su pago para el gasto común del período ${pago.Periodo}.\n\nDetalles:\n- Monto Pagado: $${parseFloat(pago.Monto_Pagado).toLocaleString('es-CL')}\n- Fecha de Pago: ${new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone: 'UTC'})}\n- Método de Pago: ${pago.Metodo_Pago}\n- Estado: ${pago.Estado}\n\nGracias,\nLa Administración.`;
            } else {
                inputAsuntoComp.value = '';
                mensajeComp.value = 'No se encontró un pago registrado para este residente en el período seleccionado.';
            }
        }
    }

    selectParcelaComp.addEventListener('change', actualizarInfoComprobante);
    selectMesComp.addEventListener('change', actualizarInfoComprobante);
    
    document.getElementById('formEnviarComprobante').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = inputEmailComp.value;
        const asunto = inputAsuntoComp.value;
        // Reemplaza saltos de línea con <br> para el correo HTML
        const mensaje = mensajeComp.value.replace(/\n/g, '<br>');

        if (!email || !asunto || !mensaje.includes('Confirmamos')) {
            mostrarMensaje('Por favor, selecciona una parcela y un mes con un pago válido.', 'error');
            return;
        }

        mostrarSpinner();
        try {
            await enviarCorreo(email, asunto, mensaje); // Llama a la función de gmail.js
            mostrarMensaje('Correo de confirmación enviado con éxito.', 'success');
            modalComprobante.style.display = 'none';
        } catch (err) {
            mostrarMensaje('Error al enviar el correo: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });
}
