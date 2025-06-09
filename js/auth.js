/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Módulo de autenticación con Google
 */

// Variables globales para la autenticación
let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Callback después de cargar la API de Google
 */
function handleClientLoad() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Inicializa la biblioteca del cliente GAPI
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: CONFIG.API_KEY,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback después de cargar la biblioteca de identidad de Google
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: '', // Definido más tarde
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Habilita los botones de autenticación si las bibliotecas están cargadas
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').classList.remove('d-none');
        document.getElementById('authorize_button').disabled = false;
        document.getElementById('authorize_button').onclick = handleAuthClick;
        
        // Verificar si ya hay un token almacenado
        const token = localStorage.getItem('gapi_access_token');
        if (token) {
            gapi.client.setToken(JSON.parse(token));
            handleAuthSuccess();
        } else {
            showLoginScreen();
        }
    }
}

/**
 * Maneja el proceso de autenticación con Google
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }

        // Guardar el token en localStorage
        localStorage.setItem('gapi_access_token', JSON.stringify(gapi.client.getToken()));
        handleAuthSuccess();
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 * Maneja el proceso de cierre de sesión
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        localStorage.removeItem('gapi_access_token');
        showLoginScreen();
    }
}

/**
 * Muestra la pantalla de inicio de sesión
 */
function showLoginScreen() {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('login-container').classList.remove('d-none');
    document.getElementById('main-container').classList.add('d-none');
}

/**
 * Maneja el éxito de la autenticación
 */
function handleAuthSuccess() {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('login-container').classList.add('d-none');
    document.getElementById('main-container').classList.remove('d-none');

    document.getElementById('signout_button').onclick = handleSignoutClick;

    initApp();
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    document.getElementById('errorModalBody').textContent = message;
    errorModal.show();
}

/**
 * Verifica si el usuario está autenticado
 */
