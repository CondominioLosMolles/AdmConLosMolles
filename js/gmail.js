// Enviar correos con Gmail API

async function enviarCorreo(destinatario, asunto, mensaje) {
  const email =
    `To: ${destinatario}\r\n` +
    `Subject: ${asunto}\r\n` +
    `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
    `${mensaje}`;
  const base64EncodedEmail = btoa(email).replace(/\+/g, '-').replace(/\//g, '_');
  await gapi.client.gmail.users.messages.send({
    userId: 'me',
    resource: { raw: base64EncodedEmail }
  });
}
