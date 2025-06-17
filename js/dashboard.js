<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CondominioLosMolles - Administración</title>
  <link rel="stylesheet" href="css/styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js"></script>
</head>
<body>
  <div id="login-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#f4f8fb;">
    <div style="background:#fff;padding:48px 36px;border-radius:16px;box-shadow:0 4px 32px #4e91f950;min-width:320px;max-width:90vw;">
      <h2 style="text-align:center;color:#4e91f9;margin-bottom:24px;">Bienvenido a<br>Condominio Los Molles</h2>
      <p style="text-align:center;margin-bottom:32px;color:#2a7ca3;">Para acceder a la administración, por favor inicia sesión con tu cuenta autorizada.</p>
      <div style="display:flex;justify-content:center;">
        <button id="loginBtn" class="btn" style="visibility:hidden; font-size:1.2em;padding:14px 36px;">Iniciar sesión con Google</button>
      </div>
    </div>
  </div>

  <div id="app" style="display:none;">
    <aside id="sidebar">
      <div class="logo">
        <span>Condominio</span><br>
        <span>Los Molles</span>
      </div>
      <nav>
        <ul>
          <li data-module="dashboard" class="active">Dashboard</li>
          <li data-module="residentes">Residentes</li>
          <li data-module="gastos_comunes">Gastos Comunes</li>
          <li data-module="contabilidad">Contabilidad</li>
          <li data-module="comunicaciones">Comunicaciones</li>
          <li data-module="mantenciones">Mantenciones</li>
          <li data-module="multas">Multas</li>
          <li data-module="asambleas">Asambleas</li>
          <li data-module="informes">Informes</li>
        </ul>
      </nav>
      <button id="logoutBtn">Cerrar sesión</button>
    </aside>
    <main id="main-content"></main>
  </div>

  <!-- Autenticación -->
  <script src="js/auth.js?v=final-fix"></script>
  <script async defer src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
  <script async defer src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>

  <!-- Utilidades y dependencias comunes -->
  <script src="js/utils.js?v=final-fix"></script>
  <script src="js/sheets.js?v=final-fix"></script>
  <script src="js/drive.js?v=final-fix"></script>
  <script src="js/gmail.js?v=final-fix"></script>

  <!-- 📌 Módulos base necesarios antes del dashboard -->
  <script src="js/contabilidad.js?v=final-fix"></script>
  <script src="js/informes.js?v=final-fix"></script>

  <!-- Dashboard -->
  <script src="js/dashboard.js?v=final-fix"></script>

  <!-- Otros módulos -->
  <script src="js/residentes.js?v=final-fix"></script>
  <script src="js/gastos_comunes.js?v=final-fix"></script>
  <script src="js/comunicaciones.js?v=final-fix"></script>
  <script src="js/mantenciones.js?v=final-fix"></script>
  <script src="js/multas.js?v=final-fix"></script>
  <script src="js/asambleas.js?v=final-fix"></script>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const menuItems = document.querySelectorAll('#sidebar nav ul li[data-module]');
      function activaMenu(modulo) {
        menuItems.forEach(i => {
          i.classList.toggle('active', i.getAttribute('data-module') === modulo);
        });
      }

      menuItems.forEach(item => {
        item.addEventListener('click', () => {
          const modulo = item.getAttribute('data-module');
          const funcName = `cargar${modulo.charAt(0).toUpperCase() + modulo.slice(1).replace(/_([a-z])/g, g => g[1].toUpperCase())}`;
          if (typeof window[funcName] === 'function') {
            activaMenu(modulo);
            window[funcName]();
          } else {
            console.error(`La función ${funcName} no está definida.`);
          }
        });
      });
      window.activaMenu = activaMenu;

      if (window.authReadyPromise) {
        window.authReadyPromise.then(() => {
          console.log("Señal de autenticación recibida. El sistema está listo para cargar el dashboard.");
          document.getElementById('login-screen').style.display = 'none';
          document.getElementById('app').style.display = 'flex';
          cargarDashboard();
        });
      }
    });
  </script>
</body>
</html>

