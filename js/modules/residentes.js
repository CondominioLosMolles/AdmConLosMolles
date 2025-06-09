/**
 * CondoAdmin - Módulo de Residentes (Versión con corrección para edición)
 */

let originalResidentesData = [];

async function initResidentesModule(container) {
    console.log("🚀 Inicializando módulo de residentes...");
    try {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center my-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="ms-3">Cargando datos de residentes...</p>
            </div>
        `;

        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);

        originalResidentesData = residentes.map((residente, index) => {
            // Se añade el índice de la fila original para poder actualizarla o borrarla después.
            return { ...residente, SHEET_ROW_INDEX: index + 2 };
        });

        renderResidentesUI(container, originalResidentesData);
        console.log("✅ Módulo de residentes inicializado correctamente.");

    } catch (error) {
        console.error("❌ Error al inicializar módulo de residentes:", error);
        showDetailedError("Error Crítico en el Módulo de Residentes", error, container);
    }
}

function renderResidentesUI(container, residentes) {
    const content = document.createElement("div");
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión de Residentes</h2>
            <button id="add-residente-btn" class="btn btn-primary shadow-sm">
                <i class="fas fa-plus me-2"></i> Nuevo Residente
            </button>
        </div>
        <div class="row mb-3">
            <div class="col-md-8">
                <div class="input-group">
                    <input type="text" id="search-residente" class="form-control" placeholder="Buscar por nombre, RUT, número de parcela...">
                </div>
            </div>
            <div class="col-md-4 d-flex justify-content-end">
                <button id="export-residentes-btn" class="btn btn-outline-success ms-2">
                    <i class="fas fa-file-excel me-2"></i> Exportar a CSV
                </button>
            </div>
        </div>
        <div id="residentes-table-container"></div>
    `;
    
    container.innerHTML = "";
    container.appendChild(content);
    
    document.getElementById('add-residente-btn').addEventListener('click', () => showResidenteForm());
    document.getElementById('search-residente').addEventListener('keyup', filterResidentes);
    document.getElementById('export-residentes-btn').addEventListener('click', () => exportResidentes(originalResidentesData));

    updateResidentesTable(residentes);
}

function updateResidentesTable(residentes) {
    const tableContainer = document.getElementById("residentes-table-container");
    if (!tableContainer) return;

    if (residentes.length === 0) {
        tableContainer.innerHTML = `<div class="alert alert-info mt-4"><i class="fas fa-info-circle me-2"></i>No se encontraron residentes.</div>`;
        return;
    }

    const columns = [
        { field: "Nombre", title: "Nombre Completo" },
        { field: "Rut", title: "RUT" },
        { field: "Numero_Parcela", title: "Nº Parcela", formatter: (value) => `<span class="badge bg-secondary">${value || "N/A"}</span>` },
        { field: "Email", title: "Email" },
        { field: "Telefono", title: "Teléfono" },
        { field: "Estado", title: "Estado", formatter: (value) => {
            let badgeClass = "bg-secondary";
            if (value === "Activo") badgeClass = "bg-success";
            if (value === "Inactivo") badgeClass = "bg-danger";
            if (value === "Moroso") badgeClass = "bg-warning text-dark";
            return `<span class="badge <span class="math-inline">\{badgeClass\}"\></span>{value || "No definido"}</span>`;
        }}
    ];
    
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-edit" data-rut="<span class="math-inline">\{item\.Rut\}" title\="Editar Residente"\><i class\="fas fa\-edit"\></i\></button\>
<button class\="btn btn\-outline\-danger btn\-delete" data\-rut\="</span>{item.Rut}" title="Eliminar Residente"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const dataTable = createDataTable(residentes, columns, rowActions);
    const card = createCard("", dataTable);
    tableContainer.innerHTML = "";
    tableContainer.appendChild(card);
    setupActionButtons(residentes);
}

function showResidenteForm(residente = null) {
    const isEditing = !!residente;

    // Mapa que define la correspondencia entre los IDs del formulario y las cabeceras de Google Sheets.
    // Esta es la ÚNICA fuente de verdad para el mapeo, lo que evita errores.
    const fieldMap = {
        nombre: 'Nombre', rut: 'Rut', direccion: 'Direccion', email: 'Email', telefono: 'Telefono',
        numero_parcela: 'Numero_Parcela', estado: 'Estado', valor_gasto_
