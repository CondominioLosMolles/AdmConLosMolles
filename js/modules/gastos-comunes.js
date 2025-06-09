/**
 * Módulo de Gastos Comunes
 */

async function initGastosComunesModule(container) {
    console.log("🚀 Inicializando módulo de Gastos Comunes...");
    try {
        if (typeof sheetsAPI === "undefined") throw new Error("sheetsAPI no está disponible");
        if (typeof window.CONFIG === "undefined" || !window.CONFIG.SHEETS || !window.CONFIG.SHEETS.GASTOS_COMUNES) {
            throw new Error("CONFIG.SHEETS.GASTOS_COMUNES no está definido");
        }

        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;

        // Aquí se cargará y mostrará la tabla de gastos comunes
        const gastosComunes = (await sheetsAPI.getSheetData(window.CONFIG.SHEETS.GASTOS_COMUNES)).map((row, index) => {
            row.SHEET_ROW_INDEX = index + 2; // Fila real en Google Sheets (considerando encabezados)
            row.ID = `gc-${row.SHEET_ROW_INDEX}`; // Generar un ID único para cada gasto común
            return row;
        });
        
        const content = document.createElement("div");
        const header = document.createElement("div");
        header.className = "d-flex justify-content-between align-items-center mb-4";
        const title = document.createElement("h2");
        title.textContent = "Gastos Comunes";
        const addButton = document.createElement("button");
        addButton.className = "btn btn-primary";
        addButton.innerHTML = "<i class=\"fas fa-plus\"></i> Nuevo Gasto Común";
        addButton.addEventListener("click", () => showGastosComunesForm());
        header.appendChild(title);
        header.appendChild(addButton);
        content.appendChild(header);

        const tableContainer = document.createElement("div");
        tableContainer.className = "card";
        tableContainer.id = "gastos-comunes-table-container";
        const tableCard = document.createElement("div");
        tableCard.className = "card-body";
        tableContainer.appendChild(tableCard);
        content.appendChild(tableContainer);

        container.innerHTML = "";
        container.appendChild(content);

        updateGastosComunesTable(gastosComunes);
        console.log("✅ Módulo de Gastos Comunes inicializado correctamente");
    } catch (error) {
        console.error("❌ Error al inicializar módulo de Gastos Comunes:", error);
        showDetailedError("Error al inicializar el módulo de Gastos Comunes", error);
    }
}

function updateGastosComunesTable(gastosComunes) {
    const tableCard = document.querySelector("#gastos-comunes-table-container .card-body");
    if (!tableCard) return;

    tableCard.innerHTML = "";
    const columns = [
        { field: "Periodo", title: "Período" },
        { field: "Monto_Base", title: "Monto Base" },
        { field: "Fecha_Vencimiento", title: "Fecha Vencimiento" },
        { field: "Interes_IMC", title: "Interés IMC" },
        { field: "Multa_25_Porciento", title: "Multa 25%" },
        { field: "Total_Adeudado", title: "Total Adeudado" },
        { field: "Estado", title: "Estado" }
    ];
    const rowActions = (item) => `
        <div class=\"btn-group btn-group-sm\" role=\"group\">
            <button type=\"button\" class=\"btn btn-outline-secondary btn-edit\" data-id=\"${item.ID}\" title=\"Editar\"><i class=\"fas fa-edit\"></i></button>
            <button type=\"button\" class=\"btn btn-outline-danger btn-delete\" data-id=\"${item.ID}\" title=\"Eliminar\"><i class=\"fas fa-trash\"></i></button>
        </div>
    `;
    const table = createDataTable(gastosComunes, columns, rowActions);
    tableCard.appendChild(table);
    setupGastosComunesActionButtons(gastosComunes);
}

function setupGastosComunesActionButtons(gastosComunes) {
    document.querySelectorAll("#gastos-comunes-table-container .btn-edit, #gastos-comunes-table-container .btn-delete").forEach(button => {
        button.addEventListener("click", (e) => {
            const buttonEl = e.currentTarget;
            const id = buttonEl.getAttribute("data-id");
            const gastoComun = gastosComunes.find(gc => gc.ID === id);
            if (gastoComun) {
                if (buttonEl.classList.contains("btn-edit")) showGastosComunesForm(gastoComun);
                if (buttonEl.classList.contains("btn-delete")) confirmDeleteGastosComunes(gastoComun);
            } else {
                showDetailedError("Error", new Error(`No se encontró el gasto común con ID: ${id}`));
            }
        });
    });
}

function showGastosComunesForm(gastoComun = null) {
    const fields = [
        { id: "periodo", label: "Período (MM/YYYY)", type: "text", required: true },
        { id: "monto_base", label: "Monto Base", type: "number", required: true },
        { id: "fecha_vencimiento", label: "Fecha de Vencimiento (DD/MM/YYYY)", type: "text", required: true },
        { id: "interes_imc", label: "Interés IMC (anual en %)", type: "number", required: true },
        { id: "multa_25_porciento", label: "Multa 25% (acumulada)", type: "number", required: true, disabled: true },
        { id: "total_adeudado", label: "Total Adeudado", type: "number", required: true, disabled: true },
        { id: "estado", label: "Estado", type: "select", options: [
            { value: "Pendiente", label: "Pendiente" },
            { value: "Pagado", label: "Pagado" },
            { value: "Moroso", label: "Moroso" }
        ], required: true }
    ];

    let values = { estado: "Pendiente", interes_imc: 0, multa_25_porciento: 0, total_adeudado: 0 };
    let isEditing = false;
    let editingGastoComun = null;

    if (gastoComun) {
        isEditing = true;
        editingGastoComun = gastoComun;
        values = {
            periodo: gastoComun["Periodo"] || "",
            monto_base: gastoComun["Monto_Base"] || 0,
            fecha_vencimiento: gastoComun["Fecha_Vencimiento"] || "",
            interes_imc: gastoComun["Interes_IMC"] || 0,
            multa_25_porciento: gastoComun["Multa_25_Porciento"] || 0,
            total_adeudado: gastoComun["Total_Adeudado"] || 0,
            estado: gastoComun["Estado"] || "Pendiente"
        };
    }

    const form = createForm(fields, values, async (formData) => {
        try {
            const submitButton = form.querySelector("button[type=\"submit\"]");
            submitButton.disabled = true;
            submitButton.innerHTML = "<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Guardando...";

            // Lógica de cálculo de morosidad, interés y multa
            const montoBase = parseFloat(formData.monto_base);
            const interesIMCAnual = parseFloat(formData.interes_imc);
            const fechaVencimiento = parseDate(formData.fecha_vencimiento);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día

            let estado = formData.estado;
            let multa25Porciento = 0;
            let interesCalculado = 0;
            let totalAdeudado = montoBase;

            if (estado !== "Pagado" && fechaVencimiento < hoy) {
                estado = "Moroso";
                // Calcular meses de atraso completos
                let mesesAtraso = 0;
                let tempDate = new Date(fechaVencimiento.getFullYear(), fechaVencimiento.getMonth() + 1, 11); // Desde el día 11 del mes siguiente al vencimiento
                while (tempDate <= hoy) {
                    mesesAtraso++;
                    tempDate.setMonth(tempDate.getMonth() + 1);
                }
                mesesAtraso = Math.max(0, mesesAtraso - 1); // No contar el mes actual si aún no se cumple el día 11

                // Calcular interés IMC mensual
                const interesMen            const submitButton = form.querySelector("button[type=\"submit\"]");
            submitButton.disabled = true;
            submitButton.innerHTML = "<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Guardando...";

            // Lógica de cálculo de morosidad, interés y multa
            const montoBase = parseFloat(formData.monto_base);
            const interesIMCAnual = parseFloat(formData.interes_imc);
            const fechaVencimiento = parseDate(formData.fecha_vencimiento);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día

            let estado = formData.estado;
            let multa25Porciento = 0;
            let interesCalculado = 0;
            let totalAdeudado = montoBase;

            if (estado !== "Pagado" && fechaVencimiento < hoy) {
                estado = "Moroso";
                // Calcular meses de atraso completos
                let mesesAtraso = 0;
                let tempDate = new Date(fechaVencimiento.getFullYear(), fechaVencimiento.getMonth(), fechaVencimiento.getDate());
                tempDate.setDate(11); // Considerar desde el día 11

                if (hoy > tempDate) {
                    mesesAtraso = (hoy.getFullYear() - tempDate.getFullYear()) * 12;
                    mesesAtraso -= tempDate.getMonth();
                    mesesAtraso += hoy.getMonth();
                    if (hoy.getDate() < 11) { // Si estamos antes del día 11 del mes actual, no contar este mes como completo
                        mesesAtraso--;
                    }
                }
                mesesAtraso = Math.max(0, mesesAtraso); // Asegurar que no sea negativo

                // Calcular interés IMC mensual
                const interesMensual = (interesIMCAnual / 12) / 100; // Convertir a decimal
                interesCalculado = montoBase * interesMensual * mesesAtraso;

                // Calcular multa del 25% por cada mes completo de atraso
                multa25Porciento = montoBase * 0.25 * mesesAtraso;

                totalAdeudado = montoBase + interesCalculado + multa25Porciento;
            }

            const rowData = [
                formData.periodo,
                montoBase,
                formData.fecha_vencimiento,
                interesIMCAnual, // Guardar el porcentaje anual ingresado
                multa25Porciento,
                totalAdeudado,
                estado
            ];

            if (isEditing && editingGastoComun && editingGastoComun.SHEET_ROW_INDEX) {
                // Actualizar fila existente
                await sheetsAPI.updateRow(window.CONFIG.SHEETS.GASTOS_COMUNES, editingGastoComun.SHEET_ROW_INDEX, rowData);
                showSuccessToast("Gasto común actualizado exitosamente");
            } else {
                // Crear nuevo gasto común
                await sheetsAPI.appendRow(window.CONFIG.SHEETS.GASTOS_COMUNES, rowData);
                showSuccessToast("Gasto común creado exitosamente");
            }

            const modal = bootstrap.Modal.getInstance(form.closest(".modal"));
            modal.hide();
            
            // Recargar los datos después de la operación
            await initGastosComunesModule(document.getElementById("module-container"));
        } catch (error) {
            console.error("❌ Error al guardar gasto común:", error);
            showDetailedError("Error al guardar gasto común", error);
            const submitButton = form.querySelector("button[type=\"submit\"]");
            submitButton.disabled = false;
            submitButton.textContent = "Guardar";
        }
    });

    const modal = createModal(
        isEditing ? "Editar Gasto Común" : "Nuevo Gasto Común",
        form,
        "lg"
    );
    modal.show();
}

function confirmDeleteGastosComunes(gastoComun) {
    const content = document.createElement("div");
    content.innerHTML = `
        <p>¿Está seguro de que desea eliminar el gasto común del período <strong>${gastoComun["Periodo"]}</strong>?</p>
        <p>Esta acción no se puede deshacer.</p>
    `;
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "d-flex justify-content-end mt-4";
    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary me-2";
    cancelButton.textContent = "Cancelar";
    cancelButton.setAttribute("data-bs-dismiss", "modal");
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger";
    deleteButton.innerHTML = "<i class=\"fas fa-trash\"></i> Eliminar";
    deleteButton.addEventListener("click", async () => {
        try {
            deleteButton.disabled = true;
            deleteButton.innerHTML = "<span class=\"spinner-border spinner-border-sm\" role=\"status\" aria-hidden=\"true\"></span> Eliminando...";
            
            // Eliminar la fila específica usando el índice correcto
            await sheetsAPI.deleteRow(window.CONFIG.SHEETS.GASTOS_COMUNES, gastoComun.SHEET_ROW_INDEX);
            
            const modal = bootstrap.Modal.getInstance(deleteButton.closest(".modal"));
            modal.hide();
            showSuccessToast("Gasto común eliminado exitosamente");
            
            // Recargar los datos después de la eliminación
            await initGastosComunesModule(document.getElementById("module-container"));
        } catch (error) {
            console.error("❌ Error al eliminar gasto común:", error);
            showDetailedError("Error al eliminar gasto común", error);
            deleteButton.disabled = false;
            deleteButton.innerHTML = "<i class=\"fas fa-trash\"></i> Eliminar";
        }
    });
    actionsDiv.appendChild(cancelButton);
    actionsDiv.appendChild(deleteButton);
    content.appendChild(actionsDiv);
    const modal = createModal("Confirmar Eliminación", content, "sm");
    modal.show();
}

// Función auxiliar para parsear fechas (DD/MM/YYYY)
function parseDate(dateString) {
    const parts = dateString.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

