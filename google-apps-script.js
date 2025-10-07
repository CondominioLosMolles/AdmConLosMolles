/**
 * CRM Condominio Los Molles - Google Apps Script
 * Sistema de administración integral para condominios
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Copia todo este código en un nuevo proyecto de Google Apps Script
 * 2. Actualiza la variable SPREADSHEET_ID con el ID de tu hoja de cálculo
 * 3. Despliega como Web App con permisos de "Cualquier persona"
 * 4. Copia la URL del Web App y configúrala en la aplicación React
 */

// ============================================================================
// CONFIGURACIÓN PRINCIPAL
// ============================================================================

// IMPORTANTE: Reemplaza este ID con el ID de tu hoja de cálculo de Google Sheets
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';

// Obtener la hoja de cálculo
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    console.error('Error al abrir la hoja de cálculo:', error);
    throw new Error('No se pudo acceder a la hoja de cálculo. Verifica el ID.');
  }
}

// ============================================================================
// FUNCIONES PRINCIPALES DE LA API
// ============================================================================

/**
 * Función principal para manejar peticiones GET
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'obtenerResidentes':
        return createResponse(obtenerResidentes());
      case 'obtenerPagosGC':
        return createResponse(obtenerPagosGC());
      case 'obtenerConvenios':
        return createResponse(obtenerConvenios());
      case 'obtenerCuotasConvenio':
        return createResponse(obtenerCuotasConvenio());
      case 'obtenerEgresos':
        return createResponse(obtenerEgresos());
      case 'obtenerIngresosExtra':
        return createResponse(obtenerIngresosExtra());
      case 'obtenerProveedores':
        return createResponse(obtenerProveedores());
      case 'obtenerCategoriasEgresos':
        return createResponse(obtenerCategoriasEgresos());
      case 'obtenerComunicaciones':
        return createResponse(obtenerComunicaciones());
      case 'obtenerTareas':
        return createResponse(obtenerTareas());
      case 'obtenerMultas':
        return createResponse(obtenerMultas());
      case 'obtenerAsambleas':
        return createResponse(obtenerAsambleas());
      case 'obtenerConfiguracion':
        return createResponse(obtenerConfiguracion());
      default:
        return createResponse({ status: 'ok', message: 'CRM Los Molles API funcionando correctamente' });
    }
  } catch (error) {
    console.error('Error en doGet:', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Función principal para manejar peticiones POST
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const functionName = data.functionName;
    const parameters = data.parameters || [];
    
    // Ejecutar la función solicitada
    const result = this[functionName].apply(this, parameters);
    
    return createResponse(result);
  } catch (error) {
    console.error('Error en doPost:', error);
    return createErrorResponse(error.message);
  }
}

/**
 * Crear respuesta exitosa
 */
function createResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*'
    });
}

/**
 * Crear respuesta de error
 */
function createErrorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*'
    });
}

// ============================================================================
// FUNCIONES DE RESIDENTES
// ============================================================================

/**
 * Obtener todos los residentes
 */
function obtenerResidentes() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Residentes');
    if (!sheet) throw new Error('Hoja "Residentes" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener residentes:', error);
    throw error;
  }
}

/**
 * Agregar nuevo residente
 */
function agregarResidente_GS(datosResidente) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Residentes');
    if (!sheet) throw new Error('Hoja "Residentes" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosResidente[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Residente agregado correctamente' };
  } catch (error) {
    console.error('Error al agregar residente:', error);
    throw error;
  }
}

/**
 * Actualizar residente existente
 */
function actualizarResidente_GS(datosResidente) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Residentes');
    if (!sheet) throw new Error('Hoja "Residentes" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const parcelaIndex = headers.indexOf('N_Parcela');
    
    if (parcelaIndex === -1) throw new Error('Columna N_Parcela no encontrada');
    
    // Buscar la fila del residente
    for (let i = 1; i < data.length; i++) {
      if (data[i][parcelaIndex] == datosResidente.N_Parcela) {
        // Actualizar la fila
        headers.forEach((header, index) => {
          if (datosResidente.hasOwnProperty(header)) {
            sheet.getRange(i + 1, index + 1).setValue(datosResidente[header]);
          }
        });
        return { success: true, message: 'Residente actualizado correctamente' };
      }
    }
    
    throw new Error('Residente no encontrado');
  } catch (error) {
    console.error('Error al actualizar residente:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE PAGOS GC
// ============================================================================

/**
 * Obtener todos los pagos de gastos comunes
 */
function obtenerPagosGC() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Pagos_GC');
    if (!sheet) throw new Error('Hoja "Pagos_GC" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener pagos GC:', error);
    throw error;
  }
}

/**
 * Agregar nuevo pago de gastos comunes
 */
function agregarPagoGC_GS(datosPago) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Pagos_GC');
    if (!sheet) throw new Error('Hoja "Pagos_GC" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosPago[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Pago registrado correctamente' };
  } catch (error) {
    console.error('Error al agregar pago GC:', error);
    throw error;
  }
}

/**
 * Actualizar pago existente
 */
function actualizarPagoGC_GS(datosPago) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Pagos_GC');
    if (!sheet) throw new Error('Hoja "Pagos_GC" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID_Pago');
    
    if (idIndex === -1) throw new Error('Columna ID_Pago no encontrada');
    
    // Buscar la fila del pago
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] == datosPago.ID_Pago) {
        // Actualizar la fila
        headers.forEach((header, index) => {
          if (datosPago.hasOwnProperty(header)) {
            sheet.getRange(i + 1, index + 1).setValue(datosPago[header]);
          }
        });
        return { success: true, message: 'Pago actualizado correctamente' };
      }
    }
    
    throw new Error('Pago no encontrado');
  } catch (error) {
    console.error('Error al actualizar pago GC:', error);
    throw error;
  }
}

/**
 * Obtener estado de cuenta de una parcela
 */
function obtenerEstadoDeCuenta(nParcela) {
  try {
    const sheetPagos = getSpreadsheet().getSheetByName('Pagos_GC');
    const sheetResidentes = getSpreadsheet().getSheetByName('Residentes');
    
    if (!sheetPagos || !sheetResidentes) {
      throw new Error('Hojas necesarias no encontradas');
    }
    
    // Obtener datos del residente
    const dataResidentes = sheetResidentes.getDataRange().getValues();
    const headersResidentes = dataResidentes[0];
    const residente = dataResidentes.slice(1).find(row => 
      row[headersResidentes.indexOf('N_Parcela')] == nParcela
    );
    
    if (!residente) throw new Error('Parcela no encontrada');
    
    // Obtener pagos de la parcela
    const dataPagos = sheetPagos.getDataRange().getValues();
    const headersPagos = dataPagos[0];
    const pagos = dataPagos.slice(1).filter(row => 
      row[headersPagos.indexOf('N_Parcela')] == nParcela
    );
    
    return {
      residente: Object.fromEntries(headersResidentes.map((h, i) => [h, residente[i]])),
      pagos: pagos.map(row => Object.fromEntries(headersPagos.map((h, i) => [h, row[i]])))
    };
  } catch (error) {
    console.error('Error al obtener estado de cuenta:', error);
    throw error;
  }
}

/**
 * Obtener resumen de deuda de una parcela
 */
function obtenerResumenDeuda(nParcela) {
  try {
    const estadoCuenta = obtenerEstadoDeCuenta(nParcela);
    const pagos = estadoCuenta.pagos;
    
    const totalPagado = pagos
      .filter(p => p.Estado === 'Pagado')
      .reduce((sum, p) => sum + (parseFloat(p.Monto_Pagado) || 0), 0);
    
    const totalPendiente = pagos
      .filter(p => p.Estado === 'Pendiente')
      .reduce((sum, p) => sum + (parseFloat(p.Monto_Pendiente) || 0), 0);
    
    return {
      parcela: nParcela,
      totalPagado: totalPagado,
      totalPendiente: totalPendiente,
      ultimoPago: pagos.length > 0 ? pagos[pagos.length - 1] : null
    };
  } catch (error) {
    console.error('Error al obtener resumen de deuda:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE CONVENIOS
// ============================================================================

/**
 * Obtener todos los convenios
 */
function obtenerConvenios() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Convenios');
    if (!sheet) throw new Error('Hoja "Convenios" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener convenios:', error);
    throw error;
  }
}

/**
 * Obtener cuotas de convenios
 */
function obtenerCuotasConvenio() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Cuotas_Convenio');
    if (!sheet) throw new Error('Hoja "Cuotas_Convenio" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener cuotas de convenio:', error);
    throw error;
  }
}

/**
 * Crear nuevo convenio
 */
function crearConvenio(datosConvenio) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Convenios');
    if (!sheet) throw new Error('Hoja "Convenios" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosConvenio[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Convenio creado correctamente' };
  } catch (error) {
    console.error('Error al crear convenio:', error);
    throw error;
  }
}

/**
 * Formalizar convenio
 */
function formalizarConvenio_GS(nParcela, urlConvenio) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Convenios');
    if (!sheet) throw new Error('Hoja "Convenios" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const parcelaIndex = headers.indexOf('N_Parcela');
    const estadoIndex = headers.indexOf('Estado');
    const urlIndex = headers.indexOf('URL_Convenio');
    
    // Buscar el convenio de la parcela
    for (let i = 1; i < data.length; i++) {
      if (data[i][parcelaIndex] == nParcela && data[i][estadoIndex] === 'Pendiente') {
        sheet.getRange(i + 1, estadoIndex + 1).setValue('Formalizado');
        if (urlIndex !== -1) {
          sheet.getRange(i + 1, urlIndex + 1).setValue(urlConvenio);
        }
        return { success: true, message: 'Convenio formalizado correctamente' };
      }
    }
    
    throw new Error('Convenio pendiente no encontrado para esta parcela');
  } catch (error) {
    console.error('Error al formalizar convenio:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE EGRESOS
// ============================================================================

/**
 * Obtener todos los egresos
 */
function obtenerEgresos() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Egresos');
    if (!sheet) throw new Error('Hoja "Egresos" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    throw error;
  }
}

/**
 * Agregar nuevo egreso
 */
function agregarEgreso_GS(datosEgreso) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Egresos');
    if (!sheet) throw new Error('Hoja "Egresos" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosEgreso[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Egreso registrado correctamente' };
  } catch (error) {
    console.error('Error al agregar egreso:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE INGRESOS EXTRA
// ============================================================================

/**
 * Obtener todos los ingresos extra
 */
function obtenerIngresosExtra() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Ingresos_Extra');
    if (!sheet) throw new Error('Hoja "Ingresos_Extra" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener ingresos extra:', error);
    throw error;
  }
}

/**
 * Agregar nuevo ingreso extra
 */
function agregarIngresoExtra_GS(datosIngreso) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Ingresos_Extra');
    if (!sheet) throw new Error('Hoja "Ingresos_Extra" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosIngreso[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Ingreso extra registrado correctamente' };
  } catch (error) {
    console.error('Error al agregar ingreso extra:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE PROVEEDORES
// ============================================================================

/**
 * Obtener todos los proveedores
 */
function obtenerProveedores() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Proveedores');
    if (!sheet) throw new Error('Hoja "Proveedores" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    throw error;
  }
}

/**
 * Agregar nuevo proveedor
 */
function agregarProveedor_GS(datosProveedor) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Proveedores');
    if (!sheet) throw new Error('Hoja "Proveedores" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosProveedor[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Proveedor agregado correctamente' };
  } catch (error) {
    console.error('Error al agregar proveedor:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE CATEGORÍAS DE EGRESOS
// ============================================================================

/**
 * Obtener todas las categorías de egresos
 */
function obtenerCategoriasEgresos() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Categorias_Egresos');
    if (!sheet) throw new Error('Hoja "Categorias_Egresos" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener categorías de egresos:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE COMUNICACIONES
// ============================================================================

/**
 * Obtener todas las comunicaciones
 */
function obtenerComunicaciones() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Comunicaciones');
    if (!sheet) throw new Error('Hoja "Comunicaciones" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener comunicaciones:', error);
    throw error;
  }
}

/**
 * Agregar nueva comunicación
 */
function agregarComunicacion_GS(datosComunicacion) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Comunicaciones');
    if (!sheet) throw new Error('Hoja "Comunicaciones" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosComunicacion[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Comunicación agregada correctamente' };
  } catch (error) {
    console.error('Error al agregar comunicación:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE TAREAS
// ============================================================================

/**
 * Obtener todas las tareas
 */
function obtenerTareas() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Tareas');
    if (!sheet) throw new Error('Hoja "Tareas" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    throw error;
  }
}

/**
 * Agregar nueva tarea
 */
function agregarTarea_GS(datosTarea) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Tareas');
    if (!sheet) throw new Error('Hoja "Tareas" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosTarea[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Tarea agregada correctamente' };
  } catch (error) {
    console.error('Error al agregar tarea:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE MULTAS
// ============================================================================

/**
 * Obtener todas las multas
 */
function obtenerMultas() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Multas');
    if (!sheet) throw new Error('Hoja "Multas" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener multas:', error);
    throw error;
  }
}

/**
 * Agregar nueva multa
 */
function agregarMulta_GS(datosMulta) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Multas');
    if (!sheet) throw new Error('Hoja "Multas" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosMulta[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Multa agregada correctamente' };
  } catch (error) {
    console.error('Error al agregar multa:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE ASAMBLEAS
// ============================================================================

/**
 * Obtener todas las asambleas
 */
function obtenerAsambleas() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Asambleas');
    if (!sheet) throw new Error('Hoja "Asambleas" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  } catch (error) {
    console.error('Error al obtener asambleas:', error);
    throw error;
  }
}

/**
 * Agregar nueva asamblea
 */
function agregarAsamblea_GS(datosAsamblea) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Asambleas');
    if (!sheet) throw new Error('Hoja "Asambleas" no encontrada');
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => datosAsamblea[header] || '');
    
    sheet.appendRow(newRow);
    
    return { success: true, message: 'Asamblea agregada correctamente' };
  } catch (error) {
    console.error('Error al agregar asamblea:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE CONFIGURACIÓN
// ============================================================================

/**
 * Obtener configuración
 */
function obtenerConfiguracion() {
  try {
    const sheet = getSpreadsheet().getSheetByName('Configuracion');
    if (!sheet) throw new Error('Hoja "Configuracion" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    const config = {};
    data.forEach(row => {
      if (row[0]) {
        config[row[0]] = row[1];
      }
    });
    return config;
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    throw error;
  }
}

/**
 * Actualizar configuración
 */
function actualizarConfiguracion_GS(nuevaConfig) {
  try {
    const sheet = getSpreadsheet().getSheetByName('Configuracion');
    if (!sheet) throw new Error('Hoja "Configuracion" no encontrada');
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      const key = data[i][0];
      if (nuevaConfig.hasOwnProperty(key)) {
        sheet.getRange(i + 1, 2).setValue(nuevaConfig[key]);
      }
    }
    
    return { success: true, message: 'Configuración actualizada correctamente' };
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    throw error;
  }
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Obtener la próxima ID para una hoja
 */
function getNextId(sheetName, idColumnName) {
  try {
    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) throw new Error(`Hoja "${sheetName}" no encontrada`);
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return 1; // No hay datos, empezar en 1
    
    const headers = data[0];
    const idIndex = headers.indexOf(idColumnName);
    if (idIndex === -1) throw new Error(`Columna "${idColumnName}" no encontrada`);
    
    const maxId = data.slice(1).reduce((max, row) => {
      const id = parseInt(row[idIndex], 10);
      return id > max ? id : max;
    }, 0);
    
    return maxId + 1;
  } catch (error) {
    console.error(`Error al obtener la próxima ID de ${sheetName}:`, error);
    throw error;
  }
}

