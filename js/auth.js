// js/auth.js

// ***** PEGA AQUÍ TU ID DE CLIENTE OBTENIDO DE GOOGLE CLOUD *****
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
// ***************************************************************

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Funciones que se llaman desde el index.html al cargar los scripts de Google
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // El callback se define dinámicamente
    });
    gisInited = true;
    checkGapiAndGis();
}

// Inicializa el cliente de la API de Google (para Sheets)
async function initializeGapiClient() {
    await gapi.client.init({
        // La API Key no es necesaria si usamos OAuth2
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    gapiInited = true;
    checkGapiAndGis();
}

// Se asegura de que tanto la API de Google como el sistema de autenticación estén listos
function checkGapiAndGis() {
    if (gapiInited && gisInited) {
        document.getElementById('loginBtn').style.visibility = 'visible';
    }
}

// Inicia el proceso de autenticación cuando se hace clic en el botón
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        await cargarDashboard(); // Carga el dashboard solo después de una autenticación exitosa
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
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

// Eventos de los botones de login/logout
window.onload = function() {
    // Es importante esperar a que la ventana se cargue completamente
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
}
