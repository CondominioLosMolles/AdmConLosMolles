Este es un proyecto de aplicación móvil multiplataforma para la administración de un condominio.

**Framework Seleccionado:** React Native

**Pautas Generales:**
- Mantener el código limpio, bien comentado y organizado por módulos/funcionalidades.
- Seguir las convenciones de estilo de JavaScript y React Native.
- Priorizar la claridad y la mantenibilidad del código.
- Asegurar que la UI sea consistente entre iOS y Android.

**Integración con Google Sheets/Drive:**
- Utilizar las APIs oficiales de Google.
- Implementar una capa de servicio robusta para la comunicación con Google.
- Manejar errores de red y autenticación de forma adecuada.

**Actualizaciones OTA:**
- Diseñar la aplicación para ser compatible con CodePush o un mecanismo similar.

**Pruebas:**
- Escribir pruebas unitarias para la lógica de negocio y los componentes críticos.
- Realizar pruebas de integración para las funcionalidades clave, especialmente la sincronización de datos.

**Roles de Usuario:**
- Asegurar una clara separación de lógica y UI para los roles de Residente y Administrador.

**Diseño:**
- Seguir los principios de diseño moderno, minimalista e intuitivo como se especifica en el prompt.

**Notificaciones:**
- Implementar un sistema de notificaciones push que sea fiable y no intrusivo.
- Considerar el uso de Firebase Cloud Messaging (FCM) para las notificaciones push.

**Manejo de Archivos:**
- Para adjuntos en requerimientos y chat, asegurar que se suban a Google Drive y se gestionen las referencias correctamente.
- Para la descarga de certificados y actas, asegurar que se obtengan de Google Drive.

**Seguridad:**
- Manejar las credenciales de API y los datos de usuario de forma segura.
- No incluir información sensible directamente en el código fuente. Utilizar variables de entorno o un sistema de configuración seguro.
