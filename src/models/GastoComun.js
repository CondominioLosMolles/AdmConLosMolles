/**
 * @typedef {Object} GastoComun
 * @property {string} id_gasto - Identificador único del gasto (ej. 'gc001')
 * @property {string} id_residente - ID del residente asociado (obtenido de la parcela)
 * @property {string} parcela - Parcela asociada al gasto
 * @property {string} mes - Mes del gasto (ej. 'Julio', 'Agosto')
 * @property {number} anio - Año del gasto (ej. 2024)
 * @property {number} monto - Monto total del gasto en la moneda local (ej. CLP)
 * @property {'Pendiente' | 'Pagado' | 'Atrasado' | 'Anulado'} estado_pago - Estado del pago
 * @property {string} [fecha_emision] - Fecha de emisión del cobro (ISO 8601 YYYY-MM-DD)
 * @property {string} fecha_vencimiento - Fecha de vencimiento del pago (ISO 8601 YYYY-MM-DD)
 * @property {string} [fecha_pago] - Fecha en que se registró el pago (ISO 8601 YYYY-MM-DD), si está pagado
 * @property {string} [metodo_pago] - Método de pago utilizado (ej. 'Transferencia', 'WebPay')
 * @property {string} [referencia_pago] - Referencia o número de transacción del pago
 * @property {Array<DetalleGasto>} [detalles] - (Opcional) Detalle de los ítems que componen el gasto común
 * @property {string} [comprobante_drive_id] - ID del archivo de comprobante de pago subido por el residente a Google Drive
 * @property {string} [observaciones_admin] - Observaciones del administrador sobre este gasto/pago
 * @property {Date} [timestamp_creacion] - Timestamp de creación del registro en el sistema
 * @property {Date} [timestamp_ultima_modificacion] - Timestamp de la última modificación
 */

/**
 * @typedef {Object} DetalleGasto
 * @property {string} id_detalle - Identificador único del detalle
 * @property {string} descripcion - Descripción del ítem (ej. 'Mantención Jardines', 'Consumo Agua')
 * @property {number} monto_detalle - Monto del ítem específico
 */

export const ESTADOS_PAGO = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ATRASADO: 'Atrasado',
  ANULADO: 'Anulado',
};

// Este archivo principalmente sirve como documentación de la estructura del objeto GastoComun.
// Podría también exportar funciones de utilidad relacionadas con GastoComun.
