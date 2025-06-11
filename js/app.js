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

            console.log('Iniciando aplicación...');

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
            // Mostrar error en el contenedor principal
            const container = document.getElementById('content-container');
            if (container) {
                container.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Error de Inicialización</h2>
                        </div>
                        <div class="card-body">
                            <p>Error al inicializar la aplicación: ${error.message}</p>
                            <button onclick="window.App.init()" class="btn btn-primary">Reintentar</button>
                        </div>
                    </div>
                `;
            }
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
        console.log('Módulos registrados:', Object.keys(this.modules));
    }

    // Configurar navegación del menú lateral
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const moduleId = item.getAttribute('data-module');
                if (moduleId) {
                    console.log('Navegando a módulo:', moduleId);
                    
                    // Actualizar estado visual del menú
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                    
                    // Cargar módulo
                    await this.loadModule(moduleId);
                }
            });
        });
        console.log('Navegación configurada para', navItems.length, 'elementos');
    }

    // Configurar modales
    setupModals() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.getElementById('modal-close');

        if (modalOverlay) {
            // Cerrar modal al hacer clic en el overlay
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        if (modalClose) {
            // Cerrar modal con el botón X
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay && !modalOverlay.classList.contains('hidden')) {
                this.closeModal();
            }
        });
        console.log('Modales configurados');
    }

    // Cargar módulo específico
    async loadModule(moduleId) {
        try {
            console.log(`Cargando módulo: ${moduleId}`);
            
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
                console.log(`Módulo ${moduleId} renderizado correctamente`);
            } else {
                throw new Error(`Módulo ${moduleId} no tiene método render`);
            }

        } catch (error) {
            console.error(`Error cargando módulo ${moduleId}:`, error);
            const container = document.getElementById('content-container');
            if (container) {
                container.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h2 class="card-title">Error al Cargar Módulo</h2>
                        </div>
                        <div class="card-body">
                            <p>Error cargando el módulo ${moduleId}: ${error.message}</p>
                            <button onclick="window.App.loadModule('dashboard')" class="btn btn-primary">Volver al Dashboard</button>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Abrir modal
    openModal(title, content, footer = '') {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');

        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) modalBody.innerHTML = content;
        if (modalFooter) modalFooter.innerHTML = footer;
        if (modalOverlay) modalOverlay.classList.remove('hidden');
    }

    // Cerrar modal
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.add('hidden');
        }
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

// Crear instancia global de la aplicación
window.App = new App();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');
    
    // Simular autenticación exitosa para desarrollo
    setTimeout(() => {
        // Ocultar pantalla de carga
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        // Mostrar aplicación principal
        const mainApp = document.getElementById('main-app');
        if (mainApp) {
            mainApp.classList.remove('hidden');
        }
        
        // Configurar botón de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Simular logout
                location.reload();
            });
        }
        
        // Mostrar información del usuario
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.textContent = 'Administrador del Sistema';
        }
        
        // Inicializar la aplicación
        window.App.init();
    }, 2000); // Simular tiempo de carga
});

