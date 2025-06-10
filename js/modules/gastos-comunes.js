/**
 * Módulo de Gastos Comunes (Versión final y funcional)
 */

async function initGastoscomunesModule(container) {
    console.log("🚀 Inicializando módulo de Gastos Comunes...");
    try {
        container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;

        const [data, headers] = await Promise.all([
            sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS_COMUNES),
            sheetsAPI.getSheetHeaders(CONFIG.SHEETS.GASTOS_COMUNES)
        ]);

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

    if (gastosComunes.length === 0) {
        tableContainer.innerHTML = `<div class="alert alert-info">No hay gastos comunes registrados. Haz clic en "Nuevo Gasto Común" para agregar el primero.</div>`;
        return;
    }

    const columns = (Array.isArray(headers) ? headers : []).map(header => {
        if (header === "ID") return null;
        const columnDef = { field: header, title: header.replace(/_/g, ' ') };
        if (["Monto_Base", "Total_Adeudado", "Multa_25_Porciento"].includes(header)) {
            columnDef.formatter = formatCurrency;
        }
        if (header === "Estado") {
            columnDef.formatter = (value) => {
                const classMap = { "Pagado": "bg-success", "Pendiente": "bg-info", "Moroso": "bg-danger" };
                return `<span class="badge ${classMap[value] || 'bg-secondary'}">${value || "N/A"}</span>`;
            };
        }
        return columnDef;
    }).filter(Boolean);
    
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-secondary btn-edit" data-id="${item.ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-id="${item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const table = createDataTable(gastosComunes, columns, rowActions);
    const card = createCard("Historial de Gastos Comunes", table);
    tableContainer.innerHTML = "";
    tableContainer.appendChild(card);
    setupActionButtons(gastosComunes, headers, tableContainer);
}

function showGastosComunesForm(gastoComun = null, headers) {
    const isEditing = !!gastoComun;
    const fields = [
        { id: "Periodo", label: "Período (Ej: 06/2025)", type: "text", required: true },
        { id: "Monto_Base", label: "Monto Base", type: "number", required: true },
        { id: "Fecha_Vencimiento", label: "Fecha de Vencimiento (DD/MM/YYYY)", type: "text", required: true, placeholder: "ej: 10/07/2025" },
        { id: "Interes_IMC", label: "Interés Máximo Convencional (%)", type: "number", required: true },
        { id: "Estado", label: "Estado", type: "select", options: [
            { value: "Pendiente", label: "Pendiente" }, { value: "Pagado", label: "Pagado" }
        ], required: true }
    ];

    const values = isEditing ? gastoComun : { Estado: "Pendiente", Interes_IMC: 1.5 };

    const form = createForm(fields, values, async (formData) => {
        try {
            const montoBase = parseFloat(formData.Monto_Base);
            const interesAnual = parseFloat(formData.Interes_IMC);
            const fechaVencimiento = parseDate(formData.Fecha_Vencimiento);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            let estadoFinal = formData.Estado;
            let multaCalculada = 0;
            let interesCalculado = 0;
            
            if (estadoFinal !== "Pagado" && hoy > fechaVencimiento) {
                estadoFinal = "Moroso";
                const interesMensual = (interesAnual / 12) / 100;
                let mesesAtraso = (hoy.getFullYear() - fechaVencimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaVencimiento.getMonth());
                if (hoy.getDate() <= fechaVencimiento.getDate()) mesesAtraso--;
                mesesAtraso = Math.max(0, mesesAtraso);

                if (mesesAtraso > 0) {
                    interesCalculado = montoBase * interesMensual * mesesAtraso;
                    multaCalculada = montoBase * 0.25;
                }
            }
            const totalAdeudado = montoBase + interesCalculado + multaCalculada;

            const dataMap = {
                ID: isEditing ? gastoComun.ID : generateUniqueId(),
                Periodo: formData.Periodo,
                Monto_Base: montoBase,
                Fecha_Vencimiento: formData.Fecha_Vencimiento,
                Interes_IMC: interesAnual,
                Multa_25_Porciento: Math.round(multaCalculada),
                Total_Adeudado: Math.round(totalAdeudado),
                Estado: estadoFinal
            };

            const rowData = headers.map(header => dataMap[header] !== undefined ? dataMap[header] : "");
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.GASTOS_COMUNES, gastoComun.SHEET_ROW_INDEX, rowData);
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.GASTOS_COMUNES, rowData);
            }

            showToast("Gasto común guardado exitosamente", "success");
            bootstrap.Modal.getInstance(form.closest('.modal')).hide();
            await initGastoscomunesModule(document.getElementById("module-container"));
        } catch (error) {
            showDetailedError("Error al guardar gasto común", error);
        }
    });

    createModal(isEditing ? "Editar Gasto Común" : "Nuevo Gasto Común", form, "lg").show();
}

function setupActionButtons(data, headers, context) {
    context.querySelectorAll(".btn-edit, .btn-delete").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const item = data.find(gc => gc.ID === id);
            if (!item) return;
            if (e.currentTarget.classList.contains("btn-edit")) showGastosComunesForm(item, headers);
            else if (e.currentTarget.classList.contains("btn-delete")) confirmDelete(item);
        });
    });
}

function confirmDelete(item) {
    createModal('Confirmar Eliminación', `¿Seguro que quieres eliminar el período <strong>${item.Periodo}</strong>?`, 'md', [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.GASTOS_COMUNES, item.SHEET_ROW_INDEX);
                showToast('Período eliminado.', 'success');
                modal.hide();
                initGastoscomunesModule(document.getElementById('module-container'));
            } catch(error) {
                showDetailedError("Error al eliminar", error);
            }
        }}
    ]).show();
}

function parseDate(dateString) {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('/');
    return new Date(parts[2], parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
}
