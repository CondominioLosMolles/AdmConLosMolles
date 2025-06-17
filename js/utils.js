// Utilidades generales para toda la app

function mostrarSpinner() {
  if (!document.getElementById('spinner')) {
    const spinner = document.createElement('div');
    spinner.id = 'spinner';
    spinner.style.position = 'fixed';
    spinner.style.top = '0';
    spinner.style.left = '0';
    spinner.style.width = '100vw';
    spinner.style.height = '100vh';
    spinner.style.background = 'rgba(255,255,255,0.5)';
    spinner.style.display = 'flex';
    spinner.style.alignItems = 'center';
    spinner.style.justifyContent = 'center';
    spinner.innerHTML = `<div style="border: 8px solid #f3f3f3;border-top: 8px solid #2a7ca3;border-radius: 50%;width: 60px;height: 60px;animation: spin 1s linear infinite;"></div>
    <style>@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>`;
    document.body.appendChild(spinner);
  }
}
function ocultarSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.remove();
}
function mostrarMensaje(msg, tipo = 'info') {
  // Mensaje emergente simple
  alert(msg);
}
function limpiarMainContent() {
  document.getElementById('main-content').innerHTML = '';
}
