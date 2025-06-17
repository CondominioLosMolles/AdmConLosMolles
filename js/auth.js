// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: VERIFICA QUE TU ID DE CLIENTE ESTÉ CORRECTO AQUÍ =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
// ===== ¡YA NO SE NECESITA EL SECRETO DEL CLIENTE! =====
// ===================================================================================

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Llamada por el script de Google API en index.html
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Llamada por el script de Google Sign-In en index.html
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse, // Se define un callback para manejar la respuesta
    });
    gisInited = true;
    checkGapiAndGis();
}

// Inicializa el cliente de la API de Google (para Sheets)
async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    gapiInited = true;
    checkGapiAndGis();
}

// Revisa que ambas librerías de Google estén listas antes de mostrar el botón de login
function checkGapiAndGis() {
    if (gapiInited && gisInited) {
        document.getElementById('loginBtn').style.visibility = 'visible';
    }
}

// Inicia el proceso de autenticación cuando el usuario hace clic
function handleAuthClick() {
    // Pide el token. El usuario verá un pop-up.
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Callback que se ejecuta después de que el usuario inicia sesión en el pop-up
async function handleTokenResponse(resp) {
    if (resp.error !== undefined) {
        throw (resp);
    }
    // Oculta la pantalla de login y muestra la aplicación
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    // Carga el dashboard solo después de una autenticación 100% exitosa
    await cargarDashboard();
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
};
