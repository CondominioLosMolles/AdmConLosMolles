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
    <style>
      .dashboard-grid-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }
      .dashboard-grid-main {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px;
      }
      .widget {
          padding: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
      }
      .widget-value {
        font-size: 2.2em;
        font-weight: 700;
        color: #2a7ca3;
        line-height: 1.1;
      }
      .widget-label {
        margin-top: 8px;
        font-size: 0.95em;
        color: #6c757d;
      }
      .widget.widget-large {
        grid-column: 1 / -1;
      }
      .widget h4 {
        margin-top: 0;
        margin-bottom: 24px;
        text-align: left;
        width: 100%;
      }
      .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; text-align: left; }
      .summary-item:last-child { border-bottom: none; }
      .summary-item span { color: #555; }
      .summary-item b { color: #333; }
      .summary-item-list { padding: 10px 0; text-align: left; }
      .summary-item-list span { display: block; margin-bottom: 5px; color: #555;}
      .summary-item-list div { font-weight: bold; color: #333; word-break: break-word; }

      @media (max-width: 992px) {
        .dashboard-grid-main {
            grid-template-columns: 1fr;
        }
      }
    </style>
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
        <canvas id="graficoIngresosEgresos" style="width:100%; height:320px;"></canvas>
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
        <canvas id="graficoGastosCategoria" style="width:100%; max-height: 280px; margin: auto;"></canvas>
      </div>
    </div>
  `;

  // Lógica para renderizar gráfico de Ingresos vs Egresos
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
        scales: { y: { ticks: { callback: value => '$' + value.toLocaleString('es-CL') } } }
      }
    });

    // Lógica para renderizar el gráfico de pastel
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
            backgroundColor: ['#7fd6c2', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', '#f8f9fc', '#4e73df', '#36b9cc', '#1cc88a'],
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } }
        }
      });
    } else if (graficoGastosCanvas) {
        graficoGastosCanvas.parentElement.innerHTML += '<div style="margin:auto; text-align:center; color:#6c757d;">No hay datos de egresos para mostrar.</div>';
        graficoGastosCanvas.remove();
    }

  }, 100);

  ocultarSpinner();
}
