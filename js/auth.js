/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de autenticación con Google
 */

// Variables globales para la autenticación
let tokenClient;
let gapiInited = false;
let gisInited = false;

function handleClientLoad() {
    gapi.load('client', initializeGapiClient);
    gapi.load('client', () => {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CONFIG.CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/spreadsheets', 
            callback: ''
        });
        maybeEnableButtons();
    });
}

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: CONFIG.API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').classList.remove('d-none');
        document.getElementById('authorize_button').disabled = false;
        document.getElementById('authorize_button').onclick = handleAuthClick;
        const token = localStorage.getItem('gapi_access_token');
        if (token) {
            gapi.client.setToken(JSON.parse(token));
            handleAuthSuccess();
        } else {
            showLoginScreen();
        }
    }
}

function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        localStorage.setItem('gapi_access_token', JSON.stringify(gapi.client.getToken()));
        handleAuthSuccess();
    };
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        localStorage.removeItem('gapi_access_token');
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('login-container').classList.remove('d-none');
    document.getElementById('main-container').classList.add('d-none');
}

function handleAuthSuccess() {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('login-container').classList.add('d-none');
    document.getElementById('main-container').classList.remove('d-none');
    document.getElementById('signout_button').onclick = handleSignoutClick;
    initApp();
}

function showError(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    document.getElementById('errorModalBody').textContent = message;
    errorModal.show();
}

function isAuthenticated() {
    return gapi.client.getToken() !== null;
}
