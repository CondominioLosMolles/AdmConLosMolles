// Al inicio de tu archivo de residentes, agrega este debug:
console.log('🔍 DEBUG: Archivo de residentes cargado correctamente');

// Verifica si las dependencias están disponibles
console.log('🔍 DEBUG: sheetsAPI disponible?', typeof sheetsAPI !== 'undefined');
console.log('🔍 DEBUG: CONFIG disponible?', typeof CONFIG !== 'undefined');
console.log('🔍 DEBUG: createForm disponible?', typeof createForm !== 'undefined');
console.log('🔍 DEBUG: createModal disponible?', typeof createModal !== 'undefined');
console.log('🔍 DEBUG: createDataTable disponible?', typeof createDataTable !== 'undefined');
console.log('🔍 DEBUG: formatCurrency disponible?', typeof formatCurrency !== 'undefined');

// Agregar al objeto global para verificar
window.ResidentesModule = {
    init: initResidentesModule,
    loaded: true,
    timestamp: new Date().toISOString()
};

console.log('🔍 DEBUG: Módulo de residentes registrado en window.ResidentesModule');

/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de Residentes (Versión Corregida)
 */

if (typeof showDetailedError === 'undefined') {
    function showDetailedError(contextMessage, error) {
        console.error('❌ ERROR:', contextMessage, error);
        const modalElement = document.getElementById('errorModal');
        if (!modalElement) {
            console.error('❌ ERROR: Modal de error no encontrado');
            alert(`${contextMessage}: ${error.message || error}`);
            return;
        }
        
        const modalBody = document.getElementById('errorModalBody');
        let detailedMessage = 'No hay detalles disponibles.';
        if (error) {
            if (error.message) {
                detailedMessage = error.message;
            } else if (error.result && error.result.error) {
                detailedMessage = `Code ${error.result.error.code}: ${error.result.error.message}`;
            } else {
                detailedMessage = JSON.stringify(error);
            }
        }
        modalBody.innerHTML = `<strong>${contextMessage}:</strong><br><pre style="white-space: pre-wrap; word-break: break-all;">${detailedMessage}</pre>`;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

async function initResidentesModule(container) {
    console.log('🚀 Inicializando módulo de residentes...');
    
    try {
        // Verificar dependencias críticas
        if (typeof sheetsAPI === 'undefined') {
            throw new Error('sheetsAPI no está disponible. Verifica que se haya cargado correctamente.');
        }
        
        if (typeof CONFIG === 'undefined' || !CONFIG.SHEETS || !CONFIG.SHEETS.RESIDENTES) {
            throw new Error('CONFIG.SHEETS.RESIDENTES no está definido. Verifica la configuración.');
        }
        
        console.log('✅ Dependencias verificadas, cargando datos...');
        
        container.innerHTML = `<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
        
        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
        console.log('✅ Datos cargados:', residentes.length, 'residentes');
        
        // Asignar un ID único basado en el RUT (que es único) y el índice real de la hoja
        residentes.forEach((residente, index) => {
            // Usar RUT como identificador único principal
            residente._uniqueId = getNormalizedValue(residente, 'Rut');
            // Guardar el índice real de la fila en Google Sheets (fila + 2 porque empezamos en fila 2)
            residente._sheetRowIndex = index + 2;
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
        exportButton.addEventListener('click', () => exportResidentes(residentes));
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
        
        updateResidentesTable(residentes);
        window.residentesData = residentes;
        
        console.log('✅ Módulo de residentes inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar módulo de residentes:', error);
        showDetailedError('Error al inicializar el módulo de Residentes', error);
    }
}

// Función helper para obtener valores normalizados
function getNormalizedValue(obj, field) {
    return obj[field] || obj[field.replace(/_/g, ' ')] || obj[field.replace(/ /g, '_')] || '';
}

function setupActionButtons(residentes) {
    document.querySelectorAll('.btn-view, .btn-edit, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonEl = e.currentTarget;
            const uniqueId = buttonEl.getAttribute('data-unique-id');
            const residente = residentes.find(r => r._uniqueId === uniqueId);

            if (residente) {
                if (buttonEl.classList.contains('btn-view')) showResidenteDetails(residente);
                if (buttonEl.classList.contains('btn-edit')) showResidenteForm(residente);
                if (buttonEl.classList.contains('btn-delete')) confirmDeleteResidente(residente);
            } else {
                showDetailedError('Error', new Error('No se encontró el residente seleccionado'));
            }
        });
    });
}

function showResidenteForm(residente = null) {
    console.log('📝 Mostrando formulario de residente:', residente ? 'EDITAR' : 'NUEVO');
    
    // Verificar dependencias del formulario
    if (typeof createForm === 'undefined') {
        showDetailedError('Error de dependencias', new Error('createForm no está disponible'));
        return;
    }
    
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
        
        console.log('📝 Editando residente:', editingResidente._uniqueId, 'en fila:', editingResidente._sheetRowIndex);
        
        values = {
            nombre: getNormalizedValue(residente, 'Nombre'),
            rut: getNormalizedValue(residente, 'Rut'),
            direccion: getNormalizedValue(residente, 'Direccion'),
            email: getNormalizedValue(residente, 'Email'),
            telefono: getNormalizedValue(residente, 'Telefono'),
            numero_parcela: getNormalizedValue(residente, 'Numero_Parcela') || getNormalizedValue(residente, 'Numero Parcela'),
            estado: getNormalizedValue(residente, 'Estado'),
            valor_gasto_comun: getNormalizedValue(residente, 'Valor_Gasto_Comun') || getNormalizedValue(residente, 'Valor Gasto Comun') || '0'
        };
        
        console.log('📝 Valores para edición:', values);
    }
    
    const form = createForm(fields, values, async (formData) => {
        console.log('💾 Guardando residente...', { isEditing, formData });
        
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            const valorGastoComunNumerico = Number(formData.valor_gasto_comun) || 0;
            
            const rowData = [
                formData.nombre, 
                formData.rut, 
                formData.direccion, 
                formData.email,
                formData.telefono, 
                formData.numero_parcela, 
                formData.estado, 
                valorGastoComunNumerico
            ];
            
            console.log('💾 Datos a guardar:', rowData);
            
            if (isEditing && editingResidente) {
                // Actualizar usando el índice de fila guardado
                const sheetRowIndex = editingResidente._sheetRowIndex;
                
                console.log('💾 Actualizando residente en fila de Google Sheets:', sheetRowIndex);
                
                await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, sheetRowIndex, rowData);
                console.log('✅ Residente actualizado exitosamente');
            } else {
                // Verificar duplicados solo para nuevos residentes
                const rutExists = window.residentesData.some(r => r._uniqueId === formData.rut);
                if (rutExists) {
                    throw new Error(`El RUT ${formData.rut} ya existe.`);
                }
                
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
                console.log('✅ Nuevo residente creado exitosamente');
            }
            
            modal.hide();
            
            // Mostrar mensaje de éxito
            const toast = document.createElement('div');
            toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
            toast.style.zIndex = '9999';
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        ${isEditing ? 'Residente actualizado exitosamente' : 'Residente creado exitosamente'}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            document.body.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            
            // Recargar módulo
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

function showResidenteDetails(residente) {
    const content = document.createElement('div');
    const infoCardBody = document.createElement('div');
    infoCardBody.className = 'card-body';
    
    infoCardBody.innerHTML = `
        <h5 class="card-title mb-3">${getNormalizedValue(residente, 'Nombre')}</h5>
        <div class="row">
            <div class="col-md-6">
                <p><strong>RUT:</strong> ${getNormalizedValue(residente, 'Rut')}</p>
                <p><strong>Dirección:</strong> ${getNormalizedValue(residente, 'Direccion')}</p>
                <p><strong>Nº Parcela:</strong> ${getNormalizedValue(residente, 'Numero_Parcela') || getNormalizedValue(residente, 'Numero Parcela')}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Email:</strong> ${getNormalizedValue(residente, 'Email')}</p>
                <p><strong>Teléfono:</strong> ${getNormalizedValue(residente, 'Telefono')}</p>
                <p><strong>Estado:</strong> <span class="badge ${residente.Estado === 'Activo' ? 'bg-success' : residente.Estado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${getNormalizedValue(residente, 'Estado')}</span></p>
                <p><strong>Valor Gasto Común:</strong> <span class="text-primary fw-bold">${formatCurrency(parseFloat(getNormalizedValue(residente, 'Valor_Gasto_Comun') || getNormalizedValue(residente, 'Valor Gasto Comun')) || 0)}</span></p>
            </div>
        </div>`;
    content.appendChild(infoCardBody);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-flex justify-content-end p-3';
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-primary me-2';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editButton.addEventListener('click', () => { modal.hide(); showResidenteForm(residente); });
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

function confirmDeleteResidente(residente) {
    const content = document.createElement('div');
    
    content.innerHTML = `<p>¿Está seguro de que desea eliminar al residente <strong>${getNormalizedValue(residente, 'Nombre')}</strong> (RUT: ${getNormalizedValue(residente, 'Rut')})?</p><p>Esta acción no se puede deshacer.</p>`;
    
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
            
            // Usar el índice de fila guardado
            const sheetRowIndex = residente._sheetRowIndex;
            
            console.log('🗑️ Eliminando residente de la fila:', sheetRowIndex);
            
            await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, sheetRowIndex);
            
            modal.hide();
            
            // Mostrar mensaje de éxito
            const toast = document.createElement('div');
            toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed top-0 end-0 m-3';
            toast.style.zIndex = '9999';
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        Residente eliminado exitosamente
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            `;
            document.body.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            
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

function filterResidentes() {
    const searchText = document.getElementById('search-residente').value.toLowerCase();
    const filteredResidentes = window.residentesData.filter(residente => {
        return Object.values(residente).some(valor => {
            if (valor === null || typeof valor === 'undefined') {
                return false;
            }
            // Ignorar campos internos que empiecen con _
            if (typeof valor === 'string' && valor.startsWith('_')) {
                return false;
            }
            // Ignorar índices de fila
            if (typeof valor === 'number' && (valor === residente._sheetRowIndex)) {
                return false;
            }
            return String(valor).toLowerCase().includes(searchText);
        });
    });
    updateResidentesTable(filteredResidentes);
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
        { field: 'Numero Parcela', title: 'Nº Parcela', width: '120px' },
        { field: 'Estado', title: 'Estado', width: '120px', formatter: (value) => `<span class="badge ${value === 'Activo' ? 'bg-success' : value === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${value || 'No definido'}</span>` },
        { field: 'Valor Gasto Comun', title: 'Gasto Común', width: '130px', formatter: (value) => formatCurrency(parseFloat(value) || 0) }
    ];
    
    const rowActions = (item, index) => `
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary btn-view" data-unique-id="${item._uniqueId}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            <button type="button" class="btn btn-outline-secondary btn-edit" data-unique-id="${item._uniqueId}" title="Editar"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-unique-id="${item._uniqueId}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`;
        
    const table = createDataTable(residentes, columns, rowActions);
    tableCard.appendChild(table);
    setupActionButtons(residentes);
}

function exportResidentes(residentes) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const headers = ['Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero Parcela', 'Estado', 'Valor Gasto Comun'];
    csvContent += headers.join(',') + '\n';
    
    residentes.forEach(residente => {
        const row = headers.map(headerKey => {
            return residente[headerKey] || residente[headerKey.replace(/ /g, '_')] || residente[headerKey.replace(/_/g, ' ')] || '';
        });
        const csvRow = row.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',');
        csvContent += csvRow + '\n';
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'residentes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Verificar que el módulo se cargó correctamente
console.log('🔍 DEBUG: initResidentesModule definido?', typeof initResidentesModule !== 'undefined');
