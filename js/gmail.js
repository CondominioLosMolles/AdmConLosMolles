// Enviar correos con Gmail API

/**
 * Convierte una cadena de texto UTF-8 a Base64 de forma segura,
 * manejando caracteres especiales como acentos y ñ.
 * @param {string} str La cadena de texto a codificar.
 * @returns {string} La cadena codificada en Base64.
 */
function utf8_to_b64(str) {
  // Esta línea es la clave: convierte los caracteres especiales a un formato compatible
  // antes de que btoa() los procese.
  return window.btoa(unescape(encodeURIComponent(str)));
}

/**
 * Envía un correo electrónico a través de la API de Gmail, con soporte para
 * caracteres especiales en el asunto y el cuerpo del mensaje.
 * @param {string|string[]} destinatarios - Un correo o un arreglo de correos.
 * @param {string} asunto - El asunto del correo.
 * @param {string} cuerpoHtml - El contenido del correo en formato HTML.
 */
async function enviarCorreo(destinatarios, asunto, cuerpoHtml) {
  try {
    const toField = Array.isArray(destinatarios) ? destinatarios.join(',') : destinatarios;

    // Se construye el correo completo como una cadena de texto.
    const emailSource = [
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      `To: ${toField}`,
      // Se codifica el asunto por separado para que los correos muestren los acentos correctamente.
      `Subject: =?utf-8?B?${utf8_to_b64(asunto)}?=`,
      '',
      cuerpoHtml
    ].join('\n');
    
    // Se utiliza la nueva función para codificar todo el mensaje de forma segura.
    const encodedMessage = utf8_to_b64(emailSource)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gapi.client.gmail.users.messages.send({
      'userId': 'me',
      'resource': {
        'raw': encodedMessage
      }
    });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw new Error(`No se pudo enviar el correo. Detalles: ${error.result?.error?.message || error.message}`);
  }
}
