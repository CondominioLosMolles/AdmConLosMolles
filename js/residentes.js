// js/residentes.js

// --------------------------------------------------------------------------------
// NUEVA FUNCIÓN: Para subir el archivo a la carpeta de Drive de la parcela
// --------------------------------------------------------------------------------
// Esta función busca la carpeta de la parcela, la crea si no existe,
// sube el archivo y devuelve el enlace para visualizarlo.
async function subirCertificadoYObtenerLink(file, numeroParcela) {
  if (!numeroParcela) {
    throw new Error("El N° de Parcela es requerido para subir el documento.");
  }
  
  // ID de la carpeta base en Google Drive que contiene todas las carpetas de las parcelas.
  const BASE_FOLDER_ID = '1bfjcxMy4vlfZjwFgJoguhCxvS8Jlr9eZ';
  let carpetaParcelaId;

  // 1. Buscar la carpeta de la parcela (ej: "Parcela 14")
  const query = `name='Parcela ${numeroParcela}' and '${BASE_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const listRes = await gapi.client.drive.files.list({
    q: query,
    fields: 'files(id)',
    spaces: 'drive'
  });

  if (listRes.result.files && listRes.result.files.length > 0) {
    carpetaParcelaId = listRes.result.files[0].id;
  } else {
    // 2. Si no existe la carpeta, la crea.
    mostrarMensaje(`Creando carpeta para Parcela ${numeroParcela}...`);
    const createRes = await gapi.client.drive.files.create({
      resource: {
        name: `Parcela ${numeroParcela}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [BASE_FOLDER_ID]
      },
      fields: 'id'
    });
    carpetaParcelaId = createRes.result.id;
  }

  // 3. Subir el archivo a la carpeta encontrada o creada.
  const metadata = {
    name: file.name,
    parents: [carpetaParcelaId]
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
    body: form
  });

  const fileData = await uploadRes.json();
  if (fileData.error) {
    throw new Error(fileData.error.message);
  }

  // 4. Hacer el archivo público (visible para cualquiera con el enlace) y obtener el link.
  const fileId = fileData.id;
  await gapi.client.drive.permissions.create({
    fileId: fileId,
    resource: {
      role: 'reader',
      type: 'anyone'
    }
  });

  const getFileRes = await gapi.client.drive.files.get({
    fileId: fileId,
    fields: 'webViewLink'
  });

  return getFileRes.result.webViewLink;
}


// --------------------------------------------------------------------------------
// NUEVA FUNCIÓN: Para mostrar el modal con los detalles completos del residente
// --------------------------------------------------------------------------------
function mostrarModalDetalleResidente(datos) {
  const modal = document.getElementById('modalResidente'); // Reutilizamos el contenedor del modal
  modal.style.display = 'flex';
  
  // Asumimos que `datos` es el array completo de la fila del residente (columnas A a K)
  // B:Nombre, C:RUT, D:Parcela, E:Dirección, F:Email, G:Tel, H:Estado, I:ValorGC, J:[vacío], K:Certificado
  const [id, nombre, rut, parcela, direccion, email, tel, estado, valorGC, , linkCertificado] = datos;

  let linkHtml = 'No disponible';
  if (linkCertificado) {
    linkHtml = `<a href="${linkCertificado}" target="_blank">Ver Certificado</a>`;
  }

  modal.innerHTML = `
    <div style="min-width: 400px;">
      <h3 style="margin-bottom:18px;">Detalles del Residente</h3>
      <div id="detalleResidenteContent">
        <p><strong>Nombre Completo:</strong> ${nombre || ''}</p>
        <p><strong>RUT:</strong> ${rut || ''}</p>
        <p><strong>N° Parcela:</strong> ${parcela || ''}</p>
        <p><strong>Dirección:</strong> ${direccion || ''}</p>
        <p><strong>Email:</strong> ${email || ''}</p>
        <p><strong>Teléfono:</strong> ${tel || ''}</p>
        <p><strong>Estado:</strong> ${estado || ''}</p>
        <p><strong>Valor Gasto Común:</strong> ${valorGC || ''}</p>
        <p><strong>Certificado Dominio Vigente:</strong> ${linkHtml}</p>
      </div>
      <div style="margin-top:18px;text-align:right;">
        <button class="btn secondary" type="button" id="btnCerrarModalDetalle">Cerrar</button>
      </div>
    </div>
  `;

  document.getElementById('btnCerrarModalDetalle').onclick = () => modal.style.display = 'none';
}


async function cargarResidentes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [];
  try {
    // IMPORTANTE: Asegúrate que `obtenerResidentes` ahora trae los datos hasta la columna K
    residentes = await obtenerResidentes(); 
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar residentes: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Residentes</h2>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <input type="text" id="busquedaResidente" placeholder="Buscar por nombre, RUT o N° Parcela" style="width:40%;"/>
      <div>
        <button class="btn" id="btnAgregarResidente">Agregar Residente</button>
        <button class="btn secondary" id="btnExportarResidentes">Descargar Excel</button>
      </div>
    </div>
    <div id="tablaResidentes"></div>
    <div id="modalResidente" style="display:none;"></div>
  `;

  function renderTabla(filtro = '') {
    const filtrados = residentes.filter(r => {
      // Usamos índices para acceder a los datos para evitar errores si la fila tiene más columnas.
      const nombre = r[1] || '';
      const rut = r[2] || '';
      const parcela = r[3] || '';
      const str = `${nombre} ${rut} ${parcela}`.toLowerCase();
      return str.includes(filtro.toLowerCase());
    });

    let html = `
      <table class="table">
        <thead>
          <tr>
            <th style="width:200px;">Nombre Completo</th>
            <th style="width:90px;">RUT</th>
            <th style="width:60px;">N° Parcela</th>
            <th style="width:200px;">Dirección</th>
            <th style="width:140px;">Email</th>
            <th style="width:80px;">Teléfono</th>
            <th style="width:70px;">Estado</th>
            <th style="width:60px;">Valor GC</th>
            <th style="width:110px;">Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const r of filtrados) {
      // MODIFICACIÓN: Se añade la clase 'fila-residente' y 'data-id' para el modal de detalles.
      // Se usan índices para asegurar que se obtienen los datos correctos.
      const id = r[0], nombre = r[1], rut = r[2], parcela = r[3], direccion = r[4], email = r[5], tel = r[6], estado = r[7], valorGC = r[8];
      html += `
        <tr class="fila-residente" data-id="${id}" title="Ver detalles de ${nombre}">
          <td style="width:200px;" title="${nombre}">${nombre}</td>
          <td style="width:90px;" title="${rut}">${rut}</td>
          <td style="width:60px;" title="${parcela}">${parcela}</td>
          <td style="width:200px;" title="${direccion}">${direccion}</td>
          <td style="width:140px;" title="${email}">${email}</td>
          <td style="width:80px;" title="${tel}">${tel}</td>
          <td style="width:70px;">
            <span class="estado-tag estado-${(estado||'').toLowerCase()}">${estado}</span>
          </td>
          <td style="width:60px;" title="${valorGC}">${valorGC}</td>
          <td style="width:110px;">
            <button class="btn secondary btn-editar" data-id="${id}" title="Editar">✏️</button>
            <button class="btn secondary btn-eliminar" data-id="${id}" title="Eliminar">🗑️</button>
          </td>
        </tr>
      `;
    }
    html += '</tbody></table>';
    document.getElementById('tablaResidentes').innerHTML = html;
  }
  renderTabla();

  document.getElementById('busquedaResidente').addEventListener('input', e => {
    renderTabla(e.target.value);
  });

  document.getElementById('btnExportarResidentes').onclick = () => {
    // MODIFICACIÓN: Se añade la columna "Certificado" a la exportación de Excel.
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre Completo", "RUT", "N° Parcela", "Dirección", "Email", "Teléfono", "Estado", "Valor Gasto Común", "Certificado"],
      ...residentes.map(r => [r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[10]]) // Se extraen las columnas B-I y K
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Residentes.xlsx");
  };

  function mostrarModalResidente(datos = null) {
    const modal = document.getElementById('modalResidente');
    modal.style.display = 'flex';
    const isEdit = !!datos;
    // MODIFICACIÓN: Se añade el campo para subir el archivo y un enlace al certificado existente.
    const linkCertificado = datos && datos[10] ? `<a href="${datos[10]}" target="_blank">Ver Documento Actual</a>` : 'No hay documento cargado.';

    modal.innerHTML = `
      <div>
        <h3 style="margin-bottom:18px;">${isEdit ? 'Editar' : 'Agregar'} Residente</h3>
        <form id="formResidente">
          <input type="hidden" name="id" value="${datos ? datos[0] : ''}">
          <input type="hidden" name="linkCertificadoActual" value="${datos ? (datos[10] || '') : ''}">
          <label>Nombre Completo</label>
          <input name="nombre" required value="${datos ? datos[1] : ''}">
          <label>RUT</label>
          <input name="rut" required value="${datos ? datos[2] : ''}">
          <label>N° Parcela</label>
          <input name="parcela" required value="${datos ? datos[3] : ''}">
          <label>Dirección</label>
          <input name="direccion" required value="${datos ? datos[4] : ''}">
          <label>Email</label>
          <input name="email" type="email" required value="${datos ? datos[5] : ''}">
          <label>Teléfono</label>
          <input name="tel" required value="${datos ? datos[6] : ''}">
          <label>Estado</label>
          <select name="estado" required>
            <option value="Activo" ${datos && datos[7]==='Activo'?'selected':''}>Activo</option>
            <option value="Moroso" ${datos && datos[7]==='Moroso'?'selected':''}>Moroso</option>
            <option value="Inactivo" ${datos && datos[7]==='Inactivo'?'selected':''}>Inactivo</option>
          </select>
          <label>Valor Gasto Común</label>
          <input name="valorGC" required type="number" value="${datos ? datos[8] : ''}">
          
          <label>Certificado Dominio Vigente</label>
          <input name="certificadoFile" type="file" accept=".pdf,.jpg,.jpeg,.png">
          <div style="font-size:12px;margin-top:4px;">${isEdit ? linkCertificado : ''}</div>
          
          <div style="margin-top:18px;text-align:right;">
            <button class="btn" type="submit">${isEdit ? 'Guardar Cambios' : 'Agregar'}</button>
            <button class="btn secondary" type="button" id="btnCerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    document.getElementById('btnCerrarModal').onclick = () => modal.style.display = 'none';
    document.getElementById('formResidente').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const fileInput = e.target.querySelector('[name="certificadoFile"]');
      const file = fileInput.files[0];
      let linkCertificado = fd.get('linkCertificadoActual'); // Mantiene el link antiguo si no se sube uno nuevo.
      
      mostrarSpinner();

      // Si se seleccionó un archivo nuevo, se sube.
      if (file) {
        try {
          const nParcela = fd.get('parcela');
          linkCertificado = await subirCertificadoYObtenerLink(file, nParcela);
          mostrarMensaje('Documento subido con éxito.');
        } catch (uploadError) {
          ocultarSpinner();
          mostrarMensaje(`Error al subir documento: ${uploadError.message}`, 'error');
          return; // Detiene el proceso si falla la subida del archivo.
        }
      }

      // MODIFICACIÓN: El array de datos ahora incluye un espacio para la columna J y el link en la columna K.
      const data = [
        fd.get('id') || '',         // A
        fd.get('nombre'),           // B
        fd.get('rut'),              // C
        fd.get('parcela'),          // D
        fd.get('direccion'),        // E
        fd.get('email'),            // F
        fd.get('tel'),              // G
        fd.get('estado'),           // H
        fd.get('valorGC'),          // I
        '',                         // J (Columna vacía, si existe)
        linkCertificado             // K
      ];

      try {
        if (isEdit) {
          // Asumimos que actualizarResidente puede manejar el array con 11 elementos.
          await actualizarResidente(data); 
        } else {
          // Asumimos que agregarResidente puede manejar el array con 11 elementos.
          await agregarResidente(data);
        }
        modal.style.display = 'none';
        cargarResidentes(); // Recarga la lista para mostrar los cambios.
      } catch (e) {
        mostrarMensaje('Error al guardar: ' + e.message, 'error');
      }
      ocultarSpinner();
    };
  }

  document.getElementById('btnAgregarResidente').onclick = () => mostrarModalResidente();

  document.getElementById('tablaResidentes').onclick = async (e) => {
    // MODIFICACIÓN: Se añade un nuevo manejador de eventos para las filas.
    // Si se hace clic en una fila (y no en un botón dentro de ella), se muestra el modal de detalles.
    const fila = e.target.closest('.fila-residente');
    const esBotonEditar = e.target.classList.contains('btn-editar');
    const esBotonEliminar = e.target.classList.contains('btn-eliminar');

    if (fila && !esBotonEditar && !esBotonEliminar) {
      const id = fila.dataset.id;
      const datosResidente = residentes.find(r => r[0] === id);
      if (datosResidente) {
        mostrarModalDetalleResidente(datosResidente);
      }
      return; // Detiene la ejecución para no interferir con los otros botones.
    }
    
    // El código existente para editar y eliminar permanece igual.
    if (esBotonEditar) {
      const id = e.target.dataset.id;
      const datos = residentes.find(r => r[0] === id);
      mostrarModalResidente(datos);
    }
    if (esBotonEliminar) {
      const id = e.target.dataset.id;
      if (!confirm('¿Está seguro de que desea eliminar a este residente?')) return;
      mostrarSpinner();
      try {
        // ... (Tu lógica de eliminación no se ha modificado)
        const residentesActualizados = await obtenerResidentes();
        const idx = residentesActualizados.findIndex(r => r[0] === id);
        if (idx === -1) throw new Error('No encontrado');
        const row = idx + 2;
        await gapi.client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          resource: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: SHEET_ID_RESIDENTES,
                  dimension: "ROWS",
                  startIndex: row - 1,
                  endIndex: row
                }
              }
            }]
          }
        });
        mostrarMensaje('Residente eliminado correctamente');
        cargarResidentes();
      } catch (e) {
        mostrarMensaje('Error al eliminar: ' + (e.result?.error?.message || e.message || e), 'error');
      }
      ocultarSpinner();
    }
  };

  ocultarSpinner();
}

document.querySelector('[data-module="residentes"]').addEventListener('click', cargarResidentes);
