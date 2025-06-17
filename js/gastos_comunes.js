// js/gastos_comunes.js

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado'
];

async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [];
  let pagosGC_obj = [];
  let timcData = {};

  try {
    // --- CONEXIÓN REAL A GOOGLE SHEETS ---
    // Se piden todos los datos de las hojas al mismo tiempo para evitar conflictos.
    const [residentesData, pagosGC_raw, timcs_raw] = await Promise.all([
        obtenerResidentes(),
        obtenerPagosGC(),
        obtenerTIMCs() // Función que lee la hoja Config_TIMC
    ]);
    
    residentes = residentesData || [];
    
    pagosGC_obj = pagosGC_raw.map(fila => {
        let obj = {};
        ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; });
        if (obj.Periodo) {
            const anioMatch = obj.Periodo.match(/\d{4}/);
            obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
        }
        return obj;
    }).filter(p => p.N_Parcela);

    if(timcs_raw) {
        timcs_raw.forEach(fila => {
            const [anio, mes, valor] = fila;
            if (!timcData[anio]) timcData[anio] = {};
            timcData[anio][mes] = parseFloat(valor); // Se guarda el % como número
        });
    }

  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error');
    return;
  }
  
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start;">
      <section class="widget" style="flex: 1; min-width: 350px;"><h4 style="margin-top:0;">Filtros de Búsqueda</h4><div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;"><div style="flex: 1; min-width: 150px;"><label for="filtroParcela"><b>N° Parcela:</b></label><input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;"><datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist></div><div style="flex: 1; min-width: 150px;"><label for="filtroAnio"><b>Año:</b></label><input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;"></div></div><button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button></section>
      <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
    </div>
    <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Gastos</h3><div style="overflow-x:auto;"><table class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
    <div id="modalGC" class="modal" style="display:none;"><div><h3>Agregar Gasto Común</h3><form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;"><div style="flex: 1 1 120px;"><label>N° Parcela</label><input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required></div><div style="flex: 1 1 300px;"><label>Nombre Residente</label><input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Valor Gasto Común</label><input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;"></div><div style="flex: 1 1 180px;"><label>Fecha de Pago</label><input type="date" name="Fecha_Pago" required></div><div style="flex: 1 1 180px;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div><div style="flex: 1 1 180px;"><label>Monto Pagado</label><input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP"></div><div style="flex: 1 1 180px;"><label>Método de Pago</label><select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div><div style="flex: 1 1 100%;"><label>Comprobante</label><input type="file" name="Comprobante"></div><div style="flex: 1 1 100%; text-align: right; margin-top: 20px;"><button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button><button class="btn" type="submit">Guardar Gasto</button></div></form></div></div>
  `;
  
  const tbodyGastos = document.getElementById('tbody-gastos');
  const theadGastos = document.getElementById('thead-gastos');

  function renderizarTablaGeneral(datos) { /* Sin cambios, muestra resumen */ }
  function renderizarTablaResidente(parcela, anio) { /* Sin cambios, muestra detalle y calcula */ }
  function filtrarYRenderizar() { /* Sin cambios, decide qué tabla mostrar */ }
  function actualizarVistaTIMC() { /* Sin cambios, muestra los TIMC */ }
  
  // Asignación de todos los eventos
  document.getElementById('btnGuardarTMC').addEventListener('click', async () => {
    if (typeof guardarTIMC !== 'function') return mostrarMensaje('Error: La función "guardarTIMC" no se encontró en sheets.js.', 'error');
    
    const anio = document.getElementById('filtroAnio').value;
    const mes = document.getElementById('selectMesTMC').value;
    const valor = parseFloat(document.getElementById('inputTMC').value);
    
    if (isNaN(valor) || !mes || !anio) return mostrarMensaje('Debe ingresar TIMC, mes y año.', 'error');
    
    mostrarSpinner();
    try {
      await guardarTIMC(anio, mes, valor); // Llama a la función de sheets.js
      
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
    const formData = new FormData(e.target);
    const parcela = formData.get('N_Parcela');
    const residente = residentes.find(r => r[3] == parcela);
    const valorGastoComun = parseFloat(residente[8]);

    // --- Lógica de cálculo al momento de guardar ---
    const anioFiltro = document.getElementById('filtroAnio').value;
    const mesPagadoIndex = parseInt(formData.get('Periodo')); // El índice del mes (0-11)
    const fechaVencimiento = new Date(anioFiltro, mesPagadoIndex, 10);
    const fechaDePago = new Date(formData.get('Fecha_Pago').replace(/-/g, '/'));

    let interes = 0, multa = 0, mesesImpagos = 0, deudaTotal = valorGastoComun, saldo = 0;
    
    if (fechaDePago > fechaVencimiento) {
        const diffAnios = fechaDePago.getFullYear() - fechaVencimiento.getFullYear();
        const diffMeses = fechaDePago.getMonth() - fechaVencimiento.getMonth();
        mesesImpagos = diffAnios * 12 + diffMeses;
        if (fechaDePago.getDate() >= 11) mesesImpagos += 1;
        if (mesesImpagos <= 0) mesesImpagos = 1;

        const timcAnual = (timcData[anioFiltro] && timcData[anioFiltro][mesPagadoIndex + 1]) ? timcData[anioFiltro][mesPagadoIndex + 1] : 0;
        interes = valorGastoComun * (timcAnual / 100) / 12;
        multa = (valorGastoComun / 4) * mesesImpagos;
        deudaTotal = valorGastoComun + interes + multa;
    }
    
    const montoPagado = parseFloat(formData.get('Monto_Pagado'));
    saldo = montoPagado - deudaTotal;
    
    const periodoStr = `${MESES[mesPagadoIndex]} ${anioFiltro}`;
    
    // Se prepara la fila con todos los datos calculados para guardar en la hoja
    const datosParaSheet = [
        null, // A: ID_Pago (se genera en sheets.js)
        formData.get('Nombre_Residente'), // B
        parcela, // C
        valorGastoComun, // D
        periodoStr, // E
        fechaVencimiento.toISOString().split('T')[0], // F
        montoPagado, // G
        saldo, // H
        interes, // I
        null, // J: TIMC (no se guarda en la fila de pago)
        multa, // K
        mesesImpagos, // L
        deudaTotal, // M
        formData.get('Fecha_Pago'), // N
        formData.get('Metodo_Pago'), // O
        'Pagado' // P
    ];

    mostrarSpinner();
    try {
      await agregarPagoGC(datosParaSheet);
      
      const nuevoPagoObj = {};
      ENCABEZADOS_PAGOS.forEach((encabezado, i) => nuevoPagoObj[encabezado] = datosParaSheet[i]);
      nuevoPagoObj.anio = anioFiltro;
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

  document.getElementById('filtroParcela').addEventListener('input', filtrarYRenderizar);
  document.getElementById('filtroAnio').addEventListener('input', () => {
    actualizarVistaTIMC();
    filtrarYRenderizar();
  });
  
  filtrarYRenderizar();
  actualizarVistaTIMC();
  ocultarSpinner();
}

// Para hacer que el módulo se pueda llamar desde el menú
window.cargarGastosComunes = cargarGastosComunes;
