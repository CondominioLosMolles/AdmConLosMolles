// Módulo Informes - Generación y exportación de informes
class InformesModule {
    constructor() {
        this.residentes = [];
        this.pagos = [];
        this.egresos = [];
        this.multas = [];
        this.mantenciones = [];
    }

    // Renderizar el módulo
    async render() {
        const container = document.getElementById('content-container');
        Utils.showLoading(container);

        try {
            // Cargar datos necesarios
            await this.loadData();

            // Renderizar contenido
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents();

        } catch (error) {
            console.error('Error cargando informes:', error);
            Utils.showError(container, 'Error cargando los informes');
        }
    }

    // Cargar datos necesarios
    async loadData() {
        try {
            const [residentesData, pagosData, egresosData, multasData, mantencionesData] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES),
                window.googleAPI.readSheet(CONFIG.SHEETS.PAGOS_GC),
                window.googleAPI.readSheet(CONFIG.SHEETS.EGRESOS),
                window.googleAPI.readSheet(CONFIG.SHEETS.MULTAS),
                window.googleAPI.readSheet(CONFIG.SHEETS.MANTENCIONES)
            ]);

            // Procesar datos
            this.residentes = residentesData.length > 1 ? residentesData.slice(1).map((row, index) => ({
                id: row[0] || (index + 1),
                nombreCompleto: row[1] || '',
                rut: row[2] || '',
                nParcela: row[3] || '',
                email: row[4] || '',
                telefono: row[5] || '',
                estado: row[6] || 'Activo',
                valorGastoComun: parseFloat(row[7]) || 0
            })) : [];

            this.pagos = pagosData.length > 1 ? pagosData.slice(1).map((row, index) => ({
                id: row[0] || (index + 1),
                idResidente: row[1] || '',
                nParcela: row[2] || '',
                periodo: row[3] || '',
                fechaVencimiento: row[4] || '',
                montoPagado: parseFloat(row[5]) || 0,
                fechaPago: row[6] || '',
                metodoPago: row[7] || ''
            })) : [];

            this.egresos = egresosData.length > 1 ? egresosData.slice(1).map((row, index) => ({
                id: row[0] || (index + 1),
                fecha: row[1] || '',
                categoria: row[2] || '',
                descripcion: row[3] || '',
                proveedor: row[4] || '',
                monto: parseFloat(row[5]) || 0
            })) : [];

            this.multas = multasData.length > 1 ? multasData.slice(1).map((row, index) => ({
                id: row[0] || (index + 1),
                idResidente: row[1] || '',
                fechaInfraccion: row[2] || '',
                descripcion: row[3] || '',
                monto: parseFloat(row[4]) || 0,
                estado: row[5] || 'Pendiente',
                fechaPago: row[6] || ''
            })) : [];

            this.mantenciones = mantencionesData.length > 1 ? mantencionesData.slice(1).map((row, index) => ({
                id: row[0] || (index + 1),
                fecha: row[1] || '',
                encargado: row[2] || '',
                tipo: row[3] || '',
                descripcion: row[4] || '',
                estado: row[5] || 'Pendiente',
                costoTotal: parseFloat(row[6]) || 0
            })) : [];

        } catch (error) {
            console.error('Error cargando datos para informes:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        return `
            <div class="informes-container">
                <div class="module-header">
                    <h2>Informes</h2>
                    <p>Genere y exporte informes detallados del condominio</p>
                </div>

                <div class="informes-grid">
                    <!-- Informe de Morosidad -->
                    <div class="informe-card">
                        <div class="informe-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 class="informe-title">Informe de Morosidad</h3>
                        <p class="informe-description">
                            Listado detallado de residentes morosos con desglose de deudas, intereses y multas.
                        </p>
                        <button class="btn btn-primary" onclick="window.App.getCurrentModule().generateMorosidadReport()">
                            <i class="fas fa-file-pdf"></i>
                            Generar Informe
                        </button>
                    </div>

                    <!-- Estado de Resultados -->
                    <div class="informe-card">
                        <div class="informe-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <h3 class="informe-title">Estado de Resultados</h3>
                        <p class="informe-description">
                            Resumen financiero de ingresos vs egresos en un período específico.
                        </p>
                        <div class="date-range-selector">
                            <label>Desde:</label>
                            <input type="date" id="estado-desde" class="form-input">
                            <label>Hasta:</label>
                            <input type="date" id="estado-hasta" class="form-input" value="${Utils.formatDateForInput(new Date())}">
                        </div>
                        <button class="btn btn-primary" onclick="window.App.getCurrentModule().generateEstadoResultados()">
                            <i class="fas fa-file-excel"></i>
                            Generar Informe
                        </button>
                    </div>

                    <!-- Historial de Pagos por Residente -->
                    <div class="informe-card">
                        <div class="informe-icon">
                            <i class="fas fa-user-check"></i>
                        </div>
                        <h3 class="informe-title">Historial de Pagos</h3>
                        <p class="informe-description">
                            Historial completo de pagos y deudas de un residente específico.
                        </p>
                        <div class="form-group">
                            <select id="residente-historial" class="form-select">
                                <option value="">Seleccionar residente...</option>
                                ${this.residentes.map(r => `
                                    <option value="${r.id}">Parcela ${r.nParcela} - ${r.nombreCompleto}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button class="btn btn-primary" onclick="window.App.getCurrentModule().generateHistorialPagos()">
                            <i class="fas fa-file-pdf"></i>
                            Generar Informe
                        </button>
                    </div>

                    <!-- Gastos por Categoría -->
                    <div class="informe-card">
                        <div class="informe-icon">
                            <i class="fas fa-chart-pie"></i>
                        </div>
                        <h3 class="informe-title">Gastos por Categoría</h3>
                        <p class="informe-description">
                            Análisis de gastos desglosados por categoría en un período determinado.
                        </p>
                        <div class="date-range-selector">
                            <label>Desde:</label>
                            <input type="date" id="gastos-desde" class="form-input">
                            <label>Hasta:</label>
                            <input type="date" id="gastos-hasta" class="form-input" value="${Utils.formatDateForInput(new Date())}">
                        </div>
                        <button class="btn btn-primary" onclick="window.App.getCurrentModule().generateGastosPorCategoria()">
                            <i class="fas fa-file-excel"></i>
                            Generar Informe
                        </button>
                    </div>

                    <!-- Informe de Mantenciones -->
                    <div class="informe-card">
                        <div class="informe-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <h3 class="informe-title">Informe de Mantenciones</h3>
                        <p class="informe-description">
                            Listado completo de mantenciones realizadas y pendientes.
                        </p>
                        <div class="date-range-selector">
                            <label>Desde:</label>
                            <input type="date" id="mantenciones-desde" class="form-input">
                            <label>Hasta:</label>
                            <input type="date" id="mantenciones-hasta" class="form-input" value="${Utils.formatDateForInput(new Date())}">
                        </div>
                        <button class="btn btn-primary" onclick="window.App.getCurrentModule().generateMantencionesReport()">
                            <i class="fas fa-file-pdf"></i>
                            Generar Informe
                        </button>
                    </div>

                    <!-- Informe de Multas -->
                    <div class="informe-card">
                        <div class="informe-icon">
                            <i class="fas fa-gavel"></i>
                        </div>
                        <h3 class="informe-title">Informe de Multas</h3>
                        <p class="informe-description">
                            Registro de multas cursadas, pagadas y pendientes.
                        </p>
                        <div class="date-range-selector">
                            <label>Desde:</label>
                            <input type="date" id="multas-desde" class="form-input">
                            <label>Hasta:</label>
                            <input type="date" id="multas-hasta" class="form-input" value="${Utils.formatDateForInput(new Date())}">
                        </div>
                        <button class="btn btn-primary" onclick="window.App.getCurrentModule().generateMultasReport()">
                            <i class="fas fa-file-excel"></i>
                            Generar Informe
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurar eventos
    setupEvents() {
        // Configurar fechas por defecto (último año)
        const fechaDesde = new Date();
        fechaDesde.setFullYear(fechaDesde.getFullYear() - 1);
        
        const inputs = ['estado-desde', 'gastos-desde', 'mantenciones-desde', 'multas-desde'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = Utils.formatDateForInput(fechaDesde);
            }
        });
    }

    // Generar informe de morosidad
    generateMorosidadReport() {
        try {
            // Calcular morosidad para cada residente
            const residentesMorosos = [];
            const currentYear = new Date().getFullYear();

            this.residentes.forEach(residente => {
                let deudaTotal = 0;
                let detalleDeuda = [];

                // Calcular deuda por cada mes del año actual
                for (let month = 1; month <= 12; month++) {
                    const periodo = `${currentYear}-${String(month).padStart(2, '0')}`;
                    const fechaVencimiento = Utils.generateFechaVencimiento(currentYear, month);
                    
                    const pago = this.pagos.find(p => 
                        p.idResidente === residente.id && p.periodo === periodo
                    );

                    const montoPagado = pago ? pago.montoPagado : 0;
                    const valorGastoComun = residente.valorGastoComun;
                    const valorPendiente = valorGastoComun - montoPagado;

                    if (valorPendiente > 0) {
                        const mesesMora = Utils.calculateMesesMora(fechaVencimiento);
                        const interesMora = Utils.calculateInteresMora(valorGastoComun, mesesMora);
                        const multaAdicional = Utils.calculateMultaAdicional(valorGastoComun, mesesMora);
                        const deudaMes = valorPendiente + interesMora + multaAdicional;

                        deudaTotal += deudaMes;
                        detalleDeuda.push({
                            mes: new Date(currentYear, month - 1, 1).toLocaleDateString('es-CL', { month: 'long' }),
                            valorGastoComun,
                            montoPagado,
                            valorPendiente,
                            interesMora,
                            multaAdicional,
                            deudaMes
                        });
                    }
                }

                // Agregar multas pendientes
                const multasPendientes = this.multas.filter(m => 
                    m.idResidente === residente.id && m.estado === 'Pendiente'
                );
                const totalMultas = multasPendientes.reduce((sum, m) => sum + m.monto, 0);
                deudaTotal += totalMultas;

                if (deudaTotal > 0) {
                    residentesMorosos.push({
                        residente,
                        deudaTotal,
                        detalleDeuda,
                        multasPendientes,
                        totalMultas
                    });
                }
            });

            // Generar datos para Excel
            const headers = [
                'Parcela', 'Nombre Completo', 'RUT', 'Email', 'Teléfono',
                'Deuda Gastos Comunes', 'Multas Pendientes', 'Deuda Total'
            ];
            
            const data = [headers];
            
            residentesMorosos.forEach(item => {
                data.push([
                    item.residente.nParcela,
                    item.residente.nombreCompleto,
                    item.residente.rut,
                    item.residente.email,
                    item.residente.telefono,
                    item.deudaTotal - item.totalMultas,
                    item.totalMultas,
                    item.deudaTotal
                ]);
            });

            // Agregar resumen
            data.push([]);
            data.push(['RESUMEN']);
            data.push(['Total residentes morosos:', residentesMorosos.length]);
            data.push(['Deuda total:', residentesMorosos.reduce((sum, item) => sum + item.deudaTotal, 0)]);

            Utils.exportToExcel(data, `Informe_Morosidad_${Utils.formatDate(new Date()).replace(/\//g, '-')}`, 'Morosidad');
            Utils.showToast('Informe de morosidad generado correctamente', 'success');

        } catch (error) {
            console.error('Error generando informe de morosidad:', error);
            Utils.showToast('Error generando el informe de morosidad', 'error');
        }
    }

    // Generar estado de resultados
    generateEstadoResultados() {
        try {
            const fechaDesde = document.getElementById('estado-desde').value;
            const fechaHasta = document.getElementById('estado-hasta').value;

            if (!fechaDesde || !fechaHasta) {
                Utils.showToast('Seleccione el rango de fechas', 'warning');
                return;
            }

            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);

            // Filtrar ingresos (pagos + multas pagadas)
            const ingresosPagos = this.pagos.filter(p => {
                if (!p.fechaPago) return false;
                const fecha = Utils.parseDate(p.fechaPago);
                return fecha && fecha >= desde && fecha <= hasta;
            });

            const ingresosMultas = this.multas.filter(m => {
                if (m.estado !== 'Pagada' || !m.fechaPago) return false;
                const fecha = Utils.parseDate(m.fechaPago);
                return fecha && fecha >= desde && fecha <= hasta;
            });

            // Filtrar egresos
            const egresosFiltered = this.egresos.filter(e => {
                if (!e.fecha) return false;
                const fecha = Utils.parseDate(e.fecha);
                return fecha && fecha >= desde && fecha <= hasta;
            });

            // Calcular totales
            const totalIngresosPagos = ingresosPagos.reduce((sum, p) => sum + p.montoPagado, 0);
            const totalIngresosMultas = ingresosMultas.reduce((sum, m) => sum + m.monto, 0);
            const totalIngresos = totalIngresosPagos + totalIngresosMultas;

            const totalEgresos = egresosFiltered.reduce((sum, e) => sum + e.monto, 0);
            const resultado = totalIngresos - totalEgresos;

            // Generar datos para Excel
            const data = [
                ['ESTADO DE RESULTADOS'],
                [`Período: ${Utils.formatDate(desde)} - ${Utils.formatDate(hasta)}`],
                [],
                ['INGRESOS'],
                ['Concepto', 'Monto'],
                ['Gastos Comunes', totalIngresosPagos],
                ['Multas', totalIngresosMultas],
                ['TOTAL INGRESOS', totalIngresos],
                [],
                ['EGRESOS'],
                ['Categoría', 'Monto']
            ];

            // Agrupar egresos por categoría
            const egresosPorCategoria = {};
            egresosFiltered.forEach(e => {
                if (!egresosPorCategoria[e.categoria]) {
                    egresosPorCategoria[e.categoria] = 0;
                }
                egresosPorCategoria[e.categoria] += e.monto;
            });

            Object.entries(egresosPorCategoria).forEach(([categoria, monto]) => {
                data.push([categoria, monto]);
            });

            data.push(['TOTAL EGRESOS', totalEgresos]);
            data.push([]);
            data.push(['RESULTADO', resultado]);
            data.push([resultado >= 0 ? 'SUPERÁVIT' : 'DÉFICIT', Math.abs(resultado)]);

            Utils.exportToExcel(data, `Estado_Resultados_${fechaDesde}_${fechaHasta}`, 'Estado de Resultados');
            Utils.showToast('Estado de resultados generado correctamente', 'success');

        } catch (error) {
            console.error('Error generando estado de resultados:', error);
            Utils.showToast('Error generando el estado de resultados', 'error');
        }
    }

    // Generar historial de pagos por residente
    generateHistorialPagos() {
        try {
            const residenteId = document.getElementById('residente-historial').value;
            if (!residenteId) {
                Utils.showToast('Seleccione un residente', 'warning');
                return;
            }

            const residente = this.residentes.find(r => r.id === residenteId);
            if (!residente) return;

            // Obtener pagos del residente
            const pagosResidente = this.pagos.filter(p => p.idResidente === residenteId);
            const multasResidente = this.multas.filter(m => m.idResidente === residenteId);

            // Generar datos para Excel
            const data = [
                ['HISTORIAL DE PAGOS'],
                [`Residente: ${residente.nombreCompleto}`],
                [`Parcela: ${residente.nParcela}`],
                [`RUT: ${residente.rut}`],
                [],
                ['PAGOS DE GASTOS COMUNES'],
                ['Período', 'Fecha Vencimiento', 'Monto Pagado', 'Fecha Pago', 'Método Pago']
            ];

            pagosResidente.forEach(pago => {
                data.push([
                    pago.periodo,
                    pago.fechaVencimiento,
                    pago.montoPagado,
                    pago.fechaPago,
                    pago.metodoPago
                ]);
            });

            data.push([]);
            data.push(['MULTAS']);
            data.push(['Fecha Infracción', 'Descripción', 'Monto', 'Estado', 'Fecha Pago']);

            multasResidente.forEach(multa => {
                data.push([
                    multa.fechaInfraccion,
                    multa.descripcion,
                    multa.monto,
                    multa.estado,
                    multa.fechaPago || '-'
                ]);
            });

            // Resumen
            const totalPagado = pagosResidente.reduce((sum, p) => sum + p.montoPagado, 0);
            const totalMultas = multasResidente.reduce((sum, m) => sum + m.monto, 0);

            data.push([]);
            data.push(['RESUMEN']);
            data.push(['Total pagado en gastos comunes:', totalPagado]);
            data.push(['Total en multas:', totalMultas]);

            Utils.exportToExcel(data, `Historial_Pagos_Parcela_${residente.nParcela}`, 'Historial');
            Utils.showToast('Historial de pagos generado correctamente', 'success');

        } catch (error) {
            console.error('Error generando historial de pagos:', error);
            Utils.showToast('Error generando el historial de pagos', 'error');
        }
    }

    // Generar informe de gastos por categoría
    generateGastosPorCategoria() {
        try {
            const fechaDesde = document.getElementById('gastos-desde').value;
            const fechaHasta = document.getElementById('gastos-hasta').value;

            if (!fechaDesde || !fechaHasta) {
                Utils.showToast('Seleccione el rango de fechas', 'warning');
                return;
            }

            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);

            // Filtrar egresos por fecha
            const egresosFiltered = this.egresos.filter(e => {
                if (!e.fecha) return false;
                const fecha = Utils.parseDate(e.fecha);
                return fecha && fecha >= desde && fecha <= hasta;
            });

            // Agrupar por categoría
            const gastosPorCategoria = {};
            egresosFiltered.forEach(e => {
                if (!gastosPorCategoria[e.categoria]) {
                    gastosPorCategoria[e.categoria] = [];
                }
                gastosPorCategoria[e.categoria].push(e);
            });

            // Generar datos para Excel
            const data = [
                ['GASTOS POR CATEGORÍA'],
                [`Período: ${Utils.formatDate(desde)} - ${Utils.formatDate(hasta)}`],
                []
            ];

            let totalGeneral = 0;

            Object.entries(gastosPorCategoria).forEach(([categoria, gastos]) => {
                const totalCategoria = gastos.reduce((sum, g) => sum + g.monto, 0);
                totalGeneral += totalCategoria;

                data.push([`CATEGORÍA: ${categoria.toUpperCase()}`]);
                data.push(['Fecha', 'Descripción', 'Proveedor', 'Monto']);

                gastos.forEach(gasto => {
                    data.push([
                        gasto.fecha,
                        gasto.descripcion,
                        gasto.proveedor,
                        gasto.monto
                    ]);
                });

                data.push(['SUBTOTAL', '', '', totalCategoria]);
                data.push([]);
            });

            data.push(['TOTAL GENERAL', '', '', totalGeneral]);

            Utils.exportToExcel(data, `Gastos_Por_Categoria_${fechaDesde}_${fechaHasta}`, 'Gastos por Categoría');
            Utils.showToast('Informe de gastos por categoría generado correctamente', 'success');

        } catch (error) {
            console.error('Error generando informe de gastos por categoría:', error);
            Utils.showToast('Error generando el informe de gastos', 'error');
        }
    }

    // Generar informe de mantenciones
    generateMantencionesReport() {
        try {
            const fechaDesde = document.getElementById('mantenciones-desde').value;
            const fechaHasta = document.getElementById('mantenciones-hasta').value;

            if (!fechaDesde || !fechaHasta) {
                Utils.showToast('Seleccione el rango de fechas', 'warning');
                return;
            }

            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);

            // Filtrar mantenciones por fecha
            const mantencionesFiltered = this.mantenciones.filter(m => {
                if (!m.fecha) return false;
                const fecha = Utils.parseDate(m.fecha);
                return fecha && fecha >= desde && fecha <= hasta;
            });

            // Generar datos para Excel
            const data = [
                ['INFORME DE MANTENCIONES'],
                [`Período: ${Utils.formatDate(desde)} - ${Utils.formatDate(hasta)}`],
                [],
                ['Fecha', 'Encargado', 'Tipo', 'Descripción', 'Estado', 'Costo Total']
            ];

            let totalCosto = 0;

            mantencionesFiltered.forEach(mantencion => {
                data.push([
                    mantencion.fecha,
                    mantencion.encargado,
                    mantencion.tipo,
                    mantencion.descripcion,
                    mantencion.estado,
                    mantencion.costoTotal
                ]);
                totalCosto += mantencion.costoTotal;
            });

            // Resumen por estado
            const resumenEstados = {};
            mantencionesFiltered.forEach(m => {
                if (!resumenEstados[m.estado]) {
                    resumenEstados[m.estado] = { cantidad: 0, costo: 0 };
                }
                resumenEstados[m.estado].cantidad++;
                resumenEstados[m.estado].costo += m.costoTotal;
            });

            data.push([]);
            data.push(['RESUMEN POR ESTADO']);
            data.push(['Estado', 'Cantidad', 'Costo Total']);

            Object.entries(resumenEstados).forEach(([estado, info]) => {
                data.push([estado, info.cantidad, info.costo]);
            });

            data.push([]);
            data.push(['TOTAL MANTENCIONES', mantencionesFiltered.length, totalCosto]);

            Utils.exportToExcel(data, `Informe_Mantenciones_${fechaDesde}_${fechaHasta}`, 'Mantenciones');
            Utils.showToast('Informe de mantenciones generado correctamente', 'success');

        } catch (error) {
            console.error('Error generando informe de mantenciones:', error);
            Utils.showToast('Error generando el informe de mantenciones', 'error');
        }
    }

    // Generar informe de multas
    generateMultasReport() {
        try {
            const fechaDesde = document.getElementById('multas-desde').value;
            const fechaHasta = document.getElementById('multas-hasta').value;

            if (!fechaDesde || !fechaHasta) {
                Utils.showToast('Seleccione el rango de fechas', 'warning');
                return;
            }

            const desde = new Date(fechaDesde);
            const hasta = new Date(fechaHasta);

            // Filtrar multas por fecha de infracción
            const multasFiltered = this.multas.filter(m => {
                if (!m.fechaInfraccion) return false;
                const fecha = Utils.parseDate(m.fechaInfraccion);
                return fecha && fecha >= desde && fecha <= hasta;
            });

            // Generar datos para Excel
            const data = [
                ['INFORME DE MULTAS'],
                [`Período: ${Utils.formatDate(desde)} - ${Utils.formatDate(hasta)}`],
                [],
                ['Fecha Infracción', 'Residente', 'Parcela', 'Descripción', 'Monto', 'Estado', 'Fecha Pago']
            ];

            let totalMultas = 0;
            let totalPagadas = 0;
            let totalPendientes = 0;

            multasFiltered.forEach(multa => {
                const residente = this.residentes.find(r => r.id === multa.idResidente);
                const residenteInfo = residente ? residente.nombreCompleto : 'No encontrado';
                const parcela = residente ? residente.nParcela : '-';

                data.push([
                    multa.fechaInfraccion,
                    residenteInfo,
                    parcela,
                    multa.descripcion,
                    multa.monto,
                    multa.estado,
                    multa.fechaPago || '-'
                ]);

                totalMultas += multa.monto;
                if (multa.estado === 'Pagada') {
                    totalPagadas += multa.monto;
                } else {
                    totalPendientes += multa.monto;
                }
            });

            data.push([]);
            data.push(['RESUMEN']);
            data.push(['Total multas cursadas:', multasFiltered.length]);
            data.push(['Monto total:', totalMultas]);
            data.push(['Monto pagado:', totalPagadas]);
            data.push(['Monto pendiente:', totalPendientes]);

            Utils.exportToExcel(data, `Informe_Multas_${fechaDesde}_${fechaHasta}`, 'Multas');
            Utils.showToast('Informe de multas generado correctamente', 'success');

        } catch (error) {
            console.error('Error generando informe de multas:', error);
            Utils.showToast('Error generando el informe de multas', 'error');
        }
    }
}

// Exportar módulo
window.InformesModule = InformesModule;

