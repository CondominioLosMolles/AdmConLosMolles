/**
 * CondoAdmin - Módulo de Dashboard (Versión funcional completa)
 */

async function initDashboardModule(container) {
    console.log("🚀 Inicializando módulo de Dashboard...");
    container.innerHTML = `
        <div class="d-flex justify-content-center align-items-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="ms-3">Cargando el panel principal...</p>
        </div>
    `;

    try {
        const [residentes, gastos, pagos, mantenciones] = await Promise.all([
            sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES),
            sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS),
            sheetsAPI.getSheetData(CONFIG.SHEETS.PAGOS),
            sheetsAPI.getSheetData(CONFIG.SHEETS.MANTENCIONES)
        ]);

        const stats = calculateDashboardStats(residentes, pagos, gastos, mantenciones);
        
        renderDashboardUI(container, stats, pagos, gastos);

        initDashboardCharts(pagos, gastos);

        console.log("✅ Módulo de Dashboard inicializado correctamente.");

    } catch (error) {
        console.error("❌ Error al inicializar el módulo de Dashboard:", error);
        showDetailedError("Error Crítico en el Dashboard", error, container);
    }
}

function calculateDashboardStats(residentes, pagos, gastos, mantenciones) {
    const totalIngresos = pagos.reduce((sum, pago) => sum + (parseFloat(pago.Monto) || 0), 0);
    const totalGastos = gastos.reduce((sum, gasto) => sum + (parseFloat(gasto.Monto) || 0), 0);
    
    return {
        totalResidentes: residentes.length,
        totalIngresos: totalIngresos,
        totalGastos: totalGastos,
        saldoActual: totalIngresos - totalGastos,
        mantencionesUrgentes: mantenciones.filter(m => m.Estado === 'Urgente').length,
        mantencionesPendientes: mantenciones.filter(m => m.Estado === 'Pendiente' || m.Estado === 'Programada').length,
    };
}

function renderDashboardUI(container, stats, pagos, gastos) {
    container.innerHTML = ''; 
    const content = document.createElement('div');

    const formatCurrency = (amount) => CONFIG.APP.CURRENCY + (Number(amount) || 0).toLocaleString('es-CL');

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Dashboard</h2>
            <button id="refresh-dashboard" class="btn btn-outline-primary"><i class="fas fa-sync-alt me-2"></i>Actualizar</button>
        </div>
    `;

    const statsRow = document.createElement('div');
    statsRow.className = 'row mb-4';
    statsRow.innerHTML = `
        <div class="col-xl-3 col-md-6 mb-4"><div class="stat-card bg-primary text-white h-100"><div class="stat-value">${stats.totalResidentes}</div><div class="stat-label">Residentes</div><i class="fas fa-users stat-icon"></i></div></div>
        <div class="col-xl-3 col-md-6 mb-4"><div class="stat-card bg-success text-white h-100"><div class="stat-value">${formatCurrency(stats.totalIngresos)}</div><div class="stat-label">Ingresos Totales</div><i class="fas fa-arrow-up stat-icon"></i></div></div>
        <div class="col-xl-3 col-md-6 mb-4"><div class="stat-card bg-danger text-white h-100"><div class="stat-value">${formatCurrency(stats.totalGastos)}</div><div class="stat-label">Gastos Totales</div><i class="fas fa-arrow-down stat-icon"></i></div></div>
        <div class="col-xl-3 col-md-6 mb-4"><div class="stat-card bg-info text-white h-100"><div class="stat-value">${formatCurrency(stats.saldoActual)}</div><div class="stat-label">Saldo Actual</div><i class="fas fa-wallet stat-icon"></i></div></div>
    `;
    content.appendChild(statsRow);

    const chartRow = document.createElement('div');
    chartRow.className = 'row mb-4';
    
    const chartCardContent = `<div class="chart-container"><canvas id="incomeExpenseChart"></canvas></div>`;
    const mantencionesCardContent = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div><i class="fas fa-exclamation-circle text-danger me-2"></i>Urgentes</div>
            <span class="badge bg-danger rounded-pill">${stats.mantencionesUrgentes}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <div><i class="fas fa-clock text-warning me-2"></i>Pendientes</div>
            <span class="badge bg-warning text-dark rounded-pill">${stats.mantencionesPendientes}</span>
        </div>
        <div class="mt-4 text-center">
            <a href="#mantenciones" class="btn btn-outline-primary btn-sm w-100">Gestionar Mantenciones</a>
        </div>`;

    const chartCol = document.createElement('div');
    chartCol.className = 'col-lg-8';
    chartCol.appendChild(createCard('Ingresos vs. Gastos (Últimos 12 meses)', chartCardContent));
    
    const mantencionesCol = document.createElement('div');
    mantencionesCol.className = 'col-lg-4';
    mantencionesCol.appendChild(createCard('Estado de Mantenciones', mantencionesCardContent));
    
    chartRow.appendChild(chartCol);
    chartRow.appendChild(mantencionesCol);
    content.appendChild(chartRow);

    container.appendChild(content);

    document.getElementById('refresh-dashboard').addEventListener('click', () => initDashboardModule(container));
}

function initDashboardCharts(pagos, gastos) {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;

    const meses = Array.from({length: 12}, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('es-CL', { month: 'short', year: '2-digit' });
    }).reverse();

    const ingresosPorMes = Array(12).fill(0);
    const gastosPorMes = Array(12).fill(0);
    const now = new Date();

    const processData = (data, targetArray) => {
        data.forEach(item => {
            if (item.Fecha && item.Monto) {
                const parts = item.Fecha.split('/');
                if (parts.length !== 3) return;
                const [day, month, year] = parts;
                const itemDate = new Date(`${year}-${month}-${day}`);
                if (isNaN(itemDate.getTime())) return;
                const monthDiff = (now.getFullYear() - itemDate.getFullYear()) * 12 + (now.getMonth() - itemDate.getMonth());
                if (monthDiff >= 0 && monthDiff < 12) {
                    targetArray[11 - monthDiff] += parseFloat(item.Monto) || 0;
                }
            }
        });
    };
    
    processData(pagos, ingresosPorMes);
    processData(gastos, gastosPorMes);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                { label: 'Ingresos', data: ingresosPorMes, backgroundColor: 'rgba(40, 167, 69, 0.6)', borderColor: 'rgba(40, 167, 69, 1)', borderWidth: 1 },
                { label: 'Gastos', data: gastosPorMes, backgroundColor: 'rgba(220, 53, 69, 0.6)', borderColor: 'rgba(220, 53, 69, 1)', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: value => CONFIG.APP.CURRENCY + value.toLocaleString('es-CL') } } },
            plugins: { tooltip: { callbacks: { label: context => `${context.dataset.label}: ${CONFIG.APP.CURRENCY + Number(context.raw || 0).toLocaleString('es-CL')}` } } }
        }
    });
}
