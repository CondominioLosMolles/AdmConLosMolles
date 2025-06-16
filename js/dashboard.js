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

  // Layout
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Dashboard</h2>
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;">
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
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div class="widget" style="flex:2;min-width:380px;">
        <canvas id="graficoIngresosEgresos" style="max-width:100%;height:320px;"></canvas>
      </div>
      <div class="widget" style="flex:1;min-width:300px;max-width:340px;">
        <h4>Resumen de Morosidad</h4>
        <div><b>Morosos:</b> ${morosos.length}</div>
        <div><b>Parcelas:</b> ${parcelasMorosas.join(', ') || '-'}</div>
        <div><b>Deuda Total:</b> $${deudaMorosos.toLocaleString('es-CL')}</div>
      </div>
    </div>
  `;

  // Gráfico: eje X con mes/año, eje Y CLP
  const labels = [];
  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];
  const ingresosPorMes = [];
  const egresosPorMes = [];
  const hoy = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mesNombre = meses[d.getMonth()];
    const anio = d.getFullYear();
    labels.push(mesNombre + '\n' + anio);
    const periodo = d.toISOString().slice(0,7);
    ingresosPorMes.push(pagos.filter(p => p[4] === periodo).reduce((a,b) => a + Number(b[6]||0), 0));
    egresosPorMes.push(egresos.filter(e => (e[1]||'').startsWith(periodo)).reduce((a,b) => a + Number(b[6]||0), 0));
  }
  setTimeout(() => {
    // Step automático en 100.000, ajustando al máximo valor
    const maxY = Math.max(...ingresosPorMes, ...egresosPorMes, 100000);
    let stepSize = 100000;
    if (maxY <= 500000) stepSize = 50000;
    if (maxY <= 100000) stepSize = 10000;
    let suggestedMax = Math.ceil(maxY / stepSize) * stepSize;
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
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: {
            ticks: {
              callback: function(value, index, ticks) {
                // Muestra "Junio" arriba y "2024" abajo
                const [mes, anio] = this.getLabelForValue(value).split('\n');
                return mes + '\n' + anio;
              }
            }
          },
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
