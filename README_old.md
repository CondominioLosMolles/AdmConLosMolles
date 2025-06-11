# Sistema de Administración - Condominio Los Molles

## Descripción
Sistema web completo para la administración de condominios desarrollado conforme a la Ley 21.442 de Copropiedad Inmobiliaria de Chile.

## Características Principales

### ✅ Módulos Implementados
1. **Dashboard** - Panel principal con estadísticas y gráficos
2. **Residentes** - Gestión completa de residentes y propietarios
3. **Gastos Comunes** - Cálculo automático de cuotas, intereses y multas
4. **Contabilidad** - Control de ingresos y egresos
5. **Comunicaciones** - Sistema de emails masivos
6. **Mantenciones** - Gestión de mantenciones preventivas y correctivas
7. **Multas** - Cursado de multas conforme a la ley
8. **Asambleas** - Programación y gestión de asambleas
9. **Informes** - Generación de reportes en Excel

### ✅ Funcionalidades Técnicas
- **Integración con Google Workspace**: Sheets, Drive y Gmail
- **Cálculos automáticos**: Intereses de mora según normativa chilena
- **Interfaz responsiva**: Compatible con desktop y móvil
- **Autenticación OAuth 2.0**: Seguridad con Google
- **Exportación de datos**: Excel y PDF
- **Almacenamiento en la nube**: Google Drive para documentos

## Configuración Inicial

### 1. Configurar APIs de Google

#### Paso 1: Crear proyecto en Google Cloud Console
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar las siguientes APIs:
   - Google Sheets API
   - Google Drive API
   - Gmail API

#### Paso 2: Configurar OAuth 2.0
1. Ir a "Credenciales" en Google Cloud Console
2. Crear credenciales OAuth 2.0 para aplicación web
3. Agregar dominios autorizados:
   - `http://localhost` (para pruebas locales)
   - Su dominio de producción
4. Copiar el Client ID generado

#### Paso 3: Configurar el archivo config.js
Editar el archivo `js/config.js` con sus credenciales:

```javascript
const CONFIG = {
    // Reemplazar con su Client ID de Google
    GOOGLE_CLIENT_ID: 'SU_CLIENT_ID_AQUI.apps.googleusercontent.com',
    
    // Email del administrador
    ADMIN_EMAIL: 'admin@condominiolosmolles.cl',
    
    // IDs de las hojas de cálculo (se crearán automáticamente)
    SHEETS: {
        RESIDENTES: 'ID_HOJA_RESIDENTES',
        PAGOS_GC: 'ID_HOJA_PAGOS',
        EGRESOS: 'ID_HOJA_EGRESOS',
        MANTENCIONES: 'ID_HOJA_MANTENCIONES',
        MULTAS: 'ID_HOJA_MULTAS',
        ASAMBLEAS: 'ID_HOJA_ASAMBLEAS',
        COMUNICACIONES: 'ID_HOJA_COMUNICACIONES'
    }
};
```

### 2. Estructura de Google Sheets

El sistema creará automáticamente las siguientes hojas de cálculo:

#### Residentes
- ID, Nombre Completo, RUT, N° Parcela, Email, Teléfono, Estado, Valor Gasto Común

#### Pagos_GC
- ID, ID Residente, N° Parcela, Período, Fecha Vencimiento, Monto Pagado, Fecha Pago, Método Pago

#### Egresos
- ID, Fecha, Categoría, Descripción, Proveedor, Monto, ID Factura Drive

#### Mantenciones
- ID, Fecha, Encargado, Tipo, Descripción, Estado, Costo Total, ID Comprobante Drive

#### Multas
- ID, ID Residente, Fecha Infracción, Descripción, Monto, Estado, Fecha Pago

#### Asambleas
- ID, Fecha, Tipo, Descripción, Estado, ID Acta Drive

#### Comunicaciones
- ID, ID Residente, Fecha Envío, Asunto, Mensaje

## Uso del Sistema

### Primer Acceso
1. Abrir `index.html` en un navegador web
2. Hacer clic en "Iniciar Sesión con Google"
3. Autorizar el acceso a Google Sheets, Drive y Gmail
4. El sistema creará automáticamente las hojas de cálculo necesarias

### Gestión de Residentes
- Agregar, editar y eliminar residentes
- Configurar valor de gasto común por parcela
- Exportar listado a Excel

### Cálculo de Gastos Comunes
- El sistema calcula automáticamente:
  - Intereses de mora (1.5% mensual)
  - Multas adicionales según días de atraso
  - Reajustes por UF cuando corresponda

### Comunicaciones
- Envío masivo de emails a residentes
- Plantillas profesionales automáticas
- Historial de comunicaciones enviadas

### Informes
- Informe de morosidad
- Estado de resultados
- Historial de pagos por residente
- Gastos por categoría
- Informes de mantenciones y multas

## Cumplimiento Legal

### Ley 21.442 de Copropiedad Inmobiliaria
- Cálculo de intereses conforme al artículo 20
- Procedimientos de multas según artículo 21
- Citación a asambleas según plazos legales

### Decreto 7 del Ministerio de Vivienda
- Requisitos para asambleas ordinarias (15 días)
- Requisitos para asambleas extraordinarias (8 días)
- Documentación y actas requeridas

## Soporte Técnico

### Requisitos del Sistema
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Cuenta de Google Workspace o Gmail

### Archivos del Sistema
```
AdmConLosMolles/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── js/
│   ├── config.js           # Configuración
│   ├── auth.js             # Autenticación Google
│   ├── api.js              # APIs de Google
│   ├── utils.js            # Funciones utilitarias
│   ├── app.js              # Aplicación principal
│   └── modules/            # Módulos del sistema
│       ├── dashboard.js
│       ├── residentes.js
│       ├── gastos-comunes.js
│       ├── contabilidad.js
│       ├── comunicaciones.js
│       ├── mantenciones.js
│       ├── multas.js
│       ├── asambleas.js
│       └── informes.js
└── README.md               # Este archivo
```

### Backup y Seguridad
- Todos los datos se almacenan en Google Sheets (backup automático)
- Documentos se guardan en Google Drive
- Acceso controlado por OAuth 2.0
- Recomendado: Backup periódico de hojas de cálculo

## Contacto
Para soporte técnico o consultas sobre el sistema, contactar al administrador del condominio.

---
**Desarrollado para Condominio Los Molles**  
*Conforme a la legislación chilena vigente*

