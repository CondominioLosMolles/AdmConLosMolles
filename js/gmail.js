// Enviar correos con Gmail API

async function enviarCorreo(destinatarios, asunto, mensaje) {
  // CAMBIO: Aceptar un array de destinatarios y unirlos en una cadena para el campo "To:"
  const toField = Array.isArray(destinatarios) ? destinatarios.join(',') : destinatarios;

  const email =
    `To: ${toField}\r\n` +
    `Subject: ${asunto}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    `${mensaje}`;
  const base64EncodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');
  await gapi.client.gmail.users.messages.send({
    userId: 'me',
    resource: { raw: base64EncodedEmail }
  });
}
