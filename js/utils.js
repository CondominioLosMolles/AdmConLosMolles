// js/utils.js - Versión Mejorada

/**
 * Limpia todo el contenido del área principal de la aplicación.
 */
function limpiarMainContent() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = '';
    }
}

/**
 * Muestra el spinner de carga que ya existe en index.html.
 * Es más eficiente que crear y destruir el elemento cada vez.
 */
function mostrarSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = 'flex';
    }
}

/**
 * Oculta el spinner de carga.
 */
function ocultarSpinner() {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = 'none';
    }
}

/**
 * Muestra un mensaje flotante temporal en la parte inferior de la pantalla.
 * Mucho más profesional que un alert().
 * @param {string} mensaje - El texto del mensaje a mostrar.
 * @param {string} tipo - El tipo de mensaje ('success', 'error', 'info'). Afecta el color.
 */
function mostrarMensaje(mensaje, tipo = 'info') {
    // Crear el contenedor del mensaje
    const container = document.createElement('div');
    container.className = `mensaje-flotante ${tipo}`;
    container.textContent = mensaje;

    document.body.appendChild(container);

    // Hacer que el mensaje aparezca con una transición suave
    setTimeout(() => {
        container.classList.add('visible');
    }, 10);

    // Ocultar y eliminar el mensaje después de 3 segundos
    setTimeout(() => {
        container.classList.remove('visible');
        // Esperar a que la transición de opacidad termine antes de eliminar el elemento del DOM
        setTimeout(() => {
            container.remove();
        }, 500);
    }, 3000);
}
