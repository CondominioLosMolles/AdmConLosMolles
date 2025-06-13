export async function cargarDashboard() {
  const widgets = [
    { id: 'res-activos', label: 'Residentes Activos', value: '--' },
    { id: 'ing-mes', label: 'Ingresos del Mes', value: '--' },
    { id: 'egre-mes', label: 'Egresos del Mes', value: '--' },
    { id: 'saldo-caja', label: 'Saldo de Caja', value: '--' },
    { id: 'mant-pend', label: 'Mantenciones Pendientes', value: '--' },
  ];

  let residentes = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Residentes!A2:I',
  });
  const residentesData = residentes.result.values || [];
  widgets[0].value = residentesData.filter((row) => row[7] === 'Activo').length;

  const now = new Date();
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  const año = now.getFullYear();

  let pagos = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Pagos_GC!A2:Q',
  });
  const pagosData = pagos.result.values || [];
  const pagosMes = pagosData.filter((row) => (row[4] || '').startsWith(`${año}-${mes}`));
  const totalPagado = pagosMes.reduce((sum, row) => sum + (parseInt(row[6]) || 0), 0);
  widgets[1].value = totalPagado > 0 ? '$' + totalPagado.toLocaleString('es-CL') : '--';

  let egresos = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Egresos!A2:G',
  });
  const egresosData = egresos.result.values || [];
  const egresosMes = egresosData.filter((row) => (row[1] || '').startsWith(`${año}-${mes}`));
  const totalEgresos = egresosMes.reduce((sum, row) => sum + (parseInt(row[5]) || 0), 0);
  widgets[2].value = totalEgresos > 0 ? '$' + totalEgresos.toLocaleString('es-CL') : '--';

  const totalPagadoAll = pagosData.reduce((sum, row) => sum + (parseInt(row[6]) || 0), 0);
  const totalEgresosAll = egresosData.reduce((sum, row) => sum + (parseInt(row[5]) || 0), 0);
  widgets[3].value =
    totalPagadoAll || totalEgresosAll ? '$' + (totalPagadoAll - totalEgresosAll).toLocaleString('es-CL') : '--';

  let mant = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Mantenciones!A2:H',
  });
  const mantData = mant.result.values || [];
  widgets[4].value = mantData.filter((row) => row[5] === 'Pendiente' || row[5] === 'Urgente').length;

  widgets.forEach((w) => {
    const el = document.getElementById(w.id);
    if (el) el.querySelector('.widget-value').innerHTML = w.value;
  });

  // Morosidad
  const morosos = residentesData.filter((row) => row[7] === 'Moroso');
  const morososList = morosos.map((row) => row[3]).join(', ');
  let deudaTotal = 0;
  morosos.forEach((moroso) => {
    const pagosMoroso = pagosData.filter((row) => row[1] === moroso[0]);
    pagosMoroso.forEach((pm) => {
      if (parseInt(pm[12]) > 0) deudaTotal += parseInt(pm[12]);
    });
  });
  document.getElementById('dashboard-morosidad').innerHTML = `
    <h4 style="color:#2176ae;margin-bottom:8px;">Morosidad</h4>
    <div>Cantidad de morosos: <b>${morosos.length}</b></div>
    <div>Parcelas morosas: <span>${morososList}</span></div>
    <div>Total deuda: <b>$${deudaTotal.toLocaleString('es-CL')}</b></div>
  `;

  // Gráfico ingresos vs egresos últimos 12 meses
  let ctx = document.getElementById('chart-ing-egre').getContext('2d');
  if (window.myChart) window.myChart.destroy();

  let ingresosArr = [],
    egresosArr = [],
    labelsArr = [];

  for (let i = 11; i >= 0; i--) {
    let fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let label =
      fecha
        .toLocaleString('es-CL', { month: 'short' })
        .charAt(0)
        .toUpperCase() + fecha.toLocaleString('es-CL', { month: 'short' }).slice(1);
    labelsArr.push(label);
    let periodo = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
    let pag = pagosData.filter((row) => (row[4] || '').startsWith(periodo));
    let eg = egresosData.filter((row) => (row[1] || '').startsWith(periodo));
    ingresosArr.push(pag.reduce((sum, row) => sum + (parseInt(row[6]) || 0), 0));
    egresosArr.push(eg.reduce((sum, row) => sum + (parseInt(row[5]) || 0), 0));
  }

  let maxVal = Math.max(...ingresosArr, ...egresosArr, 100000);
  let stepSize = 100000;
  if (maxVal > 1000000 && maxVal <= 5000000) stepSize = 500000;
  else if (maxVal > 5000000 && maxVal <= 10000000) stepSize = 1000000;
  else if (maxVal > 10000000) stepSize = 5000000;

  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labelsArr,
      datasets: [
        { label: 'Ingresos', data: ingresosArr, backgroundColor: '#2d7f5e' },
        { label: 'Egresos', data: egresosArr, backgroundColor: '#e67e22' },
      ],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: {
          beginAtZero: true,
          stepSize: stepSize,
          max: Math.ceil(maxVal / stepSize) * stepSize,
          ticks: {
            callback: function (value) {
              return '$' + value.toLocaleString('es-CL');
            },
          },
        },
      },
    },
  });
}
