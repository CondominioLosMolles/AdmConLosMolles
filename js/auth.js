// Autenticación con Google Identity Services
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send';

let googleUser = null;
let tokenClient;
let gapiInited = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    discoveryDocs: [
      'https://sheets.googleapis.com/$discovery/rest?version=v4',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
    ]
  });
  gapiInited = true;
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Se define después
  });
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error) throw (resp);
    await listUserEmail();
    cargarDashboard();
  };
  tokenClient.requestAccessToken({prompt: 'consent'});
}

async function listUserEmail() {
  const res = await gapi.client.gmail.users.getProfile({userId: 'me'});
  const email = res.result.emailAddress;
  if (email !== 'losmollestunquen@gmail.com') {
    mostrarMensaje('Acceso restringido solo para el administrador autorizado.');
    return;
  }
  googleUser = email;
}

document.addEventListener('DOMContentLoaded', () => {
  // Cargar scripts de Google
  const gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/api.js';
  gapiScript.onload = gapiLoaded;
  document.body.appendChild(gapiScript);

  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = gisLoaded;
  document.body.appendChild(gisScript);

  // Botón de login
  setTimeout(() => {
    handleAuthClick();
  }, 1500);
});
