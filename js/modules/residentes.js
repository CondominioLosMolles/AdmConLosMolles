// Módulo de Residentes - Versión Corregida

let originalResidentesData = [];

async function initResidentesModule(container) {
    console.log('🚀 Inicializando módulo de residentes...');
    try {
        if (typeof sheetsAPI === 'undefined') throw new Error('sheetsAPI no está disponible');
        if (typeof CONFIG === 'undefined' || !CONFIG.SHEETS || !CONFIG.SHEETS.RESIDENTES) {
            throw new Error('CONFIG.SHEETS.RESIDENTES no está definido');
        }

        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;

        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);

        originalResidentesData = residentes.map((residente, index) => {
            const cleanResidente = {};
            Object.keys(residente).forEach(key => {
                if (residente[key] !== undefined && residente[key] !== null) {
                    cleanResidente[key] = residente[key];
                }
            });

            // Usar el RUT como identificador único
            const rut = cleanResidente['Rut'] || cleanResidente['RUT'];
            cleanResidente.RUT_UNIQUE_ID = rut;
            cleanResidente.SHEET_ROW_INDEX = index + 2; // Fila real en Google Sheets (considerando encabezados)

            return cleanResidente;
        });

        const content = document.createElement('div');
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center mb-4';
        const title = document.createElement('h2');
        title.textContent = 'Residentes';
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.innerHTML = '<i class="fas fa-plus"></i> Nuevo Residente';
        addButton.addEventListener('click', () => showResidenteForm());
        header.appendChild(title);
        header.appendChild(addButton);
        content.appendChild(header);

        const toolbarRow = document.createElement('div');
        toolbarRow.className = 'row mb-4';

        const searchCol = document.createElement('div');
        searchCol.className = 'col-md-6';
        const searchInputGroup = document.createElement('div');
        searchInputGroup.className = 'input-group';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control';
        searchInput.placeholder = 'Buscar por nombre, RUT, parcela, etc...';
        searchInput.id = 'search-residente';
        const searchButton = document.createElement('button');
        searchButton.className = 'btn btn-outline-secondary';
        searchButton.innerHTML = '<i class="fas fa-search"></i>';
        searchButton.addEventListener('click', () => filterResidentes());
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filterResidentes();
        });
        searchInputGroup.appendChild(searchInput);
        searchInputGroup.appendChild(searchButton);
        searchCol.appendChild(searchInputGroup);
        toolbarRow.appendChild(searchCol);

        const filterCol = document.createElement('div');
        filterCol.className = 'col-md-6 d-flex justify-content-end';
        const exportButton = document.createElement('button');
        exportButton.className = 'btn btn-outline-secondary ms-2';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Exportar';
        exportButton.addEventListener('click', () => exportResidentes(originalResidentesData));
        filterCol.appendChild(exportButton);
        toolbarRow.appendChild(filterCol);

        content.appendChild(toolbarRow);

        const tableContainer = document.createElement('div');
        tableContainer.className = 'card';
        tableContainer.id = 'residentes-table-container';
        const tableCard = document.createElement('div');
        tableCard.className = 'card-body';
        tableContainer.appendChild(tableCard);
        content.appendChild(tableContainer);

        container.innerHTML = '';
        container.appendChild(content);

        updateResidentesTable(originalResidentesData);
        console.log('✅ Módulo de residentes inicializado correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar módulo de residentes:', error);
        showDetailedError('Error al inicializar el módulo de Residentes', error);
    }
}

function showResidenteForm(residente = null) {
    const fields = [
        { id: 'nombre', label: 'Nombre Completo', type: 'text', required: true },
        { id: 'rut', label: 'RUT (con guion y dígito verificador)', type: 'text', required: true, disabled: !!residente },
        { id: 'direccion', label: 'Dirección', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'telefono', label: 'Teléfono', type: 'tel' },
        { id: 'numero_parcela', label: 'Número de Parcela', type: 'text', required: true },
        { id: 'estado', label: 'Estado', type: 'select', options: [
            { value: 'Activo', label: 'Activo' },
            { value: 'Inactivo', label: 'Inactivo' },
            { value: 'Moroso', label: 'Moroso' }
        ], required: true },
        { id: 'valor_gasto_comun', label: 'Valor Gasto Común', type: 'number', required: true, placeholder: 'Ej: 30000' }
    ];

    let values = { estado: 'Activo', valor_gasto_comun: '0' };
    let isEditing = false;
    let editingResidente = null;

    if (residente) {
        isEditing = true;
        editingResidente = residente;
        values = {
            nombre: residente['Nombre'] || '',
            rut: residente['Rut'] || residente['RUT'] || '',
            direccion: residente['Direccion'] || '',
            email: residente['Email'] || '',
            telefono: residente['Telefono'] || '',
            numero_parcela: residente['Numero_Parcela'] || residente['Numero Parcela'] || '',
            estado: residente['Estado'] || 'Activo',
            valor_gasto_comun: residente['Valor_Gasto_Comun'] || residente['Valor Gasto Comun'] || '0'
        };
    }

    const form = createForm(fields, values, async (formData) => {
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

            const valorGastoComunNumerico = Number(formData.valor_gasto_comun) || 0;

            const rowData = [
                formData.nombre,
                formData.rut,
                formData.direccion,
                formData.email || '',
                formData.telefono || '',
                formData.numero_parcela,
                formData.estado,
                valorGastoComunNumerico
            ];

            if (isEditing && editingResidente && editingResidente.SHEET_ROW_INDEX) {
                // Actualizar fila existente
                await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, editingResidente.SHEET_ROW_INDEX, rowData);
                showSuccessToast('Residente actualizado exitosamente');
            } else {
                // Verificar que el RUT no exista antes de crear
                const rutExists = originalResidentesData.some(r => r.RUT_UNIQUE_ID === formData.rut);
                if (rutExists) {
                    throw new Error(`El RUT ${formData.rut} ya existe.`);
                }
                // Crear nuevo residente
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
                showSuccessToast('Residente creado exitosamente');
            }

            const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
            modal.hide();
            
            // Recargar los datos después de la operación
            await initResidentesModule(document.getElementById('module-container'));
        } catch (error) {
            console.error('❌ Error al guardar residente:', error);
            showDetailedError('Error al guardar residente', error);
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar';
        }
    });

    const modal = createModal(
        isEditing ? 'Editar Residente' : 'Nuevo Residente',
        form,
        'lg'
    );
    modal.show();
}

function confirmDeleteResidente(residente) {
    const content = document.createElement('div');
    content.innerHTML = `
        <p>¿Está seguro de que desea eliminar al residente <strong>${residente['Nombre']}</strong> (RUT: ${residente.RUT_UNIQUE_ID})?</p>
        <p>Esta acción no se puede deshacer.</p>
    `;
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-flex justify-content-end mt-4';
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-secondary me-2';
    cancelButton.textContent = 'Cancelar';
    cancelButton.setAttribute('data-bs-dismiss', 'modal');
    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-danger';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
    deleteButton.addEventListener('click', async () => {
        try {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';
            
            // Eliminar la fila específica usando el índice correcto
            await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, residente.SHEET_ROW_INDEX);
            
            const modal = bootstrap.Modal.getInstance(deleteButton.closest('.modal'));
            modal.hide();
            showSuccessToast('Residente eliminado exitosamente');
            
            // Recargar los datos después de la eliminación
            await initResidentesModule(document.getElementById('module-container'));
        } catch (error) {
            console.error('❌ Error al eliminar residente:', error);
            showDetailedError('Error al eliminar residente', error);
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        }
    });
    actionsDiv.appendChild(cancelButton);
    actionsDiv.appendChild(deleteButton);
    content.appendChild(actionsDiv);
    const modal = createModal('Confirmar Eliminación', content, 'sm');
    modal.show();
}

function updateResidentesTable(residentes) {
    const tableCard = document.querySelector('#residentes-table-container .card-body');
    if (!tableCard) return;

    tableCard.innerHTML = '';
    const columns = [
        { field: 'Nombre', title: 'Nombre' },
        { field: 'Rut', title: 'RUT' },
        { field: 'Email', title: 'Email' },
        { field: 'Telefono', title: 'Teléfono' },
        { 
            field: 'Numero_Parcela', 
            title: 'Nº Parcela', 
            width: '120px',
            formatter: (value, item) => value || item['Numero Parcela'] || 'N/A'
        },
        {
            field: 'Estado',
            title: 'Estado',
            width: '120px',
            formatter: (value) => `<span class="badge ${value === 'Activo' ? 'bg-success' : value === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${value || 'No definido'}</span>`
        },
        {
            field: 'Valor_Gasto_Comun',
            title: 'Gasto Común',
            width: '130px',
            formatter: (value, item) => {
                const valorGasto = value || item['Valor Gasto Comun'] || 0;
                return formatCurrency(parseFloat(valorGasto) || 0);
            }
        }
    ];
    const rowActions = (item) => `
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary btn-view" data-rut-id="${item.RUT_UNIQUE_ID}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            <button type="button" class="btn btn-outline-secondary btn-edit" data-rut-id="${item.RUT_UNIQUE_ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-rut-id="${item.RUT_UNIQUE_ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>
    `;
    const table = createDataTable(residentes, columns, rowActions);
    tableCard.appendChild(table);
    setupActionButtons(residentes);
}

function setupActionButtons(residentes) {
    document.querySelectorAll('.btn-view, .btn-edit, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonEl = e.currentTarget;
            const rutId = buttonEl.getAttribute('data-rut-id');
            const residente = residentes.find(r => r.RUT_UNIQUE_ID === rutId);
            if (residente) {
                if (buttonEl.classList.contains('btn-view')) showResidenteDetails(residente);
                if (buttonEl.classList.contains('btn-edit')) showResidenteForm(residente);
                if (buttonEl.classList.contains('btn-delete')) confirmDeleteResidente(residente);
            } else {
                showDetailedError('Error', new Error(`No se encontró el residente con RUT: ${rutId}`));
            }
        });
    });
}

function showResidenteDetails(residente) {
    const content = document.createElement('div');
    const infoCardBody = document.createElement('div');
    infoCardBody.className = 'card-body';
    
    const numeroParcela = residente['Numero_Parcela'] || residente['Numero Parcela'] || 'No especificado';
    const valorGastoComun = residente['Valor_Gasto_Comun'] || residente['Valor Gasto Comun'] || 0;
    
    infoCardBody.innerHTML = `
        <h5 class="card-title mb-3">${residente['Nombre']}</h5>
        <div class="row">
            <div class="col-md-6">
                <p><strong>RUT:</strong> ${residente['Rut'] || residente['RUT']}</p>
                <p><strong>Dirección:</strong> ${residente['Direccion']}</p>
                <p><strong>Nº Parcela:</strong> ${numeroParcela}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Email:</strong> ${residente['Email'] || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> ${residente['Telefono'] || 'No especificado'}</p>
                <p><strong>Estado:</strong> <span class="badge ${residente['Estado'] === 'Activo' ? 'bg-success' : residente['Estado'] === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${residente['Estado']}</span></p>
                <p><strong>Valor Gasto Común:</strong> <span class="text-primary fw-bold">${formatCurrency(parseFloat(valorGastoComun) || 0)}</span></p>
            </div>
        </div>`;
    content.appendChild(infoCardBody);
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-flex justify-content-end p-3';
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-primary me-2';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editButton.addEventListener('click', () => { 
        const modal = bootstrap.Modal.getInstance(editButton.closest('.modal'));
        modal.hide(); 
        showResidenteForm(residente); 
    });
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-secondary';
    closeButton.innerHTML = 'Cerrar';
    closeButton.setAttribute('data-bs-dismiss', 'modal');
    actionsDiv.appendChild(editButton);
    actionsDiv.appendChild(closeButton);
    content.appendChild(actionsDiv);
    const modal = createModal('Detalles del Residente', content, 'lg');
    modal.show();
}

function filterResidentes() {
    const searchText = document.getElementById('search-residente')?.value?.toLowerCase() || '';
    const filteredResidentes = originalResidentesData.filter(residente => {
        return Object.values(residente).some(value => {
            if (value === null || typeof value === 'undefined') return false;
            return String(value).toLowerCase().includes(searchText);
        });
    });
    updateResidentesTable(filteredResidentes);
}

function exportResidentes(residentes) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const headers = ['Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero_Parcela', 'Estado', 'Valor_Gasto_Comun'];
    csvContent += headers.join(',') + '\n';

    residentes.forEach(residente => {
        const row = headers.map(headerKey => {
            let value = residente[headerKey] || residente[headerKey.replace(/_/g, ' ')] || residente[headerKey.replace(/ /g, '_')] || '';
            return value.toString().replace(/"/g, '""');
        });
        csvContent += `"${row.join('","')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'residentes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showSuccessToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => {
        if (document.body.contains(toast)) {
            document.body.removeChild(toast);
        }
    }, 5000);
}

