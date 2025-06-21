/**
 * Configuración de la Aplicación.
 * Aquí se almacenarán IDs de Google Sheets, claves de API (si no se manejan por variables de entorno),
 * y otras configuraciones globales.
 *
 * IMPORTANTE: Para claves sensibles, usar variables de entorno en un build real
 * y no commitear claves directamente al repositorio.
 * Para este proyecto simulado, podemos poner placeholders.
 */

const APP_VERSION = '1.0.0'; // Versión actual de la app, podría usarse para OTA.

const GOOGLE_API_CONFIG = {
  // En una app real, estos serían los IDs de tus hojas de cálculo en Google Drive.
  gastosComunesSheetId: 'SIMULATED_GASTOS_COMUNES_SHEET_ID',
  residentesSheetId: 'SIMULATED_RESIDENTES_SHEET_ID',
  requerimientosSheetId: 'SIMULATED_REQUERIMIENTOS_SHEET_ID',
  asambleasSheetId: 'SIMULATED_ASAMBLEAS_SHEET_ID',
  // ...otros IDs de hojas de cálculo

  // ID de la carpeta raíz en Google Drive donde la app almacenará archivos (si aplica)
  googleDriveAppFolderId: 'SIMULATED_APP_ROOT_FOLDER_ID',
};

const OTA_CONFIG = {
  // URL donde se verifica la versión más reciente para OTA (ej. un JSON en Google Drive o un endpoint de API)
  versionCheckUrl: 'SIMULATED_OTA_VERSION_CHECK_URL',
};

const PAYMENT_GATEWAY_CONFIG = {
  // Configuración para la pasarela de pago (ej. claves publicables)
  // apiKey: 'SIMULATED_PAYMENT_API_KEY',
  // endpoint: 'SIMULATED_PAYMENT_ENDPOINT',
};

const SOS_CONFIG = {
    // Configuraciones para la funcionalidad SOS, si se necesitan (ej. mensaje predeterminado)
};

const NOTIFICATION_CHANNELS_ANDROID = {
  GENERAL: {
    id: 'condoapp-general-channel',
    name: 'Notificaciones Generales',
    description: 'Información general y actualizaciones de la app.',
    importance: 4, // High
  },
  REMINDERS: {
    id: 'condoapp-reminders-channel',
    name: 'Recordatorios',
    description: 'Recordatorios de pagos y eventos.',
    importance: 4, // High
  },
  SOS: {
    id: 'condoapp-sos-channel',
    name: 'Alertas SOS',
    description: 'Notificaciones de emergencia SOS.',
    soundName: 'sos_alarm.mp3', // Sonido personalizado (requiere añadirlo a la app nativa)
    importance: 5, // Max
    vibrate: true,
    vibrationPattern: [1000, 1000, 1000, 1000, 1000], // Patrón de vibración largo
  },
  CHAT: {
    id: 'condoapp-chat-channel',
    name: 'Mensajes de Chat',
    description: 'Notificaciones de nuevos mensajes en el chat.',
    importance: 4, // High
  }
};


const appConfig = {
  APP_VERSION,
  GOOGLE_API_CONFIG,
  OTA_CONFIG,
  PAYMENT_GATEWAY_CONFIG,
  SOS_CONFIG,
  NOTIFICATION_CHANNELS_ANDROID,
  // Podría incluir también configuraciones de entorno (development, staging, production)
  // ENVIRONMENT: 'development', // o process.env.NODE_ENV
};

export default appConfig;
