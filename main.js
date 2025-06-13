const contenedor = document.getElementById('contenedor-principal');
const enlaces = document.querySelectorAll('nav.sidebar a');

async function cargarModulo(nombreModulo) {
  try {
    const response = await fetch(`modulos/${nombreModulo}/${nombreModulo}.html`);
    if (!response.ok) throw new Error(`No se pudo cargar el módulo ${nombreModulo}`);
    const html = await response.text();
    contenedor.innerHTML = html;

    // Cargar script específico del módulo
    const scriptExistente = document.getElementById('script-modulo');
    if (scriptExistente) scriptExistente.remove();

    const script = document.createElement('script');
    script.id = 'script-modulo';
    script.type = 'module';
    script.src = `modulos/${nombreModulo}/${nombreModulo}.js`;
    document.body.appendChild(script);
  } catch (error) {
    contenedor.innerHTML = `<p class="error">Error cargando módulo: ${error.message}</p>`;
  }
}

enlaces.forEach(enlace => {
  enlace.addEventListener('click', e => {
    e.preventDefault();
    const modulo = enlace.getAttribute('data-modulo');
    cargarModulo(modulo);
  });
});

// Cargar módulo dashboard por defecto al iniciar
window.addEventListener('DOMContentLoaded', () => {
  cargarModulo('dashboard');
});
