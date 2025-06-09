/**
 * CondoAdminLosMolles - Módulo de autenticación (Versión con verificación de API)
 */

let tokenClient;
let gapiInited = false;
let gisInited = false;

function handleClientLoad() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: CONFIG.API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });

        // *** INICIO DE LA VERIFICACIÓN ***
        // Después de inicializar, verificamos explícitamente si el servicio de Sheets está disponible.
        if (!gapi.client.sheets) {
            throw new Error("El servicio de Google Sheets no se pudo cargar. Verifica que la API Key sea correcta y que la 'Google Sheets API' esté HABILITADA en tu proyecto de Google Cloud.");
        }
        // *** FIN DE LA VERIFICACIÓN ***
        
        gapiInited = true;
        maybeEnableButtons();

    } catch (error) {
        console.error("Error al inicializar el cliente de Google API:", error);
        showError(`Error de inicialización con Google: ${error.message}`);
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: '', // Se define dinámicamente más tarde
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        const authButton = document.getElementById('authorize_button');
        if (authButton) {
            authButton.disabled = false;
            authButton.onclick = handleAuthClick;
        }
        
        const token = localStorage.getItem('gapi_access_token');
        if (token) {
            try {
                gapi.client.setToken(JSON.parse(token));
                handleAuthSuccess();
            } catch (e) {
                localStorage.removeItem('gapi_access_token');
                showLoginScreen();
            }
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
    document.getElementById('main-container').classList.add('d-none');
    document.getElementById('login-container').classList.remove('d-none');
}

function handleAuthSuccess() {
    document.getElementById('loading').classList.add('d-none');
    document.getElementById('login-container').classList.add('d-none');
    document.getElementById('main-container').classList.remove('d-none');

    const signoutButton = document.getElementById('signout_button');
    if(signoutButton) signoutButton.onclick = handleSignoutClick;
    
    initApp();
}

function showError(message) {
    const errorModalBody = document.getElementById('errorModalBody');
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    if (errorModalBody) {
        errorModalBody.textContent = message;
    }
    errorModal.show();
}
