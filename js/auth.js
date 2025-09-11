// js/auth.js

const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive';

let tokenClient;
let resolveGapiClientReady;
const gapiClientReady = new Promise(resolve => { resolveGapiClientReady = resolve; });
let resolveGisAuthReady;
const gisAuthReady = new Promise(resolve => { resolveGisAuthReady = resolve; });
let resolveAuthReady;
window.authReadyPromise = new Promise(resolve => { resolveAuthReady = resolve; });

// <-- CORRECCIÓN AQUÍ
window.gapiLoaded = function() {
    gapi.load('client', initializeGapiClient);
}

// <-- Y CORRECCIÓN AQUÍ
window.gisLoaded = function() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });
    resolveGisAuthReady();
}

async function initializeGapiClient() {
    console.log("Paso 1: Iniciando initializeGapiClient...");
    await gapi.client.init({});
    console.log("Paso 2: gapi.client.init() completado.");
    
    await Promise.all([
        gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4'),
        gapi.client.load('https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'),
        gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'),
        gapi.client.load('https://script.googleapis.com/$discovery/rest?version=v1')
    ]).catch(err => {
        console.error("Error crítico al cargar bibliotecas cliente de GAPI:", err);
    });
    
    console.log("Paso 3: Carga de todas las APIs completada.");
    resolveGapiClientReady();
}

Promise.all([gapiClientReady, gisAuthReady]).then(() => {
    document.getElementById('loginBtn').style.visibility = 'visible';
    console.log("APIs de Google y Autenticación listas para usarse.");
});

function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

async function handleTokenResponse(resp) {
    console.log("Paso 4: Se recibió respuesta del token.", resp);
    if (resp.error !== undefined) {
        console.error("Error en la respuesta del token:", resp);
        throw (resp);
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

window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
};
