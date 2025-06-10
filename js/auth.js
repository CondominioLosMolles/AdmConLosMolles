const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU';
const SPREADSHEET_ID = '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send'
].join(' ');

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: [
      "https://sheets.googleapis.com/$discovery/rest?version=v4",
      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
      "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
    ]
  }).then(() => {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    updateSigninStatus(isSignedIn);
    document.getElementById("loginBtn").onclick = handleSignIn;
    document.getElementById("logoutBtn").onclick = handleSignOut;
  }).catch(error => {
    console.error("Error al inicializar cliente de Google API", error);
    alert("Error al cargar las APIs de Google. Revisa tu consola.");
  });
}

function handleSignIn() {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignOut() {
  gapi.auth2.getAuthInstance().signOut();
}

function updateSigninStatus(isSignedIn) {
  const app = document.getElementById("app");
  const login = document.getElementById("login-container");

  if (isSignedIn) {
    app.classList.remove("hidden");
    login.classList.add("hidden");

    // Acciones tras login
    loadMainView();           // Vista por defecto
    cargarConfiguracion();    // Cargar configuración local (TMC)
    cargarResidentes();       // ✅ Módulo Residentes
    // Aquí luego se agregarán: cargarPagos(), cargarDashboard(), etc.
  } else {
    app.classList.add("hidden");
    login.classList.remove("hidden");
  }
}

// Inicializa cliente cuando se carga la API de Google
gapi.load('client:auth2', initClient);

