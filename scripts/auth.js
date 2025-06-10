// scripts/auth.js - Autenticación OAuth 2.0 con Google
let tokenClient;
let gapiInited = false;
let gisInited = false;

function initAuth() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPES.join(" "),
    callback: () => {}
  });
}

function handleLogin() {
  if (!gapiInited || !gisInited) return;
  
  tokenClient.requestAccessToken();
  
  const user = google.accounts.oauth2.initBasicProfile();
  if (user.getEmail() !== CONFIG.ALLOWED_EMAIL) {
    alert("Acceso denegado. Use la cuenta autorizada.");
    return;
  }
  
  document.getElementById("login-btn").style.display = "none";
  document.getElementById("user-info").innerHTML = `
    <span>Bienvenido, ${user.getName()}</span>
    <button onclick="signOut()">Cerrar Sesión</button>
  `;
  loadApp();
}

function signOut() {
  google.accounts.oauth2.revoke(CONFIG.ALLOWED_EMAIL, () => {
    location.reload();
  });
}

// Inicializar Google Auth
window.addEventListener("load", () => {
  initAuth();
  gisInited = true;
});
