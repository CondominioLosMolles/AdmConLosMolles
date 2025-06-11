// Aplicación principal - Controlador de la aplicación
class App {
    constructor() {
        this.currentModule = null;
        this.modules = {};
        this.isInitialized = false;
    }

    // Inicializar la aplicación
    async init() {
        try {
            if (this.isInitialized) return;

            // Inicializar APIs de Google
            await window.googleAPI.init();

            // Registrar módulos
            this.registerModules();

            // Configurar navegación
            this.setupNavigation();

            // Configurar modales
            this.setupModals();

            // Cargar módulo inicial (Dashboard)
            await this.loadModule('dashboard');

            this.isInitialized = true;
            console.log('Aplicación inicializada correctamente');

        } catch (error) {
            console.error('Error inicializando aplicación:', error);
            Utils.showToast('Error inicializando la aplicación', 'error');
        }
    }

    // Registrar módulos disponibles
    registerModules() {
        this.modules = {
            'dashboard': new DashboardModule(),
            'residentes': new ResidentesModule(),
            'gastos-comunes': new GastosComunesModule(),
            'contabilidad': new ContabilidadModule(),
            'comunicaciones': new ComunicacionesModule(),
            'mantenciones': new MantencionesModule(),
            'multas': new MultasModule(),
            'asambleas': new AsambleasModule(),
            'informes': new InformesModule()
        };
    }

    // Configurar navegación del menú lateral
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const moduleId = item.getAttribute('data-module');
                if (moduleId) {
                    // Actualizar estado visual del menú
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                    
                    // Cargar módulo
                    await this.loadModule(moduleId);
                }
            });
        });
    }

    // Configurar modales
    setupModals() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.getElementById('modal-close');

        // Cerrar modal al hacer clic en el overlay
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });

        // Cerrar modal con el botón X
        modalClose.addEventListener('click', () => {
            this.closeModal();
        });

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    // Cargar módulo específico
    async loadModule(moduleId) {
        try {
            // Destruir módulo anterior si existe
            if (this.currentModule && typeof this.currentModule.destroy === 'function') {
                this.currentModule.destroy();
            }

            // Verificar que el módulo existe
            if (!this.modules[moduleId]) {
                throw new Error(`Módulo ${moduleId} no encontrado`);
            }

            // Cargar nuevo módulo
            this.currentModule = this.modules[moduleId];
            
            // Renderizar módulo
            if (typeof this.currentModule.render === 'function') {
                await this.currentModule.render();
            } else {
                throw new Error(`Módulo ${moduleId} no tiene método render`);
            }

            console.log(`Módulo ${moduleId} cargado correctamente`);

        } catch (error) {
            console.error(`Error cargando módulo ${moduleId}:`, error);
            Utils.showError('content-container', `Error cargando el módulo ${moduleId}`);
        }
    }

    // Abrir modal
    openModal(title, content, footer = '') {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modalFooter.innerHTML = footer;

        modalOverlay.classList.remove('hidden');
    }

    // Cerrar modal
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.add('hidden');
    }

    // Recargar módulo actual
    async reloadCurrentModule() {
        if (this.currentModule && typeof this.currentModule.render === 'function') {
            await this.currentModule.render();
        }
    }

    // Obtener módulo actual
    getCurrentModule() {
        return this.currentModule;
    }
}

// Módulos base (placeholders hasta que se implementen)
class ResidentesModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Gestión de Residentes</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class GastosComunesModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Gastos Comunes</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class ContabilidadModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Contabilidad</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class ComunicacionesModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Comunicaciones</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class MantencionesModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Mantenciones</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class MultasModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Multas</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class AsambleasModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Asambleas</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

class InformesModule {
    async render() {
        const container = document.getElementById('content-container');
        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">Informes</h2>
                </div>
                <p>Módulo en desarrollo...</p>
            </div>
        `;
    }
}

// Crear instancia global de la aplicación
window.App = new App();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // La aplicación se inicializará cuando la autenticación esté completa
    console.log('DOM cargado, esperando autenticación...');
});

