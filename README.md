# Aplicación de Administración de Condominio

Esta es una aplicación móvil multiplataforma (iOS y Android) diseñada para la administración integral de un condominio. Permite la interacción entre residentes y administradores, facilitando la gestión de gastos comunes, requerimientos, asambleas y comunicaciones.

## Características Principales (Según Plan de Desarrollo)

La aplicación contempla dos roles principales: Residente y Administrador.

**Rol Residente:**
*   Visualización y pago de Gastos Comunes (con historial y comprobantes).
*   Ingreso de Requerimientos (solicitudes, sugerencias, reclamos) con adjuntos.
*   Visualización de Citaciones y Actas de Asambleas, con confirmación de asistencia.
*   Descarga de Certificados (estado de parcela, gastos comunes, reglamento).
*   Chat Interno con la administración.
*   Botón de SOS para emergencias.

**Rol Administrador:**
*   Acceso a todas las funcionalidades de Residente.
*   Dashboard con vista general del estado del condominio.
*   Gestión de Perfiles de Residentes.
*   Gestión de Mantenciones y Proveedores.
*   Gestión completa de Gastos Comunes del condominio.
*   Generación de Informes.
*   Creación y Gestión de Asambleas.
*   Envío de Comunicaciones Masivas.

**Características Adicionales:**
*   Notificaciones automáticas para eventos importantes.
*   Sincronización bidireccional en tiempo real (simulada) con un sistema basado en Google Sheets/Drive.
*   Actualizaciones Over-The-Air (OTA) para la aplicación (mecanismo simulado).
*   Distribución privada: .apk para Android, Ad Hoc para iOS.

## Arquitectura y Tecnologías

*   **Framework:** React Native
*   **Gestión de Estado:** React Context API con Hooks.
*   **Navegación:** React Navigation.
*   **Servicios Backend (Simulados):** Lógica de negocio encapsulada en servicios que interactúan con una simulación de Google Sheets/Drive (`googleApiService.js`).
*   **Diseño:** Enfocado en ser moderno, minimalista, intuitivo y fácil de usar.

## Configuración del Proyecto (Simulada para este entorno)

En un entorno de desarrollo real, los pasos serían:

1.  **Clonar el Repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd condo-app
    ```
2.  **Instalar Dependencias:**
    ```bash
    npm install
    # o
    yarn install
    ```
3.  **Configurar Entorno Específico:**
    *   **Google API:** Configurar credenciales para Google Cloud Platform con acceso a Google Sheets API y Google Drive API. Estas credenciales (ej. `google-services.json` para Android, o un archivo de claves de servicio para un backend intermedio) deberían gestionarse de forma segura. En esta simulación, `src/services/googleApiService.js` usa datos mock.
    *   **Firebase (Opcional, para Notificaciones Push Reales):** Si se usaran notificaciones push a través de FCM, configurar un proyecto Firebase y añadir los archivos de configuración (`google-services.json` para Android, `GoogleService-Info.plist` para iOS).
    *   **Pasarela de Pagos:** Integrar las SDKs y claves de la pasarela de pagos seleccionada.
    *   **Keystore (Android):** Para builds de release, generar y configurar un keystore de firma (ver `android/gradle.properties` y `android/app/build.gradle`).
    *   **Apple Developer Account (iOS):** Configurar certificados y perfiles de provisión para desarrollo y distribución Ad Hoc.

4.  **Ejecutar la Aplicación (Desarrollo):**
    *   **Android:**
        ```bash
        npx react-native run-android
        ```
    *   **iOS:**
        ```bash
        npx react-native run-ios
        # o abrir ios/condo-app.xcworkspace en Xcode y ejecutar desde allí.
        ```

## Scripts Simulados en este Proyecto

*   `scripts/testGoogleApiService.js`: Prueba las funciones del servicio simulado de Google API.
    ```bash
    node scripts/testGoogleApiService.js
    ```
*   `scripts/testNotificationService.js`: Simula el disparo de notificaciones locales.
    ```bash
    node scripts/testNotificationService.js
    ```

## Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `src/` y sigue una estructura modular:

*   `assets/`: Recursos estáticos (imágenes, fuentes).
*   `components/`: Componentes UI reutilizables.
*   `config/`: Archivos de configuración de la aplicación.
*   `constants/`: Constantes (colores, tipos de acción, etc.).
*   `contexts/`: Contextos de React para gestión de estado global.
*   `hooks/`: Hooks personalizados de React.
*   `models/`: Definiciones (JSDoc) de las estructuras de datos.
*   `navigation/`: Lógica de navegación y routers.
*   `screens/`: Pantallas de la aplicación, organizadas por rol (Admin, Resident, Auth, Common).
*   `services/`: Lógica de negocio, interacción con APIs (simuladas).
*   `utils/`: Funciones de utilidad.

## Próximos Pasos y Mejoras (Conceptual)

*   Implementación completa de todas las funcionalidades de los roles Residente y Administrador.
*   Integración real con Google Sheets API y Google Drive API.
*   Integración con una pasarela de pagos real.
*   Implementación robusta de notificaciones push (ej. vía Firebase Cloud Messaging).
*   Implementación de una solución OTA real (ej. CodePush).
*   Diseño UX/UI detallado y aplicación de una librería de iconos.
*   Desarrollo de pruebas unitarias, de integración y E2E.
*   Optimización del rendimiento.
*   Configuración de CI/CD para builds y despliegues.
*   Documentación técnica más detallada para cada módulo y servicio.
```
