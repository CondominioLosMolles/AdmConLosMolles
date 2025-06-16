// js/auth.js

const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send openid email profile';

let googleUser = null;
let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

// Inicializa GAPI
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

// Inicializa Google Identity Services
function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Se define en handleAuthClick
  });
  gisInited = true;
  maybeEnableLogin();
}

// Habilita el botón de login solo cuando ambas APIs están listas
function maybeEnableLogin() {
  if (gapiInited && gisInited) {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) loginBtn.disabled = false;
  }
}

// Obtiene el email desde el access_token usando la endpoint de userinfo
async function obtenerEmailDesdeAccessToken(token) {
  const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('No se pudo obtener el correo del usuario');
  const data = await res.json();
  return data.email;
}

// Maneja el clic en "Iniciar sesión"
function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error) {
      mostrarMensaje('Error de autenticación: ' + resp.error, 'error');
      return;
    }
    try {
      accessToken = resp.access_token;
      const email = await obtenerEmailDesdeAccessToken(accessToken);
      if (!email) {
        mostrarMensaje('No se pudo obtener el correo del usuario.', 'error');
        handleSignout();
        return;
      }
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
      mostrarMensaje('No se pudo obtener el correo del usuario o no tienes permisos suficientes.', 'error');
      handleSignout();
    }
  };
  tokenClient.requestAccessToken({prompt: 'consent', include_granted_scopes: true});
}

// Cierra sesión y vuelve a mostrar la pantalla de login
function handleSignout() {
  googleUser = null;
  accessToken = null;
  if (window.gapi && gapi.client) {
    gapi.client.setToken('');
  }
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
}

// Carga los scripts de Google al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.disabled = true;

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
  if (loginBtn) {
    loginBtn.addEventListener('click', handleAuthClick);
  }

  // Botón de logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleSignout);
  }
});
