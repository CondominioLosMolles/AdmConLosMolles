// =================================================================
//  UTILIDAD: escapeHTML
// =================================================================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#39;'}[m]));
}

// ===============================================================
// 📅 FECHAS ESTABLES (evita corrimientos por zona horaria)
// ===============================================================
function ymdToDisplay(ymd) {                 // "2025-09-01" -> "01-09-2025"
  if (!ymd || typeof ymd !== 'string') return '—';
  const [y,m,d] = ymd.split('-');
  if (!d) return ymd;
  return `${d}-${m}-${y}`;
}

function addMonthsKeepDay(ymd, add) {        // suma meses manteniendo día (capado al fin de mes)
  const [y,m,d] = ymd.split('-').map(Number);
  const base = new Date(y, m - 1, 1);        // primer día del mes (hora local)
  base.setMonth(base.getMonth() + add);
  const Y = base.getFullYear();
  const M = base.getMonth() + 1;
  const last = new Date(Y, M, 0).getDate();
  const D = Math.min(d, last);
  return `${Y}-${String(M).padStart(2,'0')}-${String(D).padStart(2,'0')}`;
}

// =================================================================
//  ESTADO DEL MÓDULO
// =================================================================
let conveniosData = [];
let cuotasData = [];
let residentesData = [];
let conveniosUnificados = [];
let conveniosFiltrados = [];

const FILAS_POR_PAGINA_CONVENIOS = 10;

let modalNuevoConvenio = null;
let modalDetalleConvenio = null;

// =================================================================
//  ENTRY POINT
// =================================================================
async function cargarConvenios() {
  const el = document.getElementById("main-content");
  if (!el) return;

  el.innerHTML = `
    <div class="card shadow-sm">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 class="h4 mb-0">Gestión de Convenios de Pago</h2>
        <button id="btnAbrirModalNuevoConvenio" class="btn btn-primary">
          <i class="fas fa-plus me-2"></i>Nuevo Convenio
        </button>
      </div>
      <div class="card-body">
        <div class="row g-2 mb-3">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-search"></i></span>
              <input id="filtroBusquedaConvenio" class="form-control" placeholder="Buscar por ID, parcela o residente…">
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

        <div class="d-flex justify-content-between align-items-center">
          <small id="registros-info-convenios"></small>
          <nav id="paginacion-convenios"></nav>
        </div>
      </div>
    </div>

    <!-- MODAL NUEVO CONVENIO -->
    <div class="modal fade" id="modalNuevoConvenio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-lg"><div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Crear nuevo convenio</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="formNuevoConvenio" novalidate>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Residente (Parcela)</label>
                <select id="convenioResidente" class="form-select" required>
                  <option value="">Cargando…</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label">Deuda Total ($)</label>
                <input type="number" id="convenioDeudaTotal" class="form-control" min="1" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Número de cuotas</label>
                <input type="number" id="convenioCuotas" class="form-control" min="1" max="120" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Fecha 1er vencimiento</label>
                <input type="date" id="convenioFechaInicio" class="form-control" required>
              </div>
            </div>

            <div class="alert alert-info mt-3" id="resumenCalculoCuota">
              Ingrese los datos para calcular el valor de la cuota.
            </div>

            <div class="text-end">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="submit" class="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      </div></div>
    </div>

    <!-- MODAL DETALLE -->
    <div class="modal fade" id="modalDetalleConvenio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-xl"><div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="detalleConvenioTitulo">Detalle del Convenio</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" id="detalleConvenioBody"></div>
      </div></div>
    </div>
  `;

  // Instanciar modales y listeners
  modalNuevoConvenio   = new bootstrap.Modal(document.getElementById("modalNuevoConvenio"),   {backdrop:true, keyboard:true});
  modalDetalleConvenio = new bootstrap.Modal(document.getElementById("modalDetalleConvenio"), {backdrop:true, keyboard:true});

  document.getElementById("btnAbrirModalNuevoConvenio").addEventListener("click", abrirModalNuevoConvenio);
  document.getElementById("filtroBusquedaConvenio").addEventListener("input", aplicarFiltrosConvenios);
  document.getElementById("filtroEstadoConvenio").addEventListener("change", aplicarFiltrosConvenios);

  ["convenioDeudaTotal","convenioCuotas"].forEach(id=>{
    const el = document.getElementById(id);
    el && el.addEventListener("input", calcularValorCuotaPreview);
  });

  document.getElementById("formNuevoConvenio").addEventListener("submit", guardarConvenio);

  await cargarDatosIniciales();
}

// =================================================================
//  DATOS
// =================================================================
async function cargarDatosIniciales() {
  try {
    showSpinner && showSpinner();
    const [cv, cq, rs] = await Promise.all([
      obtenerConvenios(),        // Hoja "Convenios"
      obtenerCuotasConvenio(),   // Hoja "Cuotas_Convenio"
      obtenerResidentes()        // Hoja "Residentes" -> rango A2:T
    ]);
    conveniosData  = cv || [];
    cuotasData     = cq || [];
    residentesData = rs || [];
    procesarYUnirDatos();
    aplicarFiltrosConvenios();
  } catch (e) {
    console.error(e);
    mostrarMensaje && mostrarMensaje("No se pudieron cargar los datos de Convenios.", "error");
  } finally {
    hideSpinner && hideSpinner();
  }
}

function procesarYUnirDatos() {
  // Mapa: D (index 3) = N_Parcela  |  B (index 1) = Nombre
  const mapRes = new Map();
  (residentesData || []).forEach(r => {
    const par = r?.[3];
    const nom = r?.[1];
    if (par && nom) {
      if (!mapRes.has(par)) mapRes.set(par, []);
      mapRes.get(par).push(String(nom));
    }
  });

  conveniosUnificados = (conveniosData || []).map(row => {
    if (!row) return null;
    const id   = row[0];
    const parc = row[1];
    const deudaOriginal = Number(row[3] || 0);
    const nCuotas = Number(row[4] || 0);
    const valorCuota = Number(row[5] || 0);
    const estadoHoja = row[7] || "Activo";

    const cuotasDelConvenio = (cuotasData || []).filter(c => c?.[1] === id);
    const pendientes = cuotasDelConvenio.filter(c => c?.[8] !== "Pagado");
    const saldoPend = pendientes.reduce((s, c) => s + Number(c?.[7] || c?.[5] || 0), 0);

    // Estado calculado (si hay cuotas vencidas)
    let estado = estadoHoja;
    if (estado === "Activo") {
      if (saldoPend === 0 && cuotasDelConvenio.length) {
        estado = "Pagado";
      } else {
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const vencida = pendientes.some(c => {
          // c[4] = YYYY-MM-DD (lo guardamos así)
          const [yy,mm,dd] = String(c?.[4]||"").split("-").map(Number);
          if (!yy||!mm||!dd) return false;
          const d = new Date(yy, mm-1, dd);
          d.setHours(0,0,0,0);
          return d < hoy;
        });
        if (vencida) estado = "Atrasado";
      }
    }

    return {
      ID_Convenio: id,
      N_Parcela: parc,
      Nombre_Residente: escapeHTML((mapRes.get(parc) || ["—"]).join(", ")),
      Deuda_Original: deudaOriginal,
      N_Cuotas: nCuotas,
      Valor_Cuota: valorCuota,
      Saldo_Pendiente: saldoPend,
      Estado: estado,
      Cuotas: cuotasDelConvenio
    };
  }).filter(Boolean);

  conveniosFiltrados = [...conveniosUnificados];
  renderizarTablaConvenios(1);
}

function aplicarFiltrosConvenios() {
  const txt = (document.getElementById("filtroBusquedaConvenio").value || "").toLowerCase().trim();
  const est = (document.getElementById("filtroEstadoConvenio").value || "").trim();

  conveniosFiltrados = conveniosUnificados.filter(c => {
    const coincideTxt =
      c.ID_Convenio.toLowerCase().includes(txt) ||
      String(c.N_Parcela).toLowerCase().includes(txt) ||
      c.Nombre_Residente.toLowerCase().includes(txt);
    const coincideEst = !est || c.Estado === est;
    return coincideTxt && coincideEst;
  });

  renderizarTablaConvenios(1);
}

function renderizarTablaConvenios(pag = 1) {
  const tbody = document.getElementById("tabla-convenios-body");
  const info  = document.getElementById("registros-info-convenios");
  const nav   = document.getElementById("paginacion-convenios");
  if (!tbody || !info || !nav) return;

  const ini = (pag - 1) * FILAS_POR_PAGINA_CONVENIOS;
  const fin = ini + FILAS_POR_PAGINA_CONVENIOS;
  const items = conveniosFiltrados.slice(ini, fin);

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">No hay convenios que coincidan con la búsqueda.</td></tr>`;
  } else {
    tbody.innerHTML = items.map(c => {
      const badge = {Activo:"success",Atrasado:"danger",Pagado:"primary",Anulado:"secondary"}[c.Estado] || "light";
      return `
        <tr>
          <td><span class="badge text-bg-dark">${c.ID_Convenio}</span></td>
          <td>${c.N_Parcela}</td>
          <td>${c.Nombre_Residente}</td>
          <td>$${Number(c.Deuda_Original).toLocaleString("es-CL")}</td>
          <td>${c.N_Cuotas}</td>
          <td>$${Number(c.Saldo_Pendiente).toLocaleString("es-CL")}</td>
          <td><span class="badge text-bg-${badge}">${c.Estado}</span></td>
          <td class="text-center">
            <button class="btn btn-sm btn-outline-primary btn-ver-detalle" data-id="${c.ID_Convenio}" title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // Paginación
  const total = conveniosFiltrados.length;
  const totalPag = Math.max(1, Math.ceil(total / FILAS_POR_PAGINA_CONVENIOS));
  const desde = total ? ini + 1 : 0;
  const hasta = Math.min(fin, total);
  info.textContent = `Mostrando ${desde}-${hasta} de ${total}`;

  let html = `<ul class="pagination pagination-sm mb-0">`;
  for (let i = 1; i <= totalPag; i++) {
    html += `<li class="page-item ${i===pag?"active":""}">
      <a class="page-link" href="#" onclick="event.preventDefault(); renderizarTablaConvenios(${i});">${i}</a>
    </li>`;
  }
  html += `</ul>`;
  nav.innerHTML = html;

  // Delegación: abrir detalle
  tbody.addEventListener("click", (ev)=>{
    const btn = ev.target.closest(".btn-ver-detalle");
    if (btn) abrirModalDetalle(btn.dataset.id);
  }, {once:true});
}

// =================================================================
//  MODALES
// =================================================================
function abrirModalNuevoConvenio() {
  const form = document.getElementById("formNuevoConvenio");
  form.reset();

  // Poblar SELECT con (D=index 3) N_Parcela y (B=index 1) Nombre
  const sel = document.getElementById("convenioResidente");
  const items = (residentesData || [])
    .filter(r => r && r.length >= 4 && r[3])
    .map(r => ({ parcela: String(r[3]).trim(), nombre: String(r[1] || "Sin nombre").trim() }))
    .sort((a,b) => Number(a.parcela) - Number(b.parcela));

  sel.innerHTML = `<option value="">Seleccione…</option>` + items.map(it =>
    `<option value="${it.parcela}">${it.parcela} - ${escapeHTML(it.nombre)}</option>`
  ).join("");

  const resumen = document.getElementById("resumenCalculoCuota");
  resumen.textContent = "Ingrese los datos para calcular el valor de la cuota.";

  setTimeout(() => modalNuevoConvenio.show(), 20);
}

function calcularValorCuotaPreview() {
  const deuda  = Number(document.getElementById("convenioDeudaTotal").value) || 0;
  const cuotas = Number(document.getElementById("convenioCuotas").value) || 0;
  const div = document.getElementById("resumenCalculoCuota");
  if (!div) return;

  if (deuda > 0 && cuotas > 0) {
    const v = Math.round(deuda / cuotas);
    div.innerHTML = `Se generarán <strong>${cuotas} cuotas</strong> de <strong>$${v.toLocaleString("es-CL")}</strong>.`;
  } else {
    div.textContent = "Ingrese los datos para calcular el valor de la cuota.";
  }
}

function abrirModalDetalle(idConvenio) {
  // Limpia backdrops “fantasma”
  document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
  document.body.classList.remove("modal-open");

  const c = conveniosUnificados.find(x => x.ID_Convenio === idConvenio);
  if (!c) return;

  document.getElementById("detalleConvenioTitulo").innerHTML =
    `Detalle del Convenio <span class="badge text-bg-dark">${c.ID_Convenio}</span>`;

  const tbody = (c.Cuotas && c.Cuotas.length)
    ? c.Cuotas.map(q => {
        const estado = q?.[8] || "Pendiente";
        const badge = { Pagado:"success", Pendiente:"warning", Atrasado:"danger" }[estado] || "light";
        const vence = ymdToDisplay(q?.[4]); // E = Fecha_Vencimiento (YYYY-MM-DD)
        const monto = Number(q?.[5] || 0).toLocaleString("es-CL");

        const btns = `
          <label class="btn btn-sm btn-outline-secondary mb-1">
            Adjuntar comprobante
            <input type="file" accept="image/*,application/pdf" hidden
              onchange="handleAttachComprobante('${q[0]}','${c.N_Parcela}', this.files[0], '${c.ID_Convenio}')">
          </label>
          ${estado === "Pagado"
            ? '<span class="text-muted">—</span>'
            : `<button class="btn btn-sm btn-outline-success" onclick="registrarPagoCuota('${q[0]}','${c.ID_Convenio}')"><i class="fas fa-dollar-sign"></i> Registrar pago</button>`}
        `;

        return `<tr>
          <td>${q?.[2]}</td><td>${vence}</td><td>$${monto}</td>
          <td><span class="badge text-bg-${badge}">${estado}</span></td>
          <td class="text-center">${btns}</td>
        </tr>`;
      }).join("")
    : `<tr><td colspan="5" class="text-center py-3">No hay cuotas registradas.</td></tr>`;

  document.getElementById("detalleConvenioBody").innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h5>Información</h5>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between"><strong>N° Parcela</strong><span>${c.N_Parcela}</span></li>
          <li class="list-group-item d-flex justify-content-between"><strong>Residente</strong><span>${c.Nombre_Residente}</span></li>
          <li class="list-group-item d-flex justify-content-between"><strong>Deuda Original</strong><span>$${c.Deuda_Original.toLocaleString("es-CL")}</span></li>
          <li class="list-group-item d-flex justify-content-between"><strong>N° de cuotas</strong><span>${c.N_Cuotas}</span></li>
        </ul>
      </div>
      <div class="col-md-6">
        <h5>Resumen</h5>
        <ul class="list-group">
          <li class="list-group-item d-flex justify-content-between"><strong>Valor cuota</strong><span>$${c.Valor_Cuota.toLocaleString("es-CL")}</span></li>
          <li class="list-group-item d-flex justify-content-between"><strong>Saldo pendiente</strong><span>$${c.Saldo_Pendiente.toLocaleString("es-CL")}</span></li>
          <li class="list-group-item d-flex justify-content-between"><strong>Estado</strong><span class="badge text-bg-${{Activo:"success",Atrasado:"danger",Pagado:"primary",Anulado:"secondary"}[c.Estado]||"light"}">${c.Estado}</span></li>
        </ul>
      </div>
    </div>

    <h5 class="mt-4">Plan de pagos</h5>
    <div class="table-responsive">
      <table class="table table-sm table-bordered">
        <thead class="table-light"><tr><th>N°</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th class="text-center">Acción</th></tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;

  setTimeout(() => modalDetalleConvenio.show(), 10);
}

// =================================================================
//  GUARDAR CONVENIO
// =================================================================
async function guardarConvenio(evt) {
  evt.preventDefault();
  if (!confirm("¿Crear este convenio?")) return;

  try {
    showSpinner && showSpinner();

    const nParcela  = (document.getElementById("convenioResidente").value || "").trim();
    const deuda     = Number(document.getElementById("convenioDeudaTotal").value);
    const nCuotas   = Number(document.getElementById("convenioCuotas").value);
    const firstYMD  = document.getElementById("convenioFechaInicio").value; // "YYYY-MM-DD"

    // Validaciones
    if (!/^\d+$/.test(nParcela)) throw new Error("Ingresa un N° de parcela válido (solo números).");
    if (!(residentesData || []).some(r => String(r?.[3]).trim() === nParcela)) {
      throw new Error(`La parcela ${nParcela} no existe en la hoja "Residentes".`);
    }
    if (!deuda || deuda <= 0)  throw new Error("Deuda total inválida.");
    if (!nCuotas || nCuotas <= 0) throw new Error("Número de cuotas inválido.");
    if (!firstYMD) throw new Error("Selecciona la fecha de inicio.");

    const idConvenio = `C-${nParcela}-${Date.now().toString().slice(-5)}`;
    const valorCuota = Math.round(deuda / nCuotas);

    // Fila Convenios (ajusta al orden real de tu hoja)
    const filaConvenio = [[
      idConvenio,          // 0 ID_Convenio
      nParcela,            // 1 N_Parcela
      new Date().toLocaleDateString("es-CL"), // 2 Fecha creación (solo visual)
      deuda,               // 3 Deuda_Original
      nCuotas,             // 4 N_Cuotas
      valorCuota,          // 5 Valor_Cuota
      0,                   // 6 Pagado_Acumulado
      "Activo",            // 7 Estado
      deuda,               // 8 Saldo Inicial
      ""                   // 9 Observaciones
    ]];

    // Filas Cuotas — GUARDAMOS YYYY-MM-DD en E (index 4)
    const filasCuotas = [];
    for (let i = 1; i <= nCuotas; i++) {
      const idCuota = `Q-${idConvenio}-${i}`;
      const vencYMD = addMonthsKeepDay(firstYMD, i - 1); // estable

      filasCuotas.push([
        idCuota,        // A  ID_Cuota
        idConvenio,     // B  ID_Convenio
        nParcela,       // C  N_Parcela
        i,              // D  N_Cuota
        vencYMD,        // E  Fecha_Vencimiento (YYYY-MM-DD literal)
        valorCuota,     // F  Monto_Cuota
        0,              // G  Monto_Pagado_Acumulado
        valorCuota,     // H  Saldo_Cuota
        'Pendiente',    // I  Estado
        ''              // J  Link_Comprobante
      ]);
    }

    await appendSheetData("Convenios", filaConvenio);
    await appendSheetData("Cuotas_Convenio", filasCuotas);

    mostrarMensaje && mostrarMensaje(`Convenio ${idConvenio} creado con éxito.`, "success");

    // Recargar en memoria
    const [cv, cq] = await Promise.all([obtenerConvenios(), obtenerCuotasConvenio()]);
    conveniosData = cv || [];
    cuotasData    = cq || [];
    procesarYUnirDatos();
    aplicarFiltrosConvenios();

    modalNuevoConvenio.hide();
  } catch (e) {
    console.error(e);
    mostrarMensaje && mostrarMensaje(e.message || "Error al guardar el convenio.", "error");
  } finally {
    hideSpinner && hideSpinner();
  }
}

// =================================================================
//  PAGO + COMPROBANTE
// =================================================================
async function registrarPagoCuota(cuotaId, convenioId) {
  try {
    showSpinner && showSpinner();

    const cuota = (cuotasData || []).find(c => c?.[0] === cuotaId);
    if (!cuota) throw new Error("No se encontró la cuota seleccionada.");
    const montoCuota = Number(cuota[5] || 0);

    await updateCuotaPago(cuotaId, montoCuota, cuota[9] || ""); // suma, recalcula, marca estado

    // Refresca datos y redibuja
    cuotasData = await obtenerCuotasConvenio();
    procesarYUnirDatos();
    aplicarFiltrosConvenios();

    if (modalDetalleConvenio) modalDetalleConvenio.hide();
    abrirModalDetalle(convenioId);

    mostrarMensaje && mostrarMensaje(`Pago registrado.`, "success");
  } catch (e) {
    console.error(e);
    mostrarMensaje && mostrarMensaje(e.message || "No se pudo registrar el pago.", "error");
  } finally {
    hideSpinner && hideSpinner();
  }
}

async function handleAttachComprobante(cuotaId, nParcela, file, convenioId) {
  if (!file) return;
  try {
    showSpinner && showSpinner();
    const link = await attachReceiptAndLink(cuotaId, nParcela, file);
    mostrarMensaje && mostrarMensaje("Comprobante cargado y vinculado.", "success");

    cuotasData = await obtenerCuotasConvenio();
    procesarYUnirDatos();
    aplicarFiltrosConvenios();

    if (modalDetalleConvenio) { modalDetalleConvenio.hide(); abrirModalDetalle(convenioId); }
  } catch (e) {
    console.error(e);
    mostrarMensaje && mostrarMensaje(e.message || "No se pudo adjuntar el comprobante.", "error");
  } finally {
    hideSpinner && hideSpinner();
  }
}
