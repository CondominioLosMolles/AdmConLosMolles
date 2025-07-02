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
  // Asegúrate que este ID sea correcto.
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

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + gapi.auth.getToken().access_token }),
    body: form
  });

  const fileData = await uploadRes.json();
  if (fileData.error) {
    throw new Error(fileData.error.message);
  }
  
  // No es necesario hacer el archivo público si el administrador es el único que necesita verlo a través del link.
  // Si se necesita compartir con el residente, se puede descomentar la siguiente sección.
  /*
  await gapi.client.drive.permissions.create({
    fileId: fileData.id,
    resource: { role: 'reader', type: 'anyone' }
  });
  */

  return fileData.webViewLink;
}


// --------------------------------------------------------------------------------
// NUEVA FUNCIÓN: Para mostrar el modal con los detalles completos del residente
// --------------------------------------------------------------------------------
function mostrarModalDetalleResidente(datos) {
  // Asumimos que `datos` es el array completo de la fila del residente (columnas A a N)
  const [
    id, nombre, rut, parcela, direccion, email, tel, estado, valorGC, , 
    linkCertificado, , saldoConvenio, saldoFavor
  ] = datos;

  let linkHtml = 'No disponible';
  if (linkCertificado) {
    linkHtml = `<a href="${linkCertificado}" class="btn btn-sm" target="_blank">Ver Certificado</a>`;
  }

  const cuerpoHtml = `
      <div id="detalleResidenteContent">
        <p><strong>Nombre Completo:</strong> ${nombre || ''}</p>
        <p><strong>RUT:</strong> ${rut || ''}</p>
        <p><strong>N° Parcela:</strong> ${parcela || ''}</p>
        <p><strong>Dirección:</strong> ${direccion || ''}</p>
        <p><strong>Email:</strong> ${email || ''}</p>
        <p><strong>Teléfono:</strong> ${tel || ''}</p>
        <p><strong>Estado:</strong> ${estado || ''}</p>
        <p><strong>Valor Gasto Común:</strong> $${parseFloat(valorGC || 0).toLocaleString('es-CL')}</p>
        <p><strong>Saldo Convenio:</strong> $${parseFloat(saldoConvenio || 0).toLocaleString('es-CL')}</p>
        <p><strong>Saldo a Favor:</strong> $${parseFloat(saldoFavor || 0).toLocaleString('es-CL')}</p>
        <p><strong>Certificado Dominio Vigente:</strong> ${linkHtml}</p>
      </div>
  `;

  // Se usa el modal global para consistencia
  mostrarModalGlobal(`Detalles de ${nombre}`, cuerpoHtml, () => {
      // Opcional: Lógica del botón "Guardar", si es que lo hubiera. Por ahora, solo cierra.
      ocultarModalGlobal();
  });
  // Ocultar el botón de guardar si no se necesita.
  document.getElementById('global-modal-save').style.display = 'none';
}

// ================================================================================
// INICIO DEL CÓDIGO ACTUALIZADO
// ================================================================================

async function cargarResidentes() {
  limpiarMainContent();
  mostrarSpinner();

  if (!document.getElementById('residentes-style')) {
    const style = document.createElement('style');
    style.id = 'residentes-style';
    style.textContent = `.fila-residente:hover { background-color: #f2f8ff; cursor: pointer; }`;
    document.head.appendChild(style);
  }

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
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap: wrap; gap: 1rem; margin-bottom:16px;">
      <h2>Residentes</h2>
      <input type="text" id="busquedaResidente" placeholder="Buscar por nombre, RUT o N° Parcela" style="flex: 1; min-width: 250px; max-width: 400px;"/>
      <div>
        <button class="btn" id="btnAgregarResidente">Agregar Residente</button>
        <button class="btn secondary" id="btnExportarResidentes">Descargar Excel</button>
      </div>
    </div>
    <div id="tablaResidentes" class="table-container"></div>
    <div id="modalResidenteContainer"></div>
  `;

  function renderTabla(filtro = '') {
    const filtrados = residentes.filter(r => {
      const busquedaStr = [r[1], r[2], r[3]].join(' ').toLowerCase(); // Nombre, RUT, Parcela
      return busquedaStr.includes(filtro.toLowerCase());
    });

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
    
    for (const r of filtrados) {
      const [id, nombre, rut, parcela, , email, , estado, valorGC] = r;
      
      html += `
        <tr class="fila-residente" data-id="${id}" title="Click para ver detalles de ${nombre}">
          <td style="white-space: normal;">${nombre || ''}</td>
          <td>${rut || ''}</td>
          <td>${parcela || ''}</td>
          <td style="white-space: normal;">${email || ''}</td>
          <td><span class="estado-tag estado-${(estado||'').toLowerCase()}">${estado || 'N/A'}</span></td>
          <td>$${parseFloat(valorGC || 0).toLocaleString('es-CL')}</td>
          <td>
            <button class="btn btn-sm secondary btn-editar" data-id="${id}" title="Editar">✏️</button>
            <button class="btn btn-sm danger btn-eliminar" data-id="${id}" title="Eliminar">🗑️</button>
          </td>
        </tr>
      `;
    }
    html += '</tbody></table>';
    document.getElementById('tablaResidentes').innerHTML = html;
  }
  renderTabla();

  document.getElementById('busquedaResidente').addEventListener('input', e => renderTabla(e.target.value));

  document.getElementById('btnExportarResidentes').onclick = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["ID", "Nombre", "RUT", "Parcela", "Dirección", "Email", "Teléfono", "Estado", "Valor GC", "Contacto Principal", "Link Certificado", "Deuda Convenio Inicial", "Saldo Convenio", "Saldo a Favor"],
      ...residentes
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residentes");
    XLSX.writeFile(wb, "Reporte_Residentes.xlsx");
  };

  function mostrarModalResidente(datos = null) {
    const isEdit = !!datos;
    const linkCertificado = datos && datos[10] ? `<a href="${datos[10]}" target="_blank" class="btn btn-sm">Ver Documento</a>` : 'No hay documento.';

    const cuerpoHtml = `
      <form id="formResidente">
        <input type="hidden" name="id" value="${datos ? datos[0] : ''}">
        <input type="hidden" name="linkCertificadoActual" value="${datos ? (datos[10] || '') : ''}">
        <div class="form-grid">
            <div><label>Nombre Completo</label><input name="nombre" required value="${datos ? (datos[1] || '') : ''}"></div>
            <div><label>RUT</label><input name="rut" required value="${datos ? (datos[2] || '') : ''}"></div>
            <div><label>N° Parcela</label><input name="parcela" type="number" required value="${datos ? (datos[3] || '') : ''}"></div>
            <div><label>Teléfono</label><input name="tel" required value="${datos ? (datos[6] || '') : ''}"></div>
            <div style="grid-column: 1 / -1;"><label>Email</label><input name="email" type="email" required value="${datos ? (datos[5] || '') : ''}"></div>
            <div style="grid-column: 1 / -1;"><label>Dirección</label><input name="direccion" required value="${datos ? (datos[4] || '') : ''}"></div>
            <div><label>Estado</label>
                <select name="estado" required>
                    <option value="Activo" ${datos && datos[7]==='Activo'?'selected':''}>Activo</option>
                    <option value="Moroso" ${datos && datos[7]==='Moroso'?'selected':''}>Moroso</option>
                    <option value="Inactivo" ${datos && datos[7]==='Inactivo'?'selected':''}>Inactivo</option>
                </select>
            </div>
            <div><label>Valor Gasto Común</label><input name="valorGC" required type="number" value="${datos ? (datos[8] || '') : ''}"></div>
            <div><label>¿Es Contacto Principal?</label>
                <select name="contactoPrincipal" required>
                    <option value="SI" ${datos && datos[9]==='SI'?'selected':''}>Sí</option>
                    <option value="NO" ${datos && (datos[9]==='NO' || !datos[9]) ? 'selected':''}>No</option>
                </select>
            </div>
            <div>
                <label>Certificado Dominio Vigente</label>
                <input name="certificadoFile" type="file" accept=".pdf,.jpg,.jpeg,.png">
                <div style="font-size:12px; margin-top:4px;">${linkCertificado}</div>
            </div>
        </div>
      </form>
    `;
    
    const guardarFn = async () => {
        const form = document.getElementById('formResidente');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const fd = new FormData(form);
        const file = form.querySelector('[name="certificadoFile"]').files[0];
        let linkSubido = fd.get('linkCertificadoActual'); 

        mostrarSpinner();
        if (file) {
            try {
                linkSubido = await subirCertificadoYObtenerLink(file, fd.get('parcela'));
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
            fd.get('valorGC'), fd.get('contactoPrincipal'), linkSubido
        ];

        try {
            if (isEdit) {
                // Conservar datos que no se editan en el form: Saldos
                data[11] = datos[11] || '0'; // Deuda Convenio Inicial
                data[12] = datos[12] || '0'; // Saldo Convenio
                data[13] = datos[13] || '0'; // Saldo a Favor
                await actualizarResidente(data);
            } else {
                await agregarResidente(data);
            }
            ocultarModalGlobal();
            cargarResidentes();
        } catch (err) {
            mostrarMensaje('Error al guardar: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    };
    
    mostrarModalGlobal(isEdit ? 'Editar Residente' : 'Agregar Residente', cuerpoHtml, guardarFn, 'large');
  }

  document.getElementById('btnAgregarResidente').onclick = () => mostrarModalResidente();

  document.getElementById('tablaResidentes').onclick = async (e) => {
    const fila = e.target.closest('.fila-residente');
    const esBotonEditar = e.target.closest('.btn-editar');
    const esBotonEliminar = e.target.closest('.btn-eliminar');

    if (esBotonEditar) {
      e.stopPropagation(); // Evitar que el click en el botón active el click en la fila
      const id = esBotonEditar.dataset.id;
      const datos = residentes.find(r => r[0] === id);
      mostrarModalResidente(datos);
      return;
    }
    
    if (esBotonEliminar) {
      e.stopPropagation();
      const id = esBotonEliminar.dataset.id;
      if (!confirm('¿Está seguro de que desea eliminar a este residente?')) return;
      mostrarSpinner();
      try {
        await eliminarResidente(id);
        mostrarMensaje('Residente eliminado correctamente');
        cargarResidentes();
      } catch (err) {
        mostrarMensaje('Error al eliminar: ' + (err.result?.error?.message || err.message), 'error');
      }
      ocultarSpinner();
      return;
    }

    if (fila) {
      const id = fila.dataset.id;
      const datosResidente = residentes.find(r => r[0] === id);
      if (datosResidente) {
        mostrarModalDetalleResidente(datosResidente);
      }
    }
  };

  ocultarSpinner();
}
