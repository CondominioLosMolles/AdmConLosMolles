console.log('Módulo Residentes cargado');

const inputBusqueda = document.getElementById('busqueda-residente');
const tbodyResidentes = document.getElementById('tbody-residentes');
const btnAgregar = document.getElementById('btn-agregar-residente');

let residentesData = []; // Aquí cargarás los datos reales desde Google Sheets

function renderResidentes(filtro = '') {
  if (!tbodyResidentes) return;
  tbodyResidentes.innerHTML = '';
  const filtroLower = filtro.toLowerCase();
  residentesData
    .filter(r =>
      r.nombre.toLowerCase().includes(filtroLower) ||
      r.rut.toLowerCase().includes(filtroLower) ||
      String(r.parcela).includes(filtroLower)
    )
    .forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.nombre}</td>
        <td>${r.rut}</td>
        <td>${r.parcela}</td>
        <td>${r.direccion}</td>
        <td>${r.email}</td>
        <td>${r.telefono}</td>
        <td>${r.estado}</td>
        <td>${r.gastoComun}</td>
        <td>
          <button title="Editar">&#9998;</button>
          <button title="Eliminar">&#128465;</button>
        </td>
      `;
      tbodyResidentes.appendChild(tr);
    });
}

if(inputBusqueda){
  inputBusqueda.addEventListener('input', e => {
    renderResidentes(e.target.value);
  });
}

// Simulación de carga de datos inicial
residentesData = [
  { nombre: 'Juan Pérez', rut: '12345678-9', parcela: '1', direccion: 'Calle Falsa 123', email: 'juan@mail.com', telefono: '912345678', estado: 'Activo', gastoComun: '$50.000' },
  { nombre: 'María López', rut: '98765432-1', parcela: '2', direccion: 'Av. Siempre Viva 742', email: 'maria@mail.com', telefono: '987654321', estado: 'Activo', gastoComun: '$55.000' },
];

renderResidentes();
