/**
 * CondoAdmin - Módulo de Asambleas
 */

async function initAsambleasModule(container) {
    console.log("🚀 Inicializando módulo de Asambleas...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando Asambleas...</p></div>`;

    try {
        const asambleas = await sheetsAPI.getSheetData(CONFIG.SHEETS.ASAMBLEAS);
        renderAsambleasUI(container, asambleas.map((a, index) => ({...a, SHEET_ROW_INDEX: index + 2 })));
        console.log("✅ Módulo de Asambleas inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Asambleas:", error);
        showDetailedError("Error Crítico en Asambleas", error, container);
    }
}

function renderAsambleasUI(container, data) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestión de Asambleas</h2>
            <button id="add-asamblea" class="btn btn-primary shadow-sm"><i class="fas fa-users-cog me-2"></i> Programar Asamblea</button>
        </div>
        <div id="asambleas-table-container"></div>
    `;

    updateAsambleasTable(data);
    document.getElementById('add-asamblea').addEventListener('click', () => showAsambleaForm());
}

function updateAsambleasTable(data) {
    const tableContainer = document.getElementById('asambleas-table-container');

    const columns = [
        { field: 'Fecha', title: 'Fecha' },
        { field: 'Tipo', title: 'Tipo' },
        { field: 'Descripcion', title: 'Tema Principal / Tabla' },
        { field: 'Estado', title: 'Estado', formatter: (value) => {
            let badgeClass = 'bg-secondary';
            if (value === 'Realizada') badgeClass = 'bg-success';
            if (value === 'Programada') badgeClass = 'bg-info';
            if (value === 'Cancelada') badgeClass = 'bg-danger';
            return `<span class="badge ${badgeClass}">${value}</span>`;
        }}
    ];

    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-view" data-id="${item.ID}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            <button class="btn btn-outline-secondary btn-edit" data-id="${item.ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button class="btn btn-outline-danger btn-delete" data-id="${item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    const table = createDataTable(data, columns, rowActions);
    const card = createCard("Historial de Asambleas", table);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(card);
    setupAsambleasActionButtons(data);
}

function showAsambleaForm(asamblea = null) {
    const isEditing = !!asamblea;
    const fields = [
        { id: 'fecha', label: 'Fecha de la Asamblea', type: 'date', required: true },
        { id: 'tipo', label: 'Tipo de Asamblea', type: 'select', options: [{value: 'Ordinaria', label: 'Ordinaria'}, {value: 'Extraordinaria', label: 'Extraordinaria'}], required: true },
        { id: 'descripcion', label: 'Descripción / Tabla de Puntos', type: 'textarea', rows: 5, required: true },
        { id: 'asistentes', label: 'Asistentes (Opcional, registrar post-asamblea)', type: 'textarea', rows: 3 },
        { id: 'estado', label: 'Estado', type: 'select', options: [{value: 'Programada', label: 'Programada'}, {value: 'Realizada', label: 'Realizada'}, {value: 'Cancelada', label: 'Cancelada'}], required: true }
    ];

    const values = isEditing ? {
        fecha: asamblea.Fecha ? new Date(asamblea.Fecha.split('/').reverse().join('-')).toISOString().slice(0,10) : '',
        tipo: asamblea.Tipo,
        descripcion: asamblea.Descripcion,
        asistentes: asamblea.Asistentes,
        estado: asamblea.Estado
    } : { fecha: new Date().toISOString().slice(0,10), estado: 'Programada', tipo: 'Ordinaria' };

    const form = createForm(fields, values, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const id = isEditing ? asamblea.ID : generateUniqueId();
            const fecha = new Date(formData.fecha);
            const formattedDate = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            const rowData = [id, formattedDate, formData.tipo, formData.descripcion, formData.asistentes, formData.estado];
            
            if (isEditing) {
                await sheetsAPI.updateRow(CONFIG.SHEETS.ASAMBLEAS, asamblea.SHEET_ROW_INDEX, rowData);
                showToast('Asamblea actualizada.', 'success');
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.ASAMBLEAS, rowData);
                showToast('Asamblea programada.', 'success');
            }
            modal.hide();
            await initAsambleasModule(document.getElementById('module-container'));
        } catch (error) {
            showDetailedError("Error al guardar asamblea", error);
        }
    });

    createModal(isEditing ? 'Editar Asamblea' : 'Programar Asamblea', form, 'lg').show();
}

function showAsambleaContent(item) {
    const content = `<h5>${item.Tipo} - ${item.Fecha}</h5><hr><h6>Puntos a tratar:</h6><div style="white-space: pre-wrap;">${item.Descripcion}</div><hr><h6>Asistentes:</h6><div style="white-space: pre-wrap;">${item.Asistentes || 'No registrados.'}</div>`;
    createModal('Detalle de Asamblea', content, 'lg', [{label: 'Cerrar', className: 'btn-secondary', dismiss: true}]).show();
}


function setupAsambleasActionButtons(data) {
    document.querySelectorAll('.btn-view, .btn-edit, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = data.find(a => a.ID === id);
            if (!item) return;

            if (e.currentTarget.classList.contains('btn-view')) {
                showAsambleaContent(item);
            } else if (e.currentTarget.classList.contains('btn-edit')) {
                showAsambleaForm(item);
            } else if (e.currentTarget.classList.contains('btn-delete')) {
                confirmAsambleaDelete(item);
            }
        });
    });
}

function confirmAsambleaDelete(item) {
    createModal('Confirmar Eliminación', `¿Seguro que quieres eliminar la asamblea del <strong>${item.Fecha}</strong>?`, 'md', [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.ASAMBLEAS, item.SHEET_ROW_INDEX);
                showToast('Asamblea eliminada.', 'success');
                modal.hide();
                await initAsambleasModule(document.getElementById('module-container'));
            } catch(error) {
                showDetailedError("Error al eliminar", error);
            }
        }}
    ]).show();
}
