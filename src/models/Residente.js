/**
 * @typedef {Object} Residente
 * @property {string} id_residente - Identificador único del residente (ej. 'residente1')
 * @property {string} nombre - Nombre completo del residente
 * @property {string} email - Email del residente
 * @property {string} parcela - Número/código de la parcela asignada
 * @property {string} rol - 'residente' o 'administrador'
 * @property {string} [password_hash] - Hash de la contraseña (solo para referencia, no enviar al cliente)
 * @property {string} [telefono] - Teléfono de contacto (opcional)
 * @property {string} [push_token] - Token para notificaciones push
 * @property {Date} [fecha_registro] - Fecha de registro
 */

// Este archivo principalmente sirve como documentación de la estructura del objeto Residente.
// En un proyecto con TypeScript, esto sería una interface o type.
// Podría también exportar funciones de utilidad relacionadas con Residente si fuera necesario.

export const ROLES = {
  RESIDENTE: 'residente',
  ADMINISTRADOR: 'administrador',
};
