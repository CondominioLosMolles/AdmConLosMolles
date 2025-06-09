/**
 * CondoAdmin - Módulo de Informes
 */

async function initInformesModule(container) {
    console.log("🚀 Inicializando módulo de Informes...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Generando Informes...</p></div>`;

    try {
        const [residentes, pagos, gastos, mantenciones] = await Promise.all([
            sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES),
            sheetsAPI.getSheetData(CONFIG.SHEETS.PAGOS),
            sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS),
            sheetsAPI.getSheetData(CONFIG.SHEETS.MANTENCIONES)
        ]);

        renderInformesUI(container, { residentes, pagos, gastos, mantenciones });
        initInformeCharts({ residentes });

        console.log("✅ Módulo de Informes inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Informes:", error);
        showDetailedError("Error Crítico en Informes", error, container);
    }
}

function renderInformesUI(container, data) {
    const { residentes, pagos, gastos, mantenciones } = data;

    const totalIngresos = pagos.reduce((sum, p) => sum + (parseFloat(p.Monto) || 0), 0);
    const totalGastos = gastos.reduce((sum, g) => sum + (parseFloat(g.Monto) || 0), 0);
    const saldo = totalIngresos - totalGastos;
    const residentesActivos = residentes.filter(r => r.Estado === 'Activo').length;
    const residentesMorosos = residentes.filter(r => r.Estado === 'Moroso').length;
    const mantencionesPendientes = mantenciones.filter(m => m.Estado === 'Pendiente' || m.Estado === 'Urgente');

    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Informes Generales</h2>
            <button id="print-report" class="btn btn-outline-secondary"><i class="fas fa-print me-2"></i>Imprimir Informe</button>
        </div>
        
        <div id="report-content">
            <div class="row">
                <div class="col-lg-8">
                    ${createCard('Resumen Financiero', `
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between align-items-center">Total Ingresos:<span class="badge bg-success rounded-pill fs-6">${formatCurrency(totalIngresos)}</span></li>
                            <li class="list-group-item d-flex justify-content-between align-items-center">Total Gastos:<span class="badge bg-danger rounded-pill fs-6">${formatCurrency(totalGastos)}</span></li>
                            <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Saldo Actual:</strong><strong class="fs-5 text-primary">${formatCurrency(saldo)}</strong></li>
                        </ul>
                    `).outerHTML}

                     ${createCard('Mantenciones Prioritarias', `
                        ${mantencionesPendientes.length > 0 ? `
                        <ul class="list-group">
                            ${mantencionesPendientes.map(m => `
                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="fas fa-tools me-2 text-muted"></i>${m.Descripcion}
                                        <small class="d-block text-muted">Responsable: ${m.Responsable || 'No asignado'}</small>
                                    </div>
                                    <span class="badge ${m.Estado === 'Urgente' ? 'bg-danger' : 'bg-warning text-dark'}">${m.Estado}</span>
                                </li>
                            `).join('')}
                        </ul>
                        ` : '<p class="text-center text-muted p-3">No hay mantenciones prioritarias pendientes.</p>'}
                    `).outerHTML}
                </div>

                <div class="col-lg-4">
                    ${createCard('Estado de Residentes', `
                        <div class="chart-container" style="height: 250px;"><canvas id="residentesStatusChart"></canvas></div>
                        <ul class="list-group list-group-flush mt-3">
                           <li class="list-group-item d-flex justify-content-between align-items-center">Total de Residentes:<span class="badge bg-primary rounded-pill">${residentes.length}</span></li>
                           <li class="list-group-item d-flex justify-content-between align-items-center">Residentes Morosos:<span class="badge bg-warning text-dark rounded-pill">${residentesMorosos}</span></li>
                        </ul>
                    `).outerHTML}
                </div>
            </div>
        </div>
    `;

    document.getElementById('print-report').addEventListener('click', () => {
        const printContents = document.getElementById('report-content').innerHTML;
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = `
            <html>
                <head>
                    <title>Informe CondoAdmin - ${new Date().toLocaleDateString('es-CL')}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        body { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                        .card { border: 1px solid #dee2e6 !important; }
                    </style>
                </head>
                <body>
                    <div class="container-fluid p-4">
                        <h1 class="mb-4">Informe General - CondoAdmin Los Molles</h1>
                        ${printContents}
                    </div>
                </body>
            </html>
        `;
        window.print();
        document.body.innerHTML = originalContents;
        // Recargar el módulo para re-atachar los eventos
        initInformesModule(container);
    });
}


function initInformeCharts(data) {
    const { residentes } = data;
    const ctx = document.getElementById('residentesStatusChart');
    if (!ctx) return;

    const statusCounts = residentes.reduce((acc, r) => {
        acc[r.Estado] = (acc[r.Estado] || 0) + 1;
        return acc;
    }, {});
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Estado de Residentes',
                data: Object.values(statusCounts),
                backgroundColor: [
                    'rgba(40, 167, 69, 0.7)', // Activo
                    'rgba(255, 193, 7, 0.7)',  // Moroso
                    'rgba(220, 53, 69, 0.7)',  // Inactivo
                    'rgba(108, 117, 125, 0.7)' // Otro
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}
