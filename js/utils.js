// js/utils.js - Versión Final con Manejo de Modal Global

function limpiarMainContent() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) mainContent.innerHTML = '';
}

function mostrarSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) spinner.style.display = 'flex';
}

function ocultarSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) spinner.style.display = 'none';
}

function mostrarMensaje(msg, tipo = 'info') {
    const container = document.createElement('div');
    container.className = `mensaje-flotante ${tipo}`;
    container.textContent = msg;
    document.body.appendChild(container);
    setTimeout(() => { container.classList.add('visible'); }, 10);
    setTimeout(() => {
        container.classList.remove('visible');
        setTimeout(() => { container.remove(); }, 500);
    }, 3000);
}

/**
 * Muestra y configura el modal global.
 * @param {string} titulo - El título que aparecerá en el modal.
 * @param {string} cuerpoHtml - El contenido HTML del formulario o cuerpo del modal.
 * @param {Function} callbackGuardar - La función que se ejecutará al hacer clic en "Guardar".
 * @param {string} tamano - Opcional. 'large' para un modal más ancho.
 */
function mostrarModalGlobal(titulo, cuerpoHtml, callbackGuardar, tamano = 'normal') {
    const modalContainer = document.getElementById('global-modal-container');
    const modalContent = document.getElementById('global-modal-content');
    const modalTitle = document.getElementById('global-modal-title');
    const modalBody = document.getElementById('global-modal-body');
    const saveBtn = document.getElementById('global-modal-save');
    const closeBtn = document.getElementById('global-modal-close');

    if (!modalContainer) {
        console.error('El contenedor de modal global no existe en index.html');
        return;
    }

    modalTitle.textContent = titulo;
    modalBody.innerHTML = cuerpoHtml;

    // Asignar el evento al botón de guardar. Se clona para evitar listeners duplicados.
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.onclick = callbackGuardar;

    closeBtn.onclick = ocultarModalGlobal;
    
    if (tamano === 'large') {
        modalContent.classList.add('large');
    } else {
        modalContent.classList.remove('large');
    }

    modalContainer.style.display = 'flex';
}

/**
 * Oculta el modal global y limpia su contenido.
 */
function ocultarModalGlobal() {
    const modalContainer = document.getElementById('global-modal-container');
    if (modalContainer) {
        modalContainer.style.display = 'none';
        document.getElementById('global-modal-body').innerHTML = '';
    }
}

// =====================================================================================
// ===== PEGA ESTA FUNCIÓN COMPLETA AL FINAL DE TU ARCHIVO js/utils.js ==============
// =====================================================================================

/**
 * Función central para comunicarse con la API de Google Apps Script.
 * @param {string} functionName - El nombre de la función a ejecutar en el script de Google.
 * @param {Array} parameters - Un array con los parámetros para la función del script.
 * @returns {Promise<any>} - La respuesta del script.
 */
// js/utils.js

// js/utils.js

// js/utils.js

async function llamarAPI(functionName, parameters = []) {
    // ▼▼▼ USA EL ID QUE ACABAS DE ENCONTRAR AQUÍ ▼▼▼
    const SCRIPT_ID = "AKfycbx9qaJJhJEqwdH01y79DcCX3g0wptlTgPm5GhvYB6HLtAZTSo9SiGZT3eB2QNp1Aqb25w"; 
    
    try {
        const token = gapi.auth.getToken().access_token;

        const res = await gapi.client.request({
            'path': `https://script.googleapis.com/v1/scripts/${SCRIPT_ID}:run`,
            'method': 'POST',
            'headers': {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            'body': {
                'function': functionName,
                'parameters': parameters
            }
        });

        // ... el resto de la función como te la pasé antes ...
        const result = res.result;
        if (result.error) {
            const errorMessage = result.error.details?.[0]?.errorMessage || result.error.message || 'Error en script.';
            throw new Error(errorMessage);
        }
        return result.response.result;

    } catch (error) {
        console.error(`Error llamando a la función '${functionName}':`, error);
        throw error.result ? new Error(error.result.error.message) : error;
    }
}
// ========================================================
//      FUNCIONES GLOBALES PARA SPINNER DE CARGA
// ========================================================

function showSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.display = 'flex';
  }
}

function hideSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.style.display = 'none';
  }
}
