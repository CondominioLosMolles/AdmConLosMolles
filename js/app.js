/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Archivo principal de la aplicación
 */

const MODULES = {
    'dashboard': {
        title: 'Dashboard',
        icon: 'tachometer-alt'
    },
    'residentes': {
        title: 'Residentes',
        icon: 'users'
    },
    // ... Otros módulos
};

let currentModule = 'dashboard';

function initApp() {
    console.log('Inicializando CondoAdmin...');
    setupNavigation();
    checkAndCreateSheets().then(() => {
        loadModule('dashboard');
    }).catch(error => {
        console.error('Error al inicializar:', error);
    });
}

function setupNavigation() {
    const menuLinks = document.querySelectorAll('#main-menu .nav-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const module = link.getAttribute('data-module');
            window.location.hash = module;
            loadModule(module);
        });
    });

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash && MODULES[hash]) {
            loadModule(hash);
        }
    });

    const initialHash = window.location.hash.substring(1);
    if (initialHash && MODULES[initialHash]) {
        currentModule = initialHash;
    }
}

function loadModule(moduleName) {
    if (!MODULES[moduleName]) {
        console.error(`Módulo "${moduleName}" no encontrado`);
        return;
    }

    updateNavigation(moduleName);
    currentModule = moduleName;

    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>
    `;

    try {
        const initFunction = window[`init${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`];
        if (typeof initFunction === 'function') {
            initFunction(moduleContainer);
        } else {
            moduleContainer.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    El módulo "${MODULES[moduleName].title}" está en desarrollo.
                </div>
            `;
        }
    } catch (error) {
        moduleContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar el módulo "${MODULES[moduleName].title}": ${error.message}
            </div>
        `;
    }
}

function updateNavigation(activeModule) {
    const menuLinks = document.querySelectorAll('#main-menu .nav-link');
    menuLinks.forEach(link => {
        const module = link.getAttribute('data-module');
        if (module === activeModule) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

async function checkAndCreateSheets() {
    try {
        for (const [key, sheetName] of Object.entries(CONFIG.SHEETS)) {
            const exists = await sheetsAPI.sheetExists(sheetName);
            if (!exists) {
                let headers = [];
                switch (key) {
                    case 'RESIDENTES':
                        headers = ['Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero Parcela', 'Estado', 'Valor Gasto Comun'];
                        break;
                    case 'GASTOS_COMUNES':
                        headers = ['Periodo', 'Monto Base', 'Fondo Reserva', 'Total Unidad', 'Vencimiento', 'Estado'];
                        break;
                    // ... Otros casos
                }
                await sheetsAPI.createSheet(sheetName, headers);
            }
        }
    } catch (error) {
        console.error('Error al verificar hojas:', error);
    }
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatCurrency(amount) {
    return CONFIG.APP.CURRENCY + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
