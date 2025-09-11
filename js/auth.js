// js/auth.js - VERSIÓN FINAL Y LIMPIA

// --- CONFIGURACIÓN ---
// ASEGÚRATE DE QUE ESTAS DOS CREDENCIALES PERTENEZCAN AL MISMO PROYECTO DE GOOGLE CLOUD
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
        console.error("Error GIS (Cookies de terceros pueden estar bloqueadas):", err);
    }
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
        });
        await Promise.all([
            gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4'),
            gapi.client.load('https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'),
            gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'),
            gapi.client.load('https://script.googleapis.com/$discovery/rest?version=v1')
        ]);
        resolveGapiClientReady();
    } catch (err) {
        console.error("Error GAPI (API Key inválida o APIs no habilitadas en este proyecto):", err);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    Promise.all([gapiClientReady, gisAuthReady]).then(() => {
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
        console.error("No se pudieron inicializar los servicios de Google.", err);
    });
});

function handleAuthClick() {
    if (tokenClient) {
        tokenClient.requestAccessToken({ prompt: gapi.client.getToken() === null ? 'consent' : '' });
    }
}

async function handleTokenResponse(resp) {
    if (resp.error) {
        console.error("Error en la respuesta del token:", resp);
        return;
    }
    gapi.client.setToken(resp);
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
