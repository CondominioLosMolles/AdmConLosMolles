// js/auth.js - VERSIÓN FINAL Y ROBUSTA

// --- CONFIGURACIÓN ---
const API_KEY = 'AIzaSyDF_uzecwnLXVCGRqUxFo1nWJ3a5rHKBto';
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive';

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
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: handleTokenResponse,
        });
        resolveGisAuthReady();
    } catch (err) {
        console.error("Error crítico al inicializar Google Identity Services (GIS). Causa probable: Cookies de terceros bloqueadas.", err);
    }
}

async function initializeGapiClient() {
    console.log("Paso 1: Iniciando initializeGapiClient...");
    try {
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
        console.error("Error crítico al inicializar o cargar bibliotecas GAPI. Causa probable: API Key inválida o APIs no habilitadas.", err);
    }
}

// Se espera a que el HTML esté listo antes de intentar modificarlo
document.addEventListener('DOMContentLoaded', function() {
    Promise.all([gapiClientReady, gisAuthReady]).then(() => {
        console.log("APIs de Google y Autenticación listas para usarse.");
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (loginBtn) {
            loginBtn.style.visibility = 'visible';
            loginBtn.addEventListener('click', handleAuthClick);
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleSignoutClick);
        }
    }).catch(err => {
        console.error("No se pudieron inicializar los servicios de Google. El botón de login no se mostrará.", err);
    });
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
            location.reload();
        });
    }
}
