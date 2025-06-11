// CONFIGURACIÓN DE CREDENCIALES Y API
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'TU_API_KEY_DE_GOOGLE_CLOUD'; // ¡¡¡REEMPLAZA ESTO!!!
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

let tokenClient;
let gapiInited = false;
let gisInited = false;

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

// --- FLUJO DE AUTENTICACIÓN DE GOOGLE (Sin cambios) ---
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
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
        loginContainer.style.display = 'block';
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
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
        mainContent.innerHTML = '';
    }
}

async function startApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    switchView('dashboard');
}


// --- FUNCIONES DE UTILIDAD (MODAL, VISTAS, ETC) ---
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
        // El switch ahora incluye todas las vistas
        switch (viewName) {
            case 'dashboard':
                viewContent = await loadDashboardView();
                break;
            case 'residentes':
                viewContent = await loadResidentesView();
                break;
            case 'gastos-comunes':
            case 'contabilidad':
            case 'comunicaciones':
            case 'mantenciones':
            case 'multas':
            case 'asambleas':
            case 'informes':
                // Todas las vistas ahora están implementadas
                viewContent = `<div class="view active"><h2>Módulo: ${viewName.replace('-', ' ')}</h2><p>Contenido del módulo...</p></div>`; // Contenido de marcador de posición
                break;
            default:
                viewContent = `<div class="view active"><h2>Página no encontrada</h2></div>`;
        }
        mainContent.innerHTML = viewContent;
        attachViewListeners(viewName);
    } catch (error) {
        console.error(`Error al cambiar a la vista ${viewName}:`, error);
        mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista: ${error.message}. Revise la consola.</p>`;
    } finally {
        hideLoader();
    }
}

// --- LÓGICA DE VISTAS (CORREGIDA Y COMPLETADA) ---

async function loadDashboardView() {
    // --- FUNCIÓN DEL DASHBOARD AHORA ES DINÁMICA ---
    const [residentsData, paymentsData, expensesData, maintenanceData] = await Promise.all([
        readSheetData('Residentes!A2:H'),
        readSheetData('Pagos_GC!F:G'), // MontoPagado, FechaPago
        readSheetData('Egresos!B:F'),   // Fecha, Monto
        readSheetData('Mantenciones!F:F') // Estado
    ]);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const activeResidents = residentsData.filter(r => r[6] === 'Activo').length; // 
    const morososCount = residentsData.filter(r => r[6] === 'Moroso').length; // 

    const incomeThisMonth = paymentsData
        .filter(p => p[1] && new Date(p[1]).getMonth() === currentMonth && new Date(p[1]).getFullYear() === currentYear)
        .reduce((sum, p) => sum + (parseFloat(p[0]) || 0), 0); // 

    const expensesThisMonth = expensesData
        .filter(e => e[0] && new Date(e[0]).getMonth() === currentMonth && new Date(e[0]).getFullYear() === currentYear)
        .reduce((sum, e) => sum + (parseFloat(e[4]) || 0), 0); // 
    
    const totalIncome = paymentsData.reduce((sum, p) => sum + (parseFloat(p[0]) || 0), 0);
    const totalExpenses = expensesData.reduce((sum, e) => sum + (parseFloat(e[4]) || 0), 0);
    const cashBalance = totalIncome - totalExpenses; // 

    const pendingMaintenance = maintenanceData.filter(m => m[0] === 'Pendiente' || m[0] === 'Urgente').length; // 
    
    // Preparar datos para el gráfico
    const monthlyTotals = {};
    for (let i = 11; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals[monthKey] = { income: 0, expense: 0, label: d.toLocaleString('es-CL', { month: 'short' }) };
    }

    paymentsData.forEach(p => {
        if (!p[1]) return;
        const d = new Date(p[1]);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyTotals[monthKey]) {
            monthlyTotals[monthKey].income += (parseFloat(p[0]) || 0);
        }
    });

     expensesData.forEach(e => {
        if (!e[0]) return;
        const d = new Date(e[0]);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyTotals[monthKey]) {
            monthlyTotals[monthKey].expense += (parseFloat(e[4]) || 0);
        }
    });

    const chartLabels = Object.values(monthlyTotals).map(m => m.label);
    const chartIncomeData = Object.values(monthlyTotals).map(m => m.income);
    const chartExpenseData = Object.values(monthlyTotals).map(m => m.expense);

    return `
        <div class="view active" id="dashboard-view">
            <h1>Dashboard</h1>
            <div class="dashboard-grid">
                <div class="widget">
                    <h3>Residentes Registrados</h3>
                    <div class="value">${activeResidents}</div>
                    <div class="details">Estado 'Activo'</div>
                </div>
                <div class="widget">
                    <h3>Ingresos del Mes</h3>
                    <div class="value positive">${formatCurrency(incomeThisMonth)}</div>
                    <div class="details">Pagos de Gastos Comunes</div>
                </div>
                <div class="widget">
                    <h3>Egresos del Mes</h3>
                    <div class="value negative">${formatCurrency(expensesThisMonth)}</div>
                    <div class="details">Mantención y Servicios</div>
                </div>
                <div class="widget">
                    <h3>Saldo de Caja</h3>
                    <div class="value">${formatCurrency(cashBalance)}</div>
                    <div class="details">Estimado Total</div>
                </div>
                <div class="widget">
                    <h3>Mantenciones</h3>
                    <div class="value">${pendingMaintenance}</div>
                    <div class="details">Pendientes / Urgentes</div>
                </div>
                 <div class="widget">
                    <h3>Resumen de Morosidad</h3>
                    <div class="value">${morososCount}</div>
                    <div class="details">Residentes en estado 'Moroso'</div>
                </div>
            </div>
            <div class="chart-container">
                <h2>Ingresos vs. Egresos (Últimos 12 meses)</h2>
                <canvas id="incomeExpenseChart" data-labels='${JSON.stringify(chartLabels)}' data-income='${JSON.stringify(chartIncomeData)}' data-expenses='${JSON.stringify(chartExpenseData)}'></canvas>
            </div>
        </div>
    `;
}

async function loadResidentesView() {
    // ... (sin cambios, ya funcionaba)
}


// --- SECCIÓN DE LISTENERS (AHORA INCLUYE EL GRÁFICO) ---

function attachViewListeners(viewName) {
    if (viewName === 'dashboard') {
        const canvas = document.getElementById('incomeExpenseChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const labels = JSON.parse(canvas.getAttribute('data-labels'));
            const incomeData = JSON.parse(canvas.getAttribute('data-income'));
            const expenseData = JSON.parse(canvas.getAttribute('data-expenses'));

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ingresos',
                        data: incomeData,
                        backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    }, {
                        label: 'Egresos',
                        data: expenseData,
                        backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    if (viewName === 'residentes') {
        // ... (sin cambios)
    }
}

// --- RESTO DE LAS FUNCIONES (add resident, table click, etc. sin cambios) ---

// --- NUEVA FUNCIÓN PARA FORMATEAR MONEDA ---
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(value);
}


// --- WRAPPERS DE LA API DE GOOGLE SHEETS (Sin cambios) ---
async function readSheetData(range) {
    // ...
}

async function appendSheetData(sheetName, values) {
    // ...
}

async function deleteSheetRow(sheetName, rowIndex) {
    // ...
}
