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
// ================================================================================
// INICIO DEL CÓDIGO ACTUALIZADO PARA COPIAR Y PEGAR
// ================================================================================

async function cargarResidentes() {
  limpiarMainContent();
  mostrarSpinner();

  // --- SOLUCIÓN PUNTO 1: Se inyecta CSS para el efecto hover en las filas ---
  // Se verifica si el estilo ya existe para no agregarlo múltiples veces.
  if (!document.getElementById('residentes-style')) {
    const style = document.createElement('style');
    style.id = 'residentes-style';
    style.textContent = `
      .fila-residente:hover {
        background-color: #f2f8ff; /* Color celeste claro para resaltar */
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }
  // --- FIN SOLUCIÓN PUNTO 1 ---

  let residentes = [];
  try {
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
    <div id="modalResidente" class="modal-backdrop" style="display:none;"></div>
  `;

  function renderTabla(filtro = '') {
    const filtrados = residentes.filter(r => {
      const nombre = r[1] || '';
      const rut = r[2] || '';
      const parcela = r[3] || '';
      const str = `${nombre} ${rut} ${parcela}`.toLowerCase();
      return str.includes(filtro.toLowerCase());
    });

    // --- SOLUCIÓN PUNTO 2: Se quitan las cabeceras de Dirección y Teléfono ---
    let html = `
      <table class="table">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>RUT</th>
            <th>N° Parcela</th>
            <th>Email</th>
            <th>Estado</th>
            <th>Valor GC</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;
    // --- FIN SOLUCIÓN PUNTO 2 ---
    
    for (const r of filtrados) {
      const id = r[0], nombre = r[1], rut = r[2], parcela = r[3], email = r[5], estado = r[7], valorGC = r[8];
      
      // --- SOLUCIÓN PUNTO 2: Se quitan las celdas de Dirección y Teléfono de la fila ---
      html += `
        <tr class="fila-residente" data-id="${id}" title="Ver detalles de ${nombre}">
          <td title="${nombre}">${nombre}</td>
          <td title="${rut}">${rut}</td>
          <td title="${parcela}">${parcela}</td>
          <td title="${email}">${email}</td>
          <td>
            <span class="estado-tag estado-${(estado||'').toLowerCase()}">${estado}</span>
          </td>
          <td title="${valorGC}">${valorGC}</td>
          <td>
            <button class="btn secondary btn-editar" data-id="${id}" title="Editar">✏️</button>
            <button class="btn secondary btn-eliminar" data-id="${id}" title="Eliminar">🗑️</button>
          </td>
        </tr>
      `;
      // --- FIN SOLUCIÓN PUNTO 2 ---
    }
    html += '</tbody></table>';
    document.getElementById('tablaResidentes').innerHTML = html;
  }
  renderTabla();

  document.getElementById('busquedaResidente').addEventListener('input', e => {
    renderTabla(e.target.value);
  });

  document.getElementById('btnExportarResidentes').onclick = () => {
    // Se mantiene la exportación a Excel con todos los datos por si es necesario.
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre Completo", "RUT", "N° Parcela", "Dirección", "Email", "Teléfono", "Estado", "Valor Gasto Común", "Certificado"],
      ...residentes.map(r => [r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[10]])
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Residentes.xlsx");
  };

  // El resto de las funciones auxiliares (mostrarModalResidente, el manejador de clicks, etc.)
  // permanecen dentro de cargarResidentes como en la versión anterior, no es necesario pegarlas de nuevo
  // si solo reemplazas la función cargarResidentes completa. La pego aquí para que no haya dudas.

  function mostrarModalResidente(datos = null) {
    const modal = document.getElementById('modalResidente');
    modal.style.display = 'flex';
    const isEdit = !!datos;
    const linkCertificado = datos && datos[10] ? `<a href="${datos[10]}" target="_blank">Ver Documento Actual</a>` : 'No hay documento cargado.';

    modal.innerHTML = `
      <div class="modal-content">
        <h3 style="margin-bottom:18px;">${isEdit ? 'Editar' : 'Agregar'} Residente</h3>
        <form id="formResidente">
          <input type="hidden" name="id" value="${datos ? datos[0] : ''}">
          <input type="hidden" name="linkCertificadoActual" value="${datos ? (datos[10] || '') : ''}">
          <label>Nombre Completo</label>
          <input name="nombre" required value="${datos ? (datos[1] || '') : ''}">
          <label>RUT</label>
          <input name="rut" required value="${datos ? (datos[2] || '') : ''}">
          <label>N° Parcela</label>
          <input name="parcela" required value="${datos ? (datos[3] || '') : ''}">
          <label>Dirección</label>
          <input name="direccion" required value="${datos ? (datos[4] || '') : ''}">
          <label>Email</label>
          <input name="email" type="email" required value="${datos ? (datos[5] || '') : ''}">
          <label>Teléfono</label>
          <input name="tel" required value="${datos ? (datos[6] || '') : ''}">
          <label>Estado</label>
          <select name="estado" required>
            <option value="Activo" ${datos && datos[7]==='Activo'?'selected':''}>Activo</option>
            <option value="Moroso" ${datos && datos[7]==='Moroso'?'selected':''}>Moroso</option>
            <option value="Inactivo" ${datos && datos[7]==='Inactivo'?'selected':''}>Inactivo</option>
          </select>
          <label>Valor Gasto Común</label>
          <input name="valorGC" required type="number" value="${datos ? (datos[8] || '') : ''}">
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
      let linkCertificado = fd.get('linkCertificadoActual'); 
      
      mostrarSpinner();

      if (file) {
        try {
          const nParcela = fd.get('parcela');
          linkCertificado = await subirCertificadoYObtenerLink(file, nParcela);
          mostrarMensaje('Documento subido con éxito.');
        } catch (uploadError) {
          ocultarSpinner();
          mostrarMensaje(`Error al subir documento: ${uploadError.message}`, 'error');
          return;
        }
      }

      const data = [
        fd.get('id') || '', fd.get('nombre'), fd.get('rut'), fd.get('parcela'),
        fd.get('direccion'), fd.get('email'), fd.get('tel'), fd.get('estado'),
        fd.get('valorGC'), '', linkCertificado 
      ];

      try {
        if (isEdit) {
          await actualizarResidente(data); 
        } else {
          await agregarResidente(data);
        }
        modal.style.display = 'none';
        cargarResidentes();
      } catch (err) {
        mostrarMensaje('Error al guardar: ' + err.message, 'error');
      }
      ocultarSpinner();
    };
  }

  document.getElementById('btnAgregarResidente').onclick = () => mostrarModalResidente();

  document.getElementById('tablaResidentes').onclick = async (e) => {
    const fila = e.target.closest('.fila-residente');
    const esBotonEditar = e.target.closest('.btn-editar');
    const esBotonEliminar = e.target.closest('.btn-eliminar');

    if (esBotonEditar) {
      const id = esBotonEditar.dataset.id;
      const datos = residentes.find(r => r[0] === id);
      mostrarModalResidente(datos);
      return;
    }
    
    if (esBotonEliminar) {
      const id = esBotonEliminar.dataset.id;
      if (!confirm('¿Está seguro de que desea eliminar a este residente?')) return;
      mostrarSpinner();
      try {
        await eliminarResidente(id); // Asumiendo que esta función ya existe y funciona.
        mostrarMensaje('Residente eliminado correctamente');
        cargarResidentes();
      } catch (err) {
        mostrarMensaje('Error al eliminar: ' + (err.result?.error?.message || err.message || err), 'error');
      }
      ocultarSpinner();
      return;
    }

    if (fila) {
      const id = fila.dataset.id;
      const datosResidente = residentes.find(r => r[0] === id);
      if (datosResidente) {
        // La función mostrarModalDetalleResidente no se ha modificado y seguirá mostrando todos los datos.
        mostrarModalDetalleResidente(datosResidente);
      }
    }
  };

  ocultarSpinner();
}

// ================================================================================
// FIN DEL CÓDIGO ACTUALIZADO
// ================================================================================

