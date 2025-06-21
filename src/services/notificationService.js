// import PushNotification from 'react-native-push-notification'; // Librería popular para notificaciones locales y push
// import PushNotificationIOS from '@react-native-community/push-notification-ios'; // Para configuración específica de iOS
// import messaging from '@react-native-firebase/messaging'; // Para Firebase Cloud Messaging (FCM)

/**
 * Servicio de Notificaciones.
 * Encapsula la lógica para configurar, solicitar permisos,
 * manejar notificaciones locales y remotas (push).
 */
const notificationService = {
  /**
   * Configura el manejador de notificaciones.
   * Se debe llamar al inicio de la aplicación.
   */
  configure: () => {
    console.log('[NotificationService SIM] Configurando servicio de notificaciones...');
    // Ejemplo con react-native-push-notification (requiere instalación y configuración nativa)
    // PushNotification.configure({
    //   onRegister: function (token) {
    //     console.log('[NotificationService] TOKEN FCM:', token);
    //     // Aquí se enviaría el token al backend para asociarlo con el usuario
    //   },
    //   onNotification: function (notification) {
    //     console.log('[NotificationService] NOTIFICACIÓN RECIBIDA:', notification);
    //     // Lógica para manejar la notificación cuando la app está en foreground
    //     // o cuando se abre desde una notificación.
    //
    //     // Ejemplo: si es una notificación de chat, navegar al chat.
    //     // if (notification.data && notification.data.type === 'chat_message') {
    //     //   navigationService.navigate('ChatScreen', { chatId: notification.data.chatId });
    //     // }
    //
    //     // Requerido en iOS para completar la recepción de la notificación.
    //     // notification.finish(PushNotificationIOS.FetchResult.NoData);
    //   },
    //   onAction: function (notification) {
    //     console.log("[NotificationService] ACTION:", notification.action);
    //     console.log("[NotificationService] NOTIFICATION:", notification);
    //     // Procesar acciones de notificación
    //   },
    //   onRegistrationError: function(err) {
    //     console.error("[NotificationService] Registration error:", err.message, err);
    //   },
    //   permissions: {
    //     alert: true,
    //     badge: true,
    //     sound: true,
    //   },
    //   popInitialNotification: true, // Procesar la notificación que abrió la app
    //   requestPermissions: true,     // Solicitar permisos en iOS al inicio
    // });
    console.log('[NotificationService SIM] Configuración simulada completa.');
  },

  /**
   * Solicita permisos para notificaciones (principalmente para iOS, en Android son por defecto > API 26).
   */
  requestPermissions: async () => {
    console.log('[NotificationService SIM] Solicitando permisos de notificación...');
    // try {
    //   if (Platform.OS === 'ios') {
    //     const authStatus = await messaging().requestPermission();
    //     const enabled =
    //       authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    //       authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    //     console.log('[NotificationService] Permiso FCM iOS:', enabled ? 'Concedido' : 'Denegado');
    //     return enabled;
    //   } else {
    //     // En Android, los permisos suelen estar concedidos por defecto.
    //     // PushNotification.requestPermissions(); // Para react-native-push-notification
    //     console.log('[NotificationService SIM] Permisos Android asumidos como concedidos.');
    //     return true;
    //   }
    // } catch (error) {
    //   console.error('[NotificationService SIM] Error solicitando permisos:', error);
    //   return false;
    // }
    return Promise.resolve(true); // Simulación
  },

  /**
   * Muestra una notificación local inmediata.
   * @param {string} title - Título de la notificación.
   * @param {string} message - Mensaje de la notificación.
   * @param {object} [data={}] - Datos adicionales para la notificación.
   * @param {string} [channelId='default-channel-id'] - ID del canal (Android).
   */
  showLocalNotification: (title, message, data = {}, channelId = 'default-channel-id') => {
    console.log(`[NotificationService SIM] Mostrando notificación local: "${title} - ${message}"`, data);
    // PushNotification.localNotification({
    //   channelId: channelId, // Requerido para Android 8.0+
    //   title: title,
    //   message: message,
    //   userInfo: data, // datos para iOS
    //   data: data,     // datos para Android
    //   playSound: true,
    //   soundName: 'default',
    //   importance: 'high', // (optional) set notification importance, default: high
    //   vibrate: true,      // (optional) set vibration on notification, default: true
    //   vibration: 300,     // vibration length in milliseconds, default: 1000
    // });
  },

  /**
   * Programa una notificación local para una fecha futura.
   * @param {string} title - Título de la notificación.
   * @param {string} message - Mensaje de la notificación.
   * @param {Date} date - Fecha y hora para mostrar la notificación.
   * @param {object} [data={}] - Datos adicionales.
   * @param {string} [channelId='default-channel-id'] - ID del canal (Android).
   */
  scheduleLocalNotification: (title, message, date, data = {}, channelId = 'default-channel-id') => {
    console.log(`[NotificationService SIM] Programando notificación local para ${date}: "${title} - ${message}"`, data);
    // PushNotification.localNotificationSchedule({
    //   channelId: channelId,
    //   title: title,
    //   message: message,
    //   date: date, // new Date(Date.now() + 5 * 1000) para 5 segundos en el futuro
    //   userInfo: data,
    //   data: data,
    //   allowWhileIdle: true, // (optional) set notification to work while on doze, default: false
    // });
  },

  /**
   * Crea canales de notificación para Android (Oreo y superior).
   * Debe llamarse antes de mostrar notificaciones en Android 8+.
   */
  createNotificationChannels: () => {
    console.log('[NotificationService SIM] Creando canales de notificación (Android)...');
    // PushNotification.createChannel(
    //   {
    //     channelId: "default-channel-id", // Requerido
    //     channelName: "Notificaciones Generales", // Requerido
    //     channelDescription: "Canal para notificaciones generales de la aplicación", // Opcional
    //     soundName: "default", // Opcional
    //     importance: 4, // (IMPORTANCE_HIGH) Opcional, default: 4. Int value of the Android notification importance
    //     vibrate: true, // Opcional
    //   },
    //   (created) => console.log(`[NotificationService SIM] Canal 'default-channel-id' creado: ${created}`)
    // );
    // PushNotification.createChannel(
    //   {
    //     channelId: "sos-channel-id",
    //     channelName: "Alertas SOS",
    //     channelDescription: "Canal para notificaciones de emergencia SOS",
    //     soundName: "sos_alarm.mp3", // Debería ser un sonido personalizado en res/raw
    //     importance: 5, // (IMPORTANCE_MAX)
    //     vibrate: true,
    //     vibration: 1000, // Vibración más larga
    //   },
    //   (created) => console.log(`[NotificationService SIM] Canal 'sos-channel-id' creado: ${created}`)
    // );
    console.log('[NotificationService SIM] Canales simulados como creados.');
  },

  /**
   * Obtiene el token FCM/APNS del dispositivo.
   * @returns {Promise<string|null>}
   */
  getDeviceToken: async () => {
    console.log('[NotificationService SIM] Obteniendo token del dispositivo...');
    // try {
    //   if (!messaging().isDeviceRegisteredForRemoteMessages) {
    //       await messaging().registerDeviceForRemoteMessages();
    //   }
    //   const token = await messaging().getToken();
    //   console.log('[NotificationService SIM] Token FCM/APNS:', token);
    //   return token;
    // } catch (error) {
    //   console.error('[NotificationService SIM] Error obteniendo token:', error);
    //   return null;
    // }
    return Promise.resolve(`sim_device_token_${Date.now()}`); // Simulación
  },

  /**
   * Maneja la recepción de mensajes FCM cuando la app está en foreground.
   */
  onForegroundMessage: () => {
    console.log('[NotificationService SIM] Configurando listener para mensajes en foreground...');
    // return messaging().onMessage(async remoteMessage => {
    //   console.log('[NotificationService SIM] Mensaje FCM recibido en Foreground:', remoteMessage);
    //   // Mostrar una notificación local o actualizar la UI directamente
    //   if (remoteMessage.notification) {
    //     notificationService.showLocalNotification(
    //       remoteMessage.notification.title,
    //       remoteMessage.notification.body,
    //       remoteMessage.data
    //     );
    //   }
    // });
    return () => console.log('[NotificationService SIM] Listener de foreground desuscrito (simulado).'); // Devuelve un "unsubscriber"
  },

  /**
   * Maneja cuando se abre la app desde una notificación (background o cerrada).
   */
  onNotificationOpenedApp: () => {
    console.log('[NotificationService SIM] Configurando listener para app abierta desde notificación...');
    // return messaging().onNotificationOpenedApp(remoteMessage => {
    //   console.log('[NotificationService SIM] App abierta desde notificación (background):', remoteMessage);
    //   // Navegar a la pantalla correspondiente según remoteMessage.data
    // });
    return () => console.log('[NotificationService SIM] Listener de app abierta desuscrito (simulado).');
  },

  /**
   * Revisa si la app fue abierta por una notificación cuando estaba cerrada.
   */
  getInitialNotification: async () => {
    console.log('[NotificationService SIM] Verificando notificación inicial...');
    // const remoteMessage = await messaging().getInitialNotification();
    // if (remoteMessage) {
    //   console.log('[NotificationService SIM] App abierta desde notificación (cerrada):', remoteMessage);
    //   // Navegar a la pantalla correspondiente según remoteMessage.data
    // }
    return Promise.resolve(null); // Simulación
  },

};

export default notificationService;
