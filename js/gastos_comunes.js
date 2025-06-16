const { useState } = React;

const meses = [
  'Enero', 'Febrero',
  'Marzo', 'Abril',
  'Mayo', 'Junio',
  'Julio', 'Agosto',
  'Septiembre', 'Octubre',
  'Noviembre', 'Diciembre'
];

function GastosComunes() {
  const [timc, setTimc] = useState({
    Enero: '', Febrero: '',
    Marzo: '', Abril: '',
    Mayo: '', Junio: '',
    Julio: '', Agosto: '',
    Septiembre: '', Octubre: '',
    Noviembre: '', Diciembre: ''
  });

  const [gastosComunes, setGastosComunes] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({ descripcion: '', monto: '' });

  const handleTimcChange = (mes, valor) => {
    setTimc(prev => ({ ...prev, [mes]: valor }));
  };

  const guardarTimc = () => {
    alert('TIMC guardado correctamente:\n' + JSON.stringify(timc, null, 2));
  };

  const handleNuevoGastoChange = (e) => {
    const { name, value } = e.target;
    setNuevoGasto(prev => ({ ...prev, [name]: value }));
  };

  const agregarGastoComun = () => {
    if (!nuevoGasto.descripcion.trim() || !nuevoGasto.monto.trim()) {
      alert('Por favor, completa la descripción y el monto');
      return;
    }
    setGastosComunes(prev => [...prev, { ...nuevoGasto, id: Date.now() }]);
    setNuevoGasto({ descripcion: '', monto: '' });
  };

  // Construcción de columnas TIMC con dos filas (mes arriba y mes siguiente abajo)
  const columnasTimc = [];
  for (let i = 0; i < meses.length; i += 2) {
    columnasTimc.push(
      React.createElement('td', { key: i, style: { verticalAlign: 'top', padding: '10px', border: '1px solid #ccc' } },
        React.createElement('div', { style: { marginBottom: '10px' } },
          React.createElement('label', null, meses[i]),
          React.createElement('br'),
          React.createElement('input', {
            type: 'number',
            value: timc[meses[i]],
            onChange: e => handleTimcChange(meses[i], e.target.value),
            style: { width: '80px' }
          })
        ),
        meses[i + 1] && React.createElement('div', null,
          React.createElement('label', null, meses[i + 1]),
          React.createElement('br'),
          React.createElement('input', {
            type: 'number',
            value: timc[meses[i + 1]],
            onChange: e => handleTimcChange(meses[i + 1], e.target.value),
            style: { width: '80px' }
          })
        )
      )
    );
  }

  return React.createElement('div', { style: { maxWidth: '900px', margin: 'auto' } },
    React.createElement('h2', null, 'Módulo de Gastos Comunes'),

    React.createElement('h3', null, 'Tabla TIMC'),
    React.createElement('table', { style: { borderCollapse: 'collapse', width: '100%', marginBottom: '20px' } },
      React.createElement('tbody', null,
        React.createElement('tr', null, columnasTimc)
      )
    ),

    React.createElement('button', { onClick: guardarTimc, style: { padding: '10px 20px', marginBottom: '30px' } }, 'Guardar TIMC'),

    React.createElement('h3', null, 'Agregar Gasto Común'),
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('input', {
        type: 'text',
        name: 'descripcion',
        placeholder: 'Descripción',
        value: nuevoGasto.descripcion,
        onChange: handleNuevoGastoChange,
        style: { marginRight: '10px', padding: '5px', width: '300px' }
      }),
      React.createElement('input', {
        type: 'number',
        name: 'monto',
        placeholder: 'Monto',
        value: nuevoGasto.monto,
        onChange: handleNuevoGastoChange,
        style: { marginRight: '10px', padding: '5px', width: '120px' }
      }),
      React.createElement('button', { onClick: agregarGastoComun, style: { padding: '6px 15px' } }, 'Agregar gasto común')
    ),

    React.createElement('h3', null, 'Gastos Comunes Registrados'),
    gastosComunes.length === 0
      ? React.createElement('p', null, 'No hay gastos comunes agregados.')
      : React.createElement('table', { style: { borderCollapse: 'collapse', width: '100%' } },
        React.createElement('thead', null,
          React.createElement('tr', null,
            React.createElement('th', { style: { border: '1px solid #ccc', padding: '8px' } }, 'Descripción'),
            React.createElement('th', { style: { border: '1px solid #ccc', padding: '8px' } }, 'Monto')
          )
        ),
        React.createElement('tbody', null,
          gastosComunes.map(gasto =>
            React.createElement('tr', { key: gasto.id },
              React.createElement('td', { style: { border: '1px solid #ccc', padding: '8px' } }, gasto.descripcion),
              React.createElement('td', { style: { border: '1px solid #ccc', padding: '8px' } }, `$${parseFloat(gasto.monto).toFixed(2)}`)
            )
          )
        )
      )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(GastosComunes));
