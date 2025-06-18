// js/drive.js

// Sube un archivo a una carpeta específica en Google Drive
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
      // CORRECCIÓN: Se ajusta cómo se obtiene el token de acceso desde gapi
      headers: new Headers({'Authorization': 'Bearer ' + gapi.client.getToken().access_token}),
      body: form,
    }
  );
  return await res.json();
}


// ===================================================================
// -------- FUNCIÓN NUEVA PARA BUSCAR O CREAR CARPETAS --------
// ===================================================================

/**
 * Busca una carpeta para una parcela específica dentro de una carpeta principal.
 * Si no la encuentra, la crea.
 * Devuelve el ID de la carpeta encontrada o recién creada.
 */
async function obtenerCarpetaResidente(numeroParcela) {
  // ID de la carpeta principal "Parcelas Pagos" que me proporcionaste.
  const CARPETA_PRINCIPAL_ID = '1bfjcxMy4vlfZjwFgJoguhCxvS8Jlr9eZ';
  const nombreCarpetaBuscada = `Parcela ${numeroParcela}`;

  try {
    // 1. Buscar si la carpeta ya existe
    const busquedaResponse = await gapi.client.drive.files.list({
      q: `name='${nombreCarpetaBuscada}' and '${CARPETA_PRINCIPAL_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });

    if (busquedaResponse.result.files.length > 0) {
      // Si se encuentra, devuelve el ID de la primera coincidencia
      const carpetaId = busquedaResponse.result.files[0].id;
      console.log(`Carpeta encontrada para Parcela ${numeroParcela}. ID: ${carpetaId}`);
      return carpetaId;
    } else {
      // 2. Si no se encuentra, se crea la carpeta
      console.log(`No se encontró carpeta para Parcela ${numeroParcela}. Creando una nueva...`);
      const fileMetadata = {
        'name': nombreCarpetaBuscada,
        'mimeType': 'application/vnd.google-apps.folder',
        'parents': [CARPETA_PRINCIPAL_ID]
      };

      const creacionResponse = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });
      
      const nuevaCarpetaId = creacionResponse.result.id;
      console.log(`Carpeta creada con éxito. Nuevo ID: ${nuevaCarpetaId}`);
      return nuevaCarpetaId;
    }
  } catch (error) {
    console.error("Error al buscar o crear la carpeta en Drive:", error);
    mostrarMensaje("Error al acceder a las carpetas de Drive: " + error.result.error.message, 'error');
    throw new Error("No se pudo obtener la carpeta del residente en Drive.");
  }
}
