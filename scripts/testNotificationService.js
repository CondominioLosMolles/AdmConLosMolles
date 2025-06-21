import notificationService from '../src/services/notificationService.js';
import appConfig from '../src/config/appConfig.js'; // Para los channel IDs

// Simular que la app se ha iniciado y los servicios configurados
const initializeAppSim = () => {
  notificationService.configure();
  // En una app real, los canales se crean una vez. Aquí para asegurar que existen en la simulación.
  notificationService.createNotificationChannels();
  console.log("App y NotificationService simulados como inicializados.");
};

// --- Simulación de Notificaciones Automáticas ---

/**
 * Simula el envío del recordatorio de pago del día 25.
 * @param {string} [nombreResidente="Estimado Residente"] - Nombre para personalizar.
 * @param {string} [mesGastoComun="Agosto"] - Mes del gasto común a recordar.
 */
const simularRecordatorioPagoDia25 = (nombreResidente = "Estimado Residente", mesGastoComun = "Agosto") => {
  initializeAppSim(); // Asegurar que está configurado
  const titulo = "Recordatorio de Gastos Comunes";
  const mensaje = `${nombreResidente}, te recordamos que el gasto común del mes de ${mesGastoComun} estará disponible para pago próximamente.`;

  console.log(`\n[SIM TEST] Disparando Recordatorio de Pago (Día 25) para ${mesGastoComun}...`);
  notificationService.showLocalNotification(
    titulo,
    mensaje,
    { type: 'recordatorio_pago', mes: mesGastoComun },
    appConfig.NOTIFICATION_CHANNELS_ANDROID.REMINDERS.id // Usar el channel ID correcto
  );
};

/**
 * Simula el envío de la notificación de vencimiento de pago del día 11.
 * @param {string} [nombreResidente="Estimado Residente"] - Nombre para personalizar.
 * @param {string} [mesVencido="Julio"] - Mes del gasto común vencido.
 */
const simularVencimientoPagoDia11 = (nombreResidente = "Estimado Residente", mesVencido = "Julio") => {
  initializeAppSim();
  const titulo = "Alerta de Vencimiento de Gastos Comunes";
  const mensaje = `${nombreResidente}, te informamos que el pago de tus gastos comunes del mes de ${mesVencido} se encuentra vencido. Por favor, regulariza tu situación.`;

  console.log(`\n[SIM TEST] Disparando Notificación de Vencimiento (Día 11) para ${mesVencido}...`);
  notificationService.showLocalNotification(
    titulo,
    mensaje,
    { type: 'vencimiento_pago', mes: mesVencido },
    appConfig.NOTIFICATION_CHANNELS_ANDROID.REMINDERS.id
  );
};


// --- Simulación de Notificaciones por Acción (se llamarán desde otros servicios) ---

/**
 * Simula el envío de notificación de pago recepcionado.
 * Esta función sería llamada por paymentService o una función de admin.
 * @param {string} idResidente - A quién notificar (en un sistema real).
 * @param {string} nombreResidente - Nombre del residente.
 * @param {string} mesPagado - Mes del gasto común pagado.
 * @param {number} montoPagado - Monto pagado.
 */
export const simularNotificacionPagoRecepcionado = (idResidente, nombreResidente, mesPagado, montoPagado) => {
  // No se llama a initializeAppSim() aquí, se asume que la app ya corre.
  const titulo = "Pago de Gastos Comunes Recepcionado";
  const mensaje = `Hola ${nombreResidente}, hemos recepcionado tu pago de $${montoPagado.toLocaleString('es-CL')} correspondiente a los gastos comunes de ${mesPagado}. ¡Gracias!`;

  console.log(`\n[SIM NOTIFY] Enviando Notificación de Pago Recepcionado a ${nombreResidente} para ${mesPagado}...`);
  notificationService.showLocalNotification(
    titulo,
    mensaje,
    { type: 'pago_recepcionado', idResidente: idResidente, mes: mesPagado, monto: montoPagado },
    appConfig.NOTIFICATION_CHANNELS_ANDROID.GENERAL.id
  );
};

/**
 * Simula el envío de notificación de nueva citación a asamblea.
 * @param {string} idResidente - (Opcional) Para notificar a un residente específico o a todos.
 * @param {string} temaAsamblea - Tema de la asamblea.
 * @param {string} fechaAsamblea - Fecha de la asamblea.
 */
export const simularNotificacionNuevaAsamblea = (idResidente = null, temaAsamblea, fechaAsamblea) => {
  const titulo = "Nueva Citación a Asamblea";
  const mensaje = `Se ha citado a una nueva asamblea.\nTema: ${temaAsamblea}\nFecha: ${fechaAsamblea}.`;

  console.log(`\n[SIM NOTIFY] Enviando Notificación de Nueva Asamblea (${temaAsamblea})...`);
  notificationService.showLocalNotification(
    titulo,
    mensaje,
    { type: 'nueva_asamblea', tema: temaAsamblea, fecha: fechaAsamblea, targetUser: idResidente || 'todos' },
    appConfig.NOTIFICATION_CHANNELS_ANDROID.GENERAL.id
  );
};

/**
 * Simula el envío de notificación de un nuevo comunicado general.
 * @param {string} tituloComunicado - Título del comunicado.
 */
export const simularNotificacionNuevoComunicado = (tituloComunicado) => {
  const titulo = "Nuevo Comunicado de la Administración";
  const mensaje = `Hay un nuevo comunicado disponible: "${tituloComunicado}". Revísalo en la app.`;

  console.log(`\n[SIM NOTIFY] Enviando Notificación de Nuevo Comunicado (${tituloComunicado})...`);
  notificationService.showLocalNotification(
    titulo,
    mensaje,
    { type: 'nuevo_comunicado', tituloComunicado: tituloComunicado },
    appConfig.NOTIFICATION_CHANNELS_ANDROID.GENERAL.id
  );
};


// Para ejecutar pruebas desde la línea de comandos (simulado):
const runTests = () => {
  console.log("--- Iniciando Pruebas de NotificationService (Simuladas) ---");

  simularRecordatorioPagoDia25("Juan Pérez", "Septiembre");
  simularVencimientoPagoDia11("Ana López", "Agosto");

  // Estas se llamarían desde otros flujos:
  // simularNotificacionPagoRecepcionado('residente1', "Juan Pérez", "Julio", 50000);
  // simularNotificacionNuevaAsamblea(null, "Presupuesto Anual 2025", "2024-12-15 19:00");
  // simularNotificacionNuevoComunicado("Corte de Agua Programado");

  console.log("\n--- Pruebas de NotificationService Completadas ---");
};

// Si este script se ejecuta directamente (ej. node testNotificationService.js)
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
