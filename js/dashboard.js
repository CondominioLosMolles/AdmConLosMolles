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

    // 1. Total Residentes
    const totalResidentes = residentes.length;

    // 2. Total Ingresos del Mes Actual
    const totalIngresosMesActual = pagosGC
      .filter(p => {
        // La columna del período es la 5 (índice 4)
        if (!p[4]) return false;
        const [mes, anio] = p[4].split(' ');
        return anio == anioActual && mes.toLowerCase() === nombreMesActual.toLowerCase();
      })
      // La columna de monto pagado es la 7 (índice 6)
      .reduce((sum, p) => sum + parseFloat(p[6] || 0), 0);

    // 3. Total Egresos del Mes Actual
    const totalEgresosMesActual = egresos
      .filter(e => {
        // La columna de fecha es la 2 (índice 1)
        const fechaEgreso = new Date(e[1].replace(/-/g, '/'));
        return fechaEgreso.getFullYear() === anioActual && fechaEgreso.getMonth() === mesActual;
      })
      // La columna de monto es la 4 (índice 3)
      .reduce((sum, e) => sum + parseFloat(e[3] || 0), 0);

    // 4. Mantenciones Pendientes
    // La columna de estado es la 4 (índice 3)
    const mantencionesPendientes = mantenciones.filter(m => m[3] && m[3].toLowerCase() === 'pendiente').length;

    // --- INICIO CAMBIO: Lógica para incluir residentes con Abono ---
    
    // Pagos registrados en el mes actual
    const pagosMesActual = pagosGC.filter(p => {
        if (!p[4]) return false;
        const [mes, anio] = p[4].split(' ');
        return anio == anioActual && mes.toLowerCase() === nombreMesActual.toLowerCase();
    });

    // Obtenemos SOLO las parcelas que han pagado COMPLETAMENTE este mes.
    // El estado del pago está en la columna 16 (índice 15).
    const parcelasPagadoCompleto = pagosMesActual
        .filter(p => p[15] && p[15].toLowerCase() === 'pagado')
        .map(p => p[2]); // p[2] es N_Parcela

    // Un residente tiene deuda si su parcela NO está en la lista de los que pagaron completo.
    // Esto ahora incluye a los que no pagaron nada y a los que tienen estado "Abono".
    const residentesMorosos = residentes.filter(r => {
        const numeroParcela = r[3]; // La parcela está en la columna 4 (índice 3)
        return !parcelasPagadoCompleto.includes(numeroParcela);
    });

    // --- FIN CAMBIO ---

    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2>Dashboard</h2>
      </div>
      <div class="dashboard-grid">
        <div class="widget"><h4>Total Residentes</h4><p>${totalResidentes}</p></div>
        <div class="widget"><h4>Ingresos del Mes</h4><p>$${totalIngresosMesActual.toLocaleString('es-CL')}</p></div>
        <div class="widget"><h4>Egresos del Mes</h4><p>$${totalEgresosMesActual.toLocaleString('es-CL')}</p></div>
        <div class="widget"><h4>Mantenciones Pendientes</h4><p>${mantencionesPendientes}</p></div>
        
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
      <style>
        .residente-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px; border-bottom: 1px solid #eee; }
        .estado-abono { background-color: #ffc107; color: #333; }
      </style>
      `;
    
    // --- INICIO CAMBIO: Lógica para mostrar estado "Moroso" o "Abono" en la lista ---
    const listaMorososEl = document.getElementById('lista-morosos');
    if (residentesMorosos.length > 0) {
        residentesMorosos.forEach(res => {
            const numeroParcela = res[3];
            
            // Buscar si existe un pago con abono para darle un estado más específico
            const pagoConAbono = pagosMesActual.find(p => p[2] === numeroParcela && p[15] && p[15].toLowerCase() === 'abono');
            
            let estadoTexto = 'Moroso';
            let estadoClass = 'estado-moroso';

            if (pagoConAbono) {
                estadoTexto = 'Abono';
                estadoClass = 'estado-abono';
            }

            listaMorososEl.innerHTML += `
                <div class="residente-item">
                    <span>${res[1]} (Parcela ${numeroParcela})</span>
                    <span class="estado-tag ${estadoClass}">${estadoTexto}</span>
                </div>
            `;
        });
    } else {
        listaMorososEl.innerHTML = '<p style="text-align:center; margin-top: 20px;">¡Felicitaciones! No hay residentes con deudas este mes.</p>';
    }
    // --- FIN CAMBIO ---

    // Gráfico
    const ctx = document.getElementById('graficoIngresosEgresos').getContext('2d');
    const labels = [];
    const dataIngresos = [];
    const dataEgresos = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(anioActual, mesActual - i, 1);
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
