// js/dashboard.js

async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();

  try {
    const [residentes, pagosGC, egresos, mantenciones] = await Promise.all([
      obtenerResidentes(),
      obtenerPagosGC(),
      obtenerEgresos(),
      obtenerMantenciones()
    ]);

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth();
    const nombreMesActual = MESES[mesActual];

    // Cálculos para los Widgets
    const totalResidentes = residentes.length;

    const totalIngresosMesActual = pagosGC
      .filter(p => {
        if (!p[4]) return false;
        const [mes, anio] = p[4].split(' ');
        return anio == anioActual && mes.toLowerCase() === nombreMesActual.toLowerCase();
      })
      .reduce((sum, p) => sum + parseFloat(p[6] || 0), 0);

    const totalEgresosMesActual = egresos
      .filter(e => {
        if (!e[1]) return false;
        const fechaEgreso = new Date(e[1].replace(/-/g, '/'));
        return fechaEgreso.getFullYear() === anioActual && fechaEgreso.getMonth() === mesActual;
      })
      .reduce((sum, e) => sum + parseFloat(e[3] || 0), 0);

    const mantencionesPendientes = mantenciones.filter(m => m[3] && m[3].toLowerCase() === 'pendiente').length;

    // --- INICIO: Lógica modificada para incluir el estado "Abono" ---
    const pagosMesActual = pagosGC.filter(p => {
        if (!p[4]) return false;
        const [mes, anio] = p[4].split(' ');
        return anio == anioActual && mes.toLowerCase() === nombreMesActual.toLowerCase();
    });

    const parcelasPagadoCompleto = pagosMesActual
        .filter(p => p[15] && p[15].toLowerCase() === 'pagado')
        .map(p => p[2]);

    const residentesConDeuda = residentes.filter(r => {
        const numeroParcela = r[3];
        return !parcelasPagadoCompleto.includes(numeroParcela);
    });
    // --- FIN: Lógica modificada ---
    
    const main = document.getElementById('main-content');
    // Se utiliza la estructura HTML original exacta de tu archivo.
    main.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>Dashboard</h2>
      </div>
      <div class="dashboard-grid">
        <div class="widget"><h4>Total Residentes</h4><p id="total-residentes"></p></div>
        <div class="widget"><h4>Ingresos del Mes</h4><p id="ingresos-mes"></p></div>
        <div class="widget"><h4>Egresos del Mes</h4><p id="egresos-mes"></p></div>
        <div class="widget"><h4>Mantenciones Pendientes</h4><p id="mantenciones-pendientes"></p></div>
        <div class="widget large">
          <h4>Ingresos vs. Egresos</h4>
          <canvas id="graficoIngresosEgresos" style="max-height: 250px;"></canvas>
        </div>
        <div class="widget large">
          <h4>Residentes Morosos (${nombreMesActual})</h4>
          <div id="lista-morosos" class="lista-scroll">
          </div>
        </div>
      </div>
    `;

    // Se inyectan los datos en los widgets superiores.
    document.getElementById('total-residentes').textContent = totalResidentes;
    document.getElementById('ingresos-mes').textContent = `$${totalIngresosMesActual.toLocaleString('es-CL')}`;
    document.getElementById('egresos-mes').textContent = `$${totalEgresosMesActual.toLocaleString('es-CL')}`;
    document.getElementById('mantenciones-pendientes').textContent = mantencionesPendientes;
    
    // Se inyecta la lista de residentes con la lógica modificada.
    const listaMorososEl = document.getElementById('lista-morosos');
    if (residentesConDeuda.length > 0) {
      residentesConDeuda.forEach(res => {
        // La estructura del item se mantiene como en tu archivo original.
        listaMorososEl.innerHTML += `<div class="residente-item"><span>${res[1]} (Parcela ${res[3]})</span></div>`;
      });
    } else {
      listaMorososEl.innerHTML = '<p style="text-align:center; padding-top: 20px;">¡Felicitaciones! No hay residentes con deudas este mes.</p>';
    }

    // La lógica del gráfico no se implementa, respetando tu archivo original.
    const ctx = document.getElementById('graficoIngresosEgresos').getContext('2d');
    // Tu código local se encargará de dibujar el gráfico aquí.

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    mostrarMensaje("No se pudo cargar la información del dashboard: " + error.message, 'error');
  } finally {
    ocultarSpinner();
  }
}
