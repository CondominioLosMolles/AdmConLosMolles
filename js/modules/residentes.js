/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de Residentes (Solución robusta de edición con ID temporal)
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
        modalBody.innerHTML = `<strong><span class="math-inline">\{contextMessage\}\:</strong\><br\><pre style\="white\-space\: pre\-wrap; word\-break\: break\-all;"\></span>{detailedMessage}</pre>`;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

async function initResidentesModule(container) {
    try {
        container.innerHTML = `<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
        
        // ✅ NUEVA LÓGICA: Asignar un ID temporal y único a cada residente al cargar.
        // Esto nos permitirá identificarlo de forma única más adelante.
        residentes.forEach((residente, index) => {
            residente._tempId = index; 
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

            if (residente) { // Pequeña verificación para evitar errores
                if (buttonEl.classList.contains('btn-view')) showResidenteDetails(residente);
                if (buttonEl.classList.contains('btn-edit')) showResidenteForm(residente);
                if (buttonEl.classList.contains('btn-delete')) confirmDeleteResidente(residente);
            }
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
        { id: 'valor_gasto_comun', label: 'Valor Gasto Común', type: 'number', required: true, placeholder: 'Ej: 3000
