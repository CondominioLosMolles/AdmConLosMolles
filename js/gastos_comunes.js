import React, { useState } from 'react';

const meses = [
  'Enero', 'Febrero',
  'Marzo', 'Abril',
  'Mayo', 'Junio',
  'Julio', 'Agosto',
  'Septiembre', 'Octubre',
  'Noviembre', 'Diciembre'
];

export default function GastosComunes() {
  // Estado para TIMC, guardado por mes
  const [timc, setTimc] = useState({
    Enero: '', Febrero: '',
    Marzo: '', Abril: '',
    Mayo: '', Junio: '',
    Julio: '', Agosto: '',
    Septiembre: '', Octubre: '',
    Noviembre: '', Diciembre: ''
  });

  // Estado para gastos comunes listados
  const [gastosComunes, setGastosComunes] = useState([]);

  // Estado para nuevo gasto común
  const [nuevoGasto, setNuevoGasto] = useState({ descripcion: '', monto: '' });

  // Maneja cambios en TIMC inputs
  const handleTimcChange = (mes, valor) => {
    setTimc(prev => ({ ...prev, [mes]: valor }));
  };

  // Guarda TIMC (simulado)
  const guardarTimc = () => {
    // Aquí iría la lógica para guardar en backend o estado global
    alert('TIMC guardado correctamente');
  };

  // Maneja cambios en nuevo gasto común
  const handleNuevoGastoChange = (e) => {
    const { name, value } = e.target;
    setNuevoGasto(prev => ({ ...prev, [name]: value }));
  };

  // Agrega un nuevo gasto común a la lista
  const agregarGastoComun = () => {
    if (!nuevoGasto.descripcion || !nuevoGasto.monto) {
      alert('Por favor, completa la descripción y el monto');
      return;
    }
    setGastosComunes(prev => [...prev, { ...nuevoGasto, id: Date.now() }]);
    setNuevoGasto({ descripcion: '', monto: '' });
  };

  // Construye columnas para TIMC en dos filas
  // Columna 1: Enero arriba, Febrero abajo
  // Columna 2: Marzo arriba, Abril abajo, etc.
  const columnasTimc = [];
  for (let i = 0; i < meses.length; i += 2) {
    columnasTimc.push(
      <td key={i} style={{ verticalAlign: 'top', padding: '10px', border: '1px solid #ccc' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>{meses[i]}</label><br />
          <input
            type="number"
            value={timc[meses[i]]}
            onChange={e => handleTimcChange(meses[i], e.target.value)}
            style={{ width: '80px' }}
          />
        </div>
        {meses[i + 1] && (
          <div>
            <label>{meses[i + 1]}</label><br />
            <input
              type="number"
              value={timc[meses[i + 1]]}
              onChange={e => handleTimcChange(meses[i + 1], e.target.value)}
              style={{ width: '80px' }}
            />
          </div>
        )}
      </td>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Módulo de Gastos Comunes</h2>

      {/* Tabla TIMC horizontal con dos líneas */}
      <h3>Tabla TIMC</h3>
      <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '20px' }}>
        <tbody>
          <tr>
            {columnasTimc}
          </tr>
        </tbody>
      </table>

      <button onClick={guardarTimc} style={{ padding: '10px 20px', marginBottom: '30px' }}>
        Guardar TIMC
      </button>

      {/* Agregar gasto común */}
      <h3>Agregar Gasto Común</h3>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          name="descripcion"
          placeholder="Descripción"
          value={nuevoGasto.descripcion}
          onChange={handleNuevoGastoChange}
          style={{ marginRight: '10px', padding: '5px', width: '300px' }}
        />
        <input
          type="number"
          name="monto"
          placeholder="Monto"
          value={nuevoGasto.monto}
          onChange={handleNuevoGastoChange}
          style={{ marginRight: '10px', padding: '5px', width: '120px' }}
        />
        <button onClick={agregarGastoComun} style={{ padding: '6px 15px' }}>
          Agregar gasto común
        </button>
      </div>

      {/* Lista de gastos comunes */}
      <h3>Gastos Comunes Registrados</h3>
      {gastosComunes.length === 0 ? (
        <p>No hay gastos comunes agregados.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Descripción</th>
              <th style={{ border: '1px solid #ccc', padding: '8px' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {gastosComunes.map(gasto => (
              <tr key={gasto.id}>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>{gasto.descripcion}</td>
                <td style={{ border: '1px solid #ccc', padding: '8px' }}>${parseFloat(gasto.monto).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
