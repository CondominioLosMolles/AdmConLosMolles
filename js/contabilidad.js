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

  let allPagos = [], allEgresos = [], config = {};
  try {
    [allPagos, allEgresos, config] = await Promise.all([
        obtenerPagosGC(),
        obtenerEgresos(),
        obtenerConfiguracion()
    ]);
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <style>
      .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 2rem; }
      .summary-card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .summary-card h4 { margin-top: 0; font-size: 1rem; color: #6c757d; }
      .summary-card .amount { font-size: 1.75rem; font-weight: 700; }
      #chart-container { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .contabilidad-header { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
    </style>
    <h2>Contabilidad y Flujo de Caja</h2>

    <div class="contabilidad-header">
        <div class="widget" style="flex: 1; min-width: 320px;">
            <h4 style="margin-top:0;">Filtros</h4>
            <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-end;">
                <div><label>Fecha de Inicio</label><input type="date" id="fechaInicio"></div>
                <div><label>Fecha de Fin</label><input type="date" id="fechaFin"></div>
                <button class="btn" id="btnFiltrar">Filtrar</button>
            </div>
        </div>

        <div class="widget" style="flex: 2; min-width: 450px;">
            <h4 style="margin-top:0;">Registrar Egreso</h4>
            <form id="formEgreso" style="display:flex; flex-wrap:wrap; gap:15px;">
                <div style="flex: 1 1 150px;"><label>Fecha</label><input type="date" name="fecha" required></div>
                <div style="flex: 1 1 150px;"><label>Monto</label><input type="number" name="monto" min="0" step="1" required></div>
                <div style="flex: 1 1 150px;"><label>Categoría</label>
                    <select name="categoria" required>
                        <option value="Remuneraciones">Remuneraciones</option>
                        <option value="Reparaciones y Mantención">Reparaciones y Mantención</option>
                        <option value="Cuentas Básicas">Cuentas Básicas (Luz, Agua)</option>
                        <option value="Administración">Administración</option>
                        <option value="Insumos">Insumos (Limpieza, oficina)</option>
                        <option value="Jardinería">Jardinería</option>
                        <option value="Imprevistos">Imprevistos</option>
                        <option value="Otros">Otros</option>
                    </select>
                </div>
                <div style="flex: 1 1 100%;"><label>Proveedor / Beneficiario</label><input type="text" name="proveedor" required></div>
                <div style="flex: 1 1 100%;"><label>Descripción</label><input type="text" name="descripcion" required></div>
                <div style="flex: 1 1 180px;"><label>N° Documento</label><input type="text" name="n_doc"></div>
                <div style="flex: 1 1 220px;"><label>Comprobante</label><input type="file" name="comprobante"></div>
                <div style="flex: 1 1 100%; text-align: right;">
                    <button class="btn" type="submit">Agregar Gasto</button>
                </div>
            </form>
        </div>
    </div>

    <div class="summary-grid" style="margin-top:2rem;">
        <div class="summary-card"><h4 >Saldo Inicial Período</h4><div id="saldo-inicial-periodo" class="amount text-info">$0</div></div>
        <div class="summary-card"><h4>Ingresos del Período</h4><div id="ingresos-periodo" class="amount text-success">$0</div></div>
        <div class="summary-card"><h4>Egresos del Período</h4><div id="egresos-periodo" class="amount text-danger">$0</div></div>
        <div class="summary-card"><h4>Saldo Final Período</h4><div id="saldo-final-periodo" class="amount text-primary">$0</div></div>
    </div>
    
    <div style="display:flex; flex-wrap:wrap; gap: 24px;">
        <div id="chart-container" style="flex:1; min-width: 300px;">
            <h4 style="margin-top:0;">Egresos por Categoría</h4>
            <canvas id="graficoEgresos" style="max-height: 300px;"></canvas>
        </div>
        <div class="widget" style="flex:1; min-width: 300px;">
            <h4 style="margin-top:0;">Configuración Contable</h4>
            <div><label><b>Saldo Inicial de Caja</b></label></div>
            <div style="display:flex; gap:10px;">
                <input type="number" id="inputSaldoInicial" value="${parseFloat(config.Saldo_Inicial_Caja || 0)}">
                <button class="btn" id="btnGuardarSaldo">Guardar</button>
            </div>
            <small>Este es el punto de partida para todo el flujo de caja.</small>
        </div>
    </div>

    <div class="widget" style="margin-top: 2rem;">
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin-top:0; margin-bottom:0;">Detalle de Ingresos</h3>
            <button class="btn secondary btn-sm" id="btnExportarIngresos">Exportar a Excel</button>
        </div>
        <div id="tablaIngresos" style="overflow-x:auto;"></div>
    </div>
    <div class="widget" style="margin-top: 2rem;">
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="margin-top:0; margin-bottom:0;">Detalle de Egresos</h3>
            <button class="btn secondary btn-sm" id="btnExportarEgresos">Exportar a Excel</button>
        </div>
        <div id="tablaEgresos" style="overflow-x:auto;"></div>
    </div>
  `;

    let chartInstance = null;

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
            let egresosHTML = '<table id="tabla-egresos-export" class="table"><thead><tr><th>Fecha</th><th>N° Doc.</th><th>Proveedor</th><th>Categoría</th><th>Descripción</th><th>Monto</th><th>Comprobante</th></tr></thead><tbody>';
            egresos.sort((a,b) => new Date(a[1]) - new Date(b[1])).forEach(e => {
                const link = e[7] ? `<a href="${e[7]}" target="_blank" class="btn small">Ver</a>` : "N/A";
                egresosHTML += `<tr><td>${new Date(e[1].replace(/-/g, '/')).toLocaleDateString('es-CL')}</td><td>${e[2]}</td><td>${e[3]}</td><td>${e[4]}</td><td>${e[5]}</td><td>$${parseFloat(e[6] || 0).toLocaleString('es-CL')}</td><td>${link}</td></tr>`;
            });
            egresosHTML += '</tbody></table>';
            tablaEgresosDiv.innerHTML = egresosHTML;
        }
        
        const egresosPorCategoria = egresos.reduce((acc, e) => {
            const categoria = e[4] || 'Sin Categoría';
            const monto = parseFloat(e[6] || 0);
            acc[categoria] = (acc[categoria] || 0) + monto;
            return acc;
        }, {});

        const chartContainer = document.getElementById('chart-container');
        const canvas = document.getElementById('graficoEgresos');
        
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        
        // Limpiar mensajes anteriores si existieran
        const noDataMessage = chartContainer.querySelector('p');
        if (noDataMessage) {
            noDataMessage.remove();
        }
        
        if (Object.keys(egresosPorCategoria).length > 0) {
            canvas.style.display = 'block';
            chartInstance = new Chart(canvas.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: Object.keys(egresosPorCategoria),
                    datasets: [{
                        data: Object.values(egresosPorCategoria),
                        backgroundColor: ['#4e91f9', '#7fd6c2', '#f6d743', '#f9a38b', '#a3a1fb', '#8bcf9e', '#f17979', '#a2d2ff'],
                    }]
                },
                options: { responsive: true, plugins: { legend: { position: 'right' } } }
            });
        } else {
             canvas.style.display = 'none';
             chartContainer.insertAdjacentHTML('beforeend', '<p>No hay datos de egresos para graficar en este período.</p>');
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
            return (!fechaInicio || fechaEgreso >= fechaInicio) && (!fechaFin || fechaEgreso <= fechaFin);
        });

        renderizarContabilidad(pagosFiltrados, egresosFiltrados, saldoInicialGlobal);
    }
    
    // Listeners
    document.getElementById('btnFiltrar').addEventListener('click', filtrarYRenderizar);
    document.getElementById('btnGuardarSaldo').addEventListener('click', async () => {
        const nuevoSaldo = document.getElementById('inputSaldoInicial').value;
        if (isNaN(parseFloat(nuevoSaldo))) {
            return mostrarMensaje("Por favor, ingrese un valor numérico para el saldo.", "error");
        }
        mostrarSpinner();
        try {
            await actualizarConfiguracion('Saldo_Inicial_Caja', nuevoSaldo);
            config.Saldo_Inicial_Caja = nuevoSaldo;
            filtrarYRenderizar();
            mostrarMensaje("Saldo inicial actualizado con éxito.", "success");
        } catch(e) {
            mostrarMensaje("Error al guardar el saldo: " + e.message, "error");
        } finally {
            ocultarSpinner();
        }
    });

    document.getElementById('btnExportarIngresos').addEventListener('click', () => exportarTablaAExcel('tabla-ingresos-export', 'Ingresos'));
    document.getElementById('btnExportarEgresos').addEventListener('click', () => exportarTablaAExcel('tabla-egresos-export', 'Egresos'));

    document.getElementById('formEgreso').addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarSpinner();
        try {
            const formData = new FormData(e.target);
            let linkComprobante = '';
            const archivo = formData.get('comprobante');

            if (archivo && archivo.size > 0) {
                if (typeof buscarOCrearCarpetaDeParcela !== 'function' || typeof subirComprobante !== 'function') {
                    throw new Error("Las funciones de Google Drive no están disponibles.");
                }
                // MODIFICADO: Se especifica una carpeta de Drive más clara.
                const carpetaId = await buscarOCrearCarpetaDeParcela("Egresos Contabilidad");
                const resultadoSubida = await subirComprobante(archivo, carpetaId);
                linkComprobante = resultadoSubida.webViewLink;
            }
            
            const datosEgreso = [
                null, // ID se autogenera
                formData.get('fecha'),
                formData.get('n_doc'),
                formData.get('proveedor'),
                formData.get('categoria'),
                formData.get('descripcion'),
                formData.get('monto'),
                linkComprobante
            ];
            
            await agregarEgreso(datosEgreso);
            mostrarMensaje("Egreso agregado con éxito.", "success");
            cargarContabilidad();

        } catch (err) {
            mostrarMensaje("Error al guardar el egreso: " + err.message, "error");
        } finally {
            ocultarSpinner();
        }
    });
    
    // Carga inicial con el mes actual por defecto
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    document.getElementById('fechaInicio').value = primerDiaMes;
    document.getElementById('fechaFin').value = ultimoDiaMes;
    filtrarYRenderizar();

    ocultarSpinner();
}

document.querySelector('[data-module="contabilidad"]').addEventListener('click', cargarContabilidad);
