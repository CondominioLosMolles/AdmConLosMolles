/**
 * @typedef {Object} Requerimiento
 * @property {string} id_requerimiento - Identificador único del requerimiento (ej. UUID o generado por Sheets)
 * @property {string} id_residente - ID del residente que crea el requerimiento
 * @property {string} parcela_residente - Parcela del residente que crea el requerimiento
 * @property {string} asunto - Asunto breve del requerimiento
 * @property {string} descripcion - Descripción detallada del requerimiento (texto libre)
 * @property {'Solicitud' | 'Sugerencia' | 'Reclamo' | 'Otro'} tipo_requerimiento - Tipo de requerimiento
 * @property {Date | string} fecha_creacion - Fecha y hora de creación (preferiblemente timestamp ISO 8601)
 * @property {'Abierto' | 'En Proceso' | 'Esperando Respuesta Residente' | 'Resuelto' | 'Cerrado'} estado - Estado actual del requerimiento
 * @property {'Baja' | 'Media' | 'Alta' | 'Urgente'} [prioridad_admin] - Prioridad asignada por el administrador (opcional)
 * @property {string} [id_admin_asignado] - ID del administrador asignado para gestionar el requerimiento (opcional)
 * @property {Array<ArchivoAdjuntoRequerimiento>} [adjuntos] - Array de archivos adjuntos
 * @property {Array<ComentarioRequerimiento>} [historial_actualizaciones] - Historial de comentarios y cambios de estado
 * @property {Date | string} [fecha_ultima_actualizacion] - Fecha de la última actualización o comentario
 * @property {Date | string} [fecha_resolucion] - Fecha en que se resolvió/cerró el requerimiento (opcional)
 */

/**
 * @typedef {Object} ArchivoAdjuntoRequerimiento
 * @property {string} id_adjunto - Identificador único del adjunto
 * @property {string} nombre_archivo - Nombre original del archivo
 * @property {string} tipo_mime - Tipo MIME del archivo (ej. 'image/jpeg', 'application/pdf')
 * @property {number} [tamano_bytes] - Tamaño del archivo en bytes (opcional)
 * @property {string} drive_file_id - ID del archivo almacenado en Google Drive
 * @property {Date | string} fecha_subida - Fecha de subida del archivo
 */

/**
 * @typedef {Object} ComentarioRequerimiento
 * @property {string} id_comentario - Identificador único del comentario
 * @property {string} id_usuario - ID del usuario que hizo el comentario (residente o admin)
 * @property {'residente' | 'administrador'} rol_usuario - Rol del usuario que comenta
 * @property {string} comentario - Texto del comentario
 * @property {Date | string} fecha_comentario - Fecha y hora del comentario
 * @property {string} [cambio_estado_a] - Si este comentario resultó en un cambio de estado, el nuevo estado (opcional)
 */

export const TIPOS_REQUERIMIENTO = {
  SOLICITUD: 'Solicitud',
  SUGERENCIA: 'Sugerencia',
  RECLAMO: 'Reclamo',
  OTRO: 'Otro',
};

export const ESTADOS_REQUERIMIENTO = {
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En Proceso',
  ESPERANDO_RESPUESTA: 'Esperando Respuesta Residente',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};

// Este archivo principalmente sirve como documentación de la estructura del objeto Requerimiento.
