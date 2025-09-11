// --- CONFIGURACIÓN ---
// ASEGÚRATE DE QUE ESTOS VALORES SEAN CORRECTOS, ESPECIALMENTE TU API_KEY
const API_KEY = 'https://script.googleapis.com/v1/scripts/AKfycbxi83xfutI5npdewRA4ZyLtkBeZVZFKjpk1_gPrQ-AGqNrmhiFerWIEhhuvAaYe1ziftg:run; // <--- ESTO DEBE SER TU CLAVE REAL
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';


// --- LÓGICA INTERNA (NO MODIFICAR) ---
let tokenClient;
let resolveGapiClientReady;
const gapiClientReady = new Promise(resolve => { resolveGapiClientReady = resolve; });
let resolveGisAuthReady;
const gisAuthReady = new Promise(resolve => { resolveGisAuthReady = resolve; });
let resolveAuthReady;
window.authReadyPromise = new Promise(resolve => { resolveAuthReady = resolve; });

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });
    resolveGisAuthReady();
}

async function initializeGapiClient() {
    console.log("Paso 1: Iniciando initializeGapiClient...");
    try {
        // CORRECCIÓN CRÍTICA: Se debe proporcionar la API_KEY para inicializar.
        await gapi.client.init({
            apiKey: API_KEY,
        });
        console.log("Paso 2: gapi.client.init() completado.");

        await Promise.all([
            gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4'),
            gapi.client.load('https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'),
            gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'),
            gapi.client.load('https://script.googleapis.com/$discovery/rest?version=v1')
        ]);
        
        console.log("Paso 3: Carga de todas las APIs completada.");
        resolveGapiClientReady();
    } catch (err) {
        console.error("Error crítico al inicializar o cargar bibliotecas GAPI:", err);
    }
}

// Se ejecuta cuando GAPI y GIS están listos
Promise.all([gapiClientReady, gisAuthReady]).then(() => {
    console.log("APIs de Google y Autenticación listas para usarse.");
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // CORRECCIÓN: Asignamos los eventos de clic aquí, que es el lugar 100% seguro.
    if (loginBtn) {
        loginBtn.style.visibility = 'visible';
        loginBtn.addEventListener('click', handleAuthClick);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleSignoutClick);
    }
});

function handleAuthClick() {
    if (tokenClient) {
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    } else {
        console.error("Error: tokenClient no está inicializado.");
    }
}

async function handleTokenResponse(resp) {
    console.log("Paso 4: Se recibió respuesta del token.", resp);
    if (resp.error) {
        console.error("Error en la respuesta del token:", resp);
        return;
    }
    gapi.client.setToken(resp);
    console.log("Paso 5: Token establecido en gapi.client.");
    
    resolveAuthReady();
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

// El bloque window.onload ya no es necesario para los botones, se borra.
