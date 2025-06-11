// CONFIGURACIÓN DE CREDENCIALES Y API
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU'; 
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let allResidentsData = [];

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
        if (e.target.matches('#logout-button')) { handleSignoutClick(); }
    });
    document.querySelector('.close-modal-button').addEventListener('click', () => hideModal());
    window.addEventListener('click', (e) => { if (e.target === modalContainer) { hideModal(); } });
});

function gapiLoaded() { gapi.load('client', initializeGapiClient); }
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: '' });
    gisInited = true;
    maybeEnableButtons();
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error("Error inicializando GAPI client:", error);
        document.getElementById('loader-wrapper').innerHTML = `<p style="color:red; text-align:center; padding: 20px;"><b>Error de Configuración:</b> No se pudo inicializar la API de Google. <br/>Verifica la API Key, sus restricciones, y que las APIs de Sheets, Drive y Gmail estén habilitadas.</p>`;
    }
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('login-container').style.display = 'flex';
        loader.style.display = 'none';
        document.getElementById('login-button').addEventListener('click', handleAuthClick);
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => { if (resp.error !== undefined) { throw (resp); } await startApp(); };
    if (gapi.client.getToken() === null) { tokenClient.requestAccessToken({ prompt: 'consent' }); } else { tokenClient.requestAccessToken({ prompt: '' }); }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
        mainContent.innerHTML = '';
        allResidentsData = [];
    }
}

async function startApp() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    const residents = await readSheetData('Residentes!A2:H');
    allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Email', 'Telefono', 'Estado', 'ValorGastoComun'], ...residents];
    switchView('dashboard');
}

function showLoader() { loader.style.display = 'flex'; }
function hideLoader() { loader.style.display = 'none'; }
function showModal(htmlContent) { modalBody.innerHTML = htmlContent; modalContainer.style.display = 'flex'; }
function hideModal() { modalContainer.style.display = 'none'; modalBody.innerHTML = '';}

async function switchView(viewName) {
    showLoader();
    try {
        let viewContent = '';
        switch (viewName) {
            case 'dashboard': viewContent = await loadDashboardView(); break;
            case 'residentes': viewContent = await loadResidentesView(); break;
            case 'gastos-comunes': viewContent = await loadGastosComunesView(); break;
            default: viewContent = `<div class="view active"><h1>${viewName.charAt(0).toUpperCase() + viewName.slice(1).replace('-', ' ')}</h1><p>Este módulo aún está en construcción.</p></div>`; break;
        }
        mainContent.innerHTML = viewContent;
        attachViewListeners(viewName);
    } catch (error) {
        console.error(`Error al cambiar a la vista ${viewName}:`, error);
        mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista: ${error.message}.<br/>Asegúrate de que la hoja de cálculo relacionada con "${viewName}" existe.</p>`;
    } finally {
        hideLoader();
    }
}

function attachViewListeners(viewName) {
    // Para la prueba final, esta función no necesita hacer nada para 'gastos-comunes'
    try {
        if (viewName === 'dashboard') {
            const canvas = document.getElementById('incomeExpenseChart');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const labels = JSON.parse(canvas.getAttribute('data-labels'));
                const incomeData = JSON.parse(canvas.getAttribute('data-income'));
                const expenseData = JSON.parse(canvas.getAttribute('data-expenses'));
                new Chart(ctx, {
                    type: 'bar', data: { labels: labels, datasets: [ { label: 'Ingresos', data: incomeData, backgroundColor: 'rgba(40, 167, 69, 0.7)' }, { label: 'Egresos', data: expenseData, backgroundColor: 'rgba(220, 53, 69, 0.7)' } ] },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: { y: { beginAtZero: true, suggestedMax: 1000000, ticks: { callback: function(value) { if (Math.floor(value) === value) { return formatCurrency(value); } } } } },
                        plugins: { tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) { label += ': '; } if (context.parsed.y !== null) { label += formatCurrency(context.parsed.y); } return label; } } } }
                    }
                });
            }
        }
        if (viewName === 'residentes') {
            document.getElementById('add-resident-btn').addEventListener('click', showAddResidentModal);
            document.getElementById('residentes-table').addEventListener('click', handleResidentTableClick);
            document.getElementById('resident-search').addEventListener('keyup', filterResidentTable);
            document.getElementById('export-excel-btn').addEventListener('click', exportResidentsToExcel);
        }
    } catch(e) {
        console.error("Error al adjuntar listeners: ", e);
    }
}

// --- LÓGICA DE VISTAS ---

async function loadDashboardView() {
    const [residentsData, paymentsData, expensesData, maintenanceData] = await Promise.all([
        readSheetData('Residentes!A2:H'), readSheetData('Pagos_GC!F:G'),
        readSheetData('Egresos!B:F'), readSheetData('Mantenciones!F:F')
    ]).catch(err => { throw new Error("No se pudieron cargar los datos del dashboard. Revisa que todas las hojas (Residentes, Pagos_GC, Egresos, Mantenciones) existan."); });
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
    let tableRows = allResidentsData.slice(1).map((row, index) => {
        if (!row) return '';
        const status = (row[6] || 'Inactivo').trim().toLowerCase();
        let statusClass = 'status-inactivo';
        if (status === 'activo') statusClass = 'status-activo';
        else if (status === 'moroso') statusClass = 'status-moroso';
        return `<tr><td>${row[1] || ''}</td><td>${row[2] || ''}</td><td>${row[3] || ''}</td><td>${row[4] || ''}</td><td>${row[5] || ''}</td><td><span class="status-badge ${statusClass}">${row[6] || 'Inactivo'}</span></td><td>${formatCurrency(parseFloat(row[7] || 0))}</td><td class="action-icons"><span class="icon icon-edit" data-row-index="${index + 2}">✏️</span><span class="icon icon-delete" data-row-index="${index + 2}">🗑️</span></td></tr>`;
    }).join('');
    return `<div class="view active" id="residentes-view"><h1>Gestión de Residentes</h1><div class="controls"><input type="search" id="resident-search" class="form-control" placeholder="Buscar por Nombre, RUT o Parcela..."><div class="controls-buttons"><button class="cta-button" id="export-excel-btn">Descargar Excel</button><button class="cta-button" id="add-resident-btn">Agregar Residente</button></div></div><div class="table-container"><table id="residentes-table"><thead><tr><th>Nombre Completo</th><th>RUT</th><th>N° Parcela</th><th>E-mail</th><th>Teléfono</th><th>Estado</th><th>Valor Gasto Común</th><th>Acciones</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`;
}

// =================================================================================
// MODIFICADO: loadGastosComunesView para la prueba final
// =================================================================================
async function loadGastosComunesView() {
    const residentOptions = allResidentsData.slice(1).map(r => r ? `<option value="${r[0]}">${r[3]} - ${r[1]}</option>` : '').join('');
    return `
        <div class="view active" id="gastos-comunes-view">
            <h1>Gestión de Gastos Comunes</h1>
            <div class="controls" style="display: block;">
                <label for="resident-selector-gc">Seleccione un Residente:</label>
                <select id="resident-selector-gc" onchange="document.getElementById('resident-gc-details').innerHTML = '<h3>¡El evento SÍ funcionó! ID Seleccionado: ' + this.value + '</h3>'" style="width: auto; max-width: 400px; margin-right: 10px;">
                    <option value="">-- Buscar por Parcela o Nombre --</option>
                    ${residentOptions}
                </select>
                <label for="tmc-input">TMC Anual (%):</label>
                <input type="number" id="tmc-input" value="34.53" step="0.01" style="width: 80px;" title="Tasa Máxima Convencional para operaciones en moneda nacional no reajustable.">
            </div>
            <div id="resident-gc-details"><p>Seleccione un residente para ver su historial de pagos.</p></div>
        </div>
    `;
}

// La función displayResidentGCDetails no se usará en esta prueba, pero la dejamos para no causar otros errores.
async function displayResidentGCDetails() {
    console.log("Esta función no debería ejecutarse en modo de prueba.");
}
// El resto de las funciones no se modifican...

function showRegisterPaymentModal(residentId, nParcela) { /* ...código sin cambios... */ }
async function handleSavePayment(e) { /* ...código sin cambios... */ }
async function uploadFileToDrive(file, path, fileName) { /* ...código sin cambios... */ }
function showAddResidentModal() { /* ...código sin cambios... */ }
async function handleAddResident(e) { /* ...código sin cambios... */ }
function handleResidentTableClick(e) { /* ...código sin cambios... */ }
function showEditResidentModal(rowIndex) { /* ...código sin cambios... */ }
async function handleUpdateResident(e) { /* ...código sin cambios... */ }
function filterResidentTable() { /* ...código sin cambios... */ }
function exportResidentsToExcel() { /* ...código sin cambios... */ }
function formatCurrency(value) { if (typeof value !== 'number' || isNaN(value)) return '$0'; return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value); }
async function readSheetData(range) { const response = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: range }); return response.result.values || []; }
async function appendSheetData(sheetName, values) { return gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${sheetName}!A1`, valueInputOption: 'USER_ENTERED', resource: { values: values }, }); }
async function updateSheetRow(sheetName, rowIndex, values) { const range = `${sheetName}!A${rowIndex}`; return gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: range, valueInputOption: 'USER_ENTERED', resource: { values: values } }); }
async function deleteSheetRow(sheetName, rowIndex) { showLoader(); try { const sheetMetadata = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID }); const sheet = sheetMetadata.result.sheets.find(s => s.properties.title === sheetName); if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada.`); await gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, resource: { requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: "ROWS", startIndex: parseInt(rowIndex) - 1, endIndex: parseInt(rowIndex) } } }] } }); const residents = await readSheetData('Residentes!A2:H'); allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Email', 'Telefono', 'Estado', 'ValorGastoComun'], ...residents]; alert("Fila eliminada correctamente."); switchView('residentes'); } catch (err) { console.error("Error al eliminar la fila:", err); alert("No se pudo eliminar la fila."); } finally { hideLoader(); } }
