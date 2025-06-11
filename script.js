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
    const residents = await readSheetData('Residentes!A2:I');
    allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun'], ...residents];
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
            case 'contabilidad': viewContent = await loadContabilidadView(); break;
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
    if (viewName === 'gastos-comunes') {
        // La lógica del onchange está directamente en el HTML devuelto por loadGastosComunesView
    }
    if (viewName === 'contabilidad') {
        document.getElementById('add-gasto-btn').addEventListener('click', showAddGastoModal);
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });
        // Cargar la tabla inicial de egresos
        loadEgresosTable();
        document.getElementById('tab-btn-ingresos').addEventListener('click', loadIngresosTable, { once: true }); // Cargar solo la primera vez
    }
}

// --- LÓGICA DE VISTAS ---

// ... (loadDashboardView, loadResidentesView, etc. sin cambios) ...

// =================================================================================
// NUEVO MÓDULO: CONTABILIDAD
// =================================================================================
async function loadContabilidadView() {
    return `
        <div class="view active" id="contabilidad-view">
            <h1>Contabilidad</h1>
            <div class="tab-buttons">
                <button class="tab-button active" data-tab="egresos-content" id="tab-btn-egresos">Egresos</button>
                <button class="tab-button" data-tab="ingresos-content" id="tab-btn-ingresos">Ingresos</button>
            </div>

            <div id="egresos-content" class="tab-content active">
                <div class="controls">
                    <h2>Registro de Egresos</h2>
                    <button class="cta-button" id="add-gasto-btn">Agregar Gasto</button>
                </div>
                <div id="egresos-table-container" class="table-container">
                    <p>Cargando egresos...</p>
                </div>
            </div>

            <div id="ingresos-content" class="tab-content">
                <h2>Registro de Ingresos</h2>
                <div id="ingresos-table-container" class="table-container">
                    <p>Haga clic para cargar los ingresos.</p>
                </div>
            </div>
        </div>
    `;
}

async function loadEgresosTable() {
    const container = document.getElementById('egresos-table-container');
    container.innerHTML = '<p>Cargando egresos...</p>';
    try {
        const egresos = await readSheetData('Egresos!A2:G');
        let tableRows = egresos.map(row => {
            if (!row) return '';
            // El ID de la factura es la columna G (índice 6)
            const facturaLink = row[6] ? `<a href="https://drive.google.com/file/d/${row[6]}/view" target="_blank">Ver Factura</a>` : 'N/A';
            return `
                <tr>
                    <td>${row[1] || ''}</td>
                    <td>${row[2] || ''}</td>
                    <td>${row[3] || ''}</td>
                    <td>${row[4] || ''}</td>
                    <td>${formatCurrency(parseFloat(row[5] || 0))}</td>
                    <td>${facturaLink}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table id="egresos-table">
                <thead>
                    <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Proveedor</th><th>Monto</th><th>Factura</th></tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        `;
    } catch (error) {
        console.error("Error loading egresos:", error);
        container.innerHTML = '<p style="color:red;">No se pudieron cargar los egresos.</p>';
    }
}

async function loadIngresosTable() {
    const container = document.getElementById('ingresos-table-container');
    container.innerHTML = '<p>Cargando ingresos...</p>';
    try {
        const [pagosGC, multas] = await Promise.all([
            readSheetData('Pagos_GC!C:H'),
            readSheetData('Multas!B:G')
        ]);
        
        const ingresos = [];
        // Procesar pagos de gastos comunes
        pagosGC.forEach(p => {
            if (p) ingresos.push({ fecha: p[4], concepto: `Pago Gasto Común Parcela ${p[0]} (${p[1]})`, monto: p[3] });
        });
        // Procesar pagos de multas
        multas.forEach(m => {
            if (m && m[4] === 'Pagada' && m[5]) {
                const residente = allResidentsData.find(r => r[0] === m[0]);
                const parcela = residente ? `Parcela ${residente[3]}` : `Residente ID ${m[0]}`;
                ingresos.push({ fecha: m[5], concepto: `Pago Multa ${parcela}`, monto: m[3] });
            }
        });

        // Ordenar por fecha
        ingresos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

        let tableRows = ingresos.map(ingreso => {
            return `
                <tr>
                    <td>${new Date(ingreso.fecha).toLocaleDateString('es-CL')}</td>
                    <td>${ingreso.concepto}</td>
                    <td>${formatCurrency(parseFloat(ingreso.monto || 0))}</td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <table id="ingresos-table">
                <thead><tr><th>Fecha de Pago</th><th>Concepto</th><th>Monto</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
        `;

    } catch (error) {
        console.error("Error loading ingresos:", error);
        container.innerHTML = '<p style="color:red;">No se pudieron cargar los ingresos.</p>';
    }
}

function showAddGastoModal() {
    const formHtml = `
        <h2>Agregar Nuevo Gasto</h2>
        <form id="gasto-form">
            <label for="fecha">Fecha:</label><input type="date" id="fecha" required>
            <label for="categoria">Categoría:</label>
            <select id="categoria" required>
                <option value="Remuneraciones">Remuneraciones</option>
                <option value="Servicios Básicos">Servicios Básicos</option>
                <option value="Mantención">Mantención</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Otros">Otros</option>
            </select>
            <label for="descripcion">Descripción:</label><textarea id="descripcion" rows="3" required></textarea>
            <label for="proveedor">Proveedor:</label><input type="text" id="proveedor">
            <label for="monto">Monto:</label><input type="number" id="monto" required>
            <label for="factura">Adjuntar Factura/Boleta:</label><input type="file" id="factura">
            <button type="submit" class="cta-button">Guardar Gasto</button>
        </form>
    `;
    showModal(formHtml);
    document.getElementById('gasto-form').addEventListener('submit', handleSaveGasto);
}

async function handleSaveGasto(e) {
    e.preventDefault(); showLoader();
    const fileInput = document.getElementById('factura');
    let facturaId = '';
    try {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const folderPath = '/LosMolles/Contabilidad/Egresos';
            facturaId = await uploadFileToDrive(file, folderPath, file.name);
        }
        
        const lastData = await readSheetData('Egresos!A:A');
        const lastId = lastData.result.values ? Math.max(...lastData.result.values.flat().map(Number).filter(n => !isNaN(n))) : 0;
        
        const newGasto = [
            lastId + 1,
            document.getElementById('fecha').value,
            document.getElementById('categoria').value,
            document.getElementById('descripcion').value,
            document.getElementById('proveedor').value,
            document.getElementById('monto').value,
            facturaId
        ];
        
        await appendSheetData('Egresos', [newGasto]);
        alert("Gasto registrado exitosamente.");
        hideModal();
        loadEgresosTable();
    } catch (error) {
        console.error("Error al guardar el gasto:", error);
        alert("Error al guardar el gasto: " + (error.message || error.result.error.message));
    } finally {
        hideLoader();
    }
}


// ... (resto de funciones sin cambios, como displayResidentGCDetails, handleSavePayment, etc.)
// ... (asegúrate de que todas las funciones anteriores, como la de residentes, están aquí)
// El código completo de las funciones anteriores se omite por brevedad, pero debe estar presente en tu archivo final.

// --- COPIAR Y PEGAR DESDE AQUÍ HACIA ABAJO PARA REEMPLAZAR LAS VERSIONES ANTIGUAS ---
// (Esto es para asegurar que las funciones más recientes y corregidas estén presentes)

async function displayResidentGCDetails() {
    const residentId = document.getElementById('resident-selector-gc').value;
    const detailsContainer = document.getElementById('resident-gc-details');
    if (!residentId) {
        detailsContainer.innerHTML = '<p>Seleccione un residente para ver su historial de pagos.</p>';
        return;
    }
    showLoader();
    try {
        const residentData = allResidentsData.find(r => r && r[0] === residentId);
        if (!residentData) throw new Error("No se encontraron los datos del residente seleccionado.");
        
        const valorGastoComun = parseFloat(residentData[8]);
        const nParcela = residentData[3];
        const allPayments = await readSheetData('Pagos_GC!A:I');
        const residentPayments = allPayments.slice(1).filter(p => p && p[1] === residentId);
        const currentYear = new Date().getFullYear();
        let tableRows = '';
        let mesesMoraAcumulados = 0;
        for (let i = 0; i < 12; i++) {
            const periodo = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
            const fechaVencimiento = new Date(currentYear, i, 11);
            const paymentForPeriod = residentPayments.find(p => p && p[3] === periodo);
            const montoPagado = paymentForPeriod ? parseFloat(paymentForPeriod[5] || 0) : 0;
            const fechaPago = paymentForPeriod ? new Date(paymentForPeriod[6]) : null;
            if (new Date() > fechaVencimiento && montoPagado < valorGastoComun) { mesesMoraAcumulados++; }
            const tmcAnual = parseFloat(document.getElementById('tmc-input').value) || 0;
            const interesPorMora = (mesesMoraAcumulados > 0 && montoPagado < valorGastoComun) ? (((valorGastoComun * tmcAnual) / 100) / 12) * mesesMoraAcumulados : 0;
            const multaAdicional = (mesesMoraAcumulados > 0 && montoPagado < valorGastoComun) ? (valorGastoComun * 0.25) : 0;
            const deudaTotalMes = (valorGastoComun + interesPorMora + multaAdicional) - montoPagado;
            const valorPendiente = valorGastoComun - montoPagado;
            let estado;
            if (montoPagado >= valorGastoComun) {
                estado = '<span style="color:green;">Pagado</span>';
                if (fechaPago && fechaPago <= fechaVencimiento) { mesesMoraAcumulados = 0; }
            } else if (new Date() > fechaVencimiento) { estado = '<span style="color:red;">Pendiente</span>'; } else { estado = 'Por Vencer'; }
            let saldoColor = valorPendiente > 0 ? 'red' : 'green';
            tableRows += `<tr><td>${new Date(currentYear, i, 1).toLocaleString('es-CL', { month: 'long' })}</td><td>${formatCurrency(valorGastoComun)}</td><td>${new Date(currentYear, i, 10).toLocaleDateString('es-CL')}</td><td>${formatCurrency(montoPagado)}</td><td style="color:${saldoColor};">${formatCurrency(valorPendiente)}</td><td>${formatCurrency(interesPorMora)}</td><td>${formatCurrency(multaAdicional)}</td><td>${(montoPagado < valorGastoComun) ? mesesMoraAcumulados : 0}</td><td>${formatCurrency(deudaTotalMes)}</td><td>${estado}</td></tr>`;
        }
        detailsContainer.innerHTML = `<h3>Historial de Pagos para Parcela N° ${nParcela}</h3><div class="table-container"><table id="gc-history-table"><thead><tr><th>Mes</th><th>Valor Gasto Común</th><th>Fecha Venc.</th><th>Monto Pagado</th><th>Valor Pendiente o Saldo a Favor</th><th>Interés Mora</th><th>¼ Multa Adic.</th><th>Meses Mora (Acum.)</th><th>Deuda Total Mes</th><th>Estado</th></tr></thead><tbody>${tableRows}</tbody></table></div><br><button class="cta-button" id="register-payment-btn">Registrar Pago</button>`;
        document.getElementById('register-payment-btn').addEventListener('click', () => showRegisterPaymentModal(residentId, nParcela));
    } catch (error) {
        console.error("Error displaying resident details:", error);
        detailsContainer.innerHTML = `<p style="color:red;">No se pudo cargar el historial del residente. ${error.message}</p>`;
    } finally { hideLoader(); }
}

async function handleAddResident(e) {
    e.preventDefault(); showLoader();
    try {
        const lastData = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Residentes!A:A' });
        const lastId = lastData.result.values ? Math.max(...lastData.result.values.flat().map(Number).filter(n => !isNaN(n))) : 0;
        const newResident = [ 
            lastId + 1, 
            document.getElementById('nombreCompleto').value, 
            document.getElementById('rut').value, 
            document.getElementById('nParcela').value, 
            document.getElementById('direccion').value,
            document.getElementById('email').value, 
            document.getElementById('telefono').value, 
            document.getElementById('estado').value, 
            document.getElementById('valorGastoComun').value 
        ];
        await appendSheetData('Residentes', [newResident]);
        const residents = await readSheetData('Residentes!A2:I');
        allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun'], ...residents];
        hideModal(); 
        switchView('residentes');
    } catch (error) { 
        console.error("Error al agregar residente:", error); 
        alert("Error al guardar: " + error.result.error.message);
    } finally { 
        hideLoader(); 
    }
}

function showEditResidentModal(rowIndex) {
    const arrayIndex = parseInt(rowIndex) - 1;
    const residentData = allResidentsData[arrayIndex];
    if (!residentData) { alert("Error: No se encontraron los datos para editar."); return; }
    const formHtml = `<h2>Editar Residente</h2><form id="edit-resident-form"><input type="hidden" id="rowIndex" value="${rowIndex}"><label for="nombreCompleto">Nombre Completo:</label><input type="text" id="nombreCompleto" value="${residentData[1] || ''}" required><label for="rut">RUT:</label><input type="text" id="rut" value="${residentData[2] || ''}" required><label for="nParcela">N° Parcela:</label><input type="text" id="nParcela" value="${residentData[3] || ''}" required><label for="direccion">Dirección:</label><input type="text" id="direccion" value="${residentData[4] || ''}" required><label for="email">Email:</label><input type="email" id="email" value="${residentData[5] || ''}" required><label for="telefono">Teléfono:</label><input type="tel" id="telefono" value="${residentData[6] || ''}"><label for="estado">Estado:</label><select id="estado"><option value="Activo">Activo</option><option value="Moroso">Moroso</option><option value="Inactivo">Inactivo</option></select><label for="valorGastoComun">Valor Gasto Común:</label><input type="number" id="valorGastoComun" value="${residentData[8] || ''}" required><button type="submit" class="cta-button">Actualizar Residente</button></form>`;
    showModal(formHtml);
    document.getElementById('estado').value = residentData[7] || 'Activo';
    document.getElementById('edit-resident-form').addEventListener('submit', handleUpdateResident);
}

async function handleUpdateResident(e) {
    e.preventDefault(); showLoader();
    const rowIndex = document.getElementById('rowIndex').value;
    const arrayIndex = parseInt(rowIndex) - 1;
    try {
        const updatedValues = [
            allResidentsData[arrayIndex][0],
            document.getElementById('nombreCompleto').value,
            document.getElementById('rut').value,
            document.getElementById('nParcela').value,
            document.getElementById('direccion').value,
            document.getElementById('email').value,
            document.getElementById('telefono').value,
            document.getElementById('estado').value,
            document.getElementById('valorGastoComun').value
        ];
        await updateSheetRow('Residentes', rowIndex, [updatedValues]);
        const residents = await readSheetData('Residentes!A2:I');
        allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun'], ...residents];
        hideModal();
        switchView('residentes');
    } catch (error) {
        console.error("Error al actualizar residente:", error);
        alert("Error al actualizar: " + error.result.error.message);
    } finally {
        hideLoader();
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
        if (ws[cell_ref] && ws[cell_ref].v !== undefined) {
            ws[cell_ref].t = 'n';
            ws[cell_ref].z = '$ #,##0';
        }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Listado_Residentes.xlsx");
}

async function deleteSheetRow(sheetName, rowIndex) {
    showLoader();
    try {
        const sheetMetadata = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
        const sheet = sheetMetadata.result.sheets.find(s => s.properties.title === sheetName);
        if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada.`);
        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { requests: [{ deleteDimension: { range: { sheetId: sheet.properties.sheetId, dimension: "ROWS", startIndex: parseInt(rowIndex) - 1, endIndex: parseInt(rowIndex) } } }] }
        });
        const residents = await readSheetData('Residentes!A2:I');
        allResidentsData = [['ID_Residente', 'NombreCompleto', 'RUT', 'N_Parcela', 'Direccion', 'Email', 'Telefono', 'Estado', 'ValorGastoComun'], ...residents];
        alert("Fila eliminada correctamente."); 
        switchView('residentes');
    } catch (err) { 
        console.error("Error al eliminar la fila:", err); 
        alert("No se pudo eliminar la fila.");
    } finally {
        hideLoader();
    }
}

// El resto del código que ya funciona (formatCurrency, readSheetData, etc.) se mantiene igual
// pero se incluye aquí para asegurar que el archivo sea completo.
function formatCurrency(value) { if (typeof value !== 'number' || isNaN(value)) return '$0'; return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value); }
async function readSheetData(range) { const response = await gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: range }); return response.result.values || []; }
async function appendSheetData(sheetName, values) { return gapi.client.sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: `${sheetName}!A1`, valueInputOption: 'USER_ENTERED', resource: { values: values }, }); }
async function updateSheetRow(sheetName, rowIndex, values) { const range = `${sheetName}!A${rowIndex}`; return gapi.client.sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: range, valueInputOption: 'USER_ENTERED', resource: { values: values } }); }
