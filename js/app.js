/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Archivo principal de la aplicación - Versión Corregida y Final
 */

// Módulos disponibles en la aplicación
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
                <i class="fas fa-${mod.icon} fa-fw me-2"></i> ${mod.title}
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
    if (!MODULES[moduleName]) {
        console.error(`Módulo "${moduleName}" no encontrado`);
        return;
    }
    
    updateNavigation(moduleName);
    currentModule = moduleName;
    
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center my-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="ms-3">Cargando módulo ${MODULES[moduleName].title}...</p>
        </div>
    `;
    
    try {
        const initFunction = window[MODULES[moduleName].init];
        if (typeof initFunction === 'function') {
            initFunction(moduleContainer);
        } else {
            throw new Error(`La función de inicialización ${MODULES[moduleName].init} no fue encontrada.`);
        }
    } catch (error) {
        console.error(`Error al cargar el módulo "${moduleName}":`, error);
        showDetailedError(`Error en Módulo: ${MODULES[moduleName].title}`, error, moduleContainer);
    }
}

function updateNavigation(activeModule) {
    document.querySelectorAll('#main-menu .nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-module') === activeModule);
    });
}

async function checkAndCreateSheets() {
    console.log("Verificando existencia de hojas de cálculo...");
    const requiredSheets = {
        RESIDENTES: ['ID','Nombre','Rut','Direccion','Email','Telefono','Numero_Parcela','Estado','Valor_Gasto_Comun'],
        GASTOS_COMUNES: ['ID','Periodo','Monto_Base','Fondo_Reserva','Total_Unidad','Vencimiento','Estado'],
        PAGOS: ['ID','Fecha','Residente','Concepto','Monto','Metodo_Pago'],
        GASTOS: ['ID','Fecha','Concepto','Monto','Proveedor','Categoria','Estado'],
        MANTENCIONES: ['ID','Fecha','Tipo','Descripcion','Responsable','Estado'],
        COMUNICACIONES: ['ID','Fecha','Asunto','Contenido','Destinatarios','Estado'],
        MULTAS: ['ID','Fecha','Residente','Motivo','Monto','Estado'],
        ASAMBLEAS: ['ID','Fecha','Tipo','Descripcion','Asistentes','Estado']
    };

    try {
        for (const [key, headers] of Object.entries(requiredSheets)) {
            const sheetName = CONFIG.SHEETS[key];
            const exists = await sheetsAPI.sheetExists(sheetName);
            if (!exists) {
                console.warn(`La hoja "${sheetName}" no existe. Creándola...`);
                await sheetsAPI.createSheet(sheetName, headers);
                console.log(`Hoja "${sheetName}" creada con encabezados.`);
            }
        }
        console.log('Verificación de hojas completada.');
    } catch (error) {
        console.error('Error crítico al verificar/crear hojas:', error);
        throw new Error('No se pudieron verificar las hojas de cálculo. La aplicación no puede continuar.');
    }
}

// Funciones de utilidad globales
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function showToast(message, type = 'success') {
    const toastContainer = document.createElement('div');
    toastContainer.className = `toast align-items-center text-white bg-${type} border-0 position-fixed top-0 end-0 m-3`;
    toastContainer.style.zIndex = "1056"; // Encima de los modales
    toastContainer.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toastContainer);
    const bsToast = new bootstrap.Toast(toastContainer, { delay: 5000 });
    bsToast.show();
    toastContainer.addEventListener('hidden.bs.toast', () => document.body.removeChild(toastContainer));
}

function showDetailedError(title, error, container) {
    console.error(title + ':', error);
    const errorMessage = error.message || 'Error desconocido';
    const errorDetails = error.stack || 'No hay detalles disponibles.';
    
    const alertContent = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading"><i class="fas fa-times-circle me-2"></i>${title}</h4>
            <p><strong>Mensaje:</strong> ${errorMessage}</p>
            <hr>
            <p class="mb-0 small"><strong>Detalles técnicos:</strong><br><code style="white-space: pre-wrap;">${errorDetails}</code></p>
        </div>
    `;
    
    if (container) {
        container.innerHTML = alertContent;
    } else {
        createModal('Error Crítico', alertContent, 'lg').show();
    }
}
