// js/auth.js

const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';

// --- INICIO CAMBIO: AÑADIR PERMISO DE GMAIL ---
// Se añade 'https://www.googleapis.com/auth/gmail.send' a la lista de scopes.
// Los scopes se separan por un espacio.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send';
// --- FIN CAMBIO ---


let tokenClient;

// Sistema de Promesas para garantizar que todo esté listo
let resolveGapiClientReady;
const gapiClientReady = new Promise(resolve => { resolveGapiClientReady = resolve; });
let resolveGisAuthReady;
const gisAuthReady = new Promise(resolve => { resolveGisAuthReady = resolve; });
let resolveAuthReady;
window.authReadyPromise = new Promise(resolve => { resolveAuthReady = resolve; });

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
    // --- INICIO CAMBIO: AÑADIR DOCUMENTO DE DESCUBRIMIENTO DE GMAIL ---
    // Se añade la URL de la API de Gmail para que GAPI sepa cómo interactuar con ella.
    await gapi.client.init({
        discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4",
            "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
        ],
    });
    // --- FIN CAMBIO ---

    // Señal de que el cliente de la API de Sheets está listo.
    resolveGapiClientReady();
}

// Espera a que AMBAS promesas se resuelvan antes de mostrar el botón de login.
Promise.all([gapiClientReady, gisAuthReady]).then(() => {
    document.getElementById('loginBtn').style.visibility = 'visible';
    console.log("¡Listo! La API de Google y la Autenticación están preparadas.");
});

// Se ejecuta cuando el usuario hace clic en "Iniciar Sesión"
function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Callback que se ejecuta después de que el usuario se loguea en el pop-up
async function handleTokenResponse(resp) {
    if (resp.error !== undefined) {
        console.error("Error en la respuesta del token:", resp);
        throw (resp);
    }
    // Envía la señal de que la autenticación fue exitosa
    resolveAuthReady();
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
