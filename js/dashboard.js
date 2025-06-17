// js/dashboard.js

async function cargarDashboard() {
  limpiarMainContent();
  
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Dashboard</h2>
    <p>El dashboard está temporalmente desactivado para poder trabajar en los otros módulos.</p>
    <p>Por favor, selecciona una opción del menú de la izquierda.</p>
  `;
}

// No se necesita el event listener si el dashboard se carga por defecto al inicio.
// Si el usuario hace clic, se volverá a cargar esta vista vacía.
document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
