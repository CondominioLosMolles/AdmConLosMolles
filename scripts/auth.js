// scripts/auth.js
function handleLogin() {
  console.log("handleLogin llamado"); // Agregar este log
  if (!gapiInited || !gisInited) {
    showError("APIs no inicializadas. Espere...");
    return;
  }
  
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

// Inicializar Google Auth al cargar la página
window.addEventListener("load", async () => {
  try {
    // Cargar GAPI
    await new Promise(resolve => {
      gapi.load("client", async () => {
        await gapi.client.init({
          apiKey: CONFIG.API_KEY,
          clientId: CONFIG.CLIENT_ID,
          scope: CONFIG.SCOPES.join(" "),
        });
        gapiInited = true;
        resolve();
      });
    });

    // Cargar GIS
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client"; 
    script.onload = () => {
      gisInited = true;
      console.log("Google Auth listo");
    };
    script.onerror = (error) => {
      console.error("Error cargando GIS:", error);
    };
    document.head.appendChild(script);
  } catch (error) {
    console.error("Error inicializando Google Auth:", error);
  }
});
