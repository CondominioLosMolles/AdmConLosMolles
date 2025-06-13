// main.js
const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU';
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';
const SCOPES =
  'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/gmail.send';

let tokenClient;
let accessToken = null;
let currentUserEmail = '';

const appSection = document.getElementById('app-section');
const loginSection = document.getElementById('login-section');
const mainContent = document.getElementById('main-content');
const navLinks = document.querySelectorAll('.nav-link');

// Función para decodificar JWT
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

// Definir handleCredentialResponse en ámbito global para Google Identity Services
window.handleCredentialResponse = function(response) {
  document.getElementById('login-loading').style.display = 'block';
  document.getElementById('login-error').style.display = 'none';
  try {
    const payload = parseJwt(response.credential);
    currentUserEmail = payload.email;
    if (currentUserEmail !== 'losmollestunquen@gmail.com') {
      document.getElementById('login-error').textContent = 'Solo el administrador autorizado puede ingresar.';
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-loading').style.display = 'none';
      return;
    }
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      document.getElementById('login-error').textContent = 'Error: Cliente de token no inicializado.';
      document.getElementById('login-error').style.display = 'block';
      document.getElementById('login-loading').style.display = 'none';
    }
  } catch (error) {
    document.getElementById('login-error').textContent = 'Error al procesar credenciales: ' + error.message;
    document.getElementById('login-error').style.display = 'block';
    document.getElementById('login-loading').style.display = 'none';
  }
};

// Inicializa el cliente GAPI y tokenClient
async function initializeGapiClient() {
  return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [
            'https://sheets.googleapis.com/$discovery/rest?version=v4',
            'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            'https://gmail.googleapis.com/$discovery/rest?version=v1',
          ],
        });
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              accessToken = tokenResponse.access_token;
              gapi.client.setToken({ access_token: accessToken });
              // Mostrar app y cargar módulo dashboard
              loginSection.style.display = 'none';
              appSection.style.display = 'flex';
              setActiveNav('dashboard');
              loadModule('dashboard');
            }
          },
        });
        resolve();
      } catch (error) {
        document.getElementById('login-error').textContent =
          'Error al inicializar la API de Google: ' + error.message;
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('login-loading').style.display = 'none';
        reject(error);
      }
    });
  });
}

// Carga dinámica de módulos HTML, JS y CSS
async function loadModule(moduleName) {
  try {
    const html = await fetch(`modulos/${moduleName}/${moduleName}.html`).then(res => res.text());
    mainContent.innerHTML = html;
    await import(`./modulos/${moduleName}/${moduleName}.js`);
    // Cargar CSS dinámicamente
    const existingLink = document.getElementById('module-css');
    if (existingLink) existingLink.remove();
    const link = document.createElement('link');
    link.id = 'module-css';
    link.rel = 'stylesheet';
    link.href = `modulos/${moduleName}/${moduleName}.css`;
    document.head.appendChild(link);
  } catch (error) {
    mainContent.innerHTML = `<p>Error al cargar el módulo ${moduleName}: ${error.message}</p>`;
  }
}

// Actualiza la navegación activa
function setActiveNav(moduleName) {
  navLinks.forEach(link => {
    if (link.dataset.module === moduleName) link.classList.add('active');
    else link.classList.remove('active');
  });
}

// Control de navegación por menú lateral
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const moduleName = link.dataset.module;
    setActiveNav(moduleName);
    loadModule(moduleName);
  });
});

// Inicialización al cargar la página
window.onload = async () => {
  await initializeGapiClient();
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: window.handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  google.accounts.id.renderButton(document.getElementById('g_id_signin'), {
    theme: 'outline',
    size: 'large',
    type: 'standard',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
  });
};
