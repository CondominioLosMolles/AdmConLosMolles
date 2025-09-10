// =================================================================
//      FUNCIÓN AUXILIAR PARA LIMPIAR TEXTO EN HTML
// =================================================================
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

// =================================================================
//      MÓDULO DE GESTIÓN DE CONVENIOS (VERSIÓN ROBUSTA MEJORADA)
//      Análisis y reconstrucción por Gemini
// =================================================================

// --- VARIABLES GLOBALES DEL MÓDULO ---
let conveniosData = [];
let cuotasData = [];
let residentesData = [];
let conveniosUnificados = []; // Datos combinados para fácil acceso
let conveniosFiltrados = [];
const FILAS_POR_PAGINA_CONVENIOS = 10;
let modalNuevoConvenio;
let modalDetalleConvenio; // Variable para la instancia del modal de detalles

// --- FUNCIÓN PRINCIPAL DE CARGA DEL MÓDULO ---
async function cargarConvenios() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h2 class="h4 mb-0">Gestión de Convenios de Pago</h2>
                <button id="btnAbrirModalNuevoConvenio" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Nuevo Convenio
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-5">
                        <input type="text" id="filtroBusquedaConvenio" class="form-control" placeholder="Buscar por N° de Parcela o Residente...">
                    </div>
                    <div class="col-md-4">
                        <select id="filtroEstadoConvenio" class="form-select">
                            <option value="">Todos los Estados</option>
                            <option value="Activo">Activo</option>
                            <option value="Atrasado">Atrasado</option>
                            <option value="Pagado">Pagado</option>
                            <option value="Anulado">Anulado</option>
                        </select>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>ID Convenio</th><th>N° Parcela</th><th>Residente</th>
                                <th>Deuda Original</th><th>Cuotas</th><th>Saldo Pendiente</th>
                                <th>Estado</th><th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-convenios-body"></tbody>
                    </table>
                </div>
                <div id="paginacion-convenios-container" class="d-flex justify-content-between align-items-center mt-3">
                    <span id="registros-info-convenios"></span>
                    <nav id="paginacion-convenios"></nav>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalNuevoConvenio" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Crear Nuevo Convenio de Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formNuevoConvenio" novalidate>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Residente (Parcela)</label>
                                    <select id="convenioResidente" class="form-select" required><option value="">Cargando...</option></select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Deuda Total a convenir ($)</label>
                                    <input type="number" id="convenioDeudaTotal" class="form-control" required min="1" placeholder="Ej: 500000">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Número de Cuotas</label>
                                    <input type="number" id="convenioCuotas" class="form-control" required min="1" max="120" placeholder="Ej: 12">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Fecha de Vencimiento de la Primera Cuota</label>
                                    <input type="date" id="convenioFechaInicio" class="form-control" required>
                                </div>
                            </div>
                            <div class="alert alert-info d-flex align-items-center">
                                <i class="fas fa-calculator me-2"></i>
                                <div id="resumenCalculoCuota">Ingrese los datos para calcular el valor de la cuota.</div>
                            </div>
                            <div class="text-end mt-4">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Guardar Convenio</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalDetalleConvenio" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="detalleConvenioTitulo">Detalle del Convenio</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detalleConvenioBody">
                        </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    inicializarComponentesConvenios();
    await cargarDatosIniciales();
}

// --- MANEJO DE COMPONENTES Y EVENTOS ---
function inicializarComponentesConvenios() {
    modalNuevoConvenio = new bootstrap.Modal(document.getElementById('modalNuevoConvenio'));
    modalDetalleConvenio = new bootstrap.Modal(document.getElementById('modalDetalleConvenio'));

    document.getElementById('filtroBusquedaConvenio').addEventListener('input', aplicarFiltrosConvenios);
    document.getElementById('filtroEstadoConvenio').addEventListener('change', aplicarFiltrosConvenios);
    document.getElementById('btnAbrirModalNuevoConvenio').addEventListener('click', abrirModalNuevoConvenio);
    document.getElementById('formNuevoConvenio').addEventListener('submit', guardarConvenio);

    ['convenioDeudaTotal', 'convenioCuotas'].forEach(id => {
        document.getElementById(id).addEventListener('input', calcularValorCuotaPreview);
    });

    // Delegación de eventos para los botones de la tabla (más eficiente)
    document.getElementById('tabla-convenios-body').addEventListener('click', (event) => {
        const btn = event.target.closest('.btn-ver-detalle');
        if (btn) {
            const convenioId = btn.dataset.id;
            abrirModalDetalle(convenioId);
        }
    });
}

// --- MANEJO DE DATOS (CARGA Y PROCESAMIENTO) ---
async function cargarDatosIniciales() {
    showSpinner();
    try {
        [conveniosData, cuotasData, residentesData] = await Promise.all([
    obtenerConvenios(),
    obtenerCuotasConvenio(),
    obtenerResidentes()
]);
        procesarYUnirDatos(); // Función clave para combinar y calcular datos
        aplicarFiltrosConvenios();
    } catch (error) {
        console.error("Error cargando datos de convenios:", error);
        mostrarMensaje("Error fatal al cargar datos. Revise la consola (F12).", "error");
    } finally {
        hideSpinner();
    }
}

function procesarYUnirDatos() {
    // Crear un mapa de residentes para búsqueda rápida por N_Parcela
    const residentesMap = new Map();
    residentesData.forEach(r => {
        if (!residentesMap.has(r.N_Parcela)) {
            residentesMap.set(r.N_Parcela, []);
        }
        residentesMap.get(r.N_Parcela).push(r.Nombre_Completo);
    });

    conveniosUnificados = conveniosData.map(convenio => {
        const residentesNombres = residentesMap.get(convenio.N_Parcela) || ["Residente no encontrado"];
        const cuotasDelConvenio = cuotasData.filter(c => c.ID_Convenio === convenio.ID_Convenio);
        
        const cuotasPendientes = cuotasDelConvenio.filter(c => c.Estado !== 'Pagado');
        const saldoPendiente = cuotasPendientes.reduce((sum, cuota) => sum + parseFloat(cuota.Monto_Cuota || 0), 0);

        let estadoCalculado = convenio.Estado;
        if (estadoCalculado === 'Activo') {
             if (saldoPendiente === 0) {
                estadoCalculado = 'Pagado';
            } else {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0); // Normalizar para comparar solo fechas
                const tieneAtraso = cuotasPendientes.some(c => {
                    const [dia, mes, anio] = c.Fecha_Vencimiento.split('/');
                    const fechaVencimiento = new Date(`${anio}-${mes}-${dia}`);
                    return fechaVencimiento < hoy;
                });

                if (tieneAtraso) {
                    estadoCalculado = 'Atrasado';
                }
            }
        }

        return {
            ...convenio, // Copia todas las propiedades del convenio original
            Nombre_Residente: residentesNombres.join(', '), // Une nombres si hay más de uno por parcela
            Cuotas_Asociadas: cuotasDelConvenio,
            Saldo_Pendiente_Calculado: saldoPendiente,
            Estado_Calculado: estadoCalculado
        };
    });
}

// --- RENDERIZADO DE TABLA Y PAGINACIÓN ---
function aplicarFiltrosConvenios() {
    const texto = document.getElementById('filtroBusquedaConvenio').value.toLowerCase();
    const estado = document.getElementById('filtroEstadoConvenio').value;

    conveniosFiltrados = conveniosUnificados.filter(c =>
        (c.N_Parcela.toLowerCase().includes(texto) || c.Nombre_Residente.toLowerCase().includes(texto)) &&
        (estado ? c.Estado_Calculado === estado : true)
    );
    renderizarTablaConvenios(1);
}

function renderizarTablaConvenios(pagina) {
    const tbody = document.getElementById('tabla-convenios-body');
    const inicio = (pagina - 1) * FILAS_POR_PAGINA_CONVENIOS;
    const fin = inicio + FILAS_POR_PAGINA_CONVENIOS;
    const conveniosPaginados = conveniosFiltrados.slice(inicio, fin);

    if (conveniosPaginados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No hay convenios que coincidan con la búsqueda.</td></tr>';
    } else {
        tbody.innerHTML = conveniosPaginados.map(c => {
            const estadoClass = { 'Activo': 'success', 'Atrasado': 'danger', 'Pagado': 'primary', 'Anulado': 'secondary' }[c.Estado_Calculado] || 'light';
            return `<tr>
                        <td><span class="badge text-bg-dark">${c.ID_Convenio}</span></td>
                        <td>${c.N_Parcela}</td>
                        <td>${c.Nombre_Residente}</td>
                        <td>$${parseFloat(c.Deuda_Original).toLocaleString('es-CL')}</td>
                        <td>${c.N_Cuotas}</td>
                        <td>$${parseFloat(c.Saldo_Pendiente_Calculado).toLocaleString('es-CL')}</td>
                        <td><span class="badge text-bg-${estadoClass}">${c.Estado_Calculado}</span></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary btn-ver-detalle" data-id="${c.ID_Convenio}" title="Ver Detalle del Convenio">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>`;
        }).join('');
    }
    renderizarPaginacionConvenios(conveniosFiltrados.length, pagina);
}

function renderizarPaginacionConvenios(totalItems, paginaActual) {
    // Esta función se mantiene igual, asumiendo que su lógica interna es correcta.
    // Solo nos aseguramos de que se llama con los parámetros correctos.
    const paginacionContainer = document.getElementById('paginacion-convenios');
    const infoContainer = document.getElementById('registros-info-convenios');
    const totalPaginas = Math.ceil(totalItems / FILAS_POR_PAGINA_CONVENIOS);

    infoContainer.textContent = `Mostrando ${totalItems > 0 ? (paginaActual - 1) * FILAS_POR_PAGINA_CONVENIOS + 1 : 0} a ${Math.min(paginaActual * FILAS_POR_PAGINA_CONVENIOS, totalItems)} de ${totalItems} registros`;

    if (totalPaginas <= 1) {
        paginacionContainer.innerHTML = '';
        return;
    }

    let paginacionHTML = '<ul class="pagination mb-0">';
    // Lógica para dibujar botones de paginación (simplificada para brevedad)
    for (let i = 1; i <= totalPaginas; i++) {
        paginacionHTML += `<li class="page-item ${i === paginaActual ? 'active' : ''}"><a class="page-link" href="#" onclick="renderizarTablaConvenios(${i})">${i}</a></li>`;
    }
    paginacionHTML += '</ul>';
    paginacionContainer.innerHTML = paginacionHTML;
}

// --- MODALES Y ACCIONES CRUD ---
function abrirModalNuevoConvenio() {
    document.getElementById('formNuevoConvenio').reset();
    const select = document.getElementById('convenioResidente');
    
    // Filtramos residentes que son "Contacto Principal" para evitar duplicados por parcela
    const residentesPrincipales = residentesData.filter(r => r['Contacto Principal'] === 'SI');
    
    select.innerHTML = '<option value="" disabled selected>Seleccione una parcela...</option>' +
    residentesPrincipales.map(r => `<option value="${escapeHTML(r.N_Parcela)}">${escapeHTML(r.N_Parcela)} - ${escapeHTML(r.Nombre_Completo)}</option>`).join('');
        
    document.getElementById('resumenCalculoCuota').textContent = 'Ingrese los datos para calcular el valor de la cuota.';
    modalNuevoConvenio.show();
}

function calcularValorCuotaPreview() {
    const deuda = parseFloat(document.getElementById('convenioDeudaTotal').value) || 0;
    const cuotas = parseInt(document.getElementById('convenioCuotas').value) || 0;
    const resumenDiv = document.getElementById('resumenCalculoCuota');

    if (deuda > 0 && cuotas > 0) {
        const valorCuota = Math.round(deuda / cuotas);
        resumenDiv.innerHTML = `Se generarán <strong>${cuotas} cuotas</strong> de <strong>$${valorCuota.toLocaleString('es-CL')}</strong> cada una.`;
    } else {
        resumenDiv.textContent = 'Ingrese los datos para calcular el valor de la cuota.';
    }
}

function abrirModalDetalle(convenioId) {
    const convenio = conveniosUnificados.find(c => c.ID_Convenio === convenioId);
    if (!convenio) return;

    document.getElementById('detalleConvenioTitulo').innerHTML = `Detalle del Convenio <span class="badge text-bg-dark">${convenio.ID_Convenio}</span>`;
    
    const body = document.getElementById('detalleConvenioBody');
    let cuotasHtml = convenio.Cuotas_Asociadas.length > 0 ?
        convenio.Cuotas_Asociadas.map(cuota => {
            const estadoClass = { 'Pendiente': 'warning', 'Pagado': 'success' }[cuota.Estado] || 'secondary';
            const hoy = new Date();
            hoy.setHours(0,0,0,0);
            const [dia, mes, anio] = cuota.Fecha_Vencimiento.split('/');
            const fechaVencimiento = new Date(`${anio}-${mes}-${dia}`);
            const estaAtrasada = fechaVencimiento < hoy && cuota.Estado === 'Pendiente';

            return `<tr>
                <td>${cuota.N_Cuota}</td>
                <td>${cuota.Fecha_Vencimiento}</td>
                <td>$${parseFloat(cuota.Monto_Cuota).toLocaleString('es-CL')}</td>
                <td>
                    <span class="badge text-bg-${estadoClass}">${cuota.Estado}</span>
                    ${estaAtrasada ? '<span class="badge text-bg-danger ms-2">Atrasada</span>' : ''}
                </td>
                <td class="text-center">
                    ${cuota.Estado === 'Pendiente' ? `<button class="btn btn-sm btn-success" onclick="registrarPagoCuota('${cuota.ID_Cuota}', '${convenioId}')">Registrar Pago</button>` : 'N/A'}
                </td>
            </tr>`;
        }).join('') : '<tr><td colspan="5" class="text-center">No se encontraron cuotas para este convenio.</td></tr>';

    body.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h5>Información General</h5>
                <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>N° Parcela:</strong> ${convenio.N_Parcela}</li>
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Residente:</strong> ${convenio.Nombre_Residente}</li>
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Deuda Original:</strong> $${parseFloat(convenio.Deuda_Original).toLocaleString('es-CL')}</li>
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>N° de Cuotas:</strong> ${convenio.N_Cuotas}</li>
                </ul>
            </div>
            <div class="col-md-6">
                <h5>Resumen Financiero</h5>
                <ul class="list-group">
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Valor Cuota:</strong> $${parseFloat(convenio.Valor_Cuota).toLocaleString('es-CL')}</li>
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Saldo Pendiente:</strong> <span class="fw-bold text-danger">$${parseFloat(convenio.Saldo_Pendiente_Calculado).toLocaleString('es-CL')}</span></li>
                    <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Estado Actual:</strong> <span class="badge text-bg-${{ 'Activo': 'success', 'Atrasado': 'danger', 'Pagado': 'primary' }[convenio.Estado_Calculado] || 'secondary'}">${convenio.Estado_Calculado}</span></li>
                </ul>
            </div>
        </div>
        <h5 class="mt-4">Plan de Pagos</h5>
        <div class="table-responsive">
            <table class="table table-sm table-bordered">
                <thead class="table-light"><tr><th>N° Cuota</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th class="text-center">Acción</th></tr></thead>
                <tbody>${cuotasHtml}</tbody>
            </table>
        </div>
    `;

    modalDetalleConvenio.show();
}

async function guardarConvenio(event) {
    event.preventDefault();
    if (!confirm("¿Está seguro que desea crear este nuevo convenio? Esta acción no se puede deshacer.")) {
        return;
    }
    showSpinner();

    try {
        const nParcela = document.getElementById('convenioResidente').value;
        const deudaTotal = parseFloat(document.getElementById('convenioDeudaTotal').value);
        const nCuotas = parseInt(document.getElementById('convenioCuotas').value);
        const fechaInicioStr = document.getElementById('convenioFechaInicio').value; // Formato YYYY-MM-DD

        const idConvenio = `C-${nParcela}-${Date.now().toString().slice(-5)}`;
        const valorCuota = Math.round(deudaTotal / nCuotas);

        // *** CORRECCIÓN CRÍTICA: El orden y número de columnas debe coincidir EXACTAMENTE con la hoja 'Convenios' ***
        const filaConvenio = [[
            idConvenio,           // ID_Convenio
            nParcela,             // N_Parcela
            new Date().toLocaleDateString('es-CL'), // Fecha_Inicio
            deudaTotal,           // Deuda_Original
            nCuotas,              // N_Cuotas
            valorCuota,           // Valor_Cuota
            0,                    // Interes_Convenio (Asumimos 0 si no se especifica)
            'Activo',             // Estado
            deudaTotal,           // Saldo_Convenio (Inicial)
            ''                    // URL_Formalizacion
        ]];

        const filasCuotas = [];
        const fechaInicio = new Date(fechaInicioStr + 'T12:00:00Z'); // Usar T12:00:00Z para evitar problemas de zona horaria

        for (let i = 1; i <= nCuotas; i++) {
            const idCuota = `Q-${idConvenio}-${i}`;
            const fechaVencimiento = new Date(fechaInicio);
            fechaVencimiento.setUTCMonth(fechaVencimiento.getUTCMonth() + i - 1);
            
            // *** CORRECCIÓN CRÍTICA: El orden debe coincidir con la hoja 'Cuotas_Convenio' ***
            filasCuotas.push([
                idCuota,                // ID_Cuota
                idConvenio,             // ID_Convenio
                nParcela,               // N_Parcela
                i,                      // N_Cuota
                fechaVencimiento.toLocaleDateString('es-CL'), // Fecha_Vencimiento
                valorCuota,             // Monto_Cuota
                0,                      // Monto_Pagado_Acumulado (Inicial)
                valorCuota,             // Saldo_Cuota (Inicial)
                'Pendiente'             // Estado
            ]);
        }

        // Simulación de escritura en Google Sheets
        await appendSheetData('Convenios', filaConvenio);
        await appendSheetData('Cuotas_Convenio', filasCuotas);

        modalNuevoConvenio.hide();
        mostrarMensaje(`Convenio ${idConvenio} creado con éxito. Recargando datos...`, "success");
        
        // Recargar todo para ver el nuevo convenio
        setTimeout(cargarDatosIniciales, 1500);

    } catch (error) {
        console.error("Error al guardar el convenio:", error);
        mostrarMensaje("Error al guardar en Google Sheets. Revise la consola (F12).", "error");
    } finally {
        hideSpinner();
    }
}

async function registrarPagoCuota(cuotaId, convenioId) {
    // Esta función simula la actualización de una cuota
    console.log(`Iniciando el pago para la cuota ${cuotaId} del convenio ${convenioId}.`);
    
    // Aquí iría la lógica para llamar a una función `updateSheetData`
    // que buscaría la fila por `cuotaId` en la hoja 'Cuotas_Convenio'
    // y cambiaría la columna 'Estado' a 'Pagado'.

    // Por ahora, actualizamos los datos en memoria y recargamos la vista para simular el cambio
    const cuota = cuotasData.find(c => c.ID_Cuota === cuotaId);
    if (cuota) {
        cuota.Estado = 'Pagado';
        cuota.Saldo_Cuota = 0;
        // ... otros campos a actualizar
    }

    // Volver a procesar y renderizar para reflejar el cambio
    procesarYUnirDatos();
    aplicarFiltrosConvenios();
    modalDetalleConvenio.hide(); // Cierra el modal actual
    abrirModalDetalle(convenioId); // Abre el modal actualizado
    mostrarMensaje(`Pago de la cuota ${cuotaId} registrado exitosamente (simulado).`, "info");
}
