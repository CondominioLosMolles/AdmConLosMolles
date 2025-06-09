/**
 * CondoAdmin - Módulo de Residentes (Versión con corrección para guardado de parcela)
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
            return `<span class="badge ${badgeClass}">${value || "No definido"}</span>`;
        }}
    ];
    
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-edit" data-rut="${item.Rut}" title="Editar Residente"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline-danger btn-delete" data-rut="${item.Rut}" title="Eliminar Residente"><i class="fas fa-trash"></i></button>
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

    let formValues = {};
    if (isEditing) {
        formValues = {
            nombre: residente.Nombre || "", rut: residente.Rut || "", direccion: residente.Direccion || "",
            email: residente.Email || "", telefono: residente.Telefono || "", numero_parcela: residente.Numero_Parcela || "",
            estado: residente.Estado || "Activo", valor_gasto_comun: residente.Valor_Gasto_Comun || "0"
        };
    } else {
        formValues = { estado: "Activo", valor_gasto_comun: "0" };
    }

    const form = createForm(fields, formValues, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            // *** INICIO DE LA CORRECCIÓN ***
            // Se construye la fila de datos de forma directa y en el orden correcto de las columnas de la hoja.
            // Esto es más simple y evita el error de mapeo anterior.
            const rowData = [
                isEditing ? residente.ID : generateUniqueId(),
                formData.nombre,
                formData.rut,
                formData.direccion,
                formData.email,
                formData.telefono,
                formData.numero_parcela, // <-- Aquí se usa directamente el valor del formulario
                formData.estado,
                formData.valor_gasto_comun
            ];
            // *** FIN DE LA CORRECCIÓN ***

            if (isEditing) {
                // Para actualizar, necesitamos saber qué fila es (por eso guardamos SHEET_ROW_INDEX)
                // y necesitamos pasar el array completo de datos en el orden correcto.
                await sheetsAPI.updateRowByHeader(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX, {
                    ID: residente.ID, // Mantenemos el ID original
                    Nombre: formData.nombre, Rut: formData.rut, Direccion: formData.direccion,
                    Email: formData.email, Telefono: formData.telefono, Numero_Parcela: formData.numero_parcela,
                    Estado: formData.estado, Valor_Gasto_Comun: formData.valor_gasto_comun
                });

                showToast("Residente actualizado exitosamente.", "success");
            } else {
                // Para agregar una nueva fila, solo enviamos el array de datos.
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
            if (!residente) {
                showDetailedError("Error de Referencia", new Error(`No se encontró el residente con RUT: ${rut}`));
                return;
            }
            if (e.currentTarget.classList.contains("btn-edit")) {
                showResidenteForm(residente);
            } else if (e.currentTarget.classList.contains("btn-delete")) {
                confirmDeleteResidente(residente);
            }
        });
    });
}

function confirmDeleteResidente(residente) {
    const modalContent = `
        <p>¿Está seguro de que desea eliminar permanentemente al residente <strong>${residente.Nombre}</strong> (RUT: ${residente.Rut})?</p>
        <p class="text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Esta acción no se puede deshacer.</p>
    `;
    createModal("Confirmar Eliminación", modalContent, "md", [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX);
                showToast("Residente eliminado.", "success");
                modal.hide();
                await initResidentesModule(document.getElementById("module-container"));
            } catch (error) {
                showDetailedError("Error al Eliminar Residente", error);
            }
        }}
    ]).show();
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
        const headers = ["ID", "Nombre", "Rut", "Direccion", "Email", "Telefono", "Numero_Parcela", "Estado", "Valor_Gasto_Comun"];
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
        showDetailedError("Error al Exportar Datos", error);
    }
}
