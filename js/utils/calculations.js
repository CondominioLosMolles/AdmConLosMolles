// ===== CÁLCULOS FINANCIEROS =====

class FinancialCalculations {
    constructor() {
        this.TIMC_RATES = {}; // Tasas TIMC por mes/año
    }

    // Configurar tasas TIMC
    setTIMCRate(year, month, rate) {
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        this.TIMC_RATES[key] = parseFloat(rate);
    }

    // Obtener tasa TIMC para un período específico
    getTIMCRate(year, month) {
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        return this.TIMC_RATES[key] || 0;
    }

    // Calcular interés por atraso
    calculateInterest(gastoComun, year, month) {
        const timcAnual = this.getTIMCRate(year, month);
        if (timcAnual === 0) return 0;
        
        // Interés = Valor_Gasto_Comun * TIMC / 100 / 12
        const interes = (gastoComun * timcAnual) / 100 / 12;
        return Math.round(interes);
    }

    // Calcular multa (1/4 del gasto común)
    calculateMulta(gastoComun) {
        return Math.round(gastoComun / 4);
    }

    // Calcular meses de impago
    calculateMesesImpago(fechaVencimiento, fechaActual = new Date()) {
        const vencimiento = new Date(fechaVencimiento);
        const actual = new Date(fechaActual);
        
        // Si no ha vencido, no hay meses de impago
        if (actual <= vencimiento) return 0;
        
        // Calcular diferencia en meses
        const diffTime = actual.getTime() - vencimiento.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Cada mes completo después del vencimiento cuenta como 1 mes de impago
        return Math.floor(diffDays / 30) + 1;
    }

    // Calcular fecha de vencimiento (día 10 del mes correspondiente)
    calculateFechaVencimiento(periodo) {
        const [year, month] = periodo.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, 10);
    }

    // Calcular deuda total
    calculateDeudaTotal(gastoComun, interes, multaTotal) {
        return gastoComun + interes + multaTotal;
    }

    // Calcular saldo pendiente o a favor
    calculateSaldo(montoPagado, deudaTotal) {
        return montoPagado - deudaTotal;
    }

    // Determinar estado del pago
    determineEstado(fechaVencimiento, deudaTotal, montoPagado, fechaActual = new Date()) {
        const vencimiento = new Date(fechaVencimiento);
        const actual = new Date(fechaActual);
        const saldo = this.calculateSaldo(montoPagado, deudaTotal);
        
        // Si el saldo es 0 o positivo, está pagado
        if (saldo >= 0) return 'Pagado';
        
        // Si no ha vencido, está pendiente
        if (actual <= vencimiento) return 'Pendiente';
        
        // Si ha vencido y tiene deuda, está moroso
        return 'Moroso';
    }

    // Calcular resumen completo de un pago
    calculatePaymentSummary(data) {
        const {
            gastoComun,
            periodo,
            montoPagado = 0,
            fechaPago = null,
            fechaActual = new Date()
        } = data;

        // Calcular fecha de vencimiento
        const fechaVencimiento = this.calculateFechaVencimiento(periodo);
        
        // Extraer año y mes del período
        const [year, month] = periodo.split('-');
        
        // Calcular meses de impago
        const mesesImpago = this.calculateMesesImpago(fechaVencimiento, fechaActual);
        
        // Calcular interés (solo se aplica una vez en el primer mes de atraso)
        const interes = mesesImpago > 0 ? this.calculateInterest(gastoComun, parseInt(year), parseInt(month)) : 0;
        
        // Calcular multa total (1/4 por cada mes de atraso)
        const multaUnitaria = this.calculateMulta(gastoComun);
        const multaTotal = multaUnitaria * mesesImpago;
        
        // Calcular deuda total
        const deudaTotal = this.calculateDeudaTotal(gastoComun, interes, multaTotal);
        
        // Calcular saldo
        const saldo = this.calculateSaldo(montoPagado, deudaTotal);
        
        // Determinar estado
        const estado = this.determineEstado(fechaVencimiento, deudaTotal, montoPagado, fechaActual);

        return {
            gastoComun,
            periodo,
            fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
            montoPagado,
            saldo,
            interes,
            multaUnitaria,
            multaTotal,
            mesesImpago,
            deudaTotal,
            estado,
            fechaPago
        };
    }

    // Calcular resumen de morosidad para un residente
    calculateMorosidadSummary(pagos) {
        let totalDeuda = 0;
        let mesesMorosos = 0;
        let ultimoPago = null;
        
        pagos.forEach(pago => {
            const summary = this.calculatePaymentSummary(pago);
            
            if (summary.estado === 'Moroso') {
                totalDeuda += Math.max(0, -summary.saldo);
                mesesMorosos++;
            }
            
            if (pago.fechaPago && (!ultimoPago || new Date(pago.fechaPago) > new Date(ultimoPago))) {
                ultimoPago = pago.fechaPago;
            }
        });

        return {
            totalDeuda,
            mesesMorosos,
            ultimoPago,
            esMoroso: totalDeuda > 0
        };
    }

    // Calcular estadísticas financieras generales
    calculateFinancialStats(ingresos, egresos) {
        const totalIngresos = ingresos.reduce((sum, ingreso) => sum + parseFloat(ingreso.monto || 0), 0);
        const totalEgresos = egresos.reduce((sum, egreso) => sum + parseFloat(egreso.monto || 0), 0);
        const saldoCaja = totalIngresos - totalEgresos;
        
        // Agrupar por mes
        const ingresosPorMes = this.groupByMonth(ingresos);
        const egresosPorMes = this.groupByMonth(egresos);
        
        return {
            totalIngresos,
            totalEgresos,
            saldoCaja,
            ingresosPorMes,
            egresosPorMes
        };
    }

    // Agrupar datos por mes
    groupByMonth(data) {
        const grouped = {};
        
        data.forEach(item => {
            const fecha = new Date(item.fecha || item.fechaPago);
            const key = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!grouped[key]) {
                grouped[key] = {
                    periodo: key,
                    total: 0,
                    count: 0,
                    items: []
                };
            }
            
            grouped[key].total += parseFloat(item.monto || 0);
            grouped[key].count++;
            grouped[key].items.push(item);
        });
        
        return grouped;
    }

    // Calcular proyección de ingresos
    calculateIncomeProjection(residentes, mesesProyeccion = 12) {
        const totalGastoComun = residentes
            .filter(r => r.estado === 'Activo')
            .reduce((sum, r) => sum + parseFloat(r.valorGastoComun || 0), 0);
        
        const proyeccionMensual = totalGastoComun;
        const proyeccionAnual = proyeccionMensual * 12;
        
        return {
            mensual: proyeccionMensual,
            anual: proyeccionAnual,
            proyeccion: proyeccionMensual * mesesProyeccion
        };
    }

    // Calcular indicadores de gestión
    calculateManagementIndicators(residentes, pagos, egresos) {
        const totalResidentes = residentes.length;
        const residentesActivos = residentes.filter(r => r.estado === 'Activo').length;
        const residentesMorosos = residentes.filter(r => r.estado === 'Moroso').length;
        
        const tasaMorosidad = totalResidentes > 0 ? (residentesMorosos / totalResidentes) * 100 : 0;
        const tasaActividad = totalResidentes > 0 ? (residentesActivos / totalResidentes) * 100 : 0;
        
        // Calcular eficiencia de cobranza
        const pagosDelMes = pagos.filter(p => {
            const fecha = new Date(p.fechaPago);
            const hoy = new Date();
            return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
        });
        
        const montoEsperado = residentesActivos * (residentes.reduce((sum, r) => sum + parseFloat(r.valorGastoComun || 0), 0) / residentes.length);
        const montoRecaudado = pagosDelMes.reduce((sum, p) => sum + parseFloat(p.montoPagado || 0), 0);
        const eficienciaCobranza = montoEsperado > 0 ? (montoRecaudado / montoEsperado) * 100 : 0;
        
        return {
            totalResidentes,
            residentesActivos,
            residentesMorosos,
            tasaMorosidad: Math.round(tasaMorosidad * 100) / 100,
            tasaActividad: Math.round(tasaActividad * 100) / 100,
            eficienciaCobranza: Math.round(eficienciaCobranza * 100) / 100,
            montoEsperado,
            montoRecaudado
        };
    }
}

// Crear instancia global
window.financialCalc = new FinancialCalculations();

// Exportar para uso en otros módulos
window.FinancialCalculations = FinancialCalculations;

