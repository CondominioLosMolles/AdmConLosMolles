/**
 * Función central para comunicarse con la Google Apps Script Execution API.
 * REQUIERE: gapi.auth.getToken() válido (ya lo gestionas en auth.js).
 *
 * @param {string} functionName - Nombre de la función en tu Apps Script.
 * @param {Array} parameters - Parámetros posicionales para esa función.
 * @returns {Promise<any>} - Respuesta devuelta por la función del Apps Script.
 */
async function llamarAPI(functionName, parameters = []) {
  // Cambia este scriptId por el de tu proyecto (si ya está correcto, déjalo tal cual).
  const SCRIPT_URL = "https://script.googleapis.com/v1/scripts/AKfycbw_FdUARsUgDyyjIezpdN_59QCr02Zl6g8eI64IA4CzdXY7ibXvAGh1FK-mTwDYXv--8Q:run";

  try {
    const tokenObj = gapi.auth.getToken();
    if (!tokenObj || !tokenObj.access_token) {
      throw new Error('No hay token de Google válido. Asegura login con gapi antes de llamar a la API.');
    }

    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenObj.access_token}`
      },
      body: JSON.stringify({
        // Formato requerido por Execution API
        "function": functionName,
        "parameters": parameters,
        "devMode": true
      }),
    });

    const text = await res.text();
    let jsonResponse = {};
    try { jsonResponse = text ? JSON.parse(text) : {}; } catch (_e) {}

    if (!res.ok) {
      // Mensaje detallado de error HTTP/Execution API
      const errMsg = jsonResponse?.error?.message || text || `HTTP ${res.status}`;
      throw new Error(`Execution API error: ${errMsg}`);
    }

    // Execution API devuelve { done, response, error }
    if (jsonResponse.error) {
      const detail = jsonResponse.error.details?.[0]?.errorMessage || jsonResponse.error.message;
      throw new Error(detail || 'Ocurrió un error en el Apps Script.');
    }

    // Algunos runtimes devuelven {response: {result: ...}}
    const result = jsonResponse.response?.result ?? jsonResponse.response;
    return result;

  } catch (error) {
    console.error(`Error llamando a '${functionName}':`, error);
    throw error;
  }
}
