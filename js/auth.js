// js/auth.js

// ===================================================================================
// ===== TUS CREDENCIALES DE GOOGLE CLOUD =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
// ===================================================================================

const REDIRECT_URI = 'https://condominiolosmolles.github.io/AdmConLosMolles/';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let codeClient;
let gapiClientInitPromise;

// Se llama desde index.html cuando el script de la API de Google (gapi) ha cargado.
function gapiLoaded() {
    gapi.load('client', () => {
        // Se crea la promesa de inicialización de GAPI, pero no se espera aquí.
        gapiClientInitPromise = gapi.client.init({
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        // Una vez que GAPI está listo, se maneja la carga de la página.
        handlePageLoad();
    });
}

// Se llama desde index.html cuando el script de Google Sign-In (gis) ha cargado.
function gisLoaded() {
    codeClient = google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        ux_mode: 'redirect',
        redirect_uri: REDIRECT_URI,
    });
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.style.visibility = 'visible';
    }
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

// Se ejecuta al cargar la página para manejar la autenticación
async function handlePageLoad() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Comprueba si hay un token guardado en la sesión
    const storedToken = sessionStorage.getItem('gapi_token');

    try {
        // Espera a que la inicialización base de GAPI termine.
        await gapiClientInitPromise;

        if (code) {
            // Si hay un código en la URL, se canjea por un token.
            const tokenResponse = await exchangeCodeForToken(code);
            if (tokenResponse.access_token) {
                gapi.client.setToken(tokenResponse);
                sessionStorage.setItem('gapi_token', JSON.stringify(tokenResponse));
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Muestra la app y carga el dashboard
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
                await cargarDashboard();
            } else {
                throw new Error("La respuesta del token no contiene un access_token.");
            }
        } else if (storedToken) {
            // Si no hay código pero hay un token guardado, se usa ese.
            gapi.client.setToken(JSON.parse(storedToken));
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            await cargarDashboard();
        }
        // Si no hay ni código ni token guardado, no se hace nada y se muestra la pantalla de login.

    } catch (error) {
        console.error("Error crítico durante la carga o autenticación:", error);
        alert("Hubo un error crítico al iniciar la aplicación. Por favor, intenta de nuevo.");
    }
}

// Intercambia el código por un token (sin cambios)
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
