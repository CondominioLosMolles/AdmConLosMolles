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
    // Event listeners de navegación
    document.querySelector('.sidebar').addEventListener('click', (e) => {
        if (e.target.matches('.nav-link')) {
            e.preventDefault();
            const viewName = e.target.getAttribute('data-view');
            if (viewName) {
                switchView(viewName);
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
            }
        }
        if (e.target.matches('#logout-button')) {
            handleSignoutClick();
        }
    });

    // Event listeners del Modal
    document.querySelector('.close-modal-button').addEventListener('click', () => hideModal());
    window.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            hideModal();
        }
    });
});

// FLUJO DE AUTENTICACIÓN DE GOOGLE
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
        callback: '', // Se define dinámicamente
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
    // Cargar la vista inicial del Dashboard
    switchView('dashboard');
}


// FUNCIONES DE UTILIDAD (MODAL, VISTAS, ETC)
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
            // Agrega los otros casos aquí
            case 'residentes':
                viewContent = await loadResidentesView();
                break;
            // ... más vistas
            default:
                viewContent = `<div class="view active"><h2>Vista no implementada</h2></div>`;
        }
        mainContent.innerHTML = viewContent;
        // Re-adjuntar listeners si es necesario
        attachViewListeners(viewName);
    } catch (error) {
        console.error(`Error al cambiar a la vista ${viewName}:`, error);
        mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista. Revise la consola.</p>`;
    } finally {
        hideLoader();
    }
}

// Lógica de Vistas (Ejemplo con Dashboard y Residentes)

async function loadDashboardView() {
    // Implementar la lógica para obtener y mostrar los datos del dashboard.
    // 
    // Esta es una maqueta estática. La lógica de obtención de datos se agregaría aquí.
    const residentsData = await readSheetData('Residentes!A2:H');
    const activeResidents = residentsData.filter(r => r[6] === 'Activo').length;
    
    // Aquí irían más llamadas a la API para los otros widgets...
    
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
                    <div class="value positive">$1.250.000</div>
                    <div class="details">Pagos de Gastos Comunes</div>
                </div>
                <div class="widget">
                    <h3>Egresos del Mes</h3>
                    <div class="value negative">$780.000</div>
                    <div class="details">Mantención y Servicios</div>
                </div>
                <div class="widget">
                    <h3>Saldo de Caja</h3>
                    <div class="value">$4.500.000</div>
                    <div class="details">Estimado Total</div>
                </div>
                <div class="widget">
                    <h3>Mantenciones</h3>
                    <div class="value">3</div>
                    <div class="details">Pendientes / Urgentes</div>
                </div>
                 <div class="widget">
                    <h3>Resumen de Morosidad</h3>
                    <div class="value">5</div>
                    <div class="details">Residentes en estado 'Moroso'</div>
                </div>
            </div>
            <div class="chart-container">
                <h2>Ingresos vs. Egresos (Últimos 12 meses)</h2>
                <canvas id="incomeExpenseChart"></canvas>
            </div>
        </div>
    `;
}

async function loadResidentesView() {
    showLoader();
    const residents = await readSheetData('Residentes!A2:H');
    hideLoader();

    let tableRows = residents.map((row, index) => `
        <tr>
            <td>${row[1] || ''}</td>
            <td>${row[2] || ''}</td>
            <td>${row[3] || ''}</td>
            <td>${row[4] || ''}</td>
            <td>${row[5] || ''}</td>
            <td>${row[6] || ''}</td>
            <td>${row[7] || ''}</td>
            <td class="action-icons">
                <span class="icon icon-edit" data-row-index="${index + 2}">✏️</span>
                <span class="icon icon-delete" data-row-index="${index + 2}">🗑️</span>
            </td>
        </tr>
    `).join('');

    return `
        <div class="view active" id="residentes-view">
            <h1>Gestión de Residentes</h1>
            <div class="controls">
                <input type="search" id="resident-search" placeholder="Buscar por Nombre, RUT o Parcela...">
                <div>
                    <button class="cta-button" id="export-excel-btn">Descargar Excel</button>
                    <button class="cta-button" id="add-resident-btn">Agregar Residente</button>
                </div>
            </div>
            <div class="table-container">
                <table id="residentes-table">
                    <thead>
                        <tr>
                            <th>Nombre Completo</th>
                            <th>RUT</th>
                            <th>N° Parcela</th>
                            <th>E-mail</th>
                            <th>Teléfono</th>
                            <th>Estado</th>
                            <th>Valor Gasto Común</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// FUNCIONES PARA ADJUNTAR LISTENERS
function attachViewListeners(viewName) {
    if (viewName === 'dashboard') {
        // Lógica para renderizar el gráfico
        const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], // Datos de ejemplo
                datasets: [{
                    label: 'Ingresos',
                    data: [1200, 1900, 3000, 5000, 2300, 3100],
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                }, {
                    label: 'Egresos',
                    data: [800, 1200, 2500, 4000, 1800, 2600],
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (viewName === 'residentes') {
        document.getElementById('add-resident-btn').addEventListener('click', showAddResidentModal);
        document.getElementById('residentes-table').addEventListener('click', handleResidentTableClick);
        document.getElementById('export-excel-btn').addEventListener('click', exportTableToExcel);
        document.getElementById('resident-search').addEventListener('keyup', filterResidentTable);
    }
}

function showAddResidentModal() {
    // 
    const formHtml = `
        <h2>Agregar Nuevo Residente</h2>
        <form id="resident-form">
            <label for="nombreCompleto">Nombre Completo:</label>
            <input type="text" id="nombreCompleto" required>
            <label for="rut">RUT:</label>
            <input type="text" id="rut" required>
            <label for="nParcela">N° Parcela:</label>
            <input type="text" id="nParcela" required>
            <label for="email">Email:</label>
            <input type="email" id="email" required>
            <label for="telefono">Teléfono:</label>
            <input type="tel" id="telefono">
            <label for="estado">Estado:</label>
            <select id="estado">
                <option value="Activo">Activo</option>
                <option value="Moroso">Moroso</option>
                <option value="Inactivo">Inactivo</option>
            </select>
            <label for="valorGastoComun">Valor Gasto Común:</label>
            <input type="number" id="valorGastoComun" required>
            <button type="submit" class="cta-button">Guardar Residente</button>
        </form>
    `;
    showModal(formHtml);
    document.getElementById('resident-form').addEventListener('submit', handleAddResident);
}

async function handleAddResident(e) {
    e.preventDefault();
    showLoader();
    const newResident = [
        // ID Autoincremental (se calcula en el backend o aquí antes de enviar)
        null, 
        document.getElementById('nombreCompleto').value,
        document.getElementById('rut').value,
        document.getElementById('nParcela').value,
        document.getElementById('email').value,
        document.getElementById('telefono').value,
        document.getElementById('estado').value,
        document.getElementById('valorGastoComun').value
    ];

    try {
        // Calcular ID autoincremental
        const lastData = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Residentes!A:A',
        });
        const lastId = lastData.result.values ? Math.max(...lastData.result.values.flat().map(Number).filter(n => !isNaN(n))) : 0;
        newResident[0] = lastId + 1;
        
        await appendSheetData('Residentes', [newResident]);
        hideModal();
        switchView('residentes');
    } catch (error) {
        console.error("Error al agregar residente:", error);
        alert("Error al guardar. Verifique los datos y la conexión.");
    } finally {
        hideLoader();
    }
}

function handleResidentTableClick(e) {
    const rowIndex = e.target.getAttribute('data-row-index');
    if (e.target.matches('.icon-delete')) {
        if (confirm('¿Está seguro de que desea eliminar a este residente?')) {
            deleteSheetRow('Residentes', rowIndex);
        }
    }
    // Lógica para editar 
    if (e.target.matches('.icon-edit')) {
       alert(`Función "Editar" para la fila ${rowIndex} no implementada.`);
    }
}

function filterResidentTable() {
    // 
    const filter = document.getElementById('resident-search').value.toUpperCase();
    const table = document.getElementById('residentes-table');
    const tr = table.getElementsByTagName('tr');
    for (let i = 1; i < tr.length; i++) { // Empezar en 1 para saltar el header
        let rowVisible = false;
        const tds = tr[i].getElementsByTagName('td');
        // Columnas a buscar: Nombre (0), RUT (1), Parcela (2)
        if (tds[0].textContent.toUpperCase().indexOf(filter) > -1 ||
            tds[1].textContent.toUpperCase().indexOf(filter) > -1 ||
            tds[2].textContent.toUpperCase().indexOf(filter) > -1) {
            rowVisible = true;
        }
        tr[i].style.display = rowVisible ? "" : "none";
    }
}

function exportTableToExcel() {
    // 
    const table = document.getElementById("residentes-table");
    const wb = XLSX.utils.table_to_book(table, {sheet: "Residentes"});
    XLSX.writeFile(wb, "Listado_Residentes.xlsx");
}

// WRAPPERS DE LA API DE GOOGLE SHEETS
async function readSheetData(range) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        return response.result.values || [];
    } catch (err) {
        console.error("Error al leer datos de la hoja:", err);
        throw err;
    }
}

async function appendSheetData(sheetName, values) {
    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: values,
            },
        });
    } catch (err) {
        console.error("Error al escribir datos en la hoja:", err);
        throw err;
    }
}

async function deleteSheetRow(sheetName, rowIndex) {
    // 
    showLoader();
    try {
        // Obtener el ID de la hoja (gid)
        const sheetMetadata = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheet = sheetMetadata.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada.`);
        const sheetId = sheet.properties.sheetId;

        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: "ROWS",
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        }
                    }
                }]
            }
        });
        alert("Residente eliminado correctamente.");
        switchView('residentes');
    } catch (err) {
        console.error("Error al eliminar la fila:", err);
        alert("No se pudo eliminar la fila.");
    } finally {
        hideLoader();
    }
}
