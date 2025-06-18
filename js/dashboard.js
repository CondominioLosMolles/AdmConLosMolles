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

    // --- LÓGICA MODIFICADA PARA IDENTIFICAR RESIDENTES CON DEUDA ---
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
    
    const main = document.getElementById('main-content');
    // SE RESTAURA LA ESTRUCTURA HTML ORIGINAL EXACTA
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
          <h4>Ingresos vs. Egresos (Últimos 6 meses)</h4>
          <canvas id="graficoIngresosEgresos" style="max-height: 250px;"></canvas>
        </div>
        <div class="widget large">
          <h4>Residentes con Deuda (${nombreMesActual})</h4>
          <div id="lista-morosos" class="lista-scroll">
          </div>
        </div>
      </div>
    `;

    // SE INYECTAN LOS DATOS EN LA ESTRUCTURA HTML EXISTENTE
    document.getElementById('total-residentes').textContent = totalResidentes;
    document.getElementById('ingresos-mes').textContent = `$${totalIngresosMesActual.toLocaleString('es-CL')}`;
    document.getElementById('egresos-mes').textContent = `$${totalEgresosMesActual.toLocaleString('es-CL')}`;
    document.getElementById('mantenciones-pendientes').textContent = mantencionesPendientes;
    
    const listaMorososEl = document.getElementById('lista-morosos');
    if (residentesConDeuda.length > 0) {
      residentesConDeuda.forEach(res => {
        const numeroParcela = res[3];
        const pagoExistente = pagosMesActual.find(p => p[2] === numeroParcela);
        
        let estadoTexto = 'Moroso';
        // El estado por defecto es 'moroso', no necesita clase extra si tu CSS ya lo maneja
        let estadoClass = 'estado-moroso'; 

        if (pagoExistente && pagoExistente[15] && pagoExistente[15].toLowerCase() === 'abono') {
          estadoTexto = 'Abono';
          estadoClass = 'estado-abono';
        }

        // Se usa la estructura original del item, solo se añade la etiqueta de estado
        const itemHTML = `
            <div class="residente-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span>${res[1]} (Parcela ${numeroParcela})</span>
                <span class="estado-tag ${estadoClass}">${estadoTexto}</span>
            </div>
        `;
        listaMorososEl.innerHTML += itemHTML;
      });
    } else {
      listaMorososEl.innerHTML = '<p style="text-align:center; padding-top: 20px;">¡Felicitaciones! No hay residentes con deudas este mes.</p>';
    }

    // Lógica del Gráfico (sin cambios)
    const ctx = document.getElementById('graficoIngresosEgresos').getContext('2d');
    const labels = [];
    const dataIngresos = [];
    const dataEgresos = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        const anioMes = d.getFullYear();
        const mesMes = d.getMonth();
        const nombreMes = MESES[mesMes];
        labels.push(nombreMes);

        const ingresosEsteMes = pagosGC
            .filter(p => {
                if (!p[4]) return false;
                const [mes, anio] = p[4].split(' ');
                return anio == anioMes && mes.toLowerCase() === nombreMes.toLowerCase();
            })
            .reduce((sum, p) => sum + parseFloat(p[6] || 0), 0);
        dataIngresos.push(ingresosEsteMes);
        
        const egresosEsteMes = egresos
            .filter(e => {
                if (!e[1]) return false;
                const fechaEgreso = new Date(e[1].replace(/-/g, '/'));
                return fechaEgreso.getFullYear() === anioMes && fechaEgreso.getMonth() === mesMes;
            })
            .reduce((sum, e) => sum + parseFloat(e[3] || 0), 0);
        dataEgresos.push(egresosEsteMes);
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: dataIngresos,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }, {
                label: 'Egresos',
                data: dataEgresos,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    mostrarMensaje("No se pudo cargar la información del dashboard: " + error.message, 'error');
  } finally {
    ocultarSpinner();
  }
}
