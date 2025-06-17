// ===== APLICACIÓN PRINCIPAL =====
class CondominioApp {
    constructor() {
        this.currentModule = 'dashboard';
        this.user = null;
        this.isAuthenticated = false;
        this.sidebarOpen = false;
        
        this.init();
    }

    async init() {
        try {
            // Mostrar pantalla de carga
            this.showLoadingScreen();
            
            // Inicializar Google APIs
            await this.initGoogleAPIs();
            
            // Verificar autenticación
            await this.checkAuthentication();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Ocultar pantalla de carga
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Error inicializando la aplicación:', error);
            this.showNotification('Error al inicializar la aplicación', 'error');
        }
    }

    async initGoogleAPIs() {
        return new Promise((resolve, reject) => {
            gapi.load('auth2:client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU',
                        clientId: '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com',
                        discoveryDocs: [
                            'https://sheets.googleapis.com/$discovery/rest?version=v4',
                            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
                            'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
                        ],
                        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send'
                    });
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async checkAuthentication() {
        const authInstance = gapi.auth2.getAuthInstance();
        if (authInstance.isSignedIn.get()) {
            const user = authInstance.currentUser.get();
            const profile = user.getBasicProfile();
            
            // Verificar que sea el email correcto
            if (profile.getEmail() === 'losmollestunquen@gmail.com') {
                this.user = {
                    name: profile.getName(),
                    email: profile.getEmail(),
                    avatar: profile.getImageUrl()
                };
                this.isAuthenticated = true;
                this.showMainApp();
            } else {
                this.showNotification('Debe iniciar sesión con la cuenta losmollestunquen@gmail.com', 'error');
                await authInstance.signOut();
                this.showLoginScreen();
            }
        } else {
            this.showLoginScreen();
        }
    }

    setupEventListeners() {
        // Toggle sidebar
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Navegación
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const module = item.dataset.module;
                this.navigateToModule(module);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Cerrar sidebar en móvil al hacer click fuera
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.sidebarOpen) {
                const sidebar = document.getElementById('sidebar');
                const menuToggle = document.getElementById('menu-toggle');
                
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });

        // Responsive
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeSidebar();
            }
        });
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.remove('hidden');
        loginScreen.classList.add('hidden');
        mainApp.classList.add('hidden');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
    }

    showLoginScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }

    showMainApp() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        
        loadingScreen.classList.add('hidden');
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');

        // Actualizar información del usuario
        this.updateUserInfo();
        
        // Cargar módulo inicial
        this.navigateToModule('dashboard');
    }

    updateUserInfo() {
        if (this.user) {
            const userAvatar = document.getElementById('user-avatar');
            const userName = document.getElementById('user-name');
            
            if (userAvatar) userAvatar.src = this.user.avatar;
            if (userName) userName.textContent = this.user.name;
        }
    }

    toggleSidebar() {
        if (window.innerWidth <= 768) {
            this.sidebarOpen ? this.closeSidebar() : this.openSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = this.getOrCreateSidebarOverlay();
        
        sidebar.classList.add('open');
        overlay.classList.add('show');
        this.sidebarOpen = true;
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
        this.sidebarOpen = false;
    }

    getOrCreateSidebarOverlay() {
        let overlay = document.querySelector('.sidebar-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', () => this.closeSidebar());
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    async navigateToModule(moduleName) {
        // Actualizar navegación activa
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.module === moduleName) {
                item.classList.add('active');
            }
        });

        // Cerrar sidebar en móvil
        if (window.innerWidth <= 768) {
            this.closeSidebar();
        }

        this.currentModule = moduleName;

        // Cargar contenido del módulo
        try {
            await this.loadModuleContent(moduleName);
        } catch (error) {
            console.error(`Error cargando módulo ${moduleName}:`, error);
            this.showNotification(`Error al cargar el módulo ${moduleName}`, 'error');
        }
    }

    async loadModuleContent(moduleName) {
        const contentArea = document.getElementById('content-area');
        
        // Mostrar indicador de carga
        contentArea.innerHTML = '<div class="text-center"><div class="loading-spinner"></div><p>Cargando...</p></div>';

        switch (moduleName) {
            case 'dashboard':
                if (typeof DashboardModule !== 'undefined') {
                    await DashboardModule.render(contentArea);
                }
                break;
            case 'residentes':
                if (typeof ResidentesModule !== 'undefined') {
                    await ResidentesModule.render(contentArea);
                }
                break;
            case 'gastos':
                if (typeof GastosModule !== 'undefined') {
                    await GastosModule.render(contentArea);
                }
                break;
            case 'contabilidad':
                if (typeof ContabilidadModule !== 'undefined') {
                    await ContabilidadModule.render(contentArea);
                }
                break;
            case 'comunicaciones':
                if (typeof ComunicacionesModule !== 'undefined') {
                    await ComunicacionesModule.render(contentArea);
                }
                break;
            case 'mantenciones':
                if (typeof MantencionesModule !== 'undefined') {
                    await MantencionesModule.render(contentArea);
                }
                break;
            case 'multas':
                if (typeof MultasModule !== 'undefined') {
                    await MultasModule.render(contentArea);
                }
                break;
            case 'asambleas':
                if (typeof AsambleasModule !== 'undefined') {
                    await AsambleasModule.render(contentArea);
                }
                break;
            case 'informes':
                if (typeof InformesModule !== 'undefined') {
                    await InformesModule.render(contentArea);
                }
                break;
            default:
                contentArea.innerHTML = '<div class="text-center"><h2>Módulo no encontrado</h2></div>';
        }
    }

    async logout() {
        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();
            
            this.user = null;
            this.isAuthenticated = false;
            this.showLoginScreen();
            this.showNotification('Sesión cerrada correctamente', 'success');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showNotification('Error al cerrar sesión', 'error');
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer;">&times;</button>
            </div>
        `;

        notifications.appendChild(notification);

        // Mostrar notificación
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-remover después del tiempo especificado
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    showModal(title, content, actions = []) {
        const overlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');

        const actionsHTML = actions.map(action => 
            `<button class="btn ${action.class || 'btn-primary'}" onclick="${action.onclick}">${action.text}</button>`
        ).join('');

        modalContent.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="app.hideModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            <div class="modal-footer">
                ${actionsHTML}
                <button class="btn btn-outline" onclick="app.hideModal()">Cancelar</button>
            </div>
        `;

        overlay.classList.remove('hidden');
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('show');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

// Función global para manejar la respuesta de autenticación de Google
function handleCredentialResponse(response) {
    // Esta función será llamada por Google Identity Services
    console.log('Credential response:', response);
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CondominioApp();
});

// Exportar para uso global
window.CondominioApp = CondominioApp;

