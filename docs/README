# Sistema de Administración Condominio Los Molles

## Arquitectura del Sistema

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Base de Datos**: Google Sheets
- **Autenticación**: Google Identity Services API
- **Almacenamiento**: Google Drive
- **Comunicaciones**: Gmail API
- **Librerías**: Chart.js (gráficos), SheetJS (exportar Excel)

### Estructura del Proyecto
```
CondominioLosMolles/
├── index.html                 # Página principal
├── css/
│   ├── styles.css            # Estilos principales
│   └── responsive.css        # Estilos responsivos
├── js/
│   ├── app.js               # Aplicación principal
│   ├── auth.js              # Autenticación Google
│   ├── sheets.js            # Integración Google Sheets
│   ├── drive.js             # Integración Google Drive
│   ├── gmail.js             # Integración Gmail
│   ├── modules/
│   │   ├── dashboard.js     # Módulo Dashboard
│   │   ├── residentes.js    # Módulo Residentes
│   │   ├── gastos.js        # Módulo Gastos Comunes
│   │   ├── contabilidad.js  # Módulo Contabilidad
│   │   ├── comunicaciones.js # Módulo Comunicaciones
│   │   ├── mantenciones.js  # Módulo Mantenciones
│   │   ├── multas.js        # Módulo Multas
│   │   ├── asambleas.js     # Módulo Asambleas
│   │   └── informes.js      # Módulo Informes
│   └── utils/
│       ├── calculations.js  # Cálculos financieros
│       ├── validators.js    # Validaciones
│       └── helpers.js       # Funciones auxiliares
├── assets/
│   ├── images/             # Imágenes del sistema
│   └── icons/              # Iconos
└── docs/
    └── README.md           # Documentación
```

### Credenciales de Google APIs
- **SPREADSHEET_ID**: 1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8
- **CLIENT_ID**: 997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com
- **API_KEY**: AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU

### Estructura de Google Sheets
1. **Residentes**: ID_Residente, NombreCompleto, RUT, N_Parcela, Direccion, Email, Telefono, Estado, ValorGastoComun
2. **Pagos_GC**: ID_Pago, Nombre_Residente, N_Parcela, Valor_Gasto_Comun, Periodo, FechaVencimiento, MontoPagado, Saldo_Pendiente_o_a_favor, Interes, TIMC, Multa_1/4, Meses_Inpagos, Deuda_Total, FechaPago, MetodoPago, Estado, ID_Comprobante_Drive
3. **Egresos**: ID_Egreso, Fecha, Categoria, Descripcion, Proveedor, Rut_Proveedor, Monto, ID_Factura_Drive
4. **Mantenciones**: ID_Mantencion, Fecha, Encargado, Tipo, Descripcion, Estado, CostoTotal, ID_Comprobante_Drive
5. **Multas**: ID_Multa, ID_Residente, FechaInfraccion, Descripcion, Monto, Estado, FechaPago
6. **Asambleas**: ID_Asamblea, Fecha, Tipo, Descripcion, Estado, ID_Acta_Drive
7. **Comunicaciones**: ID_Comunicacion, ID_Residente, N_Parcela, Nombre_Completo, Email, FechaEnvio, Asunto, Mensaje

### Diseño UI/UX
- **Paleta de colores**: Azul claro (#E3F2FD), Verde menta (#E8F5E8), Gris suave (#F5F5F5)
- **Colores de acento**: Azul fuerte (#1976D2), Verde brillante (#4CAF50), Naranja sutil (#FF9800)
- **Tipografía**: 'Roboto', sans-serif
- **Layout**: Menú vertical fijo izquierdo + área de contenido principal derecha
- **Responsivo**: Compatible con desktop, tablet y móvil

### Módulos del Sistema
1. **Dashboard**: Widgets con métricas clave, gráficos de ingresos vs egresos
2. **Residentes**: CRUD de residentes, búsqueda, exportar Excel
3. **Gastos Comunes**: Gestión de pagos, cálculos automáticos de intereses y multas
4. **Contabilidad**: Ingresos y egresos, reportes financieros
5. **Comunicaciones**: Envío de emails, historial de comunicaciones
6. **Mantenciones**: Gestión de mantenciones, estados, costos
7. **Multas**: Cursado de multas según Ley 21.442
8. **Asambleas**: Programación y gestión de asambleas
9. **Informes**: Generación de reportes en PDF/Excel

### Funcionalidades Clave
- Autenticación con Google (losmollestunquen@gmail.com)
- Cálculos automáticos de intereses y multas
- Integración con Google Drive para documentos
- Envío automático de recordatorios de pago
- Exportación de reportes
- Interfaz responsiva y moderna


