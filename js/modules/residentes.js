/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de Residentes (Versión Final)
 */

// Función para mostrar errores detallados
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

// Función helper para obtener valores normalizados
function getNormalizedValue(obj, field) {
    if (!obj) return '';
    return obj[field] || obj[field.replace(/_/g, ' ')] || obj[field.replace(/ /g, '_')] || '';
}

// Variable global para almacenar los datos originales
let originalResidentesData = [];

// Función que actualiza la tabla de residentes
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
        { 
            field: 'Estado', 
            title: 'Estado', 
            width: '120px', 
            formatter: (value) => `<span class="badge ${value === 'Activo' ? 'bg-success' : value === 'Inactivo' ? 'bg-danger' : 'bg-warning text-dark'}">${value || 'No definido'}</span>` 
        },
        { 
            field: 'Valor Gasto Comun', 
            title: 'Gasto Común', 
            width: '130px', 
            formatter: (value) => formatCurrency(parseFloat(value) || 0) 
        }
    ];

    const rowActions = (item, index) => `
        <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn btn-outline-primary btn-view" data-rut-id="${item.RUT_UNIQUE_ID}" title="Ver Detalles"><i class="fas fa-eye"></i></button>
            <button type="button" class="btn btn-outline-secondary btn-edit" data-rut-id="${item.RUT_UNIQUE_ID}" title="Editar"><i class="fas fa-edit"></i></button>
            <button type="button" class="btn btn-outline-danger btn-delete" data-rut-id="${item.RUT_UNIQUE_ID}" title="Eliminar"><i class="fas fa-trash"></i></button>
        </div>`;

    const table = createDataTable(residentes, columns, rowActions);
    tableCard.appendChild(table);
    setupActionButtons(residentes);
}

// Función que inicializa el módulo de residentes
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

        container.innerHTML = `
            <div class="d-flex justify-content-center my-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        `;

        // Obtener datos frescos de Google Sheets
        const residentes = await sheetsAPI.getSheetData(CONFIG.SHEETS.RESIDENTES);
        console.log('✅ Datos cargados:', residentes.length, 'residentes');

        // Limpiar y preparar datos
        originalResidentesData = residentes.map((residente, index) => {
            // Crear una copia limpia del objeto
            const cleanResidente = {};
            Object.keys(residente).forEach(key => {
                if (key && residente[key] !== undefined && residente[key] !== null) {
                    cleanResidente[key] = residente[key];
                }
            });

            // Asegurar que tenemos RUT como identificador único
            const rut = getNormalizedValue(cleanResidente, 'Rut') || getNormalizedValue(cleanResidente, 'RUT');
            cleanResidente.RUT_UNIQUE_ID = rut;
            cleanResidente.SHEET_ROW_INDEX = index + 2;

            return cleanResidente;
        });

        const content = document.createElement('div');

        // Encabezado y botón de nuevo residente
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

        // Barra de herramientas con búsqueda y exportación
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

        // Contenedor de la tabla
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

// Registrar la función en el objeto global
window.initResidentesModule = initResidentesModule;
