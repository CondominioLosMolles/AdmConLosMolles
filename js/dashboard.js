// js/dashboard.js
async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();
  
  let residentes = [], pagos = [], egresos = [], tareas = [], config = {};
  try {
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
    tareas = tareasData || [];
    config = configData || {};
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos del dashboard: ' + e.message, 'error');
    return;
  }

  // --- CÁLCULOS PRINCIPALES ---
  const activos = residentes.filter(r => r && r[7] === 'Activo').length;
  const totalParcelas = 26; // Asumimos un total de 26 parcelas para la tasa de ocupación
  const tasaOcupacion = totalParcelas > 0 ? ((activos / totalParcelas) * 100).toFixed(1) : 0;
  
  const saldoInicial = parseFloat(config.Saldo_Inicial_Caja || 0);
  const totalIngresos = pagos.reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0);
  const totalEgresos = egresos.reduce((a,b) => a + Number(b[6]||0), 0);
  const saldoCaja = saldoInicial + totalIngresos - totalEgresos;

  const tareasAbiertas = tareas.filter(t => t && t[6] && t[6] !== 'Finalizado' && t[6] !== 'Cancelado').length;

  // --- CÁLCULO DE MOROSIDAD ---
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

  // ► NUEVO: CÁLCULO DE TIEMPO PROMEDIO DE PAGO
  const pagosRealizados = pagos.filter(p => p && p[5] && p[13]); // Con fecha de vencimiento y fecha de pago
  let totalDiasTardios = 0;
  pagosRealizados.forEach(p => {
    const fechaVencimiento = new Date(p[5].replace(/-/g, '/'));
    const fechaPago = new Date(p[13].replace(/-/g, '/'));
    if (fechaPago > fechaVencimiento) {
      const diffTime = Math.abs(fechaPago - fechaVencimiento);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDiasTardios += diffDays;
    }
  });
  const tiempoPromedioPago = pagosRealizados.length > 0 ? (totalDiasTardios / pagosRealizados.length).toFixed(1) : 0;

  // ► NUEVO: CÁLCULO DE GASTOS POR CATEGORÍA PARA GRÁFICO
  const gastosPorCategoria = egresos.reduce((acc, egreso) => {
    if (!egreso || !egreso[2]) return acc;
    const categoria = egreso[2];
    const monto = parseFloat(egreso[6] || 0);
    acc[categoria] = (acc[categoria] || 0) + monto;
    return acc;
  }, {});

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Dashboard</h2>
    <div class="dashboard-grid-cards">
      <div class="widget">
          <div class="widget-value">$${saldoCaja.toLocaleString('es-CL')}</div>
          <div class="widget-label">Saldo Real de Caja</div>
      </div>
      <div class="widget">
          <div class="widget-value">$${totalIngresos.toLocaleString('es-CL')}</div>
          <div class="widget-label">Ingresos Totales Históricos</div>
      </div>
      <div class="widget">
          <div class="widget-value">$${totalEgresos.toLocaleString('es-CL')}</div>
          <div class="widget-label">Egresos Totales Históricos</div>
      </div>
      <div class="widget">
          <div class="widget-value">${tareasAbiertas}</div>
          <div class="widget-label">Tareas Abiertas</div>
      </div>
      <div class="widget">
          <div class="widget-value">${tiempoPromedioPago} días</div>
          <div class="widget-label">Tiempo Promedio de Pago</div>
      </div>
       <div class="widget">
          <div class="widget-value">${activos} <span style="font-size:0.6em; color:#6c757d;">(${tasaOcupacion}%)</span></div>
          <div class="widget-label">Residentes Activos</div>
      </div>
    </div>

    <div class="dashboard-grid-main">
      <div class="widget widget-large">
        <h4>Ingresos vs. Egresos (Últimos 12 Meses)</h4>
        <canvas id="graficoIngresosEgresos" style="max-width:100%;height:320px;"></canvas>
      </div>
      <div class="widget">
        <h4>Resumen de Morosidad</h4>
        <div class="summary-item"><span>Parcelas con Deuda:</span> <b>${morosos.length}</b></div>
        <div class="summary-item"><span>Deuda Total:</span> <b style="color: #dc3545;">$${deudaTotalMorosos.toLocaleString('es-CL')}</b></div>
        <div class="summary-item-list"><span>Parcelas Morosas:</span> <div>${parcelasMorosas.join(', ') || '-'}</div></div>
      </div>
      <div class="widget widget-large">
        <h4>Distribución de Egresos por Categoría</h4>
        <canvas id="graficoGastosCategoria" style="max-width:100%; max-height: 320px; margin: auto;"></canvas>
      </div>
    </div>
  `;

  // Lógica para renderizar gráfico de Ingresos vs Egresos (sin cambios)
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

  setTimeout(() => {
    // Gráfico de Barras
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

    // ► NUEVO: Lógica para renderizar el gráfico de pastel (doughnut)
    const dataGastos = Object.values(gastosPorCategoria);
    const labelsGastos = Object.keys(gastosPorCategoria);
    if(dataGastos.length > 0) {
      new Chart(document.getElementById('graficoGastosCategoria'), {
        type: 'doughnut',
        data: {
          labels: labelsGastos,
          datasets: [{
            label: 'Gastos',
            data: dataGastos,
            backgroundColor: ['#7fd6c2', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', '#f8f9fc', '#4e73df', '#36b9cc', '#1cc88a'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
            }
          }
        }
      });
    } else {
        document.getElementById('graficoGastosCategoria').parentElement.innerHTML += '<p style="text-align:center; padding-top: 50px;">No hay datos de egresos para mostrar.</p>';
    }

  }, 100);

  ocultarSpinner();
}
