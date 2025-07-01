// js/gastos_comunes.js

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado',
    'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado', 'Descripcion_Deuda',
    'Descripcion_Pago', 'Saldo_Favor_Usado' // MODIFICADO: Añadidas nuevas columnas
];

function formatearPeriodo(periodo) {
  if (!periodo) return 'N/A';
  const matchAnio = periodo.toString().match(/\d{4}/);
  const anio = matchAnio ? parseInt(matchAnio[0]) : null;
  const matchMes = MESES.findIndex(m => periodo.toLowerCase().includes(m.toLowerCase()));

  if (anio && matchMes !== -1) {
    return `${MESES[matchMes]} ${anio}`;
  }
  
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
            const anioMatch = obj.Periodo.toString().match(/\d{4}/);
            obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
        }
        obj.rowNum = index + 2; // Guardamos el número de fila original en la hoja
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
      .saldo-info { padding: 10px; border-radius: 5px; margin-top: 5px; font-weight: bold; text-align: center; }
      .saldo-convenio { background-color: #fff8e1; color: #f57f17; }
      .saldo-favor { background-color: #e8f5e9; color: #2e7d32; }
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
       <div style="margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
  <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
  <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
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
    
    <div id="modalGC" class="modal" style="display:none;">
      <div class="widget" style="max-width: 750px; width: 95%; max-height: 90vh; overflow-y: auto;">
        <h3>Agregar Gasto Común</h3>
        <form id="formGastoComun">
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 280px;">
              <label>N° Parcela</label>
              <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
              
              <div style="position: relative;">
                <label>Nombre Residente</label>
                <input type="text" name="Nombre_Residente" id="inputNombreResidente" autocomplete="off" required>
                <div id="nombre-suggestions" style="display: none; position: absolute; background-color: white; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; width: 100%; z-index: 10;"></div>
              </div>

              <label>Valor Gasto Común</label>
              <input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;">

              <div id="saldo-convenio-info" class="saldo-info saldo-convenio" style="display:none;"></div>
              <div id="saldo-favor-info" class="saldo-info saldo-favor" style="display:none;"></div>

              <div style="display:flex; gap: 15px;">
                <div style="flex: 1;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div>
                <div style="flex: 1;"><label>Año que Paga</label><input type="number" name="Anio_Periodo" id="inputAnioPeriodo" required></div>
              </div>
            </div>

            <div style="flex: 1; min-width: 280px; border-left: 1px solid #ddd; padding-left: 20px;">
              <label>Fecha de Pago</label>
              <input type="date" name="Fecha_Pago" required>
              
              <label>Monto Pagado G.C. (depósito/efectivo)</label>
              <input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP" value="0">
              
              <label>Usar Saldo a Favor</label>
              <input type="number" name="Saldo_Favor_Usado" min="0" step="1" placeholder="CLP" value="0">
              
              <label>Abono a Convenio (CLP)</label>
              <input type="number" name="Abono_Convenio" min="0" step="1" placeholder="CLP" value="0">

              <label>Método de Pago</label>
              <select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select>
            </div>
          </div>
          
          <div style="width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
            <label>Descripción / Nota del Pago (Opcional)</label>
            <textarea name="Descripcion_Pago" rows="2" placeholder="Ej: Pago parcial, solicitud de uso de saldo a favor, etc."></textarea>
            
            <label style="margin-top:15px;">Adjuntar Comprobante (Opcional)</label>
            <input type="file" name="Comprobante" accept=".pdf,.jpg,.jpeg,.png">
          </div>

          <div style="text-align: right; margin-top: 20px;">
            <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
            <button class="btn" type="submit">Guardar Gasto</button>
          </div>
        </form>
      </div>
    </div>
    
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

  function renderizarTablaGeneral(datos) {
    document.getElementById('widget-convenio').style.display = 'none';
    document.querySelector('#detalle-gastos h3').textContent = 'Detalle de Pagos Registrados';
    theadGastos.innerHTML = `<tr><th>Residente</th><th>Parcela</th><th>Período</th><th>Monto Pagado G.C.</th><th>Abono Convenio</th><th>Deuda Pendiente G.C.</th><th>Fecha Pago</th><th>Estado</th><th>Comprobante</th></tr>`;
    tbodyGastos.innerHTML = '';
    if (!datos || datos.length === 0) { tbodyGastos.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">No hay registros para el año seleccionado.</td></tr>`; return; }
    datos.sort((a,b) => (b.Fecha_Pago ? new Date(b.Fecha_Pago) : 0) - (a.Fecha_Pago ? new Date(a.Fecha_Pago) : 0));
    datos.forEach(pago => {
        const estadoClass = (pago.Estado || 'pendiente').toLowerCase().trim().replace(' ', '-');
        const tr = document.createElement('tr');
        tr.dataset.idPago = pago.ID_Pago;
        tr.classList.add('fila-clicable');
        const abonoConvenio = parseFloat(pago.Abono_Convenio || 0);
        const comprobanteEnviado = pago.Comprobante_Enviado === 'SI' ? '<span class="comprobante-enviado">✓</span>' : '';

        tr.innerHTML = `
            <td>${pago.Nombre_Residente || 'N/A'}</td>
            <td>${pago.N_Parcela}</td>
            <td>${formatearPeriodo(pago.Periodo) || 'N/A'}</td>
            <td>$${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
            <td>$${abonoConvenio.toLocaleString('es-CL')}</td>
            <td style="font-weight:bold; color: red;">$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}</td>
            <td>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'}) : '---'}</td>
            <td><span class="estado-tag estado-${estadoClass}">${pago.Estado || 'Pendiente'}</span></td>
            <td>${comprobanteEnviado}</td>`;
        tbodyGastos.appendChild(tr);
    });
    const tabla = document.getElementById('table-pagos');
    aplicarAnchosGuardados(tabla);
    hacerColumnasRedimensionables(tabla);
  }
  
  function renderizarTablaResidente(parcela, anio) {
    const residente = residentes.find(r => String(r[3]) === String(parcela));
    if (!residente) { 
        document.getElementById('widget-convenio').style.display = 'none';
        tbodyGastos.innerHTML = `<tr><td colspan="10">No se encontró residente.</td></tr>`; 
        return; 
    }

    const widgetConvenio = document.getElementById('widget-convenio');
    const deudaInicialConvenio = parseFloat(residente[11] || 0);

    if (deudaInicialConvenio > 0) {
        widgetConvenio.style.display = 'block';
        const totalAbonado = pagosGC_obj
    .filter(p => String(p.N_Parcela) === String(parcela))
    .reduce((sum, pago) => sum + parseFloat(pago.Abono_Convenio || 0), 0);

const saldoActualConvenio = deudaInicialConvenio - totalAbonado;

        document.getElementById('convenio-summary-grid').innerHTML = `
            <div>Deuda Inicial<span style="color: #dc3545;">$${deudaInicialConvenio.toLocaleString('es-CL')}</span></div>
            <div>Total Abonado<span style="color: #198754;">$${totalAbonado.toLocaleString('es-CL')}</span></div>
            <div>Saldo Pendiente<span style="color: #ffc107;">$${saldoActualConvenio.toLocaleString('es-CL')}</span></div>
        `;

        const abonosDelAnio = pagosGC_obj.filter(p => String(p.N_Parcela) === String(parcela) && p.anio == anio && parseFloat(p.Abono_Convenio || 0) > 0);
        const theadAbonos = document.getElementById('thead-abonos');
        const tbodyAbonos = document.getElementById('tbody-abonos');
        theadAbonos.innerHTML = `<tr><th>Fecha de Pago</th><th>Monto Abonado</th><th>Comprobante</th></tr>`;
        tbodyAbonos.innerHTML = '';
        if(abonosDelAnio.length > 0) {
            abonosDelAnio.forEach(abono => {
                const linkComprobante = abono.ID_Comprobante_Drive ? `<a href="${abono.ID_Comprobante_Drive}" target="_blank" class="btn small">Ver</a>` : 'N/A';
                tbodyAbonos.innerHTML += `
                    <tr>
                        <td>${new Date(abono.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'})}</td>
                        <td>$${parseFloat(abono.Abono_Convenio).toLocaleString('es-CL')}</td>
                        <td>${linkComprobante}</td>
                    </tr>
                `;
            });
        } else {
            tbodyAbonos.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay abonos a convenio registrados para este año.</td></tr>`;
        }
    } else {
        widgetConvenio.style.display = 'none';
    }

    document.querySelector('#detalle-gastos h3').textContent = `Detalle Anual de Gastos Comunes para ${residente[1]} (Parcela ${parcela})`;
    theadGastos.innerHTML = `<tr><th>Período</th><th>Fecha Vencimiento</th><th>Monto Pagado</th><th>Saldo Transacción</th><th>Interés</th><th>Multa</th><th>Deuda Pendiente</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th></tr>`;

    tbodyGastos.innerHTML = '';
    
    MESES.forEach((mes, index) => {
        const pagoExistente = pagosGC_obj.find(p => String(p.N_Parcela) === String(parcela) && p.Periodo && formatearPeriodo(p.Periodo).toLowerCase().startsWith(mes.toLowerCase()) && p.anio == anio);
        
        let interes = 0, multa = 0, saldo = 0;
        let estado = 'Pendiente', montoPagado = 0, fechaPago = '---', metodoPago = '---';
        let deudaPendiente = 0;
        
        const fechaVencimiento = new Date(anio, index, 10);

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
        }

        const tr = document.createElement('tr');
        if (pagoExistente) {
            tr.dataset.idPago = pagoExistente.ID_Pago;
            tr.classList.add('fila-clicable');
        }
        const estadoClass = estado.toLowerCase().replace(' ', '-');
        tr.innerHTML = `
            <td><b>${mes} ${anio}</b></td>
            <td>${fechaVencimiento.toLocaleDateString('es-CL', {timeZone: 'UTC'})}</td>
            <td>$${montoPagado.toLocaleString('es-CL')}</td>
            <td style="color:${saldo < 0 ? 'red' : 'green'}; font-weight:bold;">$${saldo.toLocaleString('es-CL')}</td>
            <td>$${interes.toLocaleString('es-CL', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td>$${multa.toLocaleString('es-CL')}</td>
            <td style="font-weight:bold; color: red;">$${deudaPendiente.toLocaleString('es-CL')}</td>
            <td>${fechaPago}</td>
            <td>${metodoPago}</td>
            <td><span class="estado-tag estado-${estadoClass}">${estado}</span></td>`;
        tbodyGastos.appendChild(tr);
    });
    const tabla = document.getElementById('table-pagos');
    aplicarAnchosGuardados(tabla);
    hacerColumnasRedimensionables(tabla);
  }

  function abrirModalDetalle(idPago) {
    const pago = pagosGC_obj.find(p => p.ID_Pago == idPago);
    if (!pago) {
        mostrarMensaje('No se encontró el registro del pago.', 'error');
        return;
    }

    const modal = document.getElementById('modalDetallePago');
    const contenido = document.getElementById('contenidoDetallePago');

    const montoPagadoGC = parseFloat(pago.Monto_Pagado || 0);
    const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0);
    const montoTotalAbonadoGC = montoPagadoGC + saldoFavorUsado;
    const saldoTransaccion = parseFloat(pago.Saldo_Pendiente_o_a_favor || 0);
    const deudaDelPeriodo = montoTotalAbonadoGC - saldoTransaccion;
    const saldoFinalTexto = saldoTransaccion >= 0 ? `A favor: $${saldoTransaccion.toLocaleString('es-CL')}` : `Pendiente: $${Math.abs(saldoTransaccion).toLocaleString('es-CL')}`;
    const abonoConvenio = parseFloat(pago.Abono_Convenio || 0);
    const colorAbono = abonoConvenio > 0 ? 'darkblue' : '#555';
    const descripcionPago = pago.Descripcion_Pago || 'Sin descripción.';

    let filaComprobante = pago.ID_Comprobante_Drive 
        ? `<b>Comprobante:</b> <span><a href="${pago.ID_Comprobante_Drive}" target="_blank" class="btn small">Ver Documento</a></span>`
        : '<b>Comprobante:</b> <span>No adjunto</span>';

    contenido.innerHTML = `
        <div id="detalle-pago-grid">
            <b>Residente:</b>       <span>${pago.Nombre_Residente}</span>
            <b>N° Parcela:</b>      <span>${pago.N_Parcela}</span>
            <b>Período pagado:</b>  <span>${formatearPeriodo(pago.Periodo)}</span>
            <hr style="grid-column: 1 / -1;">
            <b style="color:#2a7ca3;">Deuda del Período G.C.:</b> <span style="font-weight:bold; color:#2a7ca3;">$${deudaDelPeriodo.toLocaleString('es-CL')}</span>
            <hr style="grid-column: 1 / -1;">
            <b>Monto Pagado (transferencia/efectivo):</b> <span style="font-weight:bold; color:green;">$${montoPagadoGC.toLocaleString('es-CL')}</span>
            <b>Saldo a Favor Utilizado:</b> <span style="font-weight:bold; color:purple;">$${saldoFavorUsado.toLocaleString('es-CL')}</span>
            <b>Abono a Convenio:</b> <span style="font-weight:bold; color:${colorAbono};">$${abonoConvenio.toLocaleString('es-CL')}</span>
            <b>Fecha de Pago:</b>     <span>${new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'})}</span>
            <b>Método de Pago:</b>    <span>${pago.Metodo_Pago}</span>
            <b style="font-size:1.1em;">Resultado Saldo G.C.:</b> <span style="font-weight:bold; font-size:1.1em; color:${saldoTransaccion < 0 ? 'red' : 'green'};">${saldoFinalTexto}</span>
            <hr style="grid-column: 1 / -1;">
            <b>Estado del pago:</b>   <span>${pago.Estado}</span>
            ${filaComprobante}
            <b>Descripción:</b> <span style="white-space: pre-wrap;">${descripcionPago}</span>
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
        document.getElementById('widget-convenio').style.display = 'none';
        renderizarTablaGeneral(pagosGC_obj.filter(p => p.anio == anio));
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
  document.getElementById('btnAbrirModalGasto').addEventListener('click', () => {
    document.getElementById('formGastoComun').reset();
    document.getElementById('saldo-convenio-info').style.display = 'none';
    document.getElementById('saldo-favor-info').style.display = 'none';
    document.getElementById('inputAnioPeriodo').value = document.getElementById('filtroAnio').value;
    modal.style.display = 'flex'
  });
  document.getElementById('btnCerrarModal').addEventListener('click', () => modal.style.display = 'none');
  
  // MODIFICADO: Lógica para mostrar también el saldo a favor
  document.getElementById('inputNParcela').addEventListener('input', (e) => {
    const parcelaBuscada = e.target.value;
    const nombreInput = document.getElementById('inputNombreResidente');
    const valorInput = document.getElementById('inputValorGastoComun');
    const saldoConvenioInfo = document.getElementById('saldo-convenio-info');
    const saldoFavorInfo = document.getElementById('saldo-favor-info');

    nombreInput.value = '';
    valorInput.value = '';
    saldoConvenioInfo.style.display = 'none';
    saldoFavorInfo.style.display = 'none';

    if (!parcelaBuscada) return;
    
    const res = residentes.find(r => String(r[3]) === parcelaBuscada && r[9] && r[9].trim().toUpperCase() === 'SI');

    if (res) {
        nombreInput.value = res[1];
        valorInput.value = parseFloat(res[8]).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
        
        const saldoConvenio = res[12] ? parseFloat(res[12]) : 0;
        if (saldoConvenio > 0) {
            saldoConvenioInfo.textContent = `Saldo convenio: $${saldoConvenio.toLocaleString('es-CL')}`;
            saldoConvenioInfo.style.display = 'block';
        }

        // NUEVO: Mostrar saldo a favor (Columna N, índice 13)
        const saldoFavor = res[13] ? parseFloat(res[13]) : 0;
        if (saldoFavor > 0) {
            saldoFavorInfo.textContent = `Saldo a favor: $${saldoFavor.toLocaleString('es-CL')}`;
            saldoFavorInfo.style.display = 'block';
        }

    } else {
        nombreInput.value = 'No se encontró contacto principal';
    }
  });

  const nombreInput = document.getElementById('inputNombreResidente');
  const suggestionsContainer = document.getElementById('nombre-suggestions');

  nombreInput.addEventListener('input', () => {
      const searchTerm = nombreInput.value.toLowerCase();
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';

      if (searchTerm.length < 2) return;
      
      const matches = residentes.filter(r => 
          r[1] && r[1].toLowerCase().includes(searchTerm) && r[9] && r[9].trim().toUpperCase() === 'SI'
      );

      if (matches.length > 0) {
          matches.forEach(res => {
              const item = document.createElement('div');
              item.className = 'suggestion-item';
              item.textContent = `${res[1]} (Parcela ${res[3]})`;
              item.addEventListener('click', () => {
                  document.getElementById('inputNParcela').value = res[3];
                  document.getElementById('inputNombreResidente').value = res[1];
                  document.getElementById('inputValorGastoComun').value = parseFloat(res[8]).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
                  
                  const saldoConvenioInfo = document.getElementById('saldo-convenio-info');
                  const saldoFavorInfo = document.getElementById('saldo-favor-info');

                  const saldoConvenio = res[12] ? parseFloat(res[12]) : 0;
                  if (saldoConvenio > 0) {
                      saldoConvenioInfo.textContent = `Saldo convenio: $${saldoConvenio.toLocaleString('es-CL')}`;
                      saldoConvenioInfo.style.display = 'block';
                  } else {
                      saldoConvenioInfo.style.display = 'none';
                  }

                  const saldoFavor = res[13] ? parseFloat(res[13]) : 0;
                  if (saldoFavor > 0) {
                      saldoFavorInfo.textContent = `Saldo a favor: $${saldoFavor.toLocaleString('es-CL')}`;
                      saldoFavorInfo.style.display = 'block';
                  } else {
                      saldoFavorInfo.style.display = 'none';
                  }

                  suggestionsContainer.style.display = 'none';
              });
              suggestionsContainer.appendChild(item);
          });
          suggestionsContainer.style.display = 'block';
      }
  });
  
  document.addEventListener('click', (e) => {
      if (!nombreInput.contains(e.target)) {
          suggestionsContainer.style.display = 'none';
      }
  });

  // =====================================================================================
  // ===== INICIO DE LA MODIFICACIÓN: Lógica para AGREGAR/ACTUALIZAR pago con SALDO A FAVOR =====
  // =====================================================================================
  document.getElementById('formGastoComun').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarSpinner();

    try {
        const formData = new FormData(e.target);
        const parcela = formData.get('N_Parcela');
        const residenteIdx = residentes.findIndex(r => String(r[3]) === String(parcela) && r[9] && r[9].trim().toUpperCase() === 'SI');

        if (residenteIdx === -1) throw new Error("No se encontró un 'Contacto Principal' para la parcela.");
        
        const residente = residentes[residenteIdx];
        const residenteRowInSheet = residenteIdx + 2; // Fila real en la hoja Residentes
        const valorGastoComun = parseFloat(residente[8]);
        const saldoFavorActual = parseFloat(residente[13] || 0);

        const mesPagadoIndex = parseInt(formData.get('Periodo'));
        const anioSeleccionado = parseInt(formData.get('Anio_Periodo'));
        const periodoStr = `${MESES[mesPagadoIndex]} ${anioSeleccionado}`;
        const periodoNormalizado = periodoStr.trim().toLowerCase();

        const pagoExistente = pagosGC_obj.find(p => 
            String(p.N_Parcela) === String(parcela) &&
            p.Periodo &&
            formatearPeriodo(p.Periodo).trim().toLowerCase() === periodoNormalizado
        );

        const montoPagadoGC = parseFloat(formData.get('Monto_Pagado') || 0);
        const abonoConvenio = parseFloat(formData.get('Abono_Convenio') || 0);
        const saldoFavorUsado = parseFloat(formData.get('Saldo_Favor_Usado') || 0);
        const fechaDePago = formData.get('Fecha_Pago');
        const metodoPago = formData.get('Metodo_Pago');
        const descripcionPago = formData.get('Descripcion_Pago');

        if (saldoFavorUsado > saldoFavorActual) {
            throw new Error(`No se puede usar más saldo a favor ($${saldoFavorUsado.toLocaleString('es-CL')}) del que está disponible ($${saldoFavorActual.toLocaleString('es-CL')}).`);
        }

        const montoEfectivoTotalPagadoGC = montoPagadoGC + saldoFavorUsado;
        
        let linkComprobante = null;
        const archivo = formData.get('Comprobante');
        if (archivo && archivo.size > 0) {
            const nombreCarpeta = `Parcela ${parcela}`;
            const mesStr = MESES[new Date(fechaDePago.replace(/-/g,'/')).getUTCMonth()];
            const anioStr = new Date(fechaDePago.replace(/-/g,'/')).getUTCFullYear();
            const carpetaId = await buscarOCrearRutaDeComprobantes(nombreCarpeta, mesStr, anioStr);
            const resultadoSubida = await subirComprobante(archivo, carpetaId);
            linkComprobante = resultadoSubida.webViewLink;
        }

        let nuevoSaldoAFavorResidente;

        if (pagoExistente) {
            const deudaDelPeriodo = parseFloat(pagoExistente.Interes || 0) + parseFloat(pagoExistente['Multa_1/4'] || 0) + valorGastoComun;
            const saldoTransaccion = montoEfectivoTotalPagadoGC - deudaDelPeriodo;
            const estadoPago = saldoTransaccion >= 0 ? 'Pagado' : 'Moroso';
            const deudaPendienteParaSheet = saldoTransaccion < 0 ? -saldoTransaccion : 0;
            
            // Si hay un sobrepago en esta transacción, se suma al saldo a favor del residente
            const sobrepago = saldoTransaccion > 0 ? saldoTransaccion : 0;
            nuevoSaldoAFavorResidente = saldoFavorActual - saldoFavorUsado + sobrepago;

            const datosParaActualizar = {
                rowNum: pagoExistente.rowNum,
                montoPagado: montoPagadoGC,
                saldo: saldoTransaccion,
                deudaTotal: deudaPendienteParaSheet,
                fechaPago: fechaDePago,
                metodoPago: metodoPago,
                estado: estadoPago,
                idComprobante: linkComprobante || pagoExistente.ID_Comprobante_Drive,
                abonoConvenio: abonoConvenio,
                descripcionPago: descripcionPago,
                saldoFavorUsado: saldoFavorUsado,
            };

            await actualizarPagoGC(datosParaActualizar);
            // Actualizar el objeto local para reflejar el cambio inmediatamente
            Object.assign(pagoExistente, {
                'Monto_Pagado': montoPagadoGC, 'Saldo_Pendiente_o_a_favor': saldoTransaccion, 'Deuda_Total': deudaPendienteParaSheet,
                'Fecha_Pago': fechaDePago, 'Metodo_Pago': metodoPago, 'Estado': estadoPago,
                'ID_Comprobante_Drive': datosParaActualizar.idComprobante, 'Abono_Convenio': abonoConvenio,
                'Descripcion_Pago': descripcionPago, 'Saldo_Favor_Usado': saldoFavorUsado
            });
            mostrarMensaje('Pago existente actualizado con éxito.', 'success');

        } else {
            const fechaVencimiento = new Date(anioSeleccionado, mesPagadoIndex, 10);
            const fechaDePagoDate = new Date(fechaDePago.replace(/-/g, '/'));
            
            let deudaDelPeriodo = valorGastoComun;
            let interes = 0, multa = 0, mesesImpagos = 0;

            if (fechaDePagoDate > fechaVencimiento) {
                let tempVenc = new Date(fechaVencimiento);
                while(tempVenc < fechaDePagoDate) { mesesImpagos++; tempVenc.setMonth(tempVenc.getMonth() + 1); }
                if (mesesImpagos > 0) {
                    const timcAnual = (timcData[anioSeleccionado] && timcData[anioSeleccionado][mesPagadoIndex + 1]) ? timcData[anioSeleccionado][mesPagadoIndex + 1] : 0;
                    interes = valorGastoComun * (timcAnual / 100) / 12;
                    multa = (valorGastoComun / 4) * mesesImpagos;
                    deudaDelPeriodo += interes + multa;
                }
            }

            const saldoTransaccion = montoEfectivoTotalPagadoGC - deudaDelPeriodo;
            const estadoPago = saldoTransaccion >= 0 ? 'Pagado' : 'Moroso';
            const deudaPendienteParaSheet = saldoTransaccion < 0 ? -saldoTransaccion : 0;
            
            const sobrepago = saldoTransaccion > 0 ? saldoTransaccion : 0;
            nuevoSaldoAFavorResidente = saldoFavorActual - saldoFavorUsado + sobrepago;
            
            const datosParaSheet = [
              null, formData.get('Nombre_Residente'), parcela, valorGastoComun, periodoStr,
              fechaVencimiento.toISOString().split('T')[0], montoPagadoGC, saldoTransaccion, interes, null,
              multa, mesesImpagos, deudaPendienteParaSheet, fechaDePago, metodoPago,
              estadoPago, linkComprobante, abonoConvenio, 'NO', `Gasto Común ${periodoStr}`,
              descripcionPago, saldoFavorUsado
            ];
            
            await agregarPagoGC(datosParaSheet);
            
            // Reflejar el nuevo pago en la data local
            const nuevoPagoObj = {};
            ENCABEZADOS_PAGOS.forEach((encabezado, i) => nuevoPagoObj[encabezado] = datosParaSheet[i]);
            nuevoPagoObj.anio = anioSeleccionado;
            nuevoPagoObj.rowNum = pagosGC_obj.length + 2; // Estimación, la recarga es más segura
            pagosGC_obj.push(nuevoPagoObj);
            mostrarMensaje('Gasto común nuevo registrado con éxito.', 'success');
        }
        
        // Actualizar el saldo a favor del residente en la hoja de Residentes
        await actualizarSaldoFavorResidente(residenteRowInSheet, nuevoSaldoAFavorResidente);
        residente[13] = nuevoSaldoAFavorResidente.toString(); // Actualizar objeto local

        // Actualizar saldo convenio si hubo abono
        if (abonoConvenio > 0) {
            const deudaInicial = parseFloat(residente[11] || 0);
            let saldoPrevio = residente[12] ? parseFloat(residente[12]) : 0;
            if ((!saldoPrevio || saldoPrevio <= 0) && deudaInicial > 0) saldoPrevio = deudaInicial;
            const nuevoSaldo = saldoPrevio - abonoConvenio;
            await actualizarSaldoConvenioEnSheet(residenteRowInSheet, nuevoSaldo);
            residente[12] = nuevoSaldo.toString(); // Actualizar objeto local
        }

        filtrarYRenderizar();
        modal.style.display = 'none';
        e.target.reset();

    } catch (err) {
        mostrarMensaje('Error al procesar el pago: ' + err.message, 'error');
    } finally {
        ocultarSpinner();
    }
  });
  // =====================================================================================
  // ===== FIN DE LA MODIFICACIÓN =====
  // =====================================================================================

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
    const periodoFormateado = formatearPeriodo(pago.Periodo);
    const montoPagado = parseFloat(pago.Monto_Pagado || 0);
    const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0);
    const montoTotalAbonadoGC = montoPagado + saldoFavorUsado;
    const saldoTransaccion = parseFloat(pago.Saldo_Pendiente_o_a_favor || 0);
    const deudaDelPeriodo = montoTotalAbonadoGC - saldoTransaccion;

    let saldoTexto, saldoColor;
    if (saldoTransaccion >= 0) {
      saldoTexto = `Saldo a favor: $${saldoTransaccion.toLocaleString('es-CL')}`;
      saldoColor = 'green';
    } else {
      saldoTexto = `Saldo pendiente: $${Math.abs(saldoTransaccion).toLocaleString('es-CL')}`;
      saldoColor = 'red';
    }
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #2a7ca3;">Comprobante de Pago - Condominio Los Molles</h2>
        <p>Estimado(a) <strong>${nombreResidente}</strong>,</p>
        <p>Confirmamos la recepción de su pago para el período <strong>${periodoFormateado}</strong>. A continuación el detalle:</p>
        <hr>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px;">Deuda del Período (G.C. + Intereses/Multas):</td><td style="padding: 5px; text-align: right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr>
          <tr><td style="padding: 5px;">Monto Pagado (transferencia/efectivo):</td><td style="padding: 5px; text-align: right;">$${montoPagado.toLocaleString('es-CL')}</td></tr>
          <tr><td style="padding: 5px;">Saldo a Favor Utilizado:</td><td style="padding: 5px; text-align: right;">$${saldoFavorUsado.toLocaleString('es-CL')}</td></tr>
          <tr style="font-weight: bold;"><td style="padding: 5px; border-top: 1px solid #eee;">Total Abonado al Período:</td><td style="padding: 5px; text-align: right; border-top: 1px solid #eee;">$${montoTotalAbonadoGC.toLocaleString('es-CL')}</td></tr>
          <tr style="font-weight: bold; color: ${saldoColor}; border-top: 1px solid #ccc;"><td style="padding: 5px;">Resultado de la Transacción:</td><td style="padding: 5px; text-align: right;">${saldoTexto}</td></tr>
        </table>
        <hr>
        <p>Gracias por su compromiso.</p>
        <p>Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p>
      </div>`;
  }
  
  inputParcelaComprobante.addEventListener('input', (e) => {
    const parcela = e.target.value;
    const selectorContainer = document.getElementById('periodo-selector-container');
    const selector = document.getElementById('selectPeriodoComprobante');
    const nombreInput = document.getElementById('inputNombreResidenteComprobante');
    const emailInput = document.getElementById('inputEmailComprobante');
    const asuntoInput = document.getElementById('inputAsuntoComprobante');
    const cuerpoDiv = document.getElementById('divCuerpoComprobante');

    nombreInput.value = '';
    emailInput.value = '';
    asuntoInput.value = '';
    cuerpoDiv.innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela...</span>`;
    selectorContainer.style.display = 'none';
    selector.innerHTML = '';
    pagoSeleccionadoParaEnviar = null;

    if (!parcela) return;
    
    const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela));
    if (allResidentsForParcela.length === 0) {
        nombreInput.value = 'Residente no encontrado.';
        return;
    }
    
    const residentNames = allResidentsForParcela.map(r => r[1]).join(' y ');
    const residentEmails = allResidentsForParcela.map(r => r[5]).filter(Boolean).join(', ');
    nombreInput.value = residentNames;
    emailInput.value = residentEmails || 'No registrado';

    const pagosDeLaParcela = pagosGC_obj
      .filter(p => p.N_Parcela == parcela && p.Fecha_Pago)
      .sort((a, b) => new Date(b.Fecha_Pago) - new Date(a.Fecha_Pago));

    if (pagosDeLaParcela.length === 0) {
        cuerpoDiv.innerHTML = `<span style="color: #dc3545;">No se encontraron pagos registrados para esta parcela.</span>`;
        return;
    }
    
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
    if (!pagoSeleccionadoParaEnviar) {
        return mostrarMensaje('Debe seleccionar un comprobante para enviar.', 'error');
    }

    const destinatario = document.getElementById('inputEmailComprobante').value;
    if (!destinatario) {
        return mostrarMensaje('El residente no tiene un correo electrónico registrado.', 'error');
    }
    
    mostrarSpinner();
    try {
      const asunto = document.getElementById('inputAsuntoComprobante').value;
      const cuerpo = document.getElementById('divCuerpoComprobante').innerHTML;
      
      await enviarCorreo(destinatario, asunto, cuerpo);
      
      // Idealmente, esto debería llamar a una función en sheets.js para actualizar la hoja
      // await marcarComprobanteEnviado(pagoSeleccionadoParaEnviar.rowNum);
      pagoSeleccionadoParaEnviar.Comprobante_Enviado = 'SI';
      
      modalComprobante.style.display = 'none';
      mostrarMensaje(`Correo enviado con éxito a ${destinatario}.`, 'success');
      filtrarYRenderizar();

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
