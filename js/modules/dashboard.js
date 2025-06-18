// ===== MÓDULO DASHBOARD =====

const DashboardModule = {
    data: {
        residentes: [],
        pagos: [],
        egresos: [],
        mantenciones: [],
        stats: {}
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando dashboard...');
            
            // Cargar datos
            await this.loadData();
            
            // Calcular estadísticas
            this.calculateStats();
            
            // Renderizar contenido
            container.innerHTML = this.getHTML();
            
            // Configurar eventos
            this.setupEvents();
            
            // Renderizar gráficos
            await this.renderCharts();
            
        } catch (error) {
            console.error('Error cargando dashboard:', error);
            container.innerHTML = `
                <div class="text-center">
                    <h2>Error cargando dashboard</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="DashboardModule.render(document.getElementById('content-area'))">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    async loadData() {
        try {
            const [residentes, pagos, egresos, mantenciones] = await Promise.all([
                sheetsAPI.getResidentes(),
                sheetsAPI.getPagos(),
                sheetsAPI.getEgresos(),
                sheetsAPI.getMantenciones()
            ]);

            this.data.residentes = residentes;
            this.data.pagos = pagos;
            this.data.egresos = egresos;
            this.data.mantenciones = mantenciones;
        } catch (error) {
            console.error('Error cargando datos:', error);
            throw error;
        }
    },

    calculateStats() {
        const hoy = new Date();
        const mesActual = `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Estadísticas de residentes
        const residentesActivos = this.data.residentes.filter(r => r.Estado === 'Activo').length;
        const residentesMorosos = this.data.residentes.filter(r => r.Estado === 'Moroso').length;
        
        // Ingresos del mes
        const ingresosMes = this.data.pagos
            .filter(p => {
                const fechaPago = new Date(p.FechaPago);
                return fechaPago.getMonth() === hoy.getMonth() && 
                       fechaPago.getFullYear() === hoy.getFullYear();
            })
            .reduce((sum, p) => sum + parseFloat(p.MontoPagado || 0), 0);
        
        // Egresos del mes
        const egresosMes = this.data.egresos
            .filter(e => {
                const fechaEgreso = new Date(e.Fecha);
                return fechaEgreso.getMonth() === hoy.getMonth() && 
                       fechaEgreso.getFullYear() === hoy.getFullYear();
            })
            .reduce((sum, e) => sum + parseFloat(e.Monto || 0), 0);
        
        // Saldo de caja estimado
        const totalIngresos = this.data.pagos.reduce((sum, p) => sum + parseFloat(p.MontoPagado || 0), 0);
        const totalEgresos = this.data.egresos.reduce((sum, e) => sum + parseFloat(e.Monto || 0), 0);
        const saldoCaja = totalIngresos - totalEgresos;
        
        // Mantenciones pendientes/urgentes
        const mantencionesPendientes = this.data.mantenciones
            .filter(m => m.Estado === 'Pendiente' || m.Estado === 'Urgente').length;
        
        // Resumen de morosidad
        const parcelasMorosas = this.data.residentes
            .filter(r => r.Estado === 'Moroso')
            .map(r => r.N_Parcela);
        
        const deudaTotalMorosos = this.data.pagos
            .filter(p => p.Estado === 'Moroso')
            .reduce((sum, p) => sum + parseFloat(p.Deuda_Total || 0), 0);

        this.data.stats = {
            residentesActivos,
            residentesMorosos,
            ingresosMes,
            egresosMes,
            saldoCaja,
            mantencionesPendientes,
            parcelasMorosas,
            deudaTotalMorosos,
            totalResidentes: this.data.residentes.length
        };
    },

    getHTML() {
        const stats = this.data.stats;
        
        return `
            <div class="dashboard">
                <div class="dashboard-header">
                    <h1>Dashboard</h1>
                    <p>Resumen general del condominio</p>
                </div>

                <!-- Widgets principales -->
                <div class="dashboard-widgets">
                    <div class="widget widget-primary">
                        <div class="widget-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Residentes Activos</div>
                            <div class="widget-value">${stats.residentesActivos}</div>
                            <div class="widget-subtitle">de ${stats.totalResidentes} total</div>
                        </div>
                    </div>

                    <div class="widget widget-success">
                        <div class="widget-icon">
                            <i class="fas fa-arrow-up"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Ingresos del Mes</div>
                            <div class="widget-value">${helpers.formatCurrency(stats.ingresosMes)}</div>
                            <div class="widget-subtitle">Pagos recibidos</div>
                        </div>
                    </div>

                    <div class="widget widget-warning">
                        <div class="widget-icon">
                            <i class="fas fa-arrow-down"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Egresos del Mes</div>
                            <div class="widget-value">${helpers.formatCurrency(stats.egresosMes)}</div>
                            <div class="widget-subtitle">Gastos realizados</div>
                        </div>
                    </div>

                    <div class="widget ${stats.saldoCaja >= 0 ? 'widget-success' : 'widget-danger'}">
                        <div class="widget-icon">
                            <i class="fas fa-wallet"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Saldo de Caja</div>
                            <div class="widget-value">${helpers.formatCurrency(stats.saldoCaja)}</div>
                            <div class="widget-subtitle">Estimado</div>
                        </div>
                    </div>

                    <div class="widget widget-info">
                        <div class="widget-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Mantenciones</div>
                            <div class="widget-value">${stats.mantencionesPendientes}</div>
                            <div class="widget-subtitle">Pendientes/Urgentes</div>
                        </div>
                    </div>

                    <div class="widget ${stats.residentesMorosos > 0 ? 'widget-danger' : 'widget-success'}">
                        <div class="widget-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="widget-content">
                            <div class="widget-title">Residentes Morosos</div>
                            <div class="widget-value">${stats.residentesMorosos}</div>
                            <div class="widget-subtitle">${((stats.residentesMorosos / stats.totalResidentes) * 100).toFixed(1)}% del total</div>
                        </div>
                    </div>
                </div>

                <!-- Gráficos y resúmenes -->
                <div class="dashboard-charts">
                    <div class="row">
                        <div class="col-8">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">Ingresos vs Egresos (Últimos 12 meses)</h3>
                                </div>
                                <div class="card-body">
                                    <canvas id="ingresos-egresos-chart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">Distribución de Estados</h3>
                                </div>
                                <div class="card-body">
                                    <canvas id="estados-chart" width="200" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Resumen de morosidad -->
                ${stats.residentesMorosos > 0 ? this.getMorosidadHTML() : ''}

                <!-- Acciones rápidas -->
                <div class="dashboard-actions">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Acciones Rápidas</h3>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-3">
                                    <button class="btn btn-primary btn-block" onclick="app.navigateToModule('residentes')">
                                        <i class="fas fa-users"></i>
                                        Gestionar Residentes
                                    </button>
                                </div>
                                <div class="col-3">
                                    <button class="btn btn-secondary btn-block" onclick="app.navigateToModule('gastos')">
                                        <i class="fas fa-money-bill-wave"></i>
                                        Registrar Pago
                                    </button>
                                </div>
                                <div class="col-3">
                                    <button class="btn btn-warning btn-block" onclick="app.navigateToModule('comunicaciones')">
                                        <i class="fas fa-envelope"></i>
                                        Enviar Comunicación
                                    </button>
                                </div>
                                <div class="col-3">
                                    <button class="btn btn-info btn-block" onclick="app.navigateToModule('informes')">
                                        <i class="fas fa-chart-bar"></i>
                                        Ver Informes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getMorosidadHTML() {
        const stats = this.data.stats;
        
        return `
            <div class="dashboard-morosidad">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Resumen de Morosidad</h3>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-4">
                                <div class="morosidad-stat">
                                    <div class="stat-value text-danger">${stats.residentesMorosos}</div>
                                    <div class="stat-label">Residentes Morosos</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="morosidad-stat">
                                    <div class="stat-value text-danger">${helpers.formatCurrency(stats.deudaTotalMorosos)}</div>
                                    <div class="stat-label">Deuda Total</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="morosidad-stat">
                                    <div class="stat-value text-info">${stats.parcelasMorosas.join(', ')}</div>
                                    <div class="stat-label">Parcelas Morosas</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        // Configurar eventos específicos del dashboard si es necesario
    },

    async renderCharts() {
        try {
            await this.renderIngresosEgresosChart();
            await this.renderEstadosChart();
        } catch (error) {
            console.error('Error renderizando gráficos:', error);
        }
    },

    async renderIngresosEgresosChart() {
        const ctx = document.getElementById('ingresos-egresos-chart');
        if (!ctx) return;

        // Obtener datos de los últimos 12 meses
        const chartData = this.getIngresosEgresosData();

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: chartData.ingresos,
                        backgroundColor: 'rgba(76, 175, 80, 0.8)',
                        borderColor: 'rgba(76, 175, 80, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Egresos',
                        data: chartData.egresos,
                        backgroundColor: 'rgba(255, 152, 0, 0.8)',
                        borderColor: 'rgba(255, 152, 0, 1)',
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
                                return helpers.formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + helpers.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                }
            }
        });
    },

    async renderEstadosChart() {
        const ctx = document.getElementById('estados-chart');
        if (!ctx) return;

        const stats = this.data.stats;
        const residentesInactivos = stats.totalResidentes - stats.residentesActivos - stats.residentesMorosos;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Activos', 'Morosos', 'Inactivos'],
                datasets: [{
                    data: [stats.residentesActivos, stats.residentesMorosos, residentesInactivos],
                    backgroundColor: [
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(244, 67, 54, 0.8)',
                        'rgba(158, 158, 158, 0.8)'
                    ],
                    borderColor: [
                        'rgba(76, 175, 80, 1)',
                        'rgba(244, 67, 54, 1)',
                        'rgba(158, 158, 158, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    getIngresosEgresosData() {
        const hoy = new Date();
        const labels = [];
        const ingresos = [];
        const egresos = [];

        // Generar últimos 12 meses
        for (let i = 11; i >= 0; i--) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            const periodo = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
            
            labels.push(fecha.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }));

            // Calcular ingresos del mes
            const ingresosMes = this.data.pagos
                .filter(p => {
                    const fechaPago = new Date(p.FechaPago);
                    return fechaPago.getMonth() === fecha.getMonth() && 
                           fechaPago.getFullYear() === fecha.getFullYear();
                })
                .reduce((sum, p) => sum + parseFloat(p.MontoPagado || 0), 0);

            // Calcular egresos del mes
            const egresosMes = this.data.egresos
                .filter(e => {
                    const fechaEgreso = new Date(e.Fecha);
                    return fechaEgreso.getMonth() === fecha.getMonth() && 
                           fechaEgreso.getFullYear() === fecha.getFullYear();
                })
                .reduce((sum, e) => sum + parseFloat(e.Monto || 0), 0);

            ingresos.push(ingresosMes);
            egresos.push(egresosMes);
        }

        return { labels, ingresos, egresos };
    }
};

// Exportar para uso global
window.DashboardModule = DashboardModule;

