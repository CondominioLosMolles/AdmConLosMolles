// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: VERIFICA QUE TU ID DE CLIENTE ESTÉ CORRECTO AQUÍ =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
// ===== ¡ESTA VERSIÓN SEGURA NO USA EL SECRETO DEL CLIENTE! =====
// ===================================================================================

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;

// --- Sistema de Promesas para garantizar que todo esté listo ---
let resolveGapiClientReady;
const gapiClientReady = new Promise(resolve => { resolveGapiClientReady = resolve; });
let resolveGisAuthReady;
const gisAuthReady = new Promise(resolve => { resolveGisAuthReady = resolve; });

function gapiLoaded() { gapi.load('client', initializeGapiClient); }
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });
    resolveGisAuthReady();
}
async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    resolveGapiClientReady();
}
Promise.all([gapiClientReady, gisAuthReady]).then(() => {
    document.getElementById('loginBtn').style.visibility = 'visible';
    console.log("¡Listo! La API de Google y la Autenticación están cargadas y listas.");
});

function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}
async function handleTokenResponse(resp) {
    if (resp.error !== undefined) {
        console.error("Error en la respuesta del token:", resp);
        throw (resp);
    }
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    await cargarDashboard();
}
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
window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
};
