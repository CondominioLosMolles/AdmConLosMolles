/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Archivo principal de la aplicación - Versión final y estable
 */

const MODULES = {
    'dashboard': { title: 'Dashboard', icon: 'tachometer-alt', init: 'initDashboardModule' },
    'residentes': { title: 'Residentes', icon: 'users', init: 'initResidentesModule' },
    'gastos-comunes': { title: 'Gastos Comunes', icon: 'file-invoice-dollar', init: 'initGastoscomunesModule' },
    'contabilidad': { title: 'Contabilidad', icon: 'chart-line', init: 'initContabilidadModule' },
    'mantenciones': { title: 'Mantenciones', icon: 'tools', init: 'initMantencionesModule' },
    'comunicaciones': { title: 'Comunicaciones', icon: 'envelope', init: 'initComunicacionesModule' },
    'multas': { title: 'Multas', icon: 'exclamation-triangle', init: 'initMultasModule' },
    'asambleas': { title: 'Asambleas', icon: 'users-cog', init: 'initAsambleasModule' },
    'informes': { title: 'Informes', icon: 'file-alt', init: 'initInformesModule' }
};

let currentModule = 'dashboard';

function initApp() {
    console.log('Inicializando CondoAdmin...');
    setupNavigation();
    
    checkAndCreateSheets().then(() => {
        const initialHash = window.location.hash.substring(1) || 'dashboard';
        loadModule(initialHash);
    }).catch(error => {
        console.error('Error fatal al inicializar la aplicación:', error);
        showDetailedError('Error de Inicialización', error, document.getElementById('module-container'));
    });
}

function setupNavigation() {
    const mainMenu = document.getElementById('main-menu');
    mainMenu.innerHTML = Object.entries(MODULES).map(([key, mod]) => `
        <li class="nav-item">
            <a class="nav-link" href="#${key}" data-module="${key}">
                <i class="fas fa-${mod.icon} fa-fw me-2"></i> <span>${mod.title}</span>
            </a>
        </li>
    `).join('');
    
    mainMenu.addEventListener('click', (event) => {
        const link = event.target.closest('.nav-link');
        if (link) {
            event.preventDefault();
            const module = link.getAttribute('data-module');
            window.location.hash = module;
        }
    });
    
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1) || 'dashboard';
        if (hash && MODULES[hash]) loadModule(hash);
    });
}

function loadModule(moduleName) {
    const moduleConfig = MODULES[moduleName];
    if (!moduleConfig) {
        console.error(`Módulo "${moduleName}" no encontrado en la configuración.`);
        document.getElementById('module-container').innerHTML = `<div class="alert alert-danger">Módulo no encontrado.</div>`;
        return;
    }
    
    updateNavigation(moduleName);
    currentModule = moduleName;
    
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = `<div class="d-flex justify-content-center align-items-center my-5"><div class="spinner-border text-primary" role="status"></div><p class="ms-3">Cargando módulo ${moduleConfig.title}...</p></div>`;
    
    try {
        const initFunction = window[moduleConfig.init];
        if (typeof initFunction === 'function') {
            initFunction(moduleContainer);
        } else {
            throw new Error(`La función de inicialización ${moduleConfig.init} no fue encontrada. Asegúrate de que el archivo del módulo esté cargado correctamente.`);
        }
    } catch (error) {
        console.error(`Error al cargar el módulo "${moduleName}":`, error);
        showDetailedError(`Error en Módulo: ${moduleConfig.title}`, error, moduleContainer);
    }
}

function updateNavigation(activeModule) {
    document.querySelectorAll('#main-menu .nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-module') === activeModule);
    });
}

async function checkAndCreateSheets() {
    // ... (esta función se mantiene igual, no es necesario cambiarla)
}

// ... (el resto de funciones de utilidad como generateUniqueId, showToast, etc., se mantienen igual)
