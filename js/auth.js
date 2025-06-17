// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: PEGA AQUÍ TU ID DE CLIENTE OBTENIDO DE GOOGLE CLOUD CONSOLE =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
// ===================================================================================
// ===== IMPORTANTE: PEGA AQUÍ LA URL EXACTA DE TU APP (debe coincidir con la de Google Cloud) =====
const REDIRECT_URI = 'https://condominiolosmolles.github.io/AdmConLosMolles/';
// ===================================================================================

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let codeClient;

// Se llama desde index.html
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Se llama desde index.html
function gisLoaded() {
    // Inicializa el cliente para el flujo de REDIRECCIÓN
    codeClient = google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        ux_mode: 'redirect',
        redirect_uri: REDIRECT_URI, // Le dice a Google a dónde volver
    });
    // Muestra el botón de login ahora que el cliente está listo
    document.getElementById('loginBtn').style.visibility = 'visible';
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
}

// Inicia el flujo de redirección a Google
function handleAuthClick() {
    if (codeClient) {
        codeClient.requestCode();
    }
}

// Cierra la sesión
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            // Limpia el almacenamiento para un cierre de sesión completo
            sessionStorage.removeItem('gapi_token');
            // Redirige a la página de inicio para un estado limpio
            window.location.pathname = '/AdmConLosMolles/';
        });
    }
}

// Esta función se ejecuta CADA VEZ que se carga la página
async function handlePageLoad() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Si la URL contiene un 'code', significa que volvemos de Google
    if (code) {
        try {
            // Intercambia el código por un token de acceso
            const tokenResponse = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://oauth2.googleapis.com/token');
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = function() {
                    resolve(JSON.parse(xhr.responseText));
                };
                xhr.onerror = function() {
                    reject('Error al intercambiar el código por el token.');
                };
                const body = 'code=' + decodeURIComponent(code) +
                             '&client_id=' + CLIENT_ID +
                             '&redirect_uri=' + REDIRECT_URI +
                             '&grant_type=authorization_code';
                xhr.send(body);
            });

            if (tokenResponse.access_token) {
                gapi.client.setToken(tokenResponse);
                sessionStorage.setItem('gapi_token', JSON.stringify(tokenResponse)); // Guarda el token en la sesión
                
                // Limpia la URL y muestra la app
                window.history.replaceState({}, document.title, window.location.pathname);
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
                await cargarDashboard();
            }
        } catch (error) {
            console.error("Error procesando el token:", error);
        }
    } else {
        // Si no hay 'code', intenta cargar desde la sesión guardada
        const storedToken = sessionStorage.getItem('gapi_token');
        if (storedToken) {
            gapi.client.setToken(JSON.parse(storedToken));
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            await cargarDashboard();
        }
    }
}

// Asigna los eventos a los botones y maneja la carga de la página
window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);

    handlePageLoad(); // La función clave que se ejecuta al cargar
}
