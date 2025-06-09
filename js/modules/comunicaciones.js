/**
 * CondoAdmin - Módulo de Comunicaciones
 */

async function initComunicacionesModule(container) {
    console.log("🚀 Inicializando módulo de Comunicaciones...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando Comunicaciones...</p></div>`;

    try {
        const [comunicaciones, residentes] = await Promise.all([
             sheetsAPI.getSheetData(CONFIG.SHEETS.COMUNICACIONES),
             sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES)
        ]);
        renderComunicacionesUI(container, comunicaciones.map((c, index) => ({...c, SHEET_ROW_INDEX: index + 2 })), residentes);
        console.log("✅ Módulo de Comunicaciones inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Comunicaciones:", error);
        showDetailedError("Error Crítico en Comunicaciones", error, container);
    }
}

function renderComunicacionesUI(container, data, residentes) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Comunicaciones y Anuncios</h2>
            <button id="add-comunicacion" class="btn btn-primary shadow-sm"><i class="fas fa-bullhorn me-2"></i> Nuevo Anuncio</button>
        </div>
        <div id="comunicaciones-table-container"></div>
    `;

    updateComunicacionesTable(data);
    document.getElementById('add-comunicacion').addEventListener('click', () => showComunicacionForm(null, residentes));
}

function updateComunicacionesTable(data) {
    const tableContainer = document.getElementById('comunicaciones-table-container');

    const columns = [
        { field: 'Fecha', title: 'Fecha', width: '150px' },
        { field: 'Asunto', title: 'Asunto' },
        { field: 'Destinatarios', title: 'Destinatarios' },
        { field: 'Estado', title: 'Estado', width: '120px', formatter: (value) => 
            `<span class="badge ${value === 'Enviado' ? 'bg-success' : 'bg-secondary'}">${value}</span>`
        }
    ];

    const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary btn-view" data-id="${item.ID}" title="Ver Contenido"><i class="fas fa-eye"></i></button>
            <button class="btn btn-outline-danger btn-delete" data-id="${item.ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const table = createDataTable(data, columns, rowActions);
    const card = createCard("Historial de Comunicaciones", table);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(card);
    setupComunicacionesActionButtons(data);
}

function showComunicacionForm(comunicacion = null, residentes) {
    const fields = [
        { id: 'asunto', label: 'Asunto', type: 'text', required: true },
        { id: 'destinatarios', label: 'Destinatarios', type: 'select', options: [
            { value: 'Todos', label: 'Todos los Residentes' },
            ...residentes.map(r => ({ value: r.Email, label: r.Nombre }))
        ], required: true },
        { id: 'contenido', label: 'Contenido del Mensaje', type: 'textarea', rows: 8, required: true },
    ];

    const form = createForm(fields, {}, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const id = generateUniqueId();
            const fecha = new Date();
            const formattedDate = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            const rowData = [id, formattedDate, formData.asunto, formData.contenido, formData.destinatarios, 'Enviado'];
            
            await sheetsAPI.appendRow(CONFIG.SHEETS.COMUNICACIONES, rowData);
            showToast('Comunicación registrada exitosamente.', 'success');
            
            modal.hide();
            await initComunicacionesModule(document.getElementById('module-container'));
        } catch (error) {
            showDetailedError("Error al guardar comunicación", error);
        }
    });

    createModal('Nueva Comunicación', form, 'lg').show();
}

function showComunicacionContent(item) {
    const content = `
        <h5>Asunto: ${item.Asunto}</h5>
        <p class="text-muted"><strong>Fecha:</strong> ${item.Fecha} | <strong>Destinatarios:</strong> ${item.Destinatarios}</p>
        <hr>
        <div style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${item.Contenido}</div>
    `;
    createModal("Detalle de la Comunicación", content, 'lg', [{label: 'Cerrar', className: 'btn-secondary', dismiss: true}]).show();
}

function setupComunicacionesActionButtons(data) {
    document.querySelectorAll('.btn-view, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const item = data.find(c => c.ID === id);
            if (!item) return;

            if (e.currentTarget.classList.contains('btn-view')) {
                showComunicacionContent(item);
            } else if (e.currentTarget.classList.contains('btn-delete')) {
                confirmComunicacionDelete(item);
            }
        });
    });
}

function confirmComunicacionDelete(item) {
    createModal('Confirmar Eliminación', `¿Seguro que quieres eliminar la comunicación con asunto: <strong>${item.Asunto}</strong>?`, 'md', [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.COMUNICACIONES, item.SHEET_ROW_INDEX);
                showToast('Comunicación eliminada.', 'success');
                modal.hide();
                await initComunicacionesModule(document.getElementById('module-container'));
            } catch(error) {
                showDetailedError("Error al eliminar", error);
            }
        }}
    ]).show();
}
