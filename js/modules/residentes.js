/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Módulo de Residentes (Usa RUT como ID)
 */

/**
 * Inicializa el módulo de Residentes
 * @param {HTMLElement} container - Contenedor donde se renderizará el módulo
 */
async function initResidentesModule(container) {
    try {
        container.innerHTML = `<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
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
        
    } catch (error) {
        console.error('Error al inicializar el módulo de Residentes:', error);
        container.innerHTML = `<div class="alert alert-danger" role="alert"><i class="fas fa-exclamation-circle me-2"></i>Error al cargar los residentes: ${error.message}</div>`;
    }
}

/**
 * Configura los eventos para los botones de acción
 * @param {Array} residentes - Datos de residentes
 */
function setupActionButtons(residentes) {
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            showResidenteDetails(residentes[index]);
        });
    });
    
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            showResidenteForm(residentes[index]);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            confirmDeleteResidente(residentes[index]);
        });
    });
}

/**
 * Muestra el formulario para agregar o editar un residente
 * @param {Object} residente - Datos del residente a editar (null para nuevo)
 */
function showResidenteForm(residente = null) {
    const fields = [
        { id: 'nombre', label: 'Nombre Completo', type: 'text', required: true },
        { id: 'rut', label: 'RUT (con guion y dígito verificador)', type: 'text', required: true, disabled: !!residente }, // CAMBIO: Deshabilitar RUT en edición
        { id: 'direccion', label: 'Dirección', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'telefono', label: 'Teléfono', type: 'tel' },
        { id: 'numero_parcela', label: 'Número de Parcela', type: 'text', required: true },
        { 
            id: 'estado', 
            label: 'Estado', 
            type: 'select',
            options: [ { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }, { value: 'Moroso', label: 'Moroso' } ],
            required: true
        },
        { id: 'valor_gasto_comun', label: 'Valor Gasto Común', type: 'number', step: '1', required: true, placeholder: 'Ej: 40000' }
    ];
    
    const values = residente ? residente : { estado: 'Activo', valor_gasto_comun: '0' };
    
    const form = createForm(fields, values, async (formData) => {
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            // CAMBIO: El array de datos ya no incluye un ID generado
            const rowData = [
                formData.nombre,
                formData.rut,
                formData.direccion,
                formData.email,
                formData.telefono,
                formData.numero_parcela,
                formData.estado,
                formData.valor_gasto_comun
            ];
            
            if (residente) {
                // CAMBIO: Buscar el residente por RUT para actualizarlo
                const index = window.residentesData.findIndex(r => r.Rut === residente.Rut);
                if (index !== -1) {
                    await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, index + 2, rowData);
                } else {
                    throw new Error('No se encontró el residente a actualizar');
                }
            } else {
                // Validar que el RUT no exista ya
                const rutExists = window.residentesData.some(r => r.Rut === formData.rut);
                if (rutExists) {
                    throw new Error(`El RUT ${formData.rut} ya existe.`);
                }
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
            }
            
            modal.hide();
            initResidentesModule(document.getElementById('module-container'));
            
        } catch (error) {
            console.error('Error al guardar residente:', error);
            showError('Error al guardar residente: ' + error.message);
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar';
        }
    });
    
    const modal = createModal(residente ? 'Editar Residente' : 'Nuevo Residente', form, 'lg');
    modal.show();
}

/**
 * Muestra los detalles de un residente
 * @param {Object} residente - Datos del residente
 */
function showResidenteDetails(residente) {
    const content = document.createElement('div');
    const infoCardBody = document.createElement('div');
    infoCardBody.className = 'card-body';
    infoCardBody.innerHTML = `
        <h5 class="card-title mb-3">${residente.Nombre}</h5>
        <div class="row">
            <div class="col-md-6">
                <p><strong>RUT:</strong> ${residente.Rut || 'No especificado'}</p>
                <p><strong>Dirección:</strong> ${residente.Direccion || 'No especificado'}</p>
                <p><strong>Nº Parcela:</strong> ${residente.Numero_Parcela || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Email:</strong> ${residente.Email || 'No especificado'}</p>
                <p><strong>Teléfono:</strong> ${residente.Telefono || 'No especificado'}</p>
                <p><strong>Estado:</strong> <span class="badge ${residente.Estado === 'Activo' ? 'bg-success' : residente.Estado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${residente.Estado || 'No definido'}</span></p>
                <p><strong>Valor Gasto Común:</strong> <span class="text-primary fw-bold">${formatCurrency(parseFloat(residente.Valor_Gasto_Comun) || 0)}</span></p>
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

/**
 * Confirma la eliminación de un residente
 * @param {Object} residente - Datos del residente a eliminar
 */
function confirmDeleteResidente(residente) {
    const content = document.createElement('div');
    content.innerHTML = `<p>¿Está seguro de que desea eliminar al residente <strong>${residente.Nombre}</strong> (RUT: ${residente.Rut})?</p><p>Esta acción no se puede deshacer.</p>`;
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
            // CAMBIO: Buscar residente por RUT para eliminarlo
            const index = window.residentesData.findIndex(r => r.Rut === residente.Rut);
            if (index !== -1) {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, index + 2);
                modal.hide();
                initResidentesModule(document.getElementById('module-container'));
            } else {
                throw new Error('No se encontró el residente a eliminar');
            }
        } catch (error) {
            console.error('Error al eliminar residente:', error);
            showError('Error al eliminar residente: ' + error.message);
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

/**
 * Filtra los residentes según el texto de búsqueda
 */
function filterResidentes() {
    const searchText = document.getElementById('search-residente').value.toLowerCase();
    const filteredResidentes = window.residentesData.filter(residente => {
        return Object.values(residente).some(val => val && val.toLowerCase().includes(searchText));
    });
    updateResidentesTable(filteredResidentes);
}

/**
 * Actualiza la tabla de residentes con los datos
 * @param {Array} residentes - Datos de residentes
 */
function updateResidentesTable(residentes) {
    const tableCard = document.querySelector('#residentes-table-container .card-body');
    if (!tableCard) return;
    tableCard.innerHTML = '';
    const columns = [
        { field: 'Nombre', title: 'Nombre' }, { field: 'Rut', title: 'RUT' },
        { field: 'Email', title: 'Email' }, { field: 'Telefono', title: 'Teléfono' },
        { field: 'Numero_Parcela', title: 'Nº Parcela', width: '120px' },
        { field: 'Estado', title: 'Estado', width: '120px', formatter: (value) => `<span class="badge ${value === 'Activo' ? 'bg-success' : value === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${value || 'No definido'}</span>` },
        { field: 'Valor_Gasto_Comun', title: 'Gasto Común', width: '130px', formatter: (value) => formatCurrency(parseFloat(value) || 0) }
    ];
    const rowActions = (item, index) => `
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary btn-view" data-index="${index}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            <button type="button" class="btn btn-outline-secondary btn-edit" data-index="${index}" title="Editar"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-index="${index}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`;
    const table = createDataTable(residentes, columns, rowActions);
    tableCard.appendChild(table);
    setupActionButtons(residentes);
}

/**
 * Exporta los datos de residentes a CSV
 * @param {Array} residentes - Datos de residentes
 */
function exportResidentes(residentes) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    // CAMBIO: Quitar ID de la exportación
    const headers = ['Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero_Parcela', 'Estado', 'Valor_Gasto_Comun'];
    csvContent += headers.join(',') + '\n';
    residentes.forEach(residente => {
        const row = headers.map(header => residente[header]);
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
