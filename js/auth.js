const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

// --- IDs de las Hojas (para operaciones de borrado) ---
const SHEET_ID_RESIDENTES = 1835488459;
const SHEET_ID_PAGOS_GC = 1954366455;
const SHEET_ID_EGRESOS = 1945700474;
const SHEET_ID_MANTENCIONES = 895242560;
const SHEET_ID_MULTAS = 456683145;
const SHEET_ID_ASAMBLEAS = 791789730;
const SHEET_ID_COMUNICACIONES = 569621527;
const SHEET_ID_Config_TIMC = 990240915;

// Descubrir el base path para GitHub Pages
const BASE_PATH = window.location.pathname.includes("AdmConLosMolles") ? "/AdmConLosMolles" : "";

// API de Google para autenticación
gapi.load('client:auth2', initClient);

async function initClient() {
    try {
        await gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES
        });
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
        app.showNotification('Error al inicializar la autenticación de Google. Verifique su conexión y credenciales.', 'error');
    }
}

function updateSignInStatus(isSignedIn) {
    const loginSection = document.getElementById('login-section');
    const appSection = document.getElementById('app-section');
    const loadingScreen = document.getElementById('loading-screen');

    if (isSignedIn) {
        loginSection.style.display = 'none';
        appSection.style.display = 'block';
        loadingScreen.style.display = 'none';
        app.init(); // Inicializar la aplicación principal
    } else {
        loginSection.style.display = 'flex';
        appSection.style.display = 'none';
        loadingScreen.style.display = 'none';
    }
}

function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick() {
    gapi.auth2.getAuthInstance().signOut();
}

// Asignar funciones a los botones de login/logout
window.handleAuthClick = handleAuthClick;
window.handleSignoutClick = handleSignoutClick;


