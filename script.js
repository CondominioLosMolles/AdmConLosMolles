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

// --- FLUJO DE AUTENTICACIÓN (ESTABLE) ---
function gapiLoaded() { gapi.load('client', initializeGapiClient); }
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
    }).catch(error => handleAuthError("Error de Configuración: No se pudo inicializar la API de Google."));
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID, scope: SCOPES, callback: handleTokenResponse,
    });
    document.getElementById('login-container').style.display = 'flex';
    loader.style.display = 'none';
    document.getElementById('login-button').addEventListener('click', () => tokenClient.requestAccessToken({ prompt: 'consent' }));
}
async function handleTokenResponse(resp) {
    if (resp.error) { handleAuthError("Hubo un error al obtener el permiso de su cuenta de Google."); return; }
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
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
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
                // Lógica del gráfico del Dashboard
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

async function loadDashboardView() { /* Código sin cambios */ return `<div class="view active"><h1>Dashboard</h1><p>Bienvenido al sistema de administración.</p></div>`; }
async function loadResidentesView() { /* Código sin cambios */ let tableRows = allResidentsData.slice(1).map((row, index) => { if (!row) return ''; const status = (row[7] || 'Inactivo').trim().toLowerCase(); let statusClass = 'status-inactivo'; if (status === 'activo') statusClass = 'status-activo'; else if (status === 'moroso') statusClass = 'status-moroso'; return `<tr><td>${row[1] || ''}</td><td>${row[2] || ''}</td><td>${row[3] || ''}</td><td>${row[4] || ''}</td><td>${row[5] || ''}</td><td>${row[6] || ''}</td><td><span class="status-badge ${statusClass}">${row[7] || 'Inactivo'}</span></td><td>${formatCurrency(parseFloat(row[8] || 0))}</td><td class="action-icons"><span class="icon icon-edit" data-row-index="${index + 2}">✏️</span><span class="icon icon-delete" data-row-index="${index + 2}">🗑️</span></td></tr>`; }).join(''); return `<div class="view active" id="residentes-view"><h1>Gestión de Residentes</h1><div class="controls"><input type="search" id="resident-search" placeholder="Buscar por Nombre, RUT o Parcela..."><div class="controls-buttons"><button class="cta-button" id="export-excel-btn">Descargar Excel</button><button class="cta-button" id="add-resident-btn">Agregar Residente</button></div></div><div class="table-container"><table id="residentes-table"><thead><tr><th>Nombre Completo</th><th>RUT</th><th>N° Parcela</th><th>Dirección</th><th>E-mail</th><th>Teléfono</th><th>Estado</th><th>Valor Gasto Común</th><th>Acciones</th></tr></thead><tbody>${tableRows}</tbody></table></div></div>`; }

// =================================================================================
// NUEVA LÓGICA PARA GASTOS COMUNES (BASADA EN EL EJEMPLO)
// =================================================================================
async function loadGastosComunesView() {
    const residentOptions = allResidentsData.slice(1).map(r => r ? `<option value="${r[0]}">${r[3]} - ${r[1]}</option>` : '').join('');
    return `
        <div class="view active" id="gastos-comunes-view">
            <div class="section-title">Gastos Comunes</div>
            <div class="gc-busqueda">
                <input type="text" id="gc-buscar" placeholder="Buscar por N° Parcela o Nombre" oninput="gcBuscarResidente()">
                <select id="gc-selector" onchange="gcSeleccionarResidente()">
                    <option value="">Selecciona un residente...</option>
                    ${residentOptions}
                </select>
            </div>
            <div id="gc-historial" style="display:none; margin-top:30px;">
                <h4>Historial de Pagos - Parcela <span id="gc-nparcela"></span> - <span id="gc-nombre"></span></h4>
                <div id="gc-table-container"></div>
                <button class="cta-button" style="margin-top:18px;" onclick="gcAbrirModalPago()">Registrar Pago</button>
            </div>
        </div>
    `;
}

function gcBuscarResidente() {
    let val = document.getElementById('gc-buscar').value.trim().toLowerCase();
    let selector = document.getElementById('gc-selector');
    for (let i = 1; i < selector.options.length; i++) {
        let optEl = selector.options[i];
        let nombreYParcela = optEl.textContent.toLowerCase();
        optEl.style.display = nombreYParcela.includes(val) ? '' : 'none';
    }
}

async function gcSeleccionarResidente() {
    const residentId = document.getElementById('gc-selector').value;
    const historialDiv = document.getElementById('gc-historial');
    if (!residentId) {
        historialDiv.style.display = 'none';
        return;
    }
    showLoader();
    try {
        const residentData = allResidentsData.find(r => r && r[0] === residentId);
        document.getElementById('gc-nparcela').innerText = residentData[3];
        document.getElementById('gc-nombre').innerText = residentData[1];
        
        await gcRenderHistorial(residentData);
        historialDiv.style.display = 'block';
    } catch (error) {
        console.error("Error al seleccionar residente:", error);
        alert("Error: " + error.message);
    } finally {
        hideLoader();
    }
}

async function gcRenderHistorial(residentData) {
    const tableContainer = document.getElementById('gc-table-container');
    const paymentSheetId = residentData[9];
    if (!paymentSheetId) { throw new Error("Residente sin planilla de pagos asociada."); }

    const sheetData = await readSheetData(paymentSheetId, 'Hoja 1!A1:L13');
    let tableHtml = '<table class="gc-table"><thead><tr>';
    const headers = sheetData[0];
    headers.forEach(h => tableHtml += `<th>${h}</th>`);
    tableHtml += '</tr></thead><tbody>';

    sheetData.slice(1).forEach(row => {
        tableHtml += '<tr>';
        row.forEach(cell => tableHtml += `<td>${cell || ''}</td>`);
        tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table>';
    tableContainer.innerHTML = tableHtml;
}

function gcAbrirModalPago() {
    const residentId = document.getElementById('gc-selector').value;
    if (!residentId) {
        alert("Por favor, seleccione un residente primero.");
        return;
    }
    const residentData = allResidentsData.find(r => r && r[0] === residentId);
    const paymentSheetId = residentData[9];

    const formHtml = `
        <h3>Registrar Pago para ${residentData[1]}</h3>
        <form id="gc-form-pago">
            <input type="hidden" id="paymentSheetId" value="${paymentSheetId}">
            <label>Mes a Pagar (1-12):</label><input type="number" id="gc-mes" min="1" max="12" required>
            <label>Monto Pagado:</label><input type="number" id="gc-monto-pagado" required>
            <label>Fecha de Pago:</label><input type="date" id="gc-fecha-pago" required>
        </form>
        <button class="cta-button" style="width:100%; margin-top:18px;" onclick="gcGuardarPago()">Guardar Pago</button>
    `;
    showModal(formHtml);
}

async function gcGuardarPago() {
    showLoader();
    const sheetId = document.getElementById('paymentSheetId').value;
    const mes = parseInt(document.getElementById('gc-mes').value);
    const monto = document.getElementById('gc-monto-pagado').value;
    const fecha = document.getElementById('gc-fecha-pago').value;
    const rowToUpdate = mes + 1; // Mes 1 está en la fila 2

    try {
        const updateRequests = [
            { range: `'Hoja 1'!D${rowToUpdate}`, values: [[monto]] },
            { range: `'Hoja 1'!L${rowToUpdate}`, values: [[fecha]] }
        ];
        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: sheetId, resource: { valueInputOption: 'USER_ENTERED', data: updateRequests }
        });
        alert("Pago registrado exitosamente.");
        hideModal();
        gcSeleccionarResidente(); // Refrescar la tabla
    } catch (error) {
        console.error("Error al guardar el pago:", error);
        alert("Error al guardar el pago.");
    } finally {
        hideLoader();
    }
}


// --- FUNCIONES DE RESIDENTES ---
// ... (Aquí van todas las funciones de residentes que ya estaban operativas)

// --- FUNCIONES DE API ---
async function readSheetData(spreadsheetId, range) { /* ... */ }
// ... (Y el resto de las funciones de API y auxiliares)

// --- A CONTINUACIÓN, EL RESTO COMPLETO DEL CÓDIGO FUNCIONAL ---
function showAddResidentModal(){const formHtml=`<h2>Agregar Nuevo Residente</h2><form><label>Nombre Completo:</label><input type="text" id="nombreCompleto" required><label>RUT:</label><input type="text" id="rut" required><label>N° Parcela:</label><input type="text" id="nParcela" required><label>Dirección:</label><input type="text" id="direccion"><label>Email:</label><input type="email" id="email" required><label>Teléfono:</label><input type="tel" id="telefono"><label>Estado:</label><select id="estado"><option value="Activo">Activo</option><option value="Moroso">Moroso</option><option value="Inactivo">Inactivo</option></select><label>Valor Gasto Común:</label><input type="number" id="valorGastoComun" required><label>ID Planilla Pagos:</label><input type="text" id="idSheetPagos"></form><button id="save-new-resident-btn" class="cta-button">Guardar Residente</button>`;showModal(formHtml);document.getElementById("save-new-resident-btn").addEventListener("click",handleAddResident)}async function handleAddResident(){showLoader();try{const e=await readSheetData(SPREADSHEET_ID,"Residentes!A:A"),t=e.length>1?Math.max(...e.slice(1).flat().map(Number).filter(e=>!isNaN(e))):0,a=[t+1,document.getElementById("nombreCompleto").value,document.getElementById("rut").value,document.getElementById("nParcela").value,document.getElementById("direccion").value,document.getElementById("email").value,document.getElementById("telefono").value,document.getElementById("estado").value,document.getElementById("valorGastoComun").value,document.getElementById("idSheetPagos").value];await appendSheetData(SPREADSHEET_ID,"Residentes",[a]);const n=await readSheetData(SPREADSHEET_ID,"Residentes!A2:J");allResidentsData=[["ID_Residente","NombreCompleto","RUT","N_Parcela","Direccion","Email","Telefono","Estado","ValorGastoComun","ID_Sheet_Pagos"],...n],hideModal(),switchView("residentes")}catch(e){console.error("Error al agregar residente:",e),alert("Error al guardar.")}finally{hideLoader()}}function handleResidentTableClick(e){if(e.target.matches(".icon-delete")){const t=e.target.getAttribute("data-row-index");confirm("¿Está seguro?")&&deleteSheetRow(SPREADSHEET_ID,"Residentes",t)}if(e.target.matches(".icon-edit")){const t=e.target.getAttribute("data-row-index");showEditResidentModal(t)}}function showEditResidentModal(e){const t=parseInt(e)-1,a=allResidentsData[t];if(!a)return void alert("Error: No se encontraron datos para editar.");const n=`<h2>Editar Residente</h2><form><input type="hidden" id="rowIndex" value="${e}"><label>Nombre Completo:</label><input type="text" id="nombreCompleto" value="${a[1]||""}" required><label>RUT:</label><input type="text" id="rut" value="${a[2]||""}" required><label>N° Parcela:</label><input type="text" id="nParcela" value="${a[3]||""}" required><label>Dirección:</label><input type="text" id="direccion" value="${a[4]||""}"><label>Email:</label><input type="email" id="email" value="${a[5]||""}" required><label>Teléfono:</label><input type="tel" id="telefono" value="${a[6]||""}"><label>Estado:</label><select id="estado"><option value="Activo">Activo</option><option value="Moroso">Moroso</option><option value="Inactivo">Inactivo</option></select><label>Valor Gasto Común:</label><input type="number" id="valorGastoComun" value="${a[8]||""}" required><label>ID Planilla Pagos:</label><input type="text" id="idSheetPagos" value="${a[9]||""}"></form><button id="save-edit-resident" class="cta-button">Actualizar Residente</button>`;showModal(n),document.getElementById("estado").value=a[7]||"Activo",document.getElementById("save-edit-resident").addEventListener("click",handleUpdateResident)}async function handleUpdateResident(){showLoader();const e=document.getElementById("rowIndex").value,t=parseInt(e)-1;try{const a=[allResidentsData[t][0],document.getElementById("nombreCompleto").value,document.getElementById("rut").value,document.getElementById("nParcela").value,document.getElementById("direccion").value,document.getElementById("email").value,document.getElementById("telefono").value,document.getElementById("estado").value,document.getElementById("valorGastoComun").value,document.getElementById("idSheetPagos").value];await updateSheetRow(SPREADSHEET_ID,"Residentes",e,[a]);const n=await readSheetData(SPREADSHEET_ID,"Residentes!A2:J");allResidentsData=[["ID_Residente","NombreCompleto","RUT","N_Parcela","Direccion","Email","Telefono","Estado","ValorGastoComun","ID_Sheet_Pagos"],...n],hideModal(),switchView("residentes")}catch(e){console.error("Error al actualizar residente:",e),alert("Error al actualizar.")}finally{hideLoader()}}function filterResidentTable(){const e=document.getElementById("resident-search").value.toUpperCase(),t=document.getElementById("residentes-table").getElementsByTagName("tr");for(let a=1;a<t.length;a++){const n=t[a].getElementsByTagName("td");n.length>0&&(n[0].textContent.toUpperCase().indexOf(e)>-1||n[1].textContent.toUpperCase().indexOf(e)>-1||n[2].textContent.toUpperCase().indexOf(e)>-1)?t[a].style.display="":t[a].style.display="none"}}function exportResidentsToExcel(){const e=["ID","Nombre Completo","RUT","N° Parcela","Dirección","Email","Teléfono","Estado","Valor Gasto Común"],t=allResidentsData.slice(1).map(e=>{if(e)return[e[0],e[1],e[2],e[3],e[4],e[5],e[6],e[7],parseFloat(e[8]||0)]});const a=XLSX.utils.aoa_to_sheet([e,...t]);a["!cols"]=[{wch:5},{wch:30},{wch:12},{wch:10},{wch:40},{wch:30},{wch:15},{wch:10},{wch:20}];const n=XLSX.utils.decode_range(a["!ref"]);for(let e=n.s.r+1;e<=n.e.r;++e){const t={c:8,r:e},r=XLSX.utils.encode_cell(t);a[r]&&void 0!==a[r].v&&(a[r].t="n",a[r].z="$ #,##0")}const o=XLSX.utils.book_new();XLSX.utils.book_append_sheet(o,a,"Residentes"),XLSX.writeFile(o,"Listado_Residentes.xlsx")}function formatCurrency(e){return"number"!=typeof e||isNaN(e)?"$0":new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",minimumFractionDigits:0}).format(e)}async function readSheetData(e,t){const a=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:e,range:t});return a.result.values||[]}async function appendSheetData(e,t,a){return gapi.client.sheets.spreadsheets.values.append({spreadsheetId:e,range:`${t}!A1`,valueInputOption:"USER_ENTERED",resource:{values:a}})}async function updateSheetRow(e,t,a,n){const o=`${t}!A${a}`;return gapi.client.sheets.spreadsheets.values.update({spreadsheetId:e,range:o,valueInputOption:"USER_ENTERED",resource:{values:n}})}async function deleteSheetRow(e,t,a){showLoader();try{const n=(await gapi.client.sheets.spreadsheets.get({spreadsheetId:e})).result.sheets.find(e=>e.properties.title===t);if(!n)throw new Error(`Hoja "${t}" no encontrada.`);await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:e,resource:{requests:[{deleteDimension:{range:{sheetId:n.properties.sheetId,dimension:"ROWS",startIndex:parseInt(a)-1,endIndex:parseInt(a)}}}]}});const r=await readSheetData(SPREADSHEET_ID,"Residentes!A2:J");allResidentsData=[["ID_Residente","NombreCompleto","RUT","N_Parcela","Direccion","Email","Telefono","Estado","ValorGastoComun","ID_Sheet_Pagos"],...r],alert("Fila eliminada correctamente."),switchView("residentes")}catch(e){console.error("Error al eliminar la fila:",e),alert("No se pudo eliminar la fila.")}finally{hideLoader()}}
