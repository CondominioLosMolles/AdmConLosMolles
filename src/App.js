import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert } from 'react-native'; // Importar Alert
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import notificationService from './services/notificationService';
import otaHelper from './utils/otaHelper'; // Importar otaHelper
import SplashScreen from 'react-native-splash-screen'; // Asumiendo que se usará una pantalla de splash nativa

const App = () => {
  useEffect(() => {
    // Configurar servicios iniciales
    notificationService.configure(); // Configura el manejador de notificaciones
    notificationService.createNotificationChannels(); // Crea canales para Android

    // Ocultar SplashScreen nativo si se está usando
    // Esto usualmente se hace después de que la app JS está cargada y lista para renderizar.
    // El momento exacto puede variar.
    // if (SplashScreen && typeof SplashScreen.hide === 'function') {
    //   SplashScreen.hide();
    // }

    // --- Verificación de Actualizaciones OTA (Simulada) ---
    const checkOTA = async () => {
      try {
        const updateInfo = await otaHelper.checkForUpdate();
        if (updateInfo) {
          let alertButtons = [
            {
              text: "Actualizar Ahora",
              onPress: async () => {
                // Simular progreso de descarga e instalación
                Alert.alert(
                  "Descargando Actualización",
                  `Versión ${updateInfo.latestVersion}\nProgreso: 0%`,
                  [],
                  { cancelable: false }
                );
                // Aquí no puedo actualizar la alerta dinámicamente con el progreso en una app real
                // se usaría un modal o un componente de UI para mostrar el progreso.
                // Para simular el progreso en la consola:
                const result = await otaHelper.downloadAndInstallUpdate(updateInfo, (progress) => {
                  console.log(`Progreso de descarga OTA (App.js): ${progress}%`);
                  // En una app real, actualizarías un estado para un componente de UI de progreso aquí.
                });

                Alert.alert( // Cerrar la alerta de "Descargando" y mostrar resultado
                  result.success ? "Actualización Lista" : "Error de Actualización",
                  result.message,
                  result.requiresRestart ? [{ text: "Reiniciar App (Simulado)", onPress: () => console.log("[OTA SIM] App reiniciada.") }] : [{text: "OK"}]
                );
              },
            },
          ];
          if (!updateInfo.forceUpdate) {
            alertButtons.push({ text: "Más Tarde", style: "cancel" });
          }
          Alert.alert(
            "Actualización Disponible",
            `Versión: ${updateInfo.latestVersion}\n\nNotas:\n${updateInfo.notes}`,
            alertButtons,
            { cancelable: !updateInfo.forceUpdate }
          );
        }
      } catch (error) {
        console.error("[OTA SIM App.js] Error verificando actualizaciones:", error);
        // No molestar al usuario con errores de OTA a menos que sea crítico.
      }
    };

    // Simular una verificación de OTA un poco después del inicio de la app
    setTimeout(checkOTA, 3000); // Esperar 3 segundos

    // Suscribirse a listeners de notificación (ej. foreground, opened app)
    const unsubscribeForeground = notificationService.onForegroundMessage();
    const unsubscribeOpenedApp = notificationService.onNotificationOpenedApp();
    notificationService.getInitialNotification(); // Revisa si la app se abrió desde una notificación (cerrada)

    return () => {
      // Limpiar listeners al desmontar
      if (typeof unsubscribeForeground === 'function') unsubscribeForeground();
      if (typeof unsubscribeOpenedApp === 'function') unsubscribeOpenedApp();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
