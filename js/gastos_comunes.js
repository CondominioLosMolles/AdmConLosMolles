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
                <h3 style="margin-top:0;">Administrar Convenio de Pago</h3>
                <form id="formConvenio">
                    <input type="hidden" id="convenioNParcela">
                    <div>
                        <label>Deuda Total a convenir (CLP)</label>
                        <input type="number" id="convenioDeudaTotal" required>
                    </div>
                    <div class="form-grid" style="margin-top:15px;">
                        <div>
                            <label>Nº de Cuotas</label>
                            <input type="number" id="convenioCuotas" min="1" required>
                        </div>
                        <div>
                            <label>Valor de cada Cuota (CLP)</label>
                            <input type="number" id="convenioValorCuota" readonly style="background:#eee;">
                        </div>
                    </div>
                    <div style="margin-top:15px;">
                        <label>Fecha de Inicio del Convenio</label>
                        <input type="date" id="convenioFechaInicio" required>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModalConvenio">Cancelar</button>
                        <button class="btn" type="submit">Guardar Convenio</button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- MODAL PARA ABONAR A DEUDAS EXISTENTES -->
        <div id="modalAbonar" class="modal" style="display:none;">
            <div class="modal-content">
                <h3>Abonar a Deuda Existente</h3>
                <form id="formAbonar">
                    <input type="hidden" id="abonarIdPago">
                    <div>
                        <label>Período</label>
                        <input type="text" id="abonarPeriodo" readonly>
                    </div>
                    <div>
                        <label>Deuda Pendiente</label>
                        <input type="text" id="abonarDeudaPendiente" readonly>
                    </div>
                    <div>
                        <label>Monto a Abonar (CLP)</label>
                        <input type="number" id="abonarMonto" min="0" step="1" required>
                    </div>
                    <div>
                        <label>Fecha de Pago</label>
                        <input type="date" id="abonarFechaPago" required>
                    </div>
                    <div>
                        <label>Método de Pago</label>
                        <select id="abonarMetodoPago" required>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo</option>
                        </select>
                    </div>
                    <div>
                        <label>Descripción (Opcional)</label>
                        <textarea id="abonarDescripcion" rows="2" placeholder="Ej: Abono a intereses y multas"></textarea>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button class="btn secondary" type="button" id="btnCerrarModalAbonar">Cancelar</button>
                        <button class="btn" type="submit">Registrar Abono</button>
                    </div>
                </form>
            </div>
        </div>
        `;

    // =======================================================
    // DEFINICIÓN DE LÓGICA Y RENDERIZADO DE TABLAS
    // =======================================================
    
    const tbodyGastos = document.getElementById('tbody-gastos');
    const theadGastos = document.getElementById('thead-gastos');

    function aplicarAnchosGuardados(table) {
        const savedWidthsJSON = localStorage.getItem('tablaPagosColumnWidths');
        if (savedWidthsJSON) {
            try {
                const savedWidths = JSON.parse(savedWidthsJSON);
                const headers = table.querySelectorAll('th');
                headers.forEach((header, index) => {
                    if (savedWidths[index]) {
                        header.style.width = savedWidths[index];
                    }
                });
            } catch (e) {
                console.error("Error al parsear anchos guardados:", e);
                localStorage.removeItem('tablaPagosColumnWidths');
            }
        }
    }

    function hacerColumnasRedimensionables(table) {
        const headers = Array.from(table.querySelectorAll('th'));
        headers.forEach(header => {
            const resizer = document.createElement('div');
            resizer.className = 'resizer';
            header.appendChild(resizer);
            
            const onMouseDown = (e) => {
                e.preventDefault();
                const startX = e.pageX;
                const startWidth = header.offsetWidth;
                const onMouseMove = (e) => {
                    const newWidth = startWidth + (e.pageX - startX);
                    if (newWidth > 50) {
                        header.style.width = `${newWidth}px`;
                    }
                };
                const onMouseUp = () => {
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    const currentHeaders = Array.from(table.querySelectorAll('th'));
                    const widths = currentHeaders.map(h => h.style.width || '');
                    localStorage.setItem('tablaPagosColumnWidths', JSON.stringify(widths));
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            };
            resizer.addEventListener('mousedown', onMouseDown);
        });
    }

    function renderizarTablaGeneral(datos) {
        document.getElementById('widget-convenio').style.display = 'none';
        document.querySelector('#detalle-gastos h3').textContent = 'Detalle de Pagos Registrados';
        theadGastos.innerHTML = `<tr><th>Residente</th><th>Parcela</th><th>Período</th><th>Monto Pagado G.C.</th><th>Abono Convenio</th><th>Deuda Pendiente G.C.</th><th>Fecha Pago</th><th>Estado</th><th>Comprobante</th><th>Acciones</th></tr>`;
        tbodyGastos.innerHTML = '';
        if (!datos || datos.length === 0) { tbodyGastos.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:20px;">No hay registros para el año seleccionado.</td></tr>`; return; }
        datos.sort((a,b) => (b.Fecha_Pago ? new Date(b.Fecha_Pago.replace(/-/g,'/')) : 0) - (a.Fecha_Pago ? new Date(a.Fecha_Pago.replace(/-/g,'/')) : 0));
        datos.forEach(pago => {
            const estadoClass = (pago.Estado || 'pendiente').toLowerCase().replace(/ /g, '-');
            const tr = document.createElement('tr');
            tr.dataset.idPago = pago.ID_Pago;
            tr.classList.add('fila-clicable');
            const abonoConvenio = parseFloat(pago.Abono_Convenio || 0);
            const comprobanteEnviado = pago.Comprobante_Enviado === 'SI' ? '<span class="comprobante-enviado">✓</span>' : '';
            
            // Botón para abonar a deudas existentes
            let abonarButton = '';
            if (pago.Estado !== 'Pagado' && parseFloat(pago.Deuda_Total || 0) > 0) {
                abonarButton = `<button class="btn small abonar-btn" data-id="${pago.ID_Pago}">Abonar</button>`;
            }

            tr.innerHTML = `
                <td>${pago.Nombre_Residente || 'N/A'}</td>
                <td>${pago.N_Parcela}</td>
                <td>${formatearPeriodo(pago.Periodo) || 'N/A'}</td>
                <td>$${parseFloat(pago.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
                <td>$${abonoConvenio.toLocaleString('es-CL')}</td>
                <td style="font-weight:bold; color: red;">$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}</td>
                <td>${pago.Fecha_Pago ? new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'}) : '---'}</td>
                <td><span class="estado-tag estado-${estadoClass}">${pago.Estado || 'Pendiente'}</span></td>
                <td>${comprobanteEnviado}</td>
                <td>${abonarButton}</td>`;
            tbodyGastos.appendChild(tr);
        });
        const tabla = document.getElementById('table-pagos');
        aplicarAnchosGuardados(tabla);
        hacerColumnasRedimensionables(tabla);
        configurarAbonos(); // Configurar eventos para los botones de abonar
    }
    
    // ▼ INICIO: FUNCIÓN COMPLETAMENTE ACTUALIZADA ▼
    function renderizarTablaResidente(parcela, anio) {
        const residente = residentes.find(r => String(r[3]) === String(parcela));
        if (!residente) { 
            document.getElementById('widget-convenio').style.display = 'none';
            tbodyGastos.innerHTML = `<tr><td colspan="12">No se encontró residente.</td></tr>`; 
            return; 
        }

        const widgetConvenio = document.getElementById('widget-convenio');
        
        // 1. La verificación ahora es más robusta: ignora mayúsculas/minúsculas y espacios.
        const convenioActivo = (residente[15] || '').trim().toUpperCase() === 'SI';

        if (convenioActivo) {
            widgetConvenio.style.display = 'block';
            const deudaConvenioInicial = parseFloat(residente[19] || 0); // Columna T
            const totalAbonado = pagosGC_obj
                .filter(p => String(p.N_Parcela) === String(parcela))
                .reduce((sum, pago) => sum + parseFloat(pago.Abono_Convenio || 0), 0);
            const saldoActualConvenio = deudaConvenioInicial - totalAbonado;

            document.getElementById('convenio-summary-grid').innerHTML = `
                <div>Deuda Original Convenio<span style="color: #dc3545;">$${deudaConvenioInicial.toLocaleString('es-CL')}</span></div>
                <div>Total Abonado<span style="color: #198754;">$${totalAbonado.toLocaleString('es-CL')}</span></div>
                <div>Saldo Convenio<span style="color: #ffc107;">$${saldoActualConvenio.toLocaleString('es-CL')}</span></div>
                <div style="grid-column: 1 / -1; margin-top: 10px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button id="btnAdministrarConvenio" class="btn small">Administrar Convenio</button>
                    <button id="btnEnviarCorreoConvenio" class="btn secondary small">Enviar Acuerdo por Correo</button>
                    <button id="btnFormalizarConvenio" class="btn small">Formalizar con Respaldo</button>
                </div>
            `;
            
            document.getElementById('btnAdministrarConvenio').addEventListener('click', () => abrirModalConvenio(parcela, residente));
            
            document.getElementById('btnEnviarCorreoConvenio').addEventListener('click', () => {
                const datosConvenio = {
                    deudaInicial: parseFloat(residente[19] || 0),
                    cuotas: parseInt(residente[16] || 0),
                    valorCuota: parseFloat(residente[17] || 0),
                    fechaInicio: residente[18] || ''
                };
                enviarAcuerdoConvenio(residente, datosConvenio);
            });

            document.getElementById('btnFormalizarConvenio').addEventListener('click', () => formalizarConvenio(parcela, residente[1]));
            
            const abonosDelAnio = pagosGC_obj.filter(p => String(p.N_Parcela) === String(parcela) && p.anio == anio && parseFloat(p.Abono_Convenio || 0) > 0);
            document.getElementById('thead-abonos').innerHTML = `<tr><th>Fecha de Pago</th><th>Monto Abonado</th><th>Comprobante</th></tr>`;
            const tbodyAbonos = document.getElementById('tbody-abonos');
            tbodyAbonos.innerHTML = '';
            if(abonosDelAnio.length > 0) {
                abonosDelAnio.forEach(abono => {
                    const linkComprobante = abono.ID_Comprobante_Drive ? `<a href="${abono.ID_Comprobante_Drive}" target="_blank" class="btn small">Ver</a>` : 'N/A';
                    tbodyAbonos.innerHTML += `<tr><td>${new Date(abono.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'})}</td><td>$${parseFloat(abono.Abono_Convenio).toLocaleString('es-CL')}</td><td>${linkComprobante}</td></tr>`;
                });
            } else {
                tbodyAbonos.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay abonos a convenio registrados para este año.</td></tr>`;
            }
        } else {
            // Se oculta el widget si no hay convenio activo
            widgetConvenio.style.display = 'none';
        }
        
        // 2. Se usa 'convenioActivo' (la variable corregida) y se cambia .textContent por .innerHTML para que el ícono se muestre correctamente.
        const nombreResidenteConConvenio = `${residente[1]} ${convenioActivo ? '<span title="Este residente tiene un convenio de pago activo" style="cursor:help;">📜</span>' : ''}`;
        document.querySelector('#detalle-gastos h3').innerHTML = `Detalle Anual de Gastos Comunes para ${nombreResidenteConConvenio} (Parcela ${parcela})`;
        
        theadGastos.innerHTML = `<tr><th>Período</th><th>Fecha Vencimiento</th><th>Monto Pagado</th><th>Saldo Transacción</th><th>Interés</th><th>Multa</th><th>Deuda Pendiente</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th><th>Comprobante</th><th>Acciones</th></tr>`;
        tbodyGastos.innerHTML = '';
        
        MESES.forEach((mes, index) => {
            const pagoExistente = pagosGC_obj.find(p => String(p.N_Parcela) === String(parcela) && p.Periodo && formatearPeriodo(p.Periodo).toLowerCase().startsWith(mes.toLowerCase()) && p.anio == anio);
            let interes = 0, multa = 0, saldo = 0, deudaPendiente = 0;
            let estado = 'Pendiente', montoPagado = 0, fechaPago = '---', metodoPago = '---', comprobanteEnviado = '';
            const fechaVencimiento = new Date(anio, index, 10);
            if (pagoExistente) {
                estado = pagoExistente.Estado;
                montoPagado = parseFloat(pagoExistente.Monto_Pagado || 0);
                saldo = parseFloat(pagoExistente.Saldo_Pendiente_o_a_favor || 0);
                deudaPendiente = parseFloat(pagoExistente.Deuda_Total || 0);
                interes = parseFloat(pagoExistente.Interes || 0);
                multa = parseFloat(pagoExistente['Multa_1/4'] || 0);
                fechaPago = pagoExistente.Fecha_Pago ? new Date(pagoExistente.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone: 'UTC'}) : '---';
                metodoPago = pagoExistente.Metodo_Pago || '---';
                comprobanteEnviado = pagoExistente.Comprobante_Enviado === 'SI' ? '<span class="comprobante-enviado">✓</span>' : '';
            }
            
            // Botón para abonar a deudas existentes
            let abonarButton = '';
            if (estado !== 'Pagado' && deudaPendiente > 0 && pagoExistente) {
                abonarButton = `<button class="btn small abonar-btn" data-id="${pagoExistente.ID_Pago}">Abonar</button>`;
            }
            
            const tr = document.createElement('tr');
            if (pagoExistente) {
                tr.dataset.idPago = pagoExistente.ID_Pago;
                tr.classList.add('fila-clicable');
            }
            const estadoClass = (estado || 'pendiente').toLowerCase().replace(/ /g, '-');
            tr.innerHTML = `
                <td><b>${mes} ${anio}</b></td>
                <td>${fechaVencimiento.toLocaleDateString('es-CL', {timeZone: 'UTC'})}</td>
                <td>$${montoPagado.toLocaleString('es-CL')}</td>
                <td style="color:${saldo < 0 ? 'red' : 'green'}; font-weight:bold;">$${saldo.toLocaleString('es-CL')}</td>
                <td>$${interes.toLocaleString('es-CL', {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                <td>$${multa.toLocaleString('es-CL')}</td>
                <td style="font-weight:bold; color: red;">$${deudaPendiente.toLocaleString('es-CL')}</td>
                <td>${fechaPago}</td>
                <td>${metodoPago}</td>
                <td><span class="estado-tag estado-${estadoClass}">${estado || 'Pendiente'}</span></td>
                <td>${comprobanteEnviado}</td>
                <td>${abonarButton}</td>`;
            tbodyGastos.appendChild(tr);
        });
        configurarAbonos(); // Configurar eventos para los botones de abonar
    }
    // ▲ FIN: FUNCIÓN COMPLETAMENTE ACTUALIZADA ▲

    function abrirModalConvenio(nParcela, residente) {
        const modal = document.getElementById('modalConvenio');
        document.getElementById('formConvenio').reset();
        document.getElementById('convenioNParcela').value = nParcela;
        
        document.getElementById('convenioDeudaTotal').value = residente[19] || 0; // Columna T
        document.getElementById('convenioCuotas').value = residente[16] || 1; // Columna Q
        const fecha = residente[18]; // Columna S
        document.getElementById('convenioFechaInicio').value = fecha ? new Date(fecha).toISOString().split('T')[0] : '';
        
        calcularValorCuota(); 
        modal.style.display = 'flex';
    }

    function calcularValorCuota() {
        const deuda = parseFloat(document.getElementById('convenioDeudaTotal').value) || 0;
        const cuotas = parseInt(document.getElementById('convenioCuotas').value) || 1;
        document.getElementById('convenioValorCuota').value = (deuda > 0 && cuotas > 0) ? Math.round(deuda / cuotas) : 0;
    }

    function abrirModalDetalle(idPago) {
        const pago = pagosGC_obj.find(p => p.ID_Pago == idPago);
        if (!pago) {
            mostrarMensaje('No se encontró el registro del pago.', 'error');
            return;
        }
        const modal = document.getElementById('modalDetallePago');
        const contenido = document.getElementById('contenidoDetallePago');
        const valorGC = parseFloat(pago.Valor_Gasto_Comun || 0);
        const interes = parseFloat(pago.Interes || 0);
        const multa = parseFloat(pago['Multa_1/4'] || 0);
        const deudaDelPeriodo = valorGC + interes + multa;
        const montoPagadoGC = parseFloat(pago.Monto_Pagado || 0);
        const saldoFavorUsado = parseFloat(pago.Saldo_Favor_Usado || 0);
        const saldoTransaccion = parseFloat(pago.Saldo_Pendiente_o_a_favor || 0);
        const saldoFinalTexto = saldoTransaccion >= 0 ? `A favor: $${saldoTransaccion.toLocaleString('es-CL')}` : `Pendiente: $${Math.abs(saldoTransaccion).toLocaleString('es-CL')}`;
        const abonoConvenio = parseFloat(pago.Abono_Convenio || 0);
        const colorAbono = abonoConvenio > 0 ? 'darkblue' : '#555';
        const descripcionPago = pago.Descripcion_Pago || 'Sin descripción.';
        let filaComprobante = pago.ID_Comprobante_Drive 
            ? `<b>Comprobante:</b> <span><a href="${pago.ID_Comprobante_Drive}" target="_blank" class="btn small" style="display: inline-block; text-decoration: none;">Ver Documento</a></span>`
            : '<b>Comprobante:</b> <span>No adjunto</span>';

        contenido.innerHTML = `
            <div id="detalle-pago-grid">
                <b>Residente:</b>        <span>${pago.Nombre_Residente}</span>
                <b>N° Parcela:</b>       <span>${pago.N_Parcela}</span>
                <b>Período pagado:</b>   <span>${formatearPeriodo(pago.Periodo)}</span>
                <hr style="grid-column: 1 / -1;">
                <b style="color:#2a7ca3;">Deuda del Período G.C.:</b> <span style="font-weight:bold; color:#2a7ca3;">$${deudaDelPeriodo.toLocaleString('es-CL')}</span>
                <hr style="grid-column: 1 / -1;">
                <b>Monto Pagado (transf/efectivo):</b> <span style="font-weight:bold; color:green;">$${montoPagadoGC.toLocaleString('es-CL')}</span>
                <b>Saldo a Favor Utilizado:</b> <span style="font-weight:bold; color:purple;">$${saldoFavorUsado.toLocaleString('es-CL')}</span>
                <b>Abono a Convenio:</b> <span style="font-weight:bold; color:${colorAbono};">$${abonoConvenio.toLocaleString('es-CL')}</span>
                <b>Fecha de Pago:</b>      <span>${new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', {timeZone:'UTC'})}</span>
                <b>Método de Pago:</b>     <span>${pago.Metodo_Pago}</span>
                <b style="font-size:1.1em;">Resultado Saldo G.C.:</b> <span style="font-weight:bold; font-size:1.1em; color:${saldoTransaccion < 0 ? 'red' : 'green'};">${saldoFinalTexto}</span>
                <hr style="grid-column: 1 / -1;">
                <b>Estado del pago:</b>    <span>${pago.Estado}</span>
                ${filaComprobante}
                <b style="grid-column:1 / -1;text-align:left;margin-bottom:-5px;margin-top:10px;">Descripción:</b>
                <div style="grid-column:1 / -1;white-space:pre-wrap;word-wrap:break-word;background:#f8f9fa;padding:8px 12px;border-radius:4px;border:1px solid #eee;min-height:40px;">${descripcionPago}</div>
            </div>`;
        modal.style.display = 'flex';
    }

    function filtrarYRenderizar() {
        const parcela = document.getElementById('filtroParcela').value;
        const anio = document.getElementById('filtroAnio').value;
        if (parcela && anio) {
            renderizarTablaResidente(parcela, anio);
        } else {
            document.getElementById('widget-convenio').style.display = 'none';
            renderizarTablaGeneral(pagosGC_obj.filter(p => p.anio == anio));
        }
    }

    function actualizarVistaTIMC() {
        const anio = document.getElementById('filtroAnio').value || new Date().getFullYear();
        const timcList = document.getElementById('timc-list-horizontal');
        timcList.innerHTML = '';
        const anioData = timcData[anio] || {};
        MESES.forEach((mes, i) => {
            const mesNumero = i + 1;
            const timcValor = anioData[mesNumero] ? `<b>${anioData[mesNumero]}%</b>` : 'N/A';
            timcList.innerHTML += `<div style="flex-basis: 15%;">${mes}: ${timcValor}</div>`;
        });
    }

    // =======================================================
    // FUNCIONES PARA MANEJAR ABONOS A DEUDAS EXISTENTES
    // =======================================================

    function configurarAbonos() {
        document.querySelectorAll('.abonar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idPago = e.target.dataset.id;
                const pago = pagosGC_obj.find(p => p.ID_Pago === idPago);
                
                if (pago) {
                    document.getElementById('abonarIdPago').value = idPago;
                    document.getElementById('abonarPeriodo').value = formatearPeriodo(pago.Periodo);
                    document.getElementById('abonarDeudaPendiente').value = `$${parseFloat(pago.Deuda_Total || 0).toLocaleString('es-CL')}`;
                    document.getElementById('abonarMonto').value = '';
                    document.getElementById('abonarFechaPago').value = new Date().toISOString().split('T')[0];
                    document.getElementById('abonarMetodoPago').value = 'Transferencia';
                    document.getElementById('abonarDescripcion').value = '';
                    
                    document.getElementById('modalAbonar').style.display = 'flex';
                }
            });
        });
        
        document.getElementById('btnCerrarModalAbonar').addEventListener('click', () => {
            document.getElementById('modalAbonar').style.display = 'none';
        });
        
        document.getElementById('formAbonar').addEventListener('submit', async (e) => {
            e.preventDefault();
            await procesarAbono();
        });
    }

    async function procesarAbono() {
        const idPago = document.getElementById('abonarIdPago').value;
        const montoAbonar = parseFloat(document.getElementById('abonarMonto').value);
        const fechaPago = document.getElementById('abonarFechaPago').value;
        const metodoPago = document.getElementById('abonarMetodoPago').value;
        const descripcion = document.getElementById('abonarDescripcion').value;
        
        const pago = pagosGC_obj.find(p => p.ID_Pago === idPago);
        if (!pago) {
            mostrarMensaje('No se encontró el registro de pago.', 'error');
            return;
        }
        
        const montoPagadoActual = parseFloat(pago.Monto_Pagado || 0);
        const nuevoMontoPagado = montoPagadoActual + montoAbonar;
        const deudaPendiente = parseFloat(pago.Deuda_Total || 0);
        const nuevaDeudaPendiente = Math.max(0, deudaPendiente - montoAbonar);
        
        // Determinar el nuevo estado
        let nuevoEstado = pago.Estado;
        if (nuevaDeudaPendiente === 0) {
            nuevoEstado = 'Pagado';
        } else if (nuevoMontoPagado > 0) {
            nuevoEstado = pago.Estado === 'En Convenio' ? 'En Convenio' : 'Abonado';
        }
        
        // Preparar datos para actualizar
        const datosActualizacion = {
            rowNum: pago.rowNum,
            montoPagado: nuevoMontoPagado,
            saldo: nuevoMontoPagado - (parseFloat(pago.Valor_Gasto_Comun || 0) + parseFloat(pago.Interes || 0) + parseFloat(pago['Multa_1/4'] || 0)),
            deudaTotal: nuevaDeudaPendiente,
            fechaPago: fechaPago,
            metodoPago: metodoPago,
            estado: nuevoEstado,
            idComprobante: pago.ID_Comprobante_Drive,
            abonoConvenio: pago.Abono_Convenio,
            descripcionPago: descripcion,
            saldoFavorUsado: pago.Saldo_Favor_Usado
        };
        
        mostrarSpinner();
        try {
            await actualizarPagoGC(datosActualizacion);
            
            // Actualizar el objeto local
            pago.Monto_Pagado = nuevoMontoPagado;
            pago.Deuda_Total = nuevaDeudaPendiente;
            pago.Fecha_Pago = fechaPago;
            pago.Metodo_Pago = metodoPago;
            pago.Estado = nuevoEstado;
            pago.Descripcion_Pago = descripcion;
            
            mostrarMensaje('Abono registrado correctamente.', 'success');
            document.getElementById('modalAbonar').style.display = 'none';
            filtrarYRenderizar();
        } catch (err) {
            mostrarMensaje('Error al registrar el abono: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    }

    // =======================================================
    // ASIGNACIÓN DE EVENTOS (EVENT LISTENERS)
    // =======================================================

    document.getElementById('btnGuardarTMC').addEventListener('click', async () => {
        if (typeof guardarTIMC !== 'function') return mostrarMensaje('Error: La función "guardarTIMC" no se encontró en sheets.js.', 'error');
        const anio = document.getElementById('filtroAnio').value;
        const mes = document.getElementById('selectMesTMC').value;
        const valor = parseFloat(document.getElementById('inputTMC').value);
        if (isNaN(valor) || !mes || !anio) return mostrarMensaje('Debe ingresar TIMC, mes y año.', 'error');
        mostrarSpinner();
        try {
            await guardarTIMC(anio, mes, valor);
            if (!timcData[anio]) timcData[anio] = {};
            timcData[anio][mes] = valor;
            actualizarVistaTIMC();
            if (document.getElementById('filtroParcela').value) filtrarYRenderizar();
            mostrarMensaje(`TIMC guardado en la hoja "Config_TIMC".`, 'success');
        } catch (err) {
            mostrarMensaje('Error al guardar TIMC: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });
    
    const modal = document.getElementById('modalGC');
    document.getElementById('btnAbrirModalGasto').addEventListener('click', () => {
        document.getElementById('formGastoComun').reset();
        document.getElementById('saldo-convenio-info').style.display = 'none';
        document.getElementById('saldo-favor-info').style.display = 'none';
        document.getElementById('inputAnioPeriodo').value = document.getElementById('filtroAnio').value;
        modal.style.display = 'flex';
    });
    document.getElementById('btnCerrarModal').addEventListener('click', () => modal.style.display = 'none');
    
    document.getElementById('inputNParcela').addEventListener('input', (e) => {
        const parcelaBuscada = e.target.value;
        const nombreInput = document.getElementById('inputNombreResidente');
        const valorInput = document.getElementById('inputValorGastoComun');
        const saldoConvenioInfo = document.getElementById('saldo-convenio-info');
        const saldoFavorInfo = document.getElementById('saldo-favor-info');
        nombreInput.value = '';
        valorInput.value = '';
        saldoConvenioInfo.style.display = 'none';
        saldoFavorInfo.style.display = 'none';
        if (!parcelaBuscada) return;
        const res = residentes.find(r => String(r[3]) === parcelaBuscada && r[9] && r[9].trim().toUpperCase() === 'SI');
        if (res) {
            nombreInput.value = res[1];
            valorInput.value = parseFloat(res[8]).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
            const saldoConvenio = res[12] ? parseFloat(res[12]) : 0;
            if (saldoConvenio > 0) {
                saldoConvenioInfo.textContent = `Saldo convenio: $${saldoConvenio.toLocaleString('es-CL')}`;
                saldoConvenioInfo.style.display = 'block';
            }
            const saldoFavor = res[13] ? parseFloat(res[13]) : 0;
            if (saldoFavor > 0) {
                saldoFavorInfo.textContent = `Saldo a favor: $${saldoFavor.toLocaleString('es-CL')}`;
                saldoFavorInfo.style.display = 'block';
            }
        } else {
            nombreInput.value = 'No se encontró contacto principal';
        }
    });

    const nombreInput = document.getElementById('inputNombreResidente');
    const suggestionsContainer = document.getElementById('nombre-suggestions');
    nombreInput.addEventListener('input', () => {
        const searchTerm = nombreInput.value.toLowerCase();
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        if (searchTerm.length < 2) return;
        const matches = residentes.filter(r => r[1] && r[1].toLowerCase().includes(searchTerm) && r[9] && r[9].trim().toUpperCase() === 'SI');
        if (matches.length > 0) {
            matches.forEach(res => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = `${res[1]} (Parcela ${res[3]})`;
                item.addEventListener('click', () => {
                    document.getElementById('inputNParcela').value = res[3];
                    document.getElementById('inputNombreResidente').value = res[1];
                    document.getElementById('inputValorGastoComun').value = parseFloat(res[8]).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
                    const saldoConvenioInfo = document.getElementById('saldo-convenio-info');
                    const saldoFavorInfo = document.getElementById('saldo-favor-info');
                    const saldoConvenio = res[12] ? parseFloat(res[12]) : 0;
                    if (saldoConvenio > 0) {
                        saldoConvenioInfo.textContent = `Saldo convenio: $${saldoConvenio.toLocaleString('es-CL')}`;
                        saldoConvenioInfo.style.display = 'block';
                    } else {
                        saldoConvenioInfo.style.display = 'none';
                    }
                    const saldoFavor = res[13] ? parseFloat(res[13]) : 0;
                    if (saldoFavor > 0) {
                        saldoFavorInfo.textContent = `Saldo a favor: $${saldoFavor.toLocaleString('es-CL')}`;
                        saldoFavorInfo.style.display = 'block';
                    } else {
                        saldoFavorInfo.style.display = 'none';
                    }
                    suggestionsContainer.style.display = 'none';
                });
                suggestionsContainer.appendChild(item);
            });
            suggestionsContainer.style.display = 'block';
        }
    });
    
    document.addEventListener('click', (e) => {
        if (nombreInput && !nombreInput.contains(e.target) && suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    });

    document.getElementById('formGastoComun').addEventListener('submit', async (e) => {
        e.preventDefault();
        mostrarSpinner();
        try {
            const formData = new FormData(e.target);
            const parcela = formData.get('N_Parcela');
            const residenteIdx = residentes.findIndex(r => String(r[3]) === String(parcela) && r[9] && r[9].trim().toUpperCase() === 'SI');
            if (residenteIdx === -1) throw new Error("No se encontró un 'Contacto Principal' para la parcela.");
            const residente = residentes[residenteIdx];
            const residenteRowInSheet = residenteIdx + 2;
            const valorGastoComun = parseFloat(residente[8]);
            const saldoFavorActual = parseFloat(residente[13] || 0);
            const mesPagadoIndex = parseInt(formData.get('Periodo'));
            const anioSeleccionado = parseInt(formData.get('Anio_Periodo'));
            const periodoStr = `${MESES[mesPagadoIndex]} ${anioSeleccionado}`;
            const periodoNormalizado = periodoStr.trim().toLowerCase();
            const pagoExistente = pagosGC_obj.find(p => String(p.N_Parcela) === String(parcela) && p.Periodo && formatearPeriodo(p.Periodo).trim().toLowerCase() === periodoNormalizado);
            const montoPagadoGC = parseFloat(formData.get('Monto_Pagado') || 0);
            const abonoConvenio = parseFloat(formData.get('Abono_Convenio') || 0);
            const saldoFavorUsado = parseFloat(formData.get('Saldo_Favor_Usado') || 0);
            const fechaDePago = formData.get('Fecha_Pago');
            const metodoPago = formData.get('Metodo_Pago');
            const descripcionPago = formData.get('Descripcion_Pago');
            if (saldoFavorUsado > saldoFavorActual) {
                throw new Error(`No se puede usar más saldo a favor ($${saldoFavorUsado.toLocaleString('es-CL')}) del que está disponible ($${saldoFavorActual.toLocaleString('es-CL')}).`);
            }
            const montoEfectivoTotalPagadoGC = montoPagadoGC + saldoFavorUsado;
            let linkComprobante = null;
            const archivo = formData.get('Comprobante');
            if (archivo && archivo.size > 0) {
                const nombreCarpeta = `Parcela ${parcela}`;
                const mesStr = MESES[new Date(fechaDePago.replace(/-/g,'/')).getUTCMonth()];
                const anioStr = new Date(fechaDePago.replace(/-/g,'/')).getUTCFullYear();
                const carpetaId = await buscarOCrearRutaDeComprobantes(nombreCarpeta, mesStr, anioStr);
                const resultadoSubida = await subirComprobante(archivo, carpetaId);
                linkComprobante = resultadoSubida.webViewLink;
            }
            let nuevoSaldoAFavorResidente;
            if (pagoExistente) {
                const deudaDelPeriodo = parseFloat(pagoExistente.Interes || 0) + parseFloat(pagoExistente['Multa_1/4'] || 0) + valorGastoComun;
                const saldoTransaccion = montoEfectivoTotalPagadoGC - deudaDelPeriodo;
                const estadoPago = saldoTransaccion >= 0 ? 'Pagado' : (pagoExistente.Estado === 'En Convenio' ? 'En Convenio' : 'Moroso');
                const deudaPendienteParaSheet = saldoTransaccion < 0 ? -saldoTransaccion : 0;
                const sobrepago = saldoTransaccion > 0 ? saldoTransaccion : 0;
                nuevoSaldoAFavorResidente = saldoFavorActual - saldoFavorUsado + sobrepago;
                const datosParaActualizar = { rowNum: pagoExistente.rowNum, montoPagado: montoPagadoGC, saldo: saldoTransaccion, deudaTotal: deudaPendienteParaSheet, fechaPago: fechaDePago, metodoPago: metodoPago, estado: estadoPago, idComprobante: linkComprobante || pagoExistente.ID_Comprobante_Drive, abonoConvenio: abonoConvenio, descripcionPago: descripcionPago, saldoFavorUsado: saldoFavorUsado };
                await actualizarPagoGC(datosParaActualizar);
                Object.assign(pagoExistente, { 'Monto_Pagado': montoPagadoGC, 'Saldo_Pendiente_o_a_favor': saldoTransaccion, 'Deuda_Total': deudaPendienteParaSheet, 'Fecha_Pago': fechaDePago, 'Metodo_Pago': metodoPago, 'Estado': estadoPago, 'ID_Comprobante_Drive': datosParaActualizar.idComprobante, 'Abono_Convenio': abonoConvenio, 'Descripcion_Pago': descripcionPago, 'Saldo_Favor_Usado': saldoFavorUsado });
                mostrarMensaje('Pago existente actualizado con éxito.', 'success');
            } else {
                const fechaVencimiento = new Date(anioSeleccionado, mesPagadoIndex, 10);
                const fechaDePagoDate = new Date(fechaDePago.replace(/-/g, '/'));
                let deudaDelPeriodo = valorGastoComun, interes = 0, multa = 0, mesesImpagos = 0;
                if (fechaDePagoDate > fechaVencimiento) {
                    let tempVenc = new Date(fechaVencimiento);
                    while(tempVenc < fechaDePagoDate) { mesesImpagos++; tempVenc.setMonth(tempVenc.getMonth() + 1); }
                    if (mesesImpagos > 0) {
                        const timcAnual = (timcData[anioSeleccionado] && timcData[anioSeleccionado][mesPagadoIndex + 1]) ? timcData[anioSeleccionado][mesPagadoIndex + 1] : 0;
                        interes = valorGastoComun * (timcAnual / 100) / 12;
                        multa = (valorGastoComun / 4) * mesesImpagos;
                        deudaDelPeriodo += interes + multa;
                    }
                }
                const saldoTransaccion = montoEfectivoTotalPagadoGC - deudaDelPeriodo;
                const estadoPago = saldoTransaccion >= 0 ? 'Pagado' : 'Moroso';
                const deudaPendienteParaSheet = saldoTransaccion < 0 ? -saldoTransaccion : 0;
                const sobrepago = saldoTransaccion > 0 ? saldoTransaccion : 0;
                nuevoSaldoAFavorResidente = saldoFavorActual - saldoFavorUsado + sobrepago;
                const datosParaSheet = [ null, formData.get('Nombre_Residente'), parcela, valorGastoComun, periodoStr, fechaVencimiento.toISOString().split('T')[0], montoPagadoGC, saldoTransaccion, interes, null, multa, mesesImpagos, deudaPendienteParaSheet, fechaDePago, metodoPago, estadoPago, linkComprobante, abonoConvenio, 'NO', `Gasto Común ${periodoStr}`, descripcionPago, saldoFavorUsado ];
                await agregarPagoGC(datosParaSheet);
                const nuevoPagoObj = {};
                ENCABEZADOS_PAGOS.forEach((encabezado, i) => nuevoPagoObj[encabezado] = datosParaSheet[i]);
                nuevoPagoObj.anio = anioSeleccionado;
                nuevoPagoObj.rowNum = pagosGC_obj.length + 2;
                pagosGC_obj.push(nuevoPagoObj);
                mostrarMensaje('Gasto común nuevo registrado con éxito.', 'success');
            }
            await actualizarSaldoFavorResidente(residenteRowInSheet, nuevoSaldoAFavorResidente);
            residente[13] = nuevoSaldoAFavorResidente.toString();
            if (abonoConvenio > 0) {
                const deudaInicial = parseFloat(residente[11] || 0);
                let saldoPrevio = residente[12] ? parseFloat(residente[12]) : 0;
                if ((!saldoPrevio || saldoPrevio <= 0) && deudaInicial > 0) saldoPrevio = deudaInicial;
                const nuevoSaldo = saldoPrevio - abonoConvenio;
                await actualizarSaldoConvenioEnSheet(residenteRowInSheet, nuevoSaldo);
                residente[12] = nuevoSaldo.toString();
            }
            filtrarYRenderizar();
            modal.style.display = 'none';
            e.target.reset();
        } catch (err) {
            mostrarMensaje('Error al procesar el pago: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });

    const modalComprobante = document.getElementById('modalComprobante');
    const formComprobante = document.getElementById('formEnviarComprobante');
    const inputParcelaComprobante = document.getElementById('inputNParcelaComprobante');

    document.getElementById('btnAbrirModalComprobante').addEventListener('click', () => {
        formComprobante.reset();
        pagoSeleccionadoParaEnviar = null;
        document.getElementById('divCuerpoComprobante').innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela para generar la previsualización.</span>`;
        document.getElementById('periodo-selector-container').style.display = 'none';
        document.getElementById('selectPeriodoComprobante').innerHTML = '';
        modalComprobante.style.display = 'flex';
    });

    document.getElementById('btnCerrarModalComprobante').addEventListener('click', () => {
        modalComprobante.style.display = 'none';
    });
    
    inputParcelaComprobante.addEventListener('input', (e) => {
        const parcela = e.target.value;
        const selectorContainer = document.getElementById('periodo-selector-container');
        const selector = document.getElementById('selectPeriodoComprobante');
        const nombreInput = document.getElementById('inputNombreResidenteComprobante');
        const emailInput = document.getElementById('inputEmailComprobante');
        const asuntoInput = document.getElementById('inputAsuntoComprobante');
        const cuerpoDiv = document.getElementById('divCuerpoComprobante');

        nombreInput.value = '';
        emailInput.value = '';
        asuntoInput.value = '';
        cuerpoDiv.innerHTML = `<span style="color: #6c757d;">Ingrese un N° de Parcela...</span>`;
        selectorContainer.style.display = 'none';
        selector.innerHTML = '';
        pagoSeleccionadoParaEnviar = null;

        if (!parcela) return;
        const allResidentsForParcela = residentes.filter(r => String(r[3]) === String(parcela));
        if (allResidentsForParcela.length === 0) {
            nombreInput.value = 'Residente no encontrado.';
            return;
        }
        const residentNames = allResidentsForParcela.map(r => r[1]).join(' y ');
        const residentEmails = allResidentsForParcela.map(r => r[5]).filter(Boolean).join(', ');
        nombreInput.value = residentNames;
        emailInput.value = residentEmails || 'No registrado';
        const pagosDeLaParcela = pagosGC_obj
            .filter(p => p.N_Parcela == parcela && p.Fecha_Pago)
            .sort((a, b) => new Date(b.Fecha_Pago.replace(/-/g,'/')) - new Date(a.Fecha_Pago.replace(/-/g,'/')));
        if (pagosDeLaParcela.length === 0) {
            cuerpoDiv.innerHTML = `<span style="color: #dc3545;">No se encontraron pagos registrados para esta parcela.</span>`;
            return;
        }
        selector.innerHTML = '<option value="">-- Seleccione un comprobante --</option>';
        pagosDeLaParcela.forEach(pago => {
            const fechaPagoFmt = new Date(pago.Fecha_Pago.replace(/-/g, '/')).toLocaleDateString('es-CL', { timeZone: 'UTC' });
            const option = document.createElement('option');
            option.value = pago.ID_Pago;
            option.textContent = `${formatearPeriodo(pago.Periodo)} (Pagado el ${fechaPagoFmt})`;
            selector.appendChild(option);
        });
        
        selector.value = pagosDeLaParcela[0].ID_Pago;
        selectorContainer.style.display = 'block';
        actualizarVistaPreviaComprobante(pagosDeLaParcela[0]);
    });

    document.getElementById('selectPeriodoComprobante').addEventListener('change', (e) => {
        const pagoId = e.target.value;
        if (!pagoId) {
            pagoSeleccionadoParaEnviar = null;
            document.getElementById('inputAsuntoComprobante').value = '';
            document.getElementById('divCuerpoComprobante').innerHTML = `<span style="color: #6c757d;">Seleccione un período para generar la previsualización.</span>`;
            return;
        }
        const pagoSeleccionado = pagosGC_obj.find(p => p.ID_Pago == pagoId);
        if (pagoSeleccionado) {
            actualizarVistaPreviaComprobante(pagoSeleccionado);
        }
    });

    formComprobante.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!pagoSeleccionadoParaEnviar) {
            return mostrarMensaje('Debe seleccionar un comprobante para enviar.', 'error');
        }
        const destinatario = document.getElementById('inputEmailComprobante').value;
        if (!destinatario) {
            return mostrarMensaje('El residente no tiene un correo electrónico registrado.', 'error');
        }
        mostrarSpinner();
        try {
            const asunto = document.getElementById('inputAsuntoComprobante').value;
            const cuerpo = document.getElementById('divCuerpoComprobante').innerHTML;
            await enviarCorreo(destinatario, asunto, cuerpo);
            
            await marcarComprobanteEnviado(pagoSeleccionadoParaEnviar.rowNum);
            
            pagoSeleccionadoParaEnviar.Comprobante_Enviado = 'SI';
            
            modalComprobante.style.display = 'none';
            mostrarMensaje(`Correo enviado con éxito a ${destinatario}.`, 'success');
            filtrarYRenderizar();
        } catch (err) {
            mostrarMensaje(`Error en el proceso: ${err.message}`, 'error');
        } finally {
            ocultarSpinner();
        }
    });

    document.getElementById('filtroParcela').addEventListener('input', filtrarYRenderizar);
    document.getElementById('filtroAnio').addEventListener('input', () => {
        actualizarVistaTIMC();
        filtrarYRenderizar();
    });
    
    document.getElementById('tbody-gastos').addEventListener('click', (e) => {
        const fila = e.target.closest('tr.fila-clicable');
        if (fila && fila.dataset.idPago) {
            abrirModalDetalle(fila.dataset.idPago);
        }
    });

    document.getElementById('modalDetallePago').addEventListener('click', (e) => {
        if(e.target.id === 'modalDetallePago' || e.target.id === 'btnCerrarModalDetalle') {
            e.currentTarget.style.display = 'none';
        }
    });
    document.getElementById('btnCerrarModalDetalle').addEventListener('click', () => {
        document.getElementById('modalDetallePago').style.display = 'none';
    });
    
    document.getElementById('btnCerrarModalConvenio').addEventListener('click', () => {
        document.getElementById('modalConvenio').style.display = 'none';
    });

    document.getElementById('convenioDeudaTotal').addEventListener('input', calcularValorCuota);
    document.getElementById('convenioCuotas').addEventListener('input', calcularValorCuota);

    document.getElementById('formConvenio').addEventListener('submit', (e) => {
        e.preventDefault();
        const nParcela = document.getElementById('convenioNParcela').value;
        const datosConvenio = {
            deuda: parseFloat(document.getElementById('convenioDeudaTotal').value),
            cuotas: parseInt(document.getElementById('convenioCuotas').value),
            valorCuota: parseFloat(document.getElementById('convenioValorCuota').value),
            fechaInicio: document.getElementById('convenioFechaInicio').value
        };
        document.getElementById('modalConvenio').style.display = 'none';
        guardarConvenio(nParcela, datosConvenio);
    });

    // =======================================================
    // EJECUCIÓN INICIAL
    // =======================================================

    filtrarYRenderizar();
    actualizarVistaTIMC();
    ocultarSpinner();
}
/* ============================================================================
 *  CONVENIOS – UI DE CUOTAS + ACTIVACIÓN Y REGISTRO DE PAGO (ROBUSTO SPA)
 *  (sin SCRIPT_ID, con MutationObserver para reinyectar al navegar)
 *  ========================================================================== */

/* 1) Llamadas al backend */
async function _gsInvoke(functionName, parameters = []) {
  try {
    if (typeof window.llamarAPI === 'function') {
      return await window.llamarAPI(functionName, parameters); // Execution API (utils.js)
    }
    const url = window.APPS_SCRIPT_WEBAPP_URL || window.GS_ENDPOINT;
    if (!url) throw new Error('No está configurada la URL del Apps Script ni existe llamarAPI.');
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ function: functionName, parameters })
    });
    const data = await resp.json();
    if (data.status === 'success') return data.response;
    throw new Error(data.error?.message || 'Error en Apps Script (WebApp)');
  } catch (e) {
    console.error('GS ERROR:', e);
    throw e;
  }
}

/* 2) Helpers DOM/archivos */
function el_(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}
function fileToBase64_(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result.split(',')[1]);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* --- Localización robusta del host y del input Parcela --- */
function getGastosHost_() {
  return document.getElementById('gastos-comunes-section')
      || document.getElementById('main-content')
      || document.querySelector('main')
      || document.body;
}
function findFiltersCard_(host) {
  const labels = Array.from(host.querySelectorAll('label'));
  const byLabel = labels.find(l => /parcela|parc/i.test(l.textContent || ''));
  if (byLabel) return byLabel.closest('.card') || byLabel.closest('.form-grid') || byLabel.closest('div');
  return host.querySelector('.card') || host;
}
function findParcelaSeleccionada() {
  const host = getGastosHost_();
  const inputs = Array.from(host.querySelectorAll('input[type="number"],input[type="text"]'))
    .filter(i => i.offsetParent !== null);
  const good = inputs.filter(i => {
    const text = (i.id || '') + ' ' + (i.name || '') + ' ' + (i.placeholder || '');
    const lab = i.labels ? Array.from(i.labels).map(l => l.textContent).join(' ') : '';
    return /parc|parcela|lote|unidad/i.test(text + ' ' + lab);
  });
  const el = good[0] || inputs[0];
  return el && el.value ? String(el.value).trim() : null;
}
function queryByText_(selector, regex, root=document) {
  return Array.from(root.querySelectorAll(selector)).find(el => regex.test((el.textContent || '').trim()));
}
function isGastosView_() {
  const host = getGastosHost_();
  return !!(
    queryByText_('h1,h2,.section-title', /Gastos Comunes/i, host) ||
    queryByText_('button', /Agregar Gasto Común/i, host) ||
    queryByText_('*', /Configuración de TIMC/i, host)
  );
}

/* 3) Estado local */
const _cvState = { nParcela: null, idConvenio: null, cuotas: [] };

/* 4) Bindings seguros */
function ensureBindings() {
  const btnGuardar = document.getElementById('pq_guardar');
  if (btnGuardar && !btnGuardar._bound) {
    btnGuardar.addEventListener('click', onGuardarPagoCuota);
    btnGuardar._bound = true;
  }
  const btnCerrar = document.getElementById('pq_cerrar');
  if (btnCerrar && !btnCerrar._bound) {
    btnCerrar.addEventListener('click', () => {
      const m = document.getElementById('modalPagarCuota');
      if (m) m.style.display = 'none';
    });
    btnCerrar._bound = true;
  }

  const acGuardar = document.getElementById('ac_guardar');
  if (acGuardar && !acGuardar._bound) {
    acGuardar.addEventListener('click', onActivarConvenio);
    acGuardar._bound = true;
  }
  const acCerrar = document.getElementById('ac_cerrar');
  if (acCerrar && !acCerrar._bound) {
    acCerrar.addEventListener('click', () => {
      const m = document.getElementById('modalActivarConvenio');
      if (m) m.style.display = 'none';
    });
    acCerrar._bound = true;
  }

  const btnRef = document.getElementById('btn-refrescar-convenio');
  if (btnRef && !btnRef._bound) {
    btnRef.addEventListener('click', () => {
      const p = findParcelaSeleccionada();
      if (!p) return alert('Ingresa N° de parcela en Filtros.');
      _hookConvenioOnParcelaChange(p);
    });
    btnRef._bound = true;
  }
  const btnAct = document.getElementById('btn-activar-convenio');
  if (btnAct && !btnAct._bound) {
    btnAct.addEventListener('click', () => {
      const p = findParcelaSeleccionada();
      if (!p) return alert('Ingresa N° de parcela en Filtros.');
      document.getElementById('ac_parcela').value = p;
      document.getElementById('ac_fecha').valueAsDate = new Date();
      document.getElementById('modalActivarConvenio').style.display = 'block';
    });
    btnAct._bound = true;
  }

  // Refrescar al cambiar el input de parcela
  const host = getGastosHost_();
  Array.from(host.querySelectorAll('input[type="text"],input[type="number"]')).forEach(inp => {
    if (!inp._cvBound) {
      inp.addEventListener('change', () => {
        const p = findParcelaSeleccionada();
        if (p) _hookConvenioOnParcelaChange(p);
      });
      inp._cvBound = true;
    }
  });
}

/* 5) Handlers */
async function onGuardarPagoCuota() {
  try {
    const nCuota = Number(document.getElementById('pq_ncuota').value);
    const fecha  = document.getElementById('pq_fecha').value;
    const monto  = Number(document.getElementById('pq_monto').value);
    const metodo = (document.getElementById('pq_metodo').value || '').trim();
    const obs    = (document.getElementById('pq_obs').value || '').trim();
    const enviar = document.getElementById('pq_enviar').checked;

    const fileEl = document.getElementById('pq_file');
    let fileObj  = null;
    if (fileEl && fileEl.files && fileEl.files[0]) {
      const f = fileEl.files[0];
      fileObj = { name: f.name, mime: f.type || 'application/octet-stream', base64: await fileToBase64_(f) };
    }
    if (!_cvState.nParcela || !_cvState.idConvenio) throw new Error('No hay convenio cargado.');
    if (!nCuota || !fecha || !monto) throw new Error('Completa N° cuota, fecha y monto.');

    const payload = {
      nParcela: _cvState.nParcela,
      idConvenio: _cvState.idConvenio,
      nCuota, fechaPago: fecha, monto, metodo, observacion: obs,
      enviarComprobante: !!enviar, file: fileObj
    };
    const res = await _gsInvoke('registrarPagoCuota_GS', [payload]);
    await cargarConvenioYCuotas(_cvState.nParcela);
    const modal = document.getElementById('modalPagarCuota');
    if (modal) modal.style.display = 'none';
    alert('Pago registrado correctamente' + (res?.enviadoA ? ` y comprobante enviado a ${res.enviadoA}` : ''));
  } catch (e) {
    console.error(e);
    alert('Error al registrar el pago: ' + (e.message || e));
  }
}

async function onActivarConvenio() {
  try {
    const nParcela = String(document.getElementById('ac_parcela').value || '').trim();
    const deuda    = Number(document.getElementById('ac_deuda').value);
    const cuotas   = Number(document.getElementById('ac_cuotas').value);
    const valor    = Number(document.getElementById('ac_valor').value);
    const fecha    = document.getElementById('ac_fecha').value;
    const interes  = Number(document.getElementById('ac_interes').value || 0);

    if (!nParcela || !deuda || !cuotas || !valor || !fecha) {
      return alert('Completa todos los campos requeridos.');
    }

    await _gsInvoke('activarConvenio_GS', [ nParcela, {
      deuda, cuotas, valorCuota: valor, fechaInicio: fecha, interes
    }]);

    const modal = document.getElementById('modalActivarConvenio');
    if (modal) modal.style.display = 'none';

    await _hookConvenioOnParcelaChange(nParcela);
    alert('Convenio activado y cuotas generadas.');
  } catch (e) {
    console.error(e);
    alert('Error al activar convenio: ' + (e.message || e));
  }
}

/* 6) Inyección de UI (barra + tabla + modales) */
function injectConveniosUI() {
  const host = getGastosHost_();
  const filtersCard = findFiltersCard_(host);

  // Barra de acciones
  if (!document.getElementById('convenio-actions-bar')) {
    const actions = el_(`
      <div id="convenio-actions-bar" style="display:flex;gap:8px;margin:12px 0">
        <button class="btn" id="btn-refrescar-convenio">Refrescar convenio</button>
        <button class="btn" id="btn-activar-convenio">Activar Convenio (nuevo)</button>
      </div>`);
    (filtersCard?.parentElement || host).insertBefore(actions, (filtersCard?.nextSibling) || host.firstChild);
  }

  // Contenedor + tabla
  if (!document.getElementById('cuotas-convenio-box')) {
    const box = el_(`
      <div id="cuotas-convenio-box" style="display:none;margin-top:12px">
        <div class="section-title">Cuotas del Convenio</div>
        <div id="cuotas-convenio-summary" class="cards-row" style="margin-bottom:12px"></div>
        <div class="table-wrapper">
          <table id="tabla-cuotas-convenio" class="residente-table" aria-label="Tabla de cuotas del convenio">
            <thead>
              <tr>
                <th>#</th><th>Vencimiento</th><th>Monto Cuota</th>
                <th>Pagado</th><th>Saldo</th><th>Estado</th><th>Comprobante</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>`);
    host.appendChild(box);
  }

  // Modal pagar cuota
  if (!document.getElementById('modalPagarCuota')) {
    const modalPay = el_(`
      <div id="modalPagarCuota" class="modal" style="display:none">
        <div class="modal-content" style="max-width:520px">
          <h3>Registrar pago de cuota</h3>
          <div class="form-grid">
            <label>N° Cuota <input type="number" id="pq_ncuota" min="1" required /></label>
            <label>Fecha de pago <input type="date" id="pq_fecha" required /></label>
            <label>Monto pagado ($) <input type="number" id="pq_monto" min="0" step="1" required /></label>
            <label>Método <input type="text" id="pq_metodo" placeholder="Transferencia / Efectivo / Tarjeta" /></label>
            <label>Observación <input type="text" id="pq_obs" /></label>
            <label>Adjuntar respaldo <input type="file" id="pq_file" accept=".pdf,.jpg,.jpeg,.png" /></label>
            <label style="grid-column:1 / -1"><input type="checkbox" id="pq_enviar" checked /> Enviar comprobante por correo al guardar</label>
          </div>
          <div class="modal-actions">
            <button class="btn" id="pq_guardar">Guardar</button>
            <button class="btn btn-secondary" id="pq_cerrar">Cancelar</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(modalPay);
  }

  // Modal activar convenio
  if (!document.getElementById('modalActivarConvenio')) {
    const modalCv = el_(`
      <div id="modalActivarConvenio" class="modal" style="display:none">
        <div class="modal-content" style="max-width:580px">
          <h3>Activar Convenio</h3>
          <div class="form-grid">
            <label>N° Parcela <input type="text" id="ac_parcela" required /></label>
            <label>Deuda Original ($) <input type="number" id="ac_deuda" min="1" step="1" required /></label>
            <label>N° de Cuotas <input type="number" id="ac_cuotas" min="1" step="1" required /></label>
            <label>Valor por Cuota ($) <input type="number" id="ac_valor" min="1" step="1" required /></label>
            <label>Fecha Inicio <input type="date" id="ac_fecha" required /></label>
            <label>Interés (%) <input type="number" id="ac_interes" min="0" step="0.01" placeholder="0" /></label>
          </div>
          <div class="modal-actions">
            <button class="btn" id="ac_guardar">Activar</button>
            <button class="btn btn-secondary" id="ac_cerrar">Cancelar</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(modalCv);
  }

  ensureBindings();
  console.log('[Convenios] UI inyectada');
}

/* 7) Cargar/Refrescar convenio y cuotas */
async function cargarConvenioYCuotas(nParcela) {
  _cvState.nParcela = nParcela;
  const conv = await _gsInvoke('obtenerConvenio_GS', [nParcela]);
  const box = document.getElementById('cuotas-convenio-box');
  if (!conv) { if (box) box.style.display='none'; return; }

  _cvState.idConvenio = conv.idConvenio;
  const cuotas = await _gsInvoke('obtenerCuotas_GS', [conv.idConvenio]);
  _cvState.cuotas = cuotas || [];

  const sum = document.getElementById('cuotas-convenio-summary');
  sum.innerHTML = `
    <div class="card small"><div class="card-title">Deuda Original</div><div class="card-value">$${Number(conv.deudaOriginal).toLocaleString('es-CL')}</div></div>
    <div class="card small"><div class="card-title">Saldo Convenio</div><div class="card-value">$${Number(conv.saldoConvenio).toLocaleString('es-CL')}</div></div>
    <div class="card small"><div class="card-title">Cuotas</div><div class="card-value">${conv.nCuotas}</div></div>
    <div class="card small"><div class="card-title">Valor Cuota</div><div class="card-value">$${Number(conv.valorCuota).toLocaleString('es-CL')}</div></div>
  `;

  const tb = document.querySelector('#tabla-cuotas-convenio tbody');
  tb.innerHTML = '';
  _cvState.cuotas.forEach(c => {
    const tr = document.createElement('tr');
    const linkHtml = (c.comprobantes || '').split(';').filter(Boolean).map(u => `<a href="${u}" target="_blank">Ver</a>`).join(' · ');
    const btn = (c.estado === 'Pagada')
      ? `<button class="btn btn-secondary" disabled>Pagada</button>`
      : `<button class="btn" data-cuota="${c.nCuota}" onclick="abrirModalPagarCuota(${c.nCuota})">Registrar pago</button>`;
    tr.innerHTML = `
      <td>${c.nCuota}</td>
      <td>${new Date(c.fechaVencimiento).toLocaleDateString('es-CL')}</td>
      <td style="text-align:right">$${Number(c.montoCuota).toLocaleString('es-CL')}</td>
      <td style="text-align:right">$${Number(c.pagadoAcumulado).toLocaleString('es-CL')}</td>
      <td style="text-align:right">$${Number(c.saldoCuota).toLocaleString('es-CL')}</td>
      <td>${c.estado}</td>
      <td>${linkHtml || '—'}</td>
      <td>${btn}</td>`;
    tb.appendChild(tr);
  });

  box.style.display = 'block';
}

/* 8) Abrir modal de pago con cuota preseleccionada */
window.abrirModalPagarCuota = function(nCuota) {
  document.getElementById('pq_ncuota').value = nCuota || (_cvState.cuotas.find(c => c.estado!=='Pagada')?.nCuota || 1);
  document.getElementById('pq_fecha').valueAsDate = new Date();
  document.getElementById('pq_monto').value = '';
  document.getElementById('pq_metodo').value = '';
  document.getElementById('pq_obs').value = '';
  document.getElementById('pq_file').value = '';
  document.getElementById('modalPagarCuota').style.display = 'block';
};

/* 9) Hook público para refrescar por parcela */
window._hookConvenioOnParcelaChange = async function(nParcela) {
  try { await cargarConvenioYCuotas(nParcela); } catch(e){ console.warn(e); }
};

/* 10) Inicialización ROBUSTA: reinyectar al entrar a Gastos Comunes */
(function bootstrapConvenios() {
  function checkAndInject() {
    // ¿Estamos en la vista de Gastos Comunes y aún no hay barra?
    if (isGastosView_() && !document.getElementById('convenio-actions-bar')) {
      injectConveniosUI();
      ensureBindings();
      const p = findParcelaSeleccionada();
      if (p) _hookConvenioOnParcelaChange(p);
    }
  }

  // 1) Intento inmediato
  checkAndInject();

  // 2) Observa TODOS los cambios del DOM (la SPA re-renderiza)
  const obs = new MutationObserver(() => checkAndInject());
  obs.observe(document.body, { childList: true, subtree: true });

  // 3) Por si usan hash/router, reintenta al cambiar
  window.addEventListener('hashchange', checkAndInject);
  window.addEventListener('popstate', checkAndInject);

  // 4) Al hacer click en el menú lateral intenta reinyectar en breve
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;
    const txt = (t.textContent || '').trim();
    if (/Gastos Comunes/i.test(txt)) {
      setTimeout(checkAndInject, 100);
      setTimeout(checkAndInject, 400);
      setTimeout(checkAndInject, 900);
    }
  });
})();
