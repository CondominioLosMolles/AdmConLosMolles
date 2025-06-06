/**
 * CondoAdmin - Sistema de Administración de Condominios
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
        searchInput.placeholder = 'Buscar residente...';
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
            { field: 'ID', title: 'ID', width: '80px' },
            { field: 'Nombre', title: 'Nombre' },
            { field: 'Unidad', title: 'Unidad', width: '100px' },
            { field: 'Email', title: 'Email' },
            { field: 'Teléfono', title: 'Teléfono', width: '120px' },
            { 
                field: 'Estado', 
                title: 'Estado', 
                width: '120px',
                formatter: (value) => {
                    let badgeClass = 'bg-secondary';
                    
                    if (value === 'Activo') {
                        badgeClass = 'bg-success';
                    } else if (value === 'Inactivo') {
                        badgeClass = 'bg-danger';
                    } else if (value === 'Moroso') {
                        badgeClass = 'bg-warning text-dark';
                    }
                    
                    return `<span class="badge ${badgeClass}">${value || 'No definido'}</span>`;
                }
            },
            { 
                field: 'Saldo', 
                title: 'Saldo', 
                width: '120px',
                formatter: (value) => {
                    const saldo = parseFloat(value) || 0;
                    const textClass = saldo < 0 ? 'text-danger' : 'text-success';
                    return `<span class="${textClass}">${formatCurrency(saldo)}</span>`;
                }
            }
        ];
        
        // Función para generar las acciones por fila
        const rowActions = (item, index) => {
            return `
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary btn-view" data-index="${index}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-edit" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        };
        
        // Crear la tabla
        const table = createDataTable(residentes, columns, rowActions);
        tableCard.appendChild(table);
        
        // Agregar paginación
        const totalPages = Math.ceil(residentes.length / 10);
        if (totalPages > 1) {
            const pagination = createPagination(1, totalPages, (page) => {
                // Implementar paginación
                console.log('Cambiar a página', page);
            });
            tableCard.appendChild(pagination);
        }
        
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
    // Botones de ver
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            showResidenteDetails(residentes[index]);
        });
    });
    
    // Botones de editar
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            showResidenteForm(residentes[index]);
        });
    });
    
    // Botones de eliminar
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
    // Definir los campos del formulario
    const fields = [
        { id: 'nombre', label: 'Nombre', type: 'text', required: true },
        { id: 'unidad', label: 'Unidad', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'telefono', label: 'Teléfono', type: 'tel' },
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
        { id: 'saldo', label: 'Saldo', type: 'number', step: '0.01' }
    ];
    
    // Valores iniciales
    const values = residente ? {
        nombre: residente.Nombre,
        unidad: residente.Unidad,
        email: residente.Email,
        telefono: residente.Teléfono,
        estado: residente.Estado,
        saldo: residente.Saldo
    } : {
        estado: 'Activo',
        saldo: '0'
    };
    
    // Crear el formulario
    const form = createForm(fields, values, async (formData) => {
        try {
            // Mostrar indicador de carga
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            // Preparar los datos
            const rowData = [
                residente ? residente.ID : generateUniqueId(),
                formData.nombre,
                formData.unidad,
                formData.email,
                formData.telefono,
                formData.estado,
                formData.saldo
            ];
            
            // Guardar los datos
            if (residente) {
                // Encontrar el índice de la fila en la hoja
                const index = window.residentesData.findIndex(r => r.ID === residente.ID);
                
                if (index !== -1) {
                    await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, index + 1, rowData);
                } else {
                    throw new Error('No se encontró el residente a actualizar');
                }
            } else {
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
            }
            
            // Cerrar el modal
            modal.hide();
            
            // Recargar el módulo
            initResidentesModule(document.getElementById('module-container'));
            
        } catch (error) {
            console.error('Error al guardar residente:', error);
            showError('Error al guardar residente: ' + error.message);
            
            // Restaurar el botón
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });
    
    // Mostrar el formulario en un modal
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
    // Crear el contenido del modal
    const content = document.createElement('div');
    
    // Información básica
    const infoCard = document.createElement('div');
    infoCard.className = 'card mb-3';
    
    const infoCardBody = document.createElement('div');
    infoCardBody.className = 'card-body';
    
    infoCardBody.innerHTML = `
        <h5 class="card-title">${residente.Nombre}</h5>
        <p class="card-text"><strong>Unidad:</strong> ${residente.Unidad}</p>
        <p class="card-text"><strong>Email:</strong> ${residente.Email || 'No especificado'}</p>
        <p class="card-text"><strong>Teléfono:</strong> ${residente.Teléfono || 'No especificado'}</p>
        <p class="card-text">
            <strong>Estado:</strong> 
            <span class="badge ${residente.Estado === 'Activo' ? 'bg-success' : residente.Estado === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">
                ${residente.Estado || 'No definido'}
            </span>
        </p>
        <p class="card-text">
            <strong>Saldo:</strong> 
            <span class="${parseFloat(residente.Saldo) < 0 ? 'text-danger' : 'text-success'}">
                ${formatCurrency(parseFloat(residente.Saldo) || 0)}
            </span>
        </p>
    `;
    
    infoCard.appendChild(infoCardBody);
    content.appendChild(infoCard);
    
    // Botones de acción
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-flex justify-content-end';
    
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
    
    // Mostrar el modal
    const modal = createModal(
        'Detalles del Residente',
        content,
        'lg'
    );
    
    modal.show();
}

/**
 * Confirma la eliminación de un residente
 * @param {Object} residente - Datos del residente a eliminar
 */
function confirmDeleteResidente(residente) {
    // Crear el contenido del modal
    const content = document.createElement('div');
    
    content.innerHTML = `
        <p>¿Está seguro de que desea eliminar al residente <strong>${residente.Nombre}</strong>?</p>
        <p>Esta acción no se puede deshacer.</p>
    `;
    
    // Botones de acción
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
            // Mostrar indicador de carga
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';
            
            // Encontrar el índice de la fila en la hoja
            const index = window.residentesData.findIndex(r => r.ID === residente.ID);
            
            if (index !== -1) {
                await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, index + 1);
                
                // Cerrar el modal
                modal.hide();
                
                // Recargar el módulo
                initResidentesModule(document.getElementById('module-container'));
            } else {
                throw new Error('No se encontró el residente a eliminar');
            }
            
        } catch (error) {
            console.error('Error al eliminar residente:', error);
            showError('Error al eliminar residente: ' + error.message);
            
            // Restaurar el botón
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        }
    });
    
    actionsDiv.appendChild(cancelButton);
    actionsDiv.appendChild(deleteButton);
    content.appendChild(actionsDiv);
    
    // Mostrar el modal
    const modal = createModal(
        'Confirmar Eliminación',
        content,
        'sm'
    );
    
    modal.show();
}

/**
 * Filtra los residentes según el texto de búsqueda
 */
function filterResidentes() {
    const searchText = document.getElementById('search-residente').value.toLowerCase();
    
    // Si no hay texto de búsqueda, mostrar todos los residentes
    if (!searchText) {
        initResidentesModule(document.getElementById('module-container'));
        return;
    }
    
    // Filtrar los residentes
    const filteredResidentes = window.residentesData.filter(residente => {
        return (
            residente.Nombre.toLowerCase().includes(searchText) ||
            residente.Unidad.toLowerCase().includes(searchText) ||
            (residente.Email && residente.Email.toLowerCase().includes(searchText)) ||
            (residente.Teléfono && residente.Teléfono.toLowerCase().includes(searchText))
        );
    });
    
    // Actualizar la tabla
    updateResidentesTable(filteredResidentes);
}

/**
 * Actualiza la tabla de residentes con los datos filtrados
 * @param {Array} residentes - Datos de residentes filtrados
 */
function updateResidentesTable(residentes) {
    const tableContainer = document.getElementById('residentes-table-container');
    
    if (!tableContainer) {
        return;
    }
    
    const tableCard = tableContainer.querySelector('.card-body');
    
    if (!tableCard) {
        return;
    }
    
    // Limpiar el contenido actual
    tableCard.innerHTML = '';
    
    // Definir las columnas de la tabla
    const columns = [
        { field: 'ID', title: 'ID', width: '80px' },
        { field: 'Nombre', title: 'Nombre' },
        { field: 'Unidad', title: 'Unidad', width: '100px' },
        { field: 'Email', title: 'Email' },
        { field: 'Teléfono', title: 'Teléfono', width: '120px' },
        { 
            field: 'Estado', 
            title: 'Estado', 
            width: '120px',
            formatter: (value) => {
                let badgeClass = 'bg-secondary';
                
                if (value === 'Activo') {
                    badgeClass = 'bg-success';
                } else if (value === 'Inactivo') {
                    badgeClass = 'bg-danger';
                } else if (value === 'Moroso') {
                    badgeClass = 'bg-warning text-dark';
                }
                
                return `<span class="badge ${badgeClass}">${value || 'No definido'}</span>`;
            }
        },
        { 
            field: 'Saldo', 
            title: 'Saldo', 
            width: '120px',
            formatter: (value) => {
                const saldo = parseFloat(value) || 0;
                const textClass = saldo < 0 ? 'text-danger' : 'text-success';
                return `<span class="${textClass}">${formatCurrency(saldo)}</span>`;
            }
        }
    ];
    
    // Función para generar las acciones por fila
    const rowActions = (item, index) => {
        return `
            <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-outline-primary btn-view" data-index="${index}">
                    <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-outline-secondary btn-edit" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-outline-danger btn-delete" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    };
    
    // Crear la tabla
    const table = createDataTable(residentes, columns, rowActions);
    tableCard.appendChild(table);
    
    // Agregar paginación
    const totalPages = Math.ceil(residentes.length / 10);
    if (totalPages > 1) {
        const pagination = createPagination(1, totalPages, (page) => {
            // Implementar paginación
            console.log('Cambiar a página', page);
        });
        tableCard.appendChild(pagination);
    }
    
    // Configurar eventos para los botones de acción
    setupActionButtons(residentes);
}

/**
 * Exporta los datos de residentes a CSV
 * @param {Array} residentes - Datos de residentes
 */
function exportResidentes(residentes) {
    // Crear el contenido CSV
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Encabezados
    csvContent += 'ID,Nombre,Unidad,Email,Teléfono,Estado,Saldo\n';
    
    // Datos
    residentes.forEach(residente => {
        csvContent += `${residente.ID},${residente.Nombre},${residente.Unidad},${residente.Email || ''},${residente.Teléfono || ''},${residente.Estado || ''},${residente.Saldo || '0'}\n`;
    });
    
    // Crear un enlace para descargar el archivo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'residentes.csv');
    document.body.appendChild(link);
    
    // Simular clic en el enlace
    link.click();
    
    // Eliminar el enlace
    document.body.removeChild(link);
}

