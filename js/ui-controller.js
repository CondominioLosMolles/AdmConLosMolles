/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Controlador de la interfaz de usuario (Versión con Modal mejorado)
 */

// ... (El resto de las funciones como createDataTable, createPagination, etc., se mantienen igual)
// ... (Asegúrate de que el código que sigue reemplace tu función createModal existente)

/**
 * Crea un elemento de tabla con datos
 * @param {Array} data - Datos para la tabla
 * @param {Array} columns - Definición de columnas
 * @param {Function} rowActions - Función para generar acciones por fila
 * @returns {HTMLElement} - Elemento de tabla
 */
function createDataTable(data, columns, rowActions = null) {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    
    const table = document.createElement('table');
    table.className = 'table table-hover';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        headerRow.appendChild(th);
    });
    if (rowActions) {
        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Acciones';
        actionsHeader.style.width = '1%';
        headerRow.appendChild(actionsHeader);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            if (column.formatter) {
                td.innerHTML = column.formatter(item[column.field], item);
            } else {
                td.textContent = item[column.field] || '';
            }
            row.appendChild(td);
        });
        
        if (rowActions) {
            const actionsTd = document.createElement('td');
            actionsTd.innerHTML = rowActions(item, index);
            row.appendChild(actionsTd);
        }
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    return tableContainer;
}

/**
 * Crea un formulario a partir de una definición de campos
 * @param {Array} fields - Definición de campos
 * @param {Object} values - Valores iniciales
 * @param {Function} onSubmit - Función a llamar al enviar el formulario
 * @returns {HTMLElement} - Elemento de formulario
 */
function createForm(fields, values = {}, onSubmit) {
    const form = document.createElement('form');
    form.noValidate = true;

    fields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';
        
        const label = document.createElement('label');
        label.className = 'form-label';
        label.htmlFor = field.id;
        label.textContent = field.label;
        
        let input;
        
        switch (field.type) {
            case 'select':
                input = document.createElement('select');
                input.className = 'form-select';
                if (field.options) {
                    field.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        if (String(values[field.id]) === String(option.value)) {
                            optionElement.selected = true;
                        }
                        input.appendChild(optionElement);
                    });
                }
                break;
            case 'textarea':
                input = document.createElement('textarea');
                input.className = 'form-control';
                input.rows = field.rows || 3;
                input.value = values[field.id] || '';
                break;
            default:
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.className = 'form-control';
                input.value = values[field.id] || '';
        }
        
        input.id = field.id;
        input.name = field.id;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.required) input.required = true;
        if (field.disabled) input.disabled = true;
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        form.appendChild(formGroup);
    });

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'd-flex justify-content-end mt-4';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary me-2';
    cancelButton.textContent = 'Cancelar';
    cancelButton.addEventListener('click', () => {
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) modal.hide();
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary';
    submitButton.textContent = 'Guardar';
    
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(submitButton);
    form.appendChild(buttonsContainer);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = {};
        fields.forEach(field => {
            formData[field.id] = form.elements[field.id].value;
        });
        onSubmit(formData);
    });
    
    return form;
}


/**
 * Crea un modal con soporte para botones de acción en el pie de página.
 * @param {string} title - Título del modal.
 * @param {HTMLElement|string} content - Contenido del modal.
 * @param {string} size - Tamaño del modal ('sm', 'lg', 'xl').
 * @param {Array} actions - Array de objetos para los botones de acción. Ej: [{label: 'Ok', className: 'btn-primary', onClick: (modal) => modal.hide()}]
 * @returns {Object} - Objeto con el elemento modal y métodos para mostrar/ocultar.
 */
function createModal(title, content, size = '', actions = []) {
    const modalId = 'appModal-' + Date.now();
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    modalContainer.id = modalId;
    modalContainer.tabIndex = -1;

    const modalDialog = document.createElement('div');
    modalDialog.className = `modal-dialog ${size ? 'modal-' + size : ''}`;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    modalContent.innerHTML = `
        <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body"></div>
    `;

    const modalBody = modalContent.querySelector('.modal-body');
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.appendChild(content);
    }

    if (actions.length > 0) {
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `btn ${action.className || 'btn-secondary'}`;
            button.textContent = action.label;
            
            if (action.dismiss) {
                button.setAttribute('data-bs-dismiss', 'modal');
            }
            
            modalFooter.appendChild(button);
        });
        modalContent.appendChild(modalFooter);
    }
    
    modalDialog.appendChild(modalContent);
    modalContainer.appendChild(modalDialog);
    document.body.appendChild(modalContainer);

    const modal = new bootstrap.Modal(modalContainer);
    
    // Asignar los eventos onClick después de que el modal está listo
    if (actions.length > 0) {
        const buttons = modalContainer.querySelectorAll('.modal-footer button');
        buttons.forEach((button, index) => {
            if (actions[index].onClick) {
                button.addEventListener('click', () => actions[index].onClick(modal));
            }
        });
    }

    modalContainer.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modalContainer);
    });

    return {
        element: modalContainer,
        show: () => modal.show(),
        hide: () => modal.hide()
    };
}


function createCard(title, content) {
    const card = document.createElement('div');
    card.className = 'card shadow-sm mb-4';
    
    if (title) {
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        cardHeader.innerHTML = `<h5 class="card-title mb-0">${title}</h5>`;
        card.appendChild(cardHeader);
    }
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body p-0'; // p-0 para que la tabla quede al ras
    if (typeof content === 'string') {
        cardBody.innerHTML = content;
    } else {
        cardBody.appendChild(content);
    }
    
    card.appendChild(cardBody);
    return card;
}
