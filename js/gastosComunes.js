// js/gastos_comunes.js
// Módulo Gastos Comunes: filtros, TIMC, tabla detallada, alta de pago, lógica de cálculo, exportación

async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [], pagos = [];
  try {
    residentes = await obtenerResidentes();
    pagos = await obtenerPagosGC();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  // Filtros y TIMC
  const main = document.getElementById('main-content');
  const currentYear = new Date().getFullYear();
  let filtroParcela = '', filtroAnio = currentYear.toString();

  function getTIMCporMes(anio) {
    const meses = {};
    pagos.forEach(p => {
      const periodo = p[4]; // Periodo ej '2025-07'
      const timc = p[9];
      if (periodo && periodo.startsWith(anio)) {
        const mes = periodo.split('-')[1];
        meses[mes] = timc;
      }
    });
    return meses;
  }

  main.innerHTML = `
    <h2>Gastos Comunes</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
      <label>Parcela:
        <input type="number" id="filtroParcela" min="1" max="26" placeholder="N° Parcela" style="width:80px;">
      </label>
      <label>Año:
        <input type="number" id="filtroAnio" min="2020" max="2100" value="${currentYear}" style="width:90px;">
      </label>
      <button class="btn" id="btnFiltrarGC">Filtrar</button>
      <button class="btn secondary" id="btnExportarGC">Descargar Excel</button>
    </div>
    <div style="margin:16px 0;">
      <h4>Ingresar TIMC mensual</h4>
      <form id="formTIMC" style="display:flex;gap:8px;align-items:center;">
        <label>Mes:
          <select id="timcMes" required>
            ${Array.from({length:12},(_,i)=>`<option value="${(i+1).toString().padStart(2,'0')}">${(i+1).toString().padStart(2,'0')}</option>`).join('')}
          </select>
        </label>
        <label>Año:
          <input type="number" id="timcAnio" min="2020" max="2100" value="${currentYear}" style="width:90px;">
        </label>
        <label>TIMC (% anual):
          <input type="number" id="timcValor" step="0.01" min="0" required style="width:80px;">
        </label>
        <button class="btn" type="submit">Guardar TIMC</button>
      </form>
      <div id="tablaTIMC"></div>
    </div>
    <div style="margin:24px 0;">
      <button class="btn" id="btnAgregarGC">Agregar Gasto Común</button>
    </div>
    <div id="tablaGC"></div>
    <div id="modalGC" style="display:none;"></div>
  `;

  // Mostrar TIMC por mes del año seleccionado
  function renderTablaTIMC() {
    const timcMeses = getTIMCporMes(document.getElementById('filtroAnio').value);
    let html = '<b>TIMC por mes:</b><br><table class="table"><tr>' +
      '<th>Mes</th>' +
      '<th>TIMC (%)</th></tr>';
    for (let i=1; i<=12; i++) {
      const mes = i.toString().padStart(2,'0');
      html += `<tr>
        <td>${mes}</td>
        <td>${timcMeses[mes] || '-'}</td>
      </tr>`;
    }
    html += '</table>';
    document.getElementById('tablaTIMC').innerHTML = html;
  }
  renderTablaTIMC();

  // Guardar TIMC
  document.getElementById('formTIMC').onsubmit = async (e) => {
    e.preventDefault();
    const mes = document.getElementById('timcMes').value;
    const anio = document.getElementById('timcAnio').value;
    const valor = document.getElementById('timcValor').value;
    mostrarSpinner();
    try {
      // Actualiza el TIMC en todos los pagos del mes/año seleccionado
      for (let pago of pagos) {
        if (pago[4] && pago[4] === `${anio}-${mes}`) {
          pago[9] = valor; // Columna J: TIMC
          await actualizarPagoGC(pago);
        }
      }
      pagos = await obtenerPagosGC();
      renderTablaTIMC();
      mostrarMensaje('TIMC actualizado');
    } catch (e) {
      mostrarMensaje('Error al guardar TIMC: ' + e.message, 'error');
    }
    ocultarSpinner();
  };

  // Filtro
  document.getElementById('btnFiltrarGC').onclick = () => {
    filtroParcela = document.getElementById('filtroParcela').value;
    filtroAnio = document.getElementById('filtroAnio').value;
    renderTablaGC();
    renderTablaTIMC();
  };

  // Exportar a Excel
  document.getElementById('btnExportarGC').onclick = () => {
    const datos = getPagosFiltrados();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre_Residente","N_Parcela","Valor_Gasto_Comun","Periodo","Fecha_Vencimiento","MontoPagado","Saldo","Interes","TIMC","Multa_1/4","Meses_Inpagos","Deuda_Total","Fecha_Pago","Metodo_Pago","Estado"],
      ...datos.map(p=>p.slice(1,16))
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "GastosComunes");
    XLSX.writeFile(wb, "GastosComunes.xlsx");
  };

  // Filtrar pagos por parcela y año
  function getPagosFiltrados() {
    return pagos.filter(p => {
      const parcelaOk = !filtroParcela || p[2] === filtroParcela;
      const anioOk = !filtroAnio || (p[4] && p[4].startsWith(filtroAnio));
      return parcelaOk && anioOk;
    });
  }

  // Renderizar tabla de gastos comunes
  function renderTablaGC() {
    const datos = getPagosFiltrados();
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Nombre Residente</th>
            <th>N° Parcela</th>
            <th>Valor Gasto Común</th>
            <th>Periodo</th>
            <th>Fecha Vencimiento</th>
            <th>Monto Pagado</th>
            <th>Saldo</th>
            <th>Interés</th>
            <th>TIMC</th>
            <th>Multa 1/4</th>
            <th>Meses Impagos</th>
            <th>Deuda Total</th>
            <th>Fecha Pago</th>
            <th>Método Pago</th>
            <th>Estado</th>
            <th>Comprobante</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const p of datos) {
      html += `<tr>
        <td>${p[1]}</td>
        <td>${p[2]}</td>
        <td>$${Number(p[3]||0).toLocaleString('es-CL')}</td>
        <td>${p[4]}</td>
        <td>${p[5]}</td>
        <td>$${Number(p[6]||0).toLocaleString('es-CL')}</td>
        <td>$${Number(p[7]||0).toLocaleString('es-CL')}</td>
        <td>$${Number(p[8]||0).toLocaleString('es-CL')}</td>
        <td>${p[9]}</td>
        <td>$${Number(p[10]||0).toLocaleString('es-CL')}</td>
        <td>${p[11]}</td>
        <td>$${Number(p[12]||0).toLocaleString('es-CL')}</td>
        <td>${p[13]}</td>
        <td>${p[14]}</td>
        <td>
          <span class="estado-tag estado-${(p[15]||'').toLowerCase()}">${p[15]}</span>
        </td>
        <td>${p[16] ? `<a href="${p[16]}" target="_blank">Ver</a>` : ''}</td>
      </tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tablaGC').innerHTML = html;
  }
  renderTablaGC();

  // Botón agregar gasto común
  document.getElementById('btnAgregarGC').onclick = () => mostrarModalGC();

  // Formulario agregar pago de gasto común
  function mostrarModalGC() {
    const modal = document.getElementById('modalGC');
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div>
        <h3>Agregar Gasto Común</h3>
        <form id="formGC">
          <label>N° Parcela</label>
          <input name="parcela" id="inputParcela" required type="number" min="1" max="26">
          <label>Nombre Residente</label>
          <input name="nombre" id="inputNombre" required readonly>
          <label>Valor Gasto Común</label>
          <input name="valorGC" id="inputValorGC" required readonly>
          <label>Periodo (YYYY-MM)</label>
          <input name="periodo" required pattern="\\d{4}-\\d{2}">
          <label>Fecha de Pago</label>
          <input name="fechaPago" required type="date">
          <label>Monto Pagado</label>
          <input name="montoPagado" required type="number">
          <label>Método Pago</label>
          <select name="metodoPago" required>
            <option value="Transferencia">Transferencia</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Deposito">Depósito</option>
          </select>
          <label>Comprobante</label>
          <input name="comprobante" id="inputComprobante" type="file" accept="image/*,application/pdf">
          <div style="margin-top:16px;text-align:right;">
            <button class="btn" type="submit">Guardar</button>
            <button class="btn secondary" type="button" id="btnCerrarModalGC">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModalGC').onclick = () => modal.style.display = 'none';

    // Autocompletar nombre y valorGC al escribir parcela
    document.getElementById('inputParcela').oninput = (e) => {
      const parcela = e.target.value;
      const residente = residentes.find(r => r[3] === parcela);
      document.getElementById('inputNombre').value = residente ? residente[1] : '';
      document.getElementById('inputValorGC').value = residente ? residente[8] : '';
    };

    document.getElementById('formGC').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const parcela = fd.get('parcela');
      const nombre = fd.get('nombre');
      const valorGC = fd.get('valorGC');
      const periodo = fd.get('periodo');
      const fechaPago = fd.get('fechaPago');
      const montoPagado = fd.get('montoPagado');
      const metodoPago = fd.get('metodoPago');
      const file = fd.get('comprobante');
      let idComprobanteDrive = '';

      mostrarSpinner();
      try {
        // Subir comprobante a Drive si existe
        if (file && file.size > 0 && typeof subirComprobante === 'function') {
          const carpetaId = await obtenerCarpetaDriveParcela(parcela); // Implementa en drive.js
          const res = await subirComprobante(file, carpetaId);
          idComprobanteDrive = res.id;
        }
        // Calcular TIMC, interés, multa, meses impagos, deuda, saldo, estado
        const timc = getTIMCporMes(periodo.split('-')[0])[periodo.split('-')[1]] || 0;
        const fechaVencimiento = periodo + '-10';
        const interes = calcularInteres(valorGC, timc, fechaVencimiento, fechaPago);
        const mesesImpagos = calcularMesesImpagos(fechaVencimiento, fechaPago);
        const multa = calcularMulta(valorGC, mesesImpagos);
        const deudaTotal = (+valorGC) + (+interes) + (+multa);
        const saldo = (+montoPagado) - deudaTotal;
        const estado = saldo >= 0 ? 'Pagado' : (new Date(fechaPago) > new Date(fechaVencimiento) ? 'Moroso' : 'Pendiente');

        // Guardar pago en Sheets
        await agregarPagoGC([
          '', // ID autoincremental
          nombre,
          parcela,
          valorGC,
          periodo,
          fechaVencimiento,
          montoPagado,
          saldo,
          interes,
          timc,
          multa,
          mesesImpagos,
          deudaTotal,
          fechaPago,
          metodoPago,
          estado,
          idComprobanteDrive
        ]);
        modal.style.display = 'none';
        pagos = await obtenerPagosGC();
        renderTablaGC();
        mostrarMensaje('Gasto común registrado');
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  // Funciones de cálculo
  function calcularInteres(valorGC, timc, fechaVenc, fechaPago) {
    if (!valorGC || !timc) return 0;
    const fv = new Date(fechaVenc);
    const fp = new Date(fechaPago);
    if (fp <= fv) return 0;
    return Math.round((+valorGC) * (+timc) / 100 / 12);
  }
  function calcularMulta(valorGC, mesesImpagos) {
    if (!valorGC || !mesesImpagos) return 0;
    return Math.round((+valorGC) * 0.25 * mesesImpagos);
  }
  function calcularMesesImpagos(fechaVenc, fechaPago) {
    const fv = new Date(fechaVenc);
    const fp = new Date(fechaPago);
    if (fp <= fv) return 0;
    let meses = (fp.getFullYear() - fv.getFullYear()) * 12 + (fp.getMonth() - fv.getMonth());
    if (fp.getDate() > 10) meses += 1;
    return meses;
  }

  ocultarSpinner();
}

document.querySelector('[data-module="gastos_comunes"]').addEventListener('click', cargarGastosComunes);
