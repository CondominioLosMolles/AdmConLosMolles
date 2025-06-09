/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Controlador de la interfaz de usuario
 */

/**
 * Crea un elemento de tabla con datos
 * @param {Array} data - Datos para la tabla
 * @param {Array} columns - Definición de columnas
 * @param {Function} rowActions - Función para generar acciones por fila
 * @returns {HTMLElement} - Elemento de tabla
 */
function createDataTable(data, columns, rowActions = null) {
    // Crear el contenedor de la tabla
    const tableContainer = document.createElement('div');
    tableContainer.className = 'table-responsive';
    
    // Crear la tabla
    const table = document.createElement('table');
    table.className = 'table table-hover';
    
    // Crear el encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.title;
        if (column.width) {
            th.style.width = column.width;
        }
        headerRow.appendChild(th);
    });
    
    // Agregar columna de acciones si es necesario
    if (rowActions) {
        const actionsHeader = document.createElement('th');
        actionsHeader.textContent = 'Acciones';
        headerRow.appendChild(actionsHeader);
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Crear el cuerpo de la tabla
    const tbody = document.createElement('tbody');
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        columns.forEach(column => {
            const td = document.createElement('td');
            
            // Verificar si hay un formateador personalizado
            if (column.formatter) {
                td.innerHTML = column.formatter(item[column.field], item);
            } else {
                td.textContent = item[column.field] || '';
            }
            
            row.appendChild(td);
        });
        
        // Agregar acciones si es necesario
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
 * Crea un elemento de paginación
 * @param {number} currentPage - Página actual
 * @param {number} totalPages - Total de páginas
 * @param {Function} onPageChange - Función a llamar cuando cambia la página
 * @returns {HTMLElement} - Elemento de paginación
 */
function createPagination(currentPage, totalPages, onPageChange) {
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';
    
    // Botón "Anterior"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Anterior';
    
    if (currentPage > 1) {
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(currentPage - 1);
        });
    }
    
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);
    
    // Páginas numeradas
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        
        pageLink.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(i);
        });
        
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }
    
    // Botón "Siguiente"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Siguiente';
    
    if (currentPage < totalPages) {
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(currentPage + 1);
        });
    }
    
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);
    
    nav.appendChild(ul);
    
    return nav;
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
                
                // Agregar opciones
                if (field.options) {
                    field.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        
                        if (values[field.id] === option.value) {
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
                
            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.className = 'form-check-input';
                input.checked = values[field.id] || false;
                
                // Ajustar el estilo para checkboxes
                formGroup.className = 'mb-3 form-check';
                label.className = 'form-check-label';
                formGroup.appendChild(input);
                formGroup.appendChild(label);
                form.appendChild(formGroup);
                return;
                
            default:
                input = document.createElement('input');
                input.type = field.type || 'text';
                input.className = 'form-control';
                input.value = values[field.id] || '';
        }
        
        input.id = field.id;
        input.name = field.id;
        
        if (field.placeholder) {
            input.placeholder = field.placeholder;
        }
        
        if (field.required) {
            input.required = true;
        }
        
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        form.appendChild(formGroup);
    });
    
    // Botones del formulario
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'd-flex justify-content-end mt-4';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn btn-secondary me-2';
    cancelButton.textContent = 'Cancelar';
    cancelButton.addEventListener('click', () => {
        // Cerrar el modal si existe
        const modal = bootstrap.Modal.getInstance(form.closest('.modal'));
        if (modal) {
            modal.hide();
        }
    });
    
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary';
    submitButton.textContent = 'Guardar';
    
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(submitButton);
    form.appendChild(buttonsContainer);
    
    // Evento de envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Recopilar los valores del formulario
        const formData = {};
        
        fields.forEach(field => {
            const input = form.elements[field.id];
            
            if (field.type === 'checkbox') {
                formData[field.id] = input.checked;
            } else {
                formData[field.id] = input.value;
            }
        });
        
        // Llamar a la función de envío
        onSubmit(formData);
    });
    
    return form;
}

/**
 * Crea un modal
 * @param {string} title - Título del modal
 * @param {HTMLElement|string} content - Contenido del modal
 * @param {string} size - Tamaño del modal (sm, lg, xl)
 * @returns {Object} - Objeto con el elemento modal y métodos para mostrarlo y ocultarlo
 */
function createModal(title, content, size = '') {
    // Crear el contenedor del modal
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal fade';
    modalContainer.tabIndex = -1;
    modalContainer.setAttribute('aria-hidden', 'true');
    
    // Crear el diálogo del modal
    const modalDialog = document.createElement('div');
    modalDialog.className = `modal-dialog ${size ? 'modal-' + size : ''}`;
    
    // Crear el contenido del modal
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Crear el encabezado del modal
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h5');
    modalTitle.className = 'modal-title';
    modalTitle.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('data-bs-dismiss', 'modal');
    closeButton.setAttribute('aria-label', 'Close');
    
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    // Crear el cuerpo del modal
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.appendChild(content);
    }
    
    // Ensamblar el modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalDialog.appendChild(modalContent);
    modalContainer.appendChild(modalDialog);
    
    // Agregar el modal al documento
    document.body.appendChild(modalContainer);
    
    // Crear la instancia de Bootstrap Modal
    const modal = new bootstrap.Modal(modalContainer);
    
    // Eliminar el modal del DOM cuando se oculte
    modalContainer.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modalContainer);
    });
    
    return {
        element: modalContainer,
        show: () => modal.show(),
        hide: () => modal.hide()
    };
}

/**
 * Crea un elemento de alerta
 * @param {string} message - Mensaje de la alerta
 * @param {string} type - Tipo de alerta (success, danger, warning, info)
 * @param {boolean} dismissible - Indica si la alerta se puede cerrar
 * @returns {HTMLElement} - Elemento de alerta
 */
function createAlert(message, type = 'info', dismissible = true) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} ${dismissible ? 'alert-dismissible fade show' : ''}`;
    alert.role = 'alert';
    
    alert.innerHTML = message;
    
    if (dismissible) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert');
        closeButton.setAttribute('aria-label', 'Close');
        
        alert.appendChild(closeButton);
    }
    
    return alert;
}

/**
 * Crea un elemento de tarjeta
 * @param {string} title - Título de la tarjeta
 * @param {HTMLElement|string} content - Contenido de la tarjeta
 * @param {string} headerClass - Clase adicional para el encabezado
 * @returns {HTMLElement} - Elemento de tarjeta
 */
function createCard(title, content, headerClass = '') {
    const card = document.createElement('div');
    card.className = 'card mb-4';
    
    if (title) {
        const cardHeader = document.createElement('div');
        cardHeader.className = `card-header ${headerClass}`;
        
        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title mb-0';
        cardTitle.textContent = title;
        
        cardHeader.appendChild(cardTitle);
        card.appendChild(cardHeader);
    }
    
    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    
    if (typeof content === 'string') {
        cardBody.innerHTML = content;
    } else {
        cardBody.appendChild(content);
    }
    
    card.appendChild(cardBody);
    
    return card;
}
