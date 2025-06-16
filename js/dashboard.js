// js/dashboard.js
// Módulo Dashboard: widgets, gráfico de ingresos/egresos, morosidad y mantenciones

async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();

  // Cargar datos
  let residentes = [], pagos = [], egresos = [], mantenciones = [];
  try {
    residentes = await obtenerResidentes();
    pagos = await obtenerPagosGC();
    egresos = await obtenerEgresos();
    mantenciones = await obtenerMantenciones();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  // 1. Widgets
  const activos = residentes.filter(r => r[7] === 'Activo').length;
  const mesActual = new Date().toISOString().slice(0,7);
  const ingresosMes = pagos.filter(p => p[4] === mesActual).reduce((a,b) => a + Number(b[6]||0), 0);
  const egresosMes = egresos.filter(e => (e[1]||'').startsWith(mesActual)).reduce((a,b) => a + Number(b[6]||0), 0);
  const saldoCaja = pagos.reduce((a,b) => a + Number(b[6]||0), 0) - egresos.reduce((a,b) => a + Number(b[6]||0), 0);
  const mantPendientes = mantenciones.filter(m => m[5] === 'Pendiente' || m[5] === 'Urgente').length;

  // Morosos
  const morosos = residentes.filter(r => r[7] === 'Moroso');
  const parcelasMorosas = morosos.map(r => r[3]);
  const deudaMorosos = pagos
    .filter(p => parcelasMorosas.includes(p[2]) && p[15] === 'Moroso')
    .reduce((a,b) => a + Number(b[12]||0), 0);

  // 2. Render widgets
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Dashboard</h2>
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;">
      <div class="widget" style="flex:1;">
        <div style="font-size:2em;font-weight:700;">${activos}</div>
        <div>Residentes Activos</div>
      </div>
      <div class="widget" style="flex:1;">
        <div style="font-size:2em;font-weight:700;">$${ingresosMes.toLocaleString()}</div>
        <div>Ingresos del Mes</div>
      </div>
      <div class="widget" style="flex:1;">
        <div style="font-size:2em;font-weight:700;">$${egresosMes.toLocaleString()}</div>
        <div>Egresos del Mes</div>
      </div>
      <div class="widget" style="flex:1;">
        <div style="font-size:2em;font-weight:700;">$${saldoCaja.toLocaleString()}</div>
        <div>Saldo de Caja (Estimado)</div>
      </div>
      <div class="widget" style="flex:1;">
        <div style="font-size:2em;font-weight:700;">${mantPendientes}</div>
        <div>Mantenciones Pendientes/Urgentes</div>
      </div>
    </div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div class="widget" style="flex:2;">
        <canvas id="graficoIngresosEgresos"></canvas>
      </div>
      <div class="widget" style="flex:1;min-width:300px;">
        <h4>Resumen de Morosidad</h4>
        <div><b>Morosos:</b> ${morosos.length}</div>
        <div><b>Parcelas:</b> ${parcelasMorosas.join(', ') || '-'}</div>
        <div><b>Deuda Total:</b> $${deudaMorosos.toLocaleString()}</div>
      </div>
    </div>
  `;

  // 3. Gráfico de Ingresos vs Egresos (últimos 12 meses)
  const labels = [];
  const ingresosPorMes = [];
  const egresosPorMes = [];
  const hoy = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const label = d.toISOString().slice(0,7);
    labels.push(label);
    ingresosPorMes.push(pagos.filter(p => p[4] === label).reduce((a,b) => a + Number(b[6]||0), 0));
    egresosPorMes.push(egresos.filter(e => (e[1]||'').startsWith(label)).reduce((a,b) => a + Number(b[6]||0), 0));
  }
  setTimeout(() => {
    new Chart(document.getElementById('graficoIngresosEgresos'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Ingresos', data: ingresosPorMes, backgroundColor:'#4e91f9' },
          { label: 'Egresos', data: egresosPorMes, backgroundColor:'#7fd6c2' }
        ]
      },
      options: { responsive:true, plugins:{legend:{position:'top'}} }
    });
  }, 100);

  ocultarSpinner();
}

// Evento de menú
document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
