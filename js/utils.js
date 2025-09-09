// js/utils.js - Versión estable

/* ==========================
 * Utilidades de layout/base
 * ========================== */
function limpiarMainContent() {
  const mainContent = document.getElementById('main-content')
    || document.querySelector('#contenido-principal')
    || document.querySelector('#content')
    || document.querySelector('main');
  if (mainContent) mainContent.innerHTML = '';
}

function mostrarSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = 'flex';
}
function ocultarSpinner() {
  const spinner = document.getElementById('spinner');
  if (spinner) spinner.style.display = 'none';
}

function mostrarMensaje(msg, tipo = 'info') {
  const container = document.createElement('div');
  container.className = `mensaje-flotante ${tipo}`;
  container.textContent = msg;
  document.body.appendChild(container);
  setTimeout(() => { container.classList.add('visible'); }, 10);
  setTimeout(() => {
    container.classList.remove('visible');
    setTimeout(() => { container.remove(); }, 500);
  }, 3000);
}

/* ==========================
 * Modal global reutilizable
 * ========================== */
function mostrarModalGlobal(titulo, cuerpoHtml, callbackGuardar, tamano = 'normal') {
  const modalContainer = document.getElementById('global-modal-container');
  const modalContent   = document.getElementById('global-modal-content');
  const modalTitle     = document.getElementById('global-modal-title');
  const modalBody      = document.getElementById('global-modal-body');
  const saveBtn        = document.getElementById('global-modal-save');
  const closeBtn       = document.getElementById('global-modal-close');

  if (!modalContainer) {
    console.error('El contenedor de modal global no existe en index.html');
    return;
  }

  modalTitle.textContent = titulo;
  modalBody.innerHTML = cuerpoHtml;

  // Reemplaza el botón para evitar listeners duplicados
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  newSaveBtn.onclick = callbackGuardar;

  closeBtn.onclick = ocultarModalGlobal;

  if (tamano === 'large') modalContent.classList.add('large');
  else modalContent.classList.remove('large');

  modalContainer.style.display = 'flex';
}

function ocultarModalGlobal() {
  const modalContainer = document.getElementById('global-modal-container');
  if (modalContainer) {
    modalContainer.style.display = 'none';
    const body = document.getElementById('global-modal-body');
    if (body) body.innerHTML = '';
  }
}

/* ==========================================================
 * Llamada central a Google Apps Script (Execution API gapi)
 * ========================================================== */
/**
 * REQUIERE que ya estés autenticado con gapi (tu auth.js lo hace).
 * Usa la Execution API: URL "Ejecutable de API" del deployment.
 */
async function llamarAPI(functionName, parameters = []) {
  // Pega aquí tu URL "Ejecutable de API" (termina en ...:run)
  const SCRIPT_URL = "https://script.googleapis.com/v1/scripts/AKfycbw_FdUARsUgDyyjIezpdN_59QCr02Zl6g8eI64IA4CzdXY7ibXvAGh1FK-mTwDYXv--8Q:run";

  try {
    const tokenObj = gapi.auth.getToken();
    if (!tokenObj || !tokenObj.access_token) {
      throw new Error('No hay token OAuth. Inicia sesión con Google antes de llamar a la API.');
    }

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenObj.access_token}`
      },
      body: JSON.stringify({
        // OJO: en Execution API la clave es "function" (no "functionName")
        "function": functionName,
        "parameters": parameters,
        "devMode":
