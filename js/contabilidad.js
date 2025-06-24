// js/contabilidad.js

// --- Utilidad para exportar a Excel ---
function exportarTablaAExcel(tableID, filename = ''){
    let downloadLink;
    const dataType = 'application/vnd.ms-excel';
    const tableSelect = document.getElementById(tableID);
    if(!tableSelect) {
        return mostrarMensaje('No se encontró la tabla para exportar.', 'error');
    }
    const tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');
    
    filename = filename?filename+'.xls':'excel_data.xls';
    
    downloadLink = document.createElement("a");
    
    document.body.appendChild(downloadLink);
    
    if(navigator.msSaveOrOpenBlob){
        const blob = new Blob(['\ufeff', tableHTML], { type: dataType });
        navigator.msSaveOrOpenBlob( blob, filename);
    }else{
        downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
        downloadLink.download = filename;
        downloadLink.click();
    }
}


// --- Función principal del módulo ---
async function cargarContabilidad() {
  limpiarMainContent();
  mostrarSpinner();

  // MODIFICADO: Se añade 'categoriasEgresos' a la carga de datos inicial
  let allPagos = [], allEgresos = [], config = {}, categoriasEgresos = [];
  try {
    [allPagos, allEgresos, config, categoriasEgresos] = await Promise.all([
        obtenerPagosGC(),
        obtenerEgresos(),
        obtenerConfiguracion(),
        obtenerCategoriasEgresos() // <-- Se llama a la nueva función
    ]);
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }
  
  const proveedoresUnicos = allEgresos.reduce((acc, egreso) => {
    const nombre = egreso[4]; // Columna E: Proveedor
    const rut = egreso[5];    // Columna F: Rut_Proveedor
    if (nombre) {
      acc[nombre.toLowerCase().trim()] = { nombre: nombre.trim(), rut: rut || '' };
    }
    return acc;
  }, {});

  const main = document.getElementById('main-content');
  const fechaSaldoInicial = config.Fecha_Saldo_Inicial ? new Date(config.Fecha_Saldo_Inicial.replace(/-/g, '/')).toLocaleDateString('es-CL') : 'No establecida';

  main.innerHTML = `
    <style>
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 2rem; }
      .summary-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .summary-card h4 { margin-top: 0; font-size: 1rem; color: #6c757d; }
      .summary-card .amount { font-size: 1.75rem; font-weight: 700; }
      #chart-container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .view-toggle { display: flex; gap: 10px; margin-bottom: 1rem; }
      .view-toggle label { background: #eee; padding: 8px 15px; border-radius: 20px; cursor: pointer; transition: all 0.2s; }
      .view-toggle input { display: none; }
      .view-toggle input:checked + label { background: #007bff; color: white; font-weight: bold; }
      .suggestion-item { padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #eee; background: white; }
      .suggestion-item:hover, .suggestion-item.active { background-color: #e9f1fb; }
      .suggestion-item:last-child { border-bottom: none; }
    </style>
    <h2>Contabilidad y Flujo de Caja</h2>

    <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 2rem;">
        <div class="widget" style="flex: 1; min-width: 320px;">
            <h4 style="margin-top:0;">Filtros</h4>
            <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-end;">
                <div><label>Fecha de Inicio</label><input type="date" id="fechaInicio"></div>
                <div><label>Fecha de Fin</label><input type="date" id="fechaFin"></div>
                <button class="btn" id="btnFiltrar">Filtrar</button>
            </div>
        </div>
        <div class="widget" style="flex: 2; min-width: 400px;">
            <h4 style="margin-top:0;">Configuración Contable</h4>
            <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-end;">
                <div>
                    <label><b>Saldo Inicial de Caja</b></label>
                    <input type="number" id="inputSaldoInicial" value="${parseFloat(config.Saldo_Inicial_Caja || 0)}" disabled>
                </div>
                <div>
                    <label><b>Fecha de Saldo</b></label>
                    <span id="fecha-saldo-display" style="display: inline-block; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: #eee;">${fechaSaldoInicial}</span>
                    <input type="date" id="inputFechaSaldo" value="${config.Fecha_Saldo_Inicial || ''}" style="display:none;">
                </div>
                <div>
                    <button class="btn secondary" id="btnEditarSaldo">Editar</button>
                    <button class="btn" id="btnGuardarSaldo" style="display:none;">Guardar</button>
                </div>
            </div>
        </div>
    </div>

    <div class="summary-grid">
        <div class="summary-card"><h4 >Saldo Inicial Período</h4><div id="saldo-inicial-periodo" class="amount text-info">$0</div></div>
        <div class="summary-card"><h4>Ingresos del Período</h4><div id="ingresos-periodo" class="amount text-success">$0</div></div>
        <div class="summary-card"><h4>Egresos del Período</h4><div id="egresos-periodo" class="amount text-danger">$0</div></div>
        <div class="summary-card"><h4>Saldo Final Período</h4><div id="saldo-final-periodo" class="amount text-primary">$0</div></div>
    </div>
    
    <div style="display:flex; flex-wrap:wrap; gap: 24px; margin-top:2rem;">
        <div id="chart-container-ingresos" class="widget" style="flex:1; min-width: 300px;">
            <h4 style="margin-top:0;">Ingresos por Concepto</h4>
            <canvas id="graficoIngresos" style="max-height: 300px;"></canvas>
        </div>
        <div id="chart-container-egresos" class="widget" style="flex:1; min-width: 300px;">
            <h4 style="margin-top:0;">Egresos por Categoría</h4>
            <canvas id="graficoEgresos" style="max-height: 300px;"></canvas>
        </div>
    </div>

    <div class="widget" style="margin-top: 2rem;">
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin-top:0; margin-bottom:0;">Detalle de Movimientos</h3>
            <div class="view-toggle" id="detalle-view-toggle">
                <input type="radio" id="verIngresos" name="vistaDetalle" value="ingresos" checked><label for="verIngresos">Ingresos</label>
                <input type="radio" id="verEgresos" name="vistaDetalle" value="egresos"><label for="verEgresos">Egresos</label>
            </div>
        </div>
        <div id="tablaIngresosContainer">
            <div style="display:flex; justify-content: space-between; align-items: center;">
                <h4>Ingresos</h4>
                <button class="btn secondary btn-sm" id="btnExportarIngresos">Exportar a Excel</button>
            </div>
            <div id="tablaIngresos" style="overflow-x:auto; margin-top:0.5rem;"></div>
        </div>
        <div id="tablaEgresosContainer" style="margin-top:1.5rem;">
            <div style="display:flex; justify-content: space-between; align-items: center;">
                <h4>Egresos</h4>
                <div>
                  <button class="btn" id="btnAgregarEgreso">Agregar Egreso</button>
                  <button class="btn secondary btn-sm" id="btnExportarEgresos">Exportar a Excel</button>
                </div>
            </div>
            <div id="tablaEgresos" style="overflow-x:auto; margin-top:0.5rem;"></div>
        </div>
    </div>

    <div id="modalEgreso" class="modal" style="display:none;">
      <div>
        <h3>Agregar Nuevo Egreso</h3>
        <form id="formEgreso" style="display:flex; flex-wrap:wrap; gap:15px;">
            <div style="flex: 1 1 180px;"><label>Fecha</label><input type="date" name="fecha" required></div>
            
            <div style="flex: 1 1 180px;"><label>Categoría</label>
                <select name="categoria" required>
                    <option value="" disabled selected>-- Seleccione --</option>
                    ${categoriasEgresos.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>

            <div style="flex: 1 1 100%;"><label>Descripción</label><input type="text" name="descripcion" required></div>
            <div style="display:flex; gap: 15px; flex-basis: 100%; flex-wrap: wrap; position: relative;">
                <div style="flex: 2 1 300px;"><label>Proveedor / Beneficiario</label><input type="text" name="proveedor" autocomplete="off" required>
                    <div id="proveedor-suggestions" style="display: none; position: absolute; background-color: white; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; width: calc(100% - 170px); z-index: 10;"></div>
                </div>
                <div style="flex: 1 1 150px;"><label>RUT Proveedor</label><input type="text" name="rut_proveedor"></div>
            </div>
            <div style="flex: 1 1 180px;"><label>Monto</label><input type="number" name="monto" min="0" step="1" required></div>
            <div style="flex: 1 1 180px;"><label>Método de Pago</label>
                <select name="metodo_pago" required>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Servipag">Servipag</option>
                    <option value="Webpay">Webpay</option>
                </select>
            </div>
            <div style="flex: 1 1 100%;"><label>Comprobante(s)</label><input type="file" name="comprobante" multiple></div>
            <div style="flex: 1 1 100%; text-align: right; margin-top: 20px;">
                <button class="btn secondary" type="button" id="btnCerrarModalEgreso">Cancelar</button>
                <button class="btn" type="submit">Guardar Egreso</button>
            </div>
        </form>
      </div>
    </div>
  `;

    let chartIngresosInstance = null;
    let chartEgresosInstance = null;

    function renderizarContabilidad(pagos, egresos, saldoInicialGlobal) {
        const fechaInicioFiltro = document.getElementById('fechaInicio').valueAsDate;
        let saldoInicialPeriodo = saldoInicialGlobal;
        if(fechaInicioFiltro) {
            fechaInicioFiltro.setHours(0,0,0,0);
            const ingresosPrevios = allPagos
                .filter(p => p[13] && new Date(p[13].replace(/-/g, '/')) < fechaInicioFiltro)
                .reduce((sum, p) => sum + parseFloat(p[6] || 0) + parseFloat(p[17] || 0), 0);
            const egresosPrevios = allEgresos
                .filter(e => e[1] && new Date(e[1].replace(/-/g, '/')) < fechaInicioFiltro)
                .reduce((sum, e) => sum + parseFloat(e[6] || 0), 0);
            saldoInicialPeriodo = saldoInicialGlobal + ingresosPrevios - egresosPrevios;
        }

        const totalIngresos = pagos.reduce((sum, p) => sum + parseFloat(p[6] || 0) + parseFloat(p[17] || 0), 0);
        const totalEgresos = egresos.reduce((sum, e) => sum + parseFloat(e[6] || 0), 0);
        const saldoFinalPeriodo = saldoInicialPeriodo + totalIngresos - totalEgresos;

        document.getElementById('saldo-inicial-periodo').textContent = `$${saldoInicialPeriodo.toLocaleString('es-CL')}`;
        document.getElementById('ingresos-periodo').textContent = `$${totalIngresos.toLocaleString('es-CL')}`;
        document.getElementById('egresos-periodo').textContent = `$${totalEgresos.toLocaleString('es-CL')}`;
        document.getElementById('saldo-final-periodo').textContent = `$${saldoFinalPeriodo.toLocaleString('es-CL')}`;

        const tablaIngresosDiv = document.getElementById('tablaIngresos');
        tablaIngresosDiv.innerHTML = '<p>No hay ingresos en el período seleccionado.</p>';
        if (pagos.length > 0) {
            let ingresosHTML = '<table id="tabla-ingresos-export" class="table"><thead><tr><th>Fecha</th><th>Residente</th><th>Parcela</th><th>Período</th><th>Monto G.C.</th><th>Abono Convenio</th></tr></thead><tbody>';
            pagos.sort((a,b) => new Date(a[13]) - new Date(b[13])).forEach(p => {
                ingresosHTML += `<tr><td>${new Date(p[13].replace(/-/g, '/')).toLocaleDateString('es-CL')}</td><td>${p[1]}</td><td>${p[2]}</td><td>${p[4]}</td><td>$${parseFloat(p[6] || 0).toLocaleString('es-CL')}</td><td>$${parseFloat(p[17] || 0).toLocaleString('es-CL')}</td></tr>`;
            });
            ingresosHTML += '</tbody></table>';
            tablaIngresosDiv.innerHTML = ingresosHTML;
        }

        const tablaEgresosDiv = document.getElementById('tablaEgresos');
        tablaEgresosDiv.innerHTML = '<p>No hay egresos en el período seleccionado.</p>';
        if (egresos.length > 0) {
            let egresosHTML = '<table id="tabla-egresos-export" class="table"><thead><tr><th>Fecha</th><th>Proveedor</th><th>RUT</th><th>Categoría</th><th>Monto</th><th>Método Pago</th><th>Comprobante</th></tr></thead><tbody>';
            egresos.sort((a,b) => new Date(a[1]) - new Date(b[1])).forEach(e => {
                let linksHtml = "N/A";
                if (e[7]) {
                    const links = e[7].split(',');
                    linksHtml = links.map((link, index) => `<a href="${link.trim()}" target="_blank" class="btn small">Ver ${index + 1}</a>`).join(' ');
                }
                egresosHTML += `<tr><td>${new Date(e[1].replace(/-/g, '/')).toLocaleDateString('es-CL')}</td><td>${e[4]}</td><td>${e[5] || ''}</td><td>${e[2]}</td><td>$${parseFloat(e[6] || 0).toLocaleString('es-CL')}</td><td>${e[8] || 'N/A'}</td><td>${linksHtml}</td></tr>`;
            });
            egresosHTML += '</tbody></table>';
            tablaEgresosDiv.innerHTML = egresosHTML;
        }
        
        // Gráfico de Ingresos
        const ingresosPorConcepto = pagos.reduce((acc, p) => {
            acc['Gastos Comunes'] = (acc['Gastos Comunes'] || 0) + parseFloat(p[6] || 0);
            if(parseFloat(p[17] || 0) > 0) acc['Abonos Convenio'] = (acc['Abonos Convenio'] || 0) + parseFloat(p[17] || 0);
            return acc;
        }, {});
        
        const chartIngresosContainer = document.getElementById('chart-container-ingresos');
        const canvasIngresos = document.getElementById('graficoIngresos');
        const noDataIngresos = chartIngresosContainer.querySelector('p');
        if(noDataIngresos) noDataIngresos.remove();
        
        if (chartIngresosInstance) chartIngresosInstance.destroy();
        if(Object.values(ingresosPorConcepto).some(v => v > 0)){
            canvasIngresos.style.display = 'block';
            chartIngresosInstance = new Chart(canvasIngresos.getContext('2d'), {
                type: 'pie', data: { labels: Object.keys(ingresosPorConcepto), datasets: [{ data: Object.values(ingresosPorConcepto), backgroundColor: ['#4e91f9', '#f6d743'] }] }, options: { responsive: true, plugins: { legend: { position: 'right' } } }
            });
        } else {
            canvasIngresos.style.display = 'none';
            if (!chartIngresosContainer.querySelector('p')) chartIngresosContainer.insertAdjacentHTML('beforeend', '<p>No hay datos de ingresos para graficar.</p>');
        }

        // Gráfico de Egresos
        const egresosPorCategoria = egresos.reduce((acc, e) => {
            const categoria = e[2] || 'Sin Categoría';
            const monto = parseFloat(e[6] || 0);
            acc[categoria] = (acc[categoria] || 0) + monto;
            return acc;
        }, {});

        const chartEgresosContainer = document.getElementById('chart-container-egresos');
        const canvasEgresos = document.getElementById('graficoEgresos');
        
        if (chartEgresosInstance) chartEgresosInstance.destroy();
        const noDataMessage = chartEgresosContainer.querySelector('p');
        if (noDataMessage) noDataMessage.remove();
        
        if (Object.keys(egresosPorCategoria).length > 0) {
            canvasEgresos.style.display = 'block';
            chartEgresosInstance = new Chart(canvasEgresos.getContext('2d'), {
                type: 'pie', data: { labels: Object.keys(egresosPorCategoria), datasets: [{ data: Object.values(egresosPorCategoria), backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#20c997', '#0dcaf0', '#6f42c1'] }] }, options: { responsive: true, plugins: { legend: { position: 'right' } } }
            });
        } else {
             canvasEgresos.style.display = 'none';
             if (!chartEgresosContainer.querySelector('p')) chartEgresosContainer.insertAdjacentHTML('beforeend', '<p>No hay datos de egresos para graficar.</p>');
        }
    }

    function filtrarYRenderizar() {
        let fechaInicio = document.getElementById('fechaInicio').value;
        let fechaFin = document.getElementById('fechaFin').value;
        const saldoInicialGlobal = parseFloat(config.Saldo_Inicial_Caja || 0);

        const pagosFiltrados = allPagos.filter(p => {
            const fechaPago = p[13];
            if (!fechaPago) return false;
            return (!fechaInicio || fechaPago >= fechaInicio) && (!fechaFin || fechaPago <= fechaFin);
        });
        const egresosFiltrados = allEgresos.filter(e => {
            const fechaEgreso = e[1];
            if (!fechaEgreso) return false;
            return (!fechaInicio || fechaEgreso >= fechaEgreso) && (!fechaFin || fechaEgreso <= fechaFin);
        });

        renderizarContabilidad(pagosFiltrados, egresosFiltrados, saldoInicialGlobal);
    }
    
    // Listeners
    document.getElementById('btnFiltrar').addEventListener('click', filtrarYRenderizar);
    document.getElementById('btnGuardarSaldo').addEventListener('click', async () => {
        const saldoInput = document.getElementById('inputSaldoInicial');
        const fechaInput = document.getElementById('inputFechaSaldo');
        const nuevoSaldo = saldoInput.value;
        const nuevaFecha = fechaInput.value;
        if (isNaN(parseFloat(nuevoSaldo)) || !nuevaFecha) {
            return mostrarMensaje("Debe ingresar un monto y una fecha para el saldo inicial.", "error");
        }
        mostrarSpinner();
        try {
            await Promise.all([
                actualizarConfiguracion('Saldo_Inicial_Caja', nuevoSaldo),
                actualizarConfiguracion('Fecha_Saldo_Inicial', nuevaFecha)
            ]);
            config.Saldo_Inicial_Caja = nuevoSaldo;
            config.Fecha_Saldo_Inicial = nuevaFecha;
            
            saldoInput.disabled = true;
            fechaInput.style.display = 'none';
            document.getElementById('fecha-saldo-display').textContent = new Date(nuevaFecha.replace(/-/g, '/')).toLocaleDateString('es-CL');
            document.getElementById('fecha-saldo-display').style.display = 'inline-block';
            document.getElementById('btnGuardarSaldo').style.display = 'none';
            document.getElementById('btnEditarSaldo').style.display = 'inline-block';
            
            filtrarYRenderizar();
            mostrarMensaje("Saldo inicial actualizado con éxito.", "success");
        } catch(e) {
            mostrarMensaje("Error al guardar el saldo: " + e.message, "error");
        } finally {
            ocultarSpinner();
        }
    });

    document.getElementById('btnEditarSaldo').addEventListener('click', (e) => {
        e.target.style.display = 'none';
        document.getElementById('btnGuardarSaldo').style.display = 'inline-block';
        document.getElementById('inputSaldoInicial').disabled = false;
        document.getElementById('fecha-saldo-display').style.display = 'none';
        document.getElementById('inputFechaSaldo').style.display = 'inline-block';
    });

    document.getElementById('btnExportarIngresos').addEventListener('click', () => exportarTablaAExcel('tabla-ingresos-export', 'Ingresos'));
    document.getElementById('btnExportarEgresos').addEventListener('click', () => exportarTablaAExcel('tabla-egresos-export', 'Egresos'));

    const modalEgreso = document.getElementById('modalEgreso');
    const formEgreso = document.getElementById('formEgreso');
    document.getElementById('btnAgregarEgreso').addEventListener('click', () => modalEgreso.style.display = 'flex');
    document.getElementById('btnCerrarModalEgreso').addEventListener('click', () => {
        modalEgreso.style.display = 'none';
        formEgreso.reset();
    });
    
    document.getElementById('detalle-view-toggle').addEventListener('change', (e) => {
        const vista = e.target.value;
        const ingresosContainer = document.getElementById('tablaIngresosContainer');
        const egresosContainer = document.getElementById('tablaEgresosContainer');
        if (vista === 'ingresos') { ingresosContainer.style.display = 'block'; egresosContainer.style.display = 'none'; } 
        else if (vista === 'egresos') { ingresosContainer.style.display = 'none'; egresosContainer.style.display = 'block'; } 
        else { ingresosContainer.style.display = 'block'; egresosContainer.style.display = 'block'; }
    });

    formEgreso.addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarSpinner();
        try {
            const formData = new FormData(e.target);
            const archivos = formData.getAll('comprobante');
            const linksComprobantes = [];

            if (archivos && archivos.length > 0 && archivos[0].size > 0) {
                if (typeof buscarOCrearCarpetaDeParcela !== 'function' || typeof subirComprobante !== 'function') {
                    throw new Error("Las funciones de Google Drive no están disponibles.");
                }
                const carpetaId = await buscarOCrearCarpetaDeParcela("Egresos Contabilidad");
                for (const archivo of archivos) {
                    const resultadoSubida = await subirComprobante(archivo, carpetaId);
                    linksComprobantes.push(resultadoSubida.webViewLink);
                }
            }
            
            const datosEgreso = [
                null,
                formData.get('fecha'),
                formData.get('categoria'),
                formData.get('descripcion'),
                formData.get('proveedor'),
                formData.get('rut_proveedor'),
                formData.get('monto'),
                linksComprobantes.join(','),
                formData.get('metodo_pago')
            ];
            
            await agregarEgreso(datosEgreso);
            mostrarMensaje("Egreso agregado con éxito.", "success");
            formEgreso.reset();
            modalEgreso.style.display = 'none';
            cargarContabilidad();

        } catch (err) {
            mostrarMensaje("Error al guardar el egreso: " + err.message, "error");
        } finally {
            ocultarSpinner();
        }
    });
    
    const proveedorInput = document.querySelector('#formEgreso input[name="proveedor"]');
    const rutInput = document.querySelector('#formEgreso input[name="rut_proveedor"]');
    const suggestionsContainer = document.getElementById('proveedor-suggestions');
    let activeSuggestion = -1;

    proveedorInput.addEventListener('input', () => {
        const searchTerm = proveedorInput.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        activeSuggestion = -1;
        if (searchTerm.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        const matches = Object.values(proveedoresUnicos).filter(p => p.nombre.toLowerCase().includes(searchTerm));
        if (matches.length > 0) {
            matches.forEach(p => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = p.nombre;
                item.addEventListener('click', () => {
                    proveedorInput.value = p.nombre;
                    rutInput.value = p.rut;
                    suggestionsContainer.style.display = 'none';
                });
                suggestionsContainer.appendChild(item);
            });
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });

    proveedorInput.addEventListener('keydown', (e) => {
        const items = suggestionsContainer.querySelectorAll('.suggestion-item');
        if (items.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSuggestion = (activeSuggestion + 1) % items.length;
            updateSuggestionHighlight(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSuggestion = (activeSuggestion - 1 + items.length) % items.length;
            updateSuggestionHighlight(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeSuggestion > -1) {
                items[activeSuggestion].click();
            }
            suggestionsContainer.style.display = 'none';
        }
    });

    function updateSuggestionHighlight(items) {
        items.forEach((item, index) => {
            item.classList.toggle('active', index === activeSuggestion);
        });
    }

    document.addEventListener('click', (e) => {
        if (!proveedorInput.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Carga inicial y configuración de vista por defecto
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    document.getElementById('fechaInicio').value = primerDiaMes;
    document.getElementById('fechaFin').value = ultimoDiaMes;
    filtrarYRenderizar();
    document.getElementById('verIngresos').dispatchEvent(new Event('change', { bubbles: true }));

    ocultarSpinner();
}

document.querySelector('[data-module="contabilidad"]').addEventListener('click', cargarContabilidad);
