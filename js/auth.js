// js/auth.js

// ===================================================================================
// ===== IMPORTANTE: VERIFICA QUE TU ID DE CLIENTE ESTÉ CORRECTO AQUÍ =====
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com'; // Este es el ID que tenías en tu imagen, parece correcto.
// ===================================================================================

// ***** CORRECCIÓN CRÍTICA: La URL de redireccionamiento debe ser exacta *****
const REDIRECT_URI = 'https://condominiolosmolles.github.io/AdmConLosMolles/';
// **************************************************************************

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let codeClient;

// Se llama desde index.html
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

// Se llama desde index.html
function gisLoaded() {
    try {
        codeClient = google.accounts.oauth2.initCodeClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            ux_mode: 'redirect',
            redirect_uri: REDIRECT_URI,
        });
        document.getElementById('loginBtn').style.visibility = 'visible';
    } catch (err) {
        console.error("Error al inicializar Google Sign-In:", err);
        alert("Error al inicializar Google Sign-In. Revisa la configuración del Client ID y la URL de redireccionamiento.");
    }
}

async function initializeGapiClient() {
    await gapi.client.init({
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
}

// Inicia el flujo de redirección a Google
function handleAuthClick() {
    if (codeClient) {
        codeClient.requestCode();
    } else {
        alert("El cliente de autenticación de Google no se ha cargado. Revisa la consola para ver errores.");
    }
}

// Cierra la sesión
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token, () => {
            gapi.client.setToken('');
            sessionStorage.removeItem('gapi_token');
            // Redirige a la página de inicio para un estado limpio
            window.location.href = REDIRECT_URI;
        });
    }
}

// Esta función se ejecuta CADA VEZ que se carga la página
async function handlePageLoad() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Si la URL contiene un 'code', significa que volvemos de Google
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
        }
    } else {
        // Si no hay 'code', intenta cargar desde la sesión guardada
        const storedToken = sessionStorage.getItem('gapi_token');
        if (storedToken) {
            gapi.client.setToken(JSON.parse(storedToken));
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            await cargarDashboard();
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
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    response: xhr.responseText
                });
            }
        };
        
        xhr.onerror = function() {
            reject('Error de red al intentar intercambiar el código por el token.');
        };

        // El cuerpo de la petición debe ser codificado correctamente
        const body = 'code=' + encodeURIComponent(code) +
                     '&client_id=' + encodeURIComponent(CLIENT_ID) +
                     '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
                     '&grant_type=authorization_code';
        xhr.send(body);
    });
}

// Asigna los eventos a los botones y maneja la carga de la página
window.onload = function() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) loginBtn.addEventListener('click', handleAuthClick);
    if (logoutBtn) logoutBtn.addEventListener('click', handleSignoutClick);

    // Espera a que gapi.client esté listo antes de manejar la carga de la página
    // Esto asegura que `initializeGapiClient` ha terminado.
    const checkGapiClient = setInterval(async () => {
        if (gapi && gapi.client && gapi.client.sheets) {
            clearInterval(checkGapiClient);
            await handlePageLoad();
        }
    }, 100);
}
