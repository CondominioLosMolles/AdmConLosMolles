// js/gastos_comunes.js

/**
 * Carga y renderiza el módulo de Gastos Comunes.
 * Se conecta directamente a las funciones de Google Sheets.
 */
async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [];
  let pagosGC_raw = []; // Datos crudos desde la hoja
  let pagosGC_obj = []; // Datos transformados a objetos
  let timcData = {};    // Datos de TIMC cacheados

  try {
    // --- 1. CONEXIÓN REAL A GOOGLE SHEETS ---
    // Se llaman las funciones desde tu archivo sheets.js
    residentes = await obtenerResidentes();
    pagosGC_raw = await obtenerPagosGC();

    // Transformar los datos de pagos a un formato de objeto más manejable
    // Asumiendo el orden de columnas de tu hoja "Pagos_GC"
    const encabezadosPagos = [
        'ID', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo', 'Fecha_Vencimiento',
        'Monto_Pagado', 'Saldo', 'Interes', 'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total',
        'Fecha_Pago', 'Metodo_Pago', 'Estado', 'TIMC', 'ComprobanteURL'
    ];

    pagosGC_obj = pagosGC_raw.map(fila => {
        let obj = {};
        encabezadosPagos.forEach((encabezado, i) => {
            obj[encabezado] = fila[i];
        });
        // Agregar año para facilitar filtros
        if (obj.Periodo) {
            const anioMatch = obj.Periodo.match(/\d{4}/);
            obj.anio = anioMatch ? parseInt(anioMatch[0]) : new Date(obj.Fecha_Vencimiento).getFullYear();
        }
        return obj;
    });

    // Cargar TIMC desde el almacenamiento local del navegador
    const anioActual = new Date().getFullYear();
    timcData = JSON.parse(localStorage.getItem('timcData')) || {};
    if (!timcData[anioActual]) timcData[anioActual] = {};


  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos desde Google Sheets: ' + e.message, 'error');
    return;
  }

  // --- 2. LAYOUT HTML DEL MÓDULO ---
  const main = document.getElementById('main-content');
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  main.innerHTML = `
    <h2>Gastos Comunes</h2>
    <section class="widget" style="margin-bottom: 24px;">
      <div style="display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end;">
        <div style="flex: 1; min-width: 150px;">
          <label for="filtroParcela"><b>N° Parcela:</b></label>
          <input list="lista-parcelas" id="filtroParcela" placeholder="Escriba o seleccione..." style="width:100%;">
          <datalist id="lista-parcelas">
            ${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}
          </datalist>
        </div>
        <div style="flex: 1; min-width: 150px;">
          <label for="filtroAnio"><b>Año:</b></label>
          <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
        </div>
        <div style="flex: 2; min-width: 250px; display: flex; gap: 8px; align-items: flex-end;">
          <div style="flex: 1;">
            <label for="inputTMC"><b>Ingresar TMC (% Anual)</b></label>
            <input type="number" id="inputTMC" step="0.1" placeholder="Ej: 5.5">
          </div>
          <div style="flex: 1;">
             <select id="selectMesTMC" style="width:100%; padding: 11px 10px;">
              ${meses.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}
            </select>
          </div>
          <button id="btnGuardarTMC" class="btn" style="height: 42px;">Guardar</button>
        </div>
        <div id="timc-display" style="flex: 1; min-width: 200px; background: #e9f1fb; padding: 10px; border-radius: 8px;">
          <h4 style="margin:0 0 8px 0;">TIMC Mensual (${new Date().getFullYear()})</h4>
          <div id="timc-list" style="font-size: 0.9em; columns: 2;"></div>
        </div>
      </div>
    </section>
    <section id="detalle-gastos">
      <h3>Detalle de Gastos Comunes</h3>
      <div style="overflow-x:auto;">
        <table class="table" style="table-layout: auto;">
          <thead>
            <tr>
              <th>Nombre Residente</th><th>N° Parcela</th><th>Valor G.C.</th><th>Período</th><th>Vencimiento</th>
              <th>Monto Pagado</th><th>Saldo</th><th>Interés</th><th>Multa 1/4</th><th>Meses Impagos</th>
              <th>Deuda Total</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th>
            </tr>
          </thead>
          <tbody id="tbody-gastos"></tbody>
        </table>
      </div>
    </section>
    <button id="btnAbrirModalGasto" title="Agregar Gasto Común" class="btn" style="position:fixed; bottom:30px; right:30px; width:60px; height:60px; border-radius:50%; font-size:28px; padding:0;">+</button>
    <div id="modalGasto" class="modal" style="display:none;">
      <div style="max-width: 600px;">
        <h3>Agregar Gasto Común</h3>
        <form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;">
          <div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div>
          <div style="flex: 1 1 300px;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;"></div>
          <div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div>
          <div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div>
          <div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${meses.map(m => `<option value="${m}">${m}</option>`).join('')}</select></div>
          <div style="flex: 1 1 180px;"><label>Monto Pagado</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div>
          <div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div>
          <div style="flex: 1 1 100%;"><label>Comprobante de Pago</label><input type="file" name="Comprobante"></div>
          <div style="flex: 1 1 100%; text-align: right; margin-top: 20px;">
            <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // --- 3. LÓGICA Y EVENTOS ---
  const filtroParcela = document.getElementById('filtroParcela');
  const filtroAnio = document.getElementById('filtroAnio');
  const tbodyGastos = document.getElementById('tbody-gastos');

  // --- Lógica de TIMC ---
  function actualizarVistaTIMC() {
    const anio = filtroAnio.value || new Date().getFullYear();
    document.querySelector('#timc-display h4').textContent = `TIMC Mensual (${anio})`;
    const timcList = document.getElementById('timc-list');
    timcList.innerHTML = '';
    const anioData = timcData[anio] || {};
    meses.forEach((mes, index) => {
        const timcValor = anioData[index + 1] ? `${(anioData[index + 1] * 100).toFixed(1)}%` : 'N/A';
        timcList.innerHTML += `<div><b>${mes}:</b> ${timcValor}</div>`;
    });
  }

  document.getElementById('btnGuardarTMC').addEventListener('click', () => {
    const tmcAnual = parseFloat(document.getElementById('inputTMC').value);
    const mes = document.getElementById('selectMesTMC').value;
    const anio = filtroAnio.value;
    if (isNaN(tmcAnual) || !mes || !anio) {
        return mostrarMensaje('Debe ingresar un valor TMC, mes y año válidos.', 'error');
    }
    if (!timcData[anio]) timcData[anio] = {};
    timcData[anio][mes] = tmcAnual / 100;
    localStorage.setItem('timcData', JSON.stringify(timcData));
    mostrarMensaje(`TIMC de ${tmcAnual}% guardado para ${meses[mes-1]} del ${anio}.`, 'success');
    document.getElementById('inputTMC').value = '';
    actualizarVistaTIMC();
    filtrarYRenderizar();
  });

  // --- Lógica de renderizado ---
  function filtrarYRenderizar() {
    const parcela = filtroParcela.value;
    const anio = filtroAnio.value;
    if (!parcela || !anio) {
      tbodyGastos.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:20px;">Seleccione una parcela y año para ver los datos.</td></tr>`;
      return;
    }
    const residente = residentes.find(r => r[3] == parcela); // Columna 3 es N° Parcela
    if (!residente) {
      tbodyGastos.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:20px;">No se encontró residente para la parcela ${parcela}.</td></tr>`;
      return;
    }

    tbodyGastos.innerHTML = '';
    const nombreResidente = residente[1]; // Columna 1 es Nombre Completo
    const valorGastoComun = parseFloat(residente[8]); // Columna 8 es Valor GC

    meses.forEach((mes, index) => {
      const mesNumero = index + 1;
      const periodoCompleto = `${mes} ${anio}`;
      const fechaVencimiento = new Date(anio, mesNumero, 10);
      const hoy = new Date();

      const pagoRegistrado = pagosGC_obj.find(p => p.N_Parcela == parcela && p.Periodo.startsWith(mes) && p.anio == anio);
      
      let interes = 0, multa = 0, mesesImpagos = 0;
      let estado = 'Pendiente';
      const atrasado = hoy > fechaVencimiento && !pagoRegistrado;

      if (atrasado) {
        mesesImpagos = Math.max(0, (hoy.getFullYear() - fechaVencimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaVencimiento.getMonth()));
        if(hoy.getDate() > 10) mesesImpagos++;
        
        const timcAnual = (timcData[anio] && timcData[anio][mesNumero]) ? timcData[anio][mesNumero] : 0;
        interes = valorGastoComun * (timcAnual / 12);
        multa = (valorGastoComun / 4) * mesesImpagos;
      }
      
      const deudaTotal = (pagoRegistrado ? parseFloat(pagoRegistrado.Deuda_Total) : valorGastoComun + interes + multa) || 0;
      const montoPagado = pagoRegistrado ? parseFloat(pagoRegistrado.Monto_Pagado) : 0;
      const saldo = montoPagado - deudaTotal;

      if (pagoRegistrado) estado = 'Pagado';
      else if (atrasado) estado = 'Moroso';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nombreResidente}</td><td>${parcela}</td><td>$${valorGastoComun.toLocaleString('es-CL')}</td>
        <td>${periodoCompleto}</td><td>${fechaVencimiento.toLocaleDateString('es-CL')}</td>
        <td>$${montoPagado.toLocaleString('es-CL')}</td><td style="color:${saldo < 0 ? 'red':'green'};">$${saldo.toLocaleString('es-CL')}</td>
        <td>$${interes.toLocaleString('es-CL')}</td><td>$${multa.toLocaleString('es-CL')}</td><td>${mesesImpagos}</td>
        <td style="font-weight:bold;">$${deudaTotal.toLocaleString('es-CL')}</td>
        <td>${pagoRegistrado ? new Date(pagoRegistrado.Fecha_Pago).toLocaleDateString('es-CL') : '---'}</td>
        <td>${pagoRegistrado ? pagoRegistrado.Metodo_Pago : '---'}</td>
        <td><span class="estado-tag estado-${estado.toLowerCase()}">${estado}</span></td>
      `;
      tbodyGastos.appendChild(tr);
    });
  }

  // --- Lógica del Modal ---
  const modal = document.getElementById('modalGasto');
  const inputNParcela = document.getElementById('inputNParcela');
  document.getElementById('btnAbrirModalGasto').addEventListener('click', () => modal.style.display = 'flex');
  document.getElementById('btnCerrarModal').addEventListener('click', () => modal.style.display = 'none');
  
  inputNParcela.addEventListener('input', (e) => {
    const parcela = e.target.value;
    const residente = residentes.find(r => r[3] == parcela);
    if (residente) {
      document.getElementById('inputNombreResidente').value = residente[1];
      document.getElementById('inputValorGastoComun').value = parseFloat(residente[8]).toLocaleString('es-CL', {style: 'currency', currency: 'CLP'});
    } else {
      document.getElementById('inputNombreResidente').value = '';
      document.getElementById('inputValorGastoComun').value = '';
    }
  });

  document.getElementById('formGastoComun').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const anio = new Date(formData.get('Fecha_Pago')).getFullYear();
    const periodo = `${formData.get('Periodo')} ${anio}`;

    // Preparar los datos como un array en el orden correcto para la hoja de cálculo
    const datosParaSheet = [
        null, // Columna A: ID (se genera en la función agregarPagoGC)
        formData.get('Nombre_Residente'),
        formData.get('N_Parcela'),
        parseFloat(document.getElementById('inputValorGastoComun').value.replace(/[^0-9,-]+/g,"").replace(",",".")),
        periodo,
        null, // Fecha_Vencimiento (se puede calcular si es necesario)
        formData.get('Monto_Pagado'),
        null, // Saldo
        null, // Interes
        null, // Multa_1/4
        null, // Meses_Inpagos
        null, // Deuda_Total
        formData.get('Fecha_Pago'),
        formData.get('Metodo_Pago'),
        'Pagado', // Estado
        null, // TIMC
        null, // ComprobanteURL
    ];

    mostrarSpinner();
    try {
      // AQUÍ SE LLAMA A LA FUNCIÓN DE sheets.js PARA AGREGAR LA FILA
      await agregarPagoGC(datosParaSheet);
      
      // Lógica para subir archivo (necesita una función en drive.js)
      const archivo = formData.get('Comprobante');
      if (archivo && archivo.size > 0) {
        // Debes tener una función como esta en un archivo drive.js
        // await subirArchivoADrive(formData.get('N_Parcela'), archivo);
        console.log("Archivo listo para subir a Drive (función no implementada).");
      }
      
      mostrarMensaje('Gasto común registrado con éxito.', 'success');
      modal.style.display = 'none';
      e.target.reset();
      cargarGastosComunes(); // Recargar todo para ver los cambios
    } catch (err) {
      mostrarMensaje('Error al guardar el gasto: ' + err.message, 'error');
    } finally {
      ocultarSpinner();
    }
  });

  // --- Eventos y Carga Inicial ---
  filtroParcela.addEventListener('input', filtrarYRenderizar);
  filtroAnio.addEventListener('input', () => {
      actualizarVistaTIMC();
      filtrarYRenderizar();
  });
  actualizarVistaTIMC();
  ocultarSpinner();
}
