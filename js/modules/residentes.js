/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de Residentes (Corrección de duplicación en edición)
 */

if (typeof showDetailedError === 'undefined') {
    function showDetailedError(contextMessage, error) {
        console.error(contextMessage, error);
        const modalElement = document.getElementById('errorModal');
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
        showDetailedError('Error al inicializar el módulo de Residentes', error);
    }
}

function setupActionButtons(residentes) {
    document.querySelectorAll('.btn-view, .btn-edit, .btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const buttonEl = e.currentTarget;
            const index = parseInt(buttonEl.getAttribute('data-index'));
            const residente = residentes[index];

            if (buttonEl.classList.contains('btn-view')) showResidenteDetails(residente);
            if (buttonEl.classList.contains('btn-edit')) showResidenteForm(residente);
            if (buttonEl.classList.contains('btn-delete')) confirmDeleteResidente(residente);
        });
    });
}

function showResidenteForm(residente = null) {
    const fields = [
        { id: 'nombre', label: 'Nombre Completo', type: 'text', required: true },
        { id: 'rut', label: 'RUT (con guion y dígito verificador)', type: 'text', required: true, disabled: !!residente },
        { id: 'direccion', label: 'Dirección', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'telefono', label: 'Teléfono', type: 'tel' },
        { id: 'numero_parcela', label: 'Número de Parcela', type: 'text', required: true },
        { id: 'estado', label: 'Estado', type: 'select', options: [ { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }, { value: 'Moroso', label: 'Moroso' } ], required: true },
        { id: 'valor_gasto_comun', label: 'Valor Gasto Común', type: 'text', required: true, placeholder: 'Ej: 40000' }
    ];
    
    let values = { estado: 'Activo', valor_gasto_comun: '0' };
    if (residente) {
        values = {
            nombre: residente.Nombre, rut: residente.Rut, direccion: residente.Direccion,
            email: residente.Email, telefono: residente.Telefono, numero_parcela: residente.Numero_Parcela,
            estado: residente.Estado, valor_gasto_comun: residente.Valor_Gasto_Comun
        };
    }
    
    const form = createForm(fields, values, async (formData) => {
        try {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
            
            const valorGastoComunLimpio = String(formData.valor_gasto_comun).replace(/\./g, '');
            
            // CAMBIO: Asegurarnos de usar el RUT correcto, incluso si el campo del formulario está deshabilitado.
            const rutParaGuardar = residente ? residente.Rut : formData.rut;

            const rowData = [
                formData.nombre, rutParaGuardar, formData.direccion, formData.email,
                formData.telefono, formData.numero_parcela, formData.estado, valorGastoComunLimpio
            ];
            
            // La lógica para decidir si actualizar o crear ahora es más robusta.
            if (residente) {
                const index = window.residentesData.findIndex(r => r.Rut === residente.Rut);
                if (index !== -1) {
                    await sheetsAPI.updateRow(CONFIG.SHEETS.RESIDENTES, index + 2, rowData);
                } else {
                    throw new Error('No se encontró el residente a actualizar. El RUT original no fue hallado.');
                }
            } else {
                const rutExists = window.residentesData.some(r => r.Rut === rutParaGuardar);
                if (rutExists) {
                    throw new Error(`El RUT ${rutParaGuardar} ya existe.`);
                }
                await sheetsAPI.appendRow(CONFIG.SHEETS.RESIDENTES, rowData);
            }
            
            modal.hide();
            initResidentesModule(document.getElementById('module-container'));
        } catch (error) {
            showDetailedError('Error al guardar residente', error);
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar';
        }
    });
    
    const modal = createModal(residente ? 'Editar Residente' : 'Nuevo Residente', form, 'lg');
    modal.show();
}

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

function confirmDeleteResidente(residente) {
    // MENSAJE 1: Indica que la función se inició correctamente.
    console.log("PASO 1: Abriendo diálogo para eliminar a:", residente);

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
        // MENSAJE 2: Confirma que el clic en el botón final fue registrado.
        console.log("PASO 2: Botón 'Eliminar' final presionado.");
        try {
            deleteButton.disabled = true;
            deleteButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...';
            
            console.log("PASO 3: Buscando índice del residente en los datos locales...");
            const index = window.residentesData.findIndex(r => r.Rut === residente.Rut);
            
            // MENSAJE 3: Muestra el resultado de la búsqueda.
            console.log(`PASO 4: Índice encontrado: ${index}. Se intentará borrar la fila número ${index + 2} de la hoja.`);

            if (index !== -1) {
                console.log("PASO 5: Enviando comando deleteRow a la API de Google Sheets...");
                await sheetsAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, index + 2);
                
                // MENSAJE 4: Si ves este mensaje, la eliminación en Google Sheets fue exitosa.
                console.log("PASO 6: Comando deleteRow completado sin errores.");
                
                modal.hide();
                initResidentesModule(document.getElementById('module-container'));
            } else {
                throw new Error('No se encontró el residente en los datos locales. La lista puede estar desactualizada.');
            }
        } catch (error) {
            // MENSAJE 5: Si ves este mensaje, algo falló y el error fue capturado.
            console.log("PASO 7: Ocurrió un error en el proceso de eliminación.");
            showDetailedError('Error al eliminar residente', error);
            
            deleteButton.disabled = false;
            deleteButton.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        }
    });
    
    actionsDiv.appendChild(cancelButton);
    actionsDiv.appendChild(deleteButton);
    content.appendChild(actionsDiv);
    
    const modal = createModal(
        'Confirmar Eliminación',
        content,
        'sm'
    );
    
    modal.show();
}

function filterResidentes() {
    const searchText = document.getElementById('search-residente').value.toLowerCase();
    const filteredResidentes = window.residentesData.filter(residente => 
        Object.values(residente).some(val => val && String(val).toLowerCase().includes(searchText))
    );
    updateResidentesTable(filteredResidentes);
}

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

function exportResidentes(residentes) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const headers = ['Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero_Parcela', 'Estado', 'Valor_Gasto_Comun'];
    csvContent += headers.join(',') + '\n';
    residentes.forEach(residente => {
        const row = headers.map(headerKey => {
            const jsKey = headerKey.replace(/ /g, '_');
            return residente[jsKey] || residente[headerKey];
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
