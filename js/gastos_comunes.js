// js/gastos_comunes.js

/**
 * Carga y renderiza el módulo de Gastos Comunes.
 * Se integra con la estructura y estilos existentes de la aplicación.
 */
async function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  // --- 1. ESTADO Y DATOS SIMULADOS (Reemplazar con llamadas a Google Sheets) ---
  // Estos datos deben cargarse desde tus hojas de cálculo.
  let residentes = [];
  let pagosGC = [];
  let timcData = {}; // Objeto para almacenar TIMC por año y mes.

  try {
    // Estas funciones deben existir en tu archivo 'sheets.js'
    // residentes = await obtenerResidentes(); // Descomentar cuando la tengas
    // pagosGC = await obtenerPagosGC();       // Descomentar cuando la tengas
    
    // --- Datos de ejemplo para desarrollo ---
    residentes = [
        // ID, Nombre, RUT, Parcela, Direccion, Email, Tel, Estado, ValorGC
        ['id1', 'Juan Pérez', '11-1', '1', 'Dir 1', 'j@p.cl', '911', 'Activo', 50000],
        ['id2', 'Ana Gómez', '22-2', '2', 'Dir 2', 'a@g.cl', '922', 'Moroso', 55000],
        ['id26', 'Carlos Díaz', '33-3', '26', 'Dir 26', 'c@d.cl', '933', 'Activo', 60000]
    ];
    pagosGC = [
      // Ejemplo de un pago registrado
      { N_Parcela: 1, Periodo: 'Mayo', anio: 2025, Monto_Pagado: 50000, Fecha_Pago: '2025-05-09', Metodo_Pago: 'Transferencia' }
    ];
    // --- Fin datos de ejemplo ---

  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos iniciales: ' + e.message, 'error');
    return;
  }

  // --- 2. LAYOUT HTML DEL MÓDULO ---
  const main = document.getElementById('main-content');
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
              ${meses.map((m, i) => `<option value="${i+1}">${m}</option>`).join('')}
            </select>
          </div>
          <button id="btnGuardarTMC" class="btn" style="height: 42px;">Guardar</button>
        </div>

        <div id="timc-display" style="flex: 1; min-width: 200px; background: #e9f1fb; padding: 10px; border-radius: 8px;">
          <h4 style="margin:0 0 8px 0;">TIMC Mensual (${new Date().getFullYear()})</h4>
          <div id="timc-list" style="font-size: 0.9em; columns: 2;">
            </div>
        </div>
      </div>
    </section>

    <section id="detalle-gastos">
      <h3>Detalle de Gastos Comunes</h3>
      <div style="overflow-x:auto;">
        <table class="table" style="table-layout: auto;">
          <thead>
            <tr>
              <th>Nombre Residente</th>
              <th>N° Parcela</th>
              <th>Valor Gasto Común</th>
              <th>Período</th>
              <th>Fecha Vencimiento</th>
              <th>Monto Pagado</th>
              <th>Saldo</th>
              <th>Interés</th>
              <th>Multa 1/4</th>
              <th>Meses Impagos</th>
              <th>Deuda Total</th>
              <th>Fecha Pago</th>
              <th>Método Pago</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody id="tbody-gastos">
            <tr><td colspan="14" style="text-align:center; padding:20px;">Seleccione una parcela y año para ver los datos.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <button id="btnAbrirModalGasto" title="Agregar Gasto Común" class="btn" style="position:fixed; bottom:30px; right:30px; width:60px; height:60px; border-radius:50%; font-size:28px; padding:0;">+</button>

    <div id="modalGasto" class="modal" style="display:none;">
      <div style="max-width: 600px;">
        <h3 id="modalTitulo">Agregar Gasto Común</h3>
        <form id="formGastoComun" style="display:flex; flex-wrap:wrap; gap:15px;">
          
          <div style="flex: 1 1 120px;">
            <label>N° Parcela</label>
            <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
          </div>
          <div style="flex: 1 1 300px;">
            <label>Nombre Residente</label>
            <input type="text" name="Nombre_Residente" id="inputNombreResidente" readonly style="background:#eee;">
          </div>
           <div style="flex: 1 1 180px;">
            <label>Valor Gasto Común</label>
            <input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;">
          </div>
          <div style="flex: 1 1 180px;">
            <label>Fecha de Pago</label>
            <input type="date" name="Fecha_Pago" required>
          </div>
          <div style="flex: 1 1 180px;">
            <label>Mes que Paga (Período)</label>
            <select name="Periodo" required>
              ${meses.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
          <div style="flex: 1 1 180px;">
            <label>Monto Pagado</label>
            <input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP">
          </div>
          <div style="flex: 1 1 180px;">
            <label>Método de Pago</label>
            <select name="Metodo_Pago" required>
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
            </select>
          </div>
          <div style="flex: 1 1 100%;">
            <label>Comprobante de Pago</label>
            <input type="file" name="Comprobante" multiple>
          </div>

          <div style="flex: 1 1 100%; text-align: right; margin-top: 20px;">
            <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
            <button class="btn" type="submit">Guardar Gasto</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // --- 3. LÓGICA Y EVENTOS ---
  const filtroParcela = document.getElementById('filtroParcela');
  const filtroAnio = document.getElementById('filtroAnio');
  const tbodyGastos = document.getElementById('tbody-gastos');
  
  const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // --- Lógica de TIMC ---
  const inputTMC = document.getElementById('inputTMC');
  const selectMesTMC = document.getElementById('selectMesTMC');
  const btnGuardarTMC = document.getElementById('btnGuardarTMC');
  const timcList = document.getElementById('timc-list');

  function actualizarVistaTIMC() {
    const anio = filtroAnio.value || new Date().getFullYear();
    document.querySelector('#timc-display h4').textContent = `TIMC Mensual (${anio})`;
    timcList.innerHTML = '';
    const anioData = timcData[anio] || {};
    meses.forEach((mes, index) => {
        const timcValor = anioData[index + 1] ? `${(anioData[index + 1] * 100).toFixed(1)}%` : 'N/A';
        timcList.innerHTML += `<div><b>${mes}:</b> ${timcValor}</div>`;
    });
  }

  btnGuardarTMC.addEventListener('click', () => {
    const tmcAnual = parseFloat(inputTMC.value);
    const mes = selectMesTMC.value;
    const anio = filtroAnio.value;
    if (isNaN(tmcAnual) || !mes || !anio) {
        mostrarMensaje('Debe ingresar un valor TMC, seleccionar un mes y un año.', 'error');
        return;
    }
    if (!timcData[anio]) timcData[anio] = {};
    timcData[anio][mes] = tmcAnual / 100; // Guardar como 0.055
    
    // TODO: GUARDAR EN GOOGLE SHEETS
    // Aquí iría tu función para actualizar la celda correspondiente en la hoja "Pagos_GC"
    console.log(`Guardando TIMC para ${meses[mes-1]} ${anio}: ${tmcAnual}%`);
    mostrarMensaje(`TIMC de ${tmcAnual}% guardado para ${meses[mes-1]} del ${anio}.`, 'success');
    
    inputTMC.value = '';
    actualizarVistaTIMC();
    filtrarYRenderizar(); // Recalcular la tabla con el nuevo TIMC
  });

  // --- Lógica de renderizado de la tabla principal ---
  function filtrarYRenderizar() {
    const parcela = filtroParcela.value;
    const anio = filtroAnio.value;

    if (!parcela || !anio) {
        tbodyGastos.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:20px;">Seleccione una parcela y año para ver los datos.</td></tr>`;
        return;
    }
    
    const residente = residentes.find(r => r[3] == parcela);
    if (!residente) {
        tbodyGastos.innerHTML = `<tr><td colspan="14" style="text-align:center; padding:20px;">No se encontró un residente para la parcela ${parcela}.</td></tr>`;
        return;
    }

    tbodyGastos.innerHTML = ''; // Limpiar tabla
    const nombreResidente = residente[1];
    const valorGastoComun = parseFloat(residente[8]);

    // Generar las 12 filas del año
    meses.forEach((mes, index) => {
        const mesNumero = index + 1;
        const fechaVencimiento = new Date(anio, mesNumero, 10);
        const hoy = new Date();
        
        const pagoRegistrado = pagosGC.find(p => p.N_Parcela == parcela && p.Periodo === mes && p.anio == anio);
        
        // --- Cálculos de Lógica Financiera ---
        let interes = 0;
        let multa = 0;
        let mesesImpagos = 0;
        
        const atrasado = hoy > fechaVencimiento && !pagoRegistrado;

        if (atrasado) {
            // 1. Cálculo de Meses Impagos
            mesesImpagos = (hoy.getFullYear() - fechaVencimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaVencimiento.getMonth());
            if (hoy.getDate() > 10) mesesImpagos++;

            // 2. Cálculo de Interés (se aplica solo una vez)
            const timcMes = (timcData[anio] && timcData[anio][mesNumero]) ? timcData[anio][mesNumero] : 0;
            interes = valorGastoComun * timcMes; // Asumiendo que TMC ya es mensual
            // Interes = valorGastoComun * (timcAnual / 12)

            // 3. Cálculo de Multa (acumulativa)
            multa = (valorGastoComun / 4) * mesesImpagos;
        }

        const deudaTotal = valorGastoComun + interes + multa;
        const montoPagado = pagoRegistrado ? pagoRegistrado.Monto_Pagado : 0;
        const saldo = montoPagado - deudaTotal;

        // --- Determinación del Estado ---
        let estado = 'Pendiente';
        if (pagoRegistrado) {
            estado = 'Pagado';
        } else if (atrasado) {
            estado = 'Moroso';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nombreResidente}</td>
            <td>${parcela}</td>
            <td>$${valorGastoComun.toLocaleString('es-CL')}</td>
            <td>${mes} ${anio}</td>
            <td>${fechaVencimiento.toLocaleDateString('es-CL')}</td>
            <td>$${montoPagado.toLocaleString('es-CL')}</td>
            <td style="color: ${saldo < 0 ? 'red' : 'green'};">$${saldo.toLocaleString('es-CL')}</td>
            <td>$${interes.toLocaleString('es-CL', {minimumFractionDigits: 2})}</td>
            <td>$${multa.toLocaleString('es-CL', {minimumFractionDigits: 2})}</td>
            <td>${mesesImpagos}</td>
            <td style="font-weight: bold;">$${deudaTotal.toLocaleString('es-CL', {minimumFractionDigits: 2})}</td>
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
  const inputNombreResidente = document.getElementById('inputNombreResidente');
  const inputValorGastoComun = document.getElementById('inputValorGastoComun');

  document.getElementById('btnAbrirModalGasto').addEventListener('click', () => {
    modal.style.display = 'flex';
  });
  document.getElementById('btnCerrarModal').addEventListener('click', () => {
    modal.style.display = 'none';
  });

  inputNParcela.addEventListener('input', (e) => {
      const parcela = e.target.value;
      const residente = residentes.find(r => r[3] == parcela);
      if (residente) {
          inputNombreResidente.value = residente[1];
          inputValorGastoComun.value = parseFloat(residente[8]).toLocaleString('es-CL', {style: 'currency', currency: 'CLP'});
      } else {
          inputNombreResidente.value = '';
          inputValorGastoComun.value = '';
      }
  });

  document.getElementById('formGastoComun').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const datosGasto = Object.fromEntries(formData.entries());
    
    // Añadir el año para poder filtrar correctamente
    datosGasto.anio = new Date(datosGasto.Fecha_Pago).getFullYear();
    datosGasto.N_Parcela = parseInt(datosGasto.N_Parcela);
    datosGasto.Monto_Pagado = parseFloat(datosGasto.Monto_Pagado);

    // TODO: IMPLEMENTAR GUARDADO EN GOOGLE SHEETS Y DRIVE
    // 1. Llama a tu función para guardar los datos del formulario en la hoja "Pagos_GC".
    //    await guardarEnHojaPagosGC(datosGasto);
    // 2. Si hay un archivo, llama a tu función para subirlo a la carpeta de Drive.
    //    if(datosGasto.Comprobante.size > 0) {
    //        await subirArchivoADrive(datosGasto.N_Parcela, datosGasto.Comprobante);
    //    }

    console.log("Datos a guardar:", datosGasto);
    pagosGC.push(datosGasto); // Simulación local
    
    mostrarMensaje('Gasto común registrado con éxito.', 'success');
    modal.style.display = 'none';
    e.target.reset();
    filtrarYRenderizar();
  });


  // --- Eventos Iniciales ---
  filtroParcela.addEventListener('input', filtrarYRenderizar);
  filtroAnio.addEventListener('input', () => {
      actualizarVistaTIMC();
      filtrarYRenderizar();
  });

  // Carga inicial
  actualizarVistaTIMC();
  ocultarSpinner();
}

// Para que el menú lateral pueda llamar a la función
document.querySelector('[data-module="gastos_comunes"]').addEventListener('click', cargarGastosComunes);
