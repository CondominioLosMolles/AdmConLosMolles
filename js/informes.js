// js/informes.js
// Módulo Informes: morosidad, estado de resultados, historial de pagos, gastos por categoría, exportación PDF/Excel

async function cargarInformes() {
  limpiarMainContent();
  mostrarSpinner();

  let residentes = [], pagos = [], egresos = [];
  try {
    residentes = await obtenerResidentes();
    pagos = await obtenerPagosGC();
    egresos = await obtenerEgresos();
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos: ' + e.message, 'error');
    return;
  }

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <h2>Informes</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">
      <button class="btn" id="btnInformeMorosidad">Morosidad</button>
      <button class="btn" id="btnInformeResultados">Estado de Resultados</button>
      <button class="btn" id="btnInformePagos">Historial de Pagos</button>
      <button class="btn" id="btnInformeEgresos">Gastos por Categoría</button>
    </div>
    <div id="areaInforme"></div>
  `;

  // Morosidad
  document.getElementById('btnInformeMorosidad').onclick = () => {
    const morosos = residentes.filter(r => r[7] === 'Moroso');
    const parcelasMorosas = morosos.map(r => r[3]);
    const deudaMorosos = pagos
      .filter(p => parcelasMorosas.includes(p[2]) && p[15] === 'Moroso')
      .reduce((a,b) => a + Number(b[12]||0), 0);
    let html = `<h3>Informe de Morosidad</h3>
      <table class="table">
        <thead>
          <tr><th>Nombre</th><th>Parcela</th><th>Email</th><th>Deuda Total</th></tr>
        </thead>
        <tbody>`;
    for (const r of morosos) {
      const deuda = pagos
        .filter(p => p[2] === r[3] && p[15] === 'Moroso')
        .reduce((a,b) => a + Number(b[12]||0), 0);
      html += `<tr>
        <td>${r[1]}</td>
        <td>${r[3]}</td>
        <td>${r[5]}</td>
        <td>$${deuda.toLocaleString()}</td>
      </tr>`;
    }
    html += `</tbody></table>
      <div><b>Total Morosos:</b> ${morosos.length}</div>
      <div><b>Deuda Total:</b> $${deudaMorosos.toLocaleString()}</div>
      <button class="btn secondary" id="btnExportarMorosidad">Exportar Excel</button>
    `;
    document.getElementById('areaInforme').innerHTML = html;

    document.getElementById('btnExportarMorosidad').onclick = () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Nombre","Parcela","Email","Deuda Total"],
        ...morosos.map(r => [
          r[1], r[3], r[5],
          pagos.filter(p => p[2] === r[3] && p[15] === 'Moroso').reduce((a,b) => a + Number(b[12]||0), 0)
        ])
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Morosidad");
      XLSX.writeFile(wb, "Morosidad.xlsx");
    };
  };

  // Estado de Resultados
  document.getElementById('btnInformeResultados').onclick = () => {
    const ingresos = pagos.reduce((a,b) => a + Number(b[6]||0), 0);
    const multas = pagos.reduce((a,b) => a + Number(b[10]||0), 0);
    const egresosTot = egresos.reduce((a,b) => a + Number(b[6]||0), 0);
    const saldo = ingresos + multas - egresosTot;
    let html = `<h3>Estado de Resultados</h3>
      <table class="table">
        <tr><th>Ingresos por Pagos</th><td>$${ingresos.toLocaleString()}</td></tr>
        <tr><th>Ingresos por Multas</th><td>$${multas.toLocaleString()}</td></tr>
        <tr><th>Total Egresos</th><td>$${egresosTot.toLocaleString()}</td></tr>
        <tr><th>Saldo Final</th><td><b>$${saldo.toLocaleString()}</b></td></tr>
      </table>
      <button class="btn secondary" id="btnExportarResultados">Exportar Excel</button>
    `;
    document.getElementById('areaInforme').innerHTML = html;

    document.getElementById('btnExportarResultados').onclick = () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Concepto","Monto"],
        ["Ingresos por Pagos", ingresos],
        ["Ingresos por Multas", multas],
        ["Total Egresos", egresosTot],
        ["Saldo Final", saldo]
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resultados");
      XLSX.writeFile(wb, "Resultados.xlsx");
    };
  };

  // Historial de Pagos
  document.getElementById('btnInformePagos').onclick = () => {
    let html = `<h3>Historial de Pagos</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Residente</th>
            <th>Parcela</th>
            <th>Periodo</th>
            <th>Monto Pagado</th>
            <th>Fecha Pago</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>`;
    for (const p of pagos) {
      html += `<tr>
        <td>${p[1]}</td>
        <td>${p[2]}</td>
        <td>${p[4]}</td>
        <td>${p[6]}</td>
        <td>${p[13]}</td>
        <td>${p[15]}</td>
      </tr>`;
    }
    html += `</tbody></table>
      <button class="btn secondary" id="btnExportarPagos">Exportar Excel</button>
    `;
    document.getElementById('areaInforme').innerHTML = html;

    document.getElementById('btnExportarPagos').onclick = () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Residente","Parcela","Periodo","Monto Pagado","Fecha Pago","Estado"],
        ...pagos.map(p => [p[1],p[2],p[4],p[6],p[13],p[15]])
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Pagos");
      XLSX.writeFile(wb, "Pagos.xlsx");
    };
  };

  // Gastos por Categoría (torta)
  document.getElementById('btnInformeEgresos').onclick = () => {
    // Agrupar por categoría
    const categorias = {};
    for (const e of egresos) {
      categorias[e[2]] = (categorias[e[2]] || 0) + Number(e[6]||0);
    }
    let html = `<h3>Gastos por Categoría</h3>
      <canvas id="graficoCategorias"></canvas>
      <table class="table">
        <thead>
          <tr><th>Categoría</th><th>Monto</th></tr>
        </thead>
        <tbody>`;
    for (const cat in categorias) {
      html += `<tr><td>${cat}</td><td>$${categorias[cat].toLocaleString()}</td></tr>`;
    }
    html += `</tbody></table>
      <button class="btn secondary" id="btnExportarEgresosCat">Exportar Excel</button>
    `;
    document.getElementById('areaInforme').innerHTML = html;

    setTimeout(() => {
      new Chart(document.getElementById('graficoCategorias'), {
        type: 'pie',
        data: {
          labels: Object.keys(categorias),
          datasets: [{
            data: Object.values(categorias),
            backgroundColor: ['#2a7ca3','#7fd6c2','#f6c23e','#e74a3b','#858796']
          }]
        },
        options: { responsive:true, plugins:{legend:{position:'top'}} }
      });
    }, 100);

    document.getElementById('btnExportarEgresosCat').onclick = () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["Categoría","Monto"],
        ...Object.entries(categorias)
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Egresos por Categoría");
      XLSX.writeFile(wb, "EgresosPorCategoria.xlsx");
    };
  };

  ocultarSpinner();
}

// Evento de menú
document.querySelector('[data-module="informes"]').addEventListener('click', cargarInformes);
