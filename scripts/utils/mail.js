// scripts/utils/mail.js - Funciones para enviar correos con Gmail API
async function sendEmail(to, subject, body) {
  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    body
  ].join('\r\n');

  const encodedRaw = btoa(raw).replace(/\+/g, '-').replace(/\//g, '_');

  try {
    await gapi.client.gmail.users.messages.send({
      userId: "me",
      resource: {
        raw: encodedRaw
      }
    });
    showSuccess("Correo enviado exitosamente");
    return true;
  } catch (error) {
    console.error("Error enviando correo:", error);
    showError("No se pudo enviar el correo");
    return false;
  }
}
