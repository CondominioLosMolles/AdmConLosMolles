# Sistema de Administración Condominio Los Molles

## Descripción del Proyecto

Este es un sistema web completo de administración para el Condominio Los Molles, desarrollado según las especificaciones detalladas proporcionadas. El sistema integra Google APIs (Sheets, Drive, Gmail) para proporcionar una solución robusta y escalable.

## Características Principales

### 🏠 **Módulos Implementados**

1. **Dashboard**
   - Widgets informativos con estadísticas en tiempo real
   - Gráficos de ingresos vs egresos
   - Resumen de morosidad
   - Acciones rápidas

2. **Residentes**
   - CRUD completo de residentes
   - Búsqueda y filtros avanzados
   - Paginación
   - Exportación a Excel
   - Validación de RUT chileno

3. **Gastos Comunes**
   - Gestión completa de pagos
   - Cálculos financieros automáticos:
     - Interés = Valor_Gasto_Comun * TIMC / 100 / 12
     - Multa 1/4 = Gasto_Común / 4 (por mes de atraso)
     - Meses de impago (desde día 11)
     - Deuda total y saldos
   - Gestión de tasas TIMC por mes
   - Filtros por parcela y año
   - Subida de comprobantes a Google Drive
   - Envío de comprobantes por email

4. **Contabilidad**
   - Pestaña de Egresos con categorías
   - Pestaña de Ingresos (vista de pagos)
   - Resúmenes financieros
   - Subida de facturas a Google Drive
   - Exportación a Excel

5. **Comunicaciones**
   - Envío masivo de correos electrónicos
   - Plantillas predefinidas (recordatorios, avisos, convocatorias)
   - Variables dinámicas ({{nombre}}, {{parcela}}, etc.)
   - Selección flexible de destinatarios
   - Historial de comunicaciones

6. **Mantenciones**
   - Gestión de mantenciones por área
   - Estados y prioridades
   - Costos estimados
   - Responsables

7. **Multas**
   - Registro de multas por motivo
   - Estados de pago
   - Integración con residentes

8. **Asambleas**
   - Programación de asambleas
   - Envío de convocatorias
   - Control de asistencia

9. **Informes**
   - Informe Financiero
   - Informe de Morosidad
   - Informe de Mantenciones
   - Informe de Residentes
   - Informe de Multas
   - Informe Completo
   - Exportación a PDF y Excel

### 🔧 **Tecnologías Utilizadas**

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **APIs**: Google Sheets, Google Drive, Gmail
- **Autenticación**: Google Identity Services
- **Diseño**: Responsive design, mobile-first
- **Librerías**: Chart.js (gráficos), SheetJS (Excel)

### 🎨 **Características de Diseño**

- **Responsive**: Compatible con desktop, tablet y móvil
- **Paleta de colores**: Azul (#2196F3) y verde (#4CAF50)
- **UI/UX moderno**: Sidebar colapsible, animaciones suaves
- **Accesibilidad**: Contraste adecuado, navegación por teclado

### 🔐 **Seguridad y Autenticación**

- Autenticación con Google Identity Services
- Permisos granulares para Google APIs
- Validación de datos en frontend
- Manejo seguro de archivos

### 📊 **Integración con Google APIs**

#### Google Sheets
- **Hoja "Residentes"**: Datos de propietarios
- **Hoja "Pagos"**: Registro de gastos comunes
- **Hoja "Egresos"**: Gastos del condominio
- **Hoja "Mantenciones"**: Registro de mantenciones
- **Hoja "Multas"**: Registro de multas
- **Hoja "Asambleas"**: Programación de asambleas
- **Hoja "Comunicaciones"**: Historial de emails

#### Google Drive
- **Carpeta "Comprobantes"**: Subcarpetas por parcela
- **Carpeta "Facturas"**: Facturas de egresos
- **Carpeta "Documentos"**: Documentos generales

#### Gmail
- Envío de comprobantes de pago
- Comunicaciones masivas
- Convocatorias a asambleas

## Estructura del Proyecto

```
CondominioLosMolles/
├── index.html                 # Página principal
├── css/
│   ├── styles.css            # Estilos principales
│   ├── responsive.css        # Estilos responsivos
│   └── modules.css           # Estilos específicos de módulos
├── js/
│   ├── app.js               # Aplicación principal
│   ├── auth.js              # Autenticación Google
│   ├── sheets.js            # API Google Sheets
│   ├── drive.js             # API Google Drive
│   ├── gmail.js             # API Gmail
│   ├── utils/
│   │   ├── helpers.js       # Funciones auxiliares
│   │   ├── validators.js    # Validaciones
│   │   └── calculations.js  # Cálculos financieros
│   └── modules/
│       ├── dashboard.js     # Módulo Dashboard
│       ├── residentes.js    # Módulo Residentes
│       ├── gastos.js        # Módulo Gastos Comunes
│       ├── contabilidad.js  # Módulo Contabilidad
│       ├── comunicaciones.js # Módulo Comunicaciones
│       ├── mantenciones.js  # Módulo Mantenciones
│       ├── multas.js        # Módulo Multas
│       ├── asambleas.js     # Módulo Asambleas
│       └── informes.js      # Módulo Informes
├── assets/                  # Recursos (imágenes, iconos)
└── docs/
    └── README.md           # Este archivo
```

## Configuración Inicial

### 1. Configurar Google APIs

1. **Crear proyecto en Google Cloud Console**
2. **Habilitar APIs necesarias**:
   - Google Sheets API
   - Google Drive API
   - Gmail API
3. **Crear credenciales OAuth 2.0**
4. **Configurar dominios autorizados**

### 2. Configurar Google Sheets

Crear una hoja de cálculo con las siguientes pestañas:

#### Hoja "Residentes"
| ID_Residente | NombreCompleto | RUT | N_Parcela | Direccion | Email | Telefono | Estado | ValorGastoComun |

#### Hoja "Pagos"
| ID_Pago | ID_Residente | N_Parcela | Nombre_Residente | Valor_Gasto_Comun | Periodo | Fecha_Vencimiento | Monto_Pagado | Saldo_Pendiente | Interes | TIMC | Multa_1_4 | Meses_Inpagos | Deuda_Total | Fecha_Pago | Metodo_Pago | Estado | ID_Comprobante_Drive |

#### Hoja "Egresos"
| ID_Egreso | Fecha | Categoria | Descripcion | Proveedor | Rut_Proveedor | Monto | ID_Factura_Drive |

#### Hoja "Mantenciones"
| ID_Mantencion | Fecha | Area | Descripcion | Prioridad | Estado | CostoEstimado | Responsable |

#### Hoja "Multas"
| ID_Multa | Fecha | N_Parcela | Motivo | Descripcion | Monto | Estado | FechaPago |

#### Hoja "Asambleas"
| ID_Asamblea | Fecha | Hora | Lugar | Tipo | Estado | Temas | Observaciones | Asistentes |

#### Hoja "Comunicaciones"
| ID_Comunicacion | ID_Residente | N_Parcela | NombreCompleto | Email | FechaEnvio | Asunto | Mensaje |

### 3. Configurar Credenciales

Editar el archivo `js/auth.js` y actualizar:

```javascript
const CLIENT_ID = 'tu-client-id.googleusercontent.com';
const SPREADSHEET_ID = 'tu-spreadsheet-id';
```

## Funcionalidades Destacadas

### Cálculos Financieros Automáticos

El sistema implementa los cálculos exactos especificados:

- **Interés**: Se aplica solo una vez en el primer mes de atraso
- **Multa 1/4**: Se aplica por cada mes de atraso desde el día 11
- **TIMC**: Tasas configurables por mes y año
- **Deuda Total**: Suma de gasto común + interés + multas
- **Estados automáticos**: Pagado/Pendiente/Moroso

### Sistema de Archivos

- **Comprobantes de pago**: Organizados por parcela en Google Drive
- **Facturas de egresos**: Almacenadas con nombres descriptivos
- **Descarga directa**: Enlaces para visualizar documentos

### Comunicaciones Inteligentes

- **Variables dinámicas**: Personalización automática de mensajes
- **Plantillas reutilizables**: Para diferentes tipos de comunicación
- **Envío masivo**: Con control de errores y confirmaciones

## Instalación y Uso

### Opción 1: Uso Local
1. Descargar todos los archivos
2. Configurar credenciales de Google APIs
3. Abrir `index.html` en un servidor web local
4. Autenticarse con Google

### Opción 2: Despliegue Web
1. Subir archivos a un servidor web
2. Configurar dominio en Google Cloud Console
3. Actualizar URLs en la configuración
4. Acceder desde cualquier navegador

## Limitaciones Conocidas

1. **Autenticación local**: Requiere servidor web para Google APIs
2. **Límites de API**: Sujeto a cuotas de Google APIs
3. **Navegadores**: Requiere navegadores modernos con soporte ES6+

## Soporte y Mantenimiento

El sistema está diseñado para ser:
- **Escalable**: Fácil agregar nuevos módulos
- **Mantenible**: Código modular y documentado
- **Extensible**: APIs bien definidas para nuevas funcionalidades

## Conclusión

Este sistema proporciona una solución completa y profesional para la administración del Condominio Los Molles, cumpliendo con todos los requisitos especificados y ofreciendo una experiencia de usuario moderna y eficiente.

---

**Desarrollado para Condominio Los Molles**  
**Versión 1.0 - 2025**

