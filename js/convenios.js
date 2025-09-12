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
// Convierte "YYYY-MM-DD", "DD/MM/YYYY", o serial (45910) -> "DD-MM-YYYY"
function ymdToDisplay(val) {
  if (val === null || val === undefined) return "—";

  // Serial de Google Sheets (días desde 1899-12-30)
  const fromSerial = (n) => {
    const base = new Date(1899, 11, 30);
    const d = new Date(base.getTime() + Number(n) * 86400000);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}-${mm}-${yy}`;
  };

  if (typeof val === "number") return fromSerial(val);
  if (typeof val === "string") {
    if (/^\d+$/.test(val)) return fromSerial(Number(val));      // "45910"
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {                       // "2025-09-10"
      const [y,m,d] = val.split("-");
      return `${d}-${m}-${y}`;
    }
    if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(val)) {         // "10/09/2025" o "10-09-2025"
      const [d,m,y] = val.replaceAll("/", "-").split("-");
      const yy = y.length === 2 ? `20${y}` : y;
      return `${d.padStart(2,"0")}-${m.padStart(2,"0")}-${yy}`;
    }
  }
  return String(val);
}

// Ya tienes esta para sumar meses; déjala como estaba:
function addMonthsKeepDay(ymd, add) {
  if (!ymd) return ymd;
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const base = new Date(y, m - 1, 1);      // primer día del mes
  base.setMonth(base.getMonth() + add);    // suma meses
  const Y = base.getFullYear();
  const M = base.getMonth() + 1;
  const last = new Date(Y, M, 0).getDate();// último día de ese mes
  const D = Math.min(d, last);             // “capar” al último día si hace falta
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

function renderTabla(pag = 1) {
  const tbody = document.getElementById("tabla-convenios-body");
  const info  = document.getElementById("registros-info-convenios");
  const nav   = document.getElementById("paginacion-convenios");
  if (!tbody || !info || !nav) return;

  const ini = (pag - 1) * FILAS_POR_PAGINA_CONVENIOS;
const fin = ini + FILAS_POR_PAGINA_CONVENIOS;
  const items = conveniosFiltrados.slice(ini, fin);

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Sin resultados.</td></tr>`;
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
            <button class="btn btn-sm btn-outline-primary btn-detalle" data-id="${c.ID_Convenio}" title="Ver detalle">
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
      <a class="page-link" href="#" onclick="event.preventDefault(); renderTabla(${i});">${i}</a>
    </li>`;
  }
  html += `</ul>`;
  nav.innerHTML = html;

  // ✅ Delegación estable: funciona siempre, incluso después de re-render
  tbody.onclick = (e) => {
    const btn = e.target.closest(".btn-detalle");
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute("data-id");
    abrirModalDetalle(id);
  };
}

// --- Alias de compatibilidad (algunos lugares llaman renderizarTablaConvenios) ---
window.renderizarTablaConvenios = window.renderizarTablaConvenios || function (p) {
  return renderTabla(p);
};


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
        const badge  = { Pagado:"success", Pendiente:"warning", Atrasado:"danger" }[estado] || "light";
        const vence  = ymdToDisplay(q?.[4]);              // E = Fecha_Vencimiento (YYYY-MM-DD)
        const monto  = Number(q?.[5] || 0).toLocaleString("es-CL");
        const link   = q?.[9] || "";                      // J = Link_Comprobante (si existe)

        const btns = `
          <div class="d-flex flex-wrap gap-1 justify-content-center">
            ${link
              ? `<a class="btn btn-sm btn-outline-info mb-1" href="${link}" target="_blank" rel="noopener">Ver comprobante</a>`
              : `<label class="btn btn-sm btn-outline-secondary mb-1">
                   Adjuntar comprobante
                   <input type="file" accept="image/*,application/pdf" hidden
                     onchange="handleAttachComprobante('${q[0]}','${c.N_Parcela}', this.files[0], '${c.ID_Convenio}')">
                 </label>`
            }
            ${link
              ? `<button class="btn btn-sm btn-outline-primary mb-1"
                   onclick="enviarComprobanteCuota('${q[0]}','${c.N_Parcela}','${c.ID_Convenio}')">
                   Enviar por correo
                 </button>`
              : ''
            }
            ${estado === "Pagado"
              ? '<span class="text-muted">—</span>'
              : `<button class="btn btn-sm btn-outline-success mb-1"
                   onclick="registrarPagoCuota('${q[0]}','${c.ID_Convenio}')">
                   <i class="fas fa-dollar-sign"></i> Registrar pago
                 </button>`
            }
          </div>
        `;

        return `<tr>
          <td>${q?.[2]}</td>
          <td>${vence}</td>
          <td>$${monto}</td>
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
          <li class="list-group-item d-flex justify-content-between"><strong>Estado</strong>
            <span class="badge text-bg-${{Activo:"success",Atrasado:"danger",Pagado:"primary",Anulado:"secondary"}[c.Estado]||"light"}">${c.Estado}</span>
          </li>
        </ul>
      </div>
    </div>

    <h5 class="mt-4">Plan de pagos</h5>
    <div class="table-responsive">
      <table class="table table-sm table-bordered">
        <thead class="table-light">
          <tr><th>N°</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th class="text-center">Acción</th></tr>
        </thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;

  setTimeout(() => modalDetalleConvenio.show(), 10);
}

// ======================================================================
//  GUARDAR CONVENIO (corrige el redondeo y mantiene fechas estables)
// ======================================================================
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

    // --------- NUEVO: reparto exacto sin perder $ ----------
    const base   = Math.floor(deuda / nCuotas);     // monto base por cuota
    const resto  = deuda - (base * nCuotas);        // pesos sobrantes (0..nCuotas-1)
    const valorCuotaPromedio = Math.round(deuda / nCuotas); // solo para mostrar en "Resumen"
    // -------------------------------------------------------

    // Fila Convenios (ajusta al orden real de tu hoja)
    const filaConvenio = [[
      idConvenio,          // 0 ID_Convenio
      nParcela,            // 1 N_Parcela
      new Date().toLocaleDateString("es-CL"), // 2 Fecha creación (visual)
      deuda,               // 3 Deuda_Original
      nCuotas,             // 4 N_Cuotas
      valorCuotaPromedio,  // 5 Valor_Cuota (promedio para mostrar)
      0,                   // 6 Pagado_Acumulado
      "Activo",            // 7 Estado
      deuda,               // 8 Saldo Inicial
      ""                   // 9 Observaciones
    ]];

    // Filas Cuotas — GUARDAMOS YYYY-MM-DD en E (index 4) y repartimos exacto
    const filasCuotas = [];
    for (let i = 1; i <= nCuotas; i++) {
      const idCuota = `Q-${idConvenio}-${i}`;
      const vencYMD = addMonthsKeepDay(firstYMD, i - 1); // estable sin “correr el día”
      // Las primeras "resto" cuotas llevan +1 peso
      const monto = base + (i <= resto ? 1 : 0);

      filasCuotas.push([
        idCuota,        // A  ID_Cuota
        idConvenio,     // B  ID_Convenio
        nParcela,       // C  N_Parcela
        i,              // D  N_Cuota
        vencYMD,        // E  Fecha_Vencimiento
        monto,          // F  Monto_Cuota
        0,              // G  Monto_Pagado_Acumulado
        monto,          // H  Saldo_Cuota (inicial = monto)
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
    const hoyYMD = new Date().toISOString().slice(0,10);
    const fechaPago = prompt("Fecha de pago (YYYY-MM-DD):", hoyYMD);
    if (!fechaPago) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) throw new Error("Fecha inválida. Use formato YYYY-MM-DD.");

    // Mantiene el link si ya existía
    const link = cuota[9] || "";
    await updateCuotaPago(cuotaId, montoCuota, link, fechaPago); // <-- ahora acepta fecha

    // Refrescar
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
// AGREGAR ESTA NUEVA FUNCIÓN EN convenios.js

/**
 * Crea el cuerpo del correo en formato HTML para un comprobante de pago de cuota de convenio.
 * @param {object} cuota - El objeto de la cuota pagada.
 * @param {object} convenio - El objeto del convenio al que pertenece la cuota.
 * @param {string} residenteNombre - El nombre del residente.
 * @returns {string} Una cadena de texto con el HTML completo del correo.
 */
function crearCuerpoCorreoConvenio(cuota, convenio, residenteNombre) {
    const nParcela = convenio.N_Parcela;
    const montoCuota = parseFloat(cuota[5] || 0); // Columna F: Monto_Cuota
    const nCuota = cuota[3];                      // Columna D: N_Cuota
    const totalCuotas = convenio.N_Cuotas;
    const fechaPago = new Date().toLocaleDateString('es-CL');

    return `
    <!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Comprobante de Pago de Convenio</title></head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse:collapse;background-color:#ffffff;margin:20px auto;border:1px solid #dddddd;">
            <tr><td align="center" bgcolor="#2a7ca3" style="padding:20px;color:#ffffff;"><h2 style="margin:0;">Comprobante de Pago</h2><p style="margin:5px 0 0;">Condominio Los Molles</p></td></tr>
            <tr><td style="padding:25px 20px;">
                <p>Estimado(a) <strong>${residenteNombre}</strong>,</p>
                <p>Confirmamos la recepción del pago de su cuota de convenio. A continuación el detalle:</p>
                <h4 style="color:#333;margin-bottom:5px;margin-top:15px;border-bottom:1px solid #eee;padding-bottom:5px;">Detalle del Pago Realizado</h4>
                <table width="100%" cellpadding="4" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
                    <tr><td style="padding:8px 0;">Pago Cuota de Convenio (${nCuota} de ${totalCuotas}):</td><td style="padding:8px 0;text-align:right;">$${montoCuota.toLocaleString('es-CL')}</td></tr>
                    <tr style="font-weight:bold;border-top:2px solid #2e7d32;">
                        <td style="padding:10px 0; color:#2e7d32; font-size:1.1em;">Total Pagado:</td>
                        <td style="padding:10px 0; text-align:right; color:#2e7d32; font-size:1.1em;">$${montoCuota.toLocaleString('es-CL')}</td>
                    </tr>
                </table>
                <hr style="border:0;border-top:1px solid #eeeeee;margin-top:20px;">
                <p>Gracias por su compromiso.</p><p style="margin-top:20px;">Atentamente,<br><strong>Alex Thiele</strong><br>Administrador</p>
            </td></tr>
            <tr><td bgcolor="#f4f4f4" style="text-align:center;padding:15px;font-size:12px;color:#777777;">Este es un correo electrónico generado automáticamente.</td></tr>
        </table>
    </body></html>`;
}
// Envía el comprobante por correo a los emails de la parcela (y opcionales)
// REEMPLAZAR LA FUNCIÓN EXISTENTE EN convenios.js CON ESTA

async function enviarComprobanteCuota(cuotaId, nParcela, convenioId) {
  try {
    showSpinner && showSpinner();

    const cuota = (cuotasData || []).find(c => c && c[0] === cuotaId);
    if (!cuota) {
      throw new Error("No se encontró la información de la cuota seleccionada.");
    }

    let destinatarios = [];
    const emailPrincipal = getEmailDeParcela(nParcela);

    if (emailPrincipal) {
      destinatarios.push(emailPrincipal);
    } else {
      const emailManual = prompt(
        `La parcela ${nParcela} no tiene un email registrado en "Residentes".\n` +
        `Por favor, ingrese el correo de destino:`, ""
      );
      if (emailManual && emailManual.trim()) {
        destinatarios.push(emailManual.trim());
      } else {
        throw new Error("Operación cancelada. No se especificó un destinatario.");
      }
    }
    
    // --- INICIO DE LA NUEVA LÓGICA ---
    // 1. Obtener los datos completos del convenio y residente
    const convenio = conveniosUnificados.find(c => c.ID_Convenio === convenioId);
    if (!convenio) {
        throw new Error("No se encontró el convenio asociado para generar el correo.");
    }
    const residenteNombre = convenio.Nombre_Residente;
    const nCuota = cuota[3];
    const destinatariosStr = destinatarios.join(",");

    // 2. Generar Asunto y Cuerpo del correo usando la nueva función
    const asunto = `Comprobante de Pago - Convenio Parcela ${nParcela} - Cuota ${nCuota}`;
    const cuerpoHtml = crearCuerpoCorreoConvenio(cuota, convenio, residenteNombre);

    // 3. Enviar el correo con el cuerpo HTML generado
    await enviarCorreo(destinatariosStr, asunto, cuerpoHtml);
    // --- FIN DE LA NUEVA LÓGICA ---
    
    mostrarMensaje && mostrarMensaje(`Comprobante enviado a ${destinatariosStr}.`, "success");

  } catch (e) {
    console.error(e);
    mostrarMensaje && mostrarMensaje(e.message || "No se pudo enviar el comprobante.", "error");
  } finally {
    hideSpinner && hideSpinner();
  }
}

// Llama a Apps Script para enviar el correo (Execution API)
// Envía el comprobante por correo SOLO al email de columna F de "Residentes"
// === CORREOS / COMPROBANTE ===
// Devuelve el email principal de la parcela desde "Residentes":
// D = N_Parcela (índice 3), F = Email (índice 5)
function getEmailDeParcela(nParcela) {
  const rx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const r of (residentesData || [])) {
    if (String(r?.[3]) === String(nParcela)) {
      const email = (r?.[5] || "").trim();
      return rx.test(email) ? email : "";
    }
  }
  return "";
}

// Compatibilidad: si en otro lado esperan lista, devolvemos [email] o []
function getEmailsDeParcela(nParcela) {
  const e = getEmailDeParcela(nParcela);
  return e ? [e] : [];
}

// REEMPLAZA TODO DESDE LA LÍNEA 705 HASTA EL FINAL CON ESTO:

// ===============================================================
//  CORREOS / COMPROBANTE
// ===============================================================
/**
 * Busca en `residentesData` la parcela y devuelve el email principal.
 * La columna D (índice 3) es N_Parcela y la F (índice 5) es Email.
 * @param {string} nParcela - El número de parcela a buscar.
 * @returns {string} El email encontrado o una cadena vacía.
 */

/**
 * Envía el comprobante de una cuota por correo utilizando la función genérica.
 * @param {string} cuotaId - El ID de la cuota.
 * @param {string} nParcela - El N° de la parcela.
 * @param {string} convenioId - El ID del convenio.
 */
async function enviarComprobanteCuota(cuotaId, nParcela, convenioId) {
  try {
    showSpinner && showSpinner();

    const cuota = (cuotasData || []).find(c => c && c[0] === cuotaId);
    if (!cuota) {
      throw new Error("No se encontró la información de la cuota seleccionada.");
    }

    const linkComprobante = cuota[9]; // Columna J
    if (!linkComprobante) {
      throw new Error("Para enviar, primero debe adjuntar un comprobante a esta cuota.");
    }

    let destinatarios = [];
    const emailPrincipal = getEmailDeParcela(nParcela);

    if (emailPrincipal) {
      destinatarios.push(emailPrincipal);
    } else {
      const emailManual = prompt(
        `La parcela ${nParcela} no tiene un email registrado en "Residentes".\n` +
        `Por favor, ingrese el correo de destino:`, ""
      );
      if (emailManual && emailManual.trim()) {
        destinatarios.push(emailManual.trim());
      } else {
        throw new Error("Operación cancelada. No se especificó un destinatario.");
      }
    }
    
    const destinatariosStr = destinatarios.join(",");
    const asunto = `Comprobante de pago – Parcela ${nParcela} – Cuota ${String(cuotaId || "").split("-").pop()}`;
    const monto = Number(cuota[5] || 0).toLocaleString("es-CL");
    const fechaVenc = ymdToDisplay(cuota[4] || "");

    const cuerpoHtml = '' +
      '<p>Estimado/a,</p>' +
      '<p>Adjuntamos el comprobante del pago registrado para su convenio.</p>' +
      '<ul>' +
      '<li><b>Parcela:</b> ' + nParcela + '</li>' +
      '<li><b>ID Convenio:</b> ' + convenioId + '</li>' +
      '<li><b>ID Cuota:</b> ' + cuotaId + '</li>' +
      '<li><b>Monto de la cuota:</b> $' + monto + '</li>' +
      '<li><b>Fecha de vencimiento:</b> ' + fechaVenc + '</li>' +
      '</ul>' +
      '<p><a href="' + linkComprobante + '">Abrir comprobante</a></p>' +
      '<p>Saludos cordiales.</p>';

    // Se llama a la función genérica `enviarCorreo`, que debe estar en sheets.js
    await enviarCorreo(destinatariosStr, asunto, cuerpoHtml);
    
    mostrarMensaje && mostrarMensaje(`Comprobante enviado a ${destinatariosStr}.`, "success");

  } catch (e) {
    console.error(e);
    mostrarMensaje && mostrarMensaje(e.message || "No se pudo enviar el comprobante.", "error");
  } finally {
    hideSpinner && hideSpinner();
  }
}
