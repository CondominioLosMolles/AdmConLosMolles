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
// =================================================================

// --- VARIABLES GLOBALES DEL MÓDULO ---
let conveniosData = [];
let cuotasData = [];
let residentesData = [];
let pagosGcData = []; // AÑADIDO: Variable para almacenar los datos de pagos
let conveniosUnificados = []; // Datos combinados para fácil acceso
let conveniosFiltrados = [];
const FILAS_POR_PAGINA_CONVENIOS = 10;
let modalNuevoConvenio = null;
let modalDetalleConvenio = null; // Variable para la instancia del modal de detalles

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

        <div class="modal fade" id="modalNuevoConvenio" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Crear Nuevo Convenio de Pago</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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

        <div class="modal fade" id="modalDetalleConvenio" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="detalleConvenioTitulo">Detalle del Convenio</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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

    // Se usa setTimeout para asegurar que el DOM se actualice con el innerHTML
    // antes de intentar inicializar los componentes y cargar los datos.
    setTimeout(async () => {
        inicializarComponentesConvenios();
        await cargarDatosIniciales();
    }, 0);
}

// --- MANEJO DE COMPONENTES Y EVENTOS ---
function inicializarComponentesConvenios() {
    // Limpiar cualquier backdrop existente
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Eliminar la clase modal-open del body si existe
    document.body.classList.remove('modal-open');
    
    // Eliminar cualquier modal abierto
    const openModals = document.querySelectorAll('.modal.show');
    openModals.forEach(modal => modal.classList.remove('show'));
    
    // 1. DESTRUYE las instancias anteriores de las modales si existen.
    // Esto es CRÍTICO para evitar backdrops (fondos grises) duplicados.
    if (modalNuevoConvenio) {
        try {
            modalNuevoConvenio.dispose();
        } catch (e) {
            console.warn("Error al eliminar modalNuevoConvenio:", e);
        }
        modalNuevoConvenio = null;
    }
    
    if (modalDetalleConvenio) {
        try {
            modalDetalleConvenio.dispose();
        } catch (e) {
            console.warn("Error al eliminar modalDetalleConvenio:", e);
        }
        modalDetalleConvenio = null;
    }

    // 2. CREA las nuevas instancias, asegurando que están limpias.
    const modalNuevoElement = document.getElementById('modalNuevoConvenio');
    const modalDetalleElement = document.getElementById('modalDetalleConvenio');
    
    if (modalNuevoElement) {
        modalNuevoConvenio = new bootstrap.Modal(modalNuevoElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
    }
    
    if (modalDetalleElement) {
        modalDetalleConvenio = new bootstrap.Modal(modalDetalleElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
    }

    // 3. Asigna los listeners a los elementos que acabamos de crear en el DOM.
    const filtroBusqueda = document.getElementById('filtroBusquedaConvenio');
    const filtroEstado = document.getElementById('filtroEstadoConvenio');
    const btnAbrirModal = document.getElementById('btnAbrirModalNuevoConvenio');
    const formNuevoConvenio = document.getElementById('formNuevoConvenio');
    
    if (filtroBusqueda) {
        filtroBusqueda.addEventListener('input', aplicarFiltrosConvenios);
    }
    
    if (filtroEstado) {
        filtroEstado.addEventListener('change', aplicarFiltrosConvenios);
    }
    
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', abrirModalNuevoConvenio);
    }
    
    if (formNuevoConvenio) {
        formNuevoConvenio.addEventListener('submit', guardarConvenio);
    }

    ['convenioDeudaTotal', 'convenioCuotas'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', calcularValorCuotaPreview);
        }
    });

    // Delegación de eventos para los botones de la tabla (más eficiente)
    const tablaBody = document.getElementById('tabla-convenios-body');
    if (tablaBody) {
        tablaBody.addEventListener('click', (event) => {
            const btn = event.target.closest('.btn-ver-detalle');
            if (btn) {
                const convenioId = btn.dataset.id;
                abrirModalDetalle(convenioId);
            }
        });
    }
}

// --- MANEJO DE DATOS (CARGA Y PROCESAMIENTO) ---
async function cargarDatosIniciales() {
    showSpinner();
    try {
        // Carga los datos de las hojas de cálculo necesarias en paralelo.
        [conveniosData, cuotasData, residentesData, pagosGcData] = await Promise.all([
            getSheetData('Convenios'),
            getSheetData('Cuotas_Convenio'),
            getSheetData('Residentes'),
            getSheetData('Pagos_GC') // Se añade la carga de datos de pagos.
        ]);

        // VERIFICACIÓN Y LIMPIEZA: Omite la fila del encabezado si está presente.
        if (residentesData.length > 0 && residentesData[0][0] === 'ID_Residente') {
            residentesData.shift();
        }
        if (pagosGcData.length > 0 && pagosGcData[0][0] === 'ID_Pago') {
            pagosGcData.shift();
        }
        if (conveniosData.length > 0 && conveniosData[0][0] === 'ID_Convenio') {
            conveniosData.shift();
        }
        if (cuotasData.length > 0 && cuotasData[0][0] === 'ID_Cuota') {
            cuotasData.shift();
        }

        procesarYUnirDatos();
        aplicarFiltrosConvenios();

    } catch (error) {
        console.error("Error al cargar datos iniciales para convenios:", error);
        mostrarMensaje("No se pudieron cargar los datos necesarios para la gestión de convenios.", "error");
    } finally {
        hideSpinner();
    }
}

// --- PROCESAR Y UNIR DATOS ---
function procesarYUnirDatos() {
    if (!residentesData) residentesData = [];
    if (!conveniosData) conveniosData = [];
    if (!cuotasData) cuotasData = [];

    const residentesMap = new Map();
    residentesData.forEach(residente => {
        const nParcela = residente[1];
        const nombreCompleto = residente[2];
        if (nParcela && nombreCompleto) {
            if (!residentesMap.has(nParcela)) {
                residentesMap.set(nParcela, []);
            }
            residentesMap.get(nParcela).push(nombreCompleto);
        }
    });

    conveniosUnificados = conveniosData.map(convenio => {
        if (!convenio || !convenio[0]) return null;

        const idConvenio = convenio[0];
        const nParcelaConvenio = convenio[1];
        const estadoConvenio = convenio[7] || 'Activo';

        const residentesNombres = residentesMap.get(nParcelaConvenio) || ["Residente no encontrado"];
        const cuotasDelConvenio = cuotasData.filter(c => c && c[1] === idConvenio);
        const cuotasPendientes = cuotasDelConvenio.filter(c => c && c[8] !== 'Pagado');
        const saldoPendiente = cuotasPendientes.reduce((sum, cuota) => sum + parseFloat(cuota[5] || 0), 0);

        let estadoCalculado = estadoConvenio;
        if (estadoCalculado === 'Activo') {
            if (saldoPendiente === 0 && cuotasDelConvenio.length > 0) {
                estadoCalculado = 'Pagado';
            } else {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const tieneAtraso = cuotasPendientes.some(c => {
                    const fechaVencimientoStr = c && c[4];
                    if (!fechaVencimientoStr) return false;
                    const [dia, mes, anio] = fechaVencimientoStr.split('/');
                    if (!dia || !mes || !anio) return false;
                    const fechaVencimiento = new Date(`${anio}-${mes}-${dia}`);
                    return fechaVencimiento < hoy;
                });
                if (tieneAtraso) estadoCalculado = 'Atrasado';
            }
        }

        return {
            ID_Convenio: idConvenio,
            N_Parcela: nParcelaConvenio,
            Deuda_Original: convenio[3] || 0,
            N_Cuotas: convenio[4] || 0,
            Valor_Cuota: convenio[5] || 0,
            Estado: estadoConvenio,
            Nombre_Residente: residentesNombres.join(', '),
            Cuotas_Asociadas: cuotasDelConvenio.map(c => ({
                ID_Cuota: c[0], N_Cuota: c[3], Fecha_Vencimiento: c[4], Monto_Cuota: c[5], Estado: c[8]
            })),
            Saldo_Pendiente_Calculado: saldoPendiente,
            Estado_Calculado: estadoCalculado
        };
    }).filter(Boolean);
}

// --- RENDERIZADO DE TABLA Y PAGINACIÓN ---
function aplicarFiltrosConvenios() {
    const textoInput = document.getElementById('filtroBusquedaConvenio');
    const estadoSelect = document.getElementById('filtroEstadoConvenio');
    
    if (!textoInput || !estadoSelect) return;
    
    const texto = textoInput.value.toLowerCase();
    const estado = estadoSelect.value;

    conveniosFiltrados = conveniosUnificados.filter(c =>
        (c.N_Parcela.toLowerCase().includes(texto) || c.Nombre_Residente.toLowerCase().includes(texto)) &&
        (estado ? c.Estado_Calculado === estado : true)
    );
    renderizarTablaConvenios(1);
}

function renderizarTablaConvenios(pagina) {
    const tbody = document.getElementById('tabla-convenios-body');
    if (!tbody) return;
    
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
    const paginacionContainer = document.getElementById('paginacion-convenios');
    const infoContainer = document.getElementById('registros-info-convenios');
    
    if (!paginacionContainer || !infoContainer) return;
    
    const totalPaginas = Math.ceil(totalItems / FILAS_POR_PAGINA_CONVENIOS);

    infoContainer.textContent = `Mostrando ${totalItems > 0 ? (paginaActual - 1) * FILAS_POR_PAGINA_CONVENIOS + 1 : 0} a ${Math.min(paginaActual * FILAS_POR_PAGINA_CONVENIOS, totalItems)} de ${totalItems} registros`;

    if (totalPaginas <= 1) {
        paginacionContainer.innerHTML = '';
        return;
    }

    let paginacionHTML = '<ul class="pagination mb-0">';
    for (let i = 1; i <= totalPaginas; i++) {
        paginacionHTML += `<li class="page-item ${i === paginaActual ? 'active' : ''}"><a class="page-link" href="#" onclick="event.preventDefault(); renderizarTablaConvenios(${i});">${i}</a></li>`;
    }
    paginacionHTML += '</ul>';
    paginacionContainer.innerHTML = paginacionHTML;
}

// --- MANEJO DE MODALES ---
// (Esta es la versión original que debes encontrar y borrar)
function abrirModalNuevoConvenio() {
    if (document.getElementById('modalNuevoConvenio')) return; 

    const modalHTML = `
    <div class="modal fade" id="modalNuevoConvenio" tabindex="-1" aria-labelledby="nuevoConvenioLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="nuevoConvenioLabel">Crear Nuevo Convenio de Pago</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formNuevoConvenio">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label for="convenio-n-parcela" class="form-label">N° Parcela</label>
                                <input type="number" class="form-control" id="convenio-n-parcela" list="lista-parcelas" required>
                                <datalist id="lista-parcelas">
                                    ${residentesData.map(r => `<option value="${r[3]}">${r[1]} (Parcela ${r[3]})</option>`).join('')}
                                </datalist>
                            </div>
                            <div class="col-md-8 mb-3">
                                <label for="convenio-residente-nombre" class="form-label">Nombre Residente</label>
                                <input type="text" class="form-control" id="convenio-residente-nombre" readonly>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="convenio-deuda-total" class="form-label">Monto Total de la Deuda a Repactar ($)</label>
                            <input type="number" class="form-control" id="convenio-deuda-total" required>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="convenio-n-cuotas" class="form-label">Número de Cuotas</label>
                                <input type="number" class="form-control" id="convenio-n-cuotas" required min="1" max="48">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label for="convenio-fecha-inicio" class="form-label">Fecha de Inicio (Primera Cuota)</label>
                                <input type="date" class="form-control" id="convenio-fecha-inicio" required>
                            </div>
                        </div>
                         <div class="mb-3">
                            <label for="convenio-valor-cuota" class="form-label">Valor Cuota Mensual ($)</label>
                            <input type="text" class="form-control" id="convenio-valor-cuota" readonly>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" id="btnGuardarConvenio" class="btn btn-primary">Guardar Convenio</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    modalNuevoConvenio = new bootstrap.Modal(document.getElementById('modalNuevoConvenio'));

    const inputParcela = document.getElementById('convenio-n-parcela');
    const residenteNombre = document.getElementById('convenio-residente-nombre');
    const deudaTotalInput = document.getElementById('convenio-deuda-total');

    inputParcela.addEventListener('change', () => {
        const nParcela = inputParcela.value;
        const residente = residentesData.find(r => r[3] === nParcela);

        if (residente) {
            residenteNombre.value = residente[1];
            deudaTotalInput.value = 'Calculando...'; 
        } else {
            residenteNombre.value = 'Residente no encontrado';
            deudaTotalInput.value = '';
        }
    });

    document.getElementById('btnGuardarConvenio').addEventListener('click', guardarConvenio);

    modalNuevoConvenio.show();
}

    // --- DIAGNÓSTICO DE DATOS ---
    console.log("Paso 2: Revisando los datos de residentes disponibles...", residentesData);
    if (!residentesData || residentesData.length === 0) {
        console.error("PROBLEMA: La variable 'residentesData' está vacía. Los datos no se cargaron desde la planilla.");
    }

    // Se agrega una validación para evitar errores si una fila está incompleta
    const residentesPrincipales = residentesData.filter(residente => residente && residente.length > 18 && residente[18] === 'SI');

    console.log("Paso 3: Se encontraron " + residentesPrincipales.length + " residentes marcados como 'Contacto Principal'.", residentesPrincipales);
    if (residentesPrincipales.length === 0) {
        console.warn("ADVERTENCIA: Ningún residente cumple la condición de tener 'SI' en la columna 19 (S). La lista desplegable estará vacía.");
    }
    // --- FIN DEL DIAGNÓSTICO ---

    select.innerHTML = '<option value="" disabled selected>Seleccione una parcela...</option>' +
        residentesPrincipales.map(residente => {
            const nParcela = escapeHTML(residente[1]);
            const nombreCompleto = escapeHTML(residente[2]);
            return `<option value="${nParcela}">${nParcela} - ${nombreCompleto}</option>`;
        }).join('');

    const resumenDiv = document.getElementById('resumenCalculoCuota');
    if (resumenDiv) {
        resumenDiv.textContent = 'Ingrese los datos para calcular el valor de la cuota.';
    }
    
    // Se reincorpora el setTimeout para evitar el error visual del fondo gris
    setTimeout(() => {
        if (modalNuevoConvenio) {
            modalNuevoConvenio.show();
        }
    }, 50);
}

function calcularValorCuotaPreview() {
    const deudaInput = document.getElementById('convenioDeudaTotal');
    const cuotasInput = document.getElementById('convenioCuotas');
    const resumenDiv = document.getElementById('resumenCalculoCuota');
    
    if (!deudaInput || !cuotasInput || !resumenDiv) return;
    
    const deuda = parseFloat(deudaInput.value) || 0;
    const cuotas = parseInt(cuotasInput.value) || 0;

    if (deuda > 0 && cuotas > 0) {
        const valorCuota = Math.round(deuda / cuotas);
        resumenDiv.innerHTML = `Se generarán <strong>${cuotas} cuotas</strong> de <strong>$${valorCuota.toLocaleString('es-CL')}</strong> cada una.`;
    } else {
        resumenDiv.textContent = 'Ingrese los datos para calcular el valor de la cuota.';
    }
}

function abrirModalDetalle(convenioId) {
    // Limpiar backdrops existentes
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    document.body.classList.remove('modal-open');
    
    const convenio = conveniosUnificados.find(c => c.ID_Convenio === convenioId);
    if (!convenio) return;

    const tituloElement = document.getElementById('detalleConvenioTitulo');
    if (tituloElement) {
        tituloElement.innerHTML = `Detalle del Convenio <span class="badge text-bg-dark">${convenio.ID_Convenio}</span>`;
    }
    
    const body = document.getElementById('detalleConvenioBody');
    if (!body) return;
    
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

    if (modalDetalleConvenio) {
        modalDetalleConvenio.show();
    }
}

// --- ACCIONES (GUARDAR, ACTUALIZAR) ---
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
        const fechaInicioStr = document.getElementById('convenioFechaInicio').value;

        const idConvenio = `C-${nParcela}-${Date.now().toString().slice(-5)}`;
        const valorCuota = Math.round(deudaTotal / nCuotas);

        const filaConvenio = [[
            idConvenio, nParcela, new Date().toLocaleDateString('es-CL'),
            deudaTotal, nCuotas, valorCuota, 0, 'Activo', deudaTotal, ''
        ]];

        const filasCuotas = [];
        const fechaInicio = new Date(fechaInicioStr + 'T12:00:00Z');

        for (let i = 1; i <= nCuotas; i++) {
            const idCuota = `Q-${idConvenio}-${i}`;
            const fechaVencimiento = new Date(fechaInicio);
            fechaVencimiento.setUTCMonth(fechaVencimiento.getUTCMonth() + i - 1);
            
            filasCuotas.push([
                idCuota, idConvenio, nParcela, i, 
                fechaVencimiento.toLocaleDateString('es-CL'),
                valorCuota, 0, valorCuota, 'Pendiente'
            ]);
        }

        await appendSheetData('Convenios', filaConvenio);
        await appendSheetData('Cuotas_Convenio', filasCuotas);

        if (modalNuevoConvenio) {
            modalNuevoConvenio.hide();
        }
        
        mostrarMensaje(`Convenio ${idConvenio} creado con éxito. Recargando datos...`, "success");
        
        setTimeout(cargarDatosIniciales, 1500);

    } catch (error) {
        console.error("Error al guardar el convenio:", error);
        mostrarMensaje("Error al guardar en Google Sheets. Revise la consola (F12).", "error");
    } finally {
        hideSpinner();
    }
}

async function registrarPagoCuota(cuotaId, convenioId) {
    console.log(`Iniciando el pago para la cuota ${cuotaId} del convenio ${convenioId}.`);
    
    // Aquí iría la lógica para llamar a una función `updateSheetData`
    // que buscaría la fila por `cuotaId` en la hoja 'Cuotas_Convenio'
    // y cambiaría el estado, montos, etc.

    // Por ahora, simulamos el cambio en memoria y recargamos la vista
    const cuotaOriginal = cuotasData.find(c => c[0] === cuotaId);
    if (cuotaOriginal) {
        cuotaOriginal[8] = 'Pagado'; // Columna Estado
        cuotaOriginal[7] = 0; // Columna Saldo_Cuota
    }

    procesarYUnirDatos();
    aplicarFiltrosConvenios();
    
    // Cierra y vuelve a abrir el modal de detalles para reflejar el cambio
    if (modalDetalleConvenio) {
        modalDetalleConvenio.hide(); 
    }
    
    abrirModalDetalle(convenioId); 
    mostrarMensaje(`Pago de la cuota ${cuotaId} registrado exitosamente (simulado).`, "info");
}
