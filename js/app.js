/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Archivo principal de la aplicación - Versión Corregida
 */

// Módulos disponibles en la aplicación
const MODULES = {
    'dashboard': {
        title: 'Dashboard',
        icon: 'tachometer-alt'
    },
    'residentes': {
        title: 'Residentes',
        icon: 'users'
    },
    'gastos-comunes': {
        title: 'Gastos Comunes',
        icon: 'file-invoice-dollar'
    },
    'contabilidad': {
        title: 'Contabilidad',
        icon: 'chart-line'
    },
    'mantenciones': {
        title: 'Mantenciones',
        icon: 'tools'
    },
    'comunicaciones': {
        title: 'Comunicaciones',
        icon: 'envelope'
    },
    'multas': {
        title: 'Multas',
        icon: 'exclamation-triangle'
    },
    'asambleas': {
        title: 'Asambleas',
        icon: 'users-cog'
    },
    'informes': {
        title: 'Informes',
        icon: 'file-alt'
    }
};

// Variables globales
let currentModule = 'dashboard';

/**
 * Inicializa la aplicación
 */
function initApp() {
    console.log('Inicializando CondoAdmin...');
    
    // Configurar eventos de navegación
    setupNavigation();
    
    // Verificar y crear las hojas necesarias
    checkAndCreateSheets().then(() => {
        // Cargar el módulo inicial (dashboard)
        loadModule('dashboard');
    }).catch(error => {
        console.error('Error al inicializar la aplicación:', error);
        showError('Error al inicializar la aplicación: ' + error.message);
    });
}

/**
 * Configura los eventos de navegación
 */
function setupNavigation() {
    const menuLinks = document.querySelectorAll('#main-menu .nav-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Obtener el módulo a cargar
            const module = link.getAttribute('data-module');
            
            // Actualizar la URL con el hash
            window.location.hash = module;
            
            // Cargar el módulo
            loadModule(module);
        });
    });
    
    // Manejar cambios en el hash de la URL
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash && MODULES[hash]) {
            loadModule(hash);
        }
    });
    
    // Cargar el módulo inicial basado en el hash de la URL
    const initialHash = window.location.hash.substring(1);
    if (initialHash && MODULES[initialHash]) {
        currentModule = initialHash;
    }
}

/**
 * Carga un módulo específico
 * @param {string} moduleName - Nombre del módulo a cargar
 */
function loadModule(moduleName) {
    if (!MODULES[moduleName]) {
        console.error(`Módulo "${moduleName}" no encontrado`);
        return;
    }
    
    // Actualizar la navegación
    updateNavigation(moduleName);
    
    // Actualizar el módulo actual
    currentModule = moduleName;
    
    // Mostrar el indicador de carga
    const moduleContainer = document.getElementById('module-container');
    moduleContainer.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>
    `;
    
    // Cargar el módulo
    try {
        // Verificar si existe la función de inicialización del módulo
        const initFunction = window[`init${moduleName.charAt(0).toUpperCase() + moduleName.slice(1).replace('-', '')}Module`];
        
        if (typeof initFunction === 'function') {
            // Llamar a la función de inicialización del módulo
            initFunction(moduleContainer);
        } else {
            console.error(`Función de inicialización para el módulo "${moduleName}" no encontrada`);
            moduleContainer.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    El módulo "${MODULES[moduleName].title}" está en desarrollo.
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error al cargar el módulo "${moduleName}":`, error);
        moduleContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i>
                Error al cargar el módulo "${MODULES[moduleName].title}": ${error.message}
            </div>
        `;
    }
}

/**
 * Actualiza la navegación
 * @param {string} activeModule - Nombre del módulo activo
 */
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

/**
 * Verifica y crea las hojas necesarias en Google Sheets
 */
async function checkAndCreateSheets() {
    try {
        // Verificar si existen las hojas necesarias
        for (const [key, sheetName] of Object.entries(window.CONFIG.SHEETS)) {
            const exists = await sheetsAPI.sheetExists(sheetName);
            
            if (!exists) {
                console.log(`Creando hoja "${sheetName}"...`);
                
                // Definir los encabezados según el tipo de hoja
                let headers = [];
                
                switch (key) {
                    case 'RESIDENTES':
                        headers = ['Nombre', 'Rut', 'Direccion', 'Email', 'Telefono', 'Numero_Parcela', 'Estado', 'Valor_Gasto_Comun'];
                        break;
                    case 'GASTOS_COMUNES':
                        headers = ['ID', 'Periodo', 'Monto_Base', 'Fondo_Reserva', 'Total_Unidad', 'Vencimiento', 'Estado'];
                        break;
                    case 'PAGOS':
                        headers = ['ID', 'Fecha', 'Residente', 'Concepto', 'Monto', 'Método_Pago'];
                        break;
                    case 'GASTOS':
                        headers = ['ID', 'Fecha', 'Concepto', 'Monto', 'Proveedor', 'Categoría', 'Estado'];
                        break;
                    case 'MANTENCIONES':
                        headers = ['ID', 'Fecha', 'Tipo', 'Descripción', 'Responsable', 'Estado'];
                        break;
                    case 'COMUNICACIONES':
                        headers = ['ID', 'Fecha', 'Asunto', 'Contenido', 'Destinatarios', 'Estado'];
                        break;
                    case 'MULTAS':
                        headers = ['ID', 'Fecha', 'Residente', 'Motivo', 'Monto', 'Estado'];
                        break;
                    case 'ASAMBLEAS':
                        headers = ['ID', 'Fecha', 'Tipo', 'Descripción', 'Asistentes', 'Estado'];
                        break;
                    default:
                        headers = ['ID', 'Nombre', 'Descripción'];
                }
                
                // Crear la hoja con los encabezados
                await sheetsAPI.createSheet(sheetName, headers);
            }
        }
        
        console.log('Verificación de hojas completada');
    } catch (error) {
        console.error('Error al verificar/crear hojas:', error);
        throw error;
    }
}

/**
 * Genera un ID único
 * @returns {string} - ID único
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Formatea una fecha en formato DD/MM/YYYY
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Formatea un número como moneda
 * @param {number} amount - Monto a formatear
 * @returns {string} - Monto formateado
 */
function formatCurrency(amount) {
    return CONFIG.APP.CURRENCY + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Muestra un error detallado
 * @param {string} title - Título del error
 * @param {Error} error - Objeto de error
 */
function showDetailedError(title, error) {
    console.error(title + ':', error);
    
    const errorMessage = error.message || 'Error desconocido';
    const errorDetails = error.stack || 'No hay detalles adicionales disponibles';
    
    const alertContent = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading"><i class="fas fa-exclamation-circle me-2"></i>${title}</h4>
            <p><strong>Mensaje:</strong> ${errorMessage}</p>
            <hr>
            <p class="mb-0"><small><strong>Detalles técnicos:</strong><br><code>${errorDetails}</code></small></p>
        </div>
    `;
    
    // Mostrar en un modal si es posible
    if (typeof createModal === 'function') {
        const modal = createModal('Error', alertContent, 'lg');
        modal.show();
    } else {
        // Fallback: mostrar en consola y alert
        alert(`${title}: ${errorMessage}`);
    }
}

/**
 * Muestra un error simple
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    console.error('Error:', message);
    
    if (typeof createAlert === 'function') {
        const alert = createAlert(message, 'danger', true);
        document.body.appendChild(alert);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (document.body.contains(alert)) {
                document.body.removeChild(alert);
            }
        }, 5000);
    } else {
        // Fallback
        alert('Error: ' + message);
    }
}
