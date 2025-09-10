// =================================================================
//      MÓDULO DE GESTIÓN DE CONVENIOS (VERSIÓN PROFESIONAL)
//      Diseño basado en el módulo de Gastos Comunes
// =================================================================

// --- VARIABLES GLOBALES DEL MÓDULO ---
let conveniosData = [];
let cuotasData = [];
let residentesData = [];
let conveniosFiltrados = [];
const FILAS_POR_PAGINA = 10;

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
                <div id="paginacion-convenios" class="d-flex justify-content-end"></div>
            </div>
        </div>

        <div class="modal fade" id="modalNuevoConvenio" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Crear Nuevo Convenio</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formNuevoConvenio">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Residente</label>
                                    <select id="convenioResidente" class="form-select" required></select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Deuda Total ($)</label>
                                    <input type="number" id="convenioDeudaTotal" class="form-control" required>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Número de Cuotas</label>
                                    <input type="number" id="convenioCuotas" class="form-control" required min="1">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Fecha Primera Cuota</label>
                                    <input type="date" id="convenioFechaInicio" class="form-control" required>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Observaciones</label>
                                <textarea id="convenioObservaciones" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="text-end">
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
    document.getElementById('filtroBusquedaConvenio').addEventListener('input', aplicarFiltrosConvenios);
    document.getElementById('filtroEstadoConvenio').addEventListener('change', aplicarFiltrosConvenios);
    document.getElementById('btnAbrirModalNuevoConvenio').addEventListener('click', abrirModalNuevoConvenio);
    document.getElementById('formNuevoConvenio').addEventListener('submit', guardarConvenio);
}

// --- MANEJO DE DATOS (CONEXIÓN CON GOOGLE SHEETS) ---
async function cargarDatosConvenios() {
    showSpinner();
    try {
        [conveniosData, cuotasData, residentesData] = await Promise.all([
            getSheetData('Convenios'),
            getSheetData('CuotasConvenios'),
            getSheetData('Residentes')
        ]);
        procesarConvenios();
        aplicarFiltrosConvenios();
    } catch (error) {
        console.error("Error cargando datos:", error);
        mostrarMensaje("Error al cargar datos desde Google Sheets.", "error");
    } finally {
        hideSpinner();
    }
}

function procesarConvenios() {
    conveniosData.forEach(convenio => {
        const cuotasDelConvenio = cuotasData.filter(c => c.ID_Convenio === convenio.ID_Convenio && c.Estado === 'Pendiente');
        convenio.Saldo_Pendiente_Calculado = cuotasDelConvenio.reduce((sum, cuota) => sum + parseFloat(cuota.Monto_Cuota), 0);
        
        const tieneAtraso = cuotasDelConvenio.some(c => new Date(c.Fecha_Vencimiento) < new Date());
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

    conveniosFiltrados = conveniosData.filter(c => {
        const busqueda = c.N_Parcela.toLowerCase().includes(texto) || c.Residente.toLowerCase().includes(texto);
        const filtroEstado = estado ? c.Estado_Calculado === estado : true;
        return busqueda && filtroEstado;
    });
    renderizarTablaConvenios(1);
}

function renderizarTablaConvenios(pagina) {
    const tbody = document.getElementById('tabla-convenios-body');
    const inicio = (pagina - 1) * FILAS_POR_PAGINA;
    const fin = inicio + FILAS_POR_PAGINA;
    const conveniosPaginados = conveniosFiltrados.slice(inicio, fin);

    if (conveniosPaginados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay registros que coincidan con los filtros.</td></tr>';
    } else {
        tbody.innerHTML = conveniosPaginados.map(c => {
            // ... Lógica de clases de estado ...
            return `<tr>
                        <td>${c.ID_Convenio}</td>
                        <td>${c.N_Parcela}</td>
                        <td>${c.Residente}</td>
                        <td>$${parseFloat(c.Deuda_Original).toLocaleString('es-CL')}</td>
                        <td>${c.N_Cuotas}</td>
                        <td>$${parseFloat(c.Saldo_Pendiente_Calculado).toLocaleString('es-CL')}</td>
                        <td><span class="badge text-bg-primary">${c.Estado_Calculado}</span></td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                        </td>
                    </tr>`;
        }).join('');
    }
    renderizarPaginacion(conveniosFiltrados.length, pagina);
}

function renderizarPaginacion(totalItems, paginaActual) {
    const paginacionContainer = document.getElementById('paginacion-convenios');
    const totalPaginas = Math.ceil(totalItems / FILAS_POR_PAGINA);
    // ... Lógica completa para dibujar los botones de paginación ...
    paginacionContainer.innerHTML = `<span class="align-self-center me-3">Página ${paginaActual} de ${totalPaginas}</span>`;
}

// --- MODALES Y ACCIONES CRUD (Crear, Leer, Actualizar) ---
function abrirModalNuevoConvenio() {
    const modalElement = document.getElementById('modalNuevoConvenio');
    const modal = new bootstrap.Modal(modalElement);
    
    document.getElementById('formNuevoConvenio').reset();
    const select = document.getElementById('convenioResidente');
    select.innerHTML = '<option value="">Seleccione un residente...</option>' + 
        residentesData.map(r => `<option value="${r.N_Parcela}|${r.Nombre_Completo}">${r.N_Parcela} - ${r.Nombre_Completo}</option>`).join('');
    
    modal.show();
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

        // 1. Generar ID único para el convenio
        const idConvenio = `CONV-${Date.now()}`;
        const valorCuota = Math.round(deudaTotal / nCuotas);

        // 2. Crear la fila para la hoja "Convenios"
        const filaConvenio = [[
            idConvenio, nParcela, residenteNombre, deudaTotal, nCuotas, valorCuota,
            deudaTotal, new Date().toLocaleDateString('es-CL'), 'Activo',
            document.getElementById('convenioObservaciones').value
        ]];
        
        // 3. Crear las filas para la hoja "CuotasConvenios"
        const filasCuotas = [];
        const fechaInicio = new Date(fechaInicioStr + 'T00:00:00'); // Asegurar zona horaria local
        for (let i = 1; i <= nCuotas; i++) {
            const idCuota = `CUO-${idConvenio}-${i}`;
            const fechaVencimiento = new Date(fechaInicio);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i - 1);
            
            filasCuotas.push([
                idCuota, idConvenio, i, valorCuota, 
                fechaVencimiento.toLocaleDateString('es-CL'), 'Pendiente', 0, ''
            ]);
        }

        // 4. Enviar los datos a Google Sheets
        await appendSheetData('Convenios', filaConvenio);
        await appendSheetData('CuotasConvenios', filasCuotas);
        
        mostrarMensaje("Convenio creado con éxito.", "success");
        bootstrap.Modal.getInstance(document.getElementById('modalNuevoConvenio')).hide();
        await cargarDatosConvenios();

    } catch (error) {
        console.error("Error al guardar el convenio:", error);
        mostrarMensaje("Error al guardar el convenio en Google Sheets.", "error");
    } finally {
        hideSpinner();
    }
}
