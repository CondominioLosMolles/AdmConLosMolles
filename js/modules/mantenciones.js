/**
 * CondoAdmin - Módulo de Mantenciones
 */

async function initMantencionesModule(container) {
    console.log("🚀 Inicializando módulo de Mantenciones...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando Mantenciones...</p></div>`;

    try {
        const mantenciones = await sheetsAPI.getSheetData(CONFIG.SHEETS.MANTENCIONES);
        renderMantencionesUI(container, mantenciones.map((m, index) => ({...m, SHEET_ROW_INDEX: index + 2 })));
        console.log("✅ Módulo de Mantenciones inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Mantenciones:", error);
        showDetailedError("Error Crítico en Mantenciones", error, container);
    }
}

function renderMantencionesUI(container, data) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Registro de Mantenciones</h2>
            <button id="add-mantencion" class="btn btn-primary shadow-sm"><i class="fas fa-plus me-2"></i> Nueva Tarea de Mantención</button>
        </div>
        <div id="mantenciones-table-container"></div>
    `;

    updateMantencionesTable(data);
    document.getElementById('add-mantencion').addEventListener('click', () => showMantencionForm());
}

function updateMantencionesTable(data) {
    const tableContainer = document.getElementById('mantenciones-table-container');

    const columns = [
        { field: 'Fecha', title: 'Fecha de Registro' },
        { field: 'Tipo', title: 'Tipo de Mantención' },
        { field: 'Descripcion', title: 'Descripción de la Tarea' },
        { field: 'Responsable', title: 'Responsable' },
        { field: 'Estado', title: 'Estado', formatter: (value) => {
            let badgeClass = 'bg-secondary';
            if (value === 'Completada') badgeClass = 'bg-success';
            if (value === 'Pendiente') badgeClass = 'bg-warning text-dark';
            if (value === 'Urgente') badgeClass = 'bg-danger';
            if (value === 'En Progreso') badgeClass = 'bg-info';
            return `<span class="badge ${badgeClass}">${value || 'No definido'}</span>`;
        }}
    ];

    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary btn-edit" data-id="${item.ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline-danger btn-delete" data-id="${item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const table = createDataTable(data, columns, rowActions);
    const card = createCard("", table);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(card);

    setupMantencionesActionButtons(data);
}

function showMantencionForm(mantencion = null) {
    const isEditing = !!mantencion;
    const fields = [
        { id: 'fecha', label: 'Fecha de Registro', type: 'date', required: true },
        { id: 'tipo', label: 'Tipo', type: 'text', required: true, placeholder: 'Ej: Eléctrica, Jardinería, Plomería' },
        { id: 'descripcion', label: 'Descripción Detallada', type: 'textarea', rows: 4, required: true },
        { id: 'responsable', label: 'Responsable de la Tarea', type: 'text', placeholder: 'Ej: Juan González, Empresa Externa' },
        { id: 'estado', label: 'Estado', type: 'select', options: [
            {value: 'Pendiente', label: 'Pendiente'}, 
            {value: 'En Progreso', label: 'En Progreso'},
            {value: 'Completada', label: 'Completada'},
            {value: 'Urgente', label: 'Urgente'}
        ], required: true }
    ];

    const values = isEditing ? {
        fecha: mantencion.Fecha ? new Date(mantencion.Fecha.split('/').reverse().join('-')).toISOString().slice(0,10) : '',
        tipo: mantencion.Tipo,
        descripcion: mantencion.Descripcion,
        responsable: mantencion.Responsable,
        estado: mantencion.Estado
    } : { fecha: new Date().toISOString().slice(0,10), estado: 'Pendiente' };

    const form = createForm(fields, values, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const id = isEditing ? mantencion.ID : generateUniqueId();
            const fecha = new Date(formData.fecha);
            const formattedDate = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;

            const rowData = [id, formattedDate, formData.tipo, formData.descripcion, formData.responsable, formData.estado];
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.MANTENCIONES, mantencion.SHEET_ROW_INDEX, rowData);
                showToast('Mantención actualizada.', 'success');
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.MANTENCIONES, rowData);
                showToast('Nueva mantención registrada.', 'success');
            }
            modal.hide();
            await initMantencionesModule(document.getElementById('module-container'));
        } catch (error) {
            showDetailedError("Error al guardar mantención", error);
        }
    });

    createModal(isEditing ? 'Editar Mantención' : 'Nueva Mantención', form, 'lg').show();
}

function setupMantencionesActionButtons(data) {
    document.querySelectorAll('.btn-edit, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = data.find(m => m.ID === id);
            if (!item) return;

            if (e.currentTarget.classList.contains('btn-edit')) {
                showMantencionForm(item);
            } else if (e.currentTarget.classList.contains('btn-delete')) {
                confirmMantencionDelete(item);
            }
        });
    });
}

function confirmMantencionDelete(item) {
    createModal('Confirmar Eliminación', `¿Seguro que quieres eliminar la tarea de mantención: <strong>${item.Descripcion}</strong>?`, 'md', [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.MANTENCIONES, item.SHEET_ROW_INDEX);
                showToast('Tarea eliminada.', 'success');
                modal.hide();
                await initMantencionesModule(document.getElementById('module-container'));
            } catch(error) {
                showDetailedError("Error al eliminar", error);
            }
        }}
    ]).show();
}
