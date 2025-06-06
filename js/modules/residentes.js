/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de Residentes
 */

/**
 * Inicializa el módulo de Residentes
 * @param {HTMLElement} container - Contenedor donde se renderizará el módulo
 */
async function initResidentesModule(container) {
    try {
        // Mostrar indicador de carga
        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;
        
        // Obtener datos de residentes
        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
        
        // Crear el contenido del módulo
        const content = document.createElement('div');
        
        // Título y botón de agregar
        const header = document.createElement('div');
        header.className = 'd-flex justify-content-between align-items-center mb-4';
        
        const title = document.createElement('h2');
        title.textContent = 'Residentes';
        
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.innerHTML = '<i class="fas fa-plus"></i> Nuevo Residente';
        addButton.addEventListener('click', () => {
            showResidenteForm();
        });
        
        header.appendChild(title);
        header.appendChild(addButton);
        content.appendChild(header);
        
        // Barra de búsqueda y filtros
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
        searchButton.addEventListener('click', () => {
            filterResidentes();
        });
        
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                filterResidentes();
            }
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
        exportButton.addEventListener('click', () => {
            exportResidentes(residentes);
        });
        
        filterCol.appendChild(exportButton);
        toolbarRow.appendChild(filterCol);
        
        content.appendChild(toolbarRow);
        
        // Tabla de residentes
        const tableContainer = document.createElement('div');
        tableContainer.className = 'card';
        tableContainer.id = 'residentes-table-container';
        
        const tableCard = document.createElement('div');
        tableCard.className = 'card-body';
        
        // Definir las columnas de la tabla
        const columns = [
            { field: 'Nombre', title: 'Nombre' },
            { field: 'Rut', title: 'RUT' },
            { field: 'Email', title: 'Email' },
            { field: 'Telefono', title: 'Teléfono' },
            { field: 'Numero_Parcela', title: 'Nº Parcela', width: '120px' },
            { 
                field: 'Estado', 
                title: 'Estado', 
                width: '120px',
                formatter: (value) => {
                    let badgeClass = 'bg-secondary';
                    if (value === 'Activo') badgeClass = 'bg-success';
                    else if (value === 'Inactivo') badgeClass = 'bg-danger';
                    else if (value === 'Moroso') badgeClass = 'bg-warning text-dark';
                    return `<span class="badge ${badgeClass}">${value || 'No definido'}</span>`;
                }
            },
            { 
                field: 'Valor_Gasto_Comun', 
                title: 'Gasto Común', 
                width: '130px',
                formatter: (value) => {
                    return formatCurrency(parseFloat(value) || 0);
                }
            }
        ];
        
        // Función para generar las acciones por fila
        const rowActions = (item, index) => {
            return `
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary btn-view" data-index="${index}" title="Ver Detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-edit" data-index="${index}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-delete" data-index="${index}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        };
        
        // Crear la tabla
        const table = createDataTable(residentes, columns, rowActions);
        tableCard.appendChild(table);
        
        tableContainer.appendChild(tableCard);
        content.appendChild(tableContainer);
        
        // Renderizar el contenido
        container.innerHTML = '';
        container.appendChild(content);
        
        // Configurar eventos para los botones de acción
        setupActionButtons(residentes);
        
        // Almacenar los datos en una variable global para búsquedas
        window.residentesData = residentes;
        
    } catch (error) {
        console.error('Error al inicializar el módulo de Residentes:', error);
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar los residentes: ${error.message}
            </div>
        `;
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
        { id: 'rut', label: 'RUT (con guion y dígito verificador)', type: 'text', required: true },
        { id: 'direccion', label: 'Dirección', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'telefono', label: 'Teléfono', type: 'tel' },
        { id: 'numero_parcela', label: 'Número de Parcela', type: 'text', required: true },
        { 
            id: 'estado', 
            label: 'Estado', 
            type: 'select',
            options: [
                { value: 'Activo', label: 'Activo' },
                { value: 'Inactivo', label: 'Inactivo' },
                { value: 'Moroso', label: 'Moroso' }
            ],
            required: true
        },
        { id: 'valor_gasto_comun', label: 'Valor Gasto Común', type: 'number', step: '1', required: true, placeholder: 'Ej: 40000' }
    ];
    
    const values = residente ? {
        nombre: residente.Nombre,
        rut: residente.Rut,
        direccion: residente.Direccion,
        email: residente.Email,
        telefono: residente.Telefono,
        numero_parcela: residente.Numero_Parcela,
        estado: residente.Estado,
        valor_gasto_comun: residente.Valor_Gasto_Comun
    } : {
        estado: 'Activo',
        valor_gasto_comun: '0'
    };
    
    const form = createForm(fields, values, async (formData) => {
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            const rowData = [
                residente ? residente.ID : generateUniqueId(),
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
                const index = window.residentesData.findIndex(r => r.ID === residente.ID);
                if (index !== -1) {
                    await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, index + 2, rowData); // +2 para ajustar a la fila real (1-based + header)
                } else {
                    throw new Error('No se encontró el residente a actualizar');
                }
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
            }
            
            modal.hide();
            initResidentesModule(document.getElementById('module-container'));
            
        } catch (error) {
            console.error('Error al guardar residente:', error);
            showError('Error al guardar residente: ' + error.message);
            
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
    
    const modal = createModal(
        residente ? 'Editar Residente' : 'Nuevo Residente',
        form,
        'lg'
    );
    
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
                <p><strong>Estado:</strong> 
                    <span class="badge ${residente.Estado === 'Activo' ? 'bg-success' : residente.Estado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">
                        ${residente.Estado || 'No definido'}
                    </span>
                </p>
                <p><strong>Valor Gasto Común:</strong> 
                    <span class="text-primary fw-bold">
                        ${formatCurrency(parseFloat(residente.Valor_Gasto_Comun) || 0)}
                    </span>
                </p>
            </div>
        </div>
    `;
    
    content.appendChild(infoCardBody);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-flex justify-content-end p-3';
    
    const editButton = document.createElement('button');
    editButton.className = 'btn btn-primary me-2';
    editButton.innerHTML = '<i class="fas fa-edit"></i> Editar';
    editButton.addEventListener('click', () => {
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

/**
 * Confirma la eliminación de un residente
 * @param {Object} residente - Datos del residente a eliminar
 */
function confirmDeleteResidente(residente) {
    const content = document.createElement('div');
    content.innerHTML = `
        <p>¿Está seguro de que desea eliminar al residente <strong>${residente.Nombre}</strong>?</p>
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
            
            const index = window.residentesData.findIndex(r => r.ID === residente.ID);
            
            if (index !== -1) {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, index + 2); // +2 para ajustar
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
        const searchFields = [
            residente.Nombre,
            residente.Rut,
            residente.Direccion,
            residente.Email,
            residente.Telefono,
            residente.Numero_Parcela
        ];
        return searchFields.some(field => field && field.toLowerCase().includes(searchText));
    });
    
    updateResidentesTable(filteredResidentes);
}

/**
 * Actualiza la tabla de residentes con los datos filtrados
 * @param {Array} residentes - Datos de residentes filtrados
 */
function updateResidentesTable(residentes) {
    const tableContainer = document.getElementById('residentes-table-container');
    if (!tableContainer) return;
    
    const tableCard = tableContainer.querySelector('.card-body');
    if (!tableCard) return;
    
    tableCard.innerHTML = '';
    
    const columns = [
        { field: 'Nombre', title: 'Nombre' },
        { field: 'Rut', title: 'RUT' },
        { field: 'Email', title: 'Email' },
        { field: 'Telefono', title: 'Teléfono' },
        { field: 'Numero_Parcela', title: 'Nº Parcela', width: '120px' },
        { 
            field: 'Estado', 
            title: 'Estado', 
            width: '120px',
            formatter: (value) => {
                let badgeClass = 'bg-secondary';
                if (value === 'Activo') badgeClass = 'bg-success';
                else if (value === 'Inactivo') badgeClass = 'bg-danger';
                else if (value === 'Moroso') badgeClass = 'bg-warning text-dark';
                return `<span class="badge ${badgeClass}">${value || 'No definido'}</span>`;
            }
        },
        { 
            field: 'Valor_Gasto_Comun', 
            title: 'Gasto Común', 
            width: '130px',
            formatter: (value) => {
                return formatCurrency(parseFloat(value) || 0);
            }
        }
    ];
    
    const rowActions = (item, index) => {
        return `
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-primary btn-view" data-index="${index}" title="Ver Detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary btn-edit" data-index="${index}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-danger btn-delete" data-index="${index}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    };
    
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
    
    const headers = ['ID', 'Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero_Parcela', 'Estado', 'Valor_Gasto_Comun'];
    csvContent += headers.join(',') + '\n';
    
    residentes.forEach(residente => {
        const row = [
            residente.ID,
            residente.Nombre,
            residente.Rut,
            residente.Direccion,
            residente.Email,
            residente.Telefono,
            residente.Numero_Parcela,
            residente.Estado,
            residente.Valor_Gasto_Comun
        ];
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
