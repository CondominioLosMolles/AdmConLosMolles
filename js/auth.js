// ===== AUTENTICACIÓN CON GOOGLE =====
class GoogleAuth {
    constructor() {
        this.authInstance = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            await this.loadGoogleAPI();
            await this.initializeAuth();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error inicializando Google Auth:', error);
            throw error;
        }
    }

    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async initializeAuth() {
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
                        scope: [
                            'https://www.googleapis.com/auth/spreadsheets',
                            'https://www.googleapis.com/auth/drive.file',
                            'https://www.googleapis.com/auth/gmail.send',
                            'https://www.googleapis.com/auth/gmail.compose'
                        ].join(' ')
                    });

                    this.authInstance = gapi.auth2.getAuthInstance();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    async signIn() {
        if (!this.authInstance) {
            throw new Error('Auth no inicializado');
        }

        try {
            const user = await this.authInstance.signIn();
            const profile = user.getBasicProfile();
            
            // Verificar que sea el email correcto
            if (profile.getEmail() !== 'losmollestunquen@gmail.com') {
                await this.signOut();
                throw new Error('Debe iniciar sesión con la cuenta losmollestunquen@gmail.com');
            }

            return {
                name: profile.getName(),
                email: profile.getEmail(),
                avatar: profile.getImageUrl(),
                accessToken: user.getAuthResponse().access_token
            };
        } catch (error) {
            console.error('Error en sign in:', error);
            throw error;
        }
    }

    async signOut() {
        if (this.authInstance) {
            await this.authInstance.signOut();
        }
    }

    isSignedIn() {
        return this.authInstance ? this.authInstance.isSignedIn.get() : false;
    }

    getCurrentUser() {
        if (!this.authInstance || !this.isSignedIn()) {
            return null;
        }

        const user = this.authInstance.currentUser.get();
        const profile = user.getBasicProfile();
        
        return {
            name: profile.getName(),
            email: profile.getEmail(),
            avatar: profile.getImageUrl(),
            accessToken: user.getAuthResponse().access_token
        };
    }

    getAccessToken() {
        if (!this.authInstance || !this.isSignedIn()) {
            return null;
        }

        const user = this.authInstance.currentUser.get();
        return user.getAuthResponse().access_token;
    }

    async refreshToken() {
        if (!this.authInstance || !this.isSignedIn()) {
            throw new Error('Usuario no autenticado');
        }

        try {
            const user = this.authInstance.currentUser.get();
            await user.reloadAuthResponse();
            return user.getAuthResponse().access_token;
        } catch (error) {
            console.error('Error refrescando token:', error);
            throw error;
        }
    }

    // Configurar Google Identity Services (nueva API)
    setupGoogleIdentityServices() {
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.initialize({
                client_id: '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com',
                callback: this.handleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true
            });

            // Renderizar botón de login
            const loginButton = document.querySelector('.g_id_signin');
            if (loginButton) {
                google.accounts.id.renderButton(loginButton, {
                    type: 'standard',
                    size: 'large',
                    theme: 'outline',
                    text: 'sign_in_with',
                    shape: 'rectangular',
                    logo_alignment: 'left'
                });
            }
        }
    }

    async handleCredentialResponse(response) {
        try {
            // Decodificar el JWT token
            const payload = this.parseJwt(response.credential);
            
            // Verificar que sea el email correcto
            if (payload.email !== 'losmollestunquen@gmail.com') {
                throw new Error('Debe iniciar sesión con la cuenta losmollestunquen@gmail.com');
            }

            // Obtener access token para las APIs
            await this.getAccessTokenFromCredential(response.credential);
            
            // Notificar a la aplicación principal
            if (window.app) {
                window.app.handleSuccessfulLogin({
                    name: payload.name,
                    email: payload.email,
                    avatar: payload.picture
                });
            }
        } catch (error) {
            console.error('Error manejando credential response:', error);
            if (window.app) {
                window.app.showNotification('Error en la autenticación: ' + error.message, 'error');
            }
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Error parsing JWT:', error);
            throw new Error('Token inválido');
        }
    }

    async getAccessTokenFromCredential(credential) {
        // Para obtener access token necesitamos usar OAuth 2.0 flow
        // Esto requiere redirección o popup
        try {
            await this.init();
            const user = await this.signIn();
            return user.accessToken;
        } catch (error) {
            console.error('Error obteniendo access token:', error);
            throw error;
        }
    }
}

// Función global para manejar la respuesta de Google Identity Services
function handleCredentialResponse(response) {
    if (window.googleAuth) {
        window.googleAuth.handleCredentialResponse(response);
    }
}

// Crear instancia global
window.googleAuth = new GoogleAuth();

// Inicializar cuando se cargue Google Identity Services
window.addEventListener('load', () => {
    if (typeof google !== 'undefined' && google.accounts) {
        window.googleAuth.setupGoogleIdentityServices();
    }
});

// Exportar para uso en otros módulos
window.GoogleAuth = GoogleAuth;

