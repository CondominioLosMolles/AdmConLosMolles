import googleApiService from './googleApiService';
import { ESTADOS_PAGO } from '../models/GastoComun';

/**
 * Servicio de Pagos (Simulado).
 * Encapsula la lógica para procesar pagos simulados y actualizar el estado en Google Sheets.
 */
const paymentService = {
  /**
   * Simula el procesamiento de un pago de gasto común.
   * @param {string} idGasto - El ID del gasto a pagar.
   * @param {number} montoPagado - El monto que se está pagando.
   * @param {string} metodoPagoSimulado - Método de pago seleccionado por el usuario.
   * @param {string} [referenciaPagoSimulada] - Referencia de pago ingresada.
   * @param {string} idResidente - ID del residente que realiza el pago.
   * @returns {Promise<{success: boolean, message: string, updatedGasto?: Object}>}
   */
  procesarPagoGastoComun: async (idGasto, montoPagado, metodoPagoSimulado, referenciaPagoSimulada, idResidente) => {
    console.log(`[PaymentService SIM] Procesando pago para Gasto ID: ${idGasto}`);

    // Simular demora de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const fechaPagoActual = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const updatedValues = {
        estado_pago: ESTADOS_PAGO.PAGADO,
        fecha_pago: fechaPagoActual,
        metodo_pago: metodoPagoSimulado,
        // monto_pagado: montoPagado, // Si tuviéramos un campo para el monto exacto pagado
      };
      if (referenciaPagoSimulada) {
        updatedValues.referencia_pago = referenciaPagoSimulada;
      }

      const resultadoUpdate = await googleApiService.updateSheetRow(
        'gastosComunesSheet', // ID de la hoja de gastos comunes desde appConfig o directo
        'Sheet1',
        'id_gasto', // Campo clave para encontrar la fila
        idGasto,
        updatedValues
      );

      if (resultadoUpdate.success && resultadoUpdate.updatedRow) {
        console.log('[PaymentService SIM] Pago procesado y gasto actualizado en Sheets:', resultadoUpdate.updatedRow);

        // ¡NUEVO! Enviar notificación de pago recepcionado
        // Necesitamos el nombre del residente. Asumimos que lo podemos obtener o lo pasamos como parámetro.
        // Para esta simulación, si el `updatedRow` tiene `id_residente`, podríamos buscarlo.
        // O, más simple, la función que llama a `procesarPagoGastoComun` (desde la UI) ya tiene el `user` y puede pasar `user.nombre`.
        // Por ahora, para no complicar la firma de `procesarPagoGastoComun` innecesariamente en este punto:
        // lo ideal sería que `idResidente` permita buscar el nombre, o que el servicio de pago no se preocupe de esto
        // y la notificación se dispare desde la capa de la UI/ViewModel que sí tiene el contexto completo.
        // Pero para la demo, lo haré aquí con un nombre genérico o si el objeto lo tiene.

        // Este import sería necesario si se usa aquí:
        // import { simularNotificacionPagoRecepcionado } from '../../scripts/testNotificationService.js';
        // Sin embargo, para evitar dependencias circulares o de scripts en servicios,
        // es mejor que notificationService sea llamado desde el flujo que tiene la info del usuario.
        // Por ahora, solo un log y asumimos que la capa superior lo haría.
        // El script testNotificationService.js ya tiene la función simularNotificacionPagoRecepcionado
        // que puede ser llamada desde el UI Layer (ej. GastosComunesScreen) después de un pago exitoso.

        // Para este ejercicio, lo pondré directamente aquí para demostrar la llamada.
        // En una app real, esto podría ser un evento/callback o una llamada desde la UI.
        const { simularNotificacionPagoRecepcionado } = await import('../../scripts/testNotificationService.js');
        // Necesitaríamos el nombre del residente. El `idResidente` se pasa a la función.
        // Para una mejor simulación, buscaremos el nombre del residente.
        let nombreResidenteParaNotif = "Residente";
        try {
            const residentes = await googleApiService.getSheetData('residentesSheet', 'Sheet1');
            const residenteInfo = residentes.find(r => r.id_residente === idResidente);
            if (residenteInfo) nombreResidenteParaNotif = residenteInfo.nombre;
        } catch (e) { console.error("Error buscando nombre de residente para notif", e)}

        simularNotificacionPagoRecepcionado(
            idResidente,
            nombreResidenteParaNotif,
            resultadoUpdate.updatedRow.mes,
            parseFloat(resultadoUpdate.updatedRow.monto)
        );

        return {
          success: true,
          message: 'Pago procesado exitosamente.',
          updatedGasto: resultadoUpdate.updatedRow
        };
      } else {
        console.error('[PaymentService SIM] Error al actualizar el gasto en Sheets después del pago.');
        return { success: false, message: 'Error al registrar el pago. Intente nuevamente.' };
      }
    } catch (error) {
      console.error('[PaymentService SIM] Error catastrófico durante el procesamiento del pago:', error);
      return { success: false, message: 'Ocurrió un error inesperado al procesar el pago.' };
    }
  },

  /**
   * Simula la subida de un comprobante a Google Drive y actualiza el gasto común.
   * @param {string} idGasto - El ID del gasto al que pertenece el comprobante.
   * @param {object} fileDataMock - Datos simulados del archivo (name, type).
   * @returns {Promise<{success: boolean, message: string, fileId?: string, updatedGasto?: Object}>}
   */
  subirComprobantePago: async (idGasto, fileDataMock = { name: `comprobante_${idGasto}.pdf`, type: 'application/pdf' }) => {
    console.log(`[PaymentService SIM] Subiendo comprobante para Gasto ID: ${idGasto}`);

    // Simular demora de subida
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // 1. Subir archivo simulado a Drive
      // En una app real, fileDataMock vendría de un File Picker (ej. react-native-document-picker)
      const uploadResult = await googleApiService.uploadFileToDrive(
        fileDataMock,
        'comprobantesPagosFolderId' // Un ID de carpeta simulado o de appConfig
      );

      if (!uploadResult.success || !uploadResult.fileId) {
        console.error('[PaymentService SIM] Error al subir el comprobante a Google Drive.');
        return { success: false, message: 'Error al subir el comprobante a Google Drive.' };
      }

      // 2. Actualizar el gasto común con el ID del archivo de Drive
      const updatedValues = {
        comprobante_drive_id: uploadResult.fileId,
      };

      const resultadoUpdateGasto = await googleApiService.updateSheetRow(
        'gastosComunesSheet',
        'Sheet1',
        'id_gasto',
        idGasto,
        updatedValues
      );

      if (resultadoUpdateGasto.success && resultadoUpdateGasto.updatedRow) {
        console.log('[PaymentService SIM] Comprobante subido y gasto actualizado:', resultadoUpdateGasto.updatedRow);
        return {
          success: true,
          message: 'Comprobante subido exitosamente.',
          fileId: uploadResult.fileId,
          updatedGasto: resultadoUpdateGasto.updatedRow
        };
      } else {
        // Podríamos intentar eliminar el archivo de Drive si la actualización del sheet falla (rollback)
        console.error('[PaymentService SIM] Error al actualizar el gasto con el ID del comprobante.');
        return { success: false, message: 'Error al asociar el comprobante con el gasto.' };
      }
    } catch (error) {
      console.error('[PaymentService SIM] Error catastrófico durante la subida del comprobante:', error);
      return { success: false, message: 'Ocurrió un error inesperado al subir el comprobante.' };
    }
  }
};

export default paymentService;
