// ===== MÓDULO INFORMES =====

const InformesModule = {
    data: {
        residentes: [],
        pagos: [],
        egresos: [],
        mantenciones: [],
        multas: []
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando informes...');
            await this.loadData();
            container.innerHTML = this.getHTML();
            this.setupEvents();
        } catch (error) {
            console.error('Error cargando informes:', error);
            container.innerHTML = `<div class="text-center"><h2>Error cargando informes</h2><p>${error.message}</p></div>`;
        }
    },

    async loadData() {
        try {
            const [residentes, pagos, egresos, mantenciones, multas] = await Promise.all([
                sheetsAPI.getResidentes(),
                sheetsAPI.getPagos(),
                sheetsAPI.getEgresos(),
                sheetsAPI.getMantenciones(),
                sheetsAPI.getMultas()
            ]);

            this.data.residentes = residentes;
            this.data.pagos = pagos;
            this.data.egresos = egresos;
            this.data.mantenciones = mantenciones;
            this.data.multas = multas;
        } catch (error) {
            console.error('Error cargando datos para informes:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="informes-module">
                <div class="module-header">
                    <h1>Informes</h1>
                    <p>Generación de reportes y análisis del condominio</p>
                </div>

                <!-- Filtros generales -->
                <div class="filters-container">
                    <div class="filter-group">
                        <label class="form-label">Período</label>
                        <select id="periodo-informe" class="form-control">
                            <option value="mes-actual">Mes Actual</option>
                            <option value="mes-anterior">Mes Anterior</option>
                            <option value="trimestre">Último Trimestre</option>
                            <option value="semestre">Último Semestre</option>
                            <option value="año">Año Actual</option>
                            <option value="personalizado">Período Personalizado</option>
                        </select>
                    </div>
                    <div class="filter-group" id="fechas-personalizadas" style="display: none;">
                        <label class="form-label">Desde</label>
                        <input type="date" id="fecha-desde" class="form-control">
                    </div>
                    <div class="filter-group" id="fechas-personalizadas-hasta" style="display: none;">
                        <label class="form-label">Hasta</label>
                        <input type="date" id="fecha-hasta" class="form-control">
                    </div>
                </div>

                <!-- Grid de informes disponibles -->
                <div class="reports-grid">
                    <div class="row">
                        <div class="col-4">
                            <div class="report-card" onclick="InformesModule.generateReport('financiero')">
                                <div class="report-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="report-title">Informe Financiero</div>
                                <div class="report-description">
                                    Resumen de ingresos, egresos y estado financiero del condominio
                                </div>
                                <button class="btn btn-primary btn-sm">Generar</button>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="report-card" onclick="InformesModule.generateReport('morosidad')">
                                <div class="report-icon">
                                    <i class="fas fa-exclamation-triangle"></i>
                                </div>
                                <div class="report-title">Informe de Morosidad</div>
                                <div class="report-description">
                                    Detalle de residentes morosos y análisis de cobranza
                                </div>
                                <button class="btn btn-warning btn-sm">Generar</button>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="report-card" onclick="InformesModule.generateReport('mantenciones')">
                                <div class="report-icon">
                                    <i class="fas fa-tools"></i>
                                </div>
                                <div class="report-title">Informe de Mantenciones</div>
                                <div class="report-description">
                                    Estado de mantenciones y gastos asociados
                                </div>
                                <button class="btn btn-info btn-sm">Generar</button>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-4">
                            <div class="report-card" onclick="InformesModule.generateReport('residentes')">
                                <div class="report-icon">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div class="report-title">Informe de Residentes</div>
                                <div class="report-description">
                                    Listado completo de residentes y su información
                                </div>
                                <button class="btn btn-secondary btn-sm">Generar</button>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="report-card" onclick="InformesModule.generateReport('multas')">
                                <div class="report-icon">
                                    <i class="fas fa-gavel"></i>
                                </div>
                                <div class="report-title">Informe de Multas</div>
                                <div class="report-description">
                                    Resumen de multas aplicadas y su estado de pago
                                </div>
                                <button class="btn btn-danger btn-sm">Generar</button>
                            </div>
                        </div>

                        <div class="col-4">
                            <div class="report-card" onclick="InformesModule.generateReport('completo')">
                                <div class="report-icon">
                                    <i class="fas fa-file-alt"></i>
                                </div>
                                <div class="report-title">Informe Completo</div>
                                <div class="report-description">
                                    Reporte integral con todos los aspectos del condominio
                                </div>
                                <button class="btn btn-success btn-sm">Generar</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Área de vista previa del informe -->
                <div id="report-preview" class="report-preview" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Vista Previa del Informe</h3>
                            <div class="card-actions">
                                <button id="download-pdf-btn" class="btn btn-primary">
                                    <i class="fas fa-file-pdf"></i>
                                    Descargar PDF
                                </button>
                                <button id="download-excel-btn" class="btn btn-success">
                                    <i class="fas fa-file-excel"></i>
                                    Descargar Excel
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="report-content"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        // Cambio de período
        const periodoSelect = document.getElementById('periodo-informe');
        if (periodoSelect) {
            periodoSelect.addEventListener('change', () => {
                const isPersonalizado = periodoSelect.value === 'personalizado';
                document.getElementById('fechas-personalizadas').style.display = isPersonalizado ? 'block' : 'none';
                document.getElementById('fechas-personalizadas-hasta').style.display = isPersonalizado ? 'block' : 'none';
            });
        }

        // Botones de descarga
        document.getElementById('download-pdf-btn')?.addEventListener('click', () => this.downloadPDF());
        document.getElementById('download-excel-btn')?.addEventListener('click', () => this.downloadExcel());
    },

    getDateRange() {
        const periodo = document.getElementById('periodo-informe').value;
        const hoy = new Date();
        let desde, hasta;

        switch (periodo) {
            case 'mes-actual':
                desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                break;
            case 'mes-anterior':
                desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
                hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
                break;
            case 'trimestre':
                desde = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
                hasta = hoy;
                break;
            case 'semestre':
                desde = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
                hasta = hoy;
                break;
            case 'año':
                desde = new Date(hoy.getFullYear(), 0, 1);
                hasta = hoy;
                break;
            case 'personalizado':
                desde = new Date(document.getElementById('fecha-desde').value);
                hasta = new Date(document.getElementById('fecha-hasta').value);
                break;
            default:
                desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                hasta = hoy;
        }

        return { desde, hasta };
    },

    generateReport(tipo) {
        try {
            const { desde, hasta } = this.getDateRange();
            let reportContent = '';

            switch (tipo) {
                case 'financiero':
                    reportContent = this.generateFinancialReport(desde, hasta);
                    break;
                case 'morosidad':
                    reportContent = this.generateMorosidadReport(desde, hasta);
                    break;
                case 'mantenciones':
                    reportContent = this.generateMantencionesReport(desde, hasta);
                    break;
                case 'residentes':
                    reportContent = this.generateResidentesReport();
                    break;
                case 'multas':
                    reportContent = this.generateMultasReport(desde, hasta);
                    break;
                case 'completo':
                    reportContent = this.generateCompleteReport(desde, hasta);
                    break;
            }

            // Mostrar vista previa
            document.getElementById('report-content').innerHTML = reportContent;
            document.getElementById('report-preview').style.display = 'block';
            
            // Scroll hacia la vista previa
            document.getElementById('report-preview').scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Error generando informe:', error);
            app.showNotification('Error al generar informe: ' + error.message, 'error');
        }
    },

    generateFinancialReport(desde, hasta) {
        const ingresos = this.data.pagos.filter(p => {
            const fecha = new Date(p.FechaPago);
            return fecha >= desde && fecha <= hasta && p.FechaPago;
        });

        const egresos = this.data.egresos.filter(e => {
            const fecha = new Date(e.Fecha);
            return fecha >= desde && fecha <= hasta;
        });

        const totalIngresos = ingresos.reduce((sum, i) => sum + parseFloat(i.MontoPagado || 0), 0);
        const totalEgresos = egresos.reduce((sum, e) => sum + parseFloat(e.Monto || 0), 0);
        const saldoNeto = totalIngresos - totalEgresos;

        return `
            <div class="report-header">
                <h2>Informe Financiero</h2>
                <p>Período: ${helpers.formatDate(desde)} - ${helpers.formatDate(hasta)}</p>
            </div>

            <div class="financial-summary">
                <div class="row">
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Total Ingresos</h4>
                            <div class="amount positive">${helpers.formatCurrency(totalIngresos)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Total Egresos</h4>
                            <div class="amount negative">${helpers.formatCurrency(totalEgresos)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Saldo Neto</h4>
                            <div class="amount ${saldoNeto >= 0 ? 'positive' : 'negative'}">${helpers.formatCurrency(saldoNeto)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>Detalle de Ingresos</h3>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Residente</th>
                            <th>Parcela</th>
                            <th>Período</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ingresos.map(i => `
                            <tr>
                                <td>${helpers.formatDate(i.FechaPago)}</td>
                                <td>${i.Nombre_Residente}</td>
                                <td>${i.N_Parcela}</td>
                                <td>${i.Periodo}</td>
                                <td>${helpers.formatCurrency(i.MontoPagado)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="report-section">
                <h3>Detalle de Egresos</h3>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Categoría</th>
                            <th>Descripción</th>
                            <th>Proveedor</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${egresos.map(e => `
                            <tr>
                                <td>${helpers.formatDate(e.Fecha)}</td>
                                <td>${e.Categoria}</td>
                                <td>${e.Descripcion}</td>
                                <td>${e.Proveedor}</td>
                                <td>${helpers.formatCurrency(e.Monto)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generateMorosidadReport(desde, hasta) {
        const morosos = this.data.residentes.filter(r => r.Estado === 'Moroso');
        const pagosAtrasados = this.data.pagos.filter(p => p.Estado === 'Moroso');
        const deudaTotal = pagosAtrasados.reduce((sum, p) => sum + parseFloat(p.Deuda_Total || 0), 0);

        return `
            <div class="report-header">
                <h2>Informe de Morosidad</h2>
                <p>Período: ${helpers.formatDate(desde)} - ${helpers.formatDate(hasta)}</p>
            </div>

            <div class="morosidad-summary">
                <div class="row">
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Residentes Morosos</h4>
                            <div class="amount">${morosos.length}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>% de Morosidad</h4>
                            <div class="amount">${((morosos.length / this.data.residentes.length) * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Deuda Total</h4>
                            <div class="amount negative">${helpers.formatCurrency(deudaTotal)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>Detalle de Residentes Morosos</h3>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Parcela</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Deuda</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${morosos.map(m => {
                            const deudaResidente = pagosAtrasados
                                .filter(p => p.N_Parcela == m.N_Parcela)
                                .reduce((sum, p) => sum + parseFloat(p.Deuda_Total || 0), 0);
                            return `
                                <tr>
                                    <td>${m.NombreCompleto}</td>
                                    <td>${m.N_Parcela}</td>
                                    <td>${m.Email}</td>
                                    <td>${m.Telefono}</td>
                                    <td>${helpers.formatCurrency(deudaResidente)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generateMantencionesReport(desde, hasta) {
        const mantenciones = this.data.mantenciones.filter(m => {
            const fecha = new Date(m.Fecha);
            return fecha >= desde && fecha <= hasta;
        });

        const costoTotal = mantenciones.reduce((sum, m) => sum + parseFloat(m.CostoEstimado || 0), 0);
        const pendientes = mantenciones.filter(m => m.Estado === 'Pendiente').length;
        const completadas = mantenciones.filter(m => m.Estado === 'Completada').length;

        return `
            <div class="report-header">
                <h2>Informe de Mantenciones</h2>
                <p>Período: ${helpers.formatDate(desde)} - ${helpers.formatDate(hasta)}</p>
            </div>

            <div class="mantenciones-summary">
                <div class="row">
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Total Mantenciones</h4>
                            <div class="amount">${mantenciones.length}</div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Pendientes</h4>
                            <div class="amount">${pendientes}</div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Completadas</h4>
                            <div class="amount">${completadas}</div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Costo Total</h4>
                            <div class="amount">${helpers.formatCurrency(costoTotal)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>Detalle de Mantenciones</h3>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Área</th>
                            <th>Prioridad</th>
                            <th>Estado</th>
                            <th>Costo</th>
                            <th>Responsable</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mantenciones.map(m => `
                            <tr>
                                <td>${helpers.formatDate(m.Fecha)}</td>
                                <td>${m.Descripcion}</td>
                                <td>${m.Area}</td>
                                <td>${m.Prioridad}</td>
                                <td>${m.Estado}</td>
                                <td>${helpers.formatCurrency(m.CostoEstimado)}</td>
                                <td>${m.Responsable}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generateResidentesReport() {
        const activos = this.data.residentes.filter(r => r.Estado === 'Activo').length;
        const morosos = this.data.residentes.filter(r => r.Estado === 'Moroso').length;
        const inactivos = this.data.residentes.filter(r => r.Estado === 'Inactivo').length;

        return `
            <div class="report-header">
                <h2>Informe de Residentes</h2>
                <p>Fecha: ${helpers.formatDate(new Date())}</p>
            </div>

            <div class="residentes-summary">
                <div class="row">
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Total Residentes</h4>
                            <div class="amount">${this.data.residentes.length}</div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Activos</h4>
                            <div class="amount">${activos}</div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Morosos</h4>
                            <div class="amount">${morosos}</div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-item">
                            <h4>Inactivos</h4>
                            <div class="amount">${inactivos}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>Listado Completo de Residentes</h3>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>RUT</th>
                            <th>Parcela</th>
                            <th>Email</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Gasto Común</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.residentes.map(r => `
                            <tr>
                                <td>${r.NombreCompleto}</td>
                                <td>${r.RUT}</td>
                                <td>${r.N_Parcela}</td>
                                <td>${r.Email}</td>
                                <td>${r.Telefono}</td>
                                <td>${r.Estado}</td>
                                <td>${helpers.formatCurrency(r.ValorGastoComun)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generateMultasReport(desde, hasta) {
        const multas = this.data.multas.filter(m => {
            const fecha = new Date(m.Fecha);
            return fecha >= desde && fecha <= hasta;
        });

        const totalMultas = multas.reduce((sum, m) => sum + parseFloat(m.Monto || 0), 0);
        const pendientes = multas.filter(m => m.Estado === 'Pendiente').length;
        const pagadas = multas.filter(m => m.Estado === 'Pagada').length;

        return `
            <div class="report-header">
                <h2>Informe de Multas</h2>
                <p>Período: ${helpers.formatDate(desde)} - ${helpers.formatDate(hasta)}</p>
            </div>

            <div class="multas-summary">
                <div class="row">
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Total Multas</h4>
                            <div class="amount">${multas.length}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Monto Total</h4>
                            <div class="amount">${helpers.formatCurrency(totalMultas)}</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="summary-item">
                            <h4>Pendientes/Pagadas</h4>
                            <div class="amount">${pendientes}/${pagadas}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>Detalle de Multas</h3>
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Parcela</th>
                            <th>Motivo</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th>Fecha Pago</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${multas.map(m => `
                            <tr>
                                <td>${helpers.formatDate(m.Fecha)}</td>
                                <td>${m.N_Parcela}</td>
                                <td>${m.Motivo}</td>
                                <td>${helpers.formatCurrency(m.Monto)}</td>
                                <td>${m.Estado}</td>
                                <td>${m.FechaPago ? helpers.formatDate(m.FechaPago) : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    generateCompleteReport(desde, hasta) {
        return `
            <div class="report-header">
                <h2>Informe Completo del Condominio</h2>
                <p>Período: ${helpers.formatDate(desde)} - ${helpers.formatDate(hasta)}</p>
            </div>

            ${this.generateFinancialReport(desde, hasta)}
            ${this.generateMorosidadReport(desde, hasta)}
            ${this.generateMantencionesReport(desde, hasta)}
            ${this.generateMultasReport(desde, hasta)}
        `;
    },

    downloadPDF() {
        try {
            const content = document.getElementById('report-content').innerHTML;
            const printWindow = window.open('', '_blank');
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Informe Condominio Los Molles</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .report-header { text-align: center; margin-bottom: 30px; }
                        .summary-item { text-align: center; margin-bottom: 20px; }
                        .amount { font-size: 24px; font-weight: bold; }
                        .positive { color: green; }
                        .negative { color: red; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .report-section { margin-bottom: 40px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.print();
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            app.showNotification('Error al generar PDF: ' + error.message, 'error');
        }
    },

    downloadExcel() {
        try {
            // Implementar exportación a Excel basada en el tipo de informe actual
            app.showNotification('Funcionalidad de Excel en desarrollo', 'info');
        } catch (error) {
            console.error('Error generando Excel:', error);
            app.showNotification('Error al generar Excel: ' + error.message, 'error');
        }
    }
};

window.InformesModule = InformesModule;

