// js/dashboard.js
async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();

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

  // Widgets
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

  // Layout: widgets arriba, gráfico compacto, resumen de morosidad debajo
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Dashboard</h2>
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:24px;">
      <div class="widget" style="flex:1;min-width:160px;">
        <div style="font-size:2em;font-weight:700;">${activos}</div>
        <div>Residentes Activos</div>
      </div>
      <div class="widget" style="flex:1;min-width:160px;">
        <div style="font-size:2em;font-weight:700;">$${ingresosMes.toLocaleString('es-CL')}</div>
        <div>Ingresos del Mes</div>
      </div>
      <div class="widget" style="flex:1;min-width:160px;">
        <div style="font-size:2em;font-weight:700;">$${egresosMes.toLocaleString('es-CL')}</div>
        <div>Egresos del Mes</div>
      </div>
      <div class="widget" style="flex:1;min-width:160px;">
        <div style="font-size:2em;font-weight:700;">$${saldoCaja.toLocaleString('es-CL')}</div>
        <div>Saldo de Caja</div>
      </div>
      <div class="widget" style="flex:1;min-width:160px;">
        <div style="font-size:2em;font-weight:700;">${mantPendientes}</div>
        <div>Mantenciones Pendientes/Urgentes</div>
      </div>
    </div>
    <div class="widget" style="margin-bottom:16px;max-width:900px;width:100%;margin:auto;padding:24px 16px;">
      <canvas id="graficoIngresosEgresos" style="max-height:320px;height:320px;"></canvas>
    </div>
    <div class="widget" style="max-width:440px;margin:auto;">
      <h4>Resumen de Morosidad</h4>
      <div><b>Morosos:</b> ${morosos.length}</div>
      <div><b>Parcelas:</b> ${parcelasMorosas.join(', ') || '-'}</div>
      <div><b>Deuda Total:</b> $${deudaMorosos.toLocaleString('es-CL')}</div>
    </div>
  `;

  // Gráfico: eje Y en CLP, ticks de $100.000 hasta el valor máximo, ajustando automáticamente
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
    const maxY = Math.max(...ingresosPorMes, ...egresosPorMes, 100000);
    // Calcular el stepSize (siempre 100.000, pero si el máximo es > 1 millón, sigue creciendo de a 100.000)
    let stepSize = 100000;
    let maxTicks = Math.ceil(maxY / stepSize);
    // Si el máximo no es múltiplo exacto de 100.000, ajusta el max a el siguiente múltiplo
    let suggestedMax = maxTicks * stepSize;
    new Chart(document.getElementById('graficoIngresosEgresos'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Ingresos', data: ingresosPorMes, backgroundColor:'#4e91f9' },
          { label: 'Egresos', data: egresosPorMes, backgroundColor:'#7fd6c2' }
        ]
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        plugins:{legend:{position:'top'}},
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: suggestedMax,
            ticks: {
              callback: value => '$' + value.toLocaleString('es-CL'),
              stepSize: stepSize
            }
          }
        }
      }
    });
  }, 100);

  ocultarSpinner();
}

document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
