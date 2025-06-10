/**
 * Módulo de Gastos Comunes (VERSIÓN DE DIAGNÓSTICO)
 * Este archivo es solo para probar la conexión con la hoja "Gastos_Comunes".
 */

async function initGastoscomunesModule(container) {
    console.log("🚀 INICIANDO PRUEBA DE GASTOS COMUNES...");
    container.innerHTML = `
        <div class="p-4">
            <h2>Prueba de Carga: Módulo Gastos Comunes</h2>
            <p>A continuación se muestra el resultado del intento de leer los datos de tu hoja de cálculo.</p>
            <div id="debug-output" class="alert alert-info"><strong>Estado:</strong> Esperando resultado de la API de Google...</div>
        </div>
    `;

    const debugOutput = document.getElementById('debug-output');

    try {
        console.log("Paso 1: Llamando a sheetsAPI.getSheetData para la hoja definida en CONFIG.SHEETS.GASTOS_COMUNES...");
        const rawData = await sheetsAPI.getSheetData(CONFIG.SHEETS.GASTOS_COMUNES);

        console.log("Paso 2: La llamada a la API ha finalizado. El resultado recibido es:", rawData);

        // Verificamos si lo que recibimos es una lista (array)
        if (Array.isArray(rawData)) {
            console.log("✅ ÉXITO: Se recibió una lista (array).");
            debugOutput.className = "alert alert-success"; // Cambiamos el color a verde
            debugOutput.innerHTML = `
                <h4><i class="fas fa-check-circle"></i> ¡Prueba Exitosa!</h4>
                <p>Se estableció la conexión y se recibió una lista de datos de la hoja "Gastos_Comunes".</p>
                <hr>
                <p class="mb-0"><strong>Número de filas de datos encontradas:</strong> ${rawData.length}</p>
            `;
        } else {
            // Si no es una lista, es un error.
            console.error("❌ FALLO: No se recibió una lista (array). Se recibió:", typeof rawData, rawData);
            debugOutput.className = "alert alert-danger"; // Cambiamos el color a rojo
            debugOutput.innerHTML = `
                <h4><i class="fas fa-times-circle"></i> Prueba Fallida</h4>
                <p>La aplicación no pudo leer los datos porque no recibió una lista válida de la API.</p>
                <hr>
                <p><strong>Dato recibido:</strong> ${typeof rawData} (valor: <code>${JSON.stringify(rawData)}</code>)</p>
                <p class="mb-0 mt-3"><strong>Causa Más Común:</strong> El nombre de la hoja en tu archivo <code>config.js</code> (<code>GASTOS_COMUNES: '${CONFIG.SHEETS.GASTOS_COMUNES}'</code>) no coincide <strong>exactamente</strong> con el nombre de la pestaña en tu documento de Google Sheets.</p>
            `;
        }

    } catch (error) {
        console.error("❌ ERROR CATASTRÓFICO: La función getSheetData lanzó una excepción.", error);
        debugOutput.className = "alert alert-danger";
        debugOutput.innerHTML = `<h4><i class="fas fa-exclamation-triangle"></i> Error Fatal</h4> <p>Ocurrió un error inesperado al intentar leer los datos. Revisa la consola para más detalles.</p>`;
        showDetailedError("Error en prueba de Gastos Comunes", error, container);
    }
}
