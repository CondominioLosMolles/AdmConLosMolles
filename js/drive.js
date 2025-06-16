// Subir archivos a Google Drive (comprobantes, facturas, etc.)

async function subirComprobante(file, carpetaId) {
  const metadata = {
    name: file.name,
    parents: [carpetaId]
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', file);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: new Headers({'Authorization': 'Bearer ' + gapi.auth.getToken().access_token}),
      body: form,
    }
  );
  return await res.json();
}
