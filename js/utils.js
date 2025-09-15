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
async function llamarAPI(functionName, parameters = []) {
    // URL configurada correctamente
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwH_B0SiUB7YNfE7vplBBz6BRiHBQJfg7z_DqjJVl0FKYEjs_UIj2DE-N9a8ms-pAcrMA/exec";

    // El bloque "if" de seguridad ha sido eliminado.

    try {
        const token = gapi.auth.getToken().access_token;
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                functionName: functionName,
                parameters: parameters
            }),
        });

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Error en la respuesta del servidor (HTTP ${res.status}): ${errorBody}`);
        }

        const jsonResponse = await res.json();

        if (jsonResponse.error) {
            console.error('Error devuelto por la API:', jsonResponse.error);
            throw new Error(jsonResponse.error.message || 'Ocurrió un error en el script de Google.');
        }

        return jsonResponse.response;

    } catch (error) {
        console.error(`Error llamando a la función '${functionName}':`, error);
        throw error;
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
