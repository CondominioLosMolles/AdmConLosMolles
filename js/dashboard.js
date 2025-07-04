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
  const fechaSaldoString = config.Fecha_Saldo_Inicial;
  let pagosFiltrados = pagos;
  let egresosFiltrados = egresos;
  
  if (fechaSaldoString) {
      const parts = fechaSaldoString.split('-');
      if (parts.length === 3) {
          const fechaSaldoDate = new Date(Date.UTC(parts[2], parts[1] - 1, parts[0]));
          
          pagosFiltrados = pagos.filter(p => {
              if (!p || !p[13]) return false;
              const fechaPagoParts = p[13].split('-');
              const fechaPago = new Date(Date.UTC(fechaPagoParts[0], fechaPagoParts[1] - 1, fechaPagoParts[2]));
              return fechaPago >= fechaSaldoDate;
          });

          egresosFiltrados = egresos.filter(e => {
              if (!e || !e[1]) return false;
              const fechaEgresoParts = e[1].split('-');
               const fechaEgreso = new Date(Date.UTC(fechaEgresoParts[0], fechaEgresoParts[1] - 1, fechaEgresoParts[2]));
              return fechaEgreso >= fechaSaldoDate;
          });
      }
  }

  const totalIngresos = pagosFiltrados.reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0);
  const totalEgresos = egresosFiltrados.reduce((a,b) => a + Number(b[6]||0), 0);
  
  // ▼ MODIFICADO: El cálculo de saldo ahora es solo Ingresos - Egresos.
  const saldoCaja = totalIngresos - totalEgresos;

  // --- CÁLCULOS SECUNDARIOS (NO SE MUESTRAN EN TARJETAS PERO PUEDEN SER ÚTILES A FUTURO) ---
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

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <style>
      .dashboard-grid-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px; }
      .dashboard-grid-main { display: grid; grid-template-columns: 1fr; gap: 24px; }
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
      /* ▼ NUEVO: Estilo para destacar la tarjeta de Saldo de Caja */
      .widget-highlight {
        background-color: #e7f3fe;
        border-color: #2a7ca3;
      }
      .widget-highlight .widget-value {
        color: #004a7f;
        font-size: 2.8em;
      }
    </style>

    <h2>Dashboard</h2>
    <div class="dashboard-grid-cards">
      <div class="widget widget-highlight">
          <div class="widget-value">$${saldoCaja.toLocaleString('es-CL')}</div>
          <div class="widget-label">Saldo Real de Caja</div>
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
       <div class="widget">
        <h4>Ingresos vs. Egresos (Últimos 12 Meses)</h4>
        <div class="chart-container" style="position: relative; height: 350px; width: 100%;">
            <canvas id="graficoIngresosEgresos"></canvas>
        </div>
      </div>
    </div>
  `;

  // Lógica para renderizar el gráfico de Ingresos vs Egresos
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
  }, 100);

  ocultarSpinner();
}
