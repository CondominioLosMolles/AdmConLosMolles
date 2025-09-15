// =================================================================================
// ===== GASTOS_COMUNES.JS - CÓDIGO COMPLETO Y FINAL (CON TODAS LAS CORRECCIONES) =====
// =================================================================================

// Constantes globales para el módulo
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const ENCABEZADOS_PAGOS = [
    'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo',
    'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC',
    'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado',
    'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado', 'Descripcion_Deuda',
    'Descripcion_Pago', 'Saldo_Favor_Usado'
];

async function cargarGastosComunes() {
    limpiarMainContent();
    mostrarSpinner();

    // Variables locales que estarán disponibles para todas las funciones internas
    let residentes = [];
    let pagosGC_obj = [];
    let timcData = {};
    let pagoSeleccionadoParaEnviar = null;

    try {
        const [residentes_data, pagosGC_raw, timcs_raw] = await Promise.all([
            obtenerResidentes(),
            obtenerPagosGC(),
            obtenerTIMCs()
        ]);
        
        residentes = residentes_data || [];
        
        pagosGC_obj = (pagosGC_raw || []).map((fila, index) => {
            let obj = {};
            ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; });
            if (obj.Periodo) {
                const anioMatch = obj.Periodo.toString().match(/\d{4}/);
                obj.anio = anioMatch ? parseInt(anioMatch[0]) : null;
            }
            obj.rowNum = index + 2;
            return obj;
        }).filter(p => p.N_Parcela);

        (timcs_raw || []).forEach(fila => {
            const [anio, mes, valor] = fila;
            if (!timcData[anio]) timcData[anio] = {};
            timcData[anio][mes] = parseFloat(valor);
        });

    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error');
        return;
    }

    // =======================================================
    // FUNCIONES DE AYUDA (DEFINIDAS DENTRO PARA TENER ACCESO A LAS VARIABLES)
    // =======================================================

    function formatearPeriodo(periodo) {
        if (!periodo) return 'N/A';
        const matchAnio = periodo.toString().match(/\d{4}/);
        const anio = matchAnio ? parseInt(matchAnio[0]) : null;
        const matchMes = MESES.findIndex(m => periodo.toLowerCase().includes(m.toLowerCase()));

        if (anio && matchMes !== -1) {
            return `${MESES[matchMes]} ${anio}`;
        }
        
        const match = periodo.toString().match(/^(\d{4})-(\d{1,2})$/);
        if (match) {
            const anio = parseInt(match[1]);
            const mesIndex = parseInt(match[2]) - 1;
            if (mesIndex >= 0 && mesIndex < 12) {
                return `${MESES[mesIndex]} ${anio}`;
            }
        }
        return periodo;
    }

    function actualizarVistaPreviaComprobante(pago) {
        pagoSeleccionadoParaEnviar = pago;
        
        const parcela = document.getElementById('inputNParcelaComprobante').value;
        const asuntoInput = document.getElementById('inputAsuntoComprobante');
        const cuerpoDiv = document.getElementById('divCuerpoComprobante');

        const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela));
        const residentNames = allResidentsForParcela.map(r => r[1]).join(' y ');
        const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0];
        
        if (!representativeResident) {
             cuerpoDiv.innerHTML = `<span style="color: #dc3545;">Error: No se pudo encontrar un residente representativo.</span>`;
             return;
        }

        const aEnviar = {...representativeResident};
        aEnviar[1] = residentNames;

        const periodoFormateado = formatearPeriodo(pago.Periodo);
        asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`;
        cuerpoDiv.innerHTML = crearCuerpoCorreo(pago, aEnviar);
    }
    
    function crearCuerpoCorreo(pago, residente) {
    const nombreResidente = residente[1];
    const periodoFormateado = formatearPeriodo(pago.Periodo);
    const montoPagado = parseFloat(pago.Monto_Pagado || 0);
    const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0);
    const abonoConvenio = parseFloat(pago.Abono_Convenio || 0);
    const montoTotalAbonadoGC = montoPagado + saldoFavorUsado;
    const valorGC = parseFloat(pago.Valor_Gasto_Comun || 0);
    const interes = parseFloat(pago.Interes || 0);
    const multa = parseFloat(pago['Multa_1/4'] || 0);
    const deudaDelPeriodo = valorGC + interes + multa;
    const saldoTransaccion = montoTotalAbonadoGC - deudaDelPeriodo;

    // ▼ INICIO: CÓDIGO MODIFICADO ▼
    // Se crea una variable para el resultado final, que será más clara.
    let resultadoHtml;

    if (saldoTransaccion >= 0) {
        // El período está pagado.
        resultadoHtml = `
            <tr style="font-weight:bold; border-top:2px solid #2e7d32;">
                <td style="padding:10px 0; color:#2e7d32; font-size:1.1em;">Estado del Período:</td>
                <td style="padding:10px 0; text-align:right; color:#2e7d32; font-size:1.1em;">PAGADO</td>
            </tr>
        `;
        // Solo se muestra el saldo a favor si es mayor que cero.
        if (saldoTransaccion > 0) {
            resultadoHtml += `
                <tr>
                    <td style="padding:5px 0;">Saldo a favor generado en esta transacción:</td>
                    <td style="padding:5px 0; text-align:right; font-weight:bold;">$${saldoTransaccion.toLocaleString('es-CL')}</td>
                </tr>
            `;
        }
    } else {
        // El período queda con deuda.
        resultadoHtml = `
            <tr style="font-weight:bold; border-top:2px solid #cccccc;">
                <td style="padding:10px 0; color:#d32f2f;">Saldo pendiente del Período:</td>
                <td style="padding:10px 0; text-align:right; color:#d32f2f;">$${Math.abs(saldoTransaccion).toLocaleString('es-CL')}</td>
            </tr>
        `;
    }
    // ▲ FIN: CÓDIGO MODIFICADO ▲

    return `
    <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante de Pago</title></head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;margin:20px auto;border:1px solid #dddddd;">
            <tr><td align="center" bgcolor="#2a7ca3" style="padding:20px;color:#ffffff;"><h2 style="margin:0;">Comprobante de Pago</h2><p style="margin:5px 0 0;">Condominio Los Molles</p></td></tr>
            <tr><td style="padding:25px 20px;">
                <p>Estimado(a) <strong>${nombreResidente}</strong>,</p>
                <p>Confirmamos la recepción de su pago para el período <strong>${periodoFormateado}</strong>. A continuación el detalle:</p>
                <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle Deuda del Período</h4>
                <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:5px 0;">Gasto Común Ordinario:</td><td style="padding:5px 0;text-align:right;">$${valorGC.toLocaleString('es-CL')}</td></tr>
                    <tr><td style="padding:5px 0;">Intereses por mora:</td><td style="padding:5px 0;text-align:right;">$${interes.toLocaleString('es-CL')}</td></tr>
                    <tr><td style="padding:5px 0;">Multas del período:</td><td style="padding:5px 0;text-align:right;">$${multa.toLocaleString('es-CL')}</td></tr>
                    <tr style="font-weight:bold;border-top:1px solid #dddddd;"><td style="padding:8px 0;">Deuda Total del Período:</td><td style="padding:8px 0;text-align:right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr>
                </table>
                <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle de su Pago</h4>
                <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:8px 0;">Monto Pagado (transferencia/efectivo):</td><td style="padding:8px 0;text-align:right;">$${montoPagado.toLocaleString('es-CL')}</td></tr>
                    ${abonoConvenio > 0 ? `<tr><td style="padding:8px 0;">Abono a Convenio de Deuda:</td><td style="padding:8px 0;text-align:right;">$${abonoConvenio.toLocaleString('es-CL')}</td></tr>` : ''}
                    <tr><td style="padding:8px 0;">Saldo a Favor Utilizado:</td><td style="padding:8px 0;text-align:right;">$${saldoFavorUsado.toLocaleString('es-CL')}</td></tr>
                    <tr style="font-weight:bold;"><td style="padding:8px 0;border-top:1px solid #eeeeee;">Total Abonado al Período (G.C.):</td><td style="padding:8px 0;text-align:right;border-top:1px solid #eeeeee;">$${montoTotalAbonadoGC.toLocaleString('es-CL')}</td></tr>
                    ${resultadoHtml}
                    </table>
                <hr style="border:0;border-top:1px solid #eeeeee;margin-top:20px;">
                <p>Gracias por su compromiso.</p><p style="margin-top:20px;">Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p>
            </td></tr>
            <tr><td bgcolor="#f4f4f4" style="text-align:center;padding:15px;font-size:12px;color:#777777;">Este es un correo electrónico generado automáticamente.</td></tr>
        </table>
    </body></html>`;
}

    async function guardarConvenio(nParcela, datosConvenio) {
      mostrarSpinner();
      try {
        await gapi.client.request({
          'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
          'method': 'POST',
          'body': {
            'function': 'guardarConvenio_GS',
            'parameters': [nParcela, datosConvenio]
          }
        });
        // Recargar los datos para reflejar los cambios
        await cargarGastosComunes();
        // Forzar el filtro para ver la parcela actualizada
        document.getElementById('filtroParcela').value = nParcela;
        filtrarYRenderizar();
        mostrarMensaje('Convenio guardado y deudas anteriores congeladas con éxito.', 'success');
      } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        mostrarMensaje(`Error al guardar el convenio: ${errorMessage}`, 'error');
      } finally {
        ocultarSpinner();
      }
    }

    async function enviarAcuerdoConvenio(residente, datosConvenio) {
        const emailResidente = residente[5];
        if (!emailResidente || !emailResidente.includes('@')) {
            mostrarMensaje('El residente no tiene un correo electrónico válido registrado.', 'error');
            return;
        }
        const confirmacion = confirm(`¿Está seguro que desea enviar el correo de acuerdo de convenio de pago a ${residente[1]} (${emailResidente})?`);
        if (!confirmacion) return;
        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'enviarCorreoConvenio_GS',
                    'parameters': [residente, datosConvenio]
                }
            });
            mostrarMensaje('Correo de acuerdo de convenio enviado exitosamente.', 'success');
        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al enviar el correo de convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }

    async function formalizarConvenio(nParcela, nombreResidente) {
        const instruccion = `Para formalizar el convenio de la parcela ${nParcela} (${nombreResidente}), por favor, pegue aquí el enlace permanente del correo de aceptación del residente.\n\nPara obtener el enlace en Gmail:\n1. Abra el correo de aceptación.\n2. Haga clic en los tres puntos (Más opciones).\n3. Seleccione "Imprimir".\n4. En la ventana de impresión, copie la URL de la barra de direcciones del navegador.`;
        const urlConvenio = prompt(instruccion, "");

        if (urlConvenio === null) return; // El usuario canceló
        if (urlConvenio.trim() === "" || !urlConvenio.startsWith("http")) {
            alert("El enlace proporcionado no es válido. Por favor, inténtelo de nuevo.");
            return;
        }

        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'formalizarConvenio_GS',
                    'parameters': [nParcela, urlConvenio]
                }
            });
            
            pagosGC_obj.forEach(pago => {
                if (String(pago.N_Parcela) === String(nParcela) && pago.Estado === 'Moroso') {
                    pago.Estado = 'En Convenio';
                }
            });

            filtrarYRenderizar();
            mostrarMensaje(`Convenio formalizado para la parcela ${nParcela}. Las deudas anteriores han sido marcadas como "En Convenio".`, 'success');

        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al formalizar el convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }
    
    // =======================================================
    // RENDERIZADO DEL HTML PRINCIPAL
    // =======================================================

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <style>
            .estado-pagado { background-color: #198754; color: white; } 
            .estado-moroso { background-color: #dc3545; color: white; } 
            .estado-abono { background-color: #ffc107; color: #333; } 
            .estado-en-convenio { background-color: #0dcaf0; color: #000; }
            .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; } 
            #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;} 
            #detalle-pago-grid b { grid-column: 1; text-align: right; } 
            #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; } 
            .suggestion-item { padding: 8px 12px; cursor: pointer; } 
            .suggestion-item:hover { background-color: #e9f1fb; } 
            #table-pagos { table-layout: fixed; width: 100%; border-collapse: collapse; } 
            #table-pagos th { position: relative; } 
            .resizer { position: absolute; top: 0; right: -2px; width: 5px; cursor: col-resize; user-select: none; height: 100%; z-index: 1;} 
            .resizer:hover { border-right: 2px solid #007bff; } 
            .comprobante-enviado { color: green; font-size: 1.2rem; font-weight: bold; text-align: center; } 
            #convenio-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; } 
            #convenio-summary-grid > div { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; } 
            #convenio-summary-grid > div > span { display: block; font-size: 1.4em; font-weight: bold; } 
            .saldo-info { padding: 10px; border-radius: 5px; margin-top: 5px; font-weight: bold; text-align: center; } 
            .saldo-convenio { background-color: #fff8e1; color: #f57f17; } 
            .saldo-favor { background-color: #e8f5e9; color: #2e7d32; }
        </style>
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
            <section class="widget" style="flex: 1; min-width: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroParcela"><b>N° Parcela:</b></label>
                            <input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;">
                            <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroAnio"><b>Año:</b></label>
                            <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
                        </div>
                    </div>
                </div>
                <div style="margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                    <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
                    <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
                </div>
            </section>
            <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
        </div>
        <section id="widget-convenio" class="widget" style="display:none; margin-top: 2rem;">
            <h3 style="margin-top:0;">Estado de Convenio de Pago</h3>
            <div id="convenio-summary-grid"></div>
            <h4 style="margin-top: 1.5rem;">Historial de Abonos (Año Seleccionado)</h4>
            <div class="table-container"><table class="table"><thead id="thead-abonos"></thead><tbody id="tbody-abonos"></tbody></table></div>
        </section>
        <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Pagos Registrados</h3><div class="table-container"><table id="table-pagos" class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
        
        <div id="modalGC" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Agregar Gasto Común</h3>
                <form id="formGastoComun">
                    <div class="row">
                        <div class="col-md-6">
                            <label>Fecha de Emisión</label>
                            <input type="date" name="Fecha_Vencimiento" required>
                        </div>
                        <div class="col-md-6">
                            <label>Período del Gasto Común</label>
                            <input type="month" name="Periodo" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>N° Parcela</label>
                            <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
                        </div>
                        <div class="col-md-6">
                            <label>Valor Gasto Común</label>
                            <input type="number" name="Valor_Gasto_Comun" min="0" step="1" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>Monto Pagado</label>
                            <input type="number" name="Monto_Pagado" min="0" step="1" required>
                        </div>
                        <div class="col-md-6">
                            <label>Multa</label>
                            <input type="number" name="Multa_1/4" min="0" step="1" value="0">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>Interes</label>
                            <input type="number" name="Interes" min="0" step="1" value="0">
                        </div>
                    </div>
                    <div style="width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <label>Descripción / Nota del Pago (Opcional)</label>
                        <textarea name="Descripcion_Pago" rows="2" placeholder="Ej: Pago parcial, solicitud de uso de saldo a favor, etc."></textarea>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
                        <button class="btn" type="submit">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="modalComprobante" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Enviar Comprobante por Correo</h3>
                <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente(s)</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div id="periodo-selector-container" style="display: none;"><label><b>Seleccione el Comprobante</b></label><select id="selectPeriodoComprobante" style="width:100%; padding: 11px 10px;"></select></div><div><label><b>Email(s) Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
            </div>
        </div>
        <div id="modalDetallePago" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin-top:0;">Detalle Completo del Registro</h3>
                <div id="contenidoDetallePago" style="margin-bottom: 20px;"></div>
                <div style="text-align: right;"><button id="btnCerrarModalDetalle" class="btn secondary">Cerrar</button></div>
            </div>
        </div>
        
        <div id="modalConvenio" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin...

selectedRelevantSnippets:
snippet_1: // ================================================================================= // ===== GASTOS_COMUNES.JS - CÓDIGO COMPLETO Y FINAL (CON TODAS LAS CORRECCIONES) ===== // ================================================================================= // Constantes globales para el módulo const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; const ENCABEZADOS_PAGOS = [ 'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo', 'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC', 'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado', 'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado', 'Descripcion_Deuda', 'Descripcion_Pago', 'Saldo_Favor_Usado' ]; async function cargarGastosComunes() { limpiarMainContent(); mostrarSpinner(); // Variables locales que estarán disponibles para todas las funciones internas let residentes = []; let pagosGC_obj = []; let timcData = {}; let pagoSeleccionadoParaEnviar = null; try { const [residentes_data, pagosGC_raw, timcs_raw] = await Promise.all([ obtenerResidentes(), obtenerPagosGC(), obtenerTIMCs() ]); residentes = residentes_data || []; pagosGC_obj = (pagosGC_raw || []).map((fila, index) => { let obj = {}; ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; }); if (obj.Periodo) { const anioMatch = obj.Periodo.toString().match(/\d{4}/); obj.anio = anioMatch ? parseInt(anioMatch[0]) : null; } obj.rowNum = index + 2; return obj; }).filter(p => p.N_Parcela); (timcs_raw || []).forEach(fila => { const [anio, mes, valor] = fila; if (!timcData[anio]) timcData[anio] = {}; timcData[anio][mes] = parseFloat(valor); }); } catch (e) { ocultarSpinner(); mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error'); return; } // ======================================================= // FUNCIONES DE AYUDA (DEFINIDAS DENTRO PARA TENER ACCESO A LAS VARIABLES) // ======================================================= function formatearPeriodo(periodo) { if (!periodo) return 'N/A'; const matchAnio = periodo.toString().match(/\d{4}/); const anio = matchAnio ? parseInt(matchAnio[0]) : null; const matchMes = MESES.findIndex(m => periodo.toLowerCase().includes(m.toLowerCase())); if (anio && matchMes !== -1) { return `${MESES[matchMes]} ${anio}`; } const match = periodo.toString().match(/^(\d{4})-(\d{1,2})$/); if (match) { const anio = parseInt(match[1]); const mesIndex = parseInt(match[2]) - 1; if (mesIndex >= 0 && mesIndex < 12) { return `${MESES[mesIndex]} ${anio}`; } } return periodo; } function actualizarVistaPreviaComprobante(pago) { pagoSeleccionadoParaEnviar = pago; const parcela = document.getElementById('inputNParcelaComprobante').value; const asuntoInput = document.getElementById('inputAsuntoComprobante'); const cuerpoDiv = document.getElementById('divCuerpoComprobante'); const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela)); const residentNames = allResidentsForParcela.map(r => r[1]).join(' y '); const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0]; if (!representativeResident) { cuerpoDiv.innerHTML = `<span style="color: #dc3545;">Error: No se pudo encontrar un residente representativo.</span>`; return; } const aEnviar = {...representativeResident}; aEnviar[1] = residentNames; const periodoFormateado = formatearPeriodo(pago.Periodo); asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`; cuerpoDiv.innerHTML = crearCuerpoCorreo(pago, aEnviar); } function crearCuerpoCorreo(pago, residente) { const nombreResidente = residente[1]; const periodoFormateado = formatearPeriodo(pago.Periodo); const montoPagado = parseFloat(pago.Monto_Pagado || 0); const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0); const abonoConvenio = parseFloat(pago.Abono_Convenio || 0); const montoTotalAbonadoGC = montoPagado + saldoFavorUsado; const valorGC = parseFloat(pago.Valor_Gasto_Comun || 0); const interes = parseFloat(pago.Interes || 0); const multa = parseFloat(pago['Multa_1/4'] || 0); const deudaDelPeriodo = valorGC + interes + multa; const saldoTransaccion = montoTotalAbonadoGC - deudaDelPeriodo; // ▼ INICIO: CÓDIGO MODIFICADO ▼ // Se crea una variable para el resultado final, que será más clara. let resultadoHtml; if (saldoTransaccion >= 0) { // El período está pagado. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #2e7d32;"> <td style="padding:10px 0; color:#2e7d32; font-size:1.1em;">Estado del Período:</td> <td style="padding:10px 0; text-align:right; color:#2e7d32; font-size:1.1em;">PAGADO</td> </tr> `; // Solo se muestra el saldo a favor si es mayor que cero. if (saldoTransaccion > 0) { resultadoHtml += ` <tr> <td style="padding:5px 0;">Saldo a favor generado en esta transacción:</td> <td style="padding:5px 0; text-align:right; font-weight:bold;">$${saldoTransaccion.toLocaleString('es-CL')}</td> </tr> `; } } else { // El período queda con deuda. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #cccccc;"> <td style="padding:10px 0; color:#d32f2f;">Saldo pendiente del Período:</td> <td style="padding:10px 0; text-align:right; color:#d32f2f;">$${Math.abs(saldoTransaccion).toLocaleString('es-CL')}</td> </tr> `; } // ▲ FIN: CÓDIGO MODIFICADO ▲ return ` <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante de Pago</title></head> <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;margin:20px auto;border:1px solid #dddddd;"> <tr><td align="center" bgcolor="#2a7ca3" style="padding:20px;color:#ffffff;"><h2 style="margin:0;">Comprobante de Pago</h2><p style="margin:5px 0 0;">Condominio Los Molles</p></td></tr> <tr><td style="padding:25px 20px;"> <p>Estimado(a) <strong>${nombreResidente}</strong>,</p> <p>Confirmamos la recepción de su pago para el período <strong>${periodoFormateado}</strong>. A continuación el detalle:</p> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle Deuda del Período</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:5px 0;">Gasto Común Ordinario:</td><td style="padding:5px 0;text-align:right;">$${valorGC.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Intereses por mora:</td><td style="padding:5px 0;text-align:right;">$${interes.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Multas del período:</td><td style="padding:5px 0;text-align:right;">$${multa.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;border-top:1px solid #dddddd;"><td style="padding:8px 0;">Deuda Total del Período:</td><td style="padding:8px 0;text-align:right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr> </table> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle de su Pago</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:8px 0;">Monto Pagado (transferencia/efectivo):</td><td style="padding:8px 0;text-align:right;">$${montoPagado.toLocaleString('es-CL')}</td></tr> ${abonoConvenio > 0 ? `<tr><td style="padding:8px 0;">Abono a Convenio de Deuda:</td><td style="padding:8px 0;text-align:right;">$${abonoConvenio.toLocaleString('es-CL')}</td></tr>` : ''} <tr><td style="padding:8px 0;">Saldo a Favor Utilizado:</td><td style="padding:8px 0;text-align:right;">$${saldoFavorUsado.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;"><td style="padding:8px 0;border-top:1px solid #eeeeee;">Total Abonado al Período (G.C.):</td><td style="padding:8px 0;text-align:right;border-top:1px solid #eeeeee;">$${montoTotalAbonadoGC.toLocaleString('es-CL')}</td></tr> ${resultadoHtml} </table> <hr style="border:0;border-top:1px solid #eeeeee;margin-top:20px;"> <p>Gracias por su compromiso.</p><p style="margin-top:20px;">Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p> </td></tr> <tr><td bgcolor="#f4f4f4" style="text-align:center;padding:15px;font-size:12px;color:#777777;">Este es un correo electrónico generado automáticamente.</td></tr> </table> </body></html>`;
}

    async function guardarConvenio(nParcela, datosConvenio) {
      mostrarSpinner();
      try {
        await gapi.client.request({
          'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
          'method': 'POST',
          'body': {
            'function': 'guardarConvenio_GS',
            'parameters': [nParcela, datosConvenio]
          }
        });
        // Recargar los datos para reflejar los cambios
        await cargarGastosComunes();
        // Forzar el filtro para ver la parcela actualizada
        document.getElementById('filtroParcela').value = nParcela;
        filtrarYRenderizar();
        mostrarMensaje('Convenio guardado y deudas anteriores congeladas con éxito.', 'success');
      } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        mostrarMensaje(`Error al guardar el convenio: ${errorMessage}`, 'error');
      } finally {
        ocultarSpinner();
      }
    }

    async function enviarAcuerdoConvenio(residente, datosConvenio) {
        const emailResidente = residente[5];
        if (!emailResidente || !emailResidente.includes('@')) {
            mostrarMensaje('El residente no tiene un correo electrónico válido registrado.', 'error');
            return;
        }
        const confirmacion = confirm(`¿Está seguro que desea enviar el correo de acuerdo de convenio de pago a ${residente[1]} (${emailResidente})?`);
        if (!confirmacion) return;
        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'enviarCorreoConvenio_GS',
                    'parameters': [residente, datosConvenio]
                }
            });
            mostrarMensaje('Correo de acuerdo de convenio enviado exitosamente.', 'success');
        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al enviar el correo de convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }

    async function formalizarConvenio(nParcela, nombreResidente) {
        const instruccion = `Para formalizar el convenio de la parcela ${nParcela} (${nombreResidente}), por favor, pegue aquí el enlace permanente del correo de aceptación del residente.\n\nPara obtener el enlace en Gmail:\n1. Abra el correo de aceptación.\n2. Haga clic en los tres puntos (Más opciones).\n3. Seleccione "Imprimir".\n4. En la ventana de impresión, copie la URL de la barra de direcciones del navegador.`;
        const urlConvenio = prompt(instruccion, "");

        if (urlConvenio === null) return; // El usuario canceló
        if (urlConvenio.trim() === "" || !urlConvenio.startsWith("http")) {
            alert("El enlace proporcionado no es válido. Por favor, inténtelo de nuevo.");
            return;
        }

        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'formalizarConvenio_GS',
                    'parameters': [nParcela, urlConvenio]
                }
            });
            
            pagosGC_obj.forEach(pago => {
                if (String(pago.N_Parcela) === String(nParcela) && pago.Estado === 'Moroso') {
                    pago.Estado = 'En Convenio';
                }
            });

            filtrarYRenderizar();
            mostrarMensaje(`Convenio formalizado para la parcela ${nParcela}. Las deudas anteriores han sido marcadas como "En Convenio".`, 'success');

        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al formalizar el convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }
    
    // =======================================================
    // RENDERIZADO DEL HTML PRINCIPAL
    // =======================================================

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <style>
            .estado-pagado { background-color: #198754; color: white; } 
            .estado-moroso { background-color: #dc3545; color: white; } 
            .estado-abono { background-color: #ffc107; color: #333; } 
            .estado-en-convenio { background-color: #0dcaf0; color: #000; }
            .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; } 
            #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;} 
            #detalle-pago-grid b { grid-column: 1; text-align: right; } 
            #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; } 
            .suggestion-item { padding: 8px 12px; cursor: pointer; } 
            .suggestion-item:hover { background-color: #e9f1fb; } 
            #table-pagos { table-layout: fixed; width: 100%; border-collapse: collapse; } 
            #table-pagos th { position: relative; } 
            .resizer { position: absolute; top: 0; right: -2px; width: 5px; cursor: col-resize; user-select: none; height: 100%; z-index: 1;} 
            .resizer:hover { border-right: 2px solid #007bff; } 
            .comprobante-enviado { color: green; font-size: 1.2rem; font-weight: bold; text-align: center; } 
            #convenio-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; } 
            #convenio-summary-grid > div { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; } 
            #convenio-summary-grid > div > span { display: block; font-size: 1.4em; font-weight: bold; } 
            .saldo-info { padding: 10px; border-radius: 5px; margin-top: 5px; font-weight: bold; text-align: center; } 
            .saldo-convenio { background-color: #fff8e1; color: #f57f17; } 
            .saldo-favor { background-color: #e8f5e9; color: #2e7d32; }
        </style>
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
            <section class="widget" style="flex: 1; min-width: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroParcela"><b>N° Parcela:</b></label>
                            <input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;">
                            <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroAnio"><b>Año:</b></label>
                            <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
                        </div>
                    </div>
                </div>
                <div style="margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                    <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
                    <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
                </div>
            </section>
            <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
        </div>
        <section id="widget-convenio" class="widget" style="display:none; margin-top: 2rem;">
            <h3 style="margin-top:0;">Estado de Convenio de Pago</h3>
            <div id="convenio-summary-grid"></div>
            <h4 style="margin-top: 1.5rem;">Historial de Abonos (Año Seleccionado)</h4>
            <div class="table-container"><table class="table"><thead id="thead-abonos"></thead><tbody id="tbody-abonos"></tbody></table></div>
        </section>
        <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Pagos Registrados</h3><div class="table-container"><table id="table-pagos" class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
        
        <div id="modalGC" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Agregar Gasto Común</h3>
                <form id="formGastoComun">
                    <div class="form-grid">
                        <div>
                            <label>N° Parcela</label>
                            <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
                            <div style="position: relative;">
                                <label>Nombre Residente</label>
                                <input type="text" name="Nombre_Residente" id="inputNombreResidente" autocomplete="off" required>
                                <div id="nombre-suggestions" style="display: none; position: absolute; background-color: white; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; width: 100%; z-index: 10;"></div>
                            </div>
                            <label>Valor Gasto Común</label>
                            <input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;">
                            <div id="saldo-convenio-info" class="saldo-info saldo-convenio" style="display:none;"></div>
                            <div id="saldo-favor-info" class="saldo-info saldo-favor" style="display:none;"></div>
                            <div style="display:flex; gap: 15px;">
                                <div style="flex: 1;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div>
                                <div style="flex: 1;"><label>Año que Paga</label><input type="number" name="Anio_Periodo" id="inputAnioPeriodo" required></div>
                            </div>
                        </div>
                        <div style="border-left: 1px solid #ddd; padding-left: 20px;">
                            <label>Fecha de Pago</label>
                            <input type="date" name="Fecha_Pago" required>
                            <label>Monto Pagado G.C. (depósito/efectivo)</label>
                            <input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP" value="0">
                            <label>Usar Saldo a Favor</label>
                            <input type="number" name="Saldo_Favor_Usado" min="0" step="1" placeholder="CLP" value="0">
                            <label>Abono a Convenio (CLP)</label>
                            <input type="number" name="Abono_Convenio" min="0" step="1" placeholder="CLP" value="0">
                            <label>Método de Pago</label>
                            <select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select>
                        </div>
                    </div>
                    <div style="width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <label>Descripción / Nota del Pago (Opcional)</label>
                        <textarea name="Descripcion_Pago" rows="2" placeholder="Ej: Pago parcial, solicitud de uso de saldo a favor, etc."></textarea>
                        <label style="margin-top:15px;">Adjuntar Comprobante (Opcional)</label>
                        <input type="file" name="Comprobante" accept=".pdf,.jpg,.jpeg,.png">
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
                        <button class="btn" type="submit">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="modalComprobante" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Enviar Comprobante por Correo</h3>
                <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente(s)</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div id="periodo-selector-container" style="display: none;"><label><b>Seleccione el Comprobante</b></label><select id="selectPeriodoComprobante" style="width:100%; padding: 11px 10px;"></select></div><div><label><b>Email(s) Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
            </div>
        </div>
        <div id="modalDetallePago" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin-top:0;">Detalle Completo del Registro</h3>
                <div id="contenidoDetallePago" style="margin-bottom: 20px;"></div>
                <div style="text-align: right;"><button id="btnCerrarModalDetalle" class="btn secondary">Cerrar</button></div>
            </div>
        </div>
        
        <div id="modalConvenio" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin...

selectedRelevantSnippets:
snippet_1: // ================================================================================= // ===== GASTOS_COMUNES.JS - CÓDIGO COMPLETO Y FINAL (CON TODAS LAS CORRECCIONES) ===== // ================================================================================= // Constantes globales para el módulo const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; const ENCABEZADOS_PAGOS = [ 'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo', 'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC', 'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado', 'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado', 'Descripcion_Deuda', 'Descripcion_Pago', 'Saldo_Favor_Usado' ]; async function cargarGastosComunes() { limpiarMainContent(); mostrarSpinner(); // Variables locales que estarán disponibles para todas las funciones internas let residentes = []; let pagosGC_obj = []; let timcData = {}; let pagoSeleccionadoParaEnviar = null; try { const [residentes_data, pagosGC_raw, timcs_raw] = await Promise.all([ obtenerResidentes(), obtenerPagosGC(), obtenerTIMCs() ]); residentes = residentes_data || []; pagosGC_obj = (pagosGC_raw || []).map((fila, index) => { let obj = {}; ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; }); if (obj.Periodo) { const anioMatch = obj.Periodo.toString().match(/\d{4}/); obj.anio = anioMatch ? parseInt(anioMatch[0]) : null; } obj.rowNum = index + 2; return obj; }).filter(p => p.N_Parcela); (timcs_raw || []).forEach(fila => { const [anio, mes, valor] = fila; if (!timcData[anio]) timcData[anio] = {}; timcData[anio][mes] = parseFloat(valor); }); } catch (e) { ocultarSpinner(); mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error'); return; } // ======================================================= // FUNCIONES DE AYUDA (DEFINIDAS DENTRO PARA TENER ACCESO A LAS VARIABLES) // ======================================================= function formatearPeriodo(periodo) { if (!periodo) return 'N/A'; const matchAnio = periodo.toString().match(/\d{4}/); const anio = matchAnio ? parseInt(matchAnio[0]) : null; const matchMes = MESES.findIndex(m => periodo.toLowerCase().includes(m.toLowerCase())); if (anio && matchMes !== -1) { return `${MESES[matchMes]} ${anio}`; } const match = periodo.toString().match(/^(\d{4})-(\d{1,2})$/); if (match) { const anio = parseInt(match[1]); const mesIndex = parseInt(match[2]) - 1; if (mesIndex >= 0 && mesIndex < 12) { return `${MESES[mesIndex]} ${anio}`; } } return periodo; } function actualizarVistaPreviaComprobante(pago) { pagoSeleccionadoParaEnviar = pago; const parcela = document.getElementById('inputNParcelaComprobante').value; const asuntoInput = document.getElementById('inputAsuntoComprobante'); const cuerpoDiv = document.getElementById('divCuerpoComprobante'); const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela)); const residentNames = allResidentsForParcela.map(r => r[1]).join(' y '); const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0]; if (!representativeResident) { cuerpoDiv.innerHTML = `<span style="color: #dc3545;">Error: No se pudo encontrar un residente representativo.</span>`; return; } const aEnviar = {...representativeResident}; aEnviar[1] = residentNames; const periodoFormateado = formatearPeriodo(pago.Periodo); asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`; cuerpoDiv.innerHTML = crearCuerpoCorreo(pago, aEnviar); } function crearCuerpoCorreo(pago, residente) { const nombreResidente = residente[1]; const periodoFormateado = formatearPeriodo(pago.Periodo); const montoPagado = parseFloat(pago.Monto_Pagado || 0); const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0); const abonoConvenio = parseFloat(pago.Abono_Convenio || 0); const montoTotalAbonadoGC = montoPagado + saldoFavorUsado; const valorGC = parseFloat(pago.Valor_Gasto_Comun || 0); const interes = parseFloat(pago.Interes || 0); const multa = parseFloat(pago['Multa_1/4'] || 0); const deudaDelPeriodo = valorGC + interes + multa; const saldoTransaccion = montoTotalAbonadoGC - deudaDelPeriodo; // ▼ INICIO: CÓDIGO MODIFICADO ▼ // Se crea una variable para el resultado final, que será más clara. let resultadoHtml; if (saldoTransaccion >= 0) { // El período está pagado. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #2e7d32;"> <td style="padding:10px 0; color:#2e7d32; font-size:1.1em;">Estado del Período:</td> <td style="padding:10px 0; text-align:right; color:#2e7d32; font-size:1.1em;">PAGADO</td> </tr> `; // Solo se muestra el saldo a favor si es mayor que cero. if (saldoTransaccion > 0) { resultadoHtml += ` <tr> <td style="padding:5px 0;">Saldo a favor generado en esta transacción:</td> <td style="padding:5px 0; text-align:right; font-weight:bold;">$${saldoTransaccion.toLocaleString('es-CL')}</td> </tr> `; } } else { // El período queda con deuda. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #cccccc;"> <td style="padding:10px 0; color:#d32f2f;">Saldo pendiente del Período:</td> <td style="padding:10px 0; text-align:right; color:#d32f2f;">$${Math.abs(saldoTransaccion).toLocaleString('es-CL')}</td> </tr> `; } // ▲ FIN: CÓDIGO MODIFICADO ▲ return ` <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante de Pago</title></head> <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;margin:20px auto;border:1px solid #dddddd;"> <tr><td align="center" bgcolor="#2a7ca3" style="padding:20px;color:#ffffff;"><h2 style="margin:0;">Comprobante de Pago</h2><p style="margin:5px 0 0;">Condominio Los Molles</p></td></tr> <tr><td style="padding:25px 20px;"> <p>Estimado(a) <strong>${nombreResidente}</strong>,</p> <p>Confirmamos la recepción de su pago para el período <strong>${periodoFormateado}</strong>. A continuación el detalle:</p> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle Deuda del Período</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:5px 0;">Gasto Común Ordinario:</td><td style="padding:5px 0;text-align:right;">$${valorGC.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Intereses por mora:</td><td style="padding:5px 0;text-align:right;">$${interes.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Multas del período:</td><td style="padding:5px 0;text-align:right;">$${multa.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;border-top:1px solid #dddddd;"><td style="padding:8px 0;">Deuda Total del Período:</td><td style="padding:8px 0;text-align:right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr> </table> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle de su Pago</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:8px 0;">Monto Pagado (transferencia/efectivo):</td><td style="padding:8px 0;text-align:right;">$${montoPagado.toLocaleString('es-CL')}</td></tr> ${abonoConvenio > 0 ? `<tr><td style="padding:8px 0;">Abono a Convenio de Deuda:</td><td style="padding:8px 0;text-align:right;">$${abonoConvenio.toLocaleString('es-CL')}</td></tr>` : ''} <tr><td style="padding:8px 0;">Saldo a Favor Utilizado:</td><td style="padding:8px 0;text-align:right;">$${saldoFavorUsado.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;"><td style="padding:8px 0;border-top:1px solid #eeeeee;">Total Abonado al Período (G.C.):</td><td style="padding:8px 0;text-align:right;border-top:1px solid #eeeeee;">$${montoTotalAbonadoGC.toLocaleString('es-CL')}</td></tr> ${resultadoHtml} </table> <hr style="border:0;border-top:1px solid #eeeeee;margin-top:20px;"> <p>Gracias por su compromiso.</p><p style="margin-top:20px;">Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p> </td></tr> <tr><td bgcolor="#f4f4f4" style="text-align:center;padding:15px;font-size:12px;color:#777777;">Este es un correo electrónico generado automáticamente.</td></tr> </table> </body></html>`;
}

    async function guardarConvenio(nParcela, datosConvenio) {
      mostrarSpinner();
      try {
        await gapi.client.request({
          'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
          'method': 'POST',
          'body': {
            'function': 'guardarConvenio_GS',
            'parameters': [nParcela, datosConvenio]
          }
        });
        // Recargar los datos para reflejar los cambios
        await cargarGastosComunes();
        // Forzar el filtro para ver la parcela actualizada
        document.getElementById('filtroParcela').value = nParcela;
        filtrarYRenderizar();
        mostrarMensaje('Convenio guardado y deudas anteriores congeladas con éxito.', 'success');
      } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        mostrarMensaje(`Error al guardar el convenio: ${errorMessage}`, 'error');
      } finally {
        ocultarSpinner();
      }
    }

    async function enviarAcuerdoConvenio(residente, datosConvenio) {
        const emailResidente = residente[5];
        if (!emailResidente || !emailResidente.includes('@')) {
            mostrarMensaje('El residente no tiene un correo electrónico válido registrado.', 'error');
            return;
        }
        const confirmacion = confirm(`¿Está seguro que desea enviar el correo de acuerdo de convenio de pago a ${residente[1]} (${emailResidente})?`);
        if (!confirmacion) return;
        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'enviarCorreoConvenio_GS',
                    'parameters': [residente, datosConvenio]
                }
            });
            mostrarMensaje('Correo de acuerdo de convenio enviado exitosamente.', 'success');
        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al enviar el correo de convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }

    async function formalizarConvenio(nParcela, nombreResidente) {
        const instruccion = `Para formalizar el convenio de la parcela ${nParcela} (${nombreResidente}), por favor, pegue aquí el enlace permanente del correo de aceptación del residente.\n\nPara obtener el enlace en Gmail:\n1. Abra el correo de aceptación.\n2. Haga clic en los tres puntos (Más opciones).\n3. Seleccione "Imprimir".\n4. En la ventana de impresión, copie la URL de la barra de direcciones del navegador.`;
        const urlConvenio = prompt(instruccion, "");

        if (urlConvenio === null) return; // El usuario canceló
        if (urlConvenio.trim() === "" || !urlConvenio.startsWith("http")) {
            alert("El enlace proporcionado no es válido. Por favor, inténtelo de nuevo.");
            return;
        }

        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'formalizarConvenio_GS',
                    'parameters': [nParcela, urlConvenio]
                }
            });
            
            pagosGC_obj.forEach(pago => {
                if (String(pago.N_Parcela) === String(nParcela) && pago.Estado === 'Moroso') {
                    pago.Estado = 'En Convenio';
                }
            });

            filtrarYRenderizar();
            mostrarMensaje(`Convenio formalizado para la parcela ${nParcela}. Las deudas anteriores han sido marcadas como "En Convenio".`, 'success');

        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al formalizar el convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }
    
    // =======================================================
    // RENDERIZADO DEL HTML PRINCIPAL
    // =======================================================

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <style>
            .estado-pagado { background-color: #198754; color: white; } 
            .estado-moroso { background-color: #dc3545; color: white; } 
            .estado-abono { background-color: #ffc107; color: #333; } 
            .estado-en-convenio { background-color: #0dcaf0; color: #000; }
            .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; } 
            #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;} 
            #detalle-pago-grid b { grid-column: 1; text-align: right; } 
            #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; } 
            .suggestion-item { padding: 8px 12px; cursor: pointer; } 
            .suggestion-item:hover { background-color: #e9f1fb; } 
            #table-pagos { table-layout: fixed; width: 100%; border-collapse: collapse; } 
            #table-pagos th { position: relative; } 
            .resizer { position: absolute; top: 0; right: -2px; width: 5px; cursor: col-resize; user-select: none; height: 100%; z-index: 1;} 
            .resizer:hover { border-right: 2px solid #007bff; } 
            .comprobante-enviado { color: green; font-size: 1.2rem; font-weight: bold; text-align: center; } 
            #convenio-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; } 
            #convenio-summary-grid > div { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; } 
            #convenio-summary-grid > div > span { display: block; font-size: 1.4em; font-weight: bold; } 
            .saldo-info { padding: 10px; border-radius: 5px; margin-top: 5px; font-weight: bold; text-align: center; } 
            .saldo-convenio { background-color: #fff8e1; color: #f57f17; } 
            .saldo-favor { background-color: #e8f5e9; color: #2e7d32; }
        </style>
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
            <section class="widget" style="flex: 1; min-width: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroParcela"><b>N° Parcela:</b></label>
                            <input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;">
                            <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroAnio"><b>Año:</b></label>
                            <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
                        </div>
                    </div>
                </div>
                <div style="margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                    <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
                    <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
                </div>
            </section>
            <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
        </div>
        <section id="widget-convenio" class="widget" style="display:none; margin-top: 2rem;">
            <h3 style="margin-top:0;">Estado de Convenio de Pago</h3>
            <div id="convenio-summary-grid"></div>
            <h4 style="margin-top: 1.5rem;">Historial de Abonos (Año Seleccionado)</h4>
            <div class="table-container"><table class="table"><thead id="thead-abonos"></thead><tbody id="tbody-abonos"></tbody></table></div>
        </section>
        <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Pagos Registrados</h3><div class="table-container"><table id="table-pagos" class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
        
        <div id="modalGC" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Agregar Gasto Común</h3>
                <form id="formGastoComun">
                    <div class="row">
                        <div class="col-md-6">
                            <label>Fecha de Emisión</label>
                            <input type="date" name="Fecha_Vencimiento" required>
                        </div>
                        <div class="col-md-6">
                            <label>Período del Gasto Común</label>
                            <input type="month" name="Periodo" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>N° Parcela</label>
                            <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
                        </div>
                        <div class="col-md-6">
                            <label>Valor Gasto Común</label>
                            <input type="number" name="Valor_Gasto_Comun" min="0" step="1" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>Monto Pagado</label>
                            <input type="number" name="Monto_Pagado" min="0" step="1" required>
                        </div>
                        <div class="col-md-6">
                            <label>Multa</label>
                            <input type="number" name="Multa_1/4" min="0" step="1" value="0">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>Interes</label>
                            <input type="number" name="Interes" min="0" step="1" value="0">
                        </div>
                    </div>
                    <div style="width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <label>Descripción / Nota del Pago (Opcional)</label>
                        <textarea name="Descripcion_Pago" rows="2" placeholder="Ej: Pago parcial, solicitud de uso de saldo a favor, etc."></textarea>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
                        <button class="btn" type="submit">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="modalComprobante" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Enviar Comprobante por Correo</h3>
                <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente(s)</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div id="periodo-selector-container" style="display: none;"><label><b>Seleccione el Comprobante</b></label><select id="selectPeriodoComprobante" style="width:100%; padding: 11px 10px;"></select></div><div><label><b>Email(s) Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
            </div>
        </div>
        <div id="modalDetallePago" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin-top:0;">Detalle Completo del Registro</h3>
                <div id="contenidoDetallePago" style="margin-bottom: 20px;"></div>
                <div style="text-align: right;"><button id="btnCerrarModalDetalle" class="btn secondary">Cerrar</button></div>
            </div>
        </div>
        
        <div id="modalConvenio" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin...

selectedRelevantSnippets:
snippet_1: // ================================================================================= // ===== GASTOS_COMUNES.JS - CÓDIGO COMPLETO Y FINAL (CON TODAS LAS CORRECCIONES) ===== // ================================================================================= // Constantes globales para el módulo const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; const ENCABEZADOS_PAGOS = [ 'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo', 'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC', 'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado', 'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado', 'Descripcion_Deuda', 'Descripcion_Pago', 'Saldo_Favor_Usado' ]; async function cargarGastosComunes() { limpiarMainContent(); mostrarSpinner(); // Variables locales que estarán disponibles para todas las funciones internas let residentes = []; let pagosGC_obj = []; let timcData = {}; let pagoSeleccionadoParaEnviar = null; try { const [residentes_data, pagosGC_raw, timcs_raw] = await Promise.all([ obtenerResidentes(), obtenerPagosGC(), obtenerTIMCs() ]); residentes = residentes_data || []; pagosGC_obj = (pagosGC_raw || []).map((fila, index) => { let obj = {}; ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; }); if (obj.Periodo) { const anioMatch = obj.Periodo.toString().match(/\d{4}/); obj.anio = anioMatch ? parseInt(anioMatch[0]) : null; } obj.rowNum = index + 2; return obj; }).filter(p => p.N_Parcela); (timcs_raw || []).forEach(fila => { const [anio, mes, valor] = fila; if (!timcData[anio]) timcData[anio] = {}; timcData[anio][mes] = parseFloat(valor); }); } catch (e) { ocultarSpinner(); mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error'); return; } // ======================================================= // FUNCIONES DE AYUDA (DEFINIDAS DENTRO PARA TENER ACCESO A LAS VARIABLES) // ======================================================= function formatearPeriodo(periodo) { if (!periodo) return 'N/A'; const matchAnio = periodo.toString().match(/\d{4}/); const anio = matchAnio ? parseInt(matchAnio[0]) : null; const matchMes = MESES.findIndex(m => periodo.toLowerCase().includes(m.toLowerCase())); if (anio && matchMes !== -1) { return `${MESES[matchMes]} ${anio}`; } const match = periodo.toString().match(/^(\d{4})-(\d{1,2})$/); if (match) { const anio = parseInt(match[1]); const mesIndex = parseInt(match[2]) - 1; if (mesIndex >= 0 && mesIndex < 12) { return `${MESES[mesIndex]} ${anio}`; } } return periodo; } function actualizarVistaPreviaComprobante(pago) { pagoSeleccionadoParaEnviar = pago; const parcela = document.getElementById('inputNParcelaComprobante').value; const asuntoInput = document.getElementById('inputAsuntoComprobante'); const cuerpoDiv = document.getElementById('divCuerpoComprobante'); const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela)); const residentNames = allResidentsForParcela.map(r => r[1]).join(' y '); const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0]; if (!representativeResident) { cuerpoDiv.innerHTML = `<span style="color: #dc3545;">Error: No se pudo encontrar un residente representativo.</span>`; return; } const aEnviar = {...representativeResident}; aEnviar[1] = residentNames; const periodoFormateado = formatearPeriodo(pago.Periodo); asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`; cuerpoDiv.innerHTML = crearCuerpoCorreo(pago, aEnviar); } function crearCuerpoCorreo(pago, residente) { const nombreResidente = residente[1]; const periodoFormateado = formatearPeriodo(pago.Periodo); const montoPagado = parseFloat(pago.Monto_Pagado || 0); const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0); const abonoConvenio = parseFloat(pago.Abono_Convenio || 0); const montoTotalAbonadoGC = montoPagado + saldoFavorUsado; const valorGC = parseFloat(pago.Valor_Gasto_Comun || 0); const interes = parseFloat(pago.Interes || 0); const multa = parseFloat(pago['Multa_1/4'] || 0); const deudaDelPeriodo = valorGC + interes + multa; const saldoTransaccion = montoTotalAbonadoGC - deudaDelPeriodo; // ▼ INICIO: CÓDIGO MODIFICADO ▼ // Se crea una variable para el resultado final, que será más clara. let resultadoHtml; if (saldoTransaccion >= 0) { // El período está pagado. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #2e7d32;"> <td style="padding:10px 0; color:#2e7d32; font-size:1.1em;">Estado del Período:</td> <td style="padding:10px 0; text-align:right; color:#2e7d32; font-size:1.1em;">PAGADO</td> </tr> `; // Solo se muestra el saldo a favor si es mayor que cero. if (saldoTransaccion > 0) { resultadoHtml += ` <tr> <td style="padding:5px 0;">Saldo a favor generado en esta transacción:</td> <td style="padding:5px 0; text-align:right; font-weight:bold;">$${saldoTransaccion.toLocaleString('es-CL')}</td> </tr> `; } } else { // El período queda con deuda. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #cccccc;"> <td style="padding:10px 0; color:#d32f2f;">Saldo pendiente del Período:</td> <td style="padding:10px 0; text-align:right; color:#d32f2f;">$${Math.abs(saldoTransaccion).toLocaleString('es-CL')}</td> </tr> `; } // ▲ FIN: CÓDIGO MODIFICADO ▲ return ` <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante de Pago</title></head> <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;margin:20px auto;border:1px solid #dddddd;"> <tr><td align="center" bgcolor="#2a7ca3" style="padding:20px;color:#ffffff;"><h2 style="margin:0;">Comprobante de Pago</h2><p style="margin:5px 0 0;">Condominio Los Molles</p></td></tr> <tr><td style="padding:25px 20px;"> <p>Estimado(a) <strong>${nombreResidente}</strong>,</p> <p>Confirmamos la recepción de su pago para el período <strong>${periodoFormateado}</strong>. A continuación el detalle:</p> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle Deuda del Período</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:5px 0;">Gasto Común Ordinario:</td><td style="padding:5px 0;text-align:right;">$${valorGC.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Intereses por mora:</td><td style="padding:5px 0;text-align:right;">$${interes.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Multas del período:</td><td style="padding:5px 0;text-align:right;">$${multa.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;border-top:1px solid #dddddd;"><td style="padding:8px 0;">Deuda Total del Período:</td><td style="padding:8px 0;text-align:right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr> </table> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle de su Pago</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:8px 0;">Monto Pagado (transferencia/efectivo):</td><td style="padding:8px 0;text-align:right;">$${montoPagado.toLocaleString('es-CL')}</td></tr> ${abonoConvenio > 0 ? `<tr><td style="padding:8px 0;">Abono a Convenio de Deuda:</td><td style="padding:8px 0;text-align:right;">$${abonoConvenio.toLocaleString('es-CL')}</td></tr>` : ''} <tr><td style="padding:8px 0;">Saldo a Favor Utilizado:</td><td style="padding:8px 0;text-align:right;">$${saldoFavorUsado.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;"><td style="padding:8px 0;border-top:1px solid #eeeeee;">Total Abonado al Período (G.C.):</td><td style="padding:8px 0;text-align:right;border-top:1px solid #eeeeee;">$${montoTotalAbonadoGC.toLocaleString('es-CL')}</td></tr> ${resultadoHtml} </table> <hr style="border:0;border-top:1px solid #eeeeee;margin-top:20px;"> <p>Gracias por su compromiso.</p><p style="margin-top:20px;">Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p> </td></tr> <tr><td bgcolor="#f4f4f4" style="text-align:center;padding:15px;font-size:12px;color:#777777;">Este es un correo electrónico generado automáticamente.</td></tr> </table> </body></html>`;
}

    async function guardarConvenio(nParcela, datosConvenio) {
      mostrarSpinner();
      try {
        await gapi.client.request({
          'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
          'method': 'POST',
          'body': {
            'function': 'guardarConvenio_GS',
            'parameters': [nParcela, datosConvenio]
          }
        });
        // Recargar los datos para reflejar los cambios
        await cargarGastosComunes();
        // Forzar el filtro para ver la parcela actualizada
        document.getElementById('filtroParcela').value = nParcela;
        filtrarYRenderizar();
        mostrarMensaje('Convenio guardado y deudas anteriores congeladas con éxito.', 'success');
      } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        mostrarMensaje(`Error al guardar el convenio: ${errorMessage}`, 'error');
      } finally {
        ocultarSpinner();
      }
    }

    async function enviarAcuerdoConvenio(residente, datosConvenio) {
        const emailResidente = residente[5];
        if (!emailResidente || !emailResidente.includes('@')) {
            mostrarMensaje('El residente no tiene un correo electrónico válido registrado.', 'error');
            return;
        }
        const confirmacion = confirm(`¿Está seguro que desea enviar el correo de acuerdo de convenio de pago a ${residente[1]} (${emailResidente})?`);
        if (!confirmacion) return;
        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'enviarCorreoConvenio_GS',
                    'parameters': [residente, datosConvenio]
                }
            });
            mostrarMensaje('Correo de acuerdo de convenio enviado exitosamente.', 'success');
        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al enviar el correo de convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }

    async function formalizarConvenio(nParcela, nombreResidente) {
        const instruccion = `Para formalizar el convenio de la parcela ${nParcela} (${nombreResidente}), por favor, pegue aquí el enlace permanente del correo de aceptación del residente.\n\nPara obtener el enlace en Gmail:\n1. Abra el correo de aceptación.\n2. Haga clic en los tres puntos (Más opciones).\n3. Seleccione "Imprimir".\n4. En la ventana de impresión, copie la URL de la barra de direcciones del navegador.`;
        const urlConvenio = prompt(instruccion, "");

        if (urlConvenio === null) return; // El usuario canceló
        if (urlConvenio.trim() === "" || !urlConvenio.startsWith("http")) {
            alert("El enlace proporcionado no es válido. Por favor, inténtelo de nuevo.");
            return;
        }

        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'formalizarConvenio_GS',
                    'parameters': [nParcela, urlConvenio]
                }
            });
            
            pagosGC_obj.forEach(pago => {
                if (String(pago.N_Parcela) === String(nParcela) && pago.Estado === 'Moroso') {
                    pago.Estado = 'En Convenio';
                }
            });

            filtrarYRenderizar();
            mostrarMensaje(`Convenio formalizado para la parcela ${nParcela}. Las deudas anteriores han sido marcadas como "En Convenio".`, 'success');

        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al formalizar el convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }
    
    // =======================================================
    // RENDERIZADO DEL HTML PRINCIPAL
    // =======================================================

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <style>
            .estado-pagado { background-color: #198754; color: white; } 
            .estado-moroso { background-color: #dc3545; color: white; } 
            .estado-abono { background-color: #ffc107; color: #333; } 
            .estado-en-convenio { background-color: #0dcaf0; color: #000; }
            .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; } 
            #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;} 
            #detalle-pago-grid b { grid-column: 1; text-align: right; } 
            #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; } 
            .suggestion-item { padding: 8px 12px; cursor: pointer; } 
            .suggestion-item:hover { background-color: #e9f1fb; } 
            #table-pagos { table-layout: fixed; width: 100%; border-collapse: collapse; } 
            #table-pagos th { position: relative; } 
            .resizer { position: absolute; top: 0; right: -2px; width: 5px; cursor: col-resize; user-select: none; height: 100%; z-index: 1;} 
            .resizer:hover { border-right: 2px solid #007bff; } 
            .comprobante-enviado { color: green; font-size: 1.2rem; font-weight: bold; text-align: center; } 
            #convenio-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; } 
            #convenio-summary-grid > div { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; } 
            #convenio-summary-grid > div > span { display: block; font-size: 1.4em; font-weight: bold; } 
            .saldo-info { padding: 10px; border-radius: 5px; margin-top: 5px; font-weight: bold; text-align: center; } 
            .saldo-convenio { background-color: #fff8e1; color: #f57f17; } 
            .saldo-favor { background-color: #e8f5e9; color: #2e7d32; }
        </style>
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
            <section class="widget" style="flex: 1; min-width: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroParcela"><b>N° Parcela:</b></label>
                            <input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;">
                            <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroAnio"><b>Año:</b></label>
                            <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
                        </div>
                    </div>
                </div>
                <div style="margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                    <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
                    <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
                </div>
            </section>
            <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
        </div>
        <section id="widget-convenio" class="widget" style="display:none; margin-top: 2rem;">
            <h3 style="margin-top:0;">Estado de Convenio de Pago</h3>
            <div id="convenio-summary-grid"></div>
            <h4 style="margin-top: 1.5rem;">Historial de Abonos (Año Seleccionado)</h4>
            <div class="table-container"><table class="table"><thead id="thead-abonos"></thead><tbody id="tbody-abonos"></tbody></table></div>
        </section>
        <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Pagos Registrados</h3><div class="table-container"><table id="table-pagos" class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
        
        <div id="modalGC" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Agregar Gasto Común</h3>
                <form id="formGastoComun">
                    <div class="row">
                        <div class="col-md-6">
                            <label>Fecha de Emisión</label>
                            <input type="date" name="Fecha_Vencimiento" required>
                        </div>
                        <div class="col-md-6">
                            <label>Período del Gasto Común</label>
                            <input type="month" name="Periodo" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>N° Parcela</label>
                            <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
                        </div>
                        <div class="col-md-6">
                            <label>Valor Gasto Común</label>
                            <input type="number" name="Valor_Gasto_Comun" min="0" step="1" required>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>Monto Pagado</label>
                            <input type="number" name="Monto_Pagado" min="0" step="1" required>
                        </div>
                        <div class="col-md-6">
                            <label>Multa</label>
                            <input type="number" name="Multa_1/4" min="0" step="1" value="0">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <label>Interes</label>
                            <input type="number" name="Interes" min="0" step="1" value="0">
                        </div>
                    </div>
                    <div style="width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <label>Descripción / Nota del Pago (Opcional)</label>
                        <textarea name="Descripcion_Pago" rows="2" placeholder="Ej: Pago parcial, solicitud de uso de saldo a favor, etc."></textarea>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
                        <button class="btn" type="submit">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="modalComprobante" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Enviar Comprobante por Correo</h3>
                <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente(s)</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div id="periodo-selector-container" style="display: none;"><label><b>Seleccione el Comprobante</b></label><select id="selectPeriodoComprobante" style="width:100%; padding: 11px 10px;"></select></div><div><label><b>Email(s) Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
            </div>
        </div>
        <div id="modalDetallePago" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin-top:0;">Detalle Completo del Registro</h3>
                <div id="contenidoDetallePago" style="margin-bottom: 20px;"></div>
                <div style="text-align: right;"><button id="btnCerrarModalDetalle" class="btn secondary">Cerrar</button></div>
            </div>
        </div>
        
        <div id="modalConvenio" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin...

selectedRelevantSnippets:
snippet_1: // ================================================================================= // ===== GASTOS_COMUNES.JS - CÓDIGO COMPLETO Y FINAL (CON TODAS LAS CORRECCIONES) ===== // ================================================================================= // Constantes globales para el módulo const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; const ENCABEZADOS_PAGOS = [ 'ID_Pago', 'Nombre_Residente', 'N_Parcela', 'Valor_Gasto_Comun', 'Periodo', 'Fecha_Vencimiento', 'Monto_Pagado', 'Saldo_Pendiente_o_a_favor', 'Interes', 'TIMC', 'Multa_1/4', 'Meses_Inpagos', 'Deuda_Total', 'Fecha_Pago', 'Metodo_Pago', 'Estado', 'ID_Comprobante_Drive', 'Abono_Convenio', 'Comprobante_Enviado', 'Descripcion_Deuda', 'Descripcion_Pago', 'Saldo_Favor_Usado' ]; async function cargarGastosComunes() { limpiarMainContent(); mostrarSpinner(); // Variables locales que estarán disponibles para todas las funciones internas let residentes = []; let pagosGC_obj = []; let timcData = {}; let pagoSeleccionadoParaEnviar = null; try { const [residentes_data, pagosGC_raw, timcs_raw] = await Promise.all([ obtenerResidentes(), obtenerPagosGC(), obtenerTIMCs() ]); residentes = residentes_data || []; pagosGC_obj = (pagosGC_raw || []).map((fila, index) => { let obj = {}; ENCABEZADOS_PAGOS.forEach((encabezado, i) => { obj[encabezado] = fila[i]; }); if (obj.Periodo) { const anioMatch = obj.Periodo.toString().match(/\d{4}/); obj.anio = anioMatch ? parseInt(anioMatch[0]) : null; } obj.rowNum = index + 2; return obj; }).filter(p => p.N_Parcela); (timcs_raw || []).forEach(fila => { const [anio, mes, valor] = fila; if (!timcData[anio]) timcData[anio] = {}; timcData[anio][mes] = parseFloat(valor); }); } catch (e) { ocultarSpinner(); mostrarMensaje('Error al cargar datos de Gastos Comunes: ' + e.message, 'error'); return; } // ======================================================= // FUNCIONES DE AYUDA (DEFINIDAS DENTRO PARA TENER ACCESO A LAS VARIABLES) // ======================================================= function formatearPeriodo(periodo) { if (!periodo) return 'N/A'; const matchAnio = periodo.toString().match(/\d{4}/); const anio = matchAnio ? parseInt(matchAnio[0]) : null; const matchMes = MESES.findIndex(m => periodo.toLowerCase().includes(m.toLowerCase())); if (anio && matchMes !== -1) { return `${MESES[matchMes]} ${anio}`; } const match = periodo.toString().match(/^(\d{4})-(\d{1,2})$/); if (match) { const anio = parseInt(match[1]); const mesIndex = parseInt(match[2]) - 1; if (mesIndex >= 0 && mesIndex < 12) { return `${MESES[mesIndex]} ${anio}`; } } return periodo; } function actualizarVistaPreviaComprobante(pago) { pagoSeleccionadoParaEnviar = pago; const parcela = document.getElementById('inputNParcelaComprobante').value; const asuntoInput = document.getElementById('inputAsuntoComprobante'); const cuerpoDiv = document.getElementById('divCuerpoComprobante'); const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela)); const residentNames = allResidentsForParcela.map(r => r[1]).join(' y '); const representativeResident = allResidentsForParcela.find(r => r[9] && r[9].trim().toUpperCase() === 'SI') || allResidentsForParcela[0]; if (!representativeResident) { cuerpoDiv.innerHTML = `<span style="color: #dc3545;">Error: No se pudo encontrar un residente representativo.</span>`; return; } const aEnviar = {...representativeResident}; aEnviar[1] = residentNames; const periodoFormateado = formatearPeriodo(pago.Periodo); asuntoInput.value = `Comprobante pago Gasto Común ${periodoFormateado} Parcela ${parcela}`; cuerpoDiv.innerHTML = crearCuerpoCorreo(pago, aEnviar); } function crearCuerpoCorreo(pago, residente) { const nombreResidente = residente[1]; const periodoFormateado = formatearPeriodo(pago.Periodo); const montoPagado = parseFloat(pago.Monto_Pagado || 0); const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0); const abonoConvenio = parseFloat(pago.Abono_Convenio || 0); const montoTotalAbonadoGC = montoPagado + saldoFavorUsado; const valorGC = parseFloat(pago.Valor_Gasto_Comun || 0); const interes = parseFloat(pago.Interes || 0); const multa = parseFloat(pago['Multa_1/4'] || 0); const deudaDelPeriodo = valorGC + interes + multa; const saldoTransaccion = montoTotalAbonadoGC - deudaDelPeriodo; // ▼ INICIO: CÓDIGO MODIFICADO ▼ // Se crea una variable para el resultado final, que será más clara. let resultadoHtml; if (saldoTransaccion >= 0) { // El período está pagado. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #2e7d32;"> <td style="padding:10px 0; color:#2e7d32; font-size:1.1em;">Estado del Período:</td> <td style="padding:10px 0; text-align:right; color:#2e7d32; font-size:1.1em;">PAGADO</td> </tr> `; // Solo se muestra el saldo a favor si es mayor que cero. if (saldoTransaccion > 0) { resultadoHtml += ` <tr> <td style="padding:5px 0;">Saldo a favor generado en esta transacción:</td> <td style="padding:5px 0; text-align:right; font-weight:bold;">$${saldoTransaccion.toLocaleString('es-CL')}</td> </tr> `; } } else { // El período queda con deuda. resultadoHtml = ` <tr style="font-weight:bold; border-top:2px solid #cccccc;"> <td style="padding:10px 0; color:#d32f2f;">Saldo pendiente del Período:</td> <td style="padding:10px 0; text-align:right; color:#d32f2f;">$${Math.abs(saldoTransaccion).toLocaleString('es-CL')}</td> </tr> `; } // ▲ FIN: CÓDIGO MODIFICADO ▲ return ` <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante de Pago</title></head> <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;"> <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;margin:20px auto;border:1px solid #dddddd;"> <tr><td align="center" bgcolor="#2a7ca3" style="padding:20px;color:#ffffff;"><h2 style="margin:0;">Comprobante de Pago</h2><p style="margin:5px 0 0;">Condominio Los Molles</p></td></tr> <tr><td style="padding:25px 20px;"> <p>Estimado(a) <strong>${nombreResidente}</strong>,</p> <p>Confirmamos la recepción de su pago para el período <strong>${periodoFormateado}</strong>. A continuación el detalle:</p> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle Deuda del Período</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:5px 0;">Gasto Común Ordinario:</td><td style="padding:5px 0;text-align:right;">$${valorGC.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Intereses por mora:</td><td style="padding:5px 0;text-align:right;">$${interes.toLocaleString('es-CL')}</td></tr> <tr><td style="padding:5px 0;">Multas del período:</td><td style="padding:5px 0;text-align:right;">$${multa.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;border-top:1px solid #dddddd;"><td style="padding:8px 0;">Deuda Total del Período:</td><td style="padding:8px 0;text-align:right;">$${deudaDelPeriodo.toLocaleString('es-CL')}</td></tr> </table> <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle de su Pago</h4> <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;"> <tr><td style="padding:8px 0;">Monto Pagado (transferencia/efectivo):</td><td style="padding:8px 0;text-align:right;">$${montoPagado.toLocaleString('es-CL')}</td></tr> ${abonoConvenio > 0 ? `<tr><td style="padding:8px 0;">Abono a Convenio de Deuda:</td><td style="padding:8px 0;text-align:right;">$${abonoConvenio.toLocaleString('es-CL')}</td></tr>` : ''} <tr><td style="padding:8px 0;">Saldo a Favor Utilizado:</td><td style="padding:8px 0;text-align:right;">$${saldoFavorUsado.toLocaleString('es-CL')}</td></tr> <tr style="font-weight:bold;"><td style="padding:8px 0;border-top:1px solid #eeeeee;">Total Abonado al Período (G.C.):</td><td style="padding:8px 0;text-align:right;border-top:1px solid #eeeeee;">$${montoTotalAbonadoGC.toLocaleString('es-CL')}</td></tr> ${resultadoHtml} </table> <hr style="border:0;border-top:1px solid #eeeeee;margin-top:20px;"> <p>Gracias por su compromiso.</p><p style="margin-top:20px;">Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p> </td></tr> <tr><td bgcolor="#f4f4f4" style="text-align:center;padding:15px;font-size:12px;color:#777777;">Este es un correo electrónico generado automáticamente.</td></tr> </table> </body></html>`;
}

    async function guardarConvenio(nParcela, datosConvenio) {
      mostrarSpinner();
      try {
        await gapi.client.request({
          'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
          'method': 'POST',
          'body': {
            'function': 'guardarConvenio_GS',
            'parameters': [nParcela, datosConvenio]
          }
        });
        // Recargar los datos para reflejar los cambios
        await cargarGastosComunes();
        // Forzar el filtro para ver la parcela actualizada
        document.getElementById('filtroParcela').value = nParcela;
        filtrarYRenderizar();
        mostrarMensaje('Convenio guardado y deudas anteriores congeladas con éxito.', 'success');
      } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        mostrarMensaje(`Error al guardar el convenio: ${errorMessage}`, 'error');
      } finally {
        ocultarSpinner();
      }
    }

    async function enviarAcuerdoConvenio(residente, datosConvenio) {
        const emailResidente = residente[5];
        if (!emailResidente || !emailResidente.includes('@')) {
            mostrarMensaje('El residente no tiene un correo electrónico válido registrado.', 'error');
            return;
        }
        const confirmacion = confirm(`¿Está seguro que desea enviar el correo de acuerdo de convenio de pago a ${residente[1]} (${emailResidente})?`);
        if (!confirmacion) return;
        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'enviarCorreoConvenio_GS',
                    'parameters': [residente, datosConvenio]
                }
            });
            mostrarMensaje('Correo de acuerdo de convenio enviado exitosamente.', 'success');
        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al enviar el correo de convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }

    async function formalizarConvenio(nParcela, nombreResidente) {
        const instruccion = `Para formalizar el convenio de la parcela ${nParcela} (${nombreResidente}), por favor, pegue aquí el enlace permanente del correo de aceptación del residente.\n\nPara obtener el enlace en Gmail:\n1. Abra el correo de aceptación.\n2. Haga clic en los tres puntos (Más opciones).\n3. Seleccione "Imprimir".\n4. En la ventana de impresión, copie la URL de la barra de direcciones del navegador.`;
        const urlConvenio = prompt(instruccion, "");

        if (urlConvenio === null) return; // El usuario canceló
        if (urlConvenio.trim() === "" || !urlConvenio.startsWith("http")) {
            alert("El enlace proporcionado no es válido. Por favor, inténtelo de nuevo.");
            return;
        }

        mostrarSpinner();
        try {
            await gapi.client.request({
                'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
                'method': 'POST',
                'body': {
                    'function': 'formalizarConvenio_GS',
                    'parameters': [nParcela, urlConvenio]
                }
            });
            
            pagosGC_obj.forEach(pago => {
                if (String(pago.N_Parcela) === String(nParcela) && pago.Estado === 'Moroso') {
                    pago.Estado = 'En Convenio';
                }
            });

            filtrarYRenderizar();
            mostrarMensaje(`Convenio formalizado para la parcela ${nParcela}. Las deudas anteriores han sido marcadas como "En Convenio".`, 'success');

        } catch (err) {
            const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
            mostrarMensaje(`Error al formalizar el convenio: ${errorMessage}`, 'error');
        } finally {
            ocultarSpinner();
        }
    }
    
    // =======================================================
    // RENDERIZADO DEL HTML PRINCIPAL
    // =======================================================

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <style>
            .estado-pagado { background-color: #198754; color: white; } 
            .estado-moroso { background-color: #dc3545; color: white; } 
            .estado-abono { background-color: #ffc107; color: #333; } 
            .estado-en-convenio { background-color: #0dcaf0; color: #000; }
            .fila-clicable:hover { background-color: #e9f1fb; cursor: pointer; } 
            #detalle-pago-grid { display: grid; grid-template-columns: auto 1fr; gap: 10px 20px; align-items: center;} 
            #detalle-pago-grid b { grid-column: 1; text-align: right; } 
            #detalle-pago-grid span { grid-column: 2; text-align: left; word-break: break-all; } 
            .suggestion-item { padding: 8px 12px; cursor: pointer; } 
            .suggestion-item:hover { background-color: #e9f1fb; } 
            #table-pagos { table-layout: fixed; width: 100%; border-collapse: collapse; } 
            #table-pagos th { position: relative; } 
            .resizer { position: absolute; top: 0; right: -2px; width: 5px; cursor: col-resize; user-select: none; height: 100%; z-index: 1;} 
            .resizer:hover { border-right: 2px solid #007bff; } 
            .comprobante-enviado { color: green; font-size: 1.2rem; font-weight: bold; text-align: center; } 
            #convenio-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; } 
            #convenio-summary-grid > div { background-color: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; } 
            #convenio-summary-grid > div > span { display: block; font-size: 1.4em; font-weight: bold; } 
            .saldo-info { padding: 10px; border-radius: 5px; margin-top: 5px; font-weight: bold; text-align: center; } 
            .saldo-convenio { background-color: #fff8e1; color: #f57f17; } 
            .saldo-favor { background-color: #e8f5e9; color: #2e7d32; }
        </style>
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;"><h2>Gastos Comunes</h2></div>
        <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: stretch;">
            <section class="widget" style="flex: 1; min-width: 350px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="margin-top:0;">Filtros de Búsqueda</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroParcela"><b>N° Parcela:</b></label>
                            <input list="lista-parcelas" id="filtroParcela" placeholder="1-26..." style="width:100%;">
                            <datalist id="lista-parcelas">${Array.from({ length: 26 }, (_, i) => `<option value="${i + 1}"></option>`).join('')}</datalist>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label for="filtroAnio"><b>Año:</b></label>
                            <input type="number" id="filtroAnio" value="${new Date().getFullYear()}" style="width:100%;">
                        </div>
                    </div>
                </div>
                <div style="margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
                    <button id="btnAbrirModalGasto" class="btn">Agregar Gasto Común</button>
                    <button id="btnAbrirModalComprobante" class="btn secondary">Enviar Comprobante</button>
                </div>
            </section>
            <section class="widget" style="flex: 2; min-width: 450px;"><h4 style="margin-top:0;">Configuración de TIMC</h4><div style="display: flex; align-items: flex-end; gap: 16px; margin-bottom: 20px;"><div style="min-width: 120px;"><label for="inputTMC"><b>TIMC (%)</b></label><input type="number" id="inputTMC" step="0.1" placeholder="Ej: 25"></div><div><label for="selectMesTMC"><b>Mes</b></label><select id="selectMesTMC" style="padding: 11px 10px;">${MESES.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select></div><button id="btnGuardarTMC" class="btn">Guardar en Sheet</button></div><div id="timc-display"><h5 style="margin-top:0; margin-bottom: 10px;">TIMC Guardado para el año seleccionado:</h5><div id="timc-list-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; background: #e9f1fb; padding: 12px; border-radius: 8px;"></div></div></section>
        </div>
        <section id="widget-convenio" class="widget" style="display:none; margin-top: 2rem;">
            <h3 style="margin-top:0;">Estado de Convenio de Pago</h3>
            <div id="convenio-summary-grid"></div>
            <h4 style="margin-top: 1.5rem;">Historial de Abonos (Año Seleccionado)</h4>
            <div class="table-container"><table class="table"><thead id="thead-abonos"></thead><tbody id="tbody-abonos"></tbody></table></div>
        </section>
        <section id="detalle-gastos" style="margin-top: 2rem;"><h3>Detalle de Pagos Registrados</h3><div class="table-container"><table id="table-pagos" class="table"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"></tbody></table></div></section>
        
        <div id="modalGC" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Agregar Gasto Común</h3>
                <form id="formGastoComun">
                    <div class="form-grid">
                        <div>
                            <label>N° Parcela</label>
                            <input type="number" name="N_Parcela" id="inputNParcela" min="1" max="26" required>
                            <div style="position: relative;">
                                <label>Nombre Residente</label>
                                <input type="text" name="Nombre_Residente" id="inputNombreResidente" autocomplete="off" required>
                                <div id="nombre-suggestions" style="display: none; position: absolute; background-color: white; border: 1px solid #ccc; max-height: 150px; overflow-y: auto; width: 100%; z-index: 10;"></div>
                            </div>
                            <label>Valor Gasto Común</label>
                            <input type="text" name="Valor_Gasto_Comun" id="inputValorGastoComun" readonly style="background:#eee;">
                            <div id="saldo-convenio-info" class="saldo-info saldo-convenio" style="display:none;"></div>
                            <div id="saldo-favor-info" class="saldo-info saldo-favor" style="display:none;"></div>
                            <div style="display:flex; gap: 15px;">
                                <div style="flex: 1;"><label>Mes que Paga (Período)</label><select name="Periodo" required>${MESES.map((m, i) => `<option value="${i}">${m}</option>`).join('')}</select></div>
                                <div style="flex: 1;"><label>Año que Paga</label><input type="number" name="Anio_Periodo" id="inputAnioPeriodo" required></div>
                            </div>
                        </div>
                        <div style="border-left: 1px solid #ddd; padding-left: 20px;">
                            <label>Fecha de Pago</label>
                            <input type="date" name="Fecha_Pago" required>
                            <label>Monto Pagado G.C. (depósito/efectivo)</label>
                            <input type="number" name="Monto_Pagado" min="0" step="1" required placeholder="CLP" value="0">
                            <label>Usar Saldo a Favor</label>
                            <input type="number" name="Saldo_Favor_Usado" min="0" step="1" placeholder="CLP" value="0">
                            <label>Abono a Convenio (CLP)</label>
                            <input type="number" name="Abono_Convenio" min="0" step="1" placeholder="CLP" value="0">
                            <label>Método de Pago</label>
                            <select name="Metodo_Pago" required><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select>
                        </div>
                    </div>
                    <div style="width: 100%; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                        <label>Descripción / Nota del Pago (Opcional)</label>
                        <textarea name="Descripcion_Pago" rows="2" placeholder="Ej: Pago parcial, solicitud de uso de saldo a favor, etc."></textarea>
                        <label style="margin-top:15px;">Adjuntar Comprobante (Opcional)</label>
                        <input type="file" name="Comprobante" accept=".pdf,.jpg,.jpeg,.png">
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
                        <button class="btn" type="submit">Guardar Gasto</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div id="modalComprobante" class="modal" style="display:none;">
            <div class="modal-content large">
                <h3>Enviar Comprobante por Correo</h3>
                <form id="formEnviarComprobante" style="display:flex; flex-direction:column; gap:15px;"><div style="display:flex; gap: 15px; flex-wrap: wrap;"><div style="flex: 1; min-width: 120px;"><label><b>N° Parcela</b></label><input type="number" id="inputNParcelaComprobante" min="1" max="26" required style="width:100%;"></div><div style="flex: 2; min-width: 200px;"><label><b>Residente(s)</b></label><input type="text" id="inputNombreResidenteComprobante" readonly style="width:100%; background:#eee;"></div></div><div id="periodo-selector-container" style="display: none;"><label><b>Seleccione el Comprobante</b></label><select id="selectPeriodoComprobante" style="width:100%; padding: 11px 10px;"></select></div><div><label><b>Email(s) Destinatario</b></label><input type="email" id="inputEmailComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Asunto</b></label><input type="text" id="inputAsuntoComprobante" readonly style="width:100%; background:#eee;"></div><div><label><b>Previsualización del Correo</b></label><div id="divCuerpoComprobante" style="width:100%; height: 250px; background:#f8f9fa; border: 1px solid #ccc; border-radius: 4px; padding: 10px; overflow-y: auto;"><span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span></div></div><div style="text-align: right; margin-top: 10px;"><button class="btn secondary" type="button" id="btnCerrarModalComprobante">Cancelar</button><button class="btn" type="submit">Enviar Correo</button></div></form>
            </div>
        </div>
        <div id="modalDetallePago" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin-top:0;">Detalle Completo del Registro</h3>
                <div id="contenidoDetallePago" style="margin-bottom: 20px;"></div>
                <div style="text-align: right;"><button id="btnCerrarModalDetalle" class="btn secondary">Cerrar</button></div>
            </div>
        </div>
        
        <div id="modalConvenio" class="modal" style="display:none;">
            <div class="modal-content">
                <h3 style="margin...
