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
function ymdToDisplay(val) {
  if (val === null || val === undefined) return "—";

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
    if (/^\d+$/.test(val)) return fromSerial(Number(val));
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y,m,d] = val.split("-");
      return `${d}-${m}-${y}`;
    }
    if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/.test(val)) {
      const [d,m,y] = val.replaceAll("/", "-").split("-");
      const yy = y.length === 2 ? `20${y}` : y;
      return `${d.padStart(2,"0")}-${m.padStart(2,"0")}-${yy}`;
    }
  }
  return String(val);
}

function addMonthsKeepDay(ymd, add) {
  if (!ymd) return ymd;
  const [y, m, d] = String(ymd).split("-").map(Number);
  if (!y || !m || !d) return ymd;
  const base = new Date(y, m - 1, 1);
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
                <th>ID Convenio</th><th>N° Parcela</th><th>Residente</th><th>Deuda Original</th>
                <th>Cuotas</th><th>Saldo Pendiente</th><th>Estado</th><th class="text-center">Acciones</th>
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
    <div class="modal fade" id="modalNuevoConvenio" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Crear nuevo convenio</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><form id="formNuevoConvenio" novalidate><div class="row g-3"><div class="col-md-6"><label class="form-label">Residente (Parcela)</label><select id="convenioResidente" class="form-select" required><option value="">Cargando…</option></select></div><div class="col-md-6"><label class="form-label">Deuda Total ($)</label><input type="number" id="convenioDeudaTotal" class="form-control" min="1" required></div><div class="col-md-6"><label class="form-label">Número de cuotas</label><input type="number" id="convenioCuotas" class="form-control" min="1" max="120" required></div><div class="col-md-6"><label class="form-label">Fecha 1er vencimiento</label><input type="date" id="convenioFechaInicio" class="form-control" required></div></div><div class="alert alert-info mt-3" id="resumenCalculoCuota">Ingrese los datos para calcular el valor de la cuota.</div><div class="text-end"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div></form></div></div></div></div>
    <div class="modal fade" id="modalDetalleConvenio" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-xl"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="detalleConvenioTitulo">Detalle del Convenio</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body" id="detalleConvenioBody"></div></div></div></div>`;

  modalNuevoConvenio   = new bootstrap.Modal(document.getElementById("modalNuevoConvenio"),   {backdrop:true, keyboard:true});
  modalDetalleConvenio = new bootstrap.Modal(document.getElementById("modalDetalleConvenio"), {backdrop:true, keyboard:true});

  document.getElementById("btnAbrirModalNuevoConvenio").addEventListener("click", abrirModalNuevoConvenio);
  document.getElementById("filtroBusquedaConvenio").addEventListener("input", aplicarFiltrosConvenios);
  document.getElementById("filtroEstadoConvenio").addEventListener("change", aplicarFiltrosConvenios);
  ["convenioDeudaTotal","convenioCuotas"].forEach(id => document.getElementById(id)?.addEventListener("input", calcularValorCuotaPreview));
  document.getElementById("formNuevoConvenio").addEventListener("submit", guardarConvenio);

  await cargarDatosIniciales();
}

// =================================================================
//  DATOS
// =================================================================
async function cargarDatosIniciales() {
  try {
    showSpinner?.();
    const [cv, cq, rs] = await Promise.all([obtenerConvenios(), obtenerCuotasConvenio(), obtenerResidentes()]);
    conveniosData  = cv || [];
    cuotasData     = cq || [];
    residentesData = rs || [];
    procesarYUnirDatos();
    aplicarFiltrosConvenios();
  } catch (e) {
    console.error(e);
    mostrarMensaje?.("No se pudieron cargar los datos de Convenios.", "error");
  } finally {
    hideSpinner?.();
  }
}

function procesarYUnirDatos() {
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

    let estado = estadoHoja;
    if (estado === "Activo") {
      if (saldoPend === 0 && cuotasDelConvenio.length) {
        estado = "Pagado";
      } else {
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const vencida = pendientes.some(c => {
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
      ID_Convenio: id, N_Parcela: parc, Nombre_Residente: escapeHTML((mapRes.get(parc) || ["—"]).join(", ")),
      Deuda_Original: deudaOriginal, N_Cuotas: nCuotas, Valor_Cuota: valorCuota,
      Saldo_Pendiente: saldoPend, Estado: estado, Cuotas: cuotasDelConvenio
    };
  }).filter(Boolean);

  conveniosFiltrados = [...conveniosUnificados];
  renderizarTablaConvenios(1);
}

function aplicarFiltrosConvenios() {
  const txt = (document.getElementById("filtroBusquedaConvenio").value || "").toLowerCase().trim();
  const est = (document.getElementById("filtroEstadoConvenio").value || "").trim();

  conveniosFiltrados = conveniosUnificados.filter(c => {
    const coincideTxt = c.ID_Convenio.toLowerCase().includes(txt) || String(c.N_Parcela).toLowerCase().includes(txt) || c.Nombre_Residente.toLowerCase().includes(txt);
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
          <td><span class="badge text-bg-dark">${c.ID_Convenio}</span></td><td>${c.N_Parcela}</td>
          <td>${c.Nombre_Residente}</td><td>$${Number(c.Deuda_Original).toLocaleString("es-CL")}</td>
          <td>${c.N_Cuotas}</td><td>$${Number(c.Saldo_Pendiente).toLocaleString("es-CL")}</td>
          <td><span class="badge text-bg-${badge}">${c.Estado}</span></td>
          <td class="text-center"><button class="btn btn-sm btn-outline-primary btn-detalle" data-id="${c.ID_Convenio}" title="Ver detalle"><i class="fas fa-eye"></i></button></td>
        </tr>`;
    }).join("");
  }

  const total = conveniosFiltrados.length;
  const totalPag = Math.max(1, Math.ceil(total / FILAS_POR_PAGINA_CONVENIOS));
  const desde = total ? ini + 1 : 0;
  const hasta = Math.min(fin, total);
  info.textContent = `Mostrando ${desde}-${hasta} de ${total}`;

  let html = `<ul class="pagination pagination-sm mb-0">`;
  for (let i = 1; i <= totalPag; i++) {
    html += `<li class="page-item ${i===pag?"active":""}"><a class="page-link" href="#" onclick="event.preventDefault(); renderTabla(${i});">${i}</a></li>`;
  }
  html += `</ul>`;
  nav.innerHTML = html;

  tbody.onclick = (e) => {
    const btn = e.target.closest(".btn-detalle");
    if (!btn) return;
    e.preventDefault();
    abrirModalDetalle(btn.getAttribute("data-id"));
  };
}
window.renderizarTablaConvenios = renderTabla;

// =================================================================
//  MODALES
// =================================================================
function abrirModalNuevoConvenio() {
  const form = document.getElementById("formNuevoConvenio");
  form.reset();
  const sel = document.getElementById("convenioResidente");
  const items = (residentesData || []).filter(r => r?.[3]).map(r => ({ parcela: String(r[3]).trim(), nombre: String(r[1] || "Sin nombre").trim() })).sort((a,b) => Number(a.parcela) - Number(b.parcela));
  sel.innerHTML = `<option value="">Seleccione…</option>` + items.map(it => `<option value="${it.parcela}">${it.parcela} - ${escapeHTML(it.nombre)}</option>`).join("");
  document.getElementById("resumenCalculoCuota").textContent = "Ingrese los datos para calcular el valor de la cuota.";
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
  document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
  document.body.classList.remove("modal-open");

  const c = conveniosUnificados.find(x => x.ID_Convenio === idConvenio);
  if (!c) return;

  document.getElementById("detalleConvenioTitulo").innerHTML = `Detalle del Convenio <span class="badge text-bg-dark">${c.ID_Convenio}</span>`;

  const tbody = (c.Cuotas?.length) ? c.Cuotas.map(q => {
    const estado = q?.[8] || "Pendiente";
    const badge  = { Pagado:"success", Pendiente:"warning", Atrasado:"danger" }[estado] || "light";
    const vence  = ymdToDisplay(q?.[4]);
    const monto  = Number(q?.[5] || 0).toLocaleString("es-CL");
    const link   = q?.[9] || "";

    const btns = `
      <div class="d-flex flex-wrap gap-1 justify-content-center">
        ${link ? `<a class="btn btn-sm btn-outline-info mb-1" href="${link}" target="_blank" rel="noopener">Ver comprobante</a>` : `<label class="btn btn-sm btn-outline-secondary mb-1">Adjuntar comprobante<input type="file" accept="image/*,application/pdf" hidden onchange="handleAttachComprobante('${q[0]}','${c.N_Parcela}', this.files[0], '${c.ID_Convenio}')"></label>`}
        ${link ? `<button class="btn btn-sm btn-outline-primary mb-1" onclick="enviarComprobanteCuota('${q[0]}','${c.N_Parcela}','${c.ID_Convenio}')">Enviar por correo</button>` : ''}
        ${estado === "Pagado" ? '<span class="text-muted">—</span>' : `<button class="btn btn-sm btn-outline-success mb-1" onclick="registrarPagoCuota('${q[0]}','${c.ID_Convenio}')"><i class="fas fa-dollar-sign"></i> Registrar pago</button>`}
      </div>`;
    return `<tr><td>${q?.[2]}</td><td>${vence}</td><td>$${monto}</td><td><span class="badge text-bg-${badge}">${estado}</span></td><td class="text-center">${btns}</td></tr>`;
  }).join("") : `<tr><td colspan="5" class="text-center py-3">No hay cuotas registradas.</td></tr>`;

  document.getElementById("detalleConvenioBody").innerHTML = `
    <div class="row"><div class="col-md-6"><h5>Información</h5><ul class="list-group">
      <li class="list-group-item d-flex justify-content-between"><strong>N° Parcela</strong><span>${c.N_Parcela}</span></li>
      <li class="list-group-item d-flex justify-content-between"><strong>Residente</strong><span>${c.Nombre_Residente}</span></li>
      <li class="list-group-item d-flex justify-content-between"><strong>Deuda Original</strong><span>$${c.Deuda_Original.toLocaleString("es-CL")}</span></li>
      <li class="list-group-item d-flex justify-content-between"><strong>N° de cuotas</strong><span>${c.N_Cuotas}</span></li>
    </ul></div><div class="col-md-6"><h5>Resumen</h5><ul class="list-group">
      <li class="list-group-item d-flex justify-content-between"><strong>Valor cuota</strong><span>$${c.Valor_Cuota.toLocaleString("es-CL")}</span></li>
      <li class="list-group-item d-flex justify-content-between"><strong>Saldo pendiente</strong><span>$${c.Saldo_Pendiente.toLocaleString("es-CL")}</span></li>
      <li class="list-group-item d-flex justify-content-between"><strong>Estado</strong><span class="badge text-bg-${{Activo:"success",Atrasado:"danger",Pagado:"primary",Anulado:"secondary"}[c.Estado]||"light"}">${c.Estado}</span></li>
    </ul></div></div>
    <h5 class="mt-4">Plan de pagos</h5><div class="table-responsive"><table class="table table-sm table-bordered"><thead class="table-light"><tr><th>N°</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th class="text-center">Acción</th></tr></thead><tbody>${tbody}</tbody></table></div>`;

  setTimeout(() => modalDetalleConvenio.show(), 10);
}

// ======================================================================
//  GUARDAR Y MANEJAR DATOS
// ======================================================================
async function guardarConvenio(evt) {
  evt.preventDefault();
  if (!confirm("¿Crear este convenio?")) return;

  try {
    showSpinner?.();
    const nParcela  = (document.getElementById("convenioResidente").value || "").trim();
    const deuda     = Number(document.getElementById("convenioDeudaTotal").value);
    const nCuotas   = Number(document.getElementById("convenioCuotas").value);
    const firstYMD  = document.getElementById("convenioFechaInicio").value;

    if (!/^\d+$/.test(nParcela) || !(residentesData || []).some(r => String(r?.[3]).trim() === nParcela)) throw new Error(`La parcela ${nParcela} no es válida o no existe.`);
    if (!deuda || deuda <= 0)  throw new Error("Deuda total inválida.");
    if (!nCuotas || nCuotas <= 0) throw new Error("Número de cuotas inválido.");
    if (!firstYMD) throw new Error("Selecciona la fecha de inicio.");

    const idConvenio = `C-${nParcela}-${Date.now().toString().slice(-5)}`;
    const base   = Math.floor(deuda / nCuotas);
    const resto  = deuda - (base * nCuotas);
    const valorCuotaPromedio = Math.round(deuda / nCuotas);

    const filaConvenio = [[idConvenio, nParcela, new Date().toLocaleDateString("es-CL"), deuda, nCuotas, valorCuotaPromedio, 0, "Activo", deuda, ""]];
    const filasCuotas = [];
    for (let i = 1; i <= nCuotas; i++) {
      const monto = base + (i <= resto ? 1 : 0);
      filasCuotas.push([`Q-${idConvenio}-${i}`, idConvenio, nParcela, i, addMonthsKeepDay(firstYMD, i - 1), monto, 0, monto, 'Pendiente', '']);
    }

    await appendSheetData("Convenios", filaConvenio);
    await appendSheetData("Cuotas_Convenio", filasCuotas);
    mostrarMensaje?.(`Convenio ${idConvenio} creado con éxito.`, "success");

    const [cv, cq] = await Promise.all([obtenerConvenios(), obtenerCuotasConvenio()]);
    conveniosData = cv || [];
    cuotasData    = cq || [];
    procesarYUnirDatos();
    aplicarFiltrosConvenios();
    modalNuevoConvenio.hide();
  } catch (e) {
    console.error(e);
    mostrarMensaje?.(e.message || "Error al guardar el convenio.", "error");
  } finally {
    hideSpinner?.();
  }
}

async function registrarPagoCuota(cuotaId, convenioId) {
  try {
    showSpinner?.();
    const cuota = (cuotasData || []).find(c => c?.[0] === cuotaId);
    if (!cuota) throw new Error("No se encontró la cuota seleccionada.");

    const montoCuota = Number(cuota[5] || 0);
    const hoyYMD = new Date().toISOString().slice(0,10);
    const fechaPago = prompt("Fecha de pago (YYYY-MM-DD):", hoyYMD);
    if (!fechaPago || !/^\d{4}-\d{2}-\d{2}$/.test(fechaPago)) return;

    await updateCuotaPago(cuotaId, montoCuota, cuota[9] || "", fechaPago);
    cuotasData = await obtenerCuotasConvenio();
    procesarYUnirDatos();
    aplicarFiltrosConvenios();
    modalDetalleConvenio?.hide();
    abrirModalDetalle(convenioId);
    mostrarMensaje?.(`Pago registrado.`, "success");
  } catch (e) {
    console.error(e);
    mostrarMensaje?.(e.message || "No se pudo registrar el pago.", "error");
  } finally {
    hideSpinner?.();
  }
}

async function handleAttachComprobante(cuotaId, nParcela, file, convenioId) {
  if (!file) return;
  try {
    showSpinner?.();
    await attachReceiptAndLink(cuotaId, nParcela, file);
    mostrarMensaje?.("Comprobante cargado y vinculado.", "success");
    cuotasData = await obtenerCuotasConvenio();
    procesarYUnirDatos();
    aplicarFiltrosConvenios();
    if (modalDetalleConvenio) { modalDetalleConvenio.hide(); abrirModalDetalle(convenioId); }
  } catch (e) {
    console.error(e);
    mostrarMensaje?.(e.message || "No se pudo adjuntar el comprobante.", "error");
  } finally {
    hideSpinner?.();
  }
}

// ===============================================================
//  CORREOS / COMPROBANTE
// ===============================================================
function getEmailDeParcela(nParcela) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!residentesData) return "";
  for (const residente of residentesData) {
    if (residente && String(residente[3]) === String(nParcela)) {
      const email = (residente[5] || "").trim();
      return emailRegex.test(email) ? email : "";
    }
  }
  return "";
}

function crearCuerpoCorreoConvenio(cuota, convenio, residenteNombre) {
    const nParcela = convenio.N_Parcela;
    const montoCuota = parseFloat(cuota[5] || 0);
    const nCuota = cuota[3];
    const totalCuotas = convenio.N_Cuotas;
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

async function enviarComprobanteCuota(cuotaId, nParcela, convenioId) {
  try {
    showSpinner?.();
    const cuota = (cuotasData || []).find(c => c && c[0] === cuotaId);
    if (!cuota) throw new Error("No se encontró la información de la cuota.");
    
    let destinatarios = [];
    const emailPrincipal = getEmailDeParcela(nParcela);
    if (emailPrincipal) {
      destinatarios.push(emailPrincipal);
    } else {
      const emailManual = prompt(`La parcela ${nParcela} no tiene un email registrado. Ingrese el correo de destino:`, "");
      if (emailManual?.trim()) {
        destinatarios.push(emailManual.trim());
      } else {
        throw new Error("Operación cancelada. No se especificó un destinatario.");
      }
    }
    
    const convenio = conveniosUnificados.find(c => c.ID_Convenio === convenioId);
    if (!convenio) throw new Error("No se encontró el convenio asociado para generar el correo.");
    
    const residenteNombre = convenio.Nombre_Residente;
    const nCuota = cuota[3];
    const destinatariosStr = destinatarios.join(",");
    const asunto = `Comprobante de Pago - Convenio Parcela ${nParcela} - Cuota ${nCuota}`;
    const cuerpoHtml = crearCuerpoCorreoConvenio(cuota, convenio, residenteNombre);

    await enviarCorreo(destinatariosStr, asunto, cuerpoHtml);
    
    mostrarMensaje?.(`Comprobante enviado a ${destinatariosStr}.`, "success");
  } catch (e) {
    console.error(e);
    mostrarMensaje?.(e.message || "No se pudo enviar el comprobante.", "error");
  } finally {
    hideSpinner?.();
  }
}
}

{
type: uploaded file
fileName: sheets (7).js
fullContent:
// VERSIÓN DEFINITIVAMENTE CORREGIDA
// js/sheets.js

// ID de tu Hoja de Cálculo
const SPREADSHEET_ID = '1LwA_L8nfAh8TNhyb4xHjiAXetvik_eqxY6HX9jMNU0Y';

// ID de tu Script
const SCRIPT_ID = 'AKfycbwmSy2q2bv0UlV7oA4f5f9pVS7hkNdjoFwBItXRkNIYQsoPpS7nvCYgZZF7h9hpwUC3TA';
window.SCRIPT_ID = SCRIPT_ID;

// --- Nombres de las Hojas ---
const SHEET_RESIDENTES = 'Residentes';
const SHEET_PROVEEDORES = 'Proveedores';
const SHEET_PAGOS_GC = 'Pagos_GC';
const SHEET_CONFIG_TIMC = 'Config_TIMC';
const SHEET_EGRESOS = 'Egresos';
const SHEET_INGRESOS_EXTRA = 'Ingresos_Extra';
const SHEET_CATEGORIAS_EGRESOS = 'Categorias_Egresos';
const SHEET_MANTENCIONES = 'Mantenciones';
const SHEET_MULTAS = 'Multas';
const SHEET_ASAMBLEAS = 'Asambleas';
const SHEET_COMUNICACIONES = 'Comunicaciones';
const SHEET_CONFIGURACION = 'Configuracion';
const SHEET_CONVENIOS = 'Convenios';
const SHEET_CUOTAS_CONVENIO = 'Cuotas_Convenio';
const MAIN_DRIVE_FOLDER_NAME = 'Los Molles';

// --- IDs de las Hojas (para operaciones internas de la API) ---
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PROVEEDORES = 705052879;
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;


// -------- FUNCIONES DE GOOGLE DRIVE --------
async function findFolderId(name, parentId = 'root') {
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false and '${parentId}' in parents`;
    const response = await gapi.client.drive.files.list({
        q: q,
        fields: 'files(id)',
        spaces: 'drive'
    });
    return response.result.files.length > 0 ? response.result.files[0].id : null;
}

async function createFolder(name, parentId = 'root') {
    const metadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
    };
    const response = await gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id'
    });
    return response.result.id;
}

async function buscarOCrearRutaDeComprobantes(nombreCarpetaParcela, nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);

    let carpetaPagosId = await findFolderId('Pagos', carpetaPrincipalId);
    if (!carpetaPagosId) carpetaPagosId = await createFolder('Pagos', carpetaPrincipalId);

    let carpetaParcelaId = await findFolderId(nombreCarpetaParcela, carpetaPagosId);
    if (!carpetaParcelaId) carpetaParcelaId = await createFolder(nombreCarpetaParcela, carpetaPagosId);

    const nombreCarpetaMes = `${nombreMes} ${anio}`;
    let carpetaMesId = await findFolderId(nombreCarpetaMes, carpetaParcelaId);
    if (!carpetaMesId) carpetaMesId = await createFolder(nombreCarpetaMes, carpetaParcelaId);

    return carpetaMesId;
}

async function buscarOCrearRutaDeEgreso(nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) {
        throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);
    }
    let carpetaEgresosId = await findFolderId('Egresos', carpetaPrincipalId);
    if (!carpetaEgresosId) {
        carpetaEgresosId = await createFolder('Egresos', carpetaPrincipalId);
    }
    let carpetaAnioId = await findFolderId(anio.toString(), carpetaEgresosId);
    if (!carpetaAnioId) {
        carpetaAnioId = await createFolder(anio.toString(), carpetaEgresosId);
    }
    let carpetaMesId = await findFolderId(nombreMes, carpetaAnioId);
    if (!carpetaMesId) {
        carpetaMesId = await createFolder(nombreMes, carpetaAnioId);
    }
    return carpetaMesId;
}

async function buscarOCrearRutaDeIngreso(nombreMes, anio) {
    const carpetaPrincipalId = await findFolderId(MAIN_DRIVE_FOLDER_NAME);
    if (!carpetaPrincipalId) {
        throw new Error(`No se encontró la carpeta principal de Drive: "${MAIN_DRIVE_FOLDER_NAME}"`);
    }

    let carpetaIngresosId = await findFolderId('Ingresos', carpetaPrincipalId);
    if (!carpetaIngresosId) {
        carpetaIngresosId = await createFolder('Ingresos', carpetaPrincipalId);
    }

    let carpetaAnioId = await findFolderId(anio.toString(), carpetaIngresosId);
    if (!carpetaAnioId) {
        carpetaAnioId = await createFolder(anio.toString(), carpetaIngresosId);
    }

    let carpetaMesId = await findFolderId(nombreMes, carpetaAnioId);
    if (!carpetaMesId) {
        carpetaMesId = await createFolder(nombreMes, carpetaAnioId);
    }

    return carpetaMesId;
}

async function subirComprobante(file, folderId) {
    const metadata = {
        name: file.name,
        parents: [folderId]
    };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], {
        type: 'application/json'
    }));
    formData.append('file', file);
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: new Headers({
            'Authorization': 'Bearer ' + gapi.auth.getToken().access_token
        }),
        body: formData,
    });
    return response.json();
}
// -------- CONFIGURACIÓN GLOBAL --------
async function obtenerConfiguracion() {
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONFIGURACION}!A:B`,
    });
    const values = response.result.values || [];
    const config = {};
    values.forEach(row => {
        if (row[0] && row[1]) config[row[0]] = row[1];
    });
    return config;
}

async function actualizarConfiguracion(key, value) {
    const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONFIGURACION}!A:A`,
    });
    const keys = response.result.values || [];
    const rowIndex = keys.findIndex(row => row[0] === key);
    if (rowIndex === -1) {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIGURACION}!A:B`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [key, value]
                ]
            }
        });
    } else {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIGURACION}!B${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    [value]
                ]
            }
        });
    }
}
// -------- RESIDENTES --------
async function obtenerResidentes() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A2:T`
    });
    return res.result.values || [];
}

async function agregarResidente(datos) {
    const residentes = await obtenerResidentes();
    const lastId = residentes.length > 0 && residentes[residentes.length - 1][0] ? parseInt(residentes[residentes.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A:T`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarResidente(datos) {
    const residentes = await obtenerResidentes();
    const idx = residentes.findIndex(r => r[0] === datos[0]);
    if (idx === -1) throw new Error('Residente no encontrado');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A${row}:T${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarSaldoConvenioEnSheet(rowNumber, nuevoSaldo) {
    if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar.");
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!M${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [
                [nuevoSaldo]
            ]
        }
    });
}

async function eliminarResidente(id) {
    const residentes = await obtenerResidentes();
    const idx = residentes.findIndex(r => r[0] === id);
    if (idx === -1) throw new Error('Residente no encontrado');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_RESIDENTES,
                        dimension: "ROWS",
                        startIndex: row - 1,
                        endIndex: row
                    }
                }
            }]
        }
    });
}
// -------- PROVEEDORES --------
async function obtenerProveedores() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarProveedor(datosProveedor) {
    datosProveedor[0] = `P-${Date.now()}`;
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datosProveedor]
        }
    });
}

async function actualizarProveedor(datosProveedor) {
    const proveedores = await obtenerProveedores();
    const idProveedor = datosProveedor[0];
    const rowIndex = proveedores.findIndex(p => p[0] === idProveedor);

    if (rowIndex === -1) {
        throw new Error('Proveedor no encontrado para actualizar.');
    }
    const rowToUpdate = rowIndex + 2;

    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PROVEEDORES}!A${rowToUpdate}:H${rowToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datosProveedor]
        }
    });
}

async function eliminarProveedor(id) {
    const proveedores = await obtenerProveedores();
    const rowIndex = proveedores.findIndex(p => p[0] === id);

    if (rowIndex === -1) {
        throw new Error('Proveedor no encontrado para eliminar.');
    }
    const rowToDelete = rowIndex + 1;

    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_PROVEEDORES,
                        dimension: "ROWS",
                        startIndex: rowToDelete,
                        endIndex: rowToDelete + 1
                    }
                }
            }]
        }
    });
}
// -------- GASTOS COMUNES Y TIMC --------
async function obtenerPagosGC() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_PAGOS_GC}!A2:V`
        });
        return response.result.values || [];
    } catch (err) {
        console.error("Error grave en obtenerPagosGC:", err);
        return [];
    }
}

async function agregarPagoGC(datos) {
    const uniqueId = `PGC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    datos[0] = uniqueId;
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_PAGOS_GC}!A:V`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarPagoGC(datos) {
    try {
        const response = await gapi.client.request({
            'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
            'method': 'POST',
            'body': {
                'function': 'actualizarPagoGC_GS',
                'parameters': [datos]
            }
        });

        const result = response.result;
        if (result.error) {
            throw new Error(result.error.details || 'Error en el script de Google.');
        }
        return result.response?.result;

    } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        console.error('Error al llamar a actualizarPagoGC_GS:', errorMessage);
        throw new Error(`Error del cliente al actualizar el pago: ${errorMessage}`);
    }
}

async function actualizarSaldoFavorResidente(rowNumber, nuevoSaldo) {
    if (rowNumber < 2) throw new Error("Número de fila inválido para actualizar el saldo a favor.");

    try {
        const response = await gapi.client.request({
            'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
            'method': 'POST',
            'body': {
                'function': 'actualizarSaldoFavorResidente_GS',
                'parameters': [rowNumber, nuevoSaldo]
            }
        });

        const result = response.result;
        if (result.error) {
            throw new Error(result.error.details || 'Error en el script de Google al actualizar saldo a favor.');
        }
        return result.response?.result;

    } catch (err) {
        const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
        console.error('Error al llamar a actualizarSaldoFavorResidente_GS:', errorMessage);
        throw new Error(`Error del cliente al actualizar saldo a favor: ${errorMessage}`);
    }
}

async function marcarComprobanteEnviado(rowNum) {
    if (!rowNum || rowNum < 2) {
        throw new Error("Se requiere un número de fila válido para actualizar.");
    }
    try {
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_PAGOS_GC}!S${rowNum}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [
                    ['SI']
                ]
            }
        });
    } catch (err) {
        console.error("Error al marcar el comprobante como enviado en Google Sheets:", err);
        throw new Error("No se pudo actualizar el estado del comprobante en la hoja de cálculo.");
    }
}


async function obtenerTIMCs() {
    try {
        const res = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_CONFIG_TIMC}!A2:C`
        });
        return res.result.values || [];
    } catch (err) {
        console.error("ERROR AL OBTENER TIMC:", err);
        throw err;
    }
}

async function guardarTIMC(anio, mes, valor) {
    try {
        const todos = await obtenerTIMCs();
        const idx = todos.findIndex(fila => fila[0] == anio && fila[1] == mes);
        if (idx !== -1) {
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_CONFIG_TIMC}!C${idx + 2}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [valor]
                    ]
                }
            });
        } else {
            await gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_CONFIG_TIMC}!A:C`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [
                        [anio, mes, valor]
                    ]
                }
            });
        }
    } catch (err) {
        console.error("ERROR AL GUARDAR TIMC:", err);
        throw err;
    }
}

async function obtenerEstadoDeCuenta(parcela) {
    const pagos = await obtenerPagosGC();
    return pagos
        .filter(p => p[2] == parcela)
        .map(p => ({
            idPago: p[0],
            periodo: p[4],
            descripcion: p[19] || `Gasto Común ${p[4]}`,
            deudaPendiente: parseFloat(p[12] || 0),
            estado: p[15],
            fechaPago: p[13],
            montoPagado: parseFloat(p[6] || 0),
            fechaVencimiento: p[5]
        }));
}

// -------- CONTABILIDAD (INGRESOS Y EGRESOS) --------
async function obtenerIngresosExtra() {
    try {
        const res = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_INGRESOS_EXTRA}!A2:G`
        });
        return res.result.values || [];
    } catch (err) {
        console.error("Error al obtener ingresos extra. Asegúrate que la hoja 'Ingresos_Extra' existe.", err);
        return [];
    }
}

async function agregarIngresoExtra(datos) {
    const ingresos = await obtenerIngresosExtra();
    const lastId = ingresos.length > 0 && ingresos[ingresos.length - 1][0] ? parseInt(ingresos[ingresos.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();

    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_INGRESOS_EXTRA}!A:G`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function obtenerCategoriasEgresos() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CATEGORIAS_EGRESOS}!A2:A`,
    });
    const values = res.result.values || [];
    return values.flat();
}

async function obtenerEgresos() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_EGRESOS}!A2:J`
    });
    return res.result.values || [];
}

async function agregarEgreso(datos) {
    const egresos = await obtenerEgresos();
    const lastId = egresos.length > 0 && egresos[egresos.length - 1][0] ? parseInt(egresos[egresos.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_EGRESOS}!A:J`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function eliminarEgreso(id) {
    const egresos = await obtenerEgresos();
    const idx = egresos.findIndex(e => e[0] === id);
    if (idx === -1) throw new Error('No encontrado');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_EGRESOS,
                        dimension: "ROWS",
                        startIndex: row - 1,
                        endIndex: row
                    }
                }
            }]
        }
    });
}

// -------- CONVENIOS Y CUOTAS --------
async function obtenerConvenios() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CONVENIOS}!A2:Z`
    });
    return res.result.values || [];
}

async function obtenerCuotasConvenio() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_CUOTAS_CONVENIO}!A2:Z`
    });
    return res.result.values || [];
}
// --- Helpers de escritura a Google Sheets (para Convenios) ---

/**
 * Inserta filas en la hoja indicada.
 * @param {string} sheetName - Nombre de la hoja (p.ej. "Convenios" o "Cuotas_Convenio")
 * @param {Array<Array<any>>} rows - Arreglo de filas [[...], [...]]
 */
async function appendSheetData(sheetName, rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("appendSheetData: rows vacío o inválido.");
  }
  // Requiere gapi inicializado y SPREADSHEET_ID definido (ya lo tienes al inicio de este archivo)
  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    resource: { values: rows }
  });
}

/** Agrega 1 fila a la hoja "Convenios" (compatibilidad con módulos antiguos). */
async function agregarConvenio(rows) {
  return appendSheetData(SHEET_CONVENIOS, rows);
}

/** Agrega N filas a la hoja "Cuotas_Convenio" (compatibilidad con módulos antiguos). */
async function agregarCuotasConvenio(rows) {
  return appendSheetData(SHEET_CUOTAS_CONVENIO, rows);
}

// -------- MANTENCIONES / TAREAS --------
async function obtenerTareas() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANTENCIONES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarTarea(datos) {
    const tareas = await obtenerTareas();
    const lastId = tareas.length > 0 && tareas[tareas.length - 1][0] ? parseInt(tareas[tareas.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANTENCIONES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarTarea(datos) {
    const tareas = await obtenerTareas();
    const rowIndex = tareas.findIndex(t => t[0] === datos[0]);
    if (rowIndex === -1) throw new Error('Tarea no encontrada para actualizar.');
    const rowToUpdate = rowIndex + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MANTENCIONES}!A${rowToUpdate}:H${rowToUpdate}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function eliminarTarea(id) {
    const tareas = await obtenerTareas();
    const idx = tareas.findIndex(t => t[0] === id);
    if (idx === -1) throw new Error('Tarea no encontrada para eliminar.');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_MANTENCIONES,
                        dimension: "ROWS",
                        startIndex: row - 1,
                        endIndex: row
                    }
                }
            }]
        }
    });
}
// -------- MULTAS --------
async function obtenerMultas() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MULTAS}!A2:G`
    });
    return res.result.values || [];
}

async function agregarMulta(datos) {
    const multas = await obtenerMultas();
    const lastId = multas.length > 0 && multas[multas.length - 1][0] ? parseInt(multas[multas.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MULTAS}!A:G`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function actualizarMulta(datos) {
    const multas = await obtenerMultas();
    const idx = multas.findIndex(m => m[0] === datos[0]);
    if (idx === -1) throw new Error('Multa no encontrada para actualizar.');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_MULTAS}!A${row}:G${row}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function eliminarMulta(id) {
    const multas = await obtenerMultas();
    const idx = multas.findIndex(m => m[0] === id);
    if (idx === -1) throw new Error('Multa no encontrada para eliminar.');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_MULTAS,
                        dimension: "ROWS",
                        startIndex: row - 1,
                        endIndex: row
                    }
                }
            }]
        }
    });
}
// -------- ASAMBLEAS --------
async function obtenerAsambleas() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_ASAMBLEAS}!A2:F`
    });
    return res.result.values || [];
}

async function agregarAsamblea(datos) {
    const asambleas = await obtenerAsambleas();
    const lastId = asambleas.length > 0 && asambleas[asambleas.length - 1][0] ? parseInt(asambleas[asambleas.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_ASAMBLEAS}!A:F`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}

async function eliminarAsamblea(id) {
    const asambleas = await obtenerAsambleas();
    const idx = asambleas.findIndex(a => a[0] === id);
    if (idx === -1) throw new Error('No encontrada');
    const row = idx + 2;
    await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            requests: [{
                deleteDimension: {
                    range: {
                        sheetId: SHEET_ID_ASAMBLEAS,
                        dimension: "ROWS",
                        startIndex: row - 1,
                        endIndex: row
                    }
                }
            }]
        }
    });
}

// -------- COMUNICACIONES --------
async function obtenerComunicaciones() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_COMUNICACIONES}!A2:H`
    });
    return res.result.values || [];
}

async function agregarComunicacion(datos) {
    const comunicaciones = await obtenerComunicaciones();
    const lastId = comunicaciones.length > 0 && comunicaciones[comunicaciones.length - 1][0] ? parseInt(comunicaciones[comunicaciones.length - 1][0]) : 0;
    datos[0] = (lastId + 1).toString();
    await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_COMUNICACIONES}!A:H`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [datos]
        }
    });
}
// AGREGAR O REEMPLAZAR CON ESTA FUNCIÓN EN sheets.js

async function enviarCorreo(destinatario, asunto, cuerpo) {
  try {
    const response = await gapi.client.request({
      'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
      'method': 'POST',
      'body': {
        'function': 'enviarCorreoComprobante_GS',
        'parameters': [destinatario, asunto, cuerpo]
      }
    });

    const result = response.result;
    if (result.error) {
      throw new Error(result.error.details || 'Error en el script de Google para enviar correo.');
    }
    return result.response?.result;

  } catch (err) {
    const errorMessage = err.result?.error?.message || err.message || 'Error desconocido.';
    console.error('Error al llamar a enviarCorreoComprobante_GS:', errorMessage);
    throw new Error(`Error del cliente al enviar correo: ${errorMessage}`);
  }
}
// ===============================================================
// Append genérico (fila(s)) a cualquier hoja
async function appendSheetData(sheetName, rows) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('appendSheetData: rows vacío.');
  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows }
  });
}

// Busca la fila de una cuota por ID (col A) y devuelve { rowIndex, values }
async function findCuotaRowById(cuotaId) {
  const range = `${SHEET_CUOTAS_CONVENIO}!A:K`;
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID, range
  });
  const rows = res.result.values || [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === cuotaId) return { rowIndex: i + 1, values: rows[i] };
  }
  return null;
}

// Actualiza pago de cuota: suma monto en G, recalcula H, setea I; opcionalmente setea link (J)
async function updateCuotaPago(cuotaId, monto, linkComprobante) {
  const found = await findCuotaRowById(cuotaId);
  if (!found) throw new Error(`No se encontró la cuota ${cuotaId}`);

  const row = found.values.slice();
  const rowIndex = found.rowIndex;

  const montoCuota = Number(row[5] || 0);               // F
  const pagadoAcum = Number(row[6] || 0) + Number(monto || 0); // G
  const saldo      = Math.max(0, montoCuota - pagadoAcum);     // H
  const estado     = saldo === 0 ? 'Pagado' : 'Pendiente';     // I

  row[6] = String(pagadoAcum);  // G
  row[7] = String(saldo);       // H
  row[8] = estado;              // I
  if (linkComprobante) row[9] = linkComprobante; // J

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_CUOTAS_CONVENIO}!A${rowIndex}:J${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return { estado, saldo, pagadoAcum, link: row[9] || '' };
}

// ======= Google Drive helpers para “Parcela N / Convenio pagos” =======

// Crea/encuentra carpeta hija dentro de un parentId
async function ensureChildFolder(parentId, childName) {
  const q = `'${parentId}' in parents and name = '${childName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const list = await gapi.client.drive.files.list({ q, fields: "files(id,name)" });
  if (list.result.files && list.result.files.length) return list.result.files[0].id;
  const create = await gapi.client.drive.files.create({
    resource: { name: childName, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id"
  });
  return create.result.id;
}

// Busca la carpeta raíz “Los Molles”, luego “Parcela N”, luego “Convenio pagos”
async function ensureFolderConvenioPagos(nParcela) {
  // Si ya tienes otra raíz, cambia el nombre aquí:
  const ROOT_NAME = 'Los Molles';
  // Buscar raíz
  const rootList = await gapi.client.drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${ROOT_NAME}' and trashed=false`,
    fields: 'files(id,name)'
  });
  if (!rootList.result.files || !rootList.result.files.length) {
    throw new Error(`No se encontró la carpeta raíz de Drive: "${ROOT_NAME}"`);
  }
  const rootId = rootList.result.files[0].id;

  const carpetaParcelaId = await ensureChildFolder(rootId, `Parcela ${nParcela}`);
  const carpetaConvenioId = await ensureChildFolder(carpetaParcelaId, 'Convenio pagos');
  return carpetaConvenioId;
}

// Sube archivo binario a Drive y devuelve {id, webViewLink}
async function subirComprobante(file, folderId) {
  const metadata = { name: file.name, parents: [folderId] };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + gapi.auth.getToken().access_token }),
      body: formData
    }
  );
  return resp.json();
}

// Sube comprobante a Parcela N / Convenio pagos y guarda link en J
async function attachReceiptAndLink(cuotaId, nParcela, file) {
  const folderId = await ensureFolderConvenioPagos(nParcela); // crea "Parcela X/Convenio pagos"
  const uploaded = await subirComprobante(file, folderId);    // sube el archivo

  // Permiso: cualquiera con el enlace puede ver
  try {
    await gapi.client.drive.permissions.create({
      fileId: uploaded.id,
      resource: { role: "reader", type: "anyone" }
    });
  } catch (e) {
    console.warn("No se pudo abrir permisos públicos para el comprobante:", e);
  }

  // Obtener link visible
  const info = await gapi.client.drive.files.get({
    fileId: uploaded.id,
    fields: "webViewLink,webContentLink"
  });
  const link = info.result.webViewLink || info.result.webContentLink || uploaded.webViewLink || "";

  // Guardar el link en la cuota (columna J)
  await updateCuotaPago(cuotaId, 0, link); // sin fecha → solo vincula link
  return link;
}


// === Ahora acepta fechaPago opcional y escribe en columna K
async function updateCuotaPago(cuotaId, monto, linkComprobante, fechaPago) {
  const found = await findCuotaRowById(cuotaId);
  if (!found) throw new Error(`No se encontró la cuota ${cuotaId}`);

  const row = found.values.slice();
  const rowIndex = found.rowIndex;

  const montoCuota = Number(row[5] || 0);                 // F
  const pagadoAcum = Number(row[6] || 0) + Number(monto || 0); // G
  const saldo      = Math.max(0, montoCuota - pagadoAcum);     // H
  const estado     = saldo === 0 ? 'Pagado' : 'Pendiente';     // I

  row[6] = String(pagadoAcum);  // G: Monto_Pagado_Acumulado
  row[7] = String(saldo);       // H: Saldo_Cuota
  row[8] = estado;              // I: Estado
  if (linkComprobante) row[9] = linkComprobante; // J: Link_Comprobante
  if (fechaPago) row[10] = fechaPago;           // K: Fecha_Pago (nueva)

  await gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_CUOTAS_CONVENIO}!A${rowIndex}:K${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [row] }
  });

  return { estado, saldo, pagadoAcum, link: row[9] || '', fechaPago: row[10] || '' };
}

}
no, ahora al cargar la pagina da error. Le saque los comentarios que tenía y sigue el error. Te adjunto el archivo y el nuevo error.
