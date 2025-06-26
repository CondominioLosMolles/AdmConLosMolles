// js/gastos_comunes.js

// =================================================================
// ===== FUNCIONES DE COMUNICACIÓN CON GOOGLE APPS SCRIPT =====
// =================================================================
function actualizarPagoGC(datosActualizacion) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .actualizarPagoGC_GS(datosActualizacion);
  });
}
// ===== AÑADE ESTA NUEVA FUNCIÓN AQUÍ =====
function agregarPagoGC(datosParaSheet) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .agregarPagoGC_GS(datosParaSheet);
  });
}
// ===== FIN DE LA NUEVA FUNCIÓN =====

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado',
    'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado'
];

function formatearPeriodo(periodo) {
  if (!periodo) return 'N/A';
  return String(periodo).trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseCurrency(value) {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value === '') return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}


function aplicarAnchosGuardados(table) {
    const savedWidthsJSON = localStorage.getItem('tablaPagosColumnWidths');
    if (savedWidthsJSON) {
        try {
            const savedWidths = JSON.parse(savedWidthsJSON);
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                if (savedWidths[index]) {
                    header.style.width = savedWidths[index];
                }
            });
        } catch (e) {
            console.error("Error al parsear anchos guardados:", e);
            localStorage.removeItem('tablaPagosColumnWidths');
        }
    }
}

function hacerColumnasRedimensionables(table) {
    const headers = Array.from(table.querySelectorAll('th'));
    headers.forEach(header => {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        header.appendChild(resizer);
        
        const onMouseDown = (e) => {
            e.preventDefault();
            const startX = e.pageX;
            const startWidth = header.offsetWidth;

            const onMouseMove = (e) => {
                const newWidth = startWidth + (e.pageX - startX);
                if (newWidth > 50) {
                    header.style.width = `${newWidth}px`;
                }
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                
                const currentHeaders = Array.from(table.querySelectorAll('th'));
                const widths = currentHeaders.map(h => h.style.width || '');
                localStorage.setItem('tablaPagosColumnWidths', JSON.stringify(widths));
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        };
        
        resizer.addEventListener('mousedown', onMouseDown);
    });
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
    
    pagosGC_obj = (pagosGC_raw || []).map((fila, index) => {
        let obj = {};
        ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; });
        if (obj.Periodo) {
            const anioMatch = String(obj.Periodo).match(/\d{4}/);
            obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
        }
        obj.rowNum = index + 2;
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
      .estado-pagado { background-color: #198754; color: white; }
      .estado-moroso { background-color: #dc3545; color: white; }
      .estado-abono { background-color: #ffc107; color: #333; }
      .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; }
      #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;}
      #detalle-pago-grid b { grid-column: 1; text-align: right; }
      #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; }
      .suggestion-item { padding: 8px 12px; cursor: pointer; }
      .suggestion-item:hover { background-color: #e9f1fb; }
      #table-pagos { table-layout: fixed; width: 100%; border-collapse: collapse; }
      #table-pagos th { position: relative; }
      .resizer { position: absolute; top: 0; right: -2px; width: 5px; cursor: col-resize; user-select: none; height: 100%; z-index: 1;}
      .resizer:hover { border-right: 2px solid #007bff; }
      .comprobante-enviado { color: green; font-size: 1.2rem; font-weight: bold; text-align: center; }
      #convenio-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
      #convenio-summary-grid > div { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
      #convenio-summary-grid > div > span { display: block; font-size: 1.4em; font-weight: bold; }
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
    <section id="widget-convenio" class="widget" style="display:none; margin-top: 2rem;">
        <h3 style="margin-top:0;">Estado de Convenio de Pago</h3>
        <div id="convenio-summary-grid"></div>
        <h4 style="margin-top: 1.5rem;">Historial de Abonos (Año Seleccionado)</h4>
        <div style="overflow-x:auto;"><table class="table"><thead id="thead-abonos"></thead><tbody id="tbody-abonos"></tbody></table></div>
    </section>
    <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Pagos Registrados</h3><div style="overflow-x:auto;"><table id="table-pagos" class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
    <div id="modalGC" class="modal" style="display:none;"><div><h3>Agregar Gasto Común</h3><form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;"><div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div><div style="flex: 1 1 300px; position: relative;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" autocomplete="off" required><div id="nombre-suggestions" style="display: none; position: absolute; background-color: white; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; width: 100%; z-index: 10;"></div></div><div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div><div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div><div style="flex: 1 1 180px;"><label>Año que Paga</label><input type="number" name="Anio_Periodo" id="inputAnioPeriodo" required></div><div style="flex: 1 1 180px;"><label>Monto Pagado G.C.</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div><div style="flex: 1 1 180px;"><label>Abono a Convenio (CLP)</label><input type="number" name="Abono_Convenio" min="0" step="1" placeholder="CLP"><small id="saldo-convenio-info" style="display:none; color: #007bff;"></small></div><div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div><div style="flex: 1 1 100%;"><label>Comprobante</label><input type="file" name="Comprobante"></div><div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div></form></div></div>
    <div id="modalComprobante" class="modal" style="display:none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.5); align-items: center; justify-content: center;">
      <div class="widget" style="max-width: 650px; width: 90%; margin: auto; z-index: 1001;">
        <h3>Enviar Comprobante por Correo</h3>
        <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente(s)</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div id="periodo-selector-container" style="display: none;"><label><b>Seleccione el Comprobante</b></label><select id="selectPeriodoComprobante" style="width:100%; padding: 11px 10px;"></select></div><div><label><b>Email(s) Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
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
  
  function renderizarTablaResidente(parcela, anio) {
    const residente = residentes.find(r => String(r[3]) === String(parcela));
    if (!residente) { 
        document.getElementById('widget-convenio').style.display = 'none';
        tbodyGastos.innerHTML = `<tr><td colspan="10">No se encontró residente.</td></tr>`; 
        return; 
    }
    const widgetConvenio = document.getElementById('widget-convenio');
    const deudaInicialConvenio = parseCurrency(residente[11]);
    if (deudaInicialConvenio > 0) {
        widgetConvenio.style.display = 'block';
        const saldoActualConvenio = parseCurrency(residente[12]);
        const totalAbonado = deudaInicialConvenio - saldoActualConvenio;
        document.getElementById('convenio-summary-grid').innerHTML = `
            <div>Deuda Inicial<span style="color: #dc3545;">$${deudaInicialConvenio.toLocaleString('es-CL')}</span></div>
            <div>Total Abonado<span style="color: #198754;">$${totalAbonado.toLocaleString('es-CL')}</span></div>
            <div>Saldo Pendiente<span style="color: #ffc107;">$${saldoActualConvenio.toLocaleString('es-CL')}</span></div>
        `;
        const abonosDelAnio = pagosGC_obj.filter(p => String(p.N_Parcela) === String(parcela) && p.anio == anio && parseCurrency(p.Abono_Convenio) > 0);
        const theadAbonos = document.getElementById('thead-abonos');
        const tbodyAbonos = document.getElementById('tbody-abonos');
        theadAbonos.innerHTML = `<tr><th>Fecha de Pago</th><th>Monto Abonado</th><th>Comprobante</th></tr>`;
        if(abonosDelAnio.length > 0) {
            tbodyAbonos.innerHTML = abonosDelAnio.map(abono => {
                const linkComprobante = abono.ID_Comprobante_Drive ? `<a href="${abono.ID_Comprobante_Drive}" target="_blank" class="btn small">Ver</a>` : 'N/A';
                return `<tr>
                    <td>${new Date(abono.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'})}</td>
                    <td>$${parseCurrency(abono.Abono_Convenio).toLocaleString('es-CL')}</td>
                    <td>${linkComprobante}</td>
                </tr>`;
            }).join('');
        } else {
            tbodyAbonos.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay abonos a convenio registrados para este año.</td></tr>`;
        }
    } else {
        widgetConvenio.style.display = 'none';
    }

    document.querySelector('#detalle-gastos h3').textContent = `Detalle Anual de Gastos Comunes para ${residente[1]} (Parcela ${parcela})`;
    theadGastos.innerHTML = `<tr><th>Período</th><th>Fecha Vencimiento</th><th>Monto Pagado</th><th>Saldo Transacción</th><th>Interés</th><th>Multa</th><th>Deuda Pendiente</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th></tr>`;
    
    const pagosDelResidente = pagosGC_obj
      .filter(p => String(p.N_Parcela) === String(parcela) && p.anio == anio)
      .sort((a, b) => new Date(a.Fecha_Vencimiento) - new Date(b.Fecha_Vencimiento));

    if (pagosDelResidente.length === 0) {
        tbodyGastos.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px;">No hay registros para los filtros seleccionados.</td></tr>`;
    } else {
        tbodyGastos.innerHTML = pagosDelResidente.map(pago => {
            const montoPagado = parseCurrency(pago.Monto_Pagado);
            const saldo = parseCurrency(pago.Saldo_Pendiente_o_a_favor);
            const interes = parseCurrency(pago.Interes);
            const multa = parseCurrency(pago['Multa_1/4']);
            const deudaPendiente = parseCurrency(pago.Deuda_Total);
            const fechaVencimiento = new Date(pago.Fecha_Vencimiento.replace(/-/g, '/'));
            const fechaPago = pago.Fecha_Pago ? new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone: 'UTC'}) : '---';
            const estadoClass = (pago.Estado || '').toLowerCase().replace(' ', '-');

            return `<tr data-id-pago="${pago.ID_Pago}" class="fila-clicable">
                <td><b>${formatearPeriodo(pago.Periodo)}</b></td>
                <td>${fechaVencimiento.toLocaleDateString('es-CL', {timeZone: 'UTC'})}</td>
                <td>$${montoPagado.toLocaleString('es-CL')}</td>
                <td style="color:${saldo < 0 ? 'red' : 'green'}; font-weight:bold;">$${saldo.toLocaleString('es-CL')}</td>
                <td>$${interes.toLocaleString('es-CL')}</td>
                <td>$${multa.toLocaleString('es-CL')}</td>
                <td style="font-weight:bold; color: ${deudaPendiente > 0 ? 'red' : 'inherit'};">$${deudaPendiente.toLocaleString('es-CL')}</td>
                <td>${fechaPago}</td>
                <td>${pago.Metodo_Pago || '---'}</td>
                <td><span class="estado-tag estado-${estadoClass}">${pago.Estado}</span></td>
            </tr>`;
        }).join('');
    }
    const tabla = document.getElementById('table-pagos');
    aplicarAnchosGuardados(tabla);
    hacerColumnasRedimensionables(tabla);
  }

  function abrirModalDetalle(idPago) {
    const pago = pagosGC_obj.find(p => p.ID_Pago == idPago);
    if (!pago) { mostrarMensaje('No se encontró el registro del pago.', 'error'); return; }
    const modal = document.getElementById('modalDetallePago');
    const contenido = document.getElementById('contenidoDetallePago');
    const montoPagado = parseCurrency(pago.Monto_Pagado);
    const saldoTransaccion = parseCurrency(pago.Saldo_Pendiente_o_a_favor);
    const deudaDelPeriodo = montoPagado - saldoTransaccion;
    const saldoFinalTexto = saldoTransaccion >= 0 ? `A favor: $${saldoTransaccion.toLocaleString('es-CL')}` : `Pendiente: $${Math.abs(saldoTransaccion).toLocaleString('es-CL')}`;
    const abonoConvenio = parseCurrency(pago.Abono_Convenio);
    const colorAbono = abonoConvenio > 0 ? 'darkblue' : '#555';
    const currencyOptions = { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 };
    let filaComprobante = pago.ID_Comprobante_Drive ? `<b>Comprobante:</b> <span><a href="${pago.ID_Comprobante_Drive}" target="_blank" class="btn small">Ver Documento</a></span>` : '<b>Comprobante:</b> <span>No adjunto</span>';
    const filaAbono = `<b>Abono a Convenio:</b> <span style="font-weight:bold; color:${colorAbono};">${abonoConvenio.toLocaleString('es-CL', currencyOptions)}</span>`;
    contenido.innerHTML = `<div id="detalle-pago-grid"><b>Residente:</b><span>${pago.Nombre_Residente}</span><b>N° Parcela:</b><span>${pago.N_Parcela}</span><b>Período pagado:</b><span>${formatearPeriodo(pago.Periodo)}</span><hr style="grid-column: 1 / -1;"><b>Valor Gasto Común:</b> <span>${parseCurrency(pago.Valor_Gasto_Comun).toLocaleString('es-CL', currencyOptions)}</span><b>Interés por mora:</b>  <span>${parseCurrency(pago.Interes).toLocaleString('es-CL', currencyOptions)}</span><b>Multa aplicada:</b>    <span>${parseCurrency(pago['Multa_1/4']).toLocaleString('es-CL', currencyOptions)}</span><b style="color:#2a7ca3;">Deuda del Período G.C.:</b> <span style="font-weight:bold; color:#2a7ca3;">${deudaDelPeriodo.toLocaleString('es-CL', currencyOptions)}</span><hr style="grid-column: 1 / -1;"><b>Monto Pagado G.C.:</b><span style="font-weight:bold; color:green;">${montoPagado.toLocaleString('es-CL', currencyOptions)}</span>${filaAbono}<b>Fecha de Pago:</b><span>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'}) : '---'}</span><b>Método de Pago:</b><span>${pago.Metodo_Pago}</span><b>Resultado Saldo G.C.:</b><span style="font-weight:bold; color:${saldoTransaccion < 0 ? 'red' : 'green'};">${saldoFinalTexto}</span><hr style="grid-column: 1 / -1;"><b>Estado del pago:</b><span>${pago.Estado}</span>${filaComprobante}</div>`;
    modal.style.display = 'flex';
  }

  function filtrarYRenderizar() {
    const parcela = document.getElementById('filtroParcela').value;
    const anio = document.getElementById('filtroAnio').value;
    if (parcela && anio) {
        renderizarTablaResidente(parcela, anio);
    } else {
        document.getElementById('widget-convenio').style.display = 'none';
        renderizarTablaGeneral(pagosGC_obj.filter(p => p.anio == anio));
    }
  }

  function renderizarTablaGeneral(pagos) {
    const tabla = document.querySelector('#table-pagos tbody');
    if (!tabla) return;
    document.querySelector('#detalle-gastos h3').textContent = 'Detalle de Pagos Registrados';
    theadGastos.innerHTML = `<tr><th>ID</th><th>Nombre</th><th>Parcela</th><th>Periodo</th><th>Monto Pagado</th><th>Deuda Total</th><th>Fecha Pago</th><th>Método</th><th>Estado</th></tr>`;
    if (!pagos || pagos.length === 0) {
      tabla.innerHTML = '<tr><td colspan="9" style="text-align:center;">No hay registros que coincidan con los filtros.</td></tr>';
      return;
    }
    tabla.innerHTML = pagos.map(p => `<tr data-id-pago="${p.ID_Pago}" class="fila-clicable"><td>${p.ID_Pago}</td><td>${p.Nombre_Residente}</td><td>${p.N_Parcela}</td><td>${formatearPeriodo(p.Periodo)}</td><td>${parseCurrency(p.Monto_Pagado).toLocaleString('es-CL')}</td><td style="color: ${parseCurrency(p.Deuda_Total) > 0 ? 'red' : 'inherit'}">${parseCurrency(p.Deuda_Total).toLocaleString('es-CL')}</td><td>${p.Fecha_Pago ? new Date(p.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'}) : '---'}</td><td>${p.Metodo_Pago || '---'}</td><td><span class="estado-tag estado-${(p.Estado || '').toLowerCase()}">${p.Estado}</span></td></tr>`).join('');
    aplicarAnchosGuardados(document.getElementById('table-pagos'));
    hacerColumnasRedimensionables(document.getElementById('table-pagos'));
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
    if (typeof guardarTIMC !== 'function') { return mostrarMensaje('Error: La función "guardarTIMC" no se encontró en sheets.js.', 'error'); }
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
  document.getElementById('btnAbrirModalGasto').addEventListener('click', () => {
    document.getElementById('formGastoComun').reset();
    document.getElementById('saldo-convenio-info').style.display = 'none';
    document.getElementById('inputAnioPeriodo').value = document.getElementById('filtroAnio').value;
    modal.style.display = 'flex'
  });
  document.getElementById('btnCerrarModal').addEventListener('click', () => modal.style.display = 'none');
  
  document.getElementById('inputNParcela').addEventListener('input', (e) => {
    const parcelaBuscada = e.target.value;
    const nombreInput = document.getElementById('inputNombreResidente');
    const valorInput = document.getElementById('inputValorGastoComun');
    const saldoConvenioInfo = document.getElementById('saldo-convenio-info');
    nombreInput.value = '';
    valorInput.value = '';
    saldoConvenioInfo.style.display = 'none';
    saldoConvenioInfo.textContent = '';
    if (!parcelaBuscada) return;
    const res = residentes.find(r => String(r[3]) === parcelaBuscada && r[9] && r[9].trim().toUpperCase() === 'SI');
    if (res) {
        nombreInput.value = res[1];
        valorInput.value = parseCurrency(res[8]).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
        const saldoConvenio = parseCurrency(res[12]);
        if (saldoConvenio > 0) {
            saldoConvenioInfo.textContent = `Saldo convenio: $${saldoConvenio.toLocaleString('es-CL')}`;
            saldoConvenioInfo.style.display = 'block';
        }
    } else {
        nombreInput.value = 'No se encontró contacto principal';
    }
  });

  const nombreInput = document.getElementById('inputNombreResidente');
  const parcelaInputModal = document.getElementById('inputNParcela');
  const valorGastoComunInput = document.getElementById('inputValorGastoComun');
  const suggestionsContainer = document.getElementById('nombre-suggestions');
  nombreInput.addEventListener('input', () => {
      const searchTerm = nombreInput.value.toLowerCase();
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
      if (searchTerm.length < 2) return;
      const matches = residentes.filter(r => r[1] && r[1].toLowerCase().includes(searchTerm) && r[9] && r[9].trim().toUpperCase() === 'SI');
      if (matches.length > 0) {
          matches.forEach(res => {
              const item = document.createElement('div');
              item.className = 'suggestion-item';
              item.textContent = `${res[1]} (Parcela ${res[3]})`;
              item.addEventListener('click', () => {
                  nombreInput.value = res[1];
                  parcelaInputModal.value = res[3];
                  valorGastoComunInput.value = parseCurrency(res[8]).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
                  const saldoConvenioInfo = document.getElementById('saldo-convenio-info');
                  const saldoConvenio = parseCurrency(res[12]);
                  if (saldoConvenio > 0) {
                      saldoConvenioInfo.textContent = `Saldo convenio: $${saldoConvenio.toLocaleString('es-CL')}`;
                      saldoConvenioInfo.style.display = 'block';
                  } else {
                      saldoConvenioInfo.style.display = 'none';
                  }
                  suggestionsContainer.style.display = 'none';
              });
              suggestionsContainer.appendChild(item);
          });
          suggestionsContainer.style.display = 'block';
      }
  });
  document.addEventListener('click', (e) => {
      if (nombreInput && !nombreInput.contains(e.target)) {
          suggestionsContainer.style.display = 'none';
      }
  });

  document.getElementById('formGastoComun').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarSpinner();
    try {
        const formData = new FormData(e.target);
        const parcela = formData.get('N_Parcela');
        const mesPagadoIndex = parseInt(formData.get('Periodo'));
        const anioSeleccionado = parseInt(formData.get('Anio_Periodo'));
        const periodoNormalizado = formatearPeriodo(`${MESES[mesPagadoIndex]} ${anioSeleccionado}`);

        const pagoExistente = pagosGC_obj.find(p => 
            String(p.N_Parcela) === String(parcela) &&
            formatearPeriodo(p.Periodo) === periodoNormalizado
        );

        const montoPagadoGC = parseCurrency(formData.get('Monto_Pagado'));
        const abonoConvenio = parseCurrency(formData.get('Abono_Convenio') || '0');
        const fechaDePago = formData.get('Fecha_Pago');
        const metodoDePago = formData.get('Metodo_Pago');

        let linkComprobante = pagoExistente ? pagoExistente.ID_Comprobante_Drive : null;
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

        if (pagoExistente) {
            const deudaExistente = parseCurrency(pagoExistente.Valor_Gasto_Comun) + parseCurrency(pagoExistente.Interes) + parseCurrency(pagoExistente['Multa_1/4']);
            const nuevoMontoPagado = parseCurrency(pagoExistente.Monto_Pagado) + montoPagadoGC;
            const saldoTransaccion = nuevoMontoPagado - deudaExistente;
            const nuevoEstado = saldoTransaccion >= 0 ? 'Pagado' : 'Abono';

            const datosActualizacion = {
                rowNum: pagoExistente.rowNum,
                montoPagado: nuevoMontoPagado,
                saldo: saldoTransaccion,
                deudaTotal: saldoTransaccion < 0 ? Math.abs(saldoTransaccion) : 0,
                fechaPago: fechaDePago,
                metodoPago: metodoDePago,
                estado: nuevoEstado,
                idComprobante: linkComprobante,
                abonoConvenio: (parseCurrency(pagoExistente.Abono_Convenio) || 0) + abonoConvenio
            };

            await actualizarPagoGC(datosActualizacion);

        } else {
            const residente = residentes.find(r => String(r[3]) === String(parcela));
            if (!residente) throw new Error("No se encontró residente para la parcela " + parcela);
            const valorGastoComun = parseCurrency(residente[8]);
            const saldoTransaccion = montoPagadoGC - valorGastoComun;
            const nuevoEstado = saldoTransaccion >= 0 ? 'Pagado' : 'Abono';

            const datosParaSheet = [
              "PGC-" + new Date().getTime(), formData.get('Nombre_Residente'), parcela, valorGastoComun, 
              `${MESES[mesPagadoIndex]} ${anioSeleccionado}`, new Date(anioSeleccionado, mesPagadoIndex + 1, 10).toISOString().split('T')[0], 
              montoPagadoGC, saldoTransaccion, 0, null, 0, 0, saldoTransaccion < 0 ? Math.abs(saldoTransaccion) : 0,
              fechaDePago, metodoDePago, nuevoEstado, linkComprobante, abonoConvenio, 'NO'
            ];
            await agregarPagoGC(datosParaSheet);
        }
        
        if (abonoConvenio > 0) {
            const residenteIdx = residentes.findIndex(r => String(r[3]) === String(parcela));
            const residente = residentes[residenteIdx];
            if (typeof actualizarSaldoConvenioEnSheet !== 'function') {
                throw new Error("La función para actualizar el saldo del convenio no está disponible.");
            }
            const deudaInicial = parseCurrency(residente[11]);
            let saldoPrevio = parseCurrency(residente[12]);
            if ((!saldoPrevio || saldoPrevio <= 0) && deudaInicial > 0) saldoPrevio = deudaInicial;
            const nuevoSaldo = saldoPrevio - abonoConvenio;
            await actualizarSaldoConvenioEnSheet(residenteIdx + 2, nuevoSaldo);
            residente[12] = nuevoSaldo;
        }

        const nuevosPagosRaw = await obtenerPagosGC();
        pagosGC_obj = (nuevosPagosRaw || []).map((fila, index) => {
            let obj = {};
            ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; });
            if (obj.Periodo) {
                const anioMatch = String(obj.Periodo).match(/\d{4}/);
                obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
            }
            obj.rowNum = index + 2;
            return obj;
        }).filter(p => p.N_Parcela);

        filtrarYRenderizar();
        modal.style.display = 'none';
        e.target.reset();
        mostrarMensaje('Operación guardada con éxito.', 'success');

    } catch (err) {
        mostrarMensaje('Error al guardar el gasto: ' + err.message, 'error');
    } finally {
        ocultarSpinner();
    }
  });

  const modalComprobante = document.getElementById('modalComprobante');
  const formComprobante = document.getElementById('formEnviarComprobante');
  const inputParcelaComprobante = document.getElementById('inputNParcelaComprobante');
  let pagoSeleccionadoParaEnviar = null;
  
  document.getElementById('btnAbrirModalComprobante').addEventListener('click', () => {
    formComprobante.reset();
    pagoSeleccionadoParaEnviar = null;
    document.getElementById('divCuerpoComprobante').innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span>`;
    document.getElementById('periodo-selector-container').style.display = 'none';
    document.getElementById('selectPeriodoComprobante').innerHTML = '';
    modalComprobante.style.display = 'flex';
  });

  document.getElementById('btnCerrarModalComprobante').addEventListener('click', () => {
    modalComprobante.style.display = 'none';
  });
  
  function crearCuerpoCorreo(pago, residente) {
    const nombreResidente = residente[1];
    const currencyOptions = { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 };
    const periodoFormateado = formatearPeriodo(pago.Periodo);
    const valorGC = parseCurrency(pago.Valor_Gasto_Comun).toLocaleString('es-CL', currencyOptions);
    const interes = parseCurrency(pago.Interes).toLocaleString('es-CL', currencyOptions);
    const multa = parseCurrency(pago['Multa_1/4']).toLocaleString('es-CL', currencyOptions);
    const montoPagado = parseCurrency(pago.Monto_Pagado);
    const saldo = parseCurrency(pago.Saldo_Pendiente_o_a_favor);
    const deudaDelPeriodo = montoPagado - saldo;
    const fechaPago = new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', { timeZone: 'UTC' });
    const abonoConvenio = parseCurrency(pago.Abono_Convenio);
    let saldoTexto;
    if (saldo >= 0) {
      saldoTexto = `Saldo a favor: ${saldo.toLocaleString('es-CL', currencyOptions)}`;
    } else {
      saldoTexto = `Saldo pendiente: ${Math.abs(saldo).toLocaleString('es-CL', currencyOptions)}`;
    }
    let mensajeAdvertencia = '';
    if (pago.Estado === 'Moroso') {
        mensajeAdvertencia = `<p style="font-size: 12px; color: #c00; font-weight: bold;">Le recordamos que, según el reglamento de copropiedad, el saldo pendiente de su Gasto Común continuará generando los intereses y multas correspondientes hasta su pago total.</p>`;
    }
    let filaAbono = '';
    if (abonoConvenio > 0) {
        const saldoConvenioActual = parseCurrency(residente[12]);
        filaAbono = `<tr style="font-weight: bold;"><td style="padding: 8px; border-bottom: 1px solid #ddd;">Abono a Convenio:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${abonoConvenio.toLocaleString('es-CL', currencyOptions)}</td></tr><tr style="font-weight: bold; color: #0d6efd;"><td style="padding: 8px;">Saldo Convenio Restante:</td><td style="padding: 8px; text-align: right;">${saldoConvenioActual.toLocaleString('es-CL', currencyOptions)}</td></tr>`;
    }
    let filaVerComprobante = '';
    if (pago.ID_Comprobante_Drive) {
        filaVerComprobante = `<p style="text-align: center; margin-top: 25px;"><a href="${pago.ID_Comprobante_Drive}" target="_blank" style="display: inline-block; padding: 10px 15px; font-size: 14px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">Ver Comprobante de Pago</a></p>`;
    }
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; font-size: 14px; line-height: 1.6;"><div style="text-align: center; margin-bottom: 20px;"><h2 style="color: #2a7ca3; margin-top: 10px;">Comprobante de Pago</h2></div><p>Estimado(a) <strong>${nombreResidente}</strong>,</p><p>Confirmamos la recepción de su pago, con el siguiente detalle:</p><hr><h3 style="color: #333; margin-top: 20px; margin-bottom: 10px; font-size: 16px;">Resumen de la Transacción</h3><table style="width: 100%; border-collapse: collapse;"><tr><td colspan="2" style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Gasto Común Período ${periodoFormateado}</strong></td></tr><tr><td style="padding: 8px 8px 8px 20px; border-bottom: 1px solid #eee;">Valor Gasto Común:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${valorGC}</td></tr><tr><td style="padding: 8px 8px 8px 20px; border-bottom: 1px solid #eee;">Intereses por mora:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${interes}</td></tr><tr><td style="padding: 8px 8px 8px 20px; border-bottom: 1px solid #eee;">Multas:</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${multa}</td></tr><tr style="font-weight: bold;"><td style="padding: 8px 8px 8px 20px; border-bottom: 1px solid #ddd;">Deuda del Período:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${deudaDelPeriodo.toLocaleString('es-CL', currencyOptions)}</td></tr><tr style="font-weight: bold;"><td style="padding: 8px 8px 8px 20px; border-bottom: 1px solid #ddd;">Monto Pagado a G.C.:</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${montoPagado.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 })}</td></tr><tr style="font-weight: bold; color: ${saldo < 0 ? 'red' : 'green'};"><td style="padding: 8px 8px 8px 20px;">Resultado G.C.:</td><td style="padding: 8px; text-align: right;">${saldoTexto}</td></tr>${filaAbono}</table>${filaVerComprobante}<hr style="margin-top: 25px;">${mensajeAdvertencia}<p>Gracias por su compromiso con la comunidad.</p><p>Se despide Atentamente,<br><strong>Alex Thiele</strong><br>Administrador Condominio Los Molles</p></div>`;
  }
  
  inputParcelaComprobante.addEventListener('input', (e) => {
    const parcela = e.target.value;
    const selectorContainer = document.getElementById('periodo-selector-container');
    const selector = document.getElementById('selectPeriodoComprobante');
    const nombreInput = document.getElementById('inputNombreResidenteComprobante');
    const emailInput = document.getElementById('inputEmailComprobante');
    const asuntoInput = document.getElementById('inputAsuntoComprobante');
    const cuerpoDiv = document.getElementById('divCuerpoComprobante');
    nombreInput.value = ''; emailInput.value = ''; asuntoInput.value = '';
    cuerpoDiv.innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela...</span>`;
    selectorContainer.style.display = 'none'; selector.innerHTML = '';
    pagoSeleccionadoParaEnviar = null;
    if (!parcela) return;
    const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela));
    if (allResidentsForParcela.length === 0) { nombreInput.value = 'Residente no encontrado.'; return; }
    const residentNames = allResidentsForParcela.map(r => r[1]).join(' y ');
    const residentEmails = allResidentsForParcela.map(r => r[5]).filter(Boolean).join(', ');
    nombreInput.value = residentNames;
    emailInput.value = residentEmails || 'No registrado';
    const pagosDeLaParcela = pagosGC_obj.filter(p => p.N_Parcela == parcela && p.Fecha_Pago).sort((a, b) => new Date(b.Fecha_Pago) - new Date(a.Fecha_Pago));
    if (pagosDeLaParcela.length === 0) { cuerpoDiv.innerHTML = `<span style="color: #dc3545;">No se encontraron pagos registrados para esta parcela.</span>`; return; }
    const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0];
    const aEnviar = {...representativeResident};
    aEnviar[1] = residentNames;
    function generarVistaPrevia(pago) {
        pagoSeleccionadoParaEnviar = pago;
        const periodoFormateado = formatearPeriodo(pago.Periodo);
        asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`;
        cuerpoDiv.innerHTML = crearCuerpoCorreo(pago, aEnviar);
    }
    if (pagosDeLaParcela.length === 1) {
        generarVistaPrevia(pagosDeLaParcela[0]);
    } else {
        selectorContainer.style.display = 'block';
        selector.innerHTML = '<option value="">-- Seleccione un comprobante --</option>';
        pagosDeLaParcela.forEach(pago => {
            const fechaPagoFmt = new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', { timeZone: 'UTC' });
            const option = document.createElement('option');
            option.value = pago.ID_Pago;
            option.textContent = `${formatearPeriodo(pago.Periodo)} (Pagado el ${fechaPagoFmt})`;
            selector.appendChild(option);
        });
    }
  });

  document.getElementById('selectPeriodoComprobante').addEventListener('change', (e) => {
      const pagoId = e.target.value;
      pagoSeleccionadoParaEnviar = null;
      const parcela = document.getElementById('inputNParcelaComprobante').value;
      const asuntoInput = document.getElementById('inputAsuntoComprobante');
      const cuerpoDiv = document.getElementById('divCuerpoComprobante');
      if (!pagoId) {
          asuntoInput.value = '';
          cuerpoDiv.innerHTML = `<span style="color: #6c757d;">Seleccione un período para generar la previsualización.</span>`;
          return;
      }
      const pagoSeleccionado = pagosGC_obj.find(p => p.ID_Pago == pagoId);
      pagoSeleccionadoParaEnviar = pagoSeleccionado;
      const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela));
      const residentNames = allResidentsForParcela.map(r => r[1]).join(' y ');
      const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0];
      const aEnviar = {...representativeResident};
      aEnviar[1] = residentNames;
      const periodoFormateado = formatearPeriodo(pagoSeleccionado.Periodo);
      asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`;
      cuerpoDiv.innerHTML = crearCuerpoCorreo(pagoSeleccionado, aEnviar);
  });

  formComprobante.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pagoSeleccionadoParaEnviar) { return mostrarMensaje('Debe seleccionar un comprobante para enviar.', 'error'); }
    const destinatario = document.getElementById('inputEmailComprobante').value;
    if (!destinatario) { return mostrarMensaje('El residente no tiene un correo electrónico registrado.', 'error'); }
    mostrarSpinner();
    try {
      const asunto = document.getElementById('inputAsuntoComprobante').value;
      const cuerpo = document.getElementById('divCuerpoComprobante').innerHTML;
      await enviarCorreo(destinatario, asunto, cuerpo);
      await marcarComprobanteEnviado(pagoSeleccionadoParaEnviar.rowNum);
      pagoSeleccionadoParaEnviar.Comprobante_Enviado = 'SI';
      modalComprobante.style.display = 'none';
      mostrarMensaje(`Correo enviado con éxito a ${destinatario}.`, 'success');
      filtrarYRenderizar();
    } catch (err) {
        console.error("Error completo en el proceso de envío:", err);
        let errorMessage = "Ocurrió un error inesperado.";
        if (err && err.result && err.result.error && err.result.error.message) { errorMessage = err.result.error.message; }
        else if (err && err.message) { errorMessage = err.message; }
        else if (typeof err === 'string') { errorMessage = err; }
        mostrarMensaje(`Error al enviar el correo: ${errorMessage}`, 'error');
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
