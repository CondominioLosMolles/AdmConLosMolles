// js/residentes.js

async function cargarResidentes() {
    limpiarMainContent();
    mostrarSpinner();

    let residentes = [];
    try {
        const data = await obtenerResidentes();
        residentes = data.map(r => ({
            id: r[0],
            nombre: r[1],
            rut: r[2],
            parcela: r[3],
            email: r[4],
            telefono: r[5],
            fechaIngreso: r[6],
            estado: r[7],
            valorGC: r[8]
        }));
    } catch (e) {
        ocultarSpinner();
        mostrarMensaje('Error al cargar residentes: ' + e.message, 'error');
        return;
    }

    const main = document.getElementById('main-content');
    main.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h2>Residentes</h2>
            <button id="btnAgregarResidente" class="btn">Agregar Residente</button>
        </div>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>RUT</th>
                        <th>N° Parcela</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        <th>Valor GC</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tbody-residentes">
                </tbody>
            </table>
        </div>

        <div id="modalResidente" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h3 id="modalTitle">Agregar Residente</h3>
                <form id="formResidente">
                    <input type="hidden" id="residenteId">
                    <div style="display:flex; flex-wrap:wrap; gap:15px;">
                        <div style="flex: 2 1 300px;"><label>Nombre</label><input type="text" id="nombre" required></div>
                        
                        <div style="flex: 1 1 120px;"><label>RUT</label><input type="text" id="rut"></div>
                        <div style="flex: 0 1 100px;"><label>N° Parcela</label><input type="number" id="parcela" required></div>
                        <div style="flex: 1 1 250px;"><label>Email</label><input type="email" id="email"></div>
                        <div style="flex: 1 1 120px;"><label>Teléfono</label><input type="text" id="telefono"></div>
                        <div style="flex: 0 1 120px;"><label>Estado</label><select id="estado"><option>Activo</option><option>Inactivo</option><option>Moroso</option></select></div>
                        <div style="flex: 1 1 150px;"><label>Valor GC</label><input type="number" id="valorGC"></div>
                        </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button type="submit" class="btn">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const tbody = document.getElementById('tbody-residentes');
    residentes.forEach(res => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${res.nombre || ''}</td>
            <td>${res.rut || ''}</td>
            <td>${res.parcela || ''}</td>
            <td>${res.email || ''}</td>
            <td>${res.telefono || ''}</td>
            <td><span class="estado-tag estado-${(res.estado || '').toLowerCase()}">${res.estado || ''}</span></td>
            <td>$${Number(res.valorGC || 0).toLocaleString('es-CL')}</td>
            <td>
                <button class="btn small" onclick="editarResidente('${res.id}')">Editar</button>
                <button class="btn small secondary" onclick="eliminarResidenteClick('${res.id}')">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Lógica para manejar el modal
    const modal = document.getElementById('modalResidente');
    const btnAgregar = document.getElementById('btnAgregarResidente');
    const spanCerrar = document.querySelector('.close-button');

    btnAgregar.onclick = () => {
        document.getElementById('modalTitle').textContent = 'Agregar Residente';
        document.getElementById('formResidente').reset();
        document.getElementById('residenteId').value = '';
        modal.style.display = 'block';
    }

    spanCerrar.onclick = () => {
        modal.style.display = 'none';
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Lógica para guardar o actualizar
    document.getElementById('formResidente').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('residenteId').value;
        const datos = [
            id,
            document.getElementById('nombre').value,
            document.getElementById('rut').value,
            document.getElementById('parcela').value,
            document.getElementById('email').value,
            document.getElementById('telefono').value,
            new Date().toISOString().slice(0, 10), // Fecha Ingreso/Actualización
            document.getElementById('estado').value,
            document.getElementById('valorGC').value
        ];

        mostrarSpinner();
        try {
            if (id) {
                // Actualizar
                await actualizarResidente(datos);
                mostrarMensaje('Residente actualizado con éxito', 'success');
            } else {
                // Agregar
                await agregarResidente(datos);
                mostrarMensaje('Residente agregado con éxito', 'success');
            }
            modal.style.display = 'none';
            cargarResidentes(); // Recargar la lista
        } catch (err) {
            mostrarMensaje('Error al guardar residente: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    });

    ocultarSpinner();
}

function editarResidente(id) {
    const residente = residentes.find(r => r.id === id);
    if (!residente) return;

    document.getElementById('modalTitle').textContent = 'Editar Residente';
    document.getElementById('residenteId').value = residente.id;
    document.getElementById('nombre').value = residente.nombre;
    document.getElementById('rut').value = residente.rut;
    document.getElementById('parcela').value = residente.parcela;
    document.getElementById('email').value = residente.email;
    document.getElementById('telefono').value = residente.telefono;
    document.getElementById('estado').value = residente.estado;
    document.getElementById('valorGC').value = residente.valorGC;
    
    document.getElementById('modalResidente').style.display = 'block';
}

async function eliminarResidenteClick(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este residente?')) {
        mostrarSpinner();
        try {
            await eliminarResidente(id);
            mostrarMensaje('Residente eliminado con éxito', 'success');
            cargarResidentes();
        } catch (err) {
            mostrarMensaje('Error al eliminar residente: ' + err.message, 'error');
        } finally {
            ocultarSpinner();
        }
    }
}
