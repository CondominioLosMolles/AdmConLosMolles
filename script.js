// =================================================================================
// ARCHIVO SCRIPT.JS FINAL Y COMPLETO (VERSIÓN ESTABLE)
// =================================================================================

// CONFIGURACIÓN DE CREDENCIALES Y API
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU'; 
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

let tokenClient;
let allResidentsData = [];

// ELEMENTOS DEL DOM
const mainContent = document.getElementById('main-content');
const loader = document.getElementById('loader-wrapper');
const modalContainer = document.getElementById('modal-container');
const modalBody = document.getElementById('modal-body');

// --- FLUJO DE AUTENTICACIÓN MODERNO Y ESTABLE ---
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
    }).catch(error => {
        handleAuthError("Error de Configuración: No se pudo inicializar la API de Google.");
    });
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse, // Usar un callback manejado
    });
    // Mostrar el botón de login solo cuando todo esté listo
    document.getElementById('login-container').style.display = 'flex';
    loader.style.display = 'none';
    document.getElementById('login-button').addEventListener('click', () => tokenClient.requestAccessToken({ prompt: 'consent' }));
}

async function handleTokenResponse(resp) {
    if (resp.error) {
        handleAuthError("Hubo un error al obtener el permiso de su cuenta de Google.");
        return;
    }
    // Ocultar login e iniciar la app
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    await startApp();
}

function handleAuthError(message) {
    loader.innerHTML = `<p style="color:red; text-align:center; padding: 20px;"><b>${message}</b><br/>Verifique la configuración en Google Cloud y que las cookies de terceros estén habilitadas.</p>`;
    loader.style.display = 'flex';
}

// --- LÓGICA GENERAL DE LA APLICACIÓN ---

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

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            document.getElementById('app-container').style.display = 'none';
            document.getElementById('login-container').style.display = 'flex';
            mainContent.innerHTML = '';
            allResidentsData = [];
        });
    }
}

async function startApp() {
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
            default: viewContent = `<div class="view active"><h1>Módulo en Construcción</h1><p>Este módulo estará disponible próximamente.</p></div>`; break;
        }
        mainContent.innerHTML = viewContent;
        attachViewListeners(viewName);
    } catch (error) {
        console.error(`Error al cargar la vista ${viewName}:`, error);
        mainContent.innerHTML = `<p style="color:red;">Error al cargar la vista: ${error.message}.</p>`;
    } finally {
        hideLoader();
    }
}

function attachViewListeners(viewName) {
    setTimeout(() => { 
        try {
            if (viewName === 'dashboard') {
                const canvas = document.getElementById('incomeExpenseChart');
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    const labels = JSON.parse(canvas.getAttribute('data-labels'));
                    const incomeData = JSON.parse(canvas.getAttribute('data-income'));
                    const expenseData = JSON.parse(canvas.getAttribute('data-expenses'));
                    new Chart(ctx, {
                        type: 'bar', data: { labels, datasets: [ { label: 'Ingresos', data: incomeData, backgroundColor: 'rgba(40, 167, 69, 0.7)' }, { label: 'Egresos', data: expenseData, backgroundColor: 'rgba(220, 53, 69, 0.7)' } ] },
                        options: {
                            responsive: true, maintainAspectRatio: false,
                            scales: { y: { beginAtZero: true, suggestedMax: 1000000, ticks: { callback: function(value) { if (Number.isInteger(value)) { return formatCurrency(value); } } } } },
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
        } catch(e) { console.error("Error al adjuntar listeners: ", e); }
    }, 100);
}

// --- LÓGICA DE VISTAS ---

async function loadDashboardView() {
    const [residents, payments, expenses, maintenance] = await Promise.all([
        readSheetData(SPREADSHEET_ID, 'Residentes!A2:J'),
        readSheetData(SPREADSHEET_ID, 'Pagos_GC!A2:H'),
        readSheetData(SPREADSHEET_ID, 'Egresos!A2:G'),
        readSheetData(SPREADSHEET_ID, 'Mantenciones!A2:H')
    ]);
    const now = new Date();
    const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
    const activeResidents = residents.filter(r => r && r[7] === 'Activo').length;
    const morososCount = residents.filter(r => r && r[7] === 'Moroso').length;
    const incomeThisMonth = payments.filter(p => p && p[6] && new Date(p[6]).getMonth() === currentMonth && new Date(p[6]).getFullYear() === currentYear).reduce((sum, p) => sum + (parseFloat(p[5]) || 0), 0);
    const expensesThisMonth = expenses.filter(e => e && e[1] && new Date(e[1]).getMonth() === currentMonth && new Date(e[1]).getFullYear() === currentYear).reduce((sum, e) => sum + (parseFloat(e[5]) || 0), 0);
    const totalIncome = payments.reduce((sum, p) => sum + (parseFloat(p[5]) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e[5]) || 0), 0);
    const cashBalance = totalIncome - totalExpenses;
    const pendingMaintenance = maintenance.filter(m => m && (m[5] === 'Pendiente' || m[5] === 'Urgente')).length;
    const monthlyTotals = {};
    for (let i = 11; i >= 0; i--) { const d = new Date(currentYear, currentMonth - i, 1); const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; monthlyTotals[monthKey] = { income: 0, expense: 0, label: d.toLocaleString('es-CL', { month: 'short' }) };}
    payments.forEach(p => { if (!p || !p[6]) return; const d = new Date(p[6]); const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if (monthlyTotals[monthKey]) { monthlyTotals[monthKey].income += (parseFloat(p[5]) || 0); } });
    expenses.forEach(e => { if (!e || !e[1]) return; const d = new Date(e[1]); const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; if (monthlyTotals[monthKey]) { monthlyTotals[monthKey].expense += (parseFloat(e[5]) || 0); } });
    const chartLabels = Object.values(monthlyTotals).map(m => m.label); const chartIncomeData = Object.values(monthlyTotals).map(m => m.income); const chartExpenseData = Object.values(monthlyTotals).map(m => m.expense);
    return `<div class="view active" id="dashboard-view"><h1>Dashboard</h1><div class="dashboard-grid"><div class="widget"><h3>Residentes Registrados</h3><div class="value">${activeResidents}</div><div class="details">Estado 'Activo'</div></div><div class="widget"><h3>Ingresos del Mes</h3><div class="value positive">${formatCurrency(incomeThisMonth)}</div><div class="details">Pagos de Gastos Comunes</div></div><div class="widget"><h3>Egresos del Mes</h3><div class="value negative">${formatCurrency(expensesThisMonth)}</div><div class="details">Mantención y Servicios</div></div><div class="widget"><h3>Saldo de Caja</h3><div class="value">${formatCurrency(cashBalance)}</div><div class="details">Estimado Total</div></div><div class="widget"><h3>Mantenciones</h3><div class="value">${pendingMaintenance}</div><div class="details">Pendientes / Urgentes</div></div><div class="widget"><h3>Resumen de Morosidad</h3><div class="value">${morososCount}</div><div class="details">Residentes en estado 'Moroso'</div></div></div><div class="chart-container"><canvas id="incomeExpenseChart" data-labels='${JSON.stringify(chartLabels)}' data-income='${JSON.stringify(chartIncomeData)}' data-expenses='${JSON.stringify(chartExpenseData)}'></canvas></div></div>`;
}

async function loadResidentesView() {
    let tableRows = allResidentsData.slice(1).map((row, index) => {
        if (!row) return '';
        const status = (row[7] || 'Inactivo').trim().toLowerCase();
        let statusClass = 'status-inactivo';
        if (status === 'activo') statusClass = 'status-activo'; else if (status === 'moroso') statusClass = 'status-moroso';
        return `<tr><td>${row[1] || ''}</td><td>${row[2] || ''}</td><td>${row[3] || ''}</td><td>${row[4] || ''}</td><td>${row[5] || ''}</td><td>${row[6] || ''}</td><td><span class="status-badge ${statusClass}">${row[7] || 'Inactivo'}</span></td><td>${formatCurrency(parseFloat(row[8] || 0))}</td><td class="action-icons"><span class="icon icon-edit" data-row-index="${index + 2}">✏️</span><span class="icon icon-delete" data-row-index="${index + 2}">🗑️</span></td></tr>`;
    }).join('');
    return `<div class="view active" id="residentes-view"><h1>Gestión de Residentes</h1><div class="controls"><input type="search" id="resident-search" placeholder="Buscar por Nombre, RUT o Parcela..."><div class="controls-buttons"><button class="cta-button" id="export-excel-btn">Descargar Excel</button><button class="cta-button" id="add-resident-btn">Agregar Residente</button></div></div><div class="table-container"><table id="residentes-table"><thead><tr><th>Nombre Completo</th><th>RUT</th><th>N° Parcela</th><th>Dirección</th><th>E-mail</th><th>Teléfono</th><th>Estado</th><th>Valor Gasto Común</th><th>Acciones</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`;
}

async function loadGastosComunesView() {
    const residentOptions = allResidentsData.slice(1).map(r => r ? `<option value="${r[0]}">${r[3]} - ${r[1]}</option>` : '').join('');
    return `<div class="view active" id="gastos-comunes-view"><h1>Gestión de Gastos Comunes</h1><div class="controls"><label for="resident-selector-gc">Seleccione un Residente:</label><select id="resident-selector-gc" onchange="displayResidentSheet()"><option value="">-- Seleccione --</option>${residentOptions}</select></div><div id="resident-sheet-details" class="table-container"><p>Seleccione un residente para ver su detalle de pagos.</p></div></div>`;
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
        if (!paymentSheetId) { throw new Error("Este residente no tiene una planilla de pagos asociada. Revisa la columna 'ID_Sheet_Pagos' en la hoja de Residentes."); }
        const sheetData = await readSheetData(paymentSheetId, 'Hoja 1!A1:L13');
        let tableHtml = '<table>';
        sheetData.forEach((row, rowIndex) => {
            tableHtml += `<tr>`;
            row.forEach((cell) => { tableHtml += rowIndex === 0 ? `<th>${cell}</th>` : `<td>${cell || ''}</td>`; });
            tableHtml += `</tr>`;
        });
        tableHtml += '</table>';
        detailsContainer.innerHTML = `<h3>Detalle de Pagos para Parcela N° ${residentData[3]}</h3>${tableHtml}<br><button class="cta-button" id="register-payment-btn">Registrar Nuevo Pago</button>`;
        document.getElementById('register-payment-btn').addEventListener('click', () => showRegisterPaymentModal(paymentSheetId));
    } catch (error) {
        console.error("Error displaying resident sheet:", error);
        detailsContainer.innerHTML = `<p style="color:red;">No se pudo cargar la planilla del residente. ${error.message}</p>`;
    } finally {
        hideLoader();
    }
}

function showRegisterPaymentModal(sheetId) {
    const formHtml = `<h2>Registrar Nuevo Pago</h2><form><input type="hidden" id="paymentSheetId" value="${sheetId}"><label>Mes a Pagar (1 para Enero, 2 para Febrero, etc.):</label><input type="number" id="mes" min="1" max="12" required><label>Monto Pagado:</label><input type="number" id="montoPagado" required><label>Fecha de Pago:</label><input type="date" id="fechaPago" required></form><button id="save-payment-btn" class="cta-button">Guardar Pago</button>`;
    showModal(formHtml);
    document.getElementById('save-payment-btn').addEventListener('click', handleSavePaymentToSheet);
}

async function handleSavePaymentToSheet() {
    showLoader();
    const sheetId = document.getElementById('paymentSheetId').value;
    const mes = parseInt(document.getElementById('mes').value);
    const monto = document.getElementById('montoPagado').value;
    const fecha = document.getElementById('fechaPago').value;
    const rowToUpdate = mes + 1;
    try {
        const updateRequests = [{ range: `'Hoja 1'!D${rowToUpdate}`, values: [[monto]] }, { range: `'Hoja 1'!L${rowToUpdate}`, values: [[fecha]] }];
        await gapi.client.sheets.spreadsheets.values.batchUpdate({ spreadsheetId: sheetId, resource: { valueInputOption: 'USER_ENTERED', data: updateRequests } });
        alert("Pago registrado exitosamente.");
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
function showAddResidentModal() {
    const formHtml = `<h2>Agregar Nuevo Residente</h2><form><label>Nombre Completo:</label><input type="text" id="nombreCompleto" required><label>RUT:</label><input type="text" id="rut" required><label>N° Parcela:</label><input type="text" id="nParcela" required><label>Dirección:</label><input type="text" id="direccion"><label>Email:</label><input type="email" id="email" required><label>Teléfono:</label><input type="tel" id="telefono"><label>Estado:</label><select id="estado"><option value="Activo">Activo</option><option value="Moroso">Moroso</option><option value="Inactivo">Inactivo</option></select><label>Valor Gasto Común:</label><input type="number" id="valorGastoComun" required><label>ID Planilla Pagos:</label><input type="text" id="idSheetPagos"></form><button id="save-new-resident-btn" class="cta-button">Guardar Residente</button>`;
    showModal(formHtml);
    document.getElementById('save-new-resident-btn').addEventListener('click', handleAddResident);
}

async function handleAddResident() {
    showLoader();
    try {
        const lastData = await readSheetData(SPREADSHEET_ID, 'Residentes!A:A');
        const lastId = lastData.length > 1 ? Math.max(...lastData.slice(1).flat().map(Number).filter(n => !isNaN(n))) : 0;
        const newResident = [lastId + 1, document.getElementById('nombreCompleto').value, document.getElementById('rut').value, document.getElementById('nParcela').value, document.getElementById('direccion').value, document.getElementById('email').value, document.getElementById('telefono').value, document.getElementById('estado').value, document.getElementById('valorGastoComun').value, document.getElementById('idSheetPagos').value];
        await appendSheetData(SPREADSHEET_ID, 'Residentes', [newResident]);
        const residents = await readSheetData(SPREADSHEET_ID, 'Residentes!A2:J');
        allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun', 'ID_Sheet_Pagos'], ...residents];
        hideModal(); switchView('residentes');
    } catch (error) { console.error("Error al agregar residente:", error); alert("Error al guardar."); } finally { hideLoader(); }
}

function handleResidentTableClick(e) {
    if (e.target.matches('.icon-delete')) {
        const rowIndex = e.target.getAttribute('data-row-index');
        if (confirm('¿Está seguro?')) { deleteSheetRow(SPREADSHEET_ID, 'Residentes', rowIndex); }
    }
    if (e.target.matches('.icon-edit')) {
        const rowIndex = e.target.getAttribute('data-row-index');
        showEditResidentModal(rowIndex);
    }
}

function showEditResidentModal(rowIndex) {
    const arrayIndex = parseInt(rowIndex) - 1;
    const residentData = allResidentsData[arrayIndex];
    if (!residentData) { alert("Error: No se encontraron datos para editar."); return; }
    const formHtml = `<h2>Editar Residente</h2><form><input type="hidden" id="rowIndex" value="${rowIndex}"><label>Nombre Completo:</label><input type="text" id="nombreCompleto" value="${residentData[1] || ''}" required><label>RUT:</label><input type="text" id="rut" value="${residentData[2] || ''}" required><label>N° Parcela:</label><input type="text" id="nParcela" value="${residentData[3] || ''}" required><label>Dirección:</label><input type="text" id="direccion" value="${residentData[4] || ''}"><label>Email:</label><input type="email" id="email" value="${residentData[5] || ''}" required><label>Teléfono:</label><input type="tel" id="telefono" value="${residentData[6] || ''}"><label>Estado:</label><select id="estado"><option value="Activo">Activo</option><option value="Moroso">Moroso</option><option value="Inactivo">Inactivo</option></select><label>Valor Gasto Común:</label><input type="number" id="valorGastoComun" value="${residentData[8] || ''}" required><label>ID Planilla Pagos:</label><input type="text" id="idSheetPagos" value="${residentData[9] || ''}"></form><button id="save-edit-resident" class="cta-button">Actualizar Residente</button>`;
    showModal(formHtml);
    document.getElementById('estado').value = residentData[7] || 'Activo';
    document.getElementById('save-edit-resident').addEventListener('click', handleUpdateResident);
}

async function handleUpdateResident() {
    showLoader();
    const rowIndex = document.getElementById('rowIndex').value;
    const arrayIndex = parseInt(rowIndex) - 1;
    try {
        const updatedValues = [allResidentsData[arrayIndex][0], document.getElementById('nombreCompleto').value, document.getElementById('rut').value, document.getElementById('nParcela').value, document.getElementById('direccion').value, document.getElementById('email').value, document.getElementById('telefono').value, document.getElementById('estado').value, document.getElementById('valorGastoComun').value, document.getElementById('idSheetPagos').value];
        await updateSheetRow(SPREADSHEET_ID, 'Residentes', rowIndex, [updatedValues]);
        const residents = await readSheetData(SPREADSHEET_ID, 'Residentes!A2:J');
        allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun', 'ID_Sheet_Pagos'], ...residents];
        hideModal(); switchView('residentes');
    } catch (error) { console.error("Error al actualizar residente:", error); alert("Error al actualizar."); } finally { hideLoader(); }
}

function filterResidentTable() {
    const filter = document.getElementById('resident-search').value.toUpperCase();
    const table = document.getElementById('residentes-table'); const tr = table.getElementsByTagName('tr');
    for (let i = 1; i < tr.length; i++) {
        const tds = tr[i].getElementsByTagName('td');
        if (tds.length > 0 && (tds[0].textContent.toUpperCase().indexOf(filter) > -1 || tds[1].textContent.toUpperCase().indexOf(filter) > -1 || tds[2].textContent.toUpperCase().indexOf(filter) > -1)) { tr[i].style.display = ""; } else { tr[i].style.display = "none"; }
    }
}

function exportResidentsToExcel() {
    const headers = ["ID", "Nombre Completo", "RUT", "N° Parcela", "Dirección", "Email", "Teléfono", "Estado", "Valor Gasto Común"];
    const data = allResidentsData.slice(1).map(row => {
        if (!row) return [];
        return [ row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], parseFloat(row[8] || 0) ];
    });
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [ {wch:5}, {wch:30}, {wch:12}, {wch:10}, {wch:40}, {wch:30}, {wch:15}, {wch:10}, {wch:20} ];
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const cell_address = { c: 8, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);
        if (ws[cell_ref] && ws[cell_ref].v !== undefined) { ws[cell_ref].t = 'n'; ws[cell_ref].z = '$ #,##0'; }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Listado_Residentes.xlsx");
}

function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
}

// --- FUNCIONES DE API DE GOOGLE SHEETS ---
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
