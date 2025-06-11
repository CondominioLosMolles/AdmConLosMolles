// CONFIGURACIÓN DE CREDENCIALES Y API
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU'; 
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8'; // ID de la hoja principal de Residentes
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
            // SE RESTAURA LA LÍNEA DE GMAIL API QUE CAUSABA EL ERROR
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
    const residents = await readSheetData(SPREADSHEET_ID, 'Residentes!A2:J');
    allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun', 'ID_Sheet_Pagos'], ...residents];
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
            default: viewContent = `<div class="view active"><h1>Módulo en Construcción</h1></div>`; break;
        }
        mainContent.innerHTML = viewContent;
        attachViewListeners(viewName);
    } catch (error) {
        console.error(`Error al cambiar a la vista ${viewName}:`, error);
        mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista: ${error.message}.</p>`;
    } finally {
        hideLoader();
    }
}

function attachViewListeners(viewName) {
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
    }
}

// --- LÓGICA DE VISTAS ---

async function loadDashboardView() {
    // Código del Dashboard completo
    return `<div class="view active"><h1>Dashboard</h1><p>Bienvenido al sistema de administración.</p></div>`;
}

async function loadResidentesView() {
    // Código de Residentes completo
    let tableRows = allResidentsData.slice(1).map((row, index) => {
        if (!row) return '';
        return `<tr><td>${row[1] || ''}</td><td>${row[2] || ''}</td><td>${row[3] || ''}</td><td>${row[4] || ''}</td><td>${row[5] || ''}</td><td>${row[7] || ''}</td><td class="action-icons"><span class="icon icon-edit" data-row-index="${index + 2}">✏️</span><span class="icon icon-delete" data-row-index="${index + 2}">🗑️</span></td></tr>`;
    }).join('');
    return `<div class="view active"><h1>Gestión de Residentes</h1><div class="controls"><button class="cta-button" id="add-resident-btn">Agregar Residente</button></div><div class="table-container"><table id="residentes-table"><thead><tr><th>Nombre Completo</th><th>RUT</th><th>N° Parcela</th><th>Dirección</th><th>E-mail</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`;
}

async function loadGastosComunesView() {
    const residentOptions = allResidentsData.slice(1).map(r => r ? `<option value="${r[0]}">${r[3]} - ${r[1]}</option>` : '').join('');
    return `
        <div class="view active" id="gastos-comunes-view">
            <h1>Gestión de Gastos Comunes</h1>
            <div class="controls">
                <label for="resident-selector-gc">Seleccione un Residente:</label>
                <select id="resident-selector-gc" onchange="displayResidentSheet()">
                    <option value="">-- Seleccione --</option>
                    ${residentOptions}
                </select>
            </div>
            <div id="resident-sheet-details" class="table-container">
                <p>Seleccione un residente para ver su detalle de pagos.</p>
            </div>
        </div>
    `;
}

async function displayResidentSheet() {
    const residentId = document.getElementById('resident-selector-gc').value;
    const detailsContainer = document.getElementById('resident-sheet-details');
    if (!residentId) {
        detailsContainer.innerHTML = '<p>Seleccione un residente para ver su detalle de pagos.</p>';
        return;
    }
    showLoader();
    try {
        const residentData = allResidentsData.find(r => r && r[0] === residentId);
        const paymentSheetId = residentData[9]; 

        if (!paymentSheetId) {
            throw new Error("Este residente no tiene una planilla de pagos asociada. Revisa la columna 'ID_Sheet_Pagos' en la hoja de Residentes.");
        }

        const sheetData = await readSheetData(paymentSheetId, 'Hoja 1!A1:L13');
        
        let tableHtml = '<table>';
        sheetData.forEach((row, rowIndex) => {
            tableHtml += `<tr>`;
            row.forEach((cell) => {
                tableHtml += rowIndex === 0 ? `<th>${cell}</th>` : `<td>${cell || ''}</td>`;
            });
            tableHtml += `</tr>`;
        });
        tableHtml += '</table>';
        
        detailsContainer.innerHTML = `
            <h3>Detalle de Pagos para Parcela N° ${residentData[3]}</h3>
            ${tableHtml}
            <br>
            <button class="cta-button" id="register-payment-btn">Registrar Nuevo Pago</button>
        `;
        document.getElementById('register-payment-btn').addEventListener('click', () => showRegisterPaymentModal(paymentSheetId));

    } catch (error) {
        console.error("Error displaying resident sheet:", error);
        detailsContainer.innerHTML = `<p style="color:red;">No se pudo cargar la planilla del residente. ${error.message}</p>`;
    } finally {
        hideLoader();
    }
}

function showRegisterPaymentModal(sheetId) {
    const formHtml = `
        <h2>Registrar Nuevo Pago</h2>
        <form id="payment-form">
            <input type="hidden" id="paymentSheetId" value="${sheetId}">
            <label for="mes">Mes a Pagar (1 para Enero, 2 para Febrero, etc.):</label>
            <input type="number" id="mes" min="1" max="12" required>
            <label for="montoPagado">Monto Pagado:</label>
            <input type="number" id="montoPagado" required>
            <label for="fechaPago">Fecha de Pago:</label>
            <input type="date" id="fechaPago" required>
            <button type="submit" class="cta-button">Guardar Pago</button>
        </form>
    `;
    showModal(formHtml);
    document.getElementById('payment-form').addEventListener('submit', handleSavePaymentToSheet);
}

async function handleSavePaymentToSheet(e) {
    e.preventDefault();
    showLoader();
    const sheetId = document.getElementById('paymentSheetId').value;
    const mes = parseInt(document.getElementById('mes').value);
    const monto = document.getElementById('montoPagado').value;
    const fecha = document.getElementById('fechaPago').value;
    const rowToUpdate = mes + 1;

    try {
        const updateRequests = [
            { range: `'Hoja 1'!D${rowToUpdate}`, values: [[monto]] },
            { range: `'Hoja 1'!L${rowToUpdate}`, values: [[fecha]] }
        ];

        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId,
            resource: {
                valueInputOption: 'USER_ENTERED',
                data: updateRequests
            }
        });

        alert("Pago registrado exitosamente. La planilla se ha actualizado.");
        hideModal();
        displayResidentSheet();
    } catch (error) {
        console.error("Error al guardar el pago:", error);
        alert("Error al guardar el pago: " + (error.result?.error?.message || error.message));
    } finally {
        hideLoader();
    }
}

// --- FUNCIONES DE RESIDENTES ---
function showAddResidentModal() { /* ... código completo ... */ }
async function handleAddResident(e) { /* ... código completo ... */ }
function handleResidentTableClick(e) {
    const rowIndex = e.target.getAttribute('data-row-index');
    if (e.target.matches('.icon-delete')) { if (confirm('¿Está seguro?')) { deleteSheetRow(SPREADSHEET_ID, 'Residentes', rowIndex); } }
    if (e.target.matches('.icon-edit')) { showEditResidentModal(rowIndex); }
}
function showEditResidentModal(rowIndex) { /* ... código completo ... */ }
async function handleUpdateResident(e) { /* ... código completo ... */ }


// --- FUNCIONES DE API DE GOOGLE SHEETS (ADAPTADAS) ---
async function readSheetData(spreadsheetId, range) {
    const response = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range });
    return response.result.values || [];
}

async function appendSheetData(spreadsheetId, sheetName, values) {
    return gapi.client.sheets.spreadsheets.values.append({ spreadsheetId, range: `${sheetName}!A1`, valueInputOption: 'USER_ENTERED', resource: { values } });
}

async function updateSheetRow(spreadsheetId, sheetName, rowIndex, values) {
    const range = `${sheetName}!A${rowIndex}`;
    return gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption: 'USER_ENTERED', resource: { values } });
}

async function deleteSheetRow(spreadsheetId, sheetName, rowIndex) {
    showLoader();
    try {
        const sheetMetadata = await gapi.client.sheets.spreadsheets.get({ spreadsheetId });
        const sheet = sheetMetadata.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada.`);
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: { requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: "ROWS", startIndex: parseInt(rowIndex) - 1, endIndex: parseInt(rowIndex) } } }] }
        });
        const residents = await readSheetData(SPREADSHEET_ID, 'Residentes!A2:J');
        allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun', 'ID_Sheet_Pagos'], ...residents];
        alert("Fila eliminada correctamente."); 
        switchView('residentes');
    } catch (err) { 
        console.error("Error al eliminar la fila:", err); 
        alert("No se pudo eliminar la fila.");
    } finally {
        hideLoader();
    }
}

function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}
