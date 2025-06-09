/**
 * CondoAdmin - Módulo de Gastos Comunes
 */

async function initGastoscomunesModule(container) {
    console.log("🚀 Inicializando módulo de Gastos Comunes...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando Gastos Comunes...</p></div>`;

    try {
        const gastosComunes = await sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS_COMUNES);
        renderGastosComunesUI(container, gastosComunes.map((gc, index) => ({...gc, SHEET_ROW_INDEX: index + 2 })));
        console.log("✅ Módulo de Gastos Comunes inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Gastos Comunes:", error);
        showDetailedError("Error Crítico en Gastos Comunes", error, container);
    }
}

function renderGastosComunesUI(container, data) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión de Gastos Comunes</h2>
            <button id="add-gasto-comun" class="btn btn-primary shadow-sm"><i class="fas fa-plus me-2"></i> Nuevo Periodo de Gasto</button>
        </div>
        <div id="gastos-comunes-table-container"></div>
    `;

    updateGastosComunesTable(data);
    document.getElementById('add-gasto-comun').addEventListener('click', () => showGastoComunForm());
}

function updateGastosComunesTable(data) {
    const tableContainer = document.getElementById('gastos-comunes-table-container');

    const columns = [
        { field: 'Periodo', title: 'Período', formatter: (value) => `<i class="far fa-calendar-alt me-2"></i><strong>${value}</strong>` },
        { field: 'Monto_Base', title: 'Monto Base', formatter: formatCurrency },
        { field: 'Fondo_Reserva', title: 'Fondo de Reserva', formatter: formatCurrency },
        { field: 'Total_Unidad', title: 'Total por Unidad', formatter: formatCurrency },
        { field: 'Vencimiento', title: 'Fecha de Vencimiento' },
        { field: 'Estado', title: 'Estado', formatter: (value) => {
            const badgeClass = value === 'Pagado' ? 'bg-success' : (value === 'Pendiente' ? 'bg-warning text-dark' : 'bg-danger');
            return `<span class="badge <span class="math-inline">\{badgeClass\}"\></span>{value || 'No definido'}</span>`;
        }}
    ];

    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary btn-edit" data-id="<span class="math-inline">\{item\.ID\}" title\="Editar"\><i class\="fas fa\-edit"\></i\></button\>
<button class\="btn btn\-outline\-danger btn\-delete" data\-id\="</span>{item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const table = createDataTable(data, columns, rowActions);
    const card = createCard("", table);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(card);

    setupGastoComunActionButtons(data);
}

function showGastoComunForm(gastoComun = null) {
    const isEditing = !!gastoComun;
    const fields = [
        { id: 'periodo', label: 'Período', type: 'text', required: true, placeholder: 'Ej: Junio 2025' },
        { id: 'monto_base', label: 'Monto Base ($)', type: 'number', required: true },
        { id: 'fondo_reserva', label: 'Fondo de Reserva ($)', type: 'number', required: true },
        { id: 'total_unidad', label: 'Total por Unidad ($)', type: 'number', required: true },
        { id: 'vencimiento', label: 'Fecha de Vencimiento', type: 'date', required: true },
        { id: 'estado', label: 'Estado', type: 'select', options: [{value: 'Pendiente', label: 'Pendiente'}, {value: 'Pagado', label: 'Pagado'}, {value: 'Atrasado', label: 'Atrasado'}], required: true }
    ];

    const values = isEditing ? {
        periodo: gastoComun.Periodo,
        monto_base: gastoComun.Monto_Base,
        fondo_reserva: gastoComun.Fondo_Reserva,
        total_unidad: gastoComun.Total_Unidad,
        vencimiento: gastoComun.Vencimiento ? new Date(gastoComun.Vencimiento.split('/').reverse().join('-')).toISOString().slice(0,10) : '',
        estado: gastoComun.Estado
    } : { estado: 'Pendiente' };

    const form = createForm(fields, values, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const id = isEditing ? gastoComun.ID : generateUniqueId();
            const fechaVencimiento = new Date(formData.vencimiento);
            const formattedDate = `<span class="math-inline">\{fechaVencimiento\.getDate\(\)\.toString\(\)\.padStart\(2, '0'\)\}/</span>{(fechaVencimiento.getMonth() + 1).toString().padStart(2, '0')}/${fechaVencimiento.getFullYear()}`;

            const rowData = [id, formData.periodo, formData.monto_base, formData.fondo_reserva, formData.total_unidad, formattedDate, formData.estado];
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.GASTOS_COMUNES, gastoComun.SHEET_ROW_INDEX, rowData);
                showToast('Gasto común actualizado exitosamente.', 'success');
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.GASTOS_COMUNES, rowData);
                showToast('Nuevo período de gasto común creado.', 'success');
            }
            modal.hide();
            await initGastoscomunesModule(document.getElementById('module-container'));
        } catch (error) {
            showDetailedError("Error al guardar Gasto Común", error);
        }
    });

    createModal(isEditing ? 'Editar Gasto Común' : 'Nuevo Gasto Común', form, 'lg').show();
}

function setupGastoComunActionButtons(data)
