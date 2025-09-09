// =================================================================
// CÓDIGO FINAL Y COMPLETO PARA EL ARCHIVO:  js/convenios.js
// =================================================================

// VARIABLES GLOBALES DEL MÓDULO
let convenios = [];
let cuotas = [];
let residentes = [];
let currentConvenioId = null;
let archivoComprobante = null;

// FUNCIÓN PRINCIPAL QUE CARGA EL MÓDULO
async function cargarConvenios() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error("El contenedor principal 'main-content' no se encontró.");
        return;
    }

    mainContent.innerHTML = `
        <h1>Módulo de Gestión de Convenios</h1>
        <div><button id="btnNuevoConvenio">Nuevo Convenio</button></div>
        <table id="tabla-convenios">
            <thead>
                <tr>
                    <th>N° Parcela</th><th>Residente</th><th>Deuda Original</th><th>N° Cuotas</th>
                    <th>Valor Cuota</th><th>Saldo Pendiente</th><th>Estado</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody id="tabla-convenios-body"></tbody>
        </table>
        <div id="modalNuevoConvenio" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" id="btnCerrarModalNuevo">&times;</span><h2>Crear Nuevo Convenio</h2>
                <form id="formNuevoConvenio">
                    <div><label>Residente / Parcela: <select id="convenioResidente" required></select></label></div>
                    <div><label>Monto Deuda Total ($): <input type="number" id="convenioDeudaTotal" required min="1" step="0.01"></label></div>
                    <div><label>Número de Cuotas: <input type="number" id="convenioCuotas" required min="1" max="120"></label></div>
                    <div><label>Valor Cuota (calculado): <input type="text" id="convenioValorCuota" disabled></label></div>
                    <div><label>Fecha Primera Cuota: <input type="date" id="convenioFechaInicio" required></label></div>
                    <div><label>Interés (%): <input type="number" id="convenioInteres" value="0" min="0" step="0.01"></label></div>
                    <div><label>Observaciones: <textarea id="convenioObservaciones" rows="3"></textarea></label></div>
                    <div><button type="button" id="btnCancelarConvenio">Cancelar</button><button type="submit">Guardar Convenio</button></div>
                </form>
            </div>
        </div>
        <div id="modalDetalleConvenio" class="modal" style="display:none;">
            <div class="modal-content"><span class="close" id="btnCerrarModalDetalle">&times;</span><h2 id="detalleConvenioTitle">Detalle de Cuotas</h2><div id="detalle-convenio-info"></div><table><thead><tr><th>N° Cuota</th><th>Vencimiento</th><th>Monto</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="tabla-cuotas-body"></tbody></table></div>
        </div>
        <div id="modalPagoCuota" class="modal" style="display:none;">
            <div class="modal-content"><span class="close" id="btnCerrarModalPago">&times;</span><h2>Registrar Pago de Cuota</h2><div id="info-cuota-pago"></div><form id="formPagoCuota"><input type="hidden" id="pagoCuotaId"><div><label>Monto a Pagar ($): <input type="number" id="pagoMonto" required min="0.01" step="0.01"></label></div><div><label>Fecha de Pago: <input type="date" id="pagoFecha" required></label></div><div><label>Método de Pago: <select id="pagoMetodo" required><option value="">Seleccione...</option><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></label></div><div><label>Comprobante: <input type="file" id="pagoComprobante" accept=".pdf,.jpg,.jpeg,.png"></label></div><div><label>Observaciones: <textarea id="pagoObservaciones" rows="2"></textarea></label></div><div><button type="button" id="btnCancelarPago">Cancelar</button><button type="submit">Registrar Pago</button></div></form></div>
        </div>
    `;

    try {
        await simularCargaDatos();
        renderizarTablaConvenios();
        inicializarComponentes();
    } catch (error) {
        mostrarError('Error al cargar datos de convenios: ' + error.message);
    }
}

function inicializarComponentes() {
    document.getElementById('btnNuevoConvenio').addEventListener('click', abrirModalNuevo);
    document.getElementById('btnCerrarModalNuevo').addEventListener('click', cerrarModalNuevo);
    document.getElementById('btnCerrarModalDetalle').addEventListener('click', cerrarModalDetalle);
    document.getElementById('btnCerrarModalPago').addEventListener('click', cerrarModalPago);
    document.getElementById('btnCancelarConvenio').addEventListener('click', cerrarModalNuevo);
    document.getElementById('btnCancelarPago').addEventListener('click', cerrarModalPago);
    document.getElementById('formNuevoConvenio').addEventListener('submit', guardarConvenio);
    document.getElementById('formPagoCuota').addEventListener('submit', registrarPagoCuota);
    document.getElementById('convenioDeudaTotal').addEventListener('input', calcularValorCuota);
    document.getElementById('convenioCuotas').addEventListener('input', calcularValorCuota);
    document.getElementById('convenioInteres').addEventListener('input', calcularValorCuota);
    document.getElementById('pagoComprobante').addEventListener('change', manejarSubidaArchivo);
}

async function simularCargaDatos() {
    return new Promise(resolve => {
        setTimeout(() => {
            residentes = [
                { ID_Residente: 1, N_Parcela: 101, Nombre_Completo: "Juan Pérez" },
                { ID_Residente: 2, N_Parcela: 102, Nombre_Completo: "María González" },
                { ID_Residente: 3, N_Parcela: 103, Nombre_Completo: "Carlos López" },
                { ID_Residente: 4, N_Parcela: 104, Nombre_Completo: "Ana Martínez" }
            ];
            convenios = [
                { ID_Convenio: 1, N_Parcela: 101, Nombre_Residente: "Juan Pérez", Deuda_Original: 1200000, N_Cuotas: 12, Valor_Cuota: 100000, Interes_Convenio: 0, Estado: "Activo", Saldo_Convenio: 600000, Fecha_Inicio: "2023-05-15", Observaciones: "Deuda acumulada" },
                { ID_Convenio: 2, N_Parcela: 103, Nombre_Residente: "Carlos López", Deuda_Original: 800000, N_Cuotas: 8, Valor_Cuota: 100000, Interes_Convenio: 0, Estado: "Pagado", Saldo_Convenio: 0, Fecha_Inicio: "2023-03-10", Observaciones: "" }
            ];
            cuotas = [
                { ID_Cuota: 1, ID_Convenio: 1, N_Cuota: 1, Fecha_Vencimiento: "2023-06-15", Monto_Cuota: 100000, Monto_Pagado: 100000, Saldo_Cuota: 0, Estado: "Pagado" },
                { ID_Cuota: 7, ID_Convenio: 1, N_Cuota: 7, Fecha_Vencimiento: "2023-12-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" },
            ];
            resolve();
        }, 100);
    });
}

function renderizarTablaConvenios() {
    const tbody = document.getElementById('tabla-convenios-body');
    if (!tbody) return;
    tbody.innerHTML = convenios.map(c => `
        <tr>
            <td>${c.N_Parcela}</td><td>${c.Nombre_Residente}</td>
            <td>$${(c.Deuda_Original || 0).toLocaleString('es-CL')}</td><td>${c.N_Cuotas}</td>
            <td>$${(c.Valor_Cuota || 0).toLocaleString('es-CL')}</td><td>$${(c.Saldo_Convenio || 0).toLocaleString('es-CL')}</td>
            <td>${c.Estado}</td>
            <td>
                <button class="btn-ver-detalle" data-id="${c.ID_Convenio}">Ver</button>
                <button class="btn-editar" data-id="${c.ID_Convenio}">Editar</button>
                <button class="btn-anular" data-id="${c.ID_Convenio}">Anular</button>
            </td>
        </tr>
    `).join('');
    document.querySelectorAll('.btn-ver-detalle').forEach(btn => btn.addEventListener('click', (e) => verDetalleConvenio(e.currentTarget.dataset.id)));
    document.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', (e) => editarConvenio(e.currentTarget.dataset.id)));
    document.querySelectorAll('.btn-anular').forEach(btn => btn.addEventListener('click', (e) => anularConvenio(e.currentTarget.dataset.id)));
}

function verDetalleConvenio(convenioId) {
    currentConvenioId = convenioId;
    const convenio = convenios.find(c => c.ID_Convenio == convenioId);
    const cuotasConvenio = cuotas.filter(cu => cu.ID_Convenio == convenioId);
    document.getElementById('detalleConvenioTitle').textContent = `Cuotas - Parcela ${convenio.N_Parcela}`;
    document.getElementById('detalle-convenio-info').innerHTML = `<strong>Deuda Original:</strong> $${(convenio.Deuda_Original || 0).toLocaleString('es-CL')}<br><strong>Saldo:</strong> $${(convenio.Saldo_Convenio || 0).toLocaleString('es-CL')}`;
    document.getElementById('tabla-cuotas-body').innerHTML = cuotasConvenio.map(cuota => `
        <tr>
            <td>${cuota.N_Cuota}</td><td>${new Date(cuota.Fecha_Vencimiento).toLocaleDateString('es-CL')}</td>
            <td>$${(cuota.Monto_Cuota || 0).toLocaleString('es-CL')}</td><td>$${(cuota.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
            <td>$${(cuota.Saldo_Cuota || 0).toLocaleString('es-CL')}</td><td>${cuota.Estado}</td>
            <td>${cuota.Estado === 'Pendiente' ? `<button class="btn-pagar-cuota" data-id="${cuota.ID_Cuota}">Pagar</button>` : ''}</td>
        </tr>
    `).join('');
    document.querySelectorAll('.btn-pagar-cuota').forEach(btn => btn.addEventListener('click', (e) => abrirModalPagoCuota(e.currentTarget.dataset.id)));
    document.getElementById('modalDetalleConvenio').style.display = 'block';
}

function abrirModalNuevo() {
    document.getElementById('formNuevoConvenio').reset();
    document.getElementById('convenioValorCuota').value = '';
    document.getElementById('convenioFechaInicio').valueAsDate = new Date();
    const select = document.getElementById('convenioResidente');
    select.innerHTML = '<option value="">Seleccione...</option>' + residentes.map(r => `<option value="${r.N_Parcela}">P.${r.N_Parcela} - ${r.Nombre_Completo}</option>`).join('');
    document.getElementById('modalNuevoConvenio').style.display = 'block';
}

function calcularValorCuota() {
    const deuda = parseFloat(document.getElementById('convenioDeudaTotal').value) || 0;
    const numCuotas = parseInt(document.getElementById('convenioCuotas').value) || 0;
    const interes = parseFloat(document.getElementById('convenioInteres').value) || 0;
    if (deuda > 0 && numCuotas > 0) {
        const valorCuota = (deuda * (1 + interes / 100)) / numCuotas;
        document.getElementById('convenioValorCuota').value = `$${Math.round(valorCuota).toLocaleString('es-CL')}`;
    } else {
        document.getElementById('convenioValorCuota').value = '';
    }
}

async function guardarConvenio(e) {
    e.preventDefault();
    const nParcela = document.getElementById('convenioResidente').value;
    if (!nParcela) { mostrarError('Debe seleccionar un residente.'); return; }
    const residente = residentes.find(r => r.N_Parcela == nParcela);
    if (!residente) { mostrarError('Residente no encontrado.'); return; }
    const deudaOriginal = parseFloat(document.getElementById('convenioDeudaTotal').value);
    const nCuotas = parseInt(document.getElementById('convenioCuotas').value);
    if (deudaOriginal <= 0 || nCuotas <= 0) { mostrarError('La deuda y las cuotas deben ser mayores a cero.'); return; }
    const nuevoId = convenios.length > 0 ? Math.max(...convenios.map(c => c.ID_Convenio)) + 1 : 1;
    const interes = parseFloat(document.getElementById('convenioInteres').value) || 0;
    const valorCuota = (deudaOriginal * (1 + interes / 100)) / nCuotas;
    const nuevoConvenio = {
        ID_Convenio: nuevoId, N_Parcela: parseInt(nParcela), Nombre_Residente: residente.Nombre_Completo,
        Deuda_Original: deudaOriginal, N_Cuotas: nCuotas, Valor_Cuota: Math.round(valorCuota),
        Interes_Convenio: interes, Estado: "Activo", Saldo_Convenio: deudaOriginal * (1 + interes / 100),
        Fecha_Inicio: document.getElementById('convenioFechaInicio').value,
        Observaciones: document.getElementById('convenioObservaciones').value
    };
    convenios.push(nuevoConvenio);
    renderizarTablaConvenios();
    cerrarModalNuevo();
    mostrarExito('Convenio creado exitosamente.');
}

function abrirModalPagoCuota(cuotaId) {
    const cuota = cuotas.find(c => c.ID_Cuota == cuotaId);
    const convenio = convenios.find(c => c.ID_Convenio == cuota.ID_Convenio);
    document.getElementById('pagoCuotaId').value = cuotaId;
    document.getElementById('pagoMonto').value = cuota.Saldo_Cuota;
    document.getElementById('pagoMonto').max = cuota.Saldo_Cuota;
    document.getElementById('pagoFecha').valueAsDate = new Date();
    document.getElementById('info-cuota-pago').innerHTML = `<strong>Parcela:</strong> ${convenio.N_Parcela}<br><strong>Cuota N°:</strong> ${cuota.N_Cuota}<br><strong>Saldo:</strong> $${cuota.Saldo_Cuota.toLocaleString('es-CL')}`;
    document.getElementById('modalPagoCuota').style.display = 'block';
}

function manejarSubidaArchivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { mostrarError('El archivo no debe superar los 5MB.'); e.target.value = ''; return; }
    archivoComprobante = file;
}

async function registrarPagoCuota(e) {
    e.preventDefault();
    const cuotaId = document.getElementById('pagoCuotaId').value;
    const monto = parseFloat(document.getElementById('pagoMonto').value);
    const cuota = cuotas.find(c => c.ID_Cuota == cuotaId);
    if (!cuota || monto <= 0) { mostrarError('Datos de pago inválidos.'); return; }
    cuota.Monto_Pagado += monto;
    cuota.Saldo_Cuota -= monto;
    if (cuota.Saldo_Cuota <= 0) { cuota.Estado = "Pagado"; }
    const convenio = convenios.find(c => c.ID_Convenio == cuota.ID_Convenio);
    if (convenio) {
        convenio.Saldo_Convenio -= monto;
        if (convenio.Saldo_Convenio <= 0) { convenio.Estado = "Pagado"; }
    }
    renderizarTablaConvenios();
    if (document.getElementById('modalDetalleConvenio').style.display === 'block') { verDetalleConvenio(convenio.ID_Convenio); }
    cerrarModalPago();
    mostrarExito('Pago registrado correctamente.');
}

async function anularConvenio(convenioId) {
    if (confirm('¿Está seguro de anular este convenio?')) {
        const convenio = convenios.find(c => c.ID_Convenio == convenioId);
        if (convenio) {
            convenio.Estado = "Anulado";
            convenio.Saldo_Convenio = 0;
            cuotas.forEach(cuota => { if (cuota.ID_Convenio == convenioId && cuota.Estado === "Pendiente") { cuota.Estado = "Anulada"; } });
        }
        renderizarTablaConvenios();
        mostrarExito('Convenio anulado correctamente.');
    }
}

function editarConvenio(convenioId) {
    mostrarInfo('Funcionalidad de edición en desarrollo.');
}

function cerrarModalNuevo() { document.getElementById('modalNuevoConvenio').style.display = 'none'; }
function cerrarModalDetalle() { document.getElementById('modalDetalleConvenio').style.display = 'none'; }
function cerrarModalPago() { document.getElementById('modalPagoCuota').style.display = 'none'; }

function mostrarError(mensaje) { alert('Error: ' + mensaje); }
function mostrarExito(mensaje) { alert('Éxito: ' + mensaje); }
function mostrarInfo(mensaje) { alert('Información: ' + mensaje); }
