/**
 * Módulo de Gastos Comunes (Versión Corregida y Estabilizada)
 */

// Se definen las columnas que el código espera. Tu hoja debe tener este orden.
const GASTOS_COMUNES_HEADERS = ["ID", "Periodo", "Monto_Base", "Fecha_Vencimiento", "Interes_IMC", "Multa_25_Porciento", "Total_Adeudado", "Estado"];

async function initGastoscomunesModule(container) {
    console.log("🚀 Inicializando módulo de Gastos Comunes...");
    try {
        container.innerHTML = `<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;

        // Se leen los datos de la hoja
        const rawData = await sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS_COMUNES);
        
        // --- INICIO DE LA CORRECCIÓN #1: Evitar el error 'map' ---
        // Se asegura que 'gastosComunes' sea siempre una lista, aunque venga vacía o con error.
        const gastosComunes = (Array.isArray(rawData) ? rawData : []).map((row, index) => {
            row.SHEET_ROW_INDEX = index + 2; // Fila real para poder editar/borrar después
            return row;
        });
        // --- FIN DE LA CORRECCIÓN #1 ---

        renderGastosComunesUI(container, gastosComunes);
        console.log("✅ Módulo de Gastos Comunes inicializado correctamente");
    } catch (error) {
        console.error("❌ Error al inicializar módulo de Gastos Comunes:", error);
        showDetailedError("Error al inicializar el módulo de Gastos Comunes", error, container);
    }
}

function renderGastosComunesUI(container, data) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gastos Comunes</h2>
            <button id="add-gasto-comun" class="btn btn-primary"><i class="fas fa-plus"></i> Nuevo Gasto Común</button>
        </div>
        <div id="gastos-comunes-table-container"></div>
    `;
    
    document.getElementById('add-gasto-comun').addEventListener('click', () => showGastosComunesForm());
    updateGastosComunesTable(data);
}

function updateGastosComunesTable(gastosComunes) {
    const tableContainer = document.getElementById("gastos-comunes-table-container");
    const formatCurrency = (val) => CONFIG.APP.CURRENCY + Number(val || 0).toLocaleString('es-CL');

    const columns = [
        { field: "Periodo", title: "Período" },
        { field: "Monto_Base", title: "Monto Base", formatter: formatCurrency },
        { field: "Fecha_Vencimiento", title: "Vencimiento" },
        { field: "Total_Adeudado", title: "Total Adeudado", formatter: formatCurrency },
        { field: "Estado", title: "Estado", formatter: (value) => {
            const classMap = { "Pagado": "bg-success", "Pendiente": "bg-info", "Moroso": "bg-danger" };
            return `<span class="badge ${classMap[value] || 'bg-secondary'}">${value || "N/A"}</span>`;
        }}
    ];

    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-secondary btn-edit" data-id="${item.ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-id="${item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const table = createDataTable(gastosComunes, columns, rowActions);
    const card = createCard("Listado de Gastos Comunes", table);
    tableContainer.innerHTML = "";
    tableContainer.appendChild(card);
    setupActionButtons(gastosComunes);
}

function showGastosComunesForm(gastoComun = null) {
    const isEditing = !!gastoComun;
    const fields = [
        { id: "periodo", label: "Período (Ej: 06/2025)", type: "text", required: true },
        { id: "monto_base", label: "Monto Base", type: "number", required: true },
        { id: "fecha_vencimiento", label: "Fecha de Vencimiento (DD/MM/YYYY)", type: "text", required: true, placeholder: "ej: 10/06/2025" },
        { id: "interes_imc", label: "Interés Máximo Convencional (%)", type: "number", required: true, value: "1.5" },
        { id: "estado", label: "Estado", type: "select", options: [
            { value: "Pendiente", label: "Pendiente" }, { value: "Pagado", label: "Pagado" }
        ], required: true }
    ];

    const values = isEditing ? {
        periodo: gastoComun["Periodo"] || "",
        monto_base: gastoComun["Monto_Base"] || 0,
        fecha_vencimiento: gastoComun["Fecha_Vencimiento"] || "",
        interes_imc: gastoComun["Interes_IMC"] || 1.5,
        estado: gastoComun["Estado"] || "Pendiente"
    } : { estado: "Pendiente", interes_imc: 1.5 };

    const form = createForm(fields, values, async (formData) => {
        try {
            const montoBase = parseFloat(formData.monto_base);
            const interesAnual = parseFloat(formData.interes_imc);
            const fechaVencimiento = parseDate(formData.fecha_vencimiento);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            let estadoFinal = formData.estado;
            let multaCalculada = 0;
            let interesCalculado = 0;
            
            if (estadoFinal !== "Pagado" && hoy > fechaVencimiento) {
                estadoFinal = "Moroso";
                const interesMensual = (interesAnual / 12) / 100;
                
                // Cálculo de meses de atraso
                let mesesAtraso = (hoy.getFullYear() - fechaVencimiento.getFullYear()) * 12 + (hoy.getMonth() - fechaVencimiento.getMonth());
                if (hoy.getDate() <= fechaVencimiento.getDate()) {
                    mesesAtraso--;
                }
                mesesAtraso = Math.max(0, mesesAtraso);

                if (mesesAtraso > 0) {
                    interesCalculado = montoBase * interesMensual * mesesAtraso;
                    multaCalculada = montoBase * 0.25; // La multa del 25% se aplica una vez al primer mes de atraso.
                }
            }
            
            const totalAdeudado = montoBase + interesCalculado + multaCalculada;

            // --- INICIO DE LA CORRECCIÓN #2: Guardado de datos ordenado ---
            // Se crea la fila de datos respetando el orden de las columnas, incluyendo un ID.
            const rowData = [
                isEditing ? gastoComun.ID : generateUniqueId(), // ID
                formData.periodo,
                montoBase,
                formData.fecha_vencimiento,
                interesAnual,
                multaCalculada.toFixed(0),
                totalAdeudado.toFixed(0),
                estadoFinal
            ];
            // --- FIN DE LA CORRECCIÓN #2 ---
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.GASTOS_COMUNES, gastoComun.SHEET_ROW_INDEX, rowData);
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.GASTOS_COMUNES, rowData);
            }

            showToast("Gasto común guardado exitosamente", "success");
            bootstrap.Modal.getInstance(form.closest(".modal")).hide();
            await initGastoscomunesModule(document.getElementById("module-container"));

        } catch (error) {
            showDetailedError("Error al guardar gasto común", error);
        }
    });

    createModal(isEditing ? "Editar Gasto Común" : "Nuevo Gasto Común", form, "lg").show();
}

function setupActionButtons(data) {
    document.querySelectorAll("#gastos-comunes-table-container .btn-edit, #gastos-comunes-table-container .btn-delete").forEach(button => {
        button.addEventListener("click", (e) => {
            const id = e.currentTarget.getAttribute("data-id");
            const item = data.find(gc => gc.ID === id);
            if (!item) return;
            if (e.currentTarget.classList.contains("btn-edit")) showGastosComunesForm(item);
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
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return new Date();
    const parts = dateString.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
}
