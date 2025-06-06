# CondoAdmin - Sistema de Administración de Condominios

CondoAdmin es un sistema completo para la administración de condominios que utiliza Google Sheets como base de datos, lo que permite un fácil acceso y gestión de los datos sin necesidad de implementar un sistema de base de datos complejo.

## Características

- **Dashboard**: Panel principal con resumen de información y estadísticas.
- **Gestión de Residentes**: Registro y administración de hasta 30 residentes.
- **Gastos Comunes**: Configuración y cobro de gastos comunes.
- **Contabilidad**: Registro de ingresos y gastos, informes contables.
- **Mantenciones**: Programación y seguimiento de mantenciones.
- **Comunicaciones**: Envío de comunicaciones a residentes.
- **Multas**: Registro y seguimiento de multas.
- **Asambleas**: Programación y registro de asambleas.
- **Informes**: Generación de informes personalizados.

## Requisitos

- Cuenta de Google
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a Internet

## Instalación

### 1. Configurar Google Cloud Platform

1. Ve a la [Consola de Google Cloud](https://console.cloud.google.com/)
2. Crea un nuevo proyecto (por ejemplo, "CondoAdmin")
3. Habilita la API de Google Sheets:
   - En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google Sheets API" y habilítala
4. Configura la pantalla de consentimiento OAuth:
   - En "APIs y servicios" > "Pantalla de consentimiento OAuth"
   - Selecciona "Externo" y completa la información básica (nombre de la aplicación, correo electrónico)
   - En "Ámbitos", añade "./auth/spreadsheets" y "./auth/drive"
   - Añade tu correo electrónico como usuario de prueba
5. Crea credenciales OAuth:
   - En "APIs y servicios" > "Credenciales"
   - Haz clic en "Crear credenciales" > "ID de cliente de OAuth"
   - Selecciona "Aplicación web"
   - En "Orígenes JavaScript autorizados", añade la URL donde se alojará la aplicación (por ejemplo, "https://tu-nombre-usuario.github.io")
   - Haz clic en "Crear" y guarda el ID de cliente

### 2. Crear las hojas de Google Sheets

1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea un nuevo archivo de Google Sheets
3. Renombra la hoja como "Residentes" y configura las columnas: ID, Nombre, Unidad, Email, Teléfono, Estado
4. Añade nuevas hojas para:
   - Gastos_Comunes: Periodo, Monto_Base, Fondo_Reserva, Total_Unidad, Vencimiento, Estado
   - Pagos: ID, Fecha, Residente, Concepto, Monto, Método_Pago
   - Gastos: ID, Fecha, Concepto, Monto, Proveedor, Categoría, Estado
   - Mantenciones: ID, Fecha, Tipo, Descripción, Responsable, Estado
   - Comunicaciones: ID, Fecha, Asunto, Contenido, Destinatarios, Estado
   - Multas: ID, Fecha, Residente, Motivo, Monto, Estado
   - Asambleas: ID, Fecha, Tipo, Descripción, Asistentes, Estado
5. Comparte la hoja de cálculo:
   - Haz clic en "Compartir" en la esquina superior derecha
   - Cambia la configuración a "Cualquier persona con el enlace puede editar"
   - Copia el ID del documento (la parte larga en la URL entre "d/" y "/edit")

### 3. Configurar la aplicación

1. Edita el archivo `config.js`:
   - Reemplaza `YOUR_CLIENT_ID` con el ID de cliente de OAuth que obtuviste
   - Reemplaza `YOUR_SPREADSHEET_ID` con el ID del documento de Google Sheets que creaste
2. Guarda los cambios

## Uso

1. Accede a la aplicación a través de la URL donde está alojada
2. Inicia sesión con tu cuenta de Google cuando se te solicite
3. Utiliza el menú lateral para navegar entre las diferentes secciones del sistema

## Secciones principales

### Dashboard

El dashboard muestra un resumen de la información más importante del condominio, incluyendo:

- Número total de residentes
- Ingresos y gastos
- Saldo actual
- Mantenciones pendientes y urgentes
- Gráfico de ingresos vs gastos por mes
- Últimos pagos y gastos registrados

### Residentes

En esta sección puedes:

- Ver la lista de todos los residentes
- Agregar nuevos residentes
- Editar la información de los residentes existentes
- Eliminar residentes
- Buscar residentes por nombre, unidad, email o teléfono
- Exportar la lista de residentes a CSV

### Gastos Comunes

En esta sección puedes:

- Configurar los gastos comunes por periodo
- Generar cobros automáticos
- Registrar pagos
- Enviar avisos de cobro
- Ver el estado de pago de cada unidad

### Contabilidad

En esta sección puedes:

- Registrar ingresos y gastos
- Categorizar las transacciones
- Ver el balance general
- Generar informes contables
- Exportar datos para declaraciones fiscales

### Mantenciones

En esta sección puedes:

- Programar mantenciones preventivas
- Registrar mantenciones correctivas
- Asignar responsables
- Hacer seguimiento del estado de las mantenciones
- Recibir alertas de mantenciones urgentes

## Soporte

Si tienes alguna pregunta o problema con la aplicación, puedes contactarnos a través de:

- Email: soporte@condoadmin.com
- Teléfono: +56 9 1234 5678

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

