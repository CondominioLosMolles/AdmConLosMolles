// js/dashboard.js
async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();
  // Se cambió 'mantenciones' por 'tareas' para mayor claridad
  let residentes = [], pagos = [], egresos = [], tareas = [], config = {};
  try {
    // Se corrigió la llamada a la función obtenerTareas()
    const [residentesData, pagosData, egresosData, tareasData, configData] = await Promise.all([
        obtenerResidentes(),
        obtenerPagosGC(),
        obtenerEgresos(),
        obtenerTareas(), 
        obtenerConfiguracion()
    ]);
    residentes = residentesData || [];
    pagos = pagosData || [];
    egresos = egresosData || [];
    tareas = tareasData || []; // Se usa la variable actualizada
    config = configData || {};
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos del dashboard: ' + e.message, 'error');
    return;
  }

  const activos = residentes.filter(r => r && r[7] === 'Activo').length;
  const mesActual = new Date().toISOString().slice(0,7);
  const ingresosMes = pagos.filter(p => p && p[13] && p[13].startsWith(mesActual)).reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0);
  const egresosMes = egresos.filter(e => e && e[1] && e[1].startsWith(mesActual)).reduce((a,b) => a + Number(b[6]||0), 0);
  
  const saldoInicial = parseFloat(config.Saldo_Inicial_Caja || 0);
  const totalIngresos = pagos.reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0);
  const totalEgresos = egresos.reduce((a,b) => a + Number(b[6]||0), 0);
  const saldoCaja = saldoInicial + totalIngresos - totalEgresos;

  // CORREGIDO: Se ajustó el filtro para usar la columna correcta (índice 6) y los estados actuales.
  const tareasAbiertas = tareas.filter(t => t && t[6] && t[6] !== 'Finalizado' && t[6] !== 'Cancelado').length;

  const morososData = {};
  
  residentes.forEach(r => {
    if(!r[3]) return;
    const parcela = r[3];
    if (!morososData[parcela]) {
      morososData[parcela] = { deudaTotal: 0 };
    }
  });

  pagos.forEach(p => {
    if (p[2] && morososData[p[2]]) {
      const deuda = parseFloat(p[12] || 0);
      if (deuda > 0) {
        morososData[p[2]].deudaTotal += deuda;
      }
    }
  });
  
  const morosos = Object.entries(morososData).filter(([_, data]) => data.deudaTotal > 0);
  const parcelasMorosas = morosos.map(([parcela, _]) => parcela);
  const deudaTotalMorosos = morosos.reduce((sum, [_, data]) => sum + data.deudaTotal, 0);


  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Dashboard</h2>
    <div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:32px;">
      <div class="widget" style="flex:1;min-width:160px;"><div style="font-size:2em;font-weight:700;">${activos}</div><div>Residentes Activos</div></div>
      <div class="widget" style="flex:1;min-width:160px;"><div style="font-size:2em;font-weight:700;">$${ingresosMes.toLocaleString('es-CL')}</div><div>Ingresos del Mes</div></div>
      <div class="widget" style="flex:1;min-width:160px;"><div style="font-size:2em;font-weight:700;">$${egresosMes.toLocaleString('es-CL')}</div><div>Egresos del Mes</div></div>
      <div class="widget" style="flex:1;min-width:160px;"><div style="font-size:2em;font-weight:700;">$${saldoCaja.toLocaleString('es-CL')}</div><div>Saldo de Caja</div></div>
      <div class="widget" style="flex:1;min-width:160px;"><div style="font-size:2em;font-weight:700;">${tareasAbiertas}</div><div>Tareas Abiertas</div></div>
    </div>
    <div style="display:flex;gap:24px;flex-wrap:wrap;">
      <div class="widget" style="flex:2;min-width:380px;">
        <canvas id="graficoIngresosEgresos" style="max-width:100%;height:320px;"></canvas>
      </div>
      <div class="widget" style="flex:1;min-width:300px;max-width:340px;">
        <h4>Resumen de Morosidad</h4>
        <div><b>Parcelas con Deuda:</b> ${morosos.length}</div>
        <div><b>Parcelas:</b> ${parcelasMorosas.join(', ') || '-'}</div>
        <div><b>Deuda Total de Morosos:</b> $${deudaTotalMorosos.toLocaleString('es-CL')}</div>
      </div>
    </div>`;

  const labels = [];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const ingresosPorMes = [];
  const egresosPorMes = [];
  const hoy = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const mesNombre = meses[d.getMonth()];
    const anio = d.getFullYear();
    labels.push(`${mesNombre} ${anio}`);
    const periodo = d.toISOString().slice(0,7);
    ingresosPorMes.push(pagos.filter(p => p && p[13] && p[13].startsWith(periodo)).reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0));
    egresosPorMes.push(egresos.filter(e => e && e[1] && e[1].startsWith(periodo)).reduce((a,b) => a + Number(b[6]||0), 0));
  }

  // Lógica para renderizar el gráfico
  setTimeout(() => {
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
          x: { ticks: { autoSkip: false } },
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

// Se elimina este listener porque el index.html ya lo maneja de forma centralizada
// document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
