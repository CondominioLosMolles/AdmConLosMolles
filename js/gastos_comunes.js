// js/gastos_comunes.js

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado',
    'ID_Comprobante_Drive'
];

function formatearPeriodo(periodo) {
  if (!periodo) return 'N/A';
  const match = periodo.toString().match(/^(\d{4})-(\d{1,2})$/);
  if (match) {
    const anio = parseInt(match[1]);
    const mesIndex = parseInt(match[2]) - 1;
    if (mesIndex >= 0 && mesIndex < 12) {
      return `${MESES[mesIndex]} ${anio}`;
    }
  }
  return periodo;
}

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
            const anioMatch = obj.Periodo.toString().match(/\d{4}/);
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
    <style>
      .estado-abono { background-color: #ffc107; color: #333; }
      .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; }
      #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;}
      #detalle-pago-grid b { grid-column: 1; text-align: right; }
      #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; }
    </style>
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
    
    <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
      <section class="widget" style="flex: 1; min-width: 350px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 1; min-width: 150px;">
              <label for="filtroParcela"><b>N° Parcela:</b></label>
              <input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;">
              <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
            </div>
            <div style="flex: 1; min-width: 150px;">
              <label for="filtroAnio"><b>Año:</b></label>
              <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
            </div>
          </div>
        </div>
        <div style="margin-top: auto;">
          <button id="btnAbrirModalGasto" class="btn" style="width: 100%; margin-bottom: 10px;">Agregar Gasto Común</button>
          <button id="btnAbrirModalComprobante" class="btn secondary" style="width: 100%;">Enviar Comprobante</button>
        </div>
      </section>

      <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
    </div>
    <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Gastos</h3><div style="overflow-x:auto;"><table class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
    
    <div id="modalGC" class="modal" style="display:none;"><div><h3>Agregar Gasto Común</h3><form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;"><div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div><div style="flex: 1 1 300px;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div><div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div><div style="flex: 1 1 180px;"><label>Monto Pagado</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div><div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div><div style="flex: 1 1 100%;"><label>Comprobante</label><input type="file" name="Comprobante"></div><div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div></form></div></div>

    <div id="modalComprobante" class="modal" style="display:none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); align-items: center; justify-content: center;">
      <div class="widget" style="max-width: 650px; width: 90%; margin: auto; z-index: 1001;">
        <h3>Enviar Comprobante por Correo</h3>
        <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div><label><b>Email Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
      </div>
    </div>

    <div id="modalDetallePago" class="modal" style="display:none; position: fixed; z-index: 1050; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.6); align-items: center; justify-content: center;">
        <div class="widget" style="max-width: 550px; width: 90%; margin: auto; z-index: 1051;">
            <h3 style="margin-top:0;">Detalle Completo del Registro</h3>
            <div id="contenidoDetallePago" style="margin-bottom: 20px;"></div>
            <div style="text-align: right;"><button id="btnCerrarModalDetalle" class="btn secondary">Cerrar</button></div>
        </div>
    </div>
  `;
  
  const tbodyGastos = document.getElementById('tbody-gastos');
  const theadGastos = document.getElementById('thead-gastos');

  function renderizarTablaGeneral(datos) {
    document.querySelector('#detalle-gastos h3').textContent = 'Detalle de Pagos Registrados';
    theadGastos.innerHTML = `<tr><th>Residente</th><th>Parcela</th><th>Período</th><th>Monto Pagado</th><th>Deuda Pendiente</th><th>Fecha Pago</th><th>Estado</th></tr>`;
    tbodyGastos.innerHTML = '';
    if (!datos || datos.length === 0) { tbodyGastos.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No hay registros para el año seleccionado.</td></tr>`; return; }
    datos.sort((a,b) => (b.Fecha_Pago ? new Date(b.Fecha_Pago) : 0) - (a.Fecha_Pago ? new Date(a.Fecha_Pago) : 0));
    datos.forEach(pago => {
        const estadoClass = (pago.Estado || 'pendiente').toLowerCase().trim().replace(' ', '-');
        const tr = document.createElement('tr');
        tr.dataset.idPago = pago.ID_Pago;
        tr.classList.add('fila-clicable');
        tr.innerHTML = `<td>${pago.Nombre_Residente || 'N/A'}</td><td>${pago.N_Parcela}</td><td>${formatearPeriodo(pago.Periodo) || 'N/A'}</td><td>$${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}</td><td style="font-weight:bold; color: red;">$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}</td><td>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'}) : '---'}</td><td><span class="estado-tag estado-${estadoClass}">${pago.Estado || 'Pendiente'}</span></td>`;
        tbodyGastos.appendChild(tr);
    });
  }
  
  function renderizarTablaResidente(parcela, anio) {
    const residente = residentes.find(r => r[3] == parcela);
    if (!residente) { tbodyGastos.innerHTML = `<tr><td colspan="14">No se encontró residente.</td></tr>`; return; }

    document.querySelector('#detalle-gastos h3').textContent = `Detalle Anual para ${residente[1]} (Parcela ${parcela})`;
    theadGastos.innerHTML = `<tr><th>Nombre Residente</th><th>N° Parcela</th><th>Valor G.C.</th><th>Periodo</th><th>Fecha Vencimiento</th><th>Monto Pagado</th><th>Saldo Transacción</th><th>Interés</th><th>Multa</th><th>Meses Impagos</th><th>Deuda Pendiente</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th></tr>`;

    tbodyGastos.innerHTML = '';
    const valorGastoComun = parseFloat(residente[8]);

    MESES.forEach((mes, index) => {
        const mesNumero = index + 1;
        const pagoExistente = pagosGC_obj.find(p => p.N_Parcela == parcela && p.Periodo && formatearPeriodo(p.Periodo).toLowerCase().startsWith(mes.toLowerCase()) && p.anio == anio);
        
        let interes = 0, multa = 0, mesesImpagos = 0, saldo = 0;
        let estado = 'Pendiente', montoPagado = 0, fechaPago = '---', metodoPago = '---';
        let deudaPendiente = 0;
        
        const fechaVencimiento = new Date(anio, index, 10);
        const hoy = new Date();

        if (pagoExistente) {
            estado = pagoExistente.Estado;
            montoPagado = parseFloat(pagoExistente.Monto_Pagado || 0);
            saldo = parseFloat(pagoExistente.Saldo_Pendiente_o_a_favor || 0);
            deudaPendiente = parseFloat(pagoExistente.Deuda_Total || 0);
            interes = parseFloat(pagoExistente.Interes || 0);
            multa = parseFloat(pagoExistente['Multa_1/4'] || 0);
            
            const fechaPagoStr = pagoExistente.Fecha_Pago;
            fechaPago = fechaPagoStr ? new Date(fechaPagoStr.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone: 'UTC'}) : '---';
            metodoPago = pagoExistente.Metodo_Pago || '---';
        } else if (hoy > fechaVencimiento) {
            estado = 'Moroso';
            const diffAnios = hoy.getFullYear() - fechaVencimiento.getFullYear();
            const diffMeses = hoy.getMonth() - fechaVencimiento.getMonth();
            mesesImpagos = diffAnios * 12 + diffMeses;
            if (hoy.getDate() >= 11) mesesImpagos++;
            if (mesesImpagos <= 0) mesesImpagos = 1;
            const timcAnual = (timcData[anio] && timcData[anio][mesNumero]) ? timcData[anio][mesNumero] : 0;
            interes = valorGastoComun * (timcAnual / 100) / 12;
            multa = (valorGastoComun / 4) * mesesImpagos;
            deudaPendiente = valorGastoComun + interes + multa;
            saldo = -deudaPendiente;
        }

        const tr = document.createElement('tr');
        if (pagoExistente) {
            tr.dataset.idPago = pagoExistente.ID_Pago;
            tr.classList.add('fila-clicable');
        }
        const estadoClass = estado.toLowerCase().replace(' ', '-');
        tr.innerHTML = `<td>${residente[1]}</td><td>${parcela}</td><td>$${valorGastoComun.toLocaleString('es-CL')}</td><td><b>${mes} ${anio}</b></td><td>${fechaVencimiento.toLocaleDateString('es-CL', {timeZone: 'UTC'})}</td><td>$${montoPagado.toLocaleString('es-CL')}</td><td style="color:${saldo < 0 ? 'red' : 'green'}; font-weight:bold;">$${saldo.toLocaleString('es-CL')}</td><td>$${interes.toLocaleString('es-CL', {minimumFractionDigits:2, maximumFractionDigits:2})}</td><td>$${multa.toLocaleString('es-CL')}</td><td>${mesesImpagos}</td><td style="font-weight:bold; color: red;">$${deudaPendiente.toLocaleString('es-CL')}</td><td>${fechaPago}</td><td>${metodoPago}</td><td><span class="estado-tag estado-${estadoClass}">${estado}</span></td>`;
        tbodyGastos.appendChild(tr);
    });
  }

  function abrirModalDetalle(idPago) {
    const pago = pagosGC_obj.find(p => p.ID_Pago == idPago);
    if (!pago) {
        mostrarMensaje('No se encontró el registro del pago.', 'error');
        return;
    }

    const modal = document.getElementById('modalDetallePago');
    const contenido = document.getElementById('contenidoDetallePago');

    const montoPagado = parseFloat(pago.Monto_Pagado || 0);
    const saldoTransaccion = parseFloat(pago.Saldo_Pendiente_o_a_favor || 0);
    const deudaDelPeriodo = montoPagado - saldoTransaccion;
    const saldoFinalTexto = saldoTransaccion >= 0 ? `A favor: $${saldoTransaccion.toLocaleString('es-CL')}` : `Pendiente: $${Math.abs(saldoTransaccion).toLocaleString('es-CL')}`;

    let filaComprobante = '';
    if (pago.ID_Comprobante_Drive) {
        filaComprobante = `<b>Comprobante:</b> <span><a href="${pago.ID_Comprobante_Drive}" target="_blank" class="btn small">Ver Documento</a></span>`;
    } else {
        filaComprobante = '<b>Comprobante:</b> <span>No adjunto</span>';
    }

    contenido.innerHTML = `
        <div id="detalle-pago-grid">
            <b>Residente:</b>       <span>${pago.Nombre_Residente}</span>
            <b>N° Parcela:</b>      <span>${pago.N_Parcela}</span>
            <b>Período pagado:</b>  <span>${formatearPeriodo(pago.Periodo)}</span>
            <hr style="grid-column: 1 / -1;">
            <b>Valor Gasto Común:</b> <span>$${parseFloat(pago.Valor_Gasto_Comun).toLocaleString('es-CL')}</span>
            <b>Interés por mora:</b>  <span>$${parseFloat(pago.Interes || 0).toLocaleString('es-CL')}</span>
            <b>Multa aplicada:</b>    <span>$${parseFloat(pago['Multa_1/4'] || 0).toLocaleString('es-CL')}</span>
            <b style="color:#2a7ca3;">Deuda del Período:</b> <span style="font-weight:bold; color:#2a7ca3;">$${deudaDelPeriodo.toLocaleString('es-CL')}</span>
            <hr style="grid-column: 1 / -1;">
            <b>Monto Pagado:</b>      <span style="font-weight:bold; color:green;">$${montoPagado.toLocaleString('es-CL')}</span>
            <b>Fecha de Pago:</b>     <span>${new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'})}</span>
            <b>Método de Pago:</b>    <span>${pago.Metodo_Pago}</span>
            <b>Resultado (Saldo):</b> <span style="font-weight:bold; color:${saldoTransaccion < 0 ? 'red' : 'green'};">${saldoFinalTexto}</span>
             <hr style="grid-column: 1 / -1;">
            <b>Estado del pago:</b>   <span>${pago.Estado}</span>
            ${filaComprobante}
        </div>
    `;

    modal.style.display = 'flex';
  }

  function filtrarYRenderizar() {
    const parcela = document.getElementById('filtroParcela').value;
    const anio = document.getElementById('filtroAnio').value;
    if (parcela && anio) {
        renderizarTablaResidente(parcela, anio);
    } else {
        let datosFiltrados = pagosGC_obj;
        if (anio) {
            datosFiltrados = datosFiltrados.filter(p => p.anio == anio);
        }
        renderizarTablaGeneral(datosFiltrados);
    }
  }
  
  function actualizarVistaTIMC() {
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

  document.getElementById('btnGuardarTMC').addEventListener('click', async () => {
    if (typeof guardarTIMC !== 'function') return mostrarMensaje('Error: La función "guardarTIMC" no se encontró en sheets.js.', 'error');
    const anio = document.getElementById('filtroAnio').value;
    const mes = document.getElementById('selectMesTMC').value;
    const valor = parseFloat(document.getElementById('inputTMC').value);
    if (isNaN(valor) || !mes || !anio) return mostrarMensaje('Debe ingresar TIMC, mes y año.', 'error');
    mostrarSpinner();
    try {
      await guardarTIMC(anio, mes, valor);
      if (!timcData[anio]) timcData[anio] = {};
      timcData[anio][mes] = valor;
      actualizarVistaTIMC();
      if (document.getElementById('filtroParcela').value) filtrarYRenderizar();
      mostrarMensaje(`TIMC guardado en la hoja "Config_TIMC".`, 'success');
    } catch (err) {
      mostrarMensaje('Error al guardar TIMC: ' + err.message, 'error');
    } finally {
      ocultarSpinner();
    }
  });
  
  const modal = document.getElementById('modalGC');
  document.getElementById('btnAbrirModalGasto').addEventListener('click', () => modal.style.display = 'flex');
  document.getElementById('btnCerrarModal').addEventListener('click', () => modal.style.display = 'none');
  
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

        if (!residente) throw new Error("No se encontró el residente para la parcela seleccionada.");

        const valorGastoComun = parseFloat(residente[8]);
        const mesPagadoIndex = parseInt(formData.get('Periodo'));
        const anioSeleccionado = new Date(formData.get('Fecha_Pago').replace(/-/g, '/')).getFullYear();
        const fechaDePago = new Date(formData.get('Fecha_Pago').replace(/-/g, '/'));
        const fechaVencimiento = new Date(anioSeleccionado, mesPagadoIndex, 10);
        
        let deudaDelPeriodo = valorGastoComun;
        let interes = 0, multa = 0, mesesImpagos = 0;

        if (fechaDePago > fechaVencimiento) {
            const diffAnios = fechaDePago.getFullYear() - fechaVencimiento.getFullYear();
            const diffMeses = fechaDePago.getMonth() - fechaVencimiento.getMonth();
            mesesImpagos = diffAnios * 12 + diffMeses;
            if (fechaDePago.getDate() >= 11) mesesImpagos++;
            if (mesesImpagos <= 0) mesesImpagos = 1;
            const timcAnual = (timcData[anioSeleccionado] && timcData[anioSeleccionado][mesPagadoIndex + 1]) ? timcData[anioSeleccionado][mesPagadoIndex + 1] : 0;
            interes = valorGastoComun * (timcAnual / 100) / 12;
            multa = (valorGastoComun / 4) * mesesImpagos;
            deudaDelPeriodo = valorGastoComun + interes + multa;
        }

        let linkComprobante = null;
        const archivo = formData.get('Comprobante');
        if (archivo && archivo.size > 0) {
            if (typeof buscarOCrearCarpetaDeParcela !== 'function' || typeof subirComprobante !== 'function') {
                throw new Error("Las funciones de Google Drive no están disponibles.");
            }
            const nombreCarpeta = `Parcela ${parcela}`;
            const carpetaId = await buscarOCrearCarpetaDeParcela(nombreCarpeta);
            const resultadoSubida = await subirComprobante(archivo, carpetaId);
            linkComprobante = resultadoSubida.webViewLink;
        }

        const montoPagado = parseFloat(formData.get('Monto_Pagado'));
        const saldoTransaccion = montoPagado - deudaDelPeriodo;
        const periodoStr = `${MESES[mesPagadoIndex]} ${anioSeleccionado}`;
        const estadoPago = saldoTransaccion >= 0 ? 'Pagado' : 'Abono';
        const deudaPendienteParaSheet = saldoTransaccion < 0 ? -saldoTransaccion : 0;

        const datosParaSheet = [
          null, formData.get('Nombre_Residente'), parcela, valorGastoComun, periodoStr,
          fechaVencimiento.toISOString().split('T')[0], montoPagado, saldoTransaccion, interes, null,
          multa, mesesImpagos, deudaPendienteParaSheet, formData.get('Fecha_Pago'), formData.get('Metodo_Pago'),
          estadoPago, linkComprobante
        ];
        
        await agregarPagoGC(datosParaSheet);
        
        const nuevoPagoObj = {};
        ENCABEZADOS_PAGOS.forEach((encabezado, i) => nuevoPagoObj[encabezado] = datosParaSheet[i]);
        nuevoPagoObj.anio = anioSeleccionado;
        pagosGC_obj.push(nuevoPagoObj);
        
        filtrarYRenderizar();
        modal.style.display = 'none';
        e.target.reset();
        mostrarMensaje('Gasto común registrado con éxito en Google Sheets.', 'success');

    } catch (err) {
        mostrarMensaje('Error al guardar el gasto: ' + err.message, 'error');
    } finally {
        ocultarSpinner();
    }
  });

  const modalComprobante = document.getElementById('modalComprobante');
  const formComprobante = document.getElementById('formEnviarComprobante');
  const inputParcelaComprobante = document.getElementById('inputNParcelaComprobante');
  
  document.getElementById('btnAbrirModalComprobante').addEventListener('click', () => {
    formComprobante.reset();
    document.getElementById('divCuerpoComprobante').innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span>`;
    modalComprobante.style.display = 'flex';
  });

  document.getElementById('btnCerrarModalComprobante').addEventListener('click', () => {
    modalComprobante.style.display = 'none';
  });
  
  function crearCuerpoCorreo(pago, residente) {
    const nombreResidente = residente[1];
    const periodoFormateado = formatearPeriodo(pago.Periodo);
    const valorGC = parseFloat(pago.Valor_Gasto_Comun).toLocaleString('es-CL');
    const interes = parseFloat(pago.Interes || 0).toLocaleString('es-CL');
    const multa = parseFloat(pago['Multa_1/4'] || 0).toLocaleString('es-CL');
    const deudaDelPeriodo = (parseFloat(pago.Monto_Pagado) - parseFloat(pago.Saldo_Pendiente_o_a_favor));
    const montoPagado = parseFloat(pago.Monto_Pagado).toLocaleString('es-CL');
    const saldo = parseFloat(pago.Saldo_Pendiente_o_a_favor || 0);
    const fechaPago = new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', { timeZone: 'UTC' });

    let saldoTexto, saldoColor;
    if (saldo >= 0) {
      saldoTexto = `Saldo a favor: $${saldo.toLocaleString('es-CL')}`;
      saldoColor = 'green';
    } else {
      saldoTexto = `Saldo pendiente: $${Math.abs(saldo).toLocaleString('es-CL')}`;
      saldoColor = 'red';
    }

    let mensajeAdvertencia = '';
    if (saldo < 0) {
        mensajeAdvertencia = `<p style="font-size: 12px; color: #c00; font-weight: bold;">El no pago de la totalidad de su deuda, seguirá generando intereses o multas. Favor regularizar su pago total para no quedar en estado moroso.</p>`;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; font-size: 14px; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 20px;"><h2 style="color: #2a7ca3; margin-top: 10px;">Comprobante de Pago de Gasto Común</h2></div>
        <p>Estimado(a) <strong>${nombreResidente}</strong>,</p>
        <p>Confirmamos la recepción de su pago correspondiente al Gasto Común del período <strong>${periodoFormateado}</strong>.</p>
        <hr>
        <h3 style="color: #333; margin-top: 20px; margin-bottom: 10px; font-size: 16px;">Detalle del Pago</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Fecha de Pago:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${fechaPago}</strong></td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Método de Pago:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;"><strong>${pago.Metodo_Pago}</strong></td></tr>
        </table>
        <h3 style="color: #333; margin-top: 20px; margin-bottom: 10px; font-size: 16px;">Resumen del Período Pagado</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Valor Gasto Común:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${valorGC}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Intereses por mora:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${interes}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Multas:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${multa}</td></tr>
          <tr style="font-weight: bold;"><td style="padding: 8px; border-bottom: 1px solid #ddd;">Deuda del Período:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr>
          <tr style="font-weight: bold;"><td style="padding: 8px; border-bottom: 1px solid #ddd;">Monto Pagado:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${montoPagado}</td></tr>
          <tr style="font-weight: bold; color: ${saldoColor};"><td style="padding: 8px;">Resultado Final:</td><td style="padding: 8px; text-align: right;">${saldoTexto}</td></tr>
        </table>
        <hr style="margin-top: 25px;">
        <p style="font-size: 12px; color: #777;">Si tiene alguna consulta sobre este comprobante, no dude en contactarnos.</p>
        ${mensajeAdvertencia}
        <p>Gracias por su compromiso con la comunidad.</p>
        <p>Se despide Atentamente,<br><strong>Alex Thiele</strong><br>Administrador Condominio Los Molles</p>
      </div>
    `;
  }

  inputParcelaComprobante.addEventListener('input', (e) => {
    const parcela = e.target.value;
    const nombreInput = document.getElementById('inputNombreResidenteComprobante');
    const emailInput = document.getElementById('inputEmailComprobante');
    const asuntoInput = document.getElementById('inputAsuntoComprobante');
    const cuerpoDiv = document.getElementById('divCuerpoComprobante');

    nombreInput.value = '';
    emailInput.value = '';
    asuntoInput.value = '';
    cuerpoDiv.innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela...</span>`;

    if (!parcela) return;

    const residente = residentes.find(r => r[3] == parcela);
    if (!residente) {
        nombreInput.value = 'Residente no encontrado.';
        return;
    }
    
    const pagosDelResidente = pagosGC_obj
      .filter(p => p.N_Parcela == parcela && p.Fecha_Pago)
      .sort((a, b) => new Date(b.Fecha_Pago) - new Date(a.Fecha_Pago));

    const emailResidente = residente[5];

    if (pagosDelResidente.length === 0) {
        nombreInput.value = residente[1];
        emailInput.value = emailResidente || 'No registrado';
        cuerpoDiv.innerHTML = `<span style="color: #dc3545;">No se encontraron pagos registrados para esta parcela.</span>`;
        return;
    }
    
    const ultimoPago = pagosDelResidente[0];
    const periodoFormateado = formatearPeriodo(ultimoPago.Periodo);
    
    nombreInput.value = ultimoPago.Nombre_Residente;
    emailInput.value = emailResidente || 'No registrado';
    
    asuntoInput.value = `Comprobante pago gasto común ${periodoFormateado} Parcela Número ${parcela}`;
    cuerpoDiv.innerHTML = crearCuerpoCorreo(ultimoPago, residente);
  });

  formComprobante.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cuerpoPreview = document.getElementById('divCuerpoComprobante');
    if (typeof enviarCorreo !== 'function') {
      return mostrarMensaje('Error: La función para enviar correos no está disponible.', 'error');
    }
    const destinatario = document.getElementById('inputEmailComprobante').value;
    const asunto = document.getElementById('inputAsuntoComprobante').value;
    const cuerpo = cuerpoPreview.innerHTML;

    if (!destinatario || !asunto || cuerpo.includes("Ingrese un N° de Parcela")) {
      return mostrarMensaje('Datos incompletos o inválidos. Asegúrese de seleccionar una parcela con pagos.', 'error');
    }
    
    mostrarSpinner();
    try {
      await enviarCorreo(destinatario, asunto, cuerpo);
      modalComprobante.style.display = 'none';
      mostrarMensaje(`Correo enviado con éxito a ${destinatario}.`, 'success');
    } catch (err) {
      mostrarMensaje(`Error al enviar el correo: ${err.message}`, 'error');
    } finally {
      ocultarSpinner();
    }
  });

  document.getElementById('filtroParcela').addEventListener('input', filtrarYRenderizar);
  document.getElementById('filtroAnio').addEventListener('input', () => {
    actualizarVistaTIMC();
    filtrarYRenderizar();
  });
  
  document.getElementById('tbody-gastos').addEventListener('click', (e) => {
    const fila = e.target.closest('tr.fila-clicable');
    if (fila && fila.dataset.idPago) {
        abrirModalDetalle(fila.dataset.idPago);
    }
  });

  document.getElementById('modalDetallePago').addEventListener('click', (e) => {
    if(e.target === e.currentTarget) e.currentTarget.style.display = 'none';
  });
  document.getElementById('btnCerrarModalDetalle').addEventListener('click', () => {
    document.getElementById('modalDetallePago').style.display = 'none';
  });

  filtrarYRenderizar();
  actualizarVistaTIMC();
  ocultarSpinner();
}
