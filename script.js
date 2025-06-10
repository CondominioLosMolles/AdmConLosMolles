// CONFIGURACIÓN DE CREDENCIALES Y API
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU'; 
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let allResidentsData = []; // Caché para datos de residentes

// ELEMENTOS DEL DOM
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader-wrapper');
const modalContainer = document.getElementById('modal-container');
const modalBody = document.getElementById('modal-body');

// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.sidebar').addEventListener('click', (e) => {
        if (e.target.matches('.nav-link')) {
            e.preventDefault();
            const viewName = e.target.getAttribute('data-view');
            if (viewName) {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
                switchView(viewName);
            }
        }
        if (e.target.matches('#logout-button')) {
            handleSignoutClick();
        }
    });

    document.querySelector('.close-modal-button').addEventListener('click', () => hideModal());
    window.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            hideModal();
        }
    });
});

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [
                "https://sheets.googleapis.com/$discovery/rest?version=v4",
                "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
                "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
            ],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error("Error inicializando GAPI client:", error);
        document.getElementById('loader-wrapper').innerHTML = `<p style="color:red; text-align:center; padding: 20px;"><b>Error de Configuración:</b> No se pudo inicializar la API de Google. <br/>Verifica que la API Key es correcta, que no tiene restricciones y que las APIs de Sheets, Drive y Gmail están habilitadas en tu proyecto de Google Cloud.</p>`;
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        loginContainer.style.display = 'flex';
        loader.style.display = 'none';
        document.getElementById('login-button').addEventListener('click', handleAuthClick);
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        await startApp();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        appContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        mainContent.innerHTML = '';
        allResidentsData = [];
    }
}

async function startApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    allResidentsData = await readSheetData('Residentes!A:H');
    switchView('dashboard');
}

function showLoader() { loader.style.display = 'flex'; }
function hideLoader() { loader.style.display = 'none'; }
function showModal(htmlContent) {
    modalBody.innerHTML = htmlContent;
    modalContainer.style.display = 'flex';
}
function hideModal() {
    modalContainer.style.display = 'none';
    modalBody.innerHTML = '';
}

async function switchView(viewName) {
    showLoader();
    try {
        let viewContent = '';
        switch (viewName) {
            case 'dashboard':
                viewContent = await loadDashboardView();
                break;
            case 'residentes':
                viewContent = await loadResidentesView();
                break;
            case 'gastos-comunes':
                viewContent = await loadGastosComunesView();
                break;
            default:
                 viewContent = `<div class="view active"><h1>${viewName.charAt(0).toUpperCase() + viewName.slice(1).replace('-', ' ')}</h1><p>Este módulo aún está en construcción.</p></div>`;
                 break;
        }
        mainContent.innerHTML = viewContent;
        attachViewListeners(viewName);
    } catch (error) {
        console.error(`Error al cambiar a la vista ${viewName}:`, error);
        mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista: ${error.message}.<br/>Asegúrate de que la hoja de cálculo relacionada con "${viewName}" existe en tu Google Sheet.</p>`;
    } finally {
        hideLoader();
    }
}

// --- LÓGICA DE VISTAS ---

async function loadDashboardView() {
    const [residentsData, paymentsData, expensesData, maintenanceData] = await Promise.all([
        readSheetData('Residentes!A2:H'), readSheetData('Pagos_GC!F:G'),
        readSheetData('Egresos!B:F'), readSheetData('Mantenciones!F:F')
    ]).catch(err => {
        throw new Error("No se pudieron cargar los datos del dashboard. Revisa que todas las hojas (Residentes, Pagos_GC, Egresos, Mantenciones) existan.");
    });
    const now = new Date();
    const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
    const activeResidents = residentsData.filter(r => r && r[6] === 'Activo').length;
    const morososCount = residentsData.filter(r => r && r[6] === 'Moroso').length;
    const incomeThisMonth = paymentsData.filter(p => p && p[1] && new Date(p[1]).getMonth() === currentMonth && new Date(p[1]).getFullYear() === currentYear).reduce((sum, p) => sum + (parseFloat(p[0]) || 0), 0);
    const expensesThisMonth = expensesData.filter(e => e && e[0] && new Date(e[0]).getMonth() === currentMonth && new Date(e[0]).getFullYear() === currentYear).reduce((sum, e) => sum + (parseFloat(e[4]) || 0), 0);
    const totalIncome = paymentsData.reduce((sum, p) => sum + (parseFloat(p[0]) || 0), 0);
    const totalExpenses = expensesData.reduce((sum, e) => sum + (parseFloat(e[4]) || 0), 0);
    const cashBalance = totalIncome - totalExpenses;
    const pendingMaintenance = maintenanceData.filter(m => m && (m[0] === 'Pendiente' || m[0] === 'Urgente')).length;
    const monthlyTotals = {};
    for (let i = 11; i >= 0; i--) { const d = new Date(currentYear, currentMonth - i, 1); const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; monthlyTotals[monthKey] = { income: 0, expense: 0, label: d.toLocaleString('es-CL', { month: 'short' }) };}
    paymentsData.forEach(p => { if (!p || !p[1]) return; const d = new Date(p[1]); const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if (monthlyTotals[monthKey]) { monthlyTotals[monthKey].income += (parseFloat(p[0]) || 0); } });
    expensesData.forEach(e => { if (!e || !e[0]) return; const d = new Date(e[0]); const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if (monthlyTotals[monthKey]) { monthlyTotals[monthKey].expense += (parseFloat(e[4]) || 0); } });
    const chartLabels = Object.values(monthlyTotals).map(m => m.label); const chartIncomeData = Object.values(monthlyTotals).map(m => m.income); const chartExpenseData = Object.values(monthlyTotals).map(m => m.expense);
    return `<div class="view active" id="dashboard-view"><h1>Dashboard</h1><div class="dashboard-grid"><div class="widget"><h3>Residentes Registrados</h3><div class="value">${activeResidents}</div><div class="details">Estado 'Activo'</div></div><div class="widget"><h3>Ingresos del Mes</h3><div class="value positive">${formatCurrency(incomeThisMonth)}</div><div class="details">Pagos de Gastos Comunes</div></div><div class="widget"><h3>Egresos del Mes</h3><div class="value negative">${formatCurrency(expensesThisMonth)}</div><div class="details">Mantención y Servicios</div></div><div class="widget"><h3>Saldo de Caja</h3><div class="value">${formatCurrency(cashBalance)}</div><div class="details">Estimado Total</div></div><div class="widget"><h3>Mantenciones</h3><div class="value">${pendingMaintenance}</div><div class="details">Pendientes / Urgentes</div></div><div class="widget"><h3>Resumen de Morosidad</h3><div class="value">${morososCount}</div><div class="details">Residentes en estado 'Moroso'</div></div></div><div class="chart-container"><canvas id="incomeExpenseChart" data-labels='${JSON.stringify(chartLabels)}' data-income='${JSON.stringify(chartIncomeData)}' data-expenses='${JSON.stringify(chartExpenseData)}'></canvas></div></div>`;
}

async function loadResidentesView() {
    const residents = await readSheetData('Residentes!A2:H');
    let tableRows = residents.map((row, index) => { if (!row) return ''; return `<tr><td>${row[1] || ''}</td><td>${row[2] || ''}</td><td>${row[3] || ''}</td><td>${row[4] || ''}</td><td>${row[5] || ''}</td><td>${row[6] || ''}</td><td>${formatCurrency(parseFloat(row[7] || 0))}</td><td class="action-icons"><span class="icon icon-edit" data-row-index="${index + 2}">✏️</span><span class="icon icon-delete" data-row-index="${index + 2}">🗑️</span></td></tr>`}).join('');
    return `<div class="view active" id="residentes-view"><h1>Gestión de Residentes</h1><div class="controls"><input type="search" id="resident-search" placeholder="Buscar por Nombre, RUT o Parcela..."><div><button class="cta-button" id="add-resident-btn">Agregar Residente</button></div></div><div class="table-container"><table id="residentes-table"><thead><tr><th>Nombre Completo</th><th>RUT</th><th>N° Parcela</th><th>E-mail</th><th>Teléfono</th><th>Estado</th><th>Valor Gasto Común</th><th>Acciones</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`;
}

async function loadGastosComunesView() {
    const residentOptions = allResidentsData.slice(1).map(r => r ? `<option value="${r[0]}">${r[3]} - ${r[1]}</option>` : '').join('');
    return `
        <div class="view active" id="gastos-comunes-view">
            <h1>Gestión de Gastos Comunes</h1>
            <div class="controls" style="display: block;">
                <label for="resident-selector-gc">Seleccione un Residente:</label>
                <select id="resident-selector-gc" style="width: auto; max-width: 400px; margin-right: 10px;">
                    <option value="">-- Buscar por Parcela o Nombre --</option>
                    ${residentOptions}
                </select>
                <label for="tmc-input">TMC Anual (%):</label>
                <input type="number" id="tmc-input" value="34.53" step="0.01" style="width: 80px;" title="Tasa Máxima Convencional para operaciones en moneda nacional no reajustable, en cuotas, de plazos entre 90 días y un año. Valor referencial a Junio 2025.">
            </div>
            <div id="resident-gc-details"><p>Seleccione un residente para ver su historial de pagos.</p></div>
        </div>
    `;
}

function attachViewListeners(viewName) {
    if (viewName === 'dashboard') {
        const canvas = document.getElementById('incomeExpenseChart');
        if (canvas) {
            const ctx = canvas.getContext('2d'); const labels = JSON.parse(canvas.getAttribute('data-labels')); const incomeData = JSON.parse(canvas.getAttribute('data-income')); const expenseData = JSON.parse(canvas.getAttribute('data-expenses'));
            new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Ingresos', data: incomeData, backgroundColor: 'rgba(40, 167, 69, 0.7)' }, { label: 'Egresos', data: expenseData, backgroundColor: 'rgba(220, 53, 69, 0.7)' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } } });
        }
    }

    if (viewName === 'residentes') {
        document.getElementById('add-resident-btn').addEventListener('click', showAddResidentModal);
        document.getElementById('residentes-table').addEventListener('click', handleResidentTableClick);
        document.getElementById('resident-search').addEventListener('keyup', filterResidentTable);
    }
    
    if (viewName === 'gastos-comunes') {
        document.getElementById('resident-selector-gc').addEventListener('change', displayResidentGCDetails);
        document.getElementById('tmc-input').addEventListener('change', displayResidentGCDetails);
    }
}

// --- LÓGICA DE GASTOS COMUNES (CORREGIDA) ---
async function displayResidentGCDetails() {
     alert("¡Función ejecutada!");
    const residentId = document.getElementById('resident-selector-gc').value;
    const detailsContainer = document.getElementById('resident-gc-details');
    if (!residentId) {
        detailsContainer.innerHTML = '<p>Seleccione un residente para ver su historial de pagos.</p>';
        return;
    }
    showLoader();

    try {
        const residentData = allResidentsData.find(r => r[0] === residentId);
        if (!residentData) {
            throw new Error("No se encontraron los datos del residente seleccionado.");
        }
        const valorGastoComun = parseFloat(residentData[7]);
        const nParcela = residentData[3];

        const allPayments = await readSheetData('Pagos_GC!A:I');
        const residentPayments = allPayments.slice(1).filter(p => p && p[1] === residentId);

        const currentYear = new Date().getFullYear();
        let tableRows = '';

        for (let i = 0; i < 12; i++) {
            const periodo = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            const fechaVencimiento = new Date(currentYear, i, 10);
            
            const paymentForPeriod = residentPayments.find(p => p[3] === periodo);
            const montoPagado = paymentForPeriod ? parseFloat(paymentForPeriod[5] || 0) : 0;
            
            let mesesDeMora = 0;
            if (new Date() > fechaVencimiento && montoPagado < valorGastoComun) {
                let start = fechaVencimiento;
                let end = new Date();
                mesesDeMora = (end.getMonth() - start.getMonth()) + (12 * (end.getFullYear() - start.getFullYear()));
                 if (end.getDate() < start.getDate()) {
                    mesesDeMora--;
                }
                mesesDeMora = Math.max(1, mesesDeMora);
            }
            
            const tmcAnual = parseFloat(document.getElementById('tmc-input').value) || 0;
            const interesPorMora = (mesesDeMora > 0) ? (((valorGastoComun * tmcAnual) / 100) / 12) * mesesDeMora : 0;
            const multaAdicional = (mesesDeMora > 0) ? (valorGastoComun * 0.25) * 1 : 0; // Se aplica una vez por mes de atraso.
            
            const deudaTotalMes = (valorGastoComun + interesPorMora + multaAdicional) - montoPagado;
            const valorPendiente = valorGastoComun - montoPagado;
            
            let estado;
            if (montoPagado >= valorGastoComun) {
                estado = '<span style="color:green;">Pagado</span>';
            } else if (new Date() > fechaVencimiento) {
                estado = '<span style="color:red;">Pendiente</span>';
            } else {
                estado = 'Por Vencer';
            }
            
            let saldoColor = valorPendiente > 0 ? 'red' : 'green';
            
            tableRows += `
                <tr>
                    <td>${new Date(currentYear, i, 1).toLocaleString('es-CL', { month: 'long' })}</td>
                    <td>${formatCurrency(valorGastoComun)}</td>
                    <td>${fechaVencimiento.toLocaleDateString('es-CL')}</td>
                    <td>${formatCurrency(montoPagado)}</td>
                    <td style="color:${saldoColor};">${formatCurrency(valorPendiente)}</td>
                    <td>${formatCurrency(interesPorMora)}</td>
                    <td>${formatCurrency(multaAdicional)}</td>
                    <td>${mesesDeMora}</td>
                    <td>${formatCurrency(deudaTotalMes)}</td>
                    <td>${estado}</td>
                </tr>
            `;
        }

        detailsContainer.innerHTML = `
            <h3>Historial de Pagos para Parcela N° ${nParcela}</h3>
            <div class="table-container">
                <table id="gc-history-table">
                    <thead>
                        <tr>
                            <th>Mes</th><th>Valor Gasto Común</th><th>Fecha Venc.</th><th>Monto Pagado</th><th>Valor Pendiente o Saldo a Favor</th>
                            <th>Interés Mora</th><th>¼ Multa Adic.</th><th>Meses Mora</th><th>Deuda Total Mes</th><th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>
            <br>
            <button class="cta-button" id="register-payment-btn">Registrar Pago</button>
        `;
        document.getElementById('register-payment-btn').addEventListener('click', () => showRegisterPaymentModal(residentId, nParcela));

    } catch (error) {
        console.error("Error displaying resident details:", error);
        detailsContainer.innerHTML = `<p style="color:red;">No se pudo cargar el historial del residente. ${error.message}</p>`;
    } finally {
        hideLoader();
    }
}


// --- OTRAS FUNCIONES (RESTO DEL CÓDIGO) ---
function showRegisterPaymentModal(residentId, nParcela) {
    const formHtml = `
        <h2>Registrar Pago para Parcela N° ${nParcela}</h2>
        <form id="payment-form">
            <input type="hidden" id="residentId" value="${residentId}">
            <input type="hidden" id="nParcela" value="${nParcela}">
            <label for="periodo">Período de Pago (YYYY-MM):</label>
            <input type="text" id="periodo" required placeholder="Ej: 2025-07">
            <label for="montoPagado">Monto Pagado:</label>
            <input type="number" id="montoPagado" required>
            <label for="fechaPago">Fecha de Pago:</label>
            <input type="date" id="fechaPago" required>
            <label for="metodoPago">Método de Pago:</label>
            <select id="metodoPago">
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
            </select>
            <label for="comprobante">Comprobante (PDF/JPG):</label>
            <input type="file" id="comprobante">
            <button type="submit" class="cta-button">Guardar Pago</button>
        </form>
    `;
    showModal(formHtml);
    document.getElementById('payment-form').addEventListener('submit', handleSavePayment);
}

async function handleSavePayment(e) {
    e.preventDefault();
    showLoader();
    const residentId = document.getElementById('residentId').value;
    const nParcela = document.getElementById('nParcela').value;
    const periodo = document.getElementById('periodo').value;
    const fechaPago = document.getElementById('fechaPago').value;
    const fileInput = document.getElementById('comprobante');
    let comprobanteId = '';

    try {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const folderPath = `/LosMolles/Contabilidad/Parcela Pagos/${nParcela}`;
            const fileName = `${periodo}-Comprobante.${file.name.split('.').pop()}`;
            comprobanteId = await uploadFileToDrive(file, folderPath, fileName);
        }

        const lastData = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Pagos_GC!A:A' });
        const lastId = lastData.result.values ? Math.max(...lastData.result.values.flat().map(Number).filter(n => !isNaN(n))) : 0;
        
        const newPayment = [
            lastId + 1, residentId, nParcela, periodo, `${periodo}-10`,
            document.getElementById('montoPagado').value, fechaPago,
            document.getElementById('metodoPago').value, comprobanteId
        ];

        await appendSheetData('Pagos_GC', [newPayment]);
        alert("Pago registrado exitosamente.");
        hideModal();
        displayResidentGCDetails();
    } catch (error) {
        console.error("Error al guardar el pago:", error);
        alert("Error al guardar el pago: " + (error.message || error.result.error.message));
    } finally {
        hideLoader();
    }
}

async function uploadFileToDrive(file, path, fileName) {
    const findOrCreateFolder = async (parentFolderId, folderName) => {
        const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentFolderId}' in parents and trashed=false`;
        const res = await gapi.client.drive.files.list({ q: query, fields: 'files(id)' });
        if (res.result.files.length > 0) {
            return res.result.files[0].id;
        } else {
            const folderMetadata = { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [parentFolderId] };
            const folder = await gapi.client.drive.files.create({ resource: folderMetadata, fields: 'id' });
            return folder.result.id;
        }
    };

    const pathParts = path.split('/').filter(p => p);
    let currentFolderId = 'root';
    for (const part of pathParts) {
        currentFolderId = await findOrCreateFolder(currentFolderId, part);
    }
    
    const fileMetadata = { name: fileName, parents: [currentFolderId] };
    const media = { mimeType: file.type, body: file };
    const uploadedFile = await gapi.client.drive.files.create({ resource: fileMetadata, media: media, fields: 'id' });
    return uploadedFile.result.id;
}

function showAddResidentModal() {
    const formHtml = `<h2>Agregar Nuevo Residente</h2><form id="resident-form"><label for="nombreCompleto">Nombre Completo:</label><input type="text" id="nombreCompleto" required><label for="rut">RUT:</label><input type="text" id="rut" required><label for="nParcela">N° Parcela:</label><input type="text" id="nParcela" required><label for="email">Email:</label><input type="email" id="email" required><label for="telefono">Teléfono:</label><input type="tel" id="telefono"><label for="estado">Estado:</label><select id="estado"><option value="Activo">Activo</option><option value="Moroso">Moroso</option><option value="Inactivo">Inactivo</option></select><label for="valorGastoComun">Valor Gasto Común:</label><input type="number" id="valorGastoComun" required><button type="submit" class="cta-button">Guardar Residente</button></form>`;
    showModal(formHtml);
    document.getElementById('resident-form').addEventListener('submit', handleAddResident);
}

async function handleAddResident(e) {
    e.preventDefault(); showLoader();
    try {
        const lastData = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Residentes!A:A' });
        const lastId = lastData.result.values ? Math.max(...lastData.result.values.flat().map(Number).filter(n => !isNaN(n))) : 0;
        const newResident = [ lastId + 1, document.getElementById('nombreCompleto').value, document.getElementById('rut').value, document.getElementById('nParcela').value, document.getElementById('email').value, document.getElementById('telefono').value, document.getElementById('estado').value, document.getElementById('valorGastoComun').value ];
        await appendSheetData('Residentes', [newResident]);
        allResidentsData = await readSheetData('Residentes!A:H');
        hideModal(); switchView('residentes');
    } catch (error) { console.error("Error al agregar residente:", error); alert("Error al guardar: " + error.result.error.message);
    } finally { hideLoader(); }
}

function handleResidentTableClick(e) {
    const rowIndex = e.target.getAttribute('data-row-index');
    if (e.target.matches('.icon-delete')) { if (confirm('¿Está seguro de que desea eliminar a este residente? Esta acción no se puede deshacer.')) { deleteSheetRow('Residentes', rowIndex); } }
    if (e.target.matches('.icon-edit')) { alert(`Función "Editar" no implementada.`); }
}

function filterResidentTable() {
    const filter = document.getElementById('resident-search').value.toUpperCase();
    const table = document.getElementById('residentes-table'); const tr = table.getElementsByTagName('tr');
    for (let i = 1; i < tr.length; i++) {
        const tds = tr[i].getElementsByTagName('td');
        if (tds.length > 0 && (tds[0].textContent.toUpperCase().indexOf(filter) > -1 || tds[1].textContent.toUpperCase().indexOf(filter) > -1 || tds[2].textContent.toUpperCase().indexOf(filter) > -1)) { tr[i].style.display = ""; } else { tr[i].style.display = "none"; }
    }
}

function formatCurrency(value) {
    if (typeof value !== 'number') return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}

async function readSheetData(range) {
    const response = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: range });
    return response.result.values || [];
}

async function appendSheetData(sheetName, values) {
    return gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID, range: `${sheetName}!A1`, valueInputOption: 'USER_ENTERED', resource: { values: values },
    });
}

async function deleteSheetRow(sheetName, rowIndex) {
    showLoader();
    try {
        const sheetMetadata = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheet = sheetMetadata.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada.`);
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: "ROWS", startIndex: rowIndex - 1, endIndex: rowIndex } } }] }
        });
        allResidentsData = await readSheetData('Residentes!A:H');
        alert("Fila eliminada correctamente."); switchView('residentes');
    } catch (err) { console.error("Error al eliminar la fila:", err); alert("No se pudo eliminar la fila.");
    } finally { hideLoader(); }
}
