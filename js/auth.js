// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: PEGA AQUÍ TU ID DE CLIENTE OBTENIDO DE GOOGLE CLOUD CONSOLE =====
const CLIENT_ID = '​997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
// ===================================================================================

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Esta función es llamada por el script <script src="https://apis.google.com/js/api.js" onload="gapiLoaded()">
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Esta función es llamada por el script <script src="https://accounts.google.com/gsi/client" onload="gisLoaded()">
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // El callback se define dinámicamente al hacer clic
    });
    gisInited = true;
    checkGapiAndGis();
}

// Inicializa el cliente de la API de Google (para poder usar Sheets, Drive, etc.)
async function initializeGapiClient() {
    await gapi.client.init({
        // La API Key ya no es necesaria cuando se usa OAuth 2.0 de esta manera
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    gapiInited = true;
    checkGapiAndGis();
}

// Revisa que ambas librerías de Google (API y Autenticación) estén listas antes de mostrar el botón de login
function checkGapiAndGis() {
    if (gapiInited && gisInited) {
        document.getElementById('loginBtn').style.visibility = 'visible';
    }
}

// Inicia el proceso de autenticación cuando el usuario hace clic en el botón
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        // Oculta la pantalla de login y muestra la aplicación principal
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        // Llama al dashboard solo DESPUÉS de una autenticación 100% exitosa
        await cargarDashboard();
    };

    // Pide un nuevo token de acceso.
    // Si el usuario ya ha dado su consentimiento antes, el pop-up no será tan intrusivo.
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Cierra la sesión del usuario
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            document.getElementById('app').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
        });
    }
}

// Asigna los eventos a los botones una vez que la página ha cargado
window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
}
