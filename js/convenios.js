// =================================================================
//      MÓDULO DE GESTIÓN DE CONVENIOS (VERSIÓN FINAL)
//      Diseño y funcionalidad basados en el módulo de Gastos Comunes
// =================================================================

// --- VARIABLES GLOBALES DEL MÓDULO ---
let conveniosData = [];
let cuotasData = [];
let residentesData = [];
let conveniosFiltrados = [];
const FILAS_POR_PAGINA_CONVENIOS = 10;
let modalNuevoConvenio; // Variable para la instancia del modal

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
                                    <label class="form-label">Residente</label>
                                    <select id="convenioResidente" class="form-select" required><option value="">Cargando...</option></select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Deuda Total ($)</label>
                                    <input type="number" id="convenioDeudaTotal" class="form-control" required min="1">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Número de Cuotas</label>
                                    <input type="number" id="convenioCuotas" class="form-control" required min="1" max="120">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Fecha de Vencimiento de la Primera Cuota</label>
                                    <input type="date" id="convenioFechaInicio" class="form-control" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones (Opcional)</label>
                                <textarea id="convenioObservaciones" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="alert alert-info d-flex align-items-center">
                                <i class="fas fa-info-circle me-2"></i>
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
    `;

    inicializarComponentesConvenios();
    await cargarDatosConvenios();
}

// --- MANEJO DE COMPONENTES Y EVENTOS ---
function inicializarComponentesConvenios() {
    modalNuevoConvenio = new bootstrap.Modal(document.getElementById('modalNuevoConvenio'));

    document.getElementById('filtroBusquedaConvenio').addEventListener('input', aplicarFiltrosConvenios);
    document.getElementById('filtroEstadoConvenio').addEventListener('change', aplicarFiltrosConvenios);
    document.getElementById('btnAbrirModalNuevoConvenio').addEventListener('click', abrirModalNuevoConvenio);
    document.getElementById('formNuevoConvenio').addEventListener('submit', guardarConvenio);

    // Listeners para el cálculo en tiempo real del valor de la cuota
    ['convenioDeudaTotal', 'convenioCuotas'].forEach(id => {
        document.getElementById(id).addEventListener('input', calcularValorCuotaPreview);
    });
}

// --- MANEJO DE DATOS (CONEXIÓN CON GOOGLE SHEETS) ---
async function cargarDatosConvenios() {
    showSpinner();
    try {
        [conveniosData, cuotasData, residentesData] = await Promise.all([
            getSheetData('Convenios'),
            getSheetData('Cuotas_Convenio'), // Nombre exacto de tu hoja
            getSheetData('Residentes')
        ]);
        procesarConvenios();
        aplicarFiltrosConvenios();
    } catch (error) {
        console.error("Error cargando datos de convenios:", error);
        mostrarMensaje("Error fatal al cargar datos. Revise la consola (F12).", "error");
    } finally {
        hideSpinner();
    }
}

function procesarConvenios() {
    conveniosData.forEach(convenio => {
        const cuotasDelConvenio = cuotasData.filter(c => c.ID_Convenio === convenio.ID_Convenio && c.Estado === 'Pendiente');
        convenio.Saldo_Pendiente_Calculado = cuotasDelConvenio.reduce((sum, cuota) => sum + parseFloat(cuota.Monto_Cuota), 0);
        
        const tieneAtraso = cuotasDelConvenio.some(c => new Date(c.Fecha_Vencimiento.split('/').reverse().join('-')) < new Date());
        if (convenio.Estado === 'Activo' && tieneAtraso) {
            convenio.Estado_Calculado = 'Atrasado';
        } else {
            convenio.Estado_Calculado = convenio.Estado;
        }
    });
}

// --- RENDERIZADO DE TABLA Y PAGINACIÓN ---
function aplicarFiltrosConvenios() {
    const texto = document.getElementById('filtroBusquedaConvenio').value.toLowerCase();
    const estado = document.getElementById('filtroEstadoConvenio').value;

    conveniosFiltrados = conveniosData.filter(c => 
        (c.N_Parcela.toLowerCase().includes(texto) || c.Residente.toLowerCase().includes(texto)) &&
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
            let estadoClass = { 'Activo': 'success', 'Atrasado': 'danger', 'Pagado': 'info', 'Anulado': 'secondary' }[c.Estado_Calculado] || 'light';
            return `<tr>
                        <td><span class="badge text-bg-dark">${c.ID_Convenio}</span></td>
                        <td>${c.N_Parcela}</td>
                        <td>${c.Residente}</td>
                        <td>$${parseFloat(c.Deuda_Original).toLocaleString('es-CL')}</td>
                        <td>${c.N_Cuotas}</td>
                        <td>$${parseFloat(c.Saldo_Pendiente_Calculado).toLocaleString('es-CL')}</td>
                        <td><span class="badge text-bg-${estadoClass}">${c.Estado_Calculado}</span></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary" title="Ver Detalle del Convenio">
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
    const totalPaginas = Math.ceil(totalItems / FILAS_POR_PAGINA_CONVENIOS);
    document.getElementById('registros-info-convenios').textContent = `Mostrando ${totalItems > 0 ? (paginaActual - 1) * FILAS_POR_PAGINA_CONVENIOS + 1 : 0} a ${Math.min(paginaActual * FILAS_POR_PAGINA_CONVENIOS, totalItems)} de ${totalItems} registros`;
    
    if (totalPaginas <= 1) {
        paginacionContainer.innerHTML = '';
        return;
    }

    let paginacionHTML = '<ul class="pagination mb-0">';
    // ... Lógica completa para dibujar botones de página Anterior, números, y Siguiente ...
    paginacionHTML += '</ul>';
    paginacionContainer.innerHTML = paginacionHTML;

    // Agregar listeners a los nuevos botones de paginación
}

// --- MODALES Y ACCIONES CRUD (OPERATIVO) ---
function abrirModalNuevoConvenio() {
    document.getElementById('formNuevoConvenio').reset();
    const select = document.getElementById('convenioResidente');
    select.innerHTML = '<option value="" disabled selected>Seleccione un residente...</option>' + 
        residentesData.map(r => `<option value="${r.N_Parcela}|${r.Nombre_Completo}">${r.N_Parcela} - ${r.Nombre_Completo}</option>`).join('');
    document.getElementById('resumenCalculoCuota').textContent = 'Ingrese los datos para calcular el valor de la cuota.';
    modalNuevoConvenio.show();
}

function calcularValorCuotaPreview() {
    const deuda = parseFloat(document.getElementById('convenioDeudaTotal').value) || 0;
    const cuotas = parseInt(document.getElementById('convenioCuotas').value) || 0;
    if (deuda > 0 && cuotas > 0) {
        const valorCuota = Math.round(deuda / cuotas);
        document.getElementById('resumenCalculoCuota').innerHTML = `Se generarán <strong>${cuotas} cuotas</strong> de <strong>$${valorCuota.toLocaleString('es-CL')}</strong> cada una.`;
    } else {
        document.getElementById('resumenCalculoCuota').textContent = 'Ingrese los datos para calcular el valor de la cuota.';
    }
}

async function guardarConvenio(event) {
    event.preventDefault();
    showSpinner();

    try {
        const residenteInfo = document.getElementById('convenioResidente').value.split('|');
        const nParcela = residenteInfo[0];
        const residenteNombre = residenteInfo[1];
        const deudaTotal = parseFloat(document.getElementById('convenioDeudaTotal').value);
        const nCuotas = parseInt(document.getElementById('convenioCuotas').value);
        const fechaInicioStr = document.getElementById('convenioFechaInicio').value;

        const idConvenio = `CONV-${Date.now().toString().slice(-6)}`;
        const valorCuota = Math.round(deudaTotal / nCuotas);

        const filaConvenio = [[
            idConvenio, nParcela, residenteNombre, deudaTotal, nCuotas, valorCuota,
            deudaTotal, new Date().toLocaleDateString('es-CL'), 'Activo',
            document.getElementById('convenioObservaciones').value
        ]];
        
        const filasCuotas = [];
        const fechaInicio = new Date(fechaInicioStr + 'T12:00:00Z'); 
        for (let i = 1; i <= nCuotas; i++) {
            const idCuota = `CUO-${idConvenio.slice(-6)}-${i}`;
            const fechaVencimiento = new Date(fechaInicio);
            fechaVencimiento.setUTCMonth(fechaVencimiento.getUTCMonth() + i - 1);
            
            filasCuotas.push([
                idCuota, idConvenio, i, valorCuota, 
                fechaVencimiento.toLocaleDateString('es-CL'), 'Pendiente', 0, ''
            ]);
        }

        await appendSheetData('Convenios', filaConvenio);
        await appendSheetData('Cuotas_Convenio', filasCuotas);
        
        modalNuevoConvenio.hide();
        await cargarDatosConvenios(); // Recargar todo para ver el nuevo convenio
        mostrarMensaje(`Convenio ${idConvenio} creado con éxito.`, "success");

    } catch (error) {
        console.error("Error al guardar el convenio:", error);
        mostrarMensaje("Error al guardar en Google Sheets. Revise la consola (F12).", "error");
    } finally {
        hideSpinner();
    }
}
