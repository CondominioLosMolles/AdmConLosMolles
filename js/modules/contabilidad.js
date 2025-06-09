/**
 * CondoAdminLosMolles - Módulo de Contabilidad
 */

async function initContabilidadModule(container) {
    console.log("🚀 Inicializando módulo de Contabilidad...");
    container.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando datos contables...</p></div>`;

    try {
        const [pagos, gastos, residentes] = await Promise.all([
            sheetsAPI.getSheetData(CONFIG.SHEETS.PAGOS),
            sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS),
            sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES)
        ]);

        const allTransactions = [
            ...pagos.map((p, i) => ({ ...p, type: 'ingreso', SHEET_ROW_INDEX: i + 2, sheetName: CONFIG.SHEETS.PAGOS })),
            ...gastos.map((g, i) => ({ ...g, type: 'gasto', SHEET_ROW_INDEX: i + 2, sheetName: CONFIG.SHEETS.GASTOS }))
        ].sort((a, b) => {
            const dateA = new Date(a.Fecha.split('/').reverse().join('-'));
            const dateB = new Date(b.Fecha.split('/').reverse().join('-'));
            return dateB - dateA;
        });
        
        renderContabilidadUI(container, allTransactions, residentes);
        console.log("✅ Módulo de Contabilidad inicializado.");
    } catch (error) {
        console.error("❌ Error al inicializar Contabilidad:", error);
        showDetailedError("Error Crítico en Contabilidad", error, container);
    }
}

function renderContabilidadUI(container, data, residentes) {
    container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Contabilidad General</h2>
            <div class="btn-group">
                 <button id="add-pago" class="btn btn-success"><i class="fas fa-plus me-2"></i> Nuevo Ingreso</button>
                 <button id="add-gasto" class="btn btn-danger"><i class="fas fa-minus me-2"></i> Nuevo Gasto</button>
            </div>
        </div>
        <div id="contabilidad-table-container"></div>
    `;
    
    updateContabilidadTable(data, residentes);
    document.getElementById('add-pago').addEventListener('click', () => showTransactionForm('ingreso', residentes));
    document.getElementById('add-gasto').addEventListener('click', () => showTransactionForm('gasto', residentes));
}

function updateContabilidadTable(data, residentes) {
    const tableContainer = document.getElementById('contabilidad-table-container');

    const columns = [
        { field: 'Fecha', title: 'Fecha', width: '120px' },
        { field: 'type', title: 'Tipo', width: '100px', formatter: (value) => 
            value === 'ingreso' ? `<span class="badge bg-success">Ingreso</span>` : `<span class="badge bg-danger">Gasto</span>`
        },
        { field: 'Concepto', title: 'Concepto' },
        { field: 'Monto', title: 'Monto', width: '150px', formatter: (value, item) => 
            `<strong class="text-${item.type === 'ingreso' ? 'success' : 'danger'}">${formatCurrency(value)}</strong>`
        },
        { title: 'Origen/Destino', formatter: (value, item) => item.Residente || item.Proveedor || 'N/A' }
    ];

     const rowActions = (item) => `
        <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-danger btn-delete" data-id="${item.ID}" data-type="${item.type}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const table = createDataTable(data, columns, rowActions);
    const card = createCard("Historial de Transacciones", table);
    tableContainer.innerHTML = '';
    tableContainer.appendChild(card);
    setupContabilidadActionButtons(data, residentes);
}

function showTransactionForm(type, residentes = [], transaction = null) {
    const isIngreso = type === 'ingreso';
    const isEditing = !!transaction;
    let fields = [];

    if (isIngreso) {
        fields = [
            { id: 'fecha', label: 'Fecha del Pago', type: 'date', required: true },
            { id: 'residente', label: 'Residente', type: 'select', options: residentes.map(r => ({ value: r.Nombre, label: `${r.Nombre} (Parcela: ${r.Numero_Parcela})`})), required: true },
            { id: 'concepto', label: 'Concepto del Pago', type: 'text', required: true, placeholder: 'Ej: Gasto común Mayo' },
            { id: 'monto', label: 'Monto ($)', type: 'number', required: true },
            { id: 'metodo_pago', label: 'Método de Pago', type: 'select', options: [{value: 'Transferencia', label: 'Transferencia'}, {value: 'Efectivo', label: 'Efectivo'}], required: true }
        ];
    } else { // Gasto
        fields = [
            { id: 'fecha', label: 'Fecha del Gasto', type: 'date', required: true },
            { id: 'concepto', label: 'Concepto del Gasto', type: 'text', required: true, placeholder: 'Ej: Reparación bomba de agua' },
            { id: 'monto', label: 'Monto ($)', type: 'number', required: true },
            { id: 'proveedor', label: 'Proveedor', type: 'text', placeholder: 'Ej: Ferretería Central' },
            { id: 'categoria', label: 'Categoría', type: 'select', options: [{value: 'Mantención', label: 'Mantención'}, {value: 'Administrativo', label: 'Administrativo'}, {value: 'Servicios', label: 'Servicios Básicos'}, {value: 'Otro', label: 'Otro' }], required: true },
            { id: 'estado', label: 'Estado', type: 'select', options: [{value: 'Pagado', label: 'Pagado'}, {value: 'Pendiente', label: 'Pendiente'}], required: true }
        ];
    }
    
    const values = isEditing ? transaction : { fecha: new Date().toISOString().slice(0, 10), estado: 'Pagado' };

    const form = createForm(fields, values, async (formData) => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        try {
            const id = isEditing ? transaction.ID : generateUniqueId();
            const fecha = new Date(formData.fecha);
            const formattedDate = `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
            
            let rowData;
            let sheetName;

            if (isIngreso) {
                sheetName = CONFIG.SHEETS.PAGOS;
                rowData = [id, formattedDate, formData.residente, formData.concepto, formData.monto, formData.metodo_pago];
            } else {
                sheetName = CONFIG.SHEETS.GASTOS;
                rowData = [id, formattedDate, formData.concepto, formData.monto, formData.proveedor, formData.categoria, formData.estado];
            }

            if (isEditing) {
                await sheetsAPI.updateRow(sheetName, transaction.SHEET_ROW_INDEX, rowData);
            } else {
                 await sheetsAPI.appendRow(sheetName, rowData);
            }
            
            showToast(`Transacción de ${type} registrada exitosamente.`, 'success');
            modal.hide();
            await initContabilidadModule(document.getElementById('module-container'));

        } catch (error) {
            showDetailedError(`Error al registrar ${type}`, error);
        }
    });

    createModal(isIngreso ? 'Registrar Nuevo Ingreso' : 'Registrar Nuevo Gasto', form, 'lg').show();
}

function setupContabilidadActionButtons(data, residentes) {
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const type = e.currentTarget.getAttribute('data-type');
            const item = data.find(i => i.ID === id && i.type === type);
            if (!item) return;
            
            confirmTransactionDelete(item);
        });
    });
}

function confirmTransactionDelete(item) {
     createModal('Confirmar Eliminación', `¿Seguro que quieres eliminar la transacción: <strong>${item.Concepto}</strong> por un monto de <strong>${formatCurrency(item.Monto)}</strong>?`, 'md', [
        { label: 'Cancelar', className: 'btn-secondary', dismiss: true },
        { label: 'Eliminar', className: 'btn-danger', onClick: async (modal) => {
            try {
                await sheetsAPI.deleteRow(item.sheetName, item.SHEET_ROW_INDEX);
                showToast('Transacción eliminada.', 'success');
                modal.hide();
                await initContabilidadModule(document.getElementById('module-container'));
            } catch(error) {
                showDetailedError("Error al eliminar", error);
            }
        }}
    ]).show();
}
