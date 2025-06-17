// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: VERIFICA QUE TU ID DE CLIENTE ESTÉ CORRECTO AQUÍ =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
// ===================================================================================

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;

// --- Sistema de Promesas para garantizar que todo esté listo ---
let resolveGapiClientReady;
const gapiClientReady = new Promise(resolve => { resolveGapiClientReady = resolve; });

let resolveGisAuthReady;
const gisAuthReady = new Promise(resolve => { resolveGisAuthReady = resolve; });
// -------------------------------------------------------------

// Se llama desde index.html cuando el script de la API de Google (gapi) ha cargado.
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Se llama desde index.html cuando el script de Google Sign-In (gis) ha cargado.
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse, // Se define el callback que manejará la respuesta del login
    });
    // Señal de que el cliente de autenticación está listo.
    resolveGisAuthReady();
}

// Inicializa el cliente de la API para poder usar Google Sheets.
async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    // Señal de que el cliente de la API de Sheets está listo.
    resolveGapiClientReady();
}

// Espera a que AMBAS promesas se resuelvan antes de mostrar el botón de login.
// Esto elimina la condición de carrera.
Promise.all([gapiClientReady, gisAuthReady]).then(() => {
    document.getElementById('loginBtn').style.visibility = 'visible';
    console.log("¡Listo! La API de Google y la Autenticación están cargadas y listas.");
});


// Se ejecuta cuando el usuario hace clic en "Iniciar Sesión"
function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        // Pide el token. El usuario verá un pop-up.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Se ejecuta automáticamente después de que el usuario se loguea en el pop-up
async function handleTokenResponse(resp) {
    if (resp.error !== undefined) {
        console.error("Error en la respuesta del token:", resp);
        throw (resp);
    }
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    // Llama al dashboard solo después de que la autenticación es 100% exitosa.
    await cargarDashboard();
}

// Cierra la sesión
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

// Asigna los eventos a los botones
window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
};
