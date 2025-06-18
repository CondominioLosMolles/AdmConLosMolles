// js/gastos_comunes.js

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado', 'ComprobanteURL'
];

async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [], pagosGC_obj = [], timcData = {};

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
    
    <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
      
      <section class="widget" style="flex: 1 1 30%; display: flex; flex-direction: column;">
        <h4 style="margin-top:0;">Filtros y Acciones</h4>
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1;"><label for="filtroParcela"><b>N° Parcela:</b></label><input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;"></div>
          <div style="flex: 1;"><label for="filtroAnio"><b>Año:</b></label><input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;"></div>
        </div>
        <div style="margin-top: auto;">
            <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
            <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
        </div>
        <datalist id="lista-parcelas">${residentes.map(r => `<option value="${r[3]}"></option>`).join('')}</datalist>
      </section>

      <section class="widget" style="flex: 2 1 60%;">
         <h4 style="margin-top:0;">Configuración de TIMC</h4>
         <div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
            <div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div>
            <div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div>
            <button id="btnGuardarTMC" class="btn">Guardar en Sheet</button>
         </div>
         <div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div>
      </section>
    </div>
    
    <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Gastos</h3><div style="overflow-x:auto;"><table class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
    
    <div id="modalGC" class="modal" style="display:none;"><div><h3>Agregar Gasto Común</h3><form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;"><div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div><div style="flex: 1 1 300px;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div><div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div><div style="flex: 1 1 180px;"><label>Monto Pagado</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div><div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div><div style="flex: 1 1 100%;"><label>Comprobante</label><input type="file" name="Comprobante" id="inputComprobanteGC"></div><div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div></form></div></div>

    <div id="modalComunicacion" class="modal" style="display:none;"><div><h3>Enviar Comprobante de Pago</h3><form id="formEnviarComprobante" style="display:flex; flex-wrap:wrap; gap:15px;"><div style="flex: 1 1 150px;"><label>N° Parcela</label><select name="N_Parcela" id="selectParcelaComprobante" required><option value="">Seleccione...</option>${residentes.map(r => `<option value="${r[3]}">${r[3]}</option>`).join('')}</select></div><div style="flex: 1 1 150px;"><label>Mes del Gasto Común</label><select name="Mes" id="selectMesComprobante" required><option value="">Seleccione...</option>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div><div style="flex: 1 1 100%;"><label>Email del Residente</label><input type="email" id="inputEmailComprobante" readonly style="background:#eee;"></div><div style="flex: 1 1 100%;"><label>Asunto del Correo</label><input type="text" id="inputAsuntoComprobante" readonly style="background:#eee;"></div><div style="flex: 1 1 100%;"><label>Mensaje de Confirmación (Previsualización)</label><textarea id="mensajeComprobante" rows="10" readonly style="background:#eee; white-space: pre-wrap; font-size: 0.9em;"></textarea></div><div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form></div></div>
  `;
  
  asignarEventos(residentes, pagosGC_obj, timcData);
  filtrarYRenderizar(residentes, pagosGC_obj, timcData);
  actualizarVistaTIMC(timcData);
  ocultarSpinner();
}
// js/gastos_comunes.js (Continuación)

function asignarEventos(residentes, pagosGC_obj, timcData) {
    const anioFiltroEl = document.getElementById('filtroAnio');
    
    document.getElementById('filtroParcela').addEventListener('input', () => filtrarYRenderizar(residentes, pagosGC_obj, timcData));
    anioFiltroEl.addEventListener('input', () => {
        actualizarVistaTIMC(timcData);
        filtrarYRenderizar(residentes, pagosGC_obj, timcData);
    });

    document.getElementById('btnGuardarTMC').addEventListener('click', async () => {
        if (typeof guardarTIMC !== 'function') return mostrarMensaje('Error: La función "guardarTIMC" no se encontró en sheets.js.', 'error');
        const anio = anioFiltroEl.value, mes = document.getElementById('selectMesTMC').value, valor = parseFloat(document.getElementById('inputTMC').value);
        if (isNaN(valor) || !mes || !anio) return mostrarMensaje('Debe ingresar TIMC, mes y año.', 'error');
        mostrarSpinner();
        try {
            await guardarTIMC(anio, mes, valor);
            if (!timcData[anio]) timcData[anio] = {};
            timcData[anio][mes] = valor;
            actualizarVistaTIMC(timcData);
            if (document.getElementById('filtroParcela').value) filtrarYRenderizar(residentes, pagosGC_obj, timcData);
            mostrarMensaje(`TIMC guardado en la hoja "Config_TIMC".`, 'success');
        } catch (err) { mostrarMensaje('Error al guardar TIMC: ' + err.message, 'error');
        } finally { ocultarSpinner(); }
    });
    
    const modalGC = document.getElementById('modalGC');
    document.getElementById('btnAbrirModalGasto').addEventListener('click', () => modalGC.style.display = 'flex');
    document.getElementById('btnCerrarModal').addEventListener('click', () => modalGC.style.display = 'none');
    
    document.getElementById('inputNParcela').addEventListener('input', (e) => {
        const res = residentes.find(r => r[3] == e.target.value);
        document.getElementById('inputNombreResidente').value = res ? res[1] : '';
        document.getElementById('inputValorGastoComun').value = res ? parseFloat(res[8]).toLocaleString('es-CL', {style:'currency', currency:'CLP'}) : '';
    });

    document.getElementById('formGastoComun').addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarSpinner();
        try {
            const formData = new FormData(e.target);
            const parcela = formData.get('N_Parcela');
            const residente = residentes.find(r => r[3] == parcela);
            const valorGastoComun = parseFloat(residente[8]);
            const mesPagadoIndex = parseInt(formData.get('Periodo'));
            const anioSeleccionado = new Date(formData.get('Fecha_Pago').replace(/-/g, '/')).getFullYear();
            const fechaDePago = new Date(formData.get('Fecha_Pago').replace(/-/g, '/'));
            const fechaVencimiento = new Date(anioSeleccionado, mesPagadoIndex, 10);
            let interes = 0, multa = 0, mesesImpagos = 0, deudaTotal = valorGastoComun, saldo = 0;
            let estadoFinal = 'Pagado';
            if (fechaDePago > fechaVencimiento) {
                const diffAnios = fechaDePago.getFullYear() - fechaVencimiento.getFullYear();
                const diffMeses = fechaDePago.getMonth() - fechaVencimiento.getMonth();
                mesesImpagos = diffAnios * 12 + diffMeses;
                if (fechaDePago.getDate() >= 11) mesesImpagos++;
                if (mesesImpagos <= 0) mesesImpagos = 1;
                const timcAnual = (timcData[anioSeleccionado] && timcData[anioSeleccionado][mesPagadoIndex + 1]) ? timcData[anioSeleccionado][mesPagadoIndex + 1] : 0;
                interes = valorGastoComun * (timcAnual / 100) / 12;
                multa = (valorGastoComun / 4) * mesesImpagos;
                deudaTotal = valorGastoComun + interes + multa;
            }
            const montoPagado = parseFloat(formData.get('Monto_Pagado'));
            saldo = montoPagado - deudaTotal;
            if (montoPagado < deudaTotal) { estadoFinal = 'Moroso'; }
            let linkComprobante = '';
            const file = document.getElementById('inputComprobanteGC').files[0];
            if (file && file.size > 0) {
                if (typeof obtenerCarpetaResidente !== 'function' || typeof subirComprobante !== 'function') throw new Error("Las funciones de Drive no están definidas.");
                const carpetaId = await obtenerCarpetaResidente(parcela); 
                const res = await subirComprobante(file, carpetaId);
                if (res.error) throw new Error(`Error de Google Drive: ${res.error.message}`);
                linkComprobante = res.webViewLink || `https://drive.google.com/file/d/${res.id}/view`;
            }
            const periodoStr = `${MESES[mesPagadoIndex]} ${anioSeleccionado}`;
            const datosParaSheet = [
              null, formData.get('Nombre_Residente'), parcela, valorGastoComun, periodoStr,
              fechaVencimiento.toISOString().split('T')[0], montoPagado, saldo, interes, null,
              multa, mesesImpagos, deudaTotal, formData.get('Fecha_Pago'), formData.get('Metodo_Pago'), 
              estadoFinal, linkComprobante
            ];
            await agregarPagoGC(datosParaSheet);
            const nuevoPagoObj = {};
            ENCABEZADOS_PAGOS.forEach((encabezado, i) => nuevoPagoObj[encabezado] = datosParaSheet[i]);
            nuevoPagoObj.anio = anioSeleccionado;
            pagosGC_obj.push(nuevoPagoObj);
            filtrarYRenderizar(residentes, pagosGC_obj, timcData);
            modalGC.style.display = 'none';
            e.target.reset();
            mostrarMensaje('Gasto común registrado con éxito.', 'success');
        } catch (err) {
            mostrarMensaje('Error al guardar el gasto: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });

    const modalComprobante = document.getElementById('modalComunicacion');
    document.getElementById('btnAbrirModalComprobante').addEventListener('click', () => modalComprobante.style.display = 'flex');
    document.getElementById('btnCerrarModalComprobante').addEventListener('click', () => modalComprobante.style.display = 'none');
    const selectParcelaComp = document.getElementById('selectParcelaComprobante'), selectMesComp = document.getElementById('selectMesComprobante');
    const inputEmailComp = document.getElementById('inputEmailComprobante'), inputAsuntoComp = document.getElementById('inputAsuntoComprobante'), mensajeComp = document.getElementById('mensajeComprobante');
    function actualizarInfoComprobante() {
        const parcela = selectParcelaComp.value, mesIndex = selectMesComp.value, anio = anioFiltroEl.value;
        const residente = residentes.find(r => r[3] == parcela);
        inputEmailComp.value = residente ? residente[5] : '';
        if (parcela && mesIndex !== "" && anio && residente) {
            const mesNombre = MESES[mesIndex];
            const pago = pagosGC_obj.find(p => p.N_Parcela == parcela && p.Periodo && p.Periodo.toLowerCase().startsWith(mesNombre.toLowerCase()) && p.anio == anio);
            inputAsuntoComp.value = `COMPROBANTE PAGO GASTO COMÚN (${mesNombre.toUpperCase()} ${anio}, N° PARCELA ${parcela})`;
            if (pago) {
                // CORRECCIÓN 4: Mensaje de correo más robusto y formal
                mensajeComp.value = `Estimado/a ${pago.Nombre_Residente},\n\nJunto con saludar, la Administración confirma la recepción de su pago para el Gasto Común de la Parcela N°${pago.N_Parcela}, correspondiente al período de ${pago.Periodo}.\n\nDETALLE DE LA TRANSACCIÓN\n--------------------------------------------------\nFecha de Pago: ${new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone: 'UTC'})}\nMétodo de Pago: ${pago.Metodo_Pago}\nMonto Pagado: $${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}\n\nDeuda Total del Período: $${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}\nSaldo Resultante: $${parseFloat(pago.Saldo_Pendiente_o_a_favor || 0).toLocaleString('es-CL')}\n\nEstado General: ${pago.Estado}\n--------------------------------------------------\n\nEste comprobante acredita la recepción de los fondos. Si tiene alguna consulta, no dude en contactarnos.\n\nSaluda Atentamente,\nAlex Thiele\nAdministrador Condominio Los Molles`;
            } else {
                mensajeComp.value = 'No se encontró un pago registrado para esta parcela en el período y año seleccionados.';
            }
        }
    }
    selectParcelaComp.addEventListener('change', actualizarInfoComprobante);
    selectMesComp.addEventListener('change', actualizarInfoComprobante);
    anioFiltroEl.addEventListener('change', actualizarInfoComprobante);
    document.getElementById('formEnviarComprobante').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = inputEmailComp.value, asunto = inputAsuntoComp.value, mensaje = mensajeComp.value;
        if (!email || !asunto || !mensaje.includes('Administración confirma')) {
            mostrarMensaje('Por favor, selecciona una parcela y un mes con un pago válido para generar el comprobante.', 'error'); return;
        }
        mostrarSpinner();
        try {
            if (typeof enviarCorreo !== 'function') throw new Error("La función 'enviarCorreo' no está definida en gmail.js.");
            await enviarCorreo(email, asunto, mensaje.replace(/\n/g, '<br>'));
            mostrarMensaje('Correo de confirmación enviado con éxito.', 'success');
            modalComprobante.style.display = 'none';
        } catch (err) {
            mostrarMensaje('Error al enviar el correo: ' + err.message, 'error');
        } finally { ocultarSpinner(); }
    });
}
function filtrarYRenderizar(residentes, pagosGC_obj, timcData) {
    const parcela = document.getElementById('filtroParcela').value;
    const anio = document.getElementById('filtroAnio').value;
    if (parcela && anio) { renderizarTablaResidente(parcela, anio, residentes, pagosGC_obj, timcData); } 
    else {
        let datosFiltrados = pagosGC_obj;
        if (anio) { datosFiltrados = datosFiltrados.filter(p => p.anio == anio); }
        renderizarTablaGeneral(datosFiltrados);
    }
}
function renderizarTablaGeneral(datos) {
    const theadGastos = document.getElementById('thead-gastos');
    const tbodyGastos = document.getElementById('tbody-gastos');
    document.querySelector('#detalle-gastos h3').textContent = 'Detalle de Pagos Registrados';
    theadGastos.innerHTML = `<tr><th>Residente</th><th>Parcela</th><th>Período</th><th>Monto Pagado</th><th>Deuda Total</th><th>Fecha Pago</th><th>Estado</th></tr>`;
    tbodyGastos.innerHTML = '';
    if (!datos || datos.length === 0) { tbodyGastos.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No hay registros para el año seleccionado. Filtra por parcela para ver el detalle anual.</td></tr>`; return; }
    datos.sort((a,b) => (b.Fecha_Pago ? new Date(b.Fecha_Pago) : 0) - (a.Fecha_Pago ? new Date(a.Fecha_Pago) : 0));
    datos.forEach(pago => {
        const estadoClass = (pago.Estado || 'pendiente').toLowerCase().trim();
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${pago.Nombre_Residente || 'N/A'}</td><td>${pago.N_Parcela}</td><td>${pago.Periodo || 'N/A'}</td><td>$${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}</td><td style="font-weight:bold;">$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}</td><td>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'}) : '---'}</td><td><span class="estado-tag estado-${estadoClass}">${pago.Estado || 'Pendiente'}</span></td>`;
        tbodyGastos.appendChild(tr);
    });
}
function renderizarTablaResidente(parcela, anio, residentes, pagosGC_obj, timcData) {
    const residente = residentes.find(r => r[3] == parcela);
    const theadGastos = document.getElementById('thead-gastos');
    const tbodyGastos = document.getElementById('tbody-gastos');
    if (!residente) { tbodyGastos.innerHTML = `<tr><td colspan="14">No se encontró residente.</td></tr>`; return; }
    document.querySelector('#detalle-gastos h3').textContent = `Detalle Anual para ${residente[1]} (Parcela ${parcela})`;
    theadGastos.innerHTML = `<tr><th>Nombre Residente</th><th>N° Parcela</th><th>Valor G.C.</th><th>Periodo</th><th>Fecha Vencimiento</th><th>Monto Pagado</th><th>Saldo</th><th>Interés</th><th>Multa 1/4</th><th>Meses Impagos</th><th>Deuda Total</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th></tr>`;
    tbodyGastos.innerHTML = '';
    const valorGastoComun = parseFloat(residente[8]);
    MESES.forEach((mes, index) => {
        const mesNumero = index + 1;
        const pagoExistente = pagosGC_obj.find(p => p.N_Parcela == parcela && p.Periodo && p.Periodo.toLowerCase().startsWith(mes.toLowerCase()) && p.anio == anio);
        let interes = 0, multa = 0, mesesImpagos = 0, saldo = 0, deudaTotal = valorGastoComun;
        let estado = 'Pendiente', montoPagado = 0, fechaPago = '---', metodoPago = '---';
        const fechaVencimiento = new Date(anio, index, 10);
        const hoy = new Date();
        if (pagoExistente) {
            // CORRECCIÓN 2: Se lee el estado directamente desde el registro guardado
            estado = pagoExistente.Estado || 'Pagado';
            montoPagado = parseFloat(pagoExistente.Monto_Pagado || 0);
            const deudaRegistrada = parseFloat(pagoExistente.Deuda_Total || valorGastoComun);
            saldo = montoPagado - deudaRegistrada;
            deudaTotal = deudaRegistrada;
            const fechaPagoStr = pagoExistente.Fecha_Pago;
            fechaPago = fechaPagoStr ? new Date(fechaPagoStr.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone: 'UTC'}) : '---';
            metodoPago = pagoExistente.Metodo_Pago || '---';
        } else if (hoy > fechaVencimiento) {
            estado = 'Moroso';
            let diffAnios = hoy.getFullYear() - fechaVencimiento.getFullYear();
            let diffMeses = hoy.getMonth() - fechaVencimiento.getMonth();
            mesesImpagos = diffAnios * 12 + diffMeses;
            if (hoy.getDate() >= 11) mesesImpagos++;
            if (mesesImpagos <= 0 && diffAnios === 0 && diffMeses === 0) mesesImpagos = 1;
            const timcAnual = (timcData[anio] && timcData[anio][mesNumero]) ? timcData[anio][mesNumero] : 0;
            interes = valorGastoComun * (timcAnual / 100) / 12;
            multa = (valorGastoComun / 4) * mesesImpagos;
            deudaTotal = valorGastoComun + interes + multa;
            saldo = -deudaTotal;
        }
        const tr = document.createElement('tr');
        const estadoClass = estado.toLowerCase().trim();
        tr.innerHTML = `<td>${residente[1]}</td><td>${parcela}</td><td>$${valorGastoComun.toLocaleString('es-CL')}</td><td><b>${mes} ${anio}</b></td><td>${fechaVencimiento.toLocaleDateString('es-CL', {timeZone: 'UTC'})}</td><td>$${montoPagado.toLocaleString('es-CL')}</td><td style="color:${saldo < 0 ? 'red' : 'green'}; font-weight:bold;">$${saldo.toLocaleString('es-CL')}</td><td>$${interes.toLocaleString('es-CL', {minimumFractionDigits:2, maximumFractionDigits:2})}</td><td>$${multa.toLocaleString('es-CL')}</td><td>${mesesImpagos}</td><td style="font-weight:bold;">$${deudaTotal.toLocaleString('es-CL')}</td><td>${fechaPago}</td><td>${metodoPago}</td><td><span class="estado-tag estado-${estadoClass}">${estado}</span></td>`;
        tbodyGastos.appendChild(tr);
    });
}
function actualizarVistaTIMC(timcData) {
    const anio = document.getElementById('filtroAnio').value || new Date().getFullYear();
    const timcList = document.getElementById('timc-list-horizontal');
    timcList.innerHTML = '';
    const anioData = timcData[anio] || {};
    MESES.forEach((mes, i) => {
        const mesNumero = i + 1;
        const timcValor = anioData[mesNumero] ? `<b>${anioData[mesNumero]}%</b>` : 'N/A';
        timcList.innerHTML += `<div style="flex-basis: 15%;">${mes}: ${timcValor}</div>`;
    });
}
window.cargarGastosComunes = cargarGastosComunes;
