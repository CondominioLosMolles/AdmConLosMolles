// js/gastos_comunes.js

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado'
];

/**
 * Carga y renderiza el módulo de Gastos Comunes.
 * Versión con tabla detallada y completa según solicitud inicial.
 */
async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [];
  let pagosGC_obj = [];
  let timcData = {};

  try {
    residentes = await obtenerResidentes();
    const pagosGC_raw = await obtenerPagosGC();
    pagosGC_obj = pagosGC_raw.map(fila => {
        let obj = {};
        ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; });
        if (obj.Periodo) {
            const anioMatch = obj.Periodo.match(/\d{4}/);
            obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
        }
        return obj;
    }).filter(p => p.N_Parcela);
    timcData = JSON.parse(localStorage.getItem('timcData')) || {};
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos desde Google Sheets: ' + e.message, 'error');
    return;
  }
  
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h2>Gastos Comunes</h2>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start;">
      <section class="widget" style="flex: 1; min-width: 350px;">
        <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1; min-width: 150px;"><label for="filtroParcela"><b>N° Parcela:</b></label><input list="lista-parcelas" id="filtroParcela" placeholder="Todos (1-26)..." style="width:100%;"><datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist></div>
          <div style="flex: 1; min-width: 150px;"><label for="filtroAnio"><b>Año:</b></label><input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;"></div>
        </div>
        <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
      </section>
      <section class="widget" style="flex: 2; min-width: 450px;">
         <h4 style="margin-top:0;">Configuración de TIMC</h4>
         <div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;">
            <div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 40"></div>
            <div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div>
            <button id="btnGuardarTMC" class="btn">Guardar en Sheet</button>
         </div>
         <div id="timc-display">
            <h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5>
            <div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div>
         </div>
      </section>
    </div>
    <section id="detalle-gastos" style="margin-top: 2rem;">
      <h3>Detalle de Gastos</h3>
      <div style="overflow-x:auto;"><table class="table">
        <thead id="thead-gastos">
            </thead>
        <tbody id="tbody-gastos"></tbody>
      </table></div>
    </section>
    <div id="modalGC" class="modal" style="display:none;">
      <div>
        <h3>Agregar Gasto Común</h3>
        <form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;">
          <div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div>
          <div style="flex: 1 1 300px;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;"></div>
          <div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div>
          <div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div>
          <div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map(m => `<option value="${m}">${m}</option>`).join('')}</select></div>
          <div style="flex: 1 1 180px;"><label>Monto Pagado</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div>
          <div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div>
          <div style="flex: 1 1 100%;"><label>Comprobante</label><input type="file" name="Comprobante"></div>
          <div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div>
        </form>
      </div>
    </div>
  `;
  
  const tbodyGastos = document.getElementById('tbody-gastos');
  const theadGastos = document.getElementById('thead-gastos');

  // Muestra una lista de todos los pagos históricos.
  function renderizarTablaGeneral(datos) {
    document.querySelector('#detalle-gastos h3').textContent = 'Detalle de Pagos Registrados';
    theadGastos.innerHTML = `<tr><th>Residente</th><th>Parcela</th><th>Período</th><th>Monto Pagado</th><th>Deuda Total</th><th>Fecha Pago</th><th>Estado</th></tr>`;
    
    tbodyGastos.innerHTML = '';
    if (!datos || datos.length === 0) {
      tbodyGastos.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">No hay registros para mostrar.</td></tr>`;
      return;
    }
    datos.sort((a,b) => (b.Fecha_Pago ? new Date(b.Fecha_Pago) : 0) - (a.Fecha_Pago ? new Date(a.Fecha_Pago) : 0));
    
    datos.forEach(pago => {
      const estadoClass = (pago.Estado || 'pendiente').toLowerCase().trim();
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pago.Nombre_Residente || 'N/A'}</td><td>${pago.N_Parcela}</td>
        <td>${pago.Periodo || 'N/A'}</td><td>$${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
        <td style="font-weight:bold;">$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}</td>
        <td>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago).toLocaleDateString('es-CL') : '---'}</td>
        <td><span class="estado-tag estado-${estadoClass}">${pago.Estado || 'Pendiente'}</span></td>
      `;
      tbodyGastos.appendChild(tr);
    });
  }

  // Muestra el detalle de 12 meses para UN residente, con TODAS las columnas.
  function renderizarTablaResidente(parcela, anio) {
    const residente = residentes.find(r => r[3] == parcela);
    if (!residente) {
        tbodyGastos.innerHTML = `<tr><td colspan="14">No se encontró residente.</td></tr>`;
        return;
    }

    document.querySelector('#detalle-gastos h3').textContent = `Detalle Anual para ${residente[1]} (Parcela ${parcela})`;
    // CORREGIDO: Se agregan todas las columnas solicitadas al encabezado de la tabla.
    theadGastos.innerHTML = `<tr>
        <th>Nombre Residente</th><th>N° Parcela</th><th>Valor G.C.</th><th>Periodo</th><th>Fecha Vencimiento</th>
        <th>Monto Pagado</th><th>Saldo</th><th>Interés</th><th>Multa 1/4</th>
        <th>Meses Impagos</th><th>Deuda Total</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th>
    </tr>`;

    tbodyGastos.innerHTML = '';
    const valorGastoComun = parseFloat(residente[8]);

    MESES.forEach((mes, index) => {
        const mesNumero = index + 1;
        const pagoExistente = pagosGC_obj.find(p => p.N_Parcela == parcela && p.Periodo.toLowerCase().startsWith(mes.toLowerCase()) && p.anio == anio);
        
        // Variables para cada fila
        let interes = 0, multa = 0, mesesImpagos = 0, saldo = 0, deudaTotal = valorGastoComun;
        let estado = 'Pendiente';
        let montoPagado = 0;
        let fechaPago = '---';
        let metodoPago = '---';

        const fechaVencimiento = new Date(anio, mesNumero, 10);
        const hoy = new Date();

        if (pagoExistente) {
            estado = 'Pagado';
            montoPagado = parseFloat(pagoExistente.Monto_Pagado || 0);
            deudaTotal = parseFloat(pagoExistente.Deuda_Total || montoPagado);
            saldo = montoPagado - deudaTotal;
            fechaPago = pagoExistente.Fecha_Pago ? new Date(pagoExistente.Fecha_Pago).toLocaleDateString('es-CL') : '---';
            metodoPago = pagoExistente.Metodo_Pago || '---';
        } else if (hoy > fechaVencimiento) {
            estado = 'Moroso';
            
            // Lógica de cálculo según la solicitud inicial
            mesesImpagos = (hoy.getFullYear() - fechaVencimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaVencimiento.getMonth());
            const tmcAnual = (timcData[anio] && timcData[anio][mesNumero]) ? timcData[anio][mesNumero] : 0;
            interes = valorGastoComun * (tmcAnual / 12);
            multa = (valorGastoComun / 4) * mesesImpagos;
            deudaTotal = valorGastoComun + interes + multa;
            saldo = -deudaTotal;
        }

        const tr = document.createElement('tr');
        const estadoClass = estado.toLowerCase();
        // CORREGIDO: Se agregan las celdas (<td>) para todas las columnas nuevas.
        tr.innerHTML = `
            <td>${residente[1]}</td>
            <td>${parcela}</td>
            <td>$${valorGastoComun.toLocaleString('es-CL')}</td>
            <td><b>${mes} ${anio}</b></td>
            <td>${fechaVencimiento.toLocaleDateString('es-CL')}</td>
            <td>$${montoPagado.toLocaleString('es-CL')}</td>
            <td style="color:${saldo < 0 ? 'red':'green'}; font-weight:bold;">$${saldo.toLocaleString('es-CL')}</td>
            <td>$${interes.toLocaleString('es-CL')}</td>
            <td>$${multa.toLocaleString('es-CL')}</td>
            <td>${mesesImpagos}</td>
            <td style="font-weight:bold;">$${deudaTotal.toLocaleString('es-CL')}</td>
            <td>${fechaPago}</td>
            <td>${metodoPago}</td>
            <td><span class="estado-tag estado-${estadoClass}">${estado}</span></td>
        `;
        tbodyGastos.appendChild(tr);
    });
  }

  function filtrarYRenderizar() {
    const parcela = document.getElementById('filtroParcela').value;
    const anio = document.getElementById('filtroAnio').value;

    if (parcela && anio) {
        renderizarTablaResidente(parcela, anio);
    } else {
        let datosFiltrados = pagosGC_obj;
        if (anio) datosFiltrados = datosFiltrados.filter(p => p.anio == anio);
        renderizarTablaGeneral(datosFiltrados);
    }
  }
  
  function actualizarVistaTIMC() {
    const anio = document.getElementById('filtroAnio').value || new Date().getFullYear();
    const timcList = document.getElementById('timc-list-horizontal');
    timcList.innerHTML = '';
    const anioData = timcData[anio] || {};
    MESES.forEach((mes, i) => {
        const timcValor = anioData[i + 1] ? `<b>${(anioData[i + 1] * 100).toFixed(1)}%</b>` : 'N/A';
        timcList.innerHTML += `<div style="flex-basis: 15%;">${mes}: ${timcValor}</div>`;
    });
  }

  // --- Lógica de Eventos (sin cambios) ---
  document.getElementById('btnGuardarTMC').addEventListener('click', async () => {
    if (typeof guardarTMCenSheet !== 'function') return mostrarMensaje('Error: La función "guardarTMCenSheet" no se encontró.', 'error');
    const tmcAnual = parseFloat(document.getElementById('inputTMC').value);
    const mes = document.getElementById('selectMesTMC').value;
    const anio = document.getElementById('filtroAnio').value;
    if (isNaN(tmcAnual) || !mes || !anio) return mostrarMensaje('Debe ingresar TIMC, mes y año.', 'error');
    mostrarSpinner();
    try {
      await guardarTMCenSheet(anio, mes, tmcAnual);
      if (!timcData[anio]) timcData[anio] = {};
      timcData[anio][mes] = tmcAnual / 100;
      localStorage.setItem('timcData', JSON.stringify(timcData));
      actualizarVistaTIMC();
      filtrarYRenderizar();
      mostrarMensaje(`TIMC guardado en Google Sheet.`, 'success');
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
    const formData = new FormData(e.target);
    const anioPago = new Date(formData.get('Fecha_Pago')).getFullYear();
    const periodo = `${formData.get('Periodo')} ${anioPago}`;
    const valorGC_raw = document.getElementById('inputValorGastoComun').value;
    const valorGC = parseFloat(valorGC_raw.replace(/[^0-9,-]+/g, "").replace(",", "."));
    
    const datosParaSheet = [
      null, formData.get('Nombre_Residente'), formData.get('N_Parcela'), valorGC, periodo,
      null, formData.get('Monto_Pagado'), null, null, null, null, null, null,
      formData.get('Fecha_Pago'), formData.get('Metodo_Pago'), 'Pagado'
    ];
    
    mostrarSpinner();
    try {
      await agregarPagoGC(datosParaSheet);
      const nuevoPagoObj = {};
      ENCABEZADOS_PAGOS.forEach((encabezado, i) => nuevoPagoObj[encabezado] = datosParaSheet[i]);
      nuevoPagoObj.anio = anioPago;
      pagosGC_obj.push(nuevoPagoObj);
      
      filtrarYRenderizar();
      modal.style.display = 'none';
      e.target.reset();
      mostrarMensaje('Gasto común registrado y actualizado.', 'success');
    } catch (err) {
      mostrarMensaje('Error al guardar el gasto: ' + err.message, 'error');
    } finally {
      ocultarSpinner();
    }
  });

  document.getElementById('filtroParcela').addEventListener('input', filtrarYRenderizar);
  document.getElementById('filtroAnio').addEventListener('input', () => {
    actualizarVistaTIMC();
    filtrarYRenderizar();
  });
  
  // Carga inicial
  filtrarYRenderizar();
  actualizarVistaTIMC();
  ocultarSpinner();
}
