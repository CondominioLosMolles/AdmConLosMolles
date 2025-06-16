// js/gastos_comunes.js

// Estado local para TIMC y gastos comunes
const timc = {
  Enero: '', Febrero: '',
  Marzo: '', Abril: '',
  Mayo: '', Junio: '',
  Julio: '', Agosto: '',
  Septiembre: '', Octubre: '',
  Noviembre: '', Diciembre: ''
};

const gastosComunes = [];

function cargarGastosComunes() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Gastos Comunes</h2>

    <section id="timc-seccion" style="margin-bottom:30px;">
      <h3>Tabla TIMC</h3>
      <table id="tabla-timc" style="border-collapse: collapse; width: 100%;">
        <tbody>
          <tr id="fila-timc"></tr>
        </tbody>
      </table>
      <button id="btn-guardar-timc" style="padding: 10px 20px; margin-top: 10px;">Guardar TIMC</button>
    </section>

    <section id="gastos-comunes-seccion">
      <h3>Agregar Gasto Común</h3>
      <div style="margin-bottom: 15px;">
        <input type="text" id="input-descripcion" placeholder="Descripción" style="padding:5px; width: 300px; margin-right: 10px;">
        <input type="number" id="input-monto" placeholder="Monto" style="padding:5px; width: 120px; margin-right: 10px;">
        <button id="btn-agregar-gasto" style="padding: 6px 15px;">Agregar gasto común</button>
      </div>
      <h3>Gastos Comunes Registrados</h3>
      <table id="tabla-gastos" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Descripción</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Monto</th>
          </tr>
        </thead>
        <tbody id="tbody-gastos">
          <tr><td colspan="2" style="text-align:center; padding: 10px;">No hay gastos comunes agregados.</td></tr>
        </tbody>
      </table>
    </section>
  `;

  construirTablaTIMC();
  actualizarTablaGastos();

  document.getElementById('btn-guardar-timc').addEventListener('click', guardarTimc);
  document.getElementById('btn-agregar-gasto').addEventListener('click', agregarGastoComun);
}

function construirTablaTIMC() {
  const fila = document.getElementById('fila-timc');
  fila.innerHTML = ''; // Limpia fila

  const meses = [
    'Enero', 'Febrero',
    'Marzo', 'Abril',
    'Mayo', 'Junio',
    'Julio', 'Agosto',
    'Septiembre', 'Octubre',
    'Noviembre', 'Diciembre'
  ];

  for (let i = 0; i < meses.length; i += 2) {
    const td = document.createElement('td');
    td.style.border = '1px solid #ccc';
    td.style.padding = '10px';
    td.style.verticalAlign = 'top';

    // Mes superior
    const divSuperior = document.createElement('div');
    divSuperior.style.marginBottom = '10px';
    const labelSuperior = document.createElement('label');
    labelSuperior.textContent = meses[i];
    const inputSuperior = document.createElement('input');
    inputSuperior.type = 'number';
    inputSuperior.value = timc[meses[i]];
    inputSuperior.style.width = '80px';
    inputSuperior.addEventListener('input', e => {
      timc[meses[i]] = e.target.value;
    });
    divSuperior.appendChild(labelSuperior);
    divSuperior.appendChild(document.createElement('br'));
    divSuperior.appendChild(inputSuperior);

    td.appendChild(divSuperior);

    // Mes inferior (si existe)
    if (meses[i + 1]) {
      const divInferior = document.createElement('div');
      const labelInferior = document.createElement('label');
      labelInferior.textContent = meses[i + 1];
      const inputInferior = document.createElement('input');
      inputInferior.type = 'number';
      inputInferior.value = timc[meses[i + 1]];
      inputInferior.style.width = '80px';
      inputInferior.addEventListener('input', e => {
        timc[meses[i + 1]] = e.target.value;
      });
      divInferior.appendChild(labelInferior);
      divInferior.appendChild(document.createElement('br'));
      divInferior.appendChild(inputInferior);

      td.appendChild(divInferior);
    }

    fila.appendChild(td);
  }
}

function guardarTimc() {
  // Aquí puedes agregar la lógica para guardar en backend o Google Sheets
  alert('TIMC guardado:\n' + JSON.stringify(timc, null, 2));
}

function agregarGastoComun() {
  const descInput = document.getElementById('input-descripcion');
  const montoInput = document.getElementById('input-monto');
  const descripcion = descInput.value.trim();
  const monto = montoInput.value.trim();

  if (!descripcion || !monto || isNaN(monto) || Number(monto) <= 0) {
    alert('Por favor, ingresa una descripción válida y un monto mayor a 0.');
    return;
  }

  gastosComunes.push({ descripcion, monto: Number(monto) });
  descInput.value = '';
  montoInput.value = '';
  actualizarTablaGastos();
}

function actualizarTablaGastos() {
  const tbody = document.getElementById('tbody-gastos');
  tbody.innerHTML = '';

  if (gastosComunes.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.style.textAlign = 'center';
    td.style.padding = '10px';
    td.textContent = 'No hay gastos comunes agregados.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  gastosComunes.forEach(gasto => {
    const tr = document.createElement('tr');

    const tdDesc = document.createElement('td');
    tdDesc.style.border = '1px solid #ccc';
    tdDesc.style.padding = '8px';
    tdDesc.textContent = gasto.descripcion;

    const tdMonto = document.createElement('td');
    tdMonto.style.border = '1px solid #ccc';
    tdMonto.style.padding = '8px';
    tdMonto.textContent = `$${gasto.monto.toFixed(2)}`;

    tr.appendChild(tdDesc);
    tr.appendChild(tdMonto);
    tbody.appendChild(tr);
  });
}
