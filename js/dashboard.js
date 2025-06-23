// js/dashboard.js
async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();
  let residentes = [], pagos = [], egresos = [], mantenciones = [], config = {}; // Añadir config
  try {
    // MODIFICADO: Ahora también obtiene la configuración global
    const [residentesData, pagosData, egresosData, mantencionesData, configData] = await Promise.all([
        obtenerResidentes(),
        obtenerPagosGC(),
        obtenerEgresos(),
        obtenerMantenciones(),
        obtenerConfiguracion() // NUEVA LLAMADA
    ]);
    residentes = residentesData || [];
    pagos = pagosData || [];
    egresos = egresosData || [];
    mantenciones = mantencionesData || [];
    config = configData || {};
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos del dashboard: ' + e.message, 'error');
    return;
  }

  const activos = residentes.filter(r => r && r[7] === 'Activo').length;
  const mesActual = new Date().toISOString().slice(0,7);
  const ingresosMes = pagos.filter(p => p && p[13] && p[13].startsWith(mesActual)).reduce((a,b) => a + Number(b[6]||0), 0);
  const egresosMes = egresos.filter(e => e && e[1] && e[1].startsWith(mesActual)).reduce((a,b) => a + Number(b[6]||0), 0);
  
  // MODIFICADO: El cálculo del Saldo de Caja ahora incluye el Saldo Inicial.
  const saldoInicial = parseFloat(config.Saldo_Inicial_Caja || 0);
  const totalIngresos = pagos.reduce((a,b) => a + Number(b[6]||0) + Number(b[17]||0), 0); // Suma G.C. y Abonos a Convenio
  const totalEgresos = egresos.reduce((a,b) => a + Number(b[6]||0), 0);
  const saldoCaja = saldoInicial + totalIngresos - totalEgresos;

  const mantPendientes = mantenciones.filter(m => m && (m[5] === 'Pendiente' || m[5] === 'Urgente')).length;

  // Lógica de morosidad sin cambios...
  const morososData = {};
  const hoy = new Date();
  
  residentes.forEach(r => {
    if(!r[3]) return; // Si no tiene parcela, se omite
    const parcela = r[3];
    if (!morososData[parcela]) {
      morososData[parcela] = { deudaTotal: 0, mesesAtraso: 0 };
    }
  });

  pagos.forEach(p => {
      const deuda = parseFloat(p[12] || 0);
      if (deuda > 0) {
        morososData[p[2]].deudaTotal += deuda;
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
      <div class="widget" style="flex:1;min-width:160px;"><div style="font-size:2em;font-weight:700;">${mantPendientes}</div><div>Mantenciones Pendientes/Urgentes</div></div>
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

  // Lógica del gráfico sin cambios...
  const labels = [];
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const ingresosPorMes = [];
  const egresosPorMes = [];
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
    // ... (código del gráfico se mantiene igual)
  }, 100);

  ocultarSpinner();
}

document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
