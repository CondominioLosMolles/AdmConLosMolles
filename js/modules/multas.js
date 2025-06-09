/**
 * CondoAdmin - Módulo de Multas
 */

async function initMultasModule(container) {
    console.log("🚀 Inicializando módulo de Multas...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando Multas...</p></div>`;

    try {
        const [multas, residentes] = await Promise.all([
             sheetsAPI.getSheetData(CONFIG.SHEETS.MULTAS),
             sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES)
        ]);
        renderMultasUI(container, multas.map((m, index) => ({...m, SHEET_ROW_INDEX: index + 2 })), residentes);
        console.log("✅ Módulo de Multas inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Multas:", error);
        showDetailedError("Error Crítico en Multas", error, container);
    }
}

function renderMultasUI(container, data, residentes) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Registro de Multas</h2>
            <button id="add-multa" class="btn btn-primary shadow-sm"><i class="fas fa-exclamation-triangle me-2"></i> Nueva Multa</button>
        </div>
        <div id="multas-table-container"></div>
    `;

    updateMultasTable(data);
    document.getElementById('add-multa').addEventListener('click', () => showMultaForm(null, residentes));
}

function updateMultasTable(data) {
    const tableContainer = document.getElementById('multas-table-container');

    const columns = [
        { field: 'Fecha', title: 'Fecha' },
        { field: 'Residente', title: 'Residente' },
        { field: 'Motivo', title: 'Motivo de la Multa' },
        { field: 'Monto', title: 'Monto', formatter: formatCurrency },
        { field: 'Estado', title: 'Estado', formatter: (value) => 
            `<span class="badge ${value === 'Pagada' ? 'bg-success' : 'bg-danger'}">${value}</span>`
        }
    ];

    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary btn-edit" data-id="${item.ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline-danger btn-delete" data-id="${item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    const table = createDataTable(data, columns, rowActions);
    const card = createCard("Historial de Multas", table);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(card);
    setupMultasActionButtons(data, (document.getElementById('add-multa').__vueParentComponent.props.residentes));
}

function showMultaForm(multa = null, residentes) {
    const isEditing = !!multa;
    const fields = [
        { id: 'fecha', label: 'Fecha de la Infracción', type: 'date', required: true },
        { id: 'residente', label: 'Residente', type: 'select', options: residentes.map(r => ({ value: r.Nombre, label: `${r.Nombre} (Parcela: ${r.Numero_Parcela})`})), required: true, disabled: isEditing },
        { id: 'motivo', label: 'Motivo', type: 'textarea', rows: 3, required: true },
        { id: 'monto', label: 'Monto de la Multa ($)', type: 'number', required: true },
        { id: 'estado', label: 'Estado', type: 'select', options: [{value: 'Pendiente', label: 'Pendiente'}, {value: 'Pagada', label: 'Pagada'}], required: true }
    ];

    const values = isEditing ? {
        fecha: multa.Fecha ? new Date(multa.Fecha.split('/').reverse().join('-')).toISOString().slice(0,10) : '',
        residente: multa.Residente,
        motivo: multa.Motivo,
        monto: multa.Monto,
        estado: multa.Estado
    } : { fecha: new Date().toISOString().slice(0,10), estado: 'Pendiente' };

    const form = createForm(fields, values, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const id = isEditing ? multa.ID : generateUniqueId();
            const fecha = new Date(formData.fecha);
            const formattedDate = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            const rowData = [id, formattedDate, formData.residente, formData.motivo, formData.monto, formData.estado];
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.MULTAS, multa.SHEET_ROW_INDEX, rowData);
                showToast('Multa actualizada.', 'success');
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.MULTAS, rowData);
                showToast('Multa registrada.', 'success');
            }
            modal.hide();
            await initMultasModule(document.getElementById('module-container'));
        } catch (error) {
            showDetailedError("Error al guardar multa", error);
        }
    });

    createModal(isEditing ? 'Editar Multa' : 'Registrar Multa', form, 'lg').show();
}

function setupMultasActionButtons(data, residentes) {
    document.querySelectorAll('.btn-edit, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = data.find(m => m.ID === id);
            if (!item) return;

            if (e.currentTarget.classList.contains('btn-edit')) {
                showMultaForm(item, residentes);
            } else if (e.currentTarget.classList.contains('btn-delete')) {
                confirmMultaDelete(item);
            }
        });
    });
}

function confirmMultaDelete(item) {
    createModal('Confirmar Eliminación', `¿Seguro que quieres eliminar la multa de <strong>${item.Residente}</strong> por motivo de "${item.Motivo}"?`, 'md', [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.MULTAS, item.SHEET_ROW_INDEX);
                showToast('Multa eliminada.', 'success');
                modal.hide();
                await initMultasModule(document.getElementById('module-container'));
            } catch(error) {
                showDetailedError("Error al eliminar", error);
            }
        }}
    ]).show();
}
