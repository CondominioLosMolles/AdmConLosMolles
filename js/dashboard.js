// js/dashboard.js
async function cargarDashboard() {
  limpiarMainContent();
  mostrarSpinner();
  let residentes = [], pagos = [], egresos = [], mantenciones = [];
  try {
    const [residentesData, pagosData, egresosData, mantencionesData] = await Promise.all([
        obtenerResidentes(),
        obtenerPagosGC(),
        obtenerEgresos(),
        obtenerMantenciones()
    ]);
    residentes = residentesData || [];
    pagos = pagosData || [];
    egresos = egresosData || [];
    mantenciones = mantencionesData || [];
  } catch (e) {
    ocultarSpinner();
    mostrarMensaje('Error al cargar datos del dashboard: ' + e.message, 'error');
    return;
  }
  const activos = residentes.filter(r => r && r[7] === 'Activo').length;
  // ... (resto del código del dashboard sin cambios)
}
document.querySelector('[data-module="dashboard"]').addEventListener('click', cargarDashboard);
