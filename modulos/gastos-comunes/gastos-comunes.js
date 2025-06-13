console.log('Módulo Gastos Comunes cargado');

const selectParcela = document.getElementById('select-parcela');
const inputYear = document.getElementById('input-year');
const timcValor = document.getElementById('timc-valor');
const timcMes = document.getElementById('timc-mes');
const btnGuardarTimc = document.getElementById('btn-guardar-timc');
const timcValoresCont = document.getElementById('timc-valores');
const anioTimcSpan = document.getElementById('anio-timc');
const tbodyGastos = document.getElementById('tbody-gastos');

let gastosData = []; // Cargar desde Google Sheets
let timcData = {};   // Objeto clave "mes-año" => valor TIMC
let residentesData = []; // Cargar desde Google Sheets

// Generar opciones de parcela 1 a 26
if(selectParcela){
  for(let i=1; i<=26; i++){
    const option = document.createElement('option');
    option.value = i.toString();
    option.textContent = `Parcela ${i}`;
    selectParcela.appendChild(option);
  }
}

// Renderizar listado TIMC
function renderTimcListado() {
  if(!timcValoresCont || !anioTimcSpan) return;
  const anio = inputYear.value;
  anioTimcSpan.textContent = anio;
  timcValoresCont.innerHTML = '';
  for(let m=1; m<=12; m++){
    const key = `${m}-${anio}`;
    const val = timcData[key] || 0;
    const div = document.createElement('div');
    div.textContent = `Mes ${m}: ${val}%`;
    timcValoresCont.appendChild(div);
  }
}

// Filtrar y mostrar gastos según parcela y año
function filtrarGastos() {
  if(!tbodyGastos) return;
  const parcela = selectParcela.value;
  const year = inputYear.value;
  tbodyGastos.innerHTML = '';

  gastosData.forEach(gasto => {
    if((parcela === '' || gasto.parcela === parcela) && gasto.periodo.startsWith(year)){
      // Cálculos simplificados para demo
      const saldo = gasto.valorGC - gasto.montoPagado;
      const estado = saldo <= 0 ? 'Pagado' : 'Pendiente';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${gasto.nombre}</td>
        <td>${gasto.parcela}</td>
        <td>$${gasto.valorGC.toLocaleString('es-CL')}</td>
        <td>${gasto.periodo}</td>
        <td>${gasto.fechaVencimiento}</td>
        <td>$${gasto.montoPagado.toLocaleString('es-CL')}</td>
        <td>$${saldo.toLocaleString('es-CL')}</td>
        <td>${gasto.interes || 0}</td>
        <td>${gasto.multa || 0}</td>
        <td>${gasto.mesesImpagos || 0}</td>
        <td>${gasto.deudaTotal || 0}</td>
        <td>${gasto.fechaPago || ''}</td>
        <td>${gasto.metodoPago || ''}</td>
        <td>${estado}</td>
        <td>
          <button title="Editar">&#9998;</button>
          <button title="Eliminar">&#128465;</button>
        </td>
      `;
      tbodyGastos.appendChild(tr);
    }
  });
}

// Eventos para filtros y botones
if(selectParcela) selectParcela.addEventListener('change', filtrarGastos);
if(inputYear) inputYear.addEventListener('change', () => {
  renderTimcListado();
  filtrarGastos();
});
if(btnGuardarTimc){
  btnGuardarTimc.addEventListener('click', () => {
    alert('Funcionalidad para guardar TIMC pendiente de implementar');
  });
}

// Simulación de datos para demo
gastosData = [
  {
    nombre: 'Juan Pérez',
    parcela: '1',
    valorGC: 50000,
    periodo: '2025-06',
    fechaVencimiento: '2025-06-10',
    montoPagado: 30000,
    interes: 0,
    multa: 0,
    mesesImpagos: 0,
    deudaTotal: 50000,
    fechaPago: '2025-06-05',
    metodoPago: 'Transferencia'
  },
  {
    nombre: 'María López',
    parcela: '2',
    valorGC: 55000,
    periodo: '2025-06',
    fechaVencimiento: '2025-06-10',
    montoPagado: 55000,
    interes: 0,
    multa: 0,
    mesesImpagos: 0,
    deudaTotal: 55000,
    fechaPago: '2025-06-03',
    metodoPago: 'Efectivo'
  }
];

renderTimcListado();
filtrarGastos();

