// Módulo de Residentes - Versión Corregida y Optimizada

let originalResidentesData = [];

async function initResidentesModule(container) {
    console.log("🚀 Inicializando módulo de residentes...");
    try {
        if (typeof sheetsAPI === "undefined") throw new Error("El componente sheetsAPI no está disponible.");
        if (typeof CONFIG === "undefined" || !CONFIG.SHEETS || !CONFIG.SHEETS.RESIDENTES) {
            throw new Error("La configuración de la hoja de Residentes no está definida en CONFIG.");
        }

        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="ms-3">Cargando datos de residentes...</p>
            </div>
        `;

        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);

        originalResidentesData = residentes.map((residente, index) => {
            const cleanResidente = {};
            Object.keys(residente).forEach(key => {
                if (residente[key] !== undefined && residente[key] !== null) {
                    cleanResidente[key] = residente[key];
                }
            });

            // Usar el RUT como identificador único y almacenar el índice de la fila original
            const rut = cleanResidente["Rut"] || cleanResidente["RUT"];
            cleanResidente.RUT_UNIQUE_ID = rut;
            cleanResidente.SHEET_ROW_INDEX = index + 2; // Fila real en Google Sheets (1-based, +1 por el header)

            return cleanResidente;
        });

        renderResidentesUI(container, originalResidentesData);
        console.log("✅ Módulo de residentes inicializado correctamente");

    } catch (error) {
        console.error("❌ Error al inicializar módulo de residentes:", error);
        showDetailedError("Error Crítico en el Módulo de Residentes", error, container);
    }
}

function renderResidentesUI(container, residentes) {
    const content = document.createElement("div");
    
    const header = document.createElement("div");
    header.className = "d-flex justify-content-between align-items-center mb-4";
    const title = document.createElement("h2");
    title.textContent = "Gestión de Residentes";
    const addButton = document.createElement("button");
    addButton.className = "btn btn-primary shadow-sm";
    addButton.innerHTML = "<i class=\"fas fa-plus me-2\"></i> Nuevo Residente";
    addButton.addEventListener("click", () => showResidenteForm());
    header.appendChild(title);
    header.appendChild(addButton);
    content.appendChild(header);

    const toolbarRow = document.createElement("div");
    toolbarRow.className = "row mb-3";

    const searchCol = document.createElement("div");
    searchCol.className = "col-md-8";
    const searchInputGroup = document.createElement("div");
    searchInputGroup.className = "input-group";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "form-control";
    searchInput.placeholder = "Buscar por nombre, RUT, número de parcela...";
    searchInput.id = "search-residente";
    searchInput.addEventListener("keyup", (e) => filterResidentes());
    searchInputGroup.appendChild(searchInput);
    searchCol.appendChild(searchInputGroup);
    toolbarRow.appendChild(searchCol);

    const filterCol = document.createElement("div");
    filterCol.className = "col-md-4 d-flex justify-content-end";
    const exportButton = document.createElement("button");
    exportButton.className = "btn btn-outline-success ms-2";
    exportButton.innerHTML = "<i class=\"fas fa-file-excel me-2\"></i> Exportar a CSV";
    exportButton.addEventListener("click", () => exportResidentes(originalResidentesData));
    filterCol.appendChild(exportButton);
    toolbarRow.appendChild(filterCol);

    content.appendChild(toolbarRow);

    const tableContainer = document.createElement("div");
    tableContainer.id = "residentes-table-container";
    content.appendChild(tableContainer);

    container.innerHTML = "";
    container.appendChild(content);

    updateResidentesTable(residentes);
}

function updateResidentesTable(residentes) {
    const tableContainer = document.getElementById("residentes-table-container");
    if (!tableContainer) return;

    tableContainer.innerHTML = "";

    if (residentes.length === 0) {
        tableContainer.innerHTML = `
            <div class="alert alert-info mt-4" role="alert">
                <i class="fas fa-info-circle me-2"></i>
                No se encontraron residentes. Puede agregar uno nuevo usando el botón "Nuevo Residente".
            </div>
        `;
        return;
    }

    const columns = [
        { field: "Nombre", title: "Nombre Completo" },
        { field: "Rut", title: "RUT" },
        { 
            field: "Numero_Parcela", 
            title: "Nº Parcela", 
            width: "120px",
            formatter: (value, item) => `<span class="badge bg-secondary">${value || item["Numero Parcela"] || "N/A"}</span>`
        },
        { field: "Email", title: "Email de Contacto" },
        { field: "Telefono", title: "Teléfono" },
        {
            field: "Estado",
            title: "Estado",
            width: "120px",
            formatter: (value) => {
                let badgeClass = "bg-secondary";
                if (value === "Activo") badgeClass = "bg-success";
                if (value === "Inactivo") badgeClass = "bg-danger";
                if (value === "Moroso") badgeClass = "bg-warning text-dark";
                return `<span class="badge ${badgeClass}">${value || "No definido"}</span>`;
            }
        },
    ];
    
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary btn-edit" data-rut-id="${item.RUT_UNIQUE_ID}" title="Editar Residente"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-rut-id="${item.RUT_UNIQUE_ID}" title="Eliminar Residente"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const dataTable = createDataTable(residentes, columns, rowActions);
    const card = createCard("", dataTable);
    tableContainer.appendChild(card);
    setupActionButtons(residentes);
}

async function showResidenteForm(residente = null) {
    const isEditing = !!residente;

    const fields = [
        { id: "nombre", label: "Nombre Completo", type: "text", required: true, placeholder: "Ej: Juan Pérez González" },
        { id: "rut", label: "RUT", type: "text", required: true, placeholder: "Ej: 12345678-9", disabled: isEditing },
        { id: "direccion", label: "Dirección", type: "text", required: true, placeholder: "Ej: Parcela 1, Lote A" },
        { id: "email", label: "Email", type: "email", placeholder: "ejemplo@dominio.com" },
        { id: "telefono", label: "Teléfono", type: "tel", placeholder: "+56912345678" },
        { id: "numero_parcela", label: "Número de Parcela", type: "text", required: true, placeholder: "Ej: 123" },
        { id: "estado", label: "Estado", type: "select", options: [
            { value: "Activo", label: "Activo" }, { value: "Inactivo", label: "Inactivo" }, { value: "Moroso", label: "Moroso" }
        ], required: true },
        { id: "valor_gasto_comun", label: "Valor Gasto Común", type: "number", required: true, placeholder: "Ej: 30000" }
    ];

    let values = { estado: "Activo", valor_gasto_comun: "0" };
    if (isEditing) {
        values = {
            nombre: residente["Nombre"] || "",
            rut: residente.RUT_UNIQUE_ID,
            direccion: residente["Direccion"] || "",
            email: residente["Email"] || "",
            telefono: residente["Telefono"] || "",
            numero_parcela: residente["Numero_Parcela"] || residente["Numero Parcela"] || "",
            estado: residente["Estado"] || "Activo",
            valor_gasto_comun: residente["Valor_Gasto_Comun"] || residente["Valor Gasto Comun"] || "0"
        };
    }

    const form = createForm(fields, values, async (formData) => {
        const modalElement = form.closest(".modal");
        const submitButton = form.querySelector("button[type='submit']");
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

            if (!isEditing && originalResidentesData.some(r => r.RUT_UNIQUE_ID === formData.rut)) {
                throw new Error(`El RUT ${formData.rut} ya está registrado.`);
            }

            const headers = await sheetsAPI.getSheetHeaders(CONFIG.SHEETS.RESIDENTES);
            const rowData = headers.map(header => {
                 const keyMap = {
                    'Nombre': formData.nombre,
                    'Rut': formData.rut,
                    'Direccion': formData.direccion,
                    'Email': formData.email,
                    'Telefono': formData.telefono,
                    'Numero_Parcela': formData.numero_parcela,
                    'Estado': formData.estado,
                    'Valor_Gasto_Comun': formData.valor_gasto_comun,
                    'ID': isEditing ? residente.ID : generateUniqueId()
                };
                return keyMap[header] !== undefined ? keyMap[header] : "";
            });
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX, rowData);
                showToast("Residente actualizado exitosamente.", "success");
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
                showToast("Residente creado exitosamente.", "success");
            }

            bootstrap.Modal.getInstance(modalElement).hide();
            await initResidentesModule(document.getElementById("module-container"));
            
        } catch (error) {
            console.error("❌ Error al guardar residente:", error);
            showDetailedError("Error al Guardar Residente", error);
            submitButton.disabled = false;
            submitButton.textContent = "Guardar";
        }
    });

    createModal(isEditing ? "Editar Residente" : "Nuevo Residente", form, "lg").show();
}

function confirmDeleteResidente(residente) {
    const modalContent = `
        <p>¿Está seguro de que desea eliminar permanentemente al residente <strong>${residente["Nombre"]}</strong> (RUT: ${residente.RUT_UNIQUE_ID})?</p>
        <p class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Esta acción no se puede deshacer y eliminará la fila correspondiente en Google Sheets.</p>
    `;

    const modal = createModal("Confirmar Eliminación", modalContent, "md", [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modalInstance) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX);
                showToast("Residente eliminado exitosamente.", "success");
                modalInstance.hide();
                await initResidentesModule(document.getElementById("module-container"));
            } catch (error) {
                console.error("❌ Error al eliminar residente:", error);
                showDetailedError("Error al Eliminar Residente", error);
                modalInstance.hide();
            }
        }}
    ]);
    modal.show();
}

function setupActionButtons(residentes) {
    document.querySelectorAll(".btn-edit, .btn-delete").forEach(button => {
        button.addEventListener("click", (e) => {
            const rutId = e.currentTarget.getAttribute("data-rut-id");
            const residente = residentes.find(r => r.RUT_UNIQUE_ID === rutId);
            if (!residente) {
                showDetailedError("Error de Referencia", new Error(`No se encontró el residente con RUT: ${rutId}`));
                return;
            }
            if (e.currentTarget.classList.contains("btn-edit")) showResidenteForm(residente);
            if (e.currentTarget.classList.contains("btn-delete")) confirmDeleteResidente(residente);
        });
    });
}

function filterResidentes() {
    const searchText = document.getElementById("search-residente")?.value?.toLowerCase() || "";
    const filtered = originalResidentesData.filter(residente => 
        Object.values(residente).some(value => 
            String(value).toLowerCase().includes(searchText)
        )
    );
    updateResidentesTable(filtered);
}

function exportResidentes(residentes) {
    try {
        const headers = ["Nombre", "Rut", "Direccion", "Email", "Telefono", "Numero_Parcela", "Estado", "Valor_Gasto_Comun"];
        let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

        residentes.forEach(residente => {
            const row = headers.map(header => {
                let value = residente[header] || "";
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvContent += row.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `residentes_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("La exportación se ha iniciado.", "info");
    } catch (error) {
        console.error("❌ Error al exportar residentes:", error);
        showDetailedError("Error al Exportar Datos", error);
    }
}
