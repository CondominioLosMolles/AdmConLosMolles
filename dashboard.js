// Módulo Dashboard - Pantalla principal con estadísticas y gráficos
class DashboardModule {
    constructor() {
        this.charts = {};
    }

    // Renderizar el módulo dashboard
    async render() {
        const container = document.getElementById('content-container');
        Utils.showLoading(container);

        try {
            // Cargar datos necesarios
            const [residentes, pagos, egresos, mantenciones] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES),
                window.googleAPI.readSheet(CONFIG.SHEETS.PAGOS_GC),
                window.googleAPI.readSheet(CONFIG.SHEETS.EGRESOS),
                window.googleAPI.readSheet(CONFIG.SHEETS.MANTENCIONES)
            ]);

            // Procesar datos
            const stats = this.calculateStats(residentes, pagos, egresos, mantenciones);

            // Renderizar contenido
            container.innerHTML = this.getHTML(stats);

            // Inicializar gráficos
            await this.initCharts(pagos, egresos);

        } catch (error) {
            console.error('Error cargando dashboard:', error);
            Utils.showError(container, 'Error cargando el dashboard');
        }
    }

    // Calcular estadísticas
    calculateStats(residentes, pagos, egresos, mantenciones) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        // Residentes activos
        const residentesActivos = residentes.filter(row => row[5] === 'Activo').length - 1; // -1 por header

        // Ingresos del mes actual
        const ingresosMes = pagos
            .filter(row => {
                if (row[3]) { // Periodo
                    const [year, month] = row[3].split('-');
                    return parseInt(year) === currentYear && parseInt(month) === currentMonth + 1;
                }
                return false;
            })
            .reduce((sum, row) => sum + (parseFloat(row[5]) || 0), 0); // MontoPagado

        // Egresos del mes actual
        const egresosMes = egresos
            .filter(row => {
                if (row[1]) { // Fecha
                    const fecha = Utils.parseDate(row[1]);
                    return fecha && fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
                }
                return false;
            })
            .reduce((sum, row) => sum + (parseFloat(row[5]) || 0), 0); // Monto

        // Saldo de caja estimado
        const totalIngresos = pagos.reduce((sum, row) => sum + (parseFloat(row[5]) || 0), 0);
        const totalEgresos = egresos.reduce((sum, row) => sum + (parseFloat(row[5]) || 0), 0);
        const saldoCaja = totalIngresos - totalEgresos;

        // Mantenciones pendientes/urgentes
        const mantencionesPendientes = mantenciones
            .filter(row => row[5] === 'Pendiente' || row[5] === 'Urgente').length;

        // Residentes morosos
        const residentesMorosos = residentes.filter(row => row[5] === 'Moroso');
        const cantidadMorosos = residentesMorosos.length;
        const parcelasMorosas = residentesMorosos.map(row => row[3]).join(', ');

        // Calcular deuda total de morosos (simplificado)
        const deudaTotalMorosos = residentesMorosos.reduce((sum, residente) => {
            const valorGastoComun = parseFloat(residente[6]) || 0;
            return sum + valorGastoComun; // Simplificado, en realidad sería más complejo
        }, 0);

        return {
            residentesActivos,
            ingresosMes,
            egresosMes,
            saldoCaja,
            mantencionesPendientes,
            cantidadMorosos,
            parcelasMorosas,
            deudaTotalMorosos
        };
    }

    // Obtener HTML del dashboard
    getHTML(stats) {
        return `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h2>Dashboard - Resumen General</h2>
                    <p>Última actualización: ${Utils.formatDate(new Date())}</p>
                </div>

                <!-- Tarjetas de estadísticas -->
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.residentesActivos}</div>
                        <div class="stat-label">Residentes Activos</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value">${Utils.formatCurrency(stats.ingresosMes)}</div>
                        <div class="stat-label">Ingresos del Mes</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value">${Utils.formatCurrency(stats.egresosMes)}</div>
                        <div class="stat-label">Egresos del Mes</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value ${stats.saldoCaja >= 0 ? 'status-active' : 'status-moroso'}">${Utils.formatCurrency(stats.saldoCaja)}</div>
                        <div class="stat-label">Saldo de Caja</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value ${stats.mantencionesPendientes > 0 ? 'status-pendiente' : 'status-active'}">${stats.mantencionesPendientes}</div>
                        <div class="stat-label">Mantenciones Pendientes</div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-value ${stats.cantidadMorosos > 0 ? 'status-moroso' : 'status-active'}">${stats.cantidadMorosos}</div>
                        <div class="stat-label">Residentes Morosos</div>
                    </div>
                </div>

                <!-- Gráficos -->
                <div class="charts-container">
                    <div class="chart-card">
                        <div class="card-header">
                            <h3 class="card-title">Ingresos vs Egresos (Últimos 12 meses)</h3>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="ingresos-egresos-chart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Resumen de morosidad -->
                ${stats.cantidadMorosos > 0 ? `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Resumen de Morosidad</h3>
                    </div>
                    <div class="morosidad-summary">
                        <div class="morosidad-item">
                            <strong>Cantidad de morosos:</strong> ${stats.cantidadMorosos}
                        </div>
                        <div class="morosidad-item">
                            <strong>Parcelas morosas:</strong> ${stats.parcelasMorosas}
                        </div>
                        <div class="morosidad-item">
                            <strong>Deuda total estimada:</strong> ${Utils.formatCurrency(stats.deudaTotalMorosos)}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Inicializar gráficos
    async initCharts(pagos, egresos) {
        try {
            await this.createIngresosEgresosChart(pagos, egresos);
        } catch (error) {
            console.error('Error inicializando gráficos:', error);
        }
    }

    // Crear gráfico de ingresos vs egresos
    async createIngresosEgresosChart(pagos, egresos) {
        const ctx = document.getElementById('ingresos-egresos-chart');
        if (!ctx) return;

        // Preparar datos para los últimos 12 meses
        const currentDate = new Date();
        const months = [];
        const ingresosData = [];
        const egresosData = [];

        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
            
            months.push(monthLabel);

            // Calcular ingresos del mes
            const ingresosDelMes = pagos
                .filter(row => row[3] === monthKey) // Periodo
                .reduce((sum, row) => sum + (parseFloat(row[5]) || 0), 0); // MontoPagado
            
            ingresosData.push(ingresosDelMes);

            // Calcular egresos del mes
            const egresosDelMes = egresos
                .filter(row => {
                    if (row[1]) { // Fecha
                        const fecha = Utils.parseDate(row[1]);
                        if (fecha) {
                            const fechaKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                            return fechaKey === monthKey;
                        }
                    }
                    return false;
                })
                .reduce((sum, row) => sum + (parseFloat(row[5]) || 0), 0); // Monto
            
            egresosData.push(egresosDelMes);
        }

        // Crear gráfico
        this.charts.ingresosEgresos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: ingresosData,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Egresos',
                        data: egresosData,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
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
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Destruir gráficos al cambiar de módulo
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Exportar módulo
window.DashboardModule = DashboardModule;

