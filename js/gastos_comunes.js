// js/gastos_comunes.js

// Se mueven a un alcance global dentro del módulo para evitar errores de "not defined"
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo', 'Fecha_Vencimiento',
    'Monto_Pagado', 'Saldo', 'Interes', 'Multa_1_4', 'Meses_Inpagos', 'Deuda_Total',
    'Fecha_Pago', 'Metodo_Pago', 'Estado', 'TIMC', 'ComprobanteURL'
];

/**
 * Carga y renderiza el módulo de Gastos Comunes.
 * Versión con ajustes visuales en los widgets.
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
        ENCABEZADOS_PAGOS.forEach((encabezado, i) => {
            obj[encabezado] = fila[i];
        });
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
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroParcela"><b>N° Parcela:</b></label>
            <input list="lista-parcelas" id="filtroParcela" placeholder="Todos (1-26)..." style="width:100%;">
            <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label for="filtroAnio"><b>Año:</b></label>
            <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
          </div>
        </div>
        <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
      </section>

      <section class="widget" style="flex: 2; min-width: 450px;">
         <h4 style="margin-top:0;">Configuración de TIMC</h4>
         <div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;">
            <div style="min-width: 120px;"><label for="inputTMC"><b>TMC (% Anual)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 40"></div>
            <div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div>
            <button id="btnGuardarTMC" class="btn">Guardar en Sheet</button>
         </div>
         <div id="timc-display">
            <h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5>
            <div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;">
              </div>
         </div>
      </section>
    </div>
    
    <section id="detalle-gastos" style="margin-top: 2rem;">
      <h3>Detalle de Pagos Registrados</h3>
      <div style="overflow-x:auto;"><table class="table"><thead><tr>
        <th>Residente</th><th>Parcela</th><th>Valor G.C.</th><th>Período</th>
        <th>Monto Pagado</th><th>Saldo</th><th>Deuda Total</th><th>Fecha Pago</th><th>Estado</th>
      </tr></thead><tbody id="tbody-gastos"></tbody></table></div>
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
          <div style="flex: 1 1 100%;"><label>Comprobante de Pago</label><input type="file" name="Comprobante"></div>
          <div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div>
        </form>
      </div>
    </div>
  `;
  
  const filtroParcela = document.getElementById('filtroParcela');
  const filtroAnio = document.getElementById('filtroAnio');
  const tbodyGastos = document.getElementById('tbody-gastos');

  function renderizarTabla(datos) {
    tbodyGastos.innerHTML = '';
    if (!datos || datos.length === 0) {
      tbodyGastos.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:20px;">No hay registros para mostrar.</td></tr>`;
      return;
    }
    datos.sort((a,b) => (b.Fecha_Pago ? new Date(b.Fecha_Pago) : 0) - (a.Fecha_Pago ? new Date(a.Fecha_Pago) : 0));
    
    datos.forEach(pago => {
      const residente = residentes.find(r => r[3] == pago.N_Parcela);
      const valorGC = residente ? parseFloat(residente[8]) : parseFloat(pago.Valor_Gasto_Comun || 0);
      const estadoClass = (pago.Estado || 'pendiente').toLowerCase().trim();
      const saldo = parseFloat(pago.Saldo || 0);
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${pago.Nombre_Residente || 'N/A'}</td>
        <td>${pago.N_Parcela}</td>
        <td>$${valorGC.toLocaleString('es-CL')}</td>
        <td>${pago.Periodo || 'N/A'}</td>
        <td>$${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
        <td style="color:${saldo < 0 ? 'red':'green'};">$${saldo.toLocaleString('es-CL')}</td>
        <td style="font-weight:bold;">$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}</td>
        <td>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago).toLocaleDateString('es-CL') : '---'}</td>
        <td><span class="estado-tag estado-${estadoClass}">${pago.Estado || 'Pendiente'}</span></td>
      `;
      tbodyGastos.appendChild(tr);
    });
  }

  function filtrarYRenderizar() {
    const parcela = filtroParcela.value;
    const anio = filtroAnio.value;
    let datosAMostrar = pagosGC_obj;
    if (parcela) {
        datosAMostrar = datosAMostrar.filter(p => p.N_Parcela == parcela);
    }
    if (anio) {
        datosAMostrar = datosAMostrar.filter(p => p.anio == anio);
    }
    renderizarTabla(datosAMostrar);
  }
  
  function actualizarVistaTIMC() {
    const anio = filtroAnio.value || new Date().getFullYear();
    const timcList = document.getElementById('timc-list-horizontal');
    timcList.innerHTML = ''; // Limpiar vista
    const anioData = timcData[anio] || {};
    MESES.forEach((mes, i) => {
        const timcValor = anioData[i + 1] ? `<b>${(anioData[i + 1] * 100).toFixed(1)}%</b>` : 'N/A';
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = `${mes}: ${timcValor}`;
        timcList.appendChild(itemDiv);
    });
  }

  document.getElementById('btnGuardarTMC').addEventListener('click', async () => {
    if (typeof guardarTMCenSheet !== 'function') {
      return mostrarMensaje('Error: La función "guardarTMCenSheet" no se encontró. Asegúrate de agregarla a tu archivo sheets.js.', 'error');
    }
    
    const tmcAnual = parseFloat(document.getElementById('inputTMC').value);
    const mes = document.getElementById('selectMesTMC').value;
    const anio = filtroAnio.value;
    if (isNaN(tmcAnual) || !mes || !anio) return mostrarMensaje('Debe ingresar TMC, mes y año.', 'error');
    
    mostrarSpinner();
    try {
      await guardarTMCenSheet(anio, mes, tmcAnual);
      if (!timcData[anio]) timcData[anio] = {};
      timcData[anio][mes] = tmcAnual / 100;
      localStorage.setItem('timcData', JSON.stringify(timcData));
      actualizarVistaTIMC();
      mostrarMensaje(`TIMC de ${tmcAnual}% guardado en Google Sheet.`, 'success');
    } catch (err) {
      mostrarMensaje('Error al guardar TIMC en la hoja: ' + err.message, 'error');
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
        null, formData.get('Monto_Pagado'), null, null, null, null, null,
        formData.get('Fecha_Pago'), formData.get('Metodo_Pago'), 'Pagado', null, null
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
      mostrarMensaje('Gasto común registrado y actualizado en la tabla.', 'success');
    } catch (err) {
      mostrarMensaje('Error al guardar el gasto: ' + err.message, 'error');
    } finally {
      ocultarSpinner();
    }
  });

  filtroParcela.addEventListener('input', filtrarYRenderizar);
  filtroAnio.addEventListener('input', () => {
    actualizarVistaTIMC();
    filtrarYRenderizar();
});
  
  // Carga inicial de datos en la tabla y vista TIMC
  filtrarYRenderizar();
  actualizarVistaTIMC();
  ocultarSpinner();
}
