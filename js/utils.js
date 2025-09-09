// js/utils.js — versión estable y autocontenida
(function () {
  'use strict';

  /* ==========================
   * Utilidades de layout/base
   * ========================== */
  function _mainEl() {
    return (
      document.getElementById('main-content') ||
      document.querySelector('#contenido-principal') ||
      document.querySelector('#content') ||
      document.querySelector('main')
    );
  }

  // Limpia el contenedor principal (llamado por dashboard/gastos, etc.)
  window.limpiarMainContent = function () {
    const el = _mainEl();
    if (el) el.innerHTML = '';
  };

  window.mostrarSpinner = function () {
    const sp = document.getElementById('spinner');
    if (sp) sp.style.display = 'flex';
  };
  window.ocultarSpinner = function () {
    const sp = document.getElementById('spinner');
    if (sp) sp.style.display = 'none';
  };

  // Mensaje flotante simple
  window.mostrarMensaje = function (msg, tipo = 'info') {
    const box = document.createElement('div');
    box.className = `mensaje-flotante ${tipo}`;
    box.textContent = msg;
    document.body.appendChild(box);
    setTimeout(() => box.classList.add('visible'), 10);
    setTimeout(() => {
      box.classList.remove('visible');
      setTimeout(() => box.remove(), 400);
    }, 3000);
  };

  /* ==========================
   * Modal global reutilizable
   * ========================== */
  window.mostrarModalGlobal = function (titulo, cuerpoHtml, onGuardar, tamano = 'normal') {
    const cont   = document.getElementById('global-modal-container');
    const cnt    = document.getElementById('global-modal-content');
    const title  = document.getElementById('global-modal-title');
    const body   = document.getElementById('global-modal-body');
    const btnOk  = document.getElementById('global-modal-save');
    const btnCls = document.getElementById('global-modal-close');

    if (!cont || !cnt || !title || !body || !btnOk || !btnCls) {
      // Si tu HTML no tiene este modal, al menos no rompemos el flujo
      alert(titulo + '\n\n' + body?.innerText);
      return;
    }

    title.textContent = titulo;
    body.innerHTML = cuerpoHtml;

    // Evita listeners duplicados
    const nuevoOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(nuevoOk, btnOk);
    nuevoOk.onclick = onGuardar;

    btnCls.onclick = window.ocultarModalGlobal;

    if (tamano === 'large') cnt.classList.add('large');
    else cnt.classList.remove('large');

    cont.style.display = 'flex';
  };

  window.ocultarModalGlobal = function () {
    const cont = document.getElementById('global-modal-container');
    const body = document.getElementById('global-modal-body');
    if (cont) cont.style.display = 'none';
    if (body) body.innerHTML = '';
  };

  /* ==========================================================
   * Llamada central a Google Apps Script (Execution API gapi)
   * ========================================================== */
  /**
   * REQUIERE estar autenticado con gapi (auth.js lo hace).
   * Usa la Execution API (tu despliegue "Ejecutable de API": ...:run).
   */
  window.llamarAPI = async function (functionName, parameters = []) {
    // ⬇️ Pega aquí tu URL "Ejecutable de API" (termina en ...:run)
    const SCRIPT_URL = "https://script.googleapis.com/v1/scripts/AKfycbwj3AV8Qy7Gqj_Drn3TTHPsqKAN5orgtxrWTulaPGrsO2ZCWFo9jg0DiSbFhvgBrY19ww:run";

    const tokenObj = (window.gapi && gapi.auth && gapi.auth.getToken) ? gapi.auth.getToken() : null;
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
        // Formato de Execution API: clave "function"
        "function": functionName,
        "parameters": parameters,
        "devMode": true
      })
    });

    const text = await res.text();
    let json = {};
    try { json = text ? JSON.parse(text) : {}; } catch (e) {
      throw new Error('Respuesta no-JSON de la Execution API: ' + text);
    }

    if (!res.ok) {
      const msg = json?.error?.message || text || `HTTP ${res.status}`;
      throw new Error(`Execution API error: ${msg}`);
    }
    if (json.error) {
      const detail =
        (json.error.details && json.error.details[0] && json.error.details[0].errorMessage) ||
        json.error.message;
      throw new Error(detail || 'Ocurrió un error en Apps Script.');
    }

    // Normalmente: { response: { result: ... } }
    return (json.response && ('result' in json.response ? json.response.result : json.response)) || null;
  };

  /* =========================================
   * SHIM extra por si algún módulo lo requiere
   * ========================================= */
  if (typeof window.renderEnMainContent !== 'function') {
    window.renderEnMainContent = function (html) {
      const el = _mainEl();
      if (el) el.innerHTML = html;
    };
  }
})();
