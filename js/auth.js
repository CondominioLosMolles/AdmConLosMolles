// js/auth.js (Tu código original y correcto)

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxi83xfutI5npdewRA4ZyLtkBeZVZFKjpk1_gPrQ-AGqNrmhiFerWIEhhuvAaYe1ziftg/exec';

// --- CONFIGURACIÓN DE AUTENTICACIÓN ---
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive';

let gapiAuthInstance;
let googleUser;
let authReadyResolve;
const authReadyPromise = new Promise(resolve => authReadyResolve = resolve);
window.authReadyPromise = authReadyPromise;

// --- INICIALIZACIÓN ---
function handleClientLoad() {
    console.log("Paso 1: Iniciando handleClientLoad...");
    gapi.load('client:auth2', initClient);
}

function initClient() {
    console.log("Paso 2: Iniciando gapi.client.init...");
    gapi.client.init({
        clientId: CLIENT_ID,
        scope: SCOPES,
        discoveryDocs: [
            "https://sheets.googleapis.com/$discovery/rest?version=v4",
            "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
            "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
        ]
    }).then(function () {
        console.log("Paso 3: gapi.client.init() completado.");
        gapiAuthInstance = gapi.auth2.getAuthInstance();
        gapiAuthInstance.isSignedIn.listen(updateSigninStatus);
        
        updateSigninStatus(gapiAuthInstance.isSignedIn.get());
        document.getElementById('loginBtn').addEventListener('click', handleAuthClick);
        document.getElementById('logoutBtn').addEventListener('click', handleSignoutClick);
        
        authReadyResolve();
    }, function(error) {
        console.error("Error en gapi.client.init:", JSON.stringify(error, null, 2));
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        console.log("Usuario está logueado.");
        googleUser = gapiAuthInstance.currentUser.get();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
    } else {
        console.log("Usuario no está logueado.");
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
        document.getElementById('loginBtn').style.visibility = 'visible';
    }
}

// --- MANEJO DE EVENTOS ---
function handleAuthClick(event) {
    gapiAuthInstance.signIn();
}

function handleSignoutClick(event) {
    gapiAuthInstance.signOut();
}
