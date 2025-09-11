// =================================================================
//      FUNCIÓN AUXILIAR PARA LIMPIAR TEXTO EN HTML
// =================================================================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (match) {
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
let conveniosUnificados = []; // Datos combinados para fácil acceso
let conveniosFiltrados = [];
const FILAS_POR_PAGINA_CONVENIOS = 10;

let modalNuevoConvenio = null;
let modalDetalleConvenio = null;

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
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-search"></i></span>
              <input id="filtroBusquedaConvenio" type="text" class="form-control" placeholder="Buscar por parcela, residente o ID">
            </div>
          </div>
          <div class="col-md-3">
            <select id="filtroEstadoConvenio" class="form-select">
              <option value="">Todos los estados</option>
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
            <tbody id="tabla-convenios-body"></tbody>
          </table>
        </div>

        <div id="paginacion-convenios-container" class="d-flex justify-content-between align-items-center mt-3">
          <span id="registros-info-convenios"></span>
          <nav id="paginacion-convenios"></nav>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVO CONVENIO -->
    <div class="modal fade" id="modalNuevoConvenio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Crear Nuevo Convenio de Pago</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="formNuevoConvenio">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Residente (Parcela)</label>
                  <!-- Cambiado a input + datalist para escribir o elegir -->
                  <input id="convenioResidente" class="form-control" list="listaParcelas" placeholder="Escribe el N° de parcela o elige de la lista" required>
                  <datalist id="listaParcelas"></datalist>
                  <small class="text-muted">Puedes escribir el N° de parcela y presionar Enter.</small>
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

    <!-- MODAL DETALLE CONVENIO -->
    <div class="modal fade" id="modalDetalleConvenio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="detalleConvenioTitulo">Detalle del Convenio</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="detalleConvenioBody"></div>
        </div>
      </div>
    </div>
  `;

  // CARGA DE DATOS
  try {
    showSpinner && showSpinner();

    // Cargar convenios, cuotas y residentes en paralelo
    [conveniosData, cuotasData, residentesData] = await Promise.all([
      obtenerConvenios(),
      obtenerCuotasConvenio(),
      obtenerResidentes()
    ]);

    procesarYUnirDatos();
    aplicarFiltrosConvenios();
  } catch (err) {
    console.error(err);
    mostrarMensaje && mostrarMensaje('No se pudieron cargar los datos de convenios.', 'error');
  } finally {
    hideSpinner && hideSpinner();
  }

  // Instanciar/renovar modales
  const modalNuevoElement = document.getElementById('modalNuevoConvenio');
  const modalDetalleElement = document.getElementById('modalDetalleConvenio');

  if (modalNuevoElement) {
    modalNuevoConvenio = new bootstrap.Modal(modalNuevoElement, {
      backdrop: true, keyboard: true, focus: true
    });
  }
  if (modalDetalleElement) {
    modalDetalleConvenio = new bootstrap.Modal(modalDetalleElement, {
      backdrop: true, keyboard: true, focus: true
    });
  }

  // Listeners
  const filtroBusqueda = document.getElementById('filtroBusquedaConvenio');
  const filtroEstado = document.getElementById('filtroEstadoConvenio');
  const btnAbrirModal = document.getElementById('btnAbrirModalNuevoConvenio');
  const formNuevoConvenio = document.getElementById('formNuevoConvenio');

  filtroBusqueda && filtroBusqueda.addEventListener('input', aplicarFiltrosConvenios);
  filtroEstado && filtroEstado.addEventListener('change', aplicarFiltrosConvenios);
  btnAbrirModal && btnAbrirModal.addEventListener('click', abrirModalNuevoConvenio);
  formNuevoConvenio && formNuevoConvenio.addEventListener('submit', guardarConvenio);

  // Preview de cálculo de cuota
  const deudaInput = document.getElementById('convenioDeudaTotal');
  const cuotasInput = document.getElementById('convenioCuotas');
  deudaInput && deudaInput.addEventListener('input', calcularValorCuotaPreview);
  cuotasInput && cuotasInput.addEventListener('input', calcularValorCuotaPreview);
}

// --- UNIFICACIÓN DE DATOS PARA TABLA/DETALLE ---
function procesarYUnirDatos() {
  if (!residentesData) residentesData = [];
  if (!conveniosData) conveniosData = [];
  if (!cuotasData) cuotasData = [];

  // Mapa: N_Parcela (col D = index 3) -> [Nombres (col B = index 1)]
  const residentesMap = new Map();
  residentesData.forEach(r => {
    const nParcela = r && r[3];
    const nombre = r && r[1];
    if (nParcela && nombre) {
      if (!residentesMap.has(nParcela)) residentesMap.set(nParcela, []);
      residentesMap.get(nParcela).push(nombre);
    }
  });

  conveniosUnificados = conveniosData.map(convenio => {
    if (!convenio || !convenio[0]) return null;

    const idConvenio = convenio[0];
    const nParcelaConvenio = convenio[1];
    const estadoConvenio = convenio[7] || 'Activo';

    const residentesNombres = residentesMap.get(nParcelaConvenio) || ['Residente no encontrado'];
    const cuotasDelConvenio = cuotasData.filter(c => c && c[1] === idConvenio);
    const cuotasPendientes = cuotasDelConvenio.filter(c => c && c[8] !== 'Pagado');
    const saldoPendiente = cuotasPendientes.reduce((sum, c) => sum + parseFloat(c[5] || 0), 0);

    let estadoCalculado = estadoConvenio;
    if (estadoCalculado === 'Activo') {
      if (saldoPendiente === 0 && cuotasDelConvenio.length > 0) {
        estadoCalculado = 'Pagado';
      } else {
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const hayVencidas = cuotasPendientes.some(c => {
          const f = new Date(c[3]);
          f.setHours(0, 0, 0, 0);
          return f < hoy;
        });
        if (hayVencidas) estadoCalculado = 'Atrasado';
      }
    }

    return {
      ID_Convenio: idConvenio,
      N_Parcela: nParcelaConvenio,
      Nombre_Residente: escapeHTML(residentesNombres.join(', ')),
      Deuda_Original: convenio[3] || 0,
      N_Cuotas: convenio[4] || 0,
      Valor_Cuota: convenio[5] || 0,
      Saldo_Pendiente_Calculado: saldoPendiente,
      Estado_Calculado: estadoCalculado,
      Cuotas_Asociadas: cuotasDelConvenio
    };
  }).filter(Boolean);

  conveniosFiltrados = [...conveniosUnificados];
  renderizarTablaConvenios(1);
}

function aplicarFiltrosConvenios() {
  const txt = (document.getElementById('filtroBusquedaConvenio')?.value || '').toLowerCase().trim();
  const estado = (document.getElementById('filtroEstadoConvenio')?.value || '').trim();

  conveniosFiltrados = conveniosUnificados.filter(c => {
    const coincideTexto =
      c.ID_Convenio.toLowerCase().includes(txt) ||
      String(c.N_Parcela).toLowerCase().includes(txt) ||
      c.Nombre_Residente.toLowerCase().includes(txt);
    const coincideEstado = !estado || c.Estado_Calculado === estado;
    return coincideTexto && coincideEstado;
  });

  renderizarTablaConvenios(1);
}

function renderizarTablaConvenios(pagina = 1) {
  const tbody = document.getElementById('tabla-convenios-body');
  if (!tbody) return;

  const inicio = (pagina - 1) * FILAS_POR_PAGINA_CONVENIOS;
  const fin = inicio + FILAS_POR_PAGINA_CONVENIOS;
  const pageItems = conveniosFiltrados.slice(inicio, fin);

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">No hay convenios que coincidan con la búsqueda.</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(c => {
      const estadoClass = { 'Activo': 'success', 'Atrasado': 'danger', 'Pagado': 'primary', 'Anulado': 'secondary' }[c.Estado_Calculado] || 'light';
      return `
        <tr>
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

  // Listeners de acciones por fila
  document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.getAttribute('data-id');
      abrirModalDetalle(id);
    });
  });
}

function renderizarPaginacionConvenios(total, paginaActual) {
  const paginacionContainer = document.getElementById('paginacion-convenios');
  const infoContainer = document.getElementById('registros-info-convenios');
  if (!paginacionContainer || !infoContainer) return;

  const totalPaginas = Math.max(1, Math.ceil(total / FILAS_POR_PAGINA_CONVENIOS));
  const desde = total ? (paginaActual - 1) * FILAS_POR_PAGINA_CONVENIOS + 1 : 0;
  const hasta = Math.min(paginaActual * FILAS_POR_PAGINA_CONVENIOS, total);
  infoContainer.textContent = `Mostrando ${desde}-${hasta} de ${total}`;

  let html = `<ul class="pagination pagination-sm mb-0">`;
  for (let i = 1; i <= totalPaginas; i++) {
    html += `<li class="page-item ${i === paginaActual ? 'active' : ''}">
      <a class="page-link" href="#" onclick="event.preventDefault(); renderizarTablaConvenios(${i});">${i}</a>
    </li>`;
  }
  html += `</ul>`;
  paginacionContainer.innerHTML = html;
}

// --- MANEJO DE MODALES ---
function abrirModalNuevoConvenio() {
  // Limpia y reinicia el formulario
  const form = document.getElementById('formNuevoConvenio');
  form && form.reset();

  // Poblar datalist con residentes (sin filtrar por “Contacto Principal”)
  const datalist = document.getElementById('listaParcelas');
  if (!datalist) {
    console.error("No se encontró <datalist id='listaParcelas'>.");
    return;
  }

  // Tomamos: D (index 3) = N_Parcela, B (index 1) = Nombre_Completo
  const items = (residentesData || [])
    .filter(r => r && r.length >= 4 && r[3])
    .map(r => ({
      parcela: String(r[3]).trim(),
      nombre: String(r[1] || 'Sin nombre').trim()
    }))
    .sort((a, b) => Number(a.parcela) - Number(b.parcela));

  datalist.innerHTML = items.map(it =>
    `<option value="${it.parcela}">${it.parcela} - ${escapeHTML(it.nombre)}</option>`
  ).join('');

  const resumenDiv = document.getElementById('resumenCalculoCuota');
  if (resumenDiv) resumenDiv.textContent = 'Ingrese los datos para calcular el valor de la cuota.';

  // Abre modal (timeout evita backdrop duplicado)
  setTimeout(() => {
    modalNuevoConvenio && modalNuevoConvenio.show();
  }, 30);
}

function calcularValorCuotaPreview() {
  const deuda = parseFloat(document.getElementById('convenioDeudaTotal')?.value) || 0;
  const cuotas = parseInt(document.getElementById('convenioCuotas')?.value) || 0;
  const resumenDiv = document.getElementById('resumenCalculoCuota');
  if (!resumenDiv) return;

  if (deuda > 0 && cuotas > 0) {
    const valorCuota = Math.round(deuda / cuotas);
    resumenDiv.innerHTML = `Se generarán <strong>${cuotas} cuotas</strong> de <strong>$${valorCuota.toLocaleString('es-CL')}</strong> cada una.`;
  } else {
    resumenDiv.textContent = 'Ingrese los datos para calcular el valor de la cuota.';
  }
}

function abrirModalDetalle(convenioId) {
  // Limpiar backdrops existentes por si cambiaste de módulo antes
  document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
  document.body.classList.remove('modal-open');

  const convenio = conveniosUnificados.find(c => c.ID_Convenio === convenioId);
  if (!convenio) return;

  const tituloElement = document.getElementById('detalleConvenioTitulo');
  tituloElement && (tituloElement.innerHTML = `Detalle del Convenio <span class="badge text-bg-dark">${convenio.ID_Convenio}</span>`);

  const cuotasHtml = (convenio.Cuotas_Asociadas.length > 0
    ? convenio.Cuotas_Asociadas.map(cuota => {
      const estadoClass = { 'Pagado': 'success', 'Pendiente': 'warning', 'Atrasado': 'danger' }[cuota[8]] || 'light';
      return `
        <tr>
          <td>${cuota[2]}</td>
          <td>${new Date(cuota[3]).toLocaleDateString('es-CL')}</td>
          <td>$${parseFloat(cuota[5] || 0).toLocaleString('es-CL')}</td>
          <td><span class="badge text-bg-${estadoClass}">${cuota[8] || 'Pendiente'}</span></td>
          <td class="text-center">
            ${cuota[8] === 'Pagado' ? '<span class="text-muted">—</span>' : `<button class="btn btn-sm btn-outline-success" onclick="registrarPagoCuotaSimulado('${cuota[0]}','${convenio.ID_Convenio}')"><i class="fas fa-dollar-sign"></i> Registrar Pago</button>`}
          </td>
        </tr>`;
    }).join('')
    : `<tr><td colspan="5" class="text-center py-3">No hay cuotas registradas para este convenio.</td></tr>`
  );

  const body = document.getElementById('detalleConvenioBody');
  if (!body) return;

  body.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h5>Información General</h5>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>N° Parcela:</strong><span>${convenio.N_Parcela}</span></li>
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Residente:</strong><span>${convenio.Nombre_Residente}</span></li>
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Deuda Original:</strong><span>$${parseFloat(convenio.Deuda_Original).toLocaleString('es-CL')}</span></li>
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>N° de Cuotas:</strong><span>${convenio.N_Cuotas}</span></li>
        </ul>
      </div>
      <div class="col-md-6">
        <h5>Resumen Financiero</h5>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Valor Cuota:</strong><span>$${parseFloat(convenio.Valor_Cuota).toLocaleString('es-CL')}</span></li>
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Saldo Pendiente:</strong><span>$${parseFloat(convenio.Saldo_Pendiente_Calculado).toLocaleString('es-CL')}</span></li>
          <li class="list-group-item d-flex justify-content-between align-items-center"><strong>Estado Actual:</strong><span class="badge text-bg-${{ 'Activo': 'success', 'Atrasado': 'danger', 'Pagado': 'primary', 'Anulado': 'secondary' }[convenio.Estado_Calculado] || 'light'}">${convenio.Estado_Calculado}</span></li>
        </ul>
      </div>
    </div>

    <h5 class="mt-4">Plan de Pagos</h5>
    <div class="table-responsive">
      <table class="table table-sm table-bordered">
        <thead class="table-light">
          <tr><th>N° Cuota</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th class="text-center">Acción</th></tr>
        </thead>
        <tbody>${cuotasHtml}</tbody>
      </table>
    </div>
  `;

  setTimeout(() => modalDetalleConvenio && modalDetalleConvenio.show(), 20);
}

// --- ACCIONES (GUARDAR, ACTUALIZAR) ---
async function guardarConvenio(event) {
  event.preventDefault();
  if (!confirm("¿Está seguro que desea crear este nuevo convenio? Esta acción no se puede deshacer.")) return;

  showSpinner && showSpinner();

  try {
    const nParcela = (document.getElementById('convenioResidente').value || '').trim();
    const deudaTotal = parseFloat(document.getElementById('convenioDeudaTotal').value);
    const nCuotas = parseInt(document.getElementById('convenioCuotas').value);
    const fechaInicioStr = document.getElementById('convenioFechaInicio').value;

    // Validaciones
    if (!/^\d+$/.test(nParcela)) {
      throw new Error('Ingresa un N° de parcela válido (solo números).');
    }
    if (!deudaTotal || deudaTotal <= 0) {
      throw new Error('Ingresa una deuda total válida (> 0).');
    }
    if (!nCuotas || nCuotas <= 0) {
      throw new Error('Ingresa un número de cuotas válido (> 0).');
    }
    if (!fechaInicioStr) {
      throw new Error('Selecciona una fecha de inicio válida.');
    }

    // (Opcional pero útil) Verificar que la parcela exista en "Residentes"
    const existeParcela = (residentesData || []).some(r => String(r?.[3]).trim() === nParcela);
    if (!existeParcela) {
      throw new Error(`La parcela ${nParcela} no existe en la hoja "Residentes".`);
    }

    const idConvenio = `C-${nParcela}-${Date.now().toString().slice(-5)}`;
    const valorCuota = Math.round(deudaTotal / nCuotas);

    // Fila de convenios (ajusta columnas a tu esquema actual)
    const filaConvenio = [[
      idConvenio,           // 0 ID Convenio
      nParcela,             // 1 N° Parcela
      new Date().toLocaleDateString('es-CL'), // 2 Fecha creación
      deudaTotal,           // 3 Deuda Original
      nCuotas,              // 4 N° Cuotas
      valorCuota,           // 5 Valor Cuota
      0,                    // 6 Pagado_Acumulado
      'Activo',             // 7 Estado
      deudaTotal,           // 8 Saldo Inicial
      ''                    // 9 Observaciones / libre
    ]];

    // Generar filas de cuotas
    const filasCuotas = [];
    const fechaInicio = new Date(fechaInicioStr + 'T12:00:00Z');
    for (let i = 1; i <= nCuotas; i++) {
      const idCuota = `Q-${idConvenio}-${i}`;
      const f = new Date(fechaInicio);
      f.setMonth(f.getMonth() + (i - 1));

      filasCuotas.push([
        idCuota,            // 0 ID_Cuota
        idConvenio,         // 1 ID_Convenio
        i,                  // 2 N° Cuota
        f.toISOString().slice(0, 10), // 3 Vencimiento (YYYY-MM-DD)
        0,                  // 4 Monto Pagado
        valorCuota,         // 5 Monto a Pagar
        '',                 // 6 Fecha Pago
        valorCuota,         // 7 Saldo_Cuota
        'Pendiente'         // 8 Estado
      ]);
    }

    // Persistir (usa tus funciones existentes que escriben a Sheets)
    await Promise.all([
      agregarConvenio(filaConvenio),           // Debe añadir 1 fila a hoja Convenios
      agregarCuotasConvenio(filasCuotas)       // Debe añadir N filas a hoja Cuotas
    ]);

    mostrarMensaje && mostrarMensaje('Convenio creado correctamente.', 'success');

    // Refrescar datos en memoria
    [conveniosData, cuotasData] = await Promise.all([
      obtenerConvenios(),
      obtenerCuotasConvenio()
    ]);
    procesarYUnirDatos();
    aplicarFiltrosConvenios();

    // Cerrar modal
    modalNuevoConvenio && modalNuevoConvenio.hide();
  } catch (err) {
    console.error(err);
    mostrarMensaje && mostrarMensaje(err.message || 'No se pudo guardar el convenio.', 'error');
  } finally {
    hideSpinner && hideSpinner();
  }
}

// SIMULADOR de pago de cuota (ajusta si ya tienes backend real)
function registrarPagoCuotaSimulado(cuotaId, convenioId) {
  const idx = cuotasData.findIndex(c => c && c[0] === cuotaId);
  if (idx === -1) {
    mostrarMensaje && mostrarMensaje('No se encontró la cuota seleccionada.', 'error');
    return;
  }

  const cuotaOriginal = cuotasData[idx];
  if (cuotaOriginal[8] !== 'Pagado') {
    cuotaOriginal[4] = cuotaOriginal[5];             // Monto Pagado = Monto a Pagar
    cuotaOriginal[6] = new Date().toISOString().slice(0, 10); // Fecha Pago = hoy
    cuotaOriginal[7] = 0;                            // Saldo_Cuota = 0
    cuotaOriginal[8] = 'Pagado';                     // Estado = Pagado
  }

  procesarYUnirDatos();
  aplicarFiltrosConvenios();

  // Refrescar modal
  if (modalDetalleConvenio) modalDetalleConvenio.hide();
  abrirModalDetalle(convenioId);
  mostrarMensaje && mostrarMensaje(`Pago de la cuota ${cuotaId} registrado (simulado).`, 'info');
}
