// Gestión de autenticación con Google OAuth 2.0
class AuthManager {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
    }

    // Inicializar la autenticación
    async init() {
        try {
            console.log('Inicializando autenticación...');
            
            // Verificar si las APIs de Google están disponibles
            if (typeof gapi === 'undefined') {
                console.log('API de Google no disponible, simulando autenticación para desarrollo...');
                this.simulateAuth();
                return;
            }

            // Cargar la API de Google
            await this.loadGoogleAPI();
            
            // Inicializar el cliente de autenticación
            gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: CONFIG.CLIENT_ID,
                    scope: CONFIG.SCOPES.join(' ')
                }).then(() => {
                    const authInstance = gapi.auth2.getAuthInstance();
                    this.isSignedIn = authInstance.isSignedIn.get();
                    
                    if (this.isSignedIn) {
                        this.currentUser = authInstance.currentUser.get();
                        this.accessToken = this.currentUser.getAuthResponse().access_token;
                        this.showMainApp();
                    } else {
                        this.showAuthScreen();
                    }
                }).catch((error) => {
                    console.error('Error inicializando Google Auth:', error);
                    console.log('Fallback: simulando autenticación para desarrollo...');
                    this.simulateAuth();
                });
            });
        } catch (error) {
            console.error('Error inicializando autenticación:', error);
            console.log('Fallback: simulando autenticación para desarrollo...');
            this.simulateAuth();
        }
    }

    // Simular autenticación para desarrollo
    simulateAuth() {
        console.log('Simulando autenticación exitosa...');
        setTimeout(() => {
            this.isSignedIn = true;
            this.currentUser = {
                getBasicProfile: () => ({
                    getName: () => 'Administrador del Sistema'
                })
            };
            this.accessToken = 'simulated-token';
            this.showMainApp();
        }, 2000);
    }

    // Cargar la API de Google
    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
            } else {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }
        });
    }

    // Manejar la respuesta de autenticación
    handleCredentialResponse(response) {
        try {
            // Decodificar el JWT token
            const payload = this.parseJwt(response.credential);
            
            // Verificar que el email sea el autorizado
            if (payload.email !== CONFIG.ADMIN_EMAIL) {
                this.showError('Acceso denegado. Solo el administrador autorizado puede acceder al sistema.');
                return;
            }

            // Proceder con la autenticación OAuth 2.0
            this.signIn();
        } catch (error) {
            console.error('Error manejando credenciales:', error);
            this.showError('Error en la autenticación');
        }
    }

    // Iniciar sesión
    async signIn() {
        try {
            if (typeof gapi === 'undefined' || !gapi.auth2) {
                console.log('Google Auth no disponible, usando simulación...');
                this.simulateAuth();
                return;
            }

            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();
            
            this.currentUser = user;
            this.accessToken = user.getAuthResponse().access_token;
            this.isSignedIn = true;
            
            this.showMainApp();
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            this.showError('Error al iniciar sesión');
        }
    }

    // Cerrar sesión
    async signOut() {
        try {
            if (typeof gapi !== 'undefined' && gapi.auth2) {
                const authInstance = gapi.auth2.getAuthInstance();
                await authInstance.signOut();
            }
            
            this.currentUser = null;
            this.accessToken = null;
            this.isSignedIn = false;
            
            // Recargar la página para reiniciar
            location.reload();
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Recargar la página como fallback
            location.reload();
        }
    }

    // Mostrar la aplicación principal
    showMainApp() {
        console.log('Mostrando aplicación principal...');
        
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        
        // Mostrar información del usuario
        const userInfo = document.getElementById('user-info');
        if (this.currentUser && userInfo) {
            const profile = this.currentUser.getBasicProfile();
            userInfo.textContent = `Bienvenido, ${profile.getName()}`;
        }
        
        // Inicializar la aplicación
        if (window.App) {
            console.log('Inicializando aplicación...');
            window.App.init();
        } else {
            console.error('window.App no está disponible');
        }
    }

    // Mostrar pantalla de autenticación
    showAuthScreen() {
        console.log('Mostrando pantalla de autenticación...');
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
    }

    // Mostrar error
    showError(message) {
        console.error('Error de autenticación:', message);
        alert(message); // Temporal, se puede mejorar con un modal
    }

    // Parsear JWT token
    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    // Obtener token de acceso
    getAccessToken() {
        return this.accessToken;
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return this.isSignedIn && this.accessToken;
    }
}

// Crear instancia global del gestor de autenticación
window.authManager = new AuthManager();

// Función global para manejar la respuesta de credenciales (llamada por Google)
window.handleCredentialResponse = function(response) {
    window.authManager.handleCredentialResponse(response);
};

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, configurando autenticación...');
    
    // Configurar el botón de cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            window.authManager.signOut();
        });
    }
    
    // Inicializar la autenticación
    window.authManager.init();
});

