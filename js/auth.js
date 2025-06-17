// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: COMPLETA TUS DOS CREDENCIALES OBTENIDAS DE GOOGLE CLOUD =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com'; // TU ID DE CLIENTE
const CLIENT_SECRET = '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'; // TU SECRETO DE CLIENTE
// ===================================================================================

const REDIRECT_URI = 'https://condominiolosmolles.github.io/AdmConLosMolles/';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let codeClient;

// Se llama desde index.html
function gapiLoaded() { gapi.load('client', initializeGapiClient); }
function gisLoaded() {
    // Inicializa el cliente para el flujo de REDIRECCIÓN
    codeClient = google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        ux_mode: 'redirect',
        redirect_uri: REDIRECT_URI,
    });
    // Muestra el botón de login ahora que el cliente está listo.
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.style.visibility = 'visible';
    }
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    // Se ejecuta al cargar la página para ver si volvemos de Google
    await handlePageLoad();
}

// Inicia el flujo de redirección a Google
function handleAuthClick() {
    if (codeClient) {
        codeClient.requestCode();
    }
}

// Cierra la sesión
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            sessionStorage.removeItem('gapi_token');
            window.location.href = REDIRECT_URI;
        });
    }
}

// Se ejecuta cada vez que se carga la página para manejar la autenticación
async function handlePageLoad() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Si la URL contiene un 'code', significa que estamos volviendo de Google
    if (code) {
        try {
            const tokenResponse = await exchangeCodeForToken(code);
            if (tokenResponse.access_token) {
                gapi.client.setToken(tokenResponse);
                sessionStorage.setItem('gapi_token', JSON.stringify(tokenResponse));
                
                window.history.replaceState({}, document.title, window.location.pathname);
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
                await cargarDashboard();
            } else {
                throw new Error("La respuesta del token no contiene un access_token.");
            }
        } catch (error) {
            console.error("Error procesando el token de autorización:", error);
            alert("Hubo un error al verificar tu sesión con Google. Por favor, intenta iniciar sesión de nuevo.");
            window.location.href = REDIRECT_URI;
        }
    } else {
        // Si no hay 'code', intenta cargar desde una sesión previamente guardada
        const storedToken = sessionStorage.getItem('gapi_token');
        if (storedToken) {
            gapi.client.setToken(JSON.parse(storedToken));
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            // Llama a cargarDashboard solo si el cliente gapi está listo
            const checkGapi = setInterval(async () => {
                if (gapi.client && gapi.client.sheets) {
                    clearInterval(checkGapi);
                    await cargarDashboard();
                }
            }, 100);
        }
    }
}

function exchangeCodeForToken(code) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://oauth2.googleapis.com/token');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                console.error("Error en la respuesta de /token:", xhr.responseText);
                reject({ status: xhr.status, response: xhr.responseText });
            }
        };
        xhr.onerror = function() { reject('Error de red al intentar intercambiar el código.'); };

        const body = 'code=' + encodeURIComponent(code) +
                     '&client_id=' + encodeURIComponent(CLIENT_ID) +
                     '&client_secret=' + encodeURIComponent(CLIENT_SECRET) +
                     '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
                     '&grant_type=authorization_code';
        xhr.send(body);
    });
}

// Asigna los eventos a los botones
window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);
};
