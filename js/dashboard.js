// js/dashboard.js

async function cargarDashboard() {
    limpiarMainContent();
    mostrarSpinner();

    try {
        // --- 1. SE AÑADE LA CARGA DE INGRESOS EXTRA ---
        const [allResidentes, allPagos, allEgresos, allTareas, config, allIngresosExtra] = await Promise.all([
            obtenerResidentes(),
            obtenerPagosGC(),
            obtenerEgresos(),
            obtenerTareas(),
            obtenerConfiguracion(),
            obtenerIngresosExtra() // <-- Adición
        ]);

        const hoy = new Date();
        const main = document.getElementById('main-content');

        // --- CÁLCULOS PRINCIPALES ---

        // ▼▼▼ 2. SE ACTUALIZA EL CÁLCULO DE SALDOS Y TOTALES ▼▼▼
        const saldoInicial = parseFloat(config.Saldo_Inicial_Caja || 0);

        // Se suman los ingresos de Pagos_GC y los de Ingresos_Extra para el total histórico.
        const totalIngresosGCHistoricos = allPagos.reduce((sum, p) => sum + parseFloat(p[6] || 0) + parseFloat(p[17] || 0), 0);
        const totalIngresosExtraHistoricos = allIngresosExtra.reduce((sum, i) => sum + parseFloat(i[3] || 0), 0);
        const totalIngresosHistoricos = totalIngresosGCHistoricos + totalIngresosExtraHistoricos; // <-- Suma combinada

        const totalEgresosHistoricos = allEgresos.reduce((sum, e) => sum + parseFloat(e[6] || 0), 0);
        const saldoCaja = saldoInicial + totalIngresosHistoricos - totalEgresosHistoricos;

        // Se calculan y suman los ingresos del mes de ambas fuentes.
        const pagosMesActual = allPagos.filter(p => {
            if (!p[13]) return false;
            const fechaPago = new Date(p[13].replace(/-/g, '/'));
            return fechaPago.getMonth() === hoy.getMonth() && fechaPago.getFullYear() === hoy.getFullYear();
        });
        const totalIngresosGCMesActual = pagosMesActual.reduce((sum, p) => sum + parseFloat(p[6] || 0) + parseFloat(p[17] || 0), 0);

        const ingresosExtraMesActual = allIngresosExtra.filter(i => {
            if (!i[1]) return false;
            const fechaIngreso = new Date(i[1].replace(/-/g, '/'));
            return fechaIngreso.getMonth() === hoy.getMonth() && fechaIngreso.getFullYear() === hoy.getFullYear();
        });
        const totalIngresosExtraMesActual = ingresosExtraMesActual.reduce((sum, i) => sum + parseFloat(i[3] || 0), 0);

        const totalIngresosMesActual = totalIngresosGCMesActual + totalIngresosExtraMesActual; // <-- Suma combinada
        
        // --- (El resto de los cálculos originales se mantiene igual) ---
        const residentesMorosos = allResidentes.filter(r => parseFloat(r[11] || 0) > 0);
        const totalDeuda = residentesMorosos.reduce((sum, r) => sum + parseFloat(r[11] || 0), 0);

        const tareasPendientes = allTareas.filter(t => t[4] !== 'Completada');

        // --- RENDERIZADO DEL HTML (Sin cambios, 100% original) ---
        main.innerHTML = `
            <div class="dashboard-grid">
                <div class="widget">
                    <h4>Saldo Actual de Caja</h4>
                    <p class="amount text-primary">$${saldoCaja.toLocaleString('es-CL')}</p>
                </div>
                <div class="widget">
                    <h4>Ingresos del Mes</h4>
                    <p class="amount text-success">$${totalIngresosMesActual.toLocaleString('es-CL')}</p>
                </div>
                <div class="widget">
                    <h4>Residentes Morosos</h4>
                    <p class="amount text-warning">${residentesMorosos.length}</p>
                    <small>Deuda Total: $${totalDeuda.toLocaleString('es-CL')}</small>
                </div>
                <div class="widget">
                    <h4>Tareas Pendientes</h4>
                    <p class="amount text-danger">${tareasPendientes.length}</p>
                </div>
                <div class="widget large">
                    <h4>Flujo de Caja (Últimos 12 Meses)</h4>
                    <canvas id="graficoFlujoCaja"></canvas>
                </div>
                <div class="widget">
                    <h4>Accesos Rápidos</h4>
                    <div class="quick-links">
                        <button class="btn" data-module="gastos-comunes">Calcular Gastos Comunes</button>
                        <button class="btn" data-module="contabilidad">Ver Contabilidad</button>
                        <button class="btn" data-module="residentes">Administrar Residentes</button>
                        <button class="btn" data-module="mantenciones">Ver Tareas</button>
                    </div>
                </div>
            </div>
        `;

        // --- GRÁFICO ---
        const ctx = document.getElementById('graficoFlujoCaja').getContext('2d');
        const labels = [];
        const ingresosData = [];
        const egresosData = [];
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.getMonth();
            const year = d.getFullYear();
            labels.push(`${meses[month]} ${year}`);

            // ▼▼▼ 3. SE ACTUALIZA EL CÁLCULO PARA EL GRÁFICO ▼▼▼
            // Se suman ambas fuentes de ingreso para cada mes del gráfico.
            const ingresosGCMes = allPagos
                .filter(p => {
                    if (!p[13]) return false;
                    const fechaPago = new Date(p[13].replace(/-/g, '/'));
                    return fechaPago.getFullYear() === year && fechaPago.getMonth() === month;
                })
                .reduce((sum, p) => sum + parseFloat(p[6] || 0) + parseFloat(p[17] || 0), 0);
            
            const ingresosExtraMes = allIngresosExtra
                .filter(i => {
                    if (!i[1]) return false;
                    const fechaIngreso = new Date(i[1].replace(/-/g, '/'));
                    return fechaIngreso.getFullYear() === year && fechaIngreso.getMonth() === month;
                })
                .reduce((sum, i) => sum + parseFloat(i[3] || 0), 0);

            ingresosData.push(ingresosGCMes + ingresosExtraMes); // <-- Suma combinada para el gráfico

            // El cálculo de egresos se mantiene 100% original
            const egresosMes = allEgresos
                .filter(e => {
                    if (!e[1]) return false;
                    const fechaEgreso = new Date(e[1].replace(/-/g, '/'));
                    return fechaEgreso.getFullYear() === year && fechaEgreso.getMonth() === month;
                })
                .reduce((sum, e) => sum + parseFloat(e[6] || 0), 0);
            egresosData.push(egresosMes);
        }

        // El renderizado del gráfico se mantiene 100% original
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos',
                    data: ingresosData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }, {
                    label: 'Egresos',
                    data: egresosData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + (value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error al cargar el dashboard:", error);
        mostrarMensaje("No se pudo cargar la información del dashboard. " + error.message, 'error');
    } finally {
        ocultarSpinner();
    }
}

// Event listener original se mantiene igual
document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
