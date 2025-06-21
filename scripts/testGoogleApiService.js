import googleApiService from '../src/services/googleApiService.js'; // Ajusta la ruta si es necesario

const runTest = async () => {
  console.log("--- Iniciando Prueba de googleApiService ---");

  // 1. Leer Gastos Comunes
  console.log("\n[TEST] Leyendo Gastos Comunes Iniciales...");
  let gastosComunes = await googleApiService.getSheetData('gastosComunesSheet', 'Sheet1');
  console.log("Gastos Comunes Leídos:", gastosComunes.slice(0, 2)); // Mostrar solo los primeros 2 para brevedad

  // 2. Actualizar un Gasto Común (marcar como pagado)
  const gastoAActualizarId = 'gc002'; // Parcela A102, actualmente Pendiente
  console.log(`\n[TEST] Actualizando Gasto Común ID: ${gastoAActualizarId} a 'Pagado'`);
  const actualizacion = await googleApiService.updateSheetRow(
    'gastosComunesSheet',
    'Sheet1',
    'id_gasto',
    gastoAActualizarId,
    { estado_pago: 'Pagado', fecha_pago: new Date().toISOString().split('T')[0] }
  );
  console.log("Resultado de Actualización:", actualizacion);

  // Verificar la actualización
  gastosComunes = await googleApiService.getSheetData('gastosComunesSheet', 'Sheet1');
  const gastoActualizado = gastosComunes.find(g => g.id_gasto === gastoAActualizarId);
  console.log("Gasto Común Verificado Post-Actualización:", gastoActualizado);

  // 3. Añadir un nuevo Gasto Común
  const nuevoGasto = {
    id_gasto: `gc${Date.now()}`,
    parcela: 'C303',
    mes: 'Julio',
    anio: 2024,
    monto: 60000,
    estado_pago: 'Pendiente',
    fecha_pago: null,
    id_residente: 'residente_nuevo_test'
  };
  console.log("\n[TEST] Añadiendo Nuevo Gasto Común:", nuevoGasto);
  const resultadoAppend = await googleApiService.appendSheetRow('gastosComunesSheet', 'Sheet1', nuevoGasto);
  console.log("Resultado de Añadir Fila:", resultadoAppend);

  gastosComunes = await googleApiService.getSheetData('gastosComunesSheet', 'Sheet1');
  console.log("Total de Gastos Comunes después de añadir:", gastosComunes.length);
  console.log("Último Gasto Añadido:", gastosComunes[gastosComunes.length -1]);

  // 4. Simular subida de archivo a Drive
  const archivoASubir = {
    uri: 'file:///path/to/fake/invoice.pdf', // En RN sería una URI de archivo real
    name: 'comprobante_pago_A101_julio.pdf',
    type: 'application/pdf'
  };
  console.log(`\n[TEST] Subiendo archivo a Drive: ${archivoASubir.name}`);
  const resultadoUpload = await googleApiService.uploadFileToDrive(archivoASubir, 'gastosPagadosFolderId'); // Carpeta simulada
  console.log("Resultado de Subida a Drive:", resultadoUpload);

  // 5. Simular obtención de archivo de Drive
  if (resultadoUpload.success && resultadoUpload.fileId) {
    console.log(`\n[TEST] Obteniendo archivo de Drive ID: ${resultadoUpload.fileId}`);
    const resultadoGetFile = await googleApiService.getFileFromDrive(resultadoUpload.fileId);
    console.log("Resultado de Obtención de Drive:", {success: resultadoGetFile.success, fileName: resultadoGetFile.file?.name});
  }

  // 6. Leer Residentes
  console.log("\n[TEST] Leyendo Residentes...");
  let residentes = await googleApiService.getSheetData('residentesSheet', 'Sheet1');
  console.log("Residentes Leídos:", residentes.slice(0, 2));


  console.log("\n--- Prueba de googleApiService Completada ---");
};

runTest().catch(error => {
  console.error("Error en la prueba:", error);
});
