function mostrarModalResidente(datos = null) {
  const modal = document.getElementById('modalResidente');
  modal.style.display = 'flex';
  const isEdit = !!datos;
  modal.innerHTML = `
    <div>
      <h3 style="margin-bottom:18px;">${isEdit ? 'Editar' : 'Agregar'} Residente</h3>
      <form id="formResidente">
        <input type="hidden" name="id" value="${datos ? datos[0] : ''}">
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
    const data = [
      fd.get('id') || '', // ID
      fd.get('nombre'),
      fd.get('rut'),
      fd.get('parcela'),
      fd.get('direccion'),
      fd.get('email'),
      fd.get('tel'),
      fd.get('estado'),
      fd.get('valorGC')
    ];
    mostrarSpinner();
    try {
      if (isEdit) {
        await actualizarResidente(data);
      } else {
        await agregarResidente(data);
      }
      modal.style.display = 'none';
      cargarResidentes();
    } catch (e) {
      mostrarMensaje('Error al guardar: ' + e.message, 'error');
    }
    ocultarSpinner();
  };
}
