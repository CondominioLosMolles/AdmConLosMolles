// js/drive.js

// --- INICIO CAMBIO: Se define la carpeta base y se añaden funciones ---
const CARPETA_BASE_ID = '1bfjcxMy4vlfZjwFgJoguhCxvS8Jlr9eZ';

/**
 * Busca una carpeta por nombre dentro de la carpeta base. Si no la encuentra, la crea.
 * @param {string} nombreCarpeta El nombre de la carpeta a buscar/crear (ej. "Parcela 14").
 * @returns {Promise<string>} El ID de la carpeta encontrada o recién creada.
 */
async function buscarOCrearCarpetaDeParcela(nombreCarpeta) {
  try {
    const query = `'${CARPETA_BASE_ID}' in parents and name = '${nombreCarpeta}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const response = await gapi.client.drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id; // Carpeta encontrada, devuelve su ID.
    } else {
      // Si no existe, la crea.
      console.log(`Carpeta "${nombreCarpeta}" no encontrada, creándola...`);
      const fileMetadata = {
        'name': nombreCarpeta,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [CARPETA_BASE_ID]
      };
      const createResponse = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });
      return createResponse.result.id; // Devuelve el ID de la nueva carpeta.
    }
  } catch (error) {
    console.error("Error al buscar o crear la carpeta de parcela:", error);
    throw new Error("No se pudo encontrar o crear la carpeta en Google Drive.");
  }
}

/**
 * Sube un archivo a una carpeta específica en Google Drive.
 * @param {File} file El objeto del archivo a subir.
 * @param {string} carpetaId El ID de la carpeta de destino en Drive.
 * @returns {Promise<object>} El objeto de respuesta de la API de Drive con el id y webViewLink.
 */
async function subirComprobante(file, carpetaId) {
  const metadata = {
    name: file.name,
    parents: [carpetaId]
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  // Se añaden los fields 'id' y 'webViewLink' para obtener la URL del archivo.
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
      body: form,
    }
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Error al subir el archivo: ${error.error.message}`);
  }
  return await res.json();
}
// --- FIN CAMBIO ---
