/**
 * CondoAdmin - Módulo de Dashboard (Versión de Prueba Simplificada)
 * Su único propósito es verificar que el archivo se carga y ejecuta.
 */

async function initDashboardModule(container) {
    console.log("🚀 Ejecutando versión de prueba de Dashboard...");

    try {
        // Esta versión no intenta leer datos de Google Sheets.
        // Simplemente dibuja una tarjeta de prueba en el HTML.
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Dashboard</h2>
            </div>
            <div class="card shadow-sm">
                <div class="card-body">
                    <h4 class="card-title text-success">¡Prueba Exitosa!</h4>
                    <p>Si estás viendo este mensaje, significa que los archivos principales (index.html, app.js, ui-controller.js) y este archivo (dashboard.js) están conectados y funcionando correctamente.</p>
                    <hr>
                    <p class="mb-0">El siguiente paso será reconectar este módulo a tus datos de Google Sheets para mostrar las estadísticas reales.</p>
                </div>
            </div>
        `;
        console.log("✅ Prueba de Dashboard renderizada.");

    } catch (error) {
        console.error("❌ Error incluso en la versión de prueba de Dashboard:", error);
        showDetailedError("Error en Dashboard (Prueba)", error, container);
    }
}
