/**
 * CondoAdmin - Módulo de Residentes (Versión final y estable)
 */

const RESIDENTE_HEADERS = ["Nombre", "Rut", "Direccion", "Email", "Telefono", "Numero_Parcela", "Estado", "Valor_Gasto_Comun"];
let originalResidentesData = [];

async function initResidentesModule(container) {
    console.log("🚀 Inicializando módulo de residentes (versión estable)...");
    try {
        container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando datos de residentes...</p></div>`;

        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
        
        originalResidentesData = residentes.map((residente, index) => {
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
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión de Residentes</h2>
            <button id="add-residente-btn" class="btn btn-primary shadow-sm"><i class="fas fa-plus me-2"></i> Nuevo Residente</button>
        </div>
        <div class="row mb-3">
            <div class="col-md-8"><div class="input-group"><input type="text" id="search-residente" class="form-control" placeholder="Buscar por nombre, RUT, etc."></div></div>
            <div class="col-md-4 d-flex justify-content-end"><button id="export-residentes-btn" class="btn btn-outline-success ms-2"><i class="fas fa-file-excel me-2"></i> Exportar a CSV</button></div>
        </div>
        <div id="residentes-table-container"></div>`;
    
    document.getElementById('add-residente-btn').addEventListener('click', () => showResidenteForm());
    document.getElementById('search-residente').addEventListener('keyup', () => filterResidentes(originalResidentesData));
    document.getElementById('export-residentes-btn').addEventListener('click', () => exportResidentes(originalResidentesData));

    updateResidentesTable(residentes);
}

function updateResidentesTable(residentes) {
    const tableContainer = document.getElementById("residentes-table-container");

    const columns = [
        { field: "Nombre", title: "Nombre Completo" },
        { field: "Rut", title: "RUT" },
        { field: "Numero_Parcela", title: "Nº Parcela", formatter: (value) => `<span class="badge bg-secondary">${value || "N/A"}</span>` },
        { field: "Email", title: "Email" },
        { field: "Telefono", title: "Teléfono" },
        { field: "Estado", title: "Estado", formatter: (value) => {
            const classMap = { "Activo": "bg-success", "Inactivo": "bg-danger", "Moroso": "bg-warning text-dark" };
            return `<span class="badge ${classMap[value] || 'bg-secondary'}">${value || "No definido"}</span>`;
        }}
    ];
    
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary btn-edit" data-rut="${item.Rut}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline-danger btn-delete" data-rut="${item.Rut}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`;

    const dataTable = createDataTable(residentes, columns, rowActions);
    const card = createCard("Listado de Residentes", dataTable);
    tableContainer.innerHTML = "";
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

function filterResidentes(residentes) {
    const searchText = document.getElementById("search-residente")?.value?.toLowerCase() || "";
    const filtered = originalResidentesData.filter(residente => 
        Object.values(residente).some(value => String(value).toLowerCase().includes(searchText))
    );
    updateResidentesTable(filtered);
}

function exportResidentes(residentes) {
    try {
        let csvContent = "data:text/csv;charset=utf-8," + RESIDENTE_HEADERS.join(",") + "\n";
        residentes.forEach(residente => {
            const row = RESIDENTE_HEADERS.map(header => `"${String(residente[header] || "").replace(/"/g, '""')}"`);
            csvContent += row.join(",") + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `residentes_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        showDetailedError("Error al Exportar Datos", error);
    }
}
