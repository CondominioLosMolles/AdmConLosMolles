// =================================================================
//      MÓDULO PROFESIONAL DE GESTIÓN DE CONVENIOS
//      Diseñado para Condominio Los Molles
// =================================================================

// Variables globales para almacenar los datos del módulo
let todosLosConvenios = [];
let todasLasCuotas = [];
let todosLosResidentes = []; // Para los formularios

// --- FUNCIÓN PRINCIPAL DE CARGA DEL MÓDULO ---
async function cargarConvenios() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="card shadow-sm">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h2 class="h4 mb-0">Gestión de Convenios de Pago</h2>
                <button id="btnNuevoConvenio" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i>Nuevo Convenio
                </button>
            </div>
            <div class="card-body">
                <div class="row mb-3">
                    <div class="col-md-6">
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
                                <th>ID Convenio</th>
                                <th>N° Parcela</th>
                                <th>Residente</th>
                                <th>Deuda Original</th>
                                <th>Cuotas</th>
                                <th>Saldo Pendiente</th>
                                <th>Estado</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-convenios-body">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalDetalleConvenio" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalle del Convenio <span id="detalleConvenioId" class="badge bg-secondary"></span></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="infoResidenteConvenio" class="mb-3"></div>
                        <h6>Plan de Pagos</h6>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>N° Cuota</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tabla-cuotas-body"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        `;

    // Adjuntar los event listeners a los nuevos elementos
    inicializarComponentesConvenios();

    // Cargar los datos desde Google Sheets
    await cargarDatosConvenios();
}

// --- FUNCIONES DE INICIALIZACIÓN Y EVENTOS ---
function inicializarComponentesConvenios() {
    document.getElementById('filtroBusquedaConvenio').addEventListener('input', aplicarFiltrosConvenios);
    document.getElementById('filtroEstadoConvenio').addEventListener('change', aplicarFiltrosConvenios);

    // Evento para el botón de nuevo convenio (se implementaría el modal)
    document.getElementById('btnNuevoConvenio').addEventListener('click', () => {
        alert("Aquí se abriría el modal para crear un nuevo convenio.");
    });
}

// --- FUNCIONES DE MANEJO DE DATOS (LECTURA) ---
async function cargarDatosConvenios() {
    showSpinner();
    try {
        const [dataConvenios, dataCuotas, dataResidentes] = await Promise.all([
            getSheetData('Convenios'),
            getSheetData('CuotasConvenios'),
            getSheetData('Residentes') // Asumiendo que tienes una hoja de Residentes
        ]);

        todosLosConvenios = dataConvenios;
        todasLasCuotas = dataCuotas;
        todosLosResidentes = dataResidentes;

        // Procesar datos para calcular saldos y estados
        procesarDatosConvenios();
        
        // Renderizar la tabla inicial
        renderizarTablaConvenios(todosLosConvenios);

    } catch (error) {
        console.error("Error al cargar datos de convenios:", error);
        mostrarMensaje("Error al cargar los datos desde Google Sheets.", "error");
    } finally {
        hideSpinner();
    }
}

function procesarDatosConvenios() {
    const hoy = new Date();
    todosLosConvenios.forEach(convenio => {
        const cuotasDelConvenio = todasLasCuotas.filter(c => c.ID_Convenio === convenio.ID_Convenio);
        let saldo = 0;
        let tieneCuotasAtrasadas = false;

        cuotasDelConvenio.forEach(cuota => {
            if (cuota.Estado === 'Pendiente') {
                saldo += parseFloat(cuota.Monto_Cuota);
                const fechaVencimiento = new Date(cuota.Fecha_Vencimiento);
                if (fechaVencimiento < hoy) {
                    tieneCuotasAtrasadas = true;
                }
            }
        });

        convenio.Saldo_Pendiente_Calculado = saldo;
        if (convenio.Estado === 'Activo' && tieneCuotasAtrasadas) {
            convenio.Estado_Calculado = 'Atrasado';
        } else {
            convenio.Estado_Calculado = convenio.Estado;
        }
    });
}

// --- FUNCIONES DE RENDERIZADO (DIBUJAR EN PANTALLA) ---
function renderizarTablaConvenios(datos) {
    const tbody = document.getElementById('tabla-convenios-body');
    if (!tbody) return;

    if (!datos || datos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No se encontraron convenios.</td></tr>';
        return;
    }

    tbody.innerHTML = datos.map(convenio => {
        let estadoClass = '';
        switch (convenio.Estado_Calculado) {
            case 'Activo': estadoClass = 'text-bg-success'; break;
            case 'Atrasado': estadoClass = 'text-bg-danger'; break;
            case 'Pagado': estadoClass = 'text-bg-info'; break;
            case 'Anulado': estadoClass = 'text-bg-secondary'; break;
            default: estadoClass = 'text-bg-light';
        }

        return `
            <tr>
                <td>${convenio.ID_Convenio}</td>
                <td>${convenio.N_Parcela}</td>
                <td>${convenio.Residente}</td>
                <td>$${parseFloat(convenio.Deuda_Original).toLocaleString('es-CL')}</td>
                <td>${convenio.N_Cuotas}</td>
                <td>$${parseFloat(convenio.Saldo_Pendiente_Calculado).toLocaleString('es-CL')}</td>
                <td><span class="badge ${estadoClass}">${convenio.Estado_Calculado}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="verDetalleConvenio('${convenio.ID_Convenio}')">
                        <i class="fas fa-eye"></i> Ver Detalle
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function aplicarFiltrosConvenios() {
    const texto = document.getElementById('filtroBusquedaConvenio').value.toLowerCase();
    const estado = document.getElementById('filtroEstadoConvenio').value;

    const datosFiltrados = todosLosConvenios.filter(convenio => {
        const busquedaCoincide = convenio.N_Parcela.toLowerCase().includes(texto) || convenio.Residente.toLowerCase().includes(texto);
        const estadoCoincide = estado ? convenio.Estado_Calculado === estado : true;
        return busquedaCoincide && estadoCoincide;
    });

    renderizarTablaConvenios(datosFiltrados);
}

// --- FUNCIONES DE INTERACCIÓN (MODALES, ETC.) ---
function verDetalleConvenio(idConvenio) {
    const convenio = todosLosConvenios.find(c => c.ID_Convenio === idConvenio);
    const cuotas = todasLasCuotas.filter(c => c.ID_Convenio === idConvenio).sort((a,b) => a.N_Cuota - b.N_Cuota);

    document.getElementById('detalleConvenioId').textContent = idConvenio;
    document.getElementById('infoResidenteConvenio').innerHTML = `
        <p><strong>Residente:</strong> ${convenio.Residente} (Parcela ${convenio.N_Parcela})</p>
        <p><strong>Observaciones:</strong> ${convenio.Observaciones || 'Sin observaciones'}</p>
    `;

    const tablaCuotasBody = document.getElementById('tabla-cuotas-body');
    tablaCuotasBody.innerHTML = cuotas.map(cuota => {
        let estadoCuotaClass = '';
        if (cuota.Estado === 'Pagada') estadoCuotaClass = 'text-bg-success';
        else if (cuota.Estado === 'Pendiente' && new Date(cuota.Fecha_Vencimiento) < new Date()) estadoCuotaClass = 'text-bg-danger';
        else if (cuota.Estado === 'Pendiente') estadoCuotaClass = 'text-bg-warning';
        else estadoCuotaClass = 'text-bg-secondary';

        const hoy = new Date().toISOString().split('T')[0];

        return `
            <tr>
                <td>${cuota.N_Cuota} de ${convenio.N_Cuotas}</td>
                <td>${cuota.Fecha_Vencimiento}</td>
                <td>$${parseFloat(cuota.Monto_Cuota).toLocaleString('es-CL')}</td>
                <td><span class="badge ${estadoCuotaClass}">${cuota.Estado}</span></td>
                <td>
                    ${cuota.Estado === 'Pendiente' ? `<button class="btn btn-sm btn-success" onclick="registrarPagoCuota('${cuota.ID_Cuota}', '${idConvenio}', '${cuota.Monto_Cuota}', '${hoy}')">Registrar Pago</button>` : `Pagada el ${cuota.Fecha_Pago || ''}`}
                </td>
            </tr>
        `;
    }).join('');

    const modal = new bootstrap.Modal(document.getElementById('modalDetalleConvenio'));
    modal.show();
}

async function registrarPagoCuota(idCuota, idConvenio, monto, fecha) {
    if (!confirm(`¿Confirmas el pago de $${parseFloat(monto).toLocaleString('es-CL')} para la cuota ${idCuota}?`)) {
        return;
    }
    showSpinner();
    try {
        // 1. Encontrar la fila de la cuota para actualizar
        const filaCuota = todasLasCuotas.findIndex(c => c.ID_Cuota === idCuota) + 2; // +2 por header y 0-index

        // 2. Preparar los datos a actualizar
        const datosActualizar = [
            ['Pagada', monto, fecha, 'Transferencia'] // Estado, Monto_Pagado, Fecha_Pago, Metodo_Pago
        ];

        // 3. Llamar a la función de la API para actualizar la hoja
        await updateSheetData(`CuotasConvenios!F${filaCuota}`, datosActualizar);

        // Opcional: Recalcular y actualizar el Saldo_Pendiente en la hoja Convenios
        
        mostrarMensaje("Pago registrado con éxito", "success");
        bootstrap.Modal.getInstance(document.getElementById('modalDetalleConvenio')).hide();
        await cargarDatosConvenios(); // Recargar todos los datos
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        mostrarMensaje("Error al registrar el pago en Google Sheets.", "error");
    } finally {
        hideSpinner();
    }
}
