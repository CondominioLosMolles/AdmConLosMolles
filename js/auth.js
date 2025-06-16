// js/auth.js

const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send';

let googleUser = null;
let tokenClient;
let gapiInited = false;
let gisInited = false;

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
  maybeEnableLogin();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Se define en handleAuthClick
  });
  gisInited = true;
  maybeEnableLogin();
}

function maybeEnableLogin() {
  if (gapiInited && gisInited) {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.disabled = false;
  }
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error) {
      mostrarMensaje('Error de autenticación: ' + resp.error, 'error');
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const email = await obtenerUserEmail();
      if (email !== 'losmollestunquen@gmail.com') {
        mostrarMensaje('Acceso restringido solo para el administrador autorizado.', 'error');
        handleSignout();
        return;
      }
      googleUser = email;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      cargarDashboard();
    } catch (e) {
      if (e.message && e.message.includes('403')) {
        mostrarMensaje('No tienes permisos para acceder a la API de Gmail. Debes habilitar la API de Gmail en Google Cloud Console y autorizar el acceso con una cuenta que tenga Gmail.', 'error');
      } else {
        mostrarMensaje('No se pudo obtener el correo del usuario o no tienes permisos suficientes.', 'error');
      }
      handleSignout();
    }
  };
  tokenClient.requestAccessToken({prompt: 'consent'});
}

async function obtenerUserEmail() {
  try {
    const res = await gapi.client.gmail.users.getProfile({userId: 'me'});
    return res.result.emailAddress;
  } catch (e) {
    if (e.status === 403) {
      throw new Error("403");
    }
    throw new Error("No se pudo obtener el perfil de Gmail. ¿Autorizaste el scope correcto?");
  }
}

function handleSignout() {
  googleUser = null;
  if (window.gapi && gapi.client) {
    gapi.client.setToken('');
  }
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.disabled = true;

  const gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/api.js';
  gapiScript.onload = gapiLoaded;
  document.body.appendChild(gapiScript);

  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = gisLoaded;
  document.body.appendChild(gisScript);

  if (loginBtn) {
    loginBtn.addEventListener('click', handleAuthClick);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleSignout);
  }
});
