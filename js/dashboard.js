// js/dashboard.js
async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();
  
  // Agrega una variable "multas" y una función "obtenerMultas()"
  let residentes = [], pagos = [], egresos = [], tareas = [], config = {}, ingresosExtra = [], multas = []; // <-- MODIFICADO
  try {
    const [residentesData, pagosData, egresosData, tareasData, configData, ingresosExtraData, multasData] = await Promise.all([ // <-- MODIFICADO
        obtenerResidentes(),
        obtenerPagosGC(),
        obtenerEgresos(),
        obtenerTareas(), 
        obtenerConfiguracion(),
        obtenerIngresosExtra(),
        obtenerMultas() // <-- NUEVO: Llama a la función para obtener las multas
    ]);
    residentes = residentesData || [];
    pagos = pagosData || [];
    egresos = egresosData || [];
    tareas = tareasData || [];
    config = configData || {};
    ingresosExtra = ingresosExtraData || [];
    multas = multasData || []; // <-- MODIFICADO
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos del dashboard: ' + e.message, 'error');
    return;
  }

  // --- CÁLCULOS PRINCIPALES ---
  
  // Calcula el total de cada fuente de ingreso por separado
  const saldoInicial = Number(config[1] || 0); // <-- NUEVO: Asumiendo que el valor está en la columna B (índice 1) de tu hoja de Configuración.
  const totalIngresosGC = pagos.reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0);
  const totalIngresosExtra = ingresosExtra.reduce((a,b) => a + Number(b[3]||0), 0);
  const totalMultas = multas.reduce((a,b) => a + Number(b[4]||0), 0); // <-- NUEVO: Suma la columna E (índice 4) de la hoja Multas.

  // Suma todos los ingresos en una sola variable
  const totalIngresos = saldoInicial + totalIngresosGC + totalIngresosExtra + totalMultas; // <-- MODIFICADO

  const totalEgresos = egresos.reduce((a,b) => a + Number(b[6]||0), 0);
  const saldoCaja = totalIngresos - totalEgresos;

  // --- CÁLCULOS SECUNDARIOS (Sin cambios en esta sección) ---
  const morososData = {};
  residentes.forEach(r => {
    if(!r || !r[3]) return;
    morososData[r[3]] = { deudaTotal: 0 };
  });
  pagos.forEach(p => {
    if (p && p[2] && morososData[p[2]]) {
      const deuda = parseFloat(p[12] || 0);
      if (deuda > 0) {
        morososData[p[2]].deudaTotal += deuda;
      }
    }
  });
  const morosos = Object.entries(morososData).filter(([_, data]) => data.deudaTotal > 0);
  const parcelasMorosas = morosos.map(([parcela, _]) => parcela);
  const deudaTotalMorosos = morosos.reduce((sum, [_, data]) => sum + data.deudaTotal, 0);

  const gastosPorCategoria = egresos.reduce((acc, egreso) => {
    if (!egreso || !egreso[2]) return acc;
    const categoria = egreso[2];
    const monto = parseFloat(egreso[6] || 0);
    acc[categoria] = (acc[categoria] || 0) + monto;
    return acc;
  }, {});

  // --- RENDERIZADO DEL HTML (Sin cambios, 100% original) ---
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <style>
      .dashboard-grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px; }
      .dashboard-grid-main { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .widget { 
        padding: 24px; 
        text-align: center; 
        display: flex; 
        flex-direction: column; 
        justify-content: center;
        background-color: #fff;
        border: 1px solid #e3e6f0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }
      .widget-value { font-size: 2.5em; font-weight: 700; color: #2a7ca3; line-height: 1.1; }
      .widget-label { margin-top: 8px; font-size: 1em; color: #6c757d; }
      .widget h4 { margin-top: 0; margin-bottom: 24px; text-align: left; width: 100%; }
      .widget-full { grid-column: 1 / -1; }
      .widget-highlight {
        background-color: #e7f3fe;
        border-color: #2a7ca3;
      }
      .widget-highlight .widget-value {
        color: #004a7f;
        font-size: 2.8em;
      }
      .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: left; }
      .summary-item:last-child { border-bottom: none; }
      .summary-item span { color: #555; }
      .summary-item b { color: #333; }
      .summary-item-list { padding: 10px 0; text-align: left; }
      .summary-item-list span { display: block; margin-bottom: 5px; color: #555;}
      .summary-item-list div { font-weight: bold; color: #333; word-break: break-word; }
      @media (max-width: 992px) { 
        .dashboard-grid-main { grid-template-columns: 1fr; }
        .widget-full { grid-column: 1 / 1; }
      }
    </style>

    <h2>Dashboard</h2>
    <div class="dashboard-grid-cards">
      <div class="widget widget-highlight">
          <div class="widget-value">$${saldoCaja.toLocaleString('es-CL')}</div>
          <div class="widget-label">Saldo de Caja</div>
      </div>
      <div class="widget">
          <div class="widget-value">$${totalIngresos.toLocaleString('es-CL')}</div>
          <div class="widget-label">Ingresos Acumulados</div>
      </div>
      <div class="widget">
          <div class="widget-value">$${totalEgresos.toLocaleString('es-CL')}</div>
          <div class="widget-label">Egresos Acumulados</div>
      </div>
    </div>

    <div class="dashboard-grid-main">
      <div class="widget widget-full">
        <h4>Ingresos vs. Egresos (Últimos 12 Meses)</h4>
        <div class="chart-container" style="position: relative; height: 350px; width: 100%;">
            <canvas id="graficoIngresosEgresos"></canvas>
        </div>
      </div>
      <div class="widget">
        <h4>Resumen de Morosidad</h4>
        <div style="width:100%;">
            <div class="summary-item"><span>Parcelas con Deuda:</span> <b>${morosos.length}</b></div>
            <div class="summary-item"><span>Deuda Total:</span> <b style="color: #dc3545;">$${deudaTotalMorosos.toLocaleString('es-CL')}</b></div>
            <div class="summary-item-list"><span>Parcelas Morosas:</span> <div>${parcelasMorosas.join(', ') || '-'}</div></div>
        </div>
      </div>
      <div class="widget">
        <h4>Distribución de Egresos</h4>
        <div class="chart-container" style="position: relative; height: 280px; width: 100%;">
             <canvas id="graficoGastosCategoria"></canvas>
        </div>
      </div>
    </div>
  `;

  // --- Lógica para renderizar los gráficos (Sin cambios) ---
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

    const ingresosGCPorMes = pagos.filter(p => p && p[13] && p[13].startsWith(periodo)).reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0);
    const ingresosExtraPorMes = ingresosExtra.filter(i => i && i[1] && i[1].startsWith(periodo)).reduce((a,b) => a + Number(b[3]||0), 0);
    ingresosPorMes.push(ingresosGCPorMes + ingresosExtraPorMes);

    egresosPorMes.push(egresos.filter(e => e && e[1] && e[1].startsWith(periodo)).reduce((a,b) => a + Number(b[6]||0), 0));
  }

  setTimeout(() => {
    const graficoCanvas = document.getElementById('graficoIngresosEgresos');
    if (graficoCanvas) {
        new Chart(graficoCanvas, {
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
                y: { 
                    beginAtZero: true,
                    ticks: { callback: value => '$' + value.toLocaleString('es-CL') } 
                } 
            }
          }
        });
    }

    const dataGastos = Object.values(gastosPorCategoria);
    const labelsGastos = Object.keys(gastosPorCategoria);
    const graficoGastosCanvas = document.getElementById('graficoGastosCategoria');
    if(dataGastos.length > 0 && graficoGastosCanvas) {
      new Chart(graficoGastosCanvas, {
        type: 'doughnut',
        data: {
          labels: labelsGastos,
          datasets: [{
            label: 'Gastos',
            data: dataGastos,
            backgroundColor: ['#7fd6c2', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', '#6f42c1', '#4e73df', '#36b9cc', '#1cc88a'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { position: 'right' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.chart.data.datasets[0].data.reduce((acc, current) => acc + current, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  const formattedValue = typeof value === 'number' ? value.toLocaleString('es-CL') : value;
                  return `${label}: $${formattedValue} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    } else if (graficoGastosCanvas) {
        graficoGastosCanvas.parentElement.innerHTML += '<div style="margin:auto; text-align:center; color:#6c757d;">No hay datos para mostrar.</div>';
        graficoGastosCanvas.remove();
    }
  }, 100);

  ocultarSpinner();
}
