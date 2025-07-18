// js/informes.js
// Módulo Informes: morosidad, estado de resultados, historial de pagos, gastos por categoría, exportación PDF/Excel

/**
 * Parsea una cadena de fecha que puede estar en formato YYYY-MM-DD o DD-MM-YYYY.
 * @param {string} dateStr La cadena de fecha a parsear.
 * @returns {Date|null} Un objeto Date o null si el formato es inválido.
 */
function parseSheetDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    
    // Intenta formato YYYY-MM-DD
    let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
        // new Date(año, mes - 1, día)
        return new Date(Date.UTC(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])));
    }
    
    // Intenta formato DD-MM-YYYY
    match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (match) {
        return new Date(Date.UTC(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1])));
    }

    // Intento final con el constructor de Date, por si acaso.
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        return d;
    }

    return null; // Formato no reconocido
}

/**
 * Parsea una cadena de período (ej: "Enero 2025") a un objeto de fecha UTC.
 * @param {string} periodoStr La cadena de período a parsear.
 * @returns {Date|null} Un objeto Date para el primer día del mes, o null si el formato es inválido.
 */
function parsePeriodo(periodoStr) {
    if (!periodoStr || typeof periodoStr !== 'string') return null;

    const meses = {
        'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
        'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
    };

    const parts = periodoStr.toLowerCase().trim().split(' ');
    if (parts.length !== 2) return null;

    const mesNombre = parts[0];
    const anio = parseInt(parts[1], 10);

    if (isNaN(anio) || !meses.hasOwnProperty(mesNombre)) {
        return null;
    }

    const mesNumero = meses[mesNombre];
    
    // Retorna un objeto Date representando el primer día del mes/año del período.
    return new Date(Date.UTC(anio, mesNumero, 1));
}


async function cargarInformes() {
    limpiarMainContent();
    mostrarSpinner();

    let residentes = [], pagosGC_obj = [], egresos = [], config = {};

    try {
        const [residentesData, pagosData, egresosData, configData] = await Promise.all([
            obtenerResidentes(),
            obtenerPagosGC(),
            obtenerEgresos(),
            obtenerConfiguracion()
        ]);
        residentes = residentesData || [];
        egresos = egresosData || [];
        config = configData || {};
        
        const ENCABEZADOS_PAGOS = [
            /*A*/ 'ID_Pago',                     /*B*/ 'Nombre_Residente',         /*C*/ 'N_Parcela',
            /*D*/ 'Valor_Gasto_Comun',           /*E*/ 'Periodo',                  /*F*/ 'Fecha_Vencimiento',
            /*G*/ 'Monto_Pagado',                /*H*/ 'Saldo_Pendiente_o_a_favor', /*I*/ 'Interes',
            /*J*/ 'TIMC',                        /*K*/ 'Multa_1/4',                /*L*/ 'Meses_Inpagos',
            /*M*/ 'Deuda_Total',                 /*N*/ 'Fecha_Pago',               /*O*/ 'Metodo_Pago',
            /*P*/ 'Estado',                      /*Q*/ 'ID_Comprobante_Drive',     /*R*/ 'Abono_Convenio',
            /*S*/ 'Comprobante_Enviado',         /*T*/ 'Placeholder_T',            /*U*/ 'Placeholder_U',
            /*V*/ 'Saldo_Favor_Usado'
        ];
        pagosGC_obj = (pagosData || []).map(fila => {
            let obj = {};
            ENCABEZADOS_PAGOS.forEach((encabezado, i) => {
                if (fila[i] !== undefined) {
                    obj[encabezado] = fila[i];
                }
            });
            return obj;
        });

    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
        return;
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <style>
            #filtros-informe { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 2rem; display: none; flex-wrap: wrap; gap: 20px; align-items: flex-end; }
            #areaInforme .widget { margin-top: 1rem; }
            #chart-container { max-width: 600px; max-height: 400px; margin: 20px auto; }
        </style>
        <h2>Informes Contables y de Gestión</h2>
        <div class="widget">
            <h4 style="margin-top:0;">Seleccione un Informe</h4>
            <div style="display:flex; gap:16px; flex-wrap:wrap; margin-bottom:16px;">
                <button class="btn" data-informe="morosidad">Informe de Morosidad</button>
                <button class="btn" data-informe="estado_parcela">Estado de Parcela</button>
                <button class="btn" data-informe="historial_pagos">Historial de Pagos</button>
                <button class="btn" data-informe="gastos_categoria">Gastos por Categoría</button>
                <button class="btn" data-informe="estado_resultados">Estado de Resultados</button>
            </div>
        </div>
        
        <div id="filtros-informe" class="widget">
                <div id="filtro-fechas" style="display:none;">
                    <label><b>Fecha Inicio</b></label>
                    <input type="date" id="fechaInicio">
                </div>
                <div id="filtro-fechas2" style="display:none;">
                    <label><b>Fecha Fin</b></label>
                    <input type="date" id="fechaFin">
                </div>
                <div id="filtro-parcela" style="display:none;">
                    <label><b>N° Parcela</b></label>
                    <input list="lista-parcelas" id="inputParcela" placeholder="Seleccione o escriba...">
                    <datalist id="lista-parcelas">
                        ${residentes.map(r => r[3]).filter((v, i, a) => a.indexOf(v) === i && v).sort((a,b) => a-b).map(p => `<option value="${p}"></option>`).join('')}
                    </datalist>
                </div>
                <button class="btn" id="btnGenerarInforme" style="display:none;">Generar Informe</button>
        </div>

        <div id="areaInforme">
            <div class="widget" style="text-align:center; padding: 40px; color: #6c757d;">
                <p>Seleccione un tipo de informe para comenzar.</p>
            </div>
        </div>
    `;

    let currentReport = '';
    const btnGenerar = document.getElementById('btnGenerarInforme');
    const filtrosContainer = document.getElementById('filtros-informe');
    const areaInforme = document.getElementById('areaInforme');

    document.querySelectorAll('[data-informe]').forEach(btn => {
        btn.onclick = () => {
            currentReport = btn.dataset.informe;
            configurarFiltros(currentReport);
            areaInforme.innerHTML = `<div class="widget" style="text-align:center; padding: 40px; color: #6c757d;"><p>Configure los filtros y presione "Generar Informe".</p></div>`;
        };
    });

    btnGenerar.onclick = () => {
        mostrarSpinner();
        setTimeout(() => {
            try {
                switch(currentReport) {
                    case 'morosidad': generarInformeMorosidad(); break;
                    case 'estado_parcela': generarInformeEstadoParcela(); break;
                    case 'historial_pagos': generarInformeHistorialPagos(); break;
                    case 'gastos_categoria': generarInformeGastosCategoria(); break;
                    case 'estado_resultados': generarInformeEstadoResultados(); break;
                }
            } catch(e) {
                mostrarMensaje("Error generando el informe: " + e.message, 'error');
                console.error(e);
            } finally {
                ocultarSpinner();
            }
        }, 50);
    };
    
    function configurarFiltros(informe) {
        const filtroFechas = document.getElementById('filtro-fechas');
        const filtroFechas2 = document.getElementById('filtro-fechas2');
        const filtroParcela = document.getElementById('filtro-parcela');
        
        filtroFechas.style.display = 'none';
        filtroFechas2.style.display = 'none';
        filtroParcela.style.display = 'none';
        filtrosContainer.style.display = 'flex';
        btnGenerar.style.display = 'block';

        switch(informe) {
            case 'morosidad':
            case 'gastos_categoria':
            case 'estado_resultados':
                filtroFechas.style.display = 'block';
                filtroFechas2.style.display = 'block';
                break;
            case 'estado_parcela':
                filtroFechas.style.display = 'block';
                filtroFechas2.style.display = 'block';
                filtroParcela.style.display = 'block';
                break;
            case 'historial_pagos':
                filtroFechas.style.display = 'block';
                filtroFechas2.style.display = 'block';
                filtroParcela.style.display = 'block';
                break;
            default:
                filtrosContainer.style.display = 'none';
                btnGenerar.style.display = 'none';
        }
    }
    
    function getFiltros() {
        return {
            fechaInicio: document.getElementById('fechaInicio').value,
            fechaFin: document.getElementById('fechaFin').value,
            parcela: document.getElementById('inputParcela').value
        };
    }

    function generarInformeMorosidad() {
        const filtros = getFiltros();
        let pagosMorosos = pagosGC_obj.filter(p => p.Estado === 'Moroso' && parseFloat(p.Deuda_Total || 0) > 0);

        if (filtros.fechaInicio) {
            const fechaInicioDate = parseSheetDate(filtros.fechaInicio);
            pagosMorosos = pagosMorosos.filter(p => {
                const fechaVencimientoDate = parseSheetDate(p.Fecha_Vencimiento);
                return fechaVencimientoDate && fechaVencimientoDate >= fechaInicioDate;
            });
        }
        if (filtros.fechaFin) {
            const fechaFinDate = parseSheetDate(filtros.fechaFin);
            pagosMorosos = pagosMorosos.filter(p => {
                const fechaVencimientoDate = parseSheetDate(p.Fecha_Vencimiento);
                return fechaVencimientoDate && fechaVencimientoDate <= fechaFinDate;
            });
        }
        
        const deudaPorParcela = pagosMorosos.reduce((acc, p) => {
            const parcela = p.N_Parcela;
            if (!acc[parcela]) {
                const residente = residentes.find(r => r[3] === parcela);
                acc[parcela] = {
                    nombre: residente ? residente[1] : 'N/A',
                    email: residente ? residente[5] : 'N/A',
                    deuda: 0,
                    periodos: []
                };
            }
            acc[parcela].deuda += parseFloat(p.Deuda_Total || 0);
            acc[parcela].periodos.push(p.Periodo);
            return acc;
        }, {});

        const morososArray = Object.entries(deudaPorParcela).map(([parcela, data]) => ({ parcela, ...data }));
        const deudaTotalGeneral = morososArray.reduce((sum, item) => sum + item.deuda, 0);

        let html = `
            <div class="widget">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Informe de Morosidad</h3>
                    <button class="btn secondary" id="btnExportar">Exportar Excel</button>
                </div>
                <p>Mostrando ${morososArray.length} parcelas con deuda en el período seleccionado.</p>
                <div class="table-container">
                    <table class="table">
                        <thead><tr><th>Parcela</th><th>Residente</th><th>Email</th><th>Períodos Adeudados</th><th>Deuda Total</th></tr></thead>
                        <tbody>
                            ${morososArray.map(m => `
                                <tr>
                                    <td>${m.parcela}</td>
                                    <td>${m.nombre}</td>
                                    <td>${m.email}</td>
                                    <td>${m.periodos.join(', ')}</td>
                                    <td style="color:red; font-weight:bold;">$${m.deuda.toLocaleString('es-CL')}</td>
                                </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;">No hay morosos en el período seleccionado.</td></tr>`
                            }
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="4" style="text-align:right; font-weight:bold;">Deuda Total General:</td>
                                <td style="font-weight:bold; font-size:1.2em;">$${deudaTotalGeneral.toLocaleString('es-CL')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>`;
        areaInforme.innerHTML = html;
        
        document.getElementById('btnExportar').onclick = () => {
            const dataToExport = [["Parcela", "Residente", "Email", "Deuda Total", "Periodos Adeudados"],
                ...morososArray.map(m => [m.parcela, m.nombre, m.email, m.deuda, m.periodos.join(', ')])];
            const ws = XLSX.utils.aoa_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Morosidad");
            XLSX.writeFile(wb, "Informe_Morosidad.xlsx");
        };
    }

  // js/informes.js

function generarInformeEstadoParcela() {
    const filtros = getFiltros();
    if (!filtros.parcela) {
        areaInforme.innerHTML = `<div class="widget"><p style="color:red;">Por favor, seleccione un número de parcela para generar este informe.</p></div>`;
        return;
    }
    
    const residenteInfo = residentes.find(r => r[3] === filtros.parcela);
    const todosLosMovimientos = pagosGC_obj.filter(p => p.N_Parcela === filtros.parcela);

    let movimientosAVisualizar = [...todosLosMovimientos];
    const fechaInicioDate = filtros.fechaInicio ? parseSheetDate(filtros.fechaInicio) : null;
    const fechaFinDate = filtros.fechaFin ? parseSheetDate(filtros.fechaFin) : null;

    if (fechaInicioDate || fechaFinDate) {
        movimientosAVisualizar = movimientosAVisualizar.filter(p => {
            const periodoDate = parsePeriodo(p.Periodo);
            if (!periodoDate) return false; 
            const afterStartDate = !fechaInicioDate || periodoDate >= fechaInicioDate;
            const beforeEndDate = !fechaFinDate || periodoDate <= fechaFinDate;
            return afterStartDate && beforeEndDate;
        });
    }

    const deudaDelPeriodo = movimientosAVisualizar.reduce((total, mov) => {
        const cargos = parseFloat(mov.Valor_Gasto_Comun || 0) + parseFloat(mov.Interes || 0) + parseFloat(mov['Multa_1/4'] || 0);
        const pagos = parseFloat(mov.Monto_Pagado || 0) + parseFloat(mov.Abono_Convenio || 0) + parseFloat(mov.Saldo_Favor_Usado || 0);
        return total + cargos - pagos;
    }, 0);

    const deudaTotalGC = deudaDelPeriodo;
    const deudaTotalConvenio = parseFloat(residenteInfo ? residenteInfo[12] || 0 : 0);
    const saldoAFavor = parseFloat(residenteInfo ? residenteInfo[13] || 0 : 0);
    
    const {
        totalInteres,
        totalMulta,
        totalPagadoGC,
        totalSaldo,
        totalUsoSaldoFavor,
        totalAbonoConvenio,
        totalDeudaPendiente
    } = movimientosAVisualizar.reduce((acc, m) => {
        acc.totalInteres += parseFloat(m.Interes || 0);
        acc.totalMulta += parseFloat(m['Multa_1/4'] || 0);
        acc.totalPagadoGC += parseFloat(m.Monto_Pagado || 0);
        acc.totalSaldo += parseFloat(m['Saldo_Pendiente_o_a_favor'] || 0);
        acc.totalUsoSaldoFavor += parseFloat(m.Saldo_Favor_Usado || 0); 
        acc.totalAbonoConvenio += parseFloat(m.Abono_Convenio || 0);
        acc.totalDeudaPendiente += parseFloat(m.Deuda_Total || 0);
        return acc;
    }, {
        totalInteres: 0, totalMulta: 0, totalPagadoGC: 0, totalSaldo: 0,
        totalUsoSaldoFavor: 0, totalAbonoConvenio: 0, totalDeudaPendiente: 0
    });

    let html = `
        <div class="widget">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h3>Estado de Cuenta - Parcela ${filtros.parcela}</h3>
                <div>
                    <button class="btn secondary" id="btnExportar">Exportar Excel</button>
                    <button class="btn" id="btnEnviarCorreo" style="background-color: #28a745; border-color: #28a745;">✉️ Enviar por Correo</button>
                </div>
            </div>
            
            <h4>Información del Residente</h4>
            <p><b>Nombre:</b> ${residenteInfo ? residenteInfo[1] : 'N/A'}<br>
                <b>Email:</b> ${residenteInfo ? residenteInfo[5] : 'N/A'}</p>

            <h4>Resumen de Saldos del Período</h4>
            <div style="display:flex; gap: 20px; margin-bottom: 20px; flex-wrap:wrap;">
                <div style="padding:10px; border-radius:5px; background-color:#fff0f1;"><b>Cargos G.C. del Período:</b> <span style="color:red; font-weight:bold;">$${deudaTotalGC.toLocaleString('es-CL')}</span></div>
                <div style="padding:10px; border-radius:5px; background-color:#fff8e1;"><b>Deuda Convenio Total:</b> <span style="color:#f57f17; font-weight:bold;">$${deudaTotalConvenio.toLocaleString('es-CL')}</span></div>
                <div style="padding:10px; border-radius:5px; background-color:#e8f5e9;"><b>Saldo a Favor Total:</b> <span style="color:#2e7d32; font-weight:bold;">$${saldoAFavor.toLocaleString('es-CL')}</span></div>
            </div>

            <h4>Movimientos en el Período Seleccionado</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Fecha Pago</th>
                            <th>Período</th>
                            <th>Interés</th>
                            <th>Multa</th>
                            <th>Monto Pagado G.C.</th>
                            <th>Meses Deuda</th>
                            <th>Deuda Pendiente</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${movimientosAVisualizar.map(m => {
                            const deuda = parseFloat(m.Deuda_Total || 0);
                            return `
                            <tr>
                                <td>${m.Fecha_Pago ? new Date(m.Fecha_Pago.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : '---'}</td>
                                <td>${m.Periodo}</td>
                                <td>$${parseFloat(m.Interes || 0).toLocaleString('es-CL')}</td>
                                <td>$${parseFloat(m['Multa_1/4'] || 0).toLocaleString('es-CL')}</td>
                                <td>$${parseFloat(m.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
                                <td style="text-align:center;">${m.Meses_Inpagos || 0}</td>
                                <td style="${deuda > 0 ? 'color:red; font-weight:bold;' : ''}">$${deuda.toLocaleString('es-CL')}</td>
                                <td>${m.Estado}</td>
                            </tr>
                        `}).join('') || `<tr><td colspan="8" style="text-align:center;">No hay cargos de gastos comunes en el período seleccionado.</td></tr>`}
                    </tbody>
                    <tfoot style="font-weight:bold;">
                        <tr style="background-color: #f8f9fa; border-top: 2px solid #dee2e6;">
                            <td style="padding: 0.75rem; text-align:right;" colspan="2">Totales del Período:</td>
                            <td style="padding: 0.75rem;">$${totalInteres.toLocaleString('es-CL')}</td>
                            <td style="padding: 0.75rem;">$${totalMulta.toLocaleString('es-CL')}</td>
                            <td style="padding: 0.75rem;">$${totalPagadoGC.toLocaleString('es-CL')}</td>
                            <td style="padding: 0.75rem;"></td>
                            <td style="padding: 0.75rem; color:red;">$${totalDeudaPendiente.toLocaleString('es-CL')}</td>
                            <td style="padding: 0.75rem;"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>`;
    areaInforme.innerHTML = html;
    
    document.getElementById('btnExportar').onclick = () => {
        const dataToExport = [
            ["Estado de Cuenta - Parcela", filtros.parcela],
            ["Nombre Residente", residenteInfo ? residenteInfo[1] : 'N/A'],
            [],
            ["Fecha Pago", "Periodo", "Interés", "Multa", "Monto Pagado G.C.", "Meses Deuda", "Deuda Pendiente", "Estado"],
            ...movimientosAVisualizar.map(m => [
                m.Fecha_Pago ? new Date(m.Fecha_Pago.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : '---',
                m.Periodo,
                parseFloat(m.Interes || 0),
                parseFloat(m['Multa_1/4'] || 0),
                parseFloat(m.Monto_Pagado || 0),
                parseInt(m.Meses_Inpagos || 0),
                parseFloat(m.Deuda_Total || 0),
                m.Estado
            ])];
        
        dataToExport.push([
            "", "Totales:", totalInteres, totalMulta, totalPagadoGC, "", totalDeudaPendiente, ""
        ]);

        const ws = XLSX.utils.aoa_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Estado Parcela ${filtros.parcela}`);
        XLSX.writeFile(wb, `Estado_Parcela_${filtros.parcela}.xlsx`);
    };

    document.getElementById('btnEnviarCorreo').onclick = async () => {
        const emailDestino = residenteInfo ? residenteInfo[5] : null;
        if (!emailDestino) {
            return mostrarMensaje("El residente no tiene un correo electrónico registrado.", "error");
        }
        
        mostrarSpinner();
        try {
            const asunto = `Estado de Cuenta - Parcela ${filtros.parcela}`;
            const datosParaCorreo = {
                nombreResidente: residenteInfo[1],
                numeroParcela: filtros.parcela,
                fechaInicio: filtros.fechaInicio,
                fechaFin: filtros.fechaFin,
                deudaGC: deudaTotalGC,
                deudaConvenio: deudaTotalConvenio,
                saldoFavor: saldoAFavor,
                movimientos: movimientosAVisualizar,
                totalInteres: totalInteres,
                totalMulta: totalMulta,
                totalPagadoGC: totalPagadoGC, 
                totalSaldo: totalSaldo,
                totalUsoSaldoFavor: totalUsoSaldoFavor,
                totalAbonoConvenio: totalAbonoConvenio,
                totalDeudaPendiente: totalDeudaPendiente,
                nombreAdmin: "Alex Thiele",
                cargoAdmin: "Administrador Condominio Los Molles"
            };
            const cuerpoHtml = crearCuerpoCorreoEstadoCuenta(datosParaCorreo);
            
            await enviarCorreo(emailDestino, asunto, cuerpoHtml);
            mostrarMensaje(`Correo enviado con éxito a ${emailDestino}`, 'success');

        } catch (err) {
            mostrarMensaje("Error al enviar el correo: " + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    };
}

    function generarInformeHistorialPagos() {
        const filtros = getFiltros();
        let pagosFiltrados = [...pagosGC_obj].filter(p => p.Fecha_Pago);

        if (filtros.parcela) {
            pagosFiltrados = pagosFiltrados.filter(p => p.N_Parcela === filtros.parcela);
        }
        if (filtros.fechaInicio) {
            const fechaInicioDate = parseSheetDate(filtros.fechaInicio);
            pagosFiltrados = pagosFiltrados.filter(p => {
                 const fechaPagoDate = parseSheetDate(p.Fecha_Pago);
                 return fechaPagoDate && fechaPagoDate >= fechaInicioDate;
            });
        }
        if (filtros.fechaFin) {
            const fechaFinDate = parseSheetDate(filtros.fechaFin);
            pagosFiltrados = pagosFiltrados.filter(p => {
                 const fechaPagoDate = parseSheetDate(p.Fecha_Pago);
                 return fechaPagoDate && fechaPagoDate <= fechaFinDate;
            });
        }
        
        pagosFiltrados.sort((a,b) => parseSheetDate(b.Fecha_Pago) - parseSheetDate(a.Fecha_Pago));

        let html = `
            <div class="widget">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Historial de Pagos</h3>
                    <button class="btn secondary" id="btnExportar">Exportar Excel</button>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead><tr><th>Fecha Pago</th><th>Parcela</th><th>Residente</th><th>Período</th><th>Monto Pagado</th><th>Estado</th></tr></thead>
                        <tbody>
                            ${pagosFiltrados.map(p => `
                                <tr>
                                    <td>${new Date(p.Fecha_Pago.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</td>
                                    <td>${p.N_Parcela}</td>
                                    <td>${p.Nombre_Residente}</td>
                                    <td>${p.Periodo}</td>
                                    <td>$${(parseFloat(p.Monto_Pagado || 0) + parseFloat(p.Abono_Convenio || 0)).toLocaleString('es-CL')}</td>
                                    <td>${p.Estado}</td>
                                </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;">No se encontraron pagos con los filtros seleccionados.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>`;
        areaInforme.innerHTML = html;
        
        document.getElementById('btnExportar').onclick = () => {
            const dataToExport = [["Fecha Pago", "Parcela", "Residente", "Periodo", "Monto Pagado", "Estado"],
                ...pagosFiltrados.map(p => [
                    new Date(p.Fecha_Pago.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' }),
                    p.N_Parcela,
                    p.Nombre_Residente,
                    p.Periodo,
                    (parseFloat(p.Monto_Pagado || 0) + parseFloat(p.Abono_Convenio || 0)),
                    p.Estado
                ])];
            const ws = XLSX.utils.aoa_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Historial Pagos");
            XLSX.writeFile(wb, "Historial_Pagos.xlsx");
        };
    }

    function generarInformeGastosCategoria() {
        const filtros = getFiltros();
        let egresosFiltrados = [...egresos];
        
        if (filtros.fechaInicio) {
            const fechaInicioDate = parseSheetDate(filtros.fechaInicio);
            egresosFiltrados = egresosFiltrados.filter(e => {
                const fechaEgresoDate = parseSheetDate(e[1]); // Columna B es Fecha
                return fechaEgresoDate && fechaEgresoDate >= fechaInicioDate;
            });
        }
        if (filtros.fechaFin) {
            const fechaFinDate = parseSheetDate(filtros.fechaFin);
            egresosFiltrados = egresosFiltrados.filter(e => {
                const fechaEgresoDate = parseSheetDate(e[1]);
                return fechaEgresoDate && fechaEgresoDate <= fechaFinDate;
            });
        }
        
        const categorias = egresosFiltrados.reduce((acc, e) => {
            const categoria = e[2] || 'Sin Categoría';
            const monto = parseFloat(e[6] || 0);
            acc[categoria] = (acc[categoria] || 0) + monto;
            return acc;
        }, {});
        
        const totalEgresos = Object.values(categorias).reduce((sum, val) => sum + val, 0);

        let html = `
            <div class="widget">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Gastos por Categoría</h3>
                    <button class="btn secondary" id="btnExportar">Exportar Excel</button>
                </div>
                <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;">
                    <div id="chart-container">
                        <canvas id="graficoCategorias"></canvas>
                    </div>
                    <div style="flex-grow:1; min-width:300px;">
                        <h4>Detalle de Egresos</h4>
                        <div class="table-container">
                            <table class="table">
                                <thead><tr><th>Categoría</th><th>Monto</th><th>% del Total</th></tr></thead>
                                <tbody>
                                ${Object.entries(categorias).map(([cat, monto]) => `
                                    <tr>
                                        <td>${cat}</td>
                                        <td>$${monto.toLocaleString('es-CL')}</td>
                                        <td>${totalEgresos > 0 ? ((monto/totalEgresos)*100).toFixed(2) : 0}%</td>
                                    </tr>`).join('') || `<tr><td colspan="3" style="text-align:center;">No hay egresos en el período.</td></tr>`}
                                </tbody>
                                <tfoot>
                                     <tr>
                                        <td style="font-weight:bold;">Total</td>
                                        <td style="font-weight:bold;">$${totalEgresos.toLocaleString('es-CL')}</td>
                                        <td></td>
                                     </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        areaInforme.innerHTML = html;
        
        setTimeout(() => {
            const canvas = document.getElementById('graficoCategorias');
            if(canvas && Object.keys(categorias).length > 0) {
                new Chart(canvas, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(categorias),
                        datasets: [{
                            data: Object.values(categorias),
                            backgroundColor: ['#2a7ca3', '#7fd6c2', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', '#f8f9fc']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' } } }
                });
            }
        }, 100);

        document.getElementById('btnExportar').onclick = () => {
            const dataToExport = [["Categoría", "Monto"], ...Object.entries(categorias)];
            const ws = XLSX.utils.aoa_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Egresos por Categoría");
            XLSX.writeFile(wb, "EgresosPorCategoria.xlsx");
        };
    }
    
    function generarInformeEstadoResultados() {
        const filtros = getFiltros();
        let pagosFiltrados = [...pagosGC_obj].filter(p => p.Fecha_Pago);
        let egresosFiltrados = [...egresos].filter(e => e[1]);
        
        if (filtros.fechaInicio) {
            const fechaInicioDate = parseSheetDate(filtros.fechaInicio);
            pagosFiltrados = pagosFiltrados.filter(p => {
                const fechaPagoDate = parseSheetDate(p.Fecha_Pago);
                return fechaPagoDate && fechaPagoDate >= fechaInicioDate;
            });
            egresosFiltrados = egresosFiltrados.filter(e => {
                const fechaEgresoDate = parseSheetDate(e[1]);
                return fechaEgresoDate && fechaEgresoDate >= fechaInicioDate;
            });
        }
        if (filtros.fechaFin) {
            const fechaFinDate = parseSheetDate(filtros.fechaFin);
            pagosFiltrados = pagosFiltrados.filter(p => {
                const fechaPagoDate = parseSheetDate(p.Fecha_Pago);
                return fechaPagoDate && fechaPagoDate <= fechaFinDate;
            });
            egresosFiltrados = egresosFiltrados.filter(e => {
                const fechaEgresoDate = parseSheetDate(e[1]);
                return fechaEgresoDate && fechaEgresoDate <= fechaFinDate;
            });
        }

        const ingresosGC = pagosFiltrados.reduce((sum, p) => sum + parseFloat(p.Monto_Pagado || 0), 0);
        const ingresosConvenio = pagosFiltrados.reduce((sum, p) => sum + parseFloat(p.Abono_Convenio || 0), 0);
        const totalIngresos = ingresosGC + ingresosConvenio;
        const totalEgresos = egresosFiltrados.reduce((sum, e) => sum + parseFloat(e[6] || 0), 0);
        const saldoFinal = totalIngresos - totalEgresos;

        let html = `
            <div class="widget">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3>Estado de Resultados</h3>
                    <button class="btn secondary" id="btnExportar">Exportar Excel</button>
                </div>
                <p>Mostrando resultados para el período seleccionado.</p>
                <div class="table-container">
                    <table class="table">
                        <tbody>
                            <tr><th colspan="2" style="background-color:#e9f1fb;">INGRESOS</th></tr>
                            <tr><td>Ingresos por Gastos Comunes</td><td style="text-align:right;">$${ingresosGC.toLocaleString('es-CL')}</td></tr>
                            <tr><td>Ingresos por Abonos a Convenio</td><td style="text-align:right;">$${ingresosConvenio.toLocaleString('es-CL')}</td></tr>
                            <tr style="font-weight:bold;"><td style="color:green;">Total Ingresos</td><td style="text-align:right; color:green;">$${totalIngresos.toLocaleString('es-CL')}</td></tr>
                            
                            <tr><th colspan="2" style="background-color:#e9f1fb; padding-top:20px;">EGRESOS</th></tr>
                            <tr><td>Total Egresos</td><td style="text-align:right;">$${totalEgresos.toLocaleString('es-CL')}</td></tr>
                            <tr style="font-weight:bold;"><td style="color:red;">Total Egresos</td><td style="text-align:right; color:red;">$${totalEgresos.toLocaleString('es-CL')}</td></tr>

                            <tr><th colspan="2" style="background-color:#e9f1fb; padding-top:20px;">RESULTADO</th></tr>
                            <tr style="font-weight:bold; font-size:1.2em;"><td>Saldo Final del Período</td><td style="text-align:right;">$${saldoFinal.toLocaleString('es-CL')}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>`;
        areaInforme.innerHTML = html;

        document.getElementById('btnExportar').onclick = () => {
            const dataToExport = [
                ["Concepto", "Monto"],
                ["Ingresos por Gastos Comunes", ingresosGC],
                ["Ingresos por Abonos a Convenio", ingresosConvenio],
                ["Total Ingresos", totalIngresos],
                ["Total Egresos", -totalEgresos],
                ["Saldo Final", saldoFinal]
            ];
            const ws = XLSX.utils.aoa_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Estado de Resultados");
            XLSX.writeFile(wb, "Estado_de_Resultados.xlsx");
        };
    }

// ▼ MODIFICADO: Esta función ahora genera una tabla de correo mucho más detallada.
function crearCuerpoCorreoEstadoCuenta(datos) {
    const { 
        nombreResidente, numeroParcela, fechaInicio, fechaFin, 
        deudaGC, deudaConvenio, saldoFavor, movimientos, 
        totalInteres, totalMulta, totalPagadoGC, totalSaldo, totalUsoSaldoFavor, totalAbonoConvenio, totalDeudaPendiente,
        nombreAdmin, cargoAdmin
    } = datos;

    const periodoStr = (fechaInicio && fechaFin) 
        ? `para el período del <b>${new Date(fechaInicio.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</b> al <b>${new Date(fechaFin.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' })}</b>`
        : 'a la fecha';

    const movimientosHtml = movimientos.length > 0 
        ? movimientos.map(m => {
            const deuda = parseFloat(m.Deuda_Total || 0);
            const saldo = parseFloat(m['Saldo_Pendiente_o_a_favor'] || 0);
            const saldoColor = saldo > 0 ? '#2e7d32' : (saldo < 0 ? '#d32f2f' : '#333333');

            return `
            <tr style="border-bottom: 1px solid #dddddd;">
                <td style="padding: 10px; font-size: 14px; text-align: left;">${m.Fecha_Pago ? new Date(m.Fecha_Pago.replace(/-/g,'/')).toLocaleDateString('es-CL', { timeZone: 'UTC' }) : '---'}</td>
                <td style="padding: 10px; font-size: 14px; text-align: left;">${m.Periodo}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right;">$${parseFloat(m.Interes || 0).toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right;">$${parseFloat(m['Multa_1/4'] || 0).toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right;">$${parseFloat(m.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right; color: ${saldoColor};">$${saldo.toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right; color: #2e7d32;">$${parseFloat(m.Saldo_Favor_Usado || 0).toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right;">$${parseFloat(m.Abono_Convenio || 0).toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: right; font-weight: ${deuda > 0 ? 'bold' : 'normal'}; color: ${deuda > 0 ? '#d32f2f' : '#333333'};">$${deuda.toLocaleString('es-CL')}</td>
                <td style="padding: 10px; font-size: 14px; text-align: left;">${m.Estado}</td>
            </tr>
        `}).join('')
        : '<tr><td colspan="10" style="padding: 20px; text-align: center; color: #777777;">No se registraron movimientos en el período seleccionado.</td></tr>';

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Estado de Cuenta</title>
        <style>
            body, table, td, p, h1, h3 { font-family: Arial, sans-serif; color: #333333; }
            .container { width: 100%; max-width: 800px; margin: 0 auto; } /* Ancho aumentado para la tabla detallada */
            .summary-table { border-spacing: 10px; margin: 15px -5px; }
            .summary-box { padding: 15px; border-radius: 8px; text-align: center; width: 33.3%; }
            @media screen and (max-width: 600px) {
                .container { width: 100% !important; }
                .summary-box { display: block !important; width: 100% !important; box-sizing: border-box; margin-bottom: 10px; }
                .details-table th, .details-table td { font-size: 11px !important; padding: 6px !important; }
            }
        </style>
    </head>
    <body style="margin: 0; padding: 0;">
        <table class="container" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
            <tr>
                <td style="padding: 20px 0;">
                    <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: 1px solid #eeeeee;">
                        <tr>
                            <td align="center" bgcolor="#004a7f" style="padding: 20px; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 24px;">Estado de Cuenta</h1>
                                <p style="margin: 5px 0 0;">Condominio Los Molles</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 25px 20px;">
                                <p>Estimado(a) <b>${nombreResidente}</b>,</p>
                                <p>A continuación, le presentamos su estado de cuenta para la <b>Parcela ${numeroParcela}</b>, ${periodoStr}.</p>
                                
                                <h3 style="border-bottom: 2px solid #004a7f; padding-bottom: 5px; margin-top: 30px; font-size: 18px;">Resumen de Saldos</h3>
                                <table class="summary-table" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td class="summary-box" bgcolor="#fbe9e7">
                                            <span style="font-size: 14px; color: #555555;">Deuda G. Común Total</span><br>
                                            <span style="font-size: 22px; font-weight: bold; color: #d32f2f;">$${deudaGC.toLocaleString('es-CL')}</span>
                                        </td>
                                        <td class="summary-box" bgcolor="#fff3e0">
                                            <span style="font-size: 14px; color: #555555;">Deuda Convenio</span><br>
                                            <span style="font-size: 22px; font-weight: bold; color: #f57c00;">$${deudaConvenio.toLocaleString('es-CL')}</span>
                                        </td>
                                        <td class="summary-box" bgcolor="#e8f5e9">
                                            <span style="font-size: 14px; color: #555555;">Saldo a Favor</span><br>
                                            <span style="font-size: 22px; font-weight: bold; color: #2e7d32;">$${saldoFavor.toLocaleString('es-CL')}</span>
                                        </td>
                                    </tr>
                                </table>

                                <h3 style="border-bottom: 2px solid #004a7f; padding-bottom: 5px; margin-top: 30px; font-size: 18px;">Detalle de Movimientos del Período</h3>
                                <div style="width:100%; overflow-x:auto;">
                                    <table class="details-table" width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 15px;">
                                        <thead>
                                            <tr bgcolor="#f4f4f4">
                                                <th style="padding: 10px; text-align: left; font-size:12px;">Fecha Pago</th>
                                                <th style="padding: 10px; text-align: left; font-size:12px;">Período</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Interés</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Multa</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Monto Pagado G.C.</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Saldo</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Uso Saldo Favor</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Abono Convenio</th>
                                                <th style="padding: 10px; text-align: right; font-size:12px;">Deuda Pendiente</th>
                                                <th style="padding: 10px; text-align: left; font-size:12px;">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>${movimientosHtml}</tbody>
                                        <tfoot style="font-weight: bold;">
                                            <tr style="background-color: #f4f4f4; border-top: 2px solid #cccccc;">
                                                <td colspan="2" style="padding: 12px; text-align: right; font-size: 14px;">Totales:</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px;">$${totalInteres.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px;">$${totalMulta.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px;">$${totalPagadoGC.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px; color: ${totalSaldo > 0 ? '#2e7d32' : (totalSaldo < 0 ? '#d32f2f' : '#333333')};">$${totalSaldo.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px; color: #2e7d32;">$${totalUsoSaldoFavor.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px;">$${totalAbonoConvenio.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px; text-align: right; font-size: 14px; color: #d32f2f;">$${totalDeudaPendiente.toLocaleString('es-CL')}</td>
                                                <td style="padding: 12px;"></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                                
                                <p style="margin-top: 30px; font-size: 14px; color: #555555;">Si tiene alguna consulta, no dude en contactar a la administración.</p>
                                <p style="margin-top: 20px;">Atentamente,</p>
                                <p style="font-weight: bold; margin: 0;">${nombreAdmin}</p>
                                <p style="margin: 0; color: #777777;">${cargoAdmin}</p>
                            </td>
                        </tr>
                        <tr>
                            <td bgcolor="#f4f4f4" style="text-align: center; padding: 15px; font-size: 12px; color: #777777;">
                                Este es un correo electrónico generado automáticamente.
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}
    
    ocultarSpinner();
}


