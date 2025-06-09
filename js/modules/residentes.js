/**
 * CondoAdmin - Módulo de Residentes (Versión final con corrección de renderizado)
 */

let originalResidentesData = [];
let residenteHeaders = [];

async function initResidentesModule(container) {
    console.log("🚀 Inicializando módulo de residentes...");
    try {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center my-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="ms-3">Cargando datos de residentes...</p>
            </div>
        `;

        const [residentes, headers] = await Promise.all([
            sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES),
            sheetsAPI.getSheetHeaders(CONFIG.SHEETS.RESIDENTES)
        ]);

        residenteHeaders = headers || [];
        
        originalResidentesData = residentes.map((residente, index) => {
            return { ...residente, SHEET_ROW_INDEX: index + 2 };
        });

        renderResidentesUI(container, originalResidentesData, residenteHeaders);
        console.log("✅ Módulo de residentes inicializado correctamente.");

    } catch (error) {
        console.error("❌ Error al inicializar módulo de residentes:", error);
        showDetailedError("Error Crítico en el Módulo de Residentes", error, container);
    }
}

// *** FUNCIÓN REESCRITA PARA MAYOR ESTABILIDAD ***
function renderResidentesUI(container, residentes, headers) {
    // Limpiamos el contenedor principal
    container.innerHTML = "";

    // Creamos los elementos de la UI programáticamente
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-4';
    header.innerHTML = `
        <h2>Gestión de Residentes</h2>
        <button id="add-residente-btn" class="btn btn-primary shadow-sm"><i class="fas fa-plus me-2"></i> Nuevo Residente</button>
    `;

    const toolbar = document.createElement('div');
    toolbar.className = 'row mb-3';
    toolbar.innerHTML = `
        <div class="col-md-8">
            <div class="input-group"><input type="text" id="search-residente" class="form-control" placeholder="Buscar por nombre, RUT, etc."></div>
        </div>
        <div class="col-md-4 d-flex justify-content-end">
            <button id="export-residentes-btn" class="btn btn-outline-success ms-2"><i class="fas fa-file-excel me-2"></i> Exportar a CSV</button>
        </div>
    `;
    
    // Creamos el contenedor de la tabla y lo guardamos en una variable
    const tableContainer = document.createElement('div');
    tableContainer.id = 'residentes-table-container';

    // Añadimos todos los elementos creados al contenedor principal
    container.appendChild(header);
    container.appendChild(toolbar);
    container.appendChild(tableContainer);
    
    // Configuramos los eventos de los botones
    document.getElementById('add-residente-btn').addEventListener('click', () => showResidenteForm());
    document.getElementById('search-residente').addEventListener('keyup', filterResidentes);
    document.getElementById('export-residentes-btn').addEventListener('click', () => exportResidentes(originalResidentesData));

    // Llamamos a la función que dibuja la tabla, pasándole el contenedor que acabamos de crear
    updateResidentesTable(residentes, headers, tableContainer);
}


// *** FUNCIÓN MODIFICADA PARA RECIBIR EL CONTENEDOR ***
function updateResidentesTable(residentes, headers, tableContainer) {
    if (!tableContainer) {
        console.error("El contenedor de la tabla no fue provisto.");
        return;
    }
    
    tableContainer.innerHTML = ""; // Limpiamos el contenedor específico de la tabla

    if (residentes.length === 0) {
        tableContainer.innerHTML = `<div class="alert alert-info mt-4"><i class="fas fa-info-circle me-2"></i>No se encontraron residentes.</div>`;
        return;
    }

    const safeHeaders = Array.isArray(headers) ? headers : [];

    const columns = safeHeaders.map(header => {
        const columnDef = { field: header, title: header };
        if (header === "Numero_Parcela") {
            columnDef.formatter = (value) => `<span class="badge bg-secondary">${value || "N/A"}</span>`;
        }
        if (header === "Estado") {
            const classMap = { "Activo": "bg-success", "Inactivo": "bg-danger", "Moroso": "bg-warning text-dark" };
            columnDef.formatter = (value) => `<span class="badge <span class="math-inline">\{classMap\[value\] \|\| 'bg\-secondary'\}"\></span>{value || "No definido"}</span>`;
        }
        return columnDef;
    });
    
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary btn-edit" data-rut="<span class="math-inline">\{item\.Rut\}" title\="Editar"\><i class\="fas fa\-edit"\></i\></button\>
<button class\="btn btn\-outline\-danger btn\-delete" data\-rut\="</span>{item.Rut}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const dataTable = createDataTable(residentes, columns, rowActions);
    const card = createCard("Listado de Residentes", dataTable);
    tableContainer.appendChild(card);
    setupActionButtons(residentes);
}

function showResidenteForm(residente = null) {
    const isEditing = !!residente;

    const fields = [
        { id: "nombre", label: "Nombre Completo", required: true },
        { id: "rut", label: "RUT", required: true, disabled: isEditing },
        { id: "direccion", label: "Dirección", required: true },
        { id: "email", label: "Email", type: "email" },
        { id: "telefono", label: "Teléfono", type: "tel" },
        { id: "numero_parcela", label: "Nº Parcela", required: true, type: "number" },
        { id: "estado", label: "Estado", type: "select", options: [
            { value: "Activo", label: "Activo" }, { value: "Inactivo", label: "Inactivo" }, { value: "Moroso", label: "Moroso" }
        ], required: true },
        { id: "valor_gasto_comun", label: "Valor Gasto Común ($)", type: "number", required: true }
    ];

    const formValues = isEditing ? {
        nombre: residente.Nombre || "", rut: residente.Rut || "", direccion: residente.Direccion || "",
        email: residente.Email || "", telefono: residente.Telefono || "", numero_parcela: residente.Numero_Parcela || "",
        estado: residente.Estado || "Activo", valor_gasto_comun: residente.Valor_Gasto_Comun || "0"
    } : { estado: "Activo", valor_gasto_comun: "0" };

    const form = createForm(fields, formValues, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const rowData = [
                formData.nombre, formData.rut, formData.direccion, formData.email,
                formData.telefono, formData.numero_parcela, formData.estado, formData.valor_gasto_comun
            ];

            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX, rowData);
                showToast("Residente actualizado exitosamente.", "success");
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
                showToast("Residente creado exitosamente.", "success");
            }

            modal.hide();
            await initResidentesModule(document.getElementById("module-container"));

        } catch (error) {
            showDetailedError("Error al Guardar Residente", error);
        }
    });

    createModal(isEditing ? "Editar Residente" : "Nuevo Residente", form, "lg").show();
}

function setupActionButtons(residentes) {
    document.querySelectorAll(".btn-edit, .btn-delete").forEach(button => {
        button.addEventListener("click", (e) => {
            const rut = e.currentTarget.getAttribute("data-rut");
            const residente = residentes.find(r => r.Rut === rut);
            if (!residente) return;
            if (e.currentTarget.classList.contains("btn-edit")) showResidenteForm(residente);
            else if (e.currentTarget.classList.contains("btn-delete")) confirmDeleteResidente(residente);
        });
    });
}

function confirmDeleteResidente(residente) {
    const modalContent = `<p>¿Está seguro de que desea eliminar a <strong>${residente.Nombre}</strong> (RUT: ${residente.Rut})?</p><p class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Esta acción no se puede deshacer.</p>`;
    
    createModal("Confirmar Eliminación", modalContent, "md", [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { 
            label: 'Eliminar', 
            className: 'btn-danger', 
            onClick: async (modal) => {
                try {
                    await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX);
                    showToast("Residente eliminado.", "success");
                    modal.hide();
                    await initResidentesModule(document.getElementById("module-container"));
                } catch (error) {
                    modal.hide();
                    showDetailedError("Error al Eliminar Residente", error);
                }
            }
        }
    ]).show();
}

function filterResidentes() {
    const searchText = document.getElementById("search-residente")?.value?.toLowerCase() || "";
    const filtered = originalResidentesData.filter(residente => 
        Object.values(residente).some(value => String(value).toLowerCase().includes(searchText))
    );
    // Pasamos el contenedor y los headers guardados para que el filtrado no rompa la tabla
    updateResidentesTable(filtered, residenteHeaders, document.getElementById('residentes-table-container'));
}

function exportResidentes(residentes) {
    if (residenteHeaders.length === 0) {
        showToast("No hay datos de columnas para exportar.", "warning");
        return;
    }
    try {
        let csvContent = "data:
