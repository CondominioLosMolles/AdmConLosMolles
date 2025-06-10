/**
 * Módulo de Gastos Comunes (Versión Dinámica y Corregida)
 */

async function initGastoscomunesModule(container) {
    console.log("🚀 Inicializando módulo de Gastos Comunes...");
    try {
        container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;

        // Se leen los datos y las columnas (headers) en paralelo para más eficiencia
        const [data, headers] = await Promise.all([
            sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS_COMUNES),
            sheetsAPI.getSheetHeaders(CONFIG.SHEETS.GASTOS_COMUNES)
        ]);

        // Se asegura que los datos sean siempre una lista
        const gastosComunes = (Array.isArray(data) ? data : []).map((row, index) => {
            row.SHEET_ROW_INDEX = index + 2;
            return row;
        });
        
        renderGastosComunesUI(container, gastosComunes, headers);
        console.log("✅ Módulo de Gastos Comunes inicializado correctamente.");
    } catch (error) {
        console.error("❌ Error al inicializar módulo de Gastos Comunes:", error);
        showDetailedError("Error al inicializar el módulo de Gastos Comunes", error, container);
    }
}

function renderGastosComunesUI(container, data, headers) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gastos Comunes</h2>
            <button id="add-gasto-comun" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Gasto Común</button>
        </div>
        <div id="gastos-comunes-table-container"></div>
    `;
    
    document.getElementById('add-gasto-comun').addEventListener('click', () => showGastosComunesForm(null, headers));
    updateGastosComunesTable(data, headers);
}

function updateGastosComunesTable(gastosComunes, headers) {
    const tableContainer = document.getElementById("gastos-comunes-table-container");
    const formatCurrency = (val) => CONFIG.APP.CURRENCY + Number(val || 0).toLocaleString('es-CL');

    // --- INICIO DE LA CORRECCIÓN #1: Tabla Dinámica ---
    // Las columnas de la tabla se crean dinámicamente a partir de los headers de tu hoja.
    // Esto asegura que el orden siempre será el correcto.
    const columns = headers.map(header => {
        // No mostramos la columna ID en la tabla
        if (header === "ID") return null;

        const columnDef = { field: header
