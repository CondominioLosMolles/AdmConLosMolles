// js/gastos_comunes.js

// Estado simulado (datos de prueba internos)
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// CORREGIDO: Se han añadido valores de ejemplo para todos los meses para poder probar el cálculo de interés.
let timc = {
    "2025": { 
        "Enero": 22.5, "Febrero": 23.0, "Marzo": 24.1, "Abril": 25.0, 
        "Mayo": 24.5, "Junio": 26.2, "Julio": 30.0, "Agosto": 28.9, 
        "Septiembre": 27.5, "Octubre": 26.8, "Noviembre": 25.5, "Diciembre": 25.0 
    }
};

let gastosComunes = [
    // Ejemplo de un pago ya realizado para la Parcela 14 en Julio, donde pagó de más.
    { Nombre_Residente: 'Arnaldo Jhonson Soto Solis', N_Parcela: 14, Valor_Gasto_Comun: 30000, Periodo: 'Julio', Fecha_Vencimiento: '2025-07-10', Monto_Pagado: 40000, Deuda_Total: 30000, Interes: 0, Multa_1_4: 0, Meses_Inpagos: 0, Fecha_Pago: '2025-07-08', Metodo_Pago: 'Transferencia', Estado: 'Pagado' }
];

let residentes = [
  { N_Parcela: 14, Nombre_Completo: 'Arnaldo Jhonson Soto Solis', Valor_Gasto_Comun: 30000 },
  { N_Parcela: 15, Nombre_Completo: 'Otro Residente de Prueba', Valor_Gasto_Comun: 50000 },
];


function cargarGastosComunes() {
  limpiarMainContent();
  mostrarSpinner();

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Gastos Comunes</h2>
    <section style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap;">
      <div style="flex:1; min-width: 150px;"><label for="select-parcela">N° Parcela:</label><br><input list="lista-parcelas" id="select-parcela" placeholder="1-26" style="width:80px; padding:5px;"><datalist id="lista-parcelas">${Array.from({length:26},(_,i)=>`<option value="${i+1}">`).join('')}</datalist></div>
      <div style="flex:1; min-width: 150px;"><label for="input-anio">Año:</label><br><input type="number" id="input-anio" value="${new Date().getFullYear()}" style="width:100px; padding:5px;"></div>
      <div style="flex:1; min-width: 200px;"><label>Ingresar TIMC</label><br><select id="select-mes-timc" style="padding:5px; width:120px; margin-right:8px;">${MESES.map(m=>`<option value="${m}">${m}</option>`).join('')}</select><input type="number" id="input-timc" placeholder="Valor TIMC" style="width:80px; padding:5px; margin-right:8px;"><button id="btn-guardar-timc" style="padding:6px 12px;">Agregar TIMC</button></div>
      <div id="mini-timc" style="border:1px solid #ccc; padding:8px; font-size:0.85em; max-width: 250px; background:#fafafa;"><strong>Tasas TIMC por Mes</strong><table style="width:100%; font-size:0.85em; border-collapse: collapse; margin-top:6px;"><tbody id="timc-visual"></tbody></table></div>
    </section>
    <section id="detalle-gastos" style="position:relative;"><h3>Detalle de Gastos Comunes</h3><div style="overflow-x:auto;"><table class="table" style="width:100%; border-collapse: collapse; table-layout: auto;"><thead id="thead-gastos"></thead><tbody id="tbody-gastos"><tr><td colspan="14" style="text-align:center; padding:10px;">Seleccione parcela y año para ver los datos.</td></tr></tbody></table></div><button id="btnAgregarGasto" title="Agregar Gasto Común" style="position: fixed; bottom: 30px; right: 30px; background-color: #007bff; color: white; border: none; border-radius: 50%; width: 60px; height: 60px; font-size: 28px; cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">+</button></section>
    <div id="modalGasto" class="modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); justify-content:center; align-items:center; z-index:1000;"><div style="background:#fff; padding:20px; border-radius:8px; max-width:600px; width:90%; max-height:90vh; overflow-y:auto; box-shadow:0 0 10px rgba(0,0,0,0.3);"><h3>Agregar Gasto Común</h3><form id="formGastoComun" style="display:flex; flex-wrap: wrap; gap:15px; align-items:flex-end;"><div style="flex:1 1 100px;"><label for="inputNParcela">N° Parcela:</label><input type="number" id="inputNParcela" min="1" max="26" required style="width:100%; padding:5px;"></div><div style="flex:1 1 250px;"><label for="inputNombreResidente">Nombre Residente:</label><input type="text" id="inputNombreResidente" readonly style="width:100%; padding:5px; background:#eee;"></div><div style="flex:1 1 150px;"><label for="inputValorGasto">Valor Gasto Común:</label><input type="number" id="inputValorGasto" readonly style="width:100%; padding:5px; background:#eee;"></div><div style="flex:1 1 150px;"><label for="inputFechaPago">Fecha Pago:</label><input type="date" id="inputFechaPago" required style="width:100%; padding:5px;"></div><div style="flex:1 1 150px;"><label for="selectMesPago">Mes:</label><select id="selectMesPago" required style="width:100%; padding:5px;">${MESES.map(m => `<option value="${m}">${m}</option>`).join('')}</select></div><div style="flex:1 1 150px;"><label for="inputMontoPagado">Monto Pagado:</label><input type="number" id="inputMontoPagado" min="0" step="0.01" required style="width:100%; padding:5px;"></div><div style="flex:1 1 150px;"><label for="selectMetodoPago">Método Pago:</label><select id="selectMetodoPago" required style="width:100%; padding:5px;"><option value="Transferencia">Transferencia</option><option value="Efectivo">Efectivo</option></select></div><div style="flex:1 1 100%;"><label for="inputComprobante">Comprobante Pago:</label><input type="file" id="inputComprobante" style="width:100%; padding:5px;"></div><div style="flex:1 1 100%; text-align:right;"><button type="submit" style="padding:8px 20px;">Guardar</button><button type="button" id="btnCerrarModal" style="padding:8px 20px; margin-left:10px;">Cancelar</button></div></form></div></div>
  `;

  actualizarMiniTablaTimc();

  document.getElementById('btn-guardar-timc').addEventListener('click', guardarTimc);
  document.getElementById('select-parcela').addEventListener('input', filtrarDatos);
  document.getElementById('input-anio').addEventListener('input', filtrarDatos);
  document.getElementById('btnAgregarGasto').addEventListener('click', () => document.getElementById('modalGasto').style.display = 'flex');
  document.getElementById('btnCerrarModal').addEventListener('click', () => {
    document.getElementById('modalGasto').style.display = 'none';
    document.getElementById('formGastoComun').reset();
  });
  document.getElementById('inputNParcela').addEventListener('input', rellenarDatosResidente);
  document.getElementById('formGastoComun').addEventListener('submit', guardarGastoComun);

  ocultarSpinner();
}

function actualizarMiniTablaTimc() { /* Sin cambios */ }
function guardarTimc() { /* Sin cambios */ }

// Filtra y muestra los datos. Esta función ahora decide qué tabla mostrar.
function filtrarDatos() {
  const parcela = parseInt(document.getElementById('select-parcela').value);
  const anio = parseInt(document.getElementById('input-anio').value);
  if (!parcela || !anio) {
    mostrarMensajeTabla('Seleccione parcela y año para ver los datos.');
    return;
  }
  // Se llama a la función que genera la vista detallada de 12 meses.
  mostrarGastosDetalladosPorResidente(parcela, anio);
}

function mostrarMensajeTabla(mensaje) { /* Sin cambios */ }

// NUEVA FUNCIÓN MEJORADA: Reemplaza a 'mostrarGastosEnTabla'
function mostrarGastosDetalladosPorResidente(parcela, anio) {
  const residente = residentes.find(r => r.N_Parcela === parcela);
  if (!residente) {
    mostrarMensajeTabla('No se encontró residente para la parcela seleccionada.');
    return;
  }
  
  const thead = document.getElementById('thead-gastos');
  const tbody = document.getElementById('tbody-gastos');
  
  thead.innerHTML = `<tr><th>Nombre Residente</th><th>N° Parcela</th><th>Valor G.C.</th><th>Periodo</th><th>Fecha Vencimiento</th><th>Monto Pagado</th><th>Saldo</th><th>Interés</th><th>Multa 1/4</th><th>Meses Impagos</th><th>Deuda Total</th><th>Fecha Pago</th><th>Método Pago</th><th>Estado</th></tr>`;
  tbody.innerHTML = '';

  const valorGastoComun = residente.Valor_Gasto_Comun;
  const hoy = new Date();

  MESES.forEach((mes, index) => {
    // CORREGIDO: La fecha de vencimiento ahora se calcula correctamente.
    const fechaVencimiento = new Date(anio, index, 10);
    const pagoExistente = gastosComunes.find(g => g.N_Parcela === parcela && g.Periodo === mes && new Date(g.Fecha_Vencimiento).getFullYear() === anio);

    let interes = 0, multa = 0, mesesImpagos = 0, saldo = 0, deudaTotal = valorGastoComun;
    let estado = 'Pendiente', montoPagado = 0, fechaPago = '---', metodoPago = '---';

    if (pagoExistente) {
      estado = 'Pagado';
      montoPagado = pagoExistente.Monto_Pagado;
      // CORREGIDO: El saldo ahora calcula correctamente el diferencial.
      saldo = montoPagado - valorGastoComun;
      deudaTotal = montoPagado;
      fechaPago = pagoExistente.Fecha_Pago;
      metodoPago = pagoExistente.Metodo_Pago;
    } else if (hoy > fechaVencimiento) {
      estado = 'Moroso';

      // CORREGIDO: Cálculo de Meses Impagos ajustado a tu regla.
      const diffAnios = hoy.getFullYear() - fechaVencimiento.getFullYear();
      const diffMeses = hoy.getMonth() - fechaVencimiento.getMonth();
      mesesImpagos = diffAnios * 12 + diffMeses;
      if (hoy.getDate() >= 11) {
          mesesImpagos +=1;
      }
      if (mesesImpagos <= 0) mesesImpagos = 1;

      // CORREGIDO: Se toma el valor del TIMC para el año y mes correcto
      const timcMes = (timc[anio] && timc[anio][mes]) ? timc[anio][mes] : 0;
      interes = valorGastoComun * (timcMes / 100) / 12;

      multa = (valorGastoComun / 4) * mesesImpagos;
      deudaTotal = valorGastoComun + interes + multa;
      saldo = -deudaTotal;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${residente.Nombre_Completo}</td><td>${parcela}</td><td>$${valorGastoComun.toLocaleString()}</td>
      <td>${mes} ${anio}</td><td>${fechaVencimiento.toLocaleDateString('es-CL', {timeZone:'UTC'})}</td>
      <td>$${montoPagado.toLocaleString()}</td><td style="color:${saldo<0?'red':'green'}">$${saldo.toLocaleString()}</td>
      <td>$${interes.toFixed(2)}</td><td>$${multa.toLocaleString()}</td><td>${mesesImpagos}</td>
      <td>$${deudaTotal.toLocaleString()}</td><td>${fechaPago}</td><td>${metodoPago}</td>
      <td><span class="estado-tag estado-${estado.toLowerCase()}">${estado}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function rellenarDatosResidente() { /* Sin cambios */ }
function guardarGastoComun(e) { /* Sin cambios */ }
function limpiarMainContent() { /* Sin cambios */ }
function mostrarSpinner() { /* Sin cambios */ }
function ocultarSpinner() { /* Sin cambios */ }
function mostrarMensaje(msg, tipo = 'info') { alert(`[${tipo.toUpperCase()}] ${msg}`); }

window.cargarGastosComunes = cargarGastosComunes;
