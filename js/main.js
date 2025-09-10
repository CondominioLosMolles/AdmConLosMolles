// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('#sidebar .list-group-item');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();

            // Marcar el link activo
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Cargar el módulo correspondiente
            const moduleName = link.dataset.module;
            cargarModulo(moduleName);
        });
    });
});

function cargarModulo(moduleName) {
    // Convierte "gastos_comunes" en "cargarGastos_comunes"
    const functionName = `cargar${moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace(/_([a-z])/g, g => g[1].toUpperCase())}`;

    // Verifica si la función existe globalmente antes de llamarla
    if (typeof window[functionName] === 'function') {
        window[functionName]();
    } else {
        console.error(`La función ${functionName} no está definida.`);
        document.getElementById('main-content').innerHTML = `
            <div class="alert alert-danger">
                <h4>Error de Carga</h4>
                <p>El módulo "${moduleName}" no se pudo cargar porque la función <strong>${functionName}</strong> no se encontró.</p>
                <p>Asegúrate de que el archivo <strong>js/${moduleName}.js</strong> esté incluido correctamente en el HTML.</p>
            </div>
        `;
    }
}
