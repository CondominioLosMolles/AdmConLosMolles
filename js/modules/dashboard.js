/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Módulo de Dashboard (Versión Final)
 */

// Función que inicializa el módulo de Dashboard
async function initDashboardModule(container) {
    console.log('🚀 Inicializando módulo de Dashboard...');
    try {
        // Obtener datos para el dashboard
        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
        const gastos = await sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS);
        const pagos = await sheetsAPI.getSheetData(CONFIG.SHEETS.PAGOS);
        const mantenciones = await sheetsAPI.getSheetData(CONFIG.SHEETS.MANTENCIONES);

        // Calcular estadísticas
        const totalResidentes = residentes.length;
        const totalIngresos = pagos.reduce((sum, pago) => sum + (parseFloat(pago.Monto) || 0), 0);
        const totalGastos = gastos.reduce((sum, gasto) => sum + (parseFloat(gasto.Monto) || 0), 0);
        const saldoActual = totalIngresos - totalGastos;
        const mantencionesUrgentes = mantenciones.filter(m => m.Estado === 'Urgente').length;
        const mantencionesPendientes = mantenciones.filter(m => m.Estado === 'Pendiente' || m.Estado === 'Programada').length;

        // Crear contenido del dashboard
        const content = document.createElement('div');

        // Título del dashboard
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center mb-4';
        const title = document.createElement('h2');
        title.textContent = 'Dashboard';
        const refreshButton = document.createElement('button');
        refreshButton.className = 'btn btn-outline-primary';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar';
        refreshButton.addEventListener('click', () => {
            initDashboardModule(container);
        });
        header.appendChild(title);
        header.appendChild(refreshButton);
        content.appendChild(header);

        // Tarjetas de estadísticas
        const statsRow = document.createElement('div');
        statsRow.className = 'row mb-4';

        const residentesCard = document.createElement('div');
        residentesCard.className = 'col-md-3';
        residentesCard.innerHTML = `
            <div class="stat-card bg-primary text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="stat-value">${totalResidentes}</div>
                        <div class="stat-label">Residentes</div>
                    </div>
                    <div>
                        <i class="fas fa-users fa-2x"></i>
                    </div>
                </div>
            </div>
        `;
        statsRow.appendChild(residentesCard);

        const ingresosCard = document.createElement('div');
        ingresosCard.className = 'col-md-3';
        ingresosCard.innerHTML = `
            <div class="stat-card bg-success text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="stat-value">${formatCurrency(totalIngresos)}</div>
                        <div class="stat-label">Ingresos</div>
                    </div>
                    <div>
                        <i class="fas fa-arrow-up fa-2x"></i>
                    </div>
                </div>
            </div>
        `;
        statsRow.appendChild(ingresosCard);

        const gastosCard = document.createElement('div');
        gastosCard.className = 'col-md-3';
        gastosCard.innerHTML = `
            <div class="stat-card bg-danger text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="stat-value">${formatCurrency(totalGastos)}</div>
                        <div class="stat-label">Gastos</div>
                    </div>
                    <div>
                        <i class="fas fa-arrow-down fa-2x"></i>
                    </div>
                </div>
            </div>
        `;
        statsRow.appendChild(gastosCard);

        const saldoCard = document.createElement('div');
        saldoCard.className = 'col-md-3';
        saldoCard.innerHTML = `
            <div class="stat-card bg-info text-white">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="stat-value">${formatCurrency(saldoActual)}</div>
                        <div class="stat-label">Saldo</div>
                    </div>
                    <div>
                        <i class="fas fa-wallet fa-2x"></i>
                    </div>
                </div>
            </div>
        `;
        statsRow.appendChild(saldoCard);

        content.appendChild(statsRow);

        // Gráfico de ingresos vs gastos
        const chartRow = document.createElement('div');
        chartRow.className = 'row mb-4';

        const chartCol = document.createElement('div');
        chartCol.className = 'col-md-8';
        const chartCard = createCard('Ingresos vs Gastos', '<div class="chart-container"><canvas id="incomeExpenseChart"></canvas></div>');
        chartCol.appendChild(chartCard);
        chartRow.appendChild(chartCol);

        // Tarjeta de mantenciones
        const mantencionesCol = document.createElement('div');
        mantencionesCol.className = 'col-md-4';
        const mantencionesCard = createCard('Mantenciones', `
            <div class="d-flex flex-column">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span>Urgentes</span>
                    <span class="badge bg-danger">${mantencionesUrgentes}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span>Pendientes</span>
                    <span class="badge bg-warning text-dark">${mantencionesPendientes}</span>
                </div>
                <div class="mt-3">
                    <a href="#mantenciones" class="btn btn-outline-primary btn-sm w-100">Ver todas</a>
                </div>
            </div>
        `);
        mantencionesCol.appendChild(mantencionesCard);
        chartRow.appendChild(mantencionesCol);

        content.appendChild(chartRow);

        // Últimos movimientos
        const movimientosRow = document.createElement('div');
        movimientosRow.className = 'row';

        // Últimos pagos
        const pagosCol = document.createElement('div');
        pagosCol.className = 'col-md-6';
        const ultimosPagos = pagos.slice(0, 5);
        let pagosList = '<div class="list-group">';
        ultimosPagos.forEach(pago => {
            pagosList += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${pago.Concepto}</h6>
                        <span class="text-success">${formatCurrency(parseFloat(pago.Monto) || 0)}</span>
                    </div>
                    <p class="mb-1">Residente: ${pago.Residente}</p>
                    <small class="text-muted">Fecha: ${pago.Fecha}</small>
                </div>
            `;
        });
        pagosList += '</div>';
        const pagosCard = createCard('Últimos Pagos', pagosList);
        pagosCol.appendChild(pagosCard);
        movimientosRow.appendChild(pagosCol);

        // Últimos gastos
        const gastosCol = document.createElement('div');
        gastosCol.className = 'col-md-6';
        const ultimosGastos = gastos.slice(0, 5);
        let gastosList = '<div class="list-group">';
        ultimosGastos.forEach(gasto => {
            gastosList += `
                <div class="list-group-item list-group-item-action">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${gasto.Concepto}</h6>
                        <span class="text-danger">${formatCurrency(parseFloat(gasto.Monto) || 0)}</span>
                    </div>
                    <p class="mb-1">Proveedor: ${gasto.Proveedor}</p>
                    <small class="text-muted">Fecha: ${gasto.Fecha}</small>
                </div>
            `;
        });
        gastosList += '</div>';
        const gastosCardElement = createCard('Últimos Gastos', gastosList);
        gastosCol.appendChild(gastosCardElement);
        movimientosRow.appendChild(gastosCol);

        content.appendChild(movimientosRow);

        // Renderizar el contenido
        container.innerHTML = '';
        container.appendChild(content);

        // Inicializar el gráfico
        initIncomeExpenseChart(pagos, gastos);
    } catch (error) {
        console.error('❌ Error al inicializar el módulo de Dashboard:', error);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar el dashboard: ${error.message}
            </div>
        `;
    }
}

// Registrar la función en el objeto global
window.initDashboardModule = initDashboardModule;

/**
 * Inicializa el gráfico de ingresos vs gastos
 * @param {Array} pagos - Datos de pagos
 * @param {Array} gastos - Datos de gastos
 */
function initIncomeExpenseChart(pagos, gastos) {
    // Procesar datos para el gráfico
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const ingresosPorMes = Array(12).fill(0);
    const gastosPorMes = Array(12).fill(0);

    // Procesar pagos
    pagos.forEach(pago => {
        if (pago.Fecha) {
            const fecha = pago.Fecha.split('/');
            if (fecha.length === 3) {
                const mes = parseInt(fecha[1]) - 1; // Ajustar al índice base 0
                if (!isNaN(mes) && mes >= 0 && mes < 12) {
                    ingresosPorMes[mes] += parseFloat(pago.Monto) || 0;
                }
            }
        }
    });

    // Procesar gastos
    gastos.forEach(gasto => {
        if (gasto.Fecha) {
            const fecha = gasto.Fecha.split('/');
            if (fecha.length === 3) {
                const mes = parseInt(fecha[1]) - 1; // Ajustar al índice base 0
                if (!isNaN(mes) && mes >= 0 && mes < 12) {
                    gastosPorMes[mes] += parseFloat(gasto.Monto) || 0;
                }
            }
        }
    });

    // Crear el gráfico
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                {
                    label: 'Ingresos',
                    data: ingresosPorMes,
                    backgroundColor: 'rgba(40, 167, 69, 0.5)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Gastos',
                    data: gastosPorMes,
                    backgroundColor: 'rgba(220, 53, 69, 0.5)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return CONFIG.APP.CURRENCY + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });
}
