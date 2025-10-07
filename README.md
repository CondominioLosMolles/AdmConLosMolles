# CRM Condominio Los Molles

Sistema de administración integral para condominios con diseño neumorphism, desarrollado con React y conectado a Google Sheets.

## 🚀 Características Principales

### **Módulos Implementados**
- **Dashboard** - Resumen ejecutivo con estadísticas en tiempo real
- **Gestión de Residentes** - Base de datos completa de propietarios
- **Pagos GC** - Control de gastos comunes y estados de pago
- **Convenios** - Gestión de acuerdos de pago
- **Egresos** - Control de gastos del condominio
- **Ingresos Extra** - Registro de ingresos adicionales
- **Comunicaciones** - Sistema de notificaciones y avisos
- **Configuración** - Integración con Google Sheets y Gmail

### **Tecnologías Utilizadas**
- **Frontend**: React 18 + Vite
- **Estilos**: Tailwind CSS + Diseño Neumorphism
- **Componentes**: shadcn/ui
- **Iconos**: Lucide React
- **Backend**: Google Apps Script + Google Sheets
- **Despliegue**: GitHub Pages

### **Integración con Google Sheets**
- Conexión en tiempo real con hojas de cálculo
- Lectura y escritura automática de datos
- Sincronización bidireccional
- Respaldo automático en la nube

## 📋 Requisitos Previos

1. **Cuenta de Google** con acceso a Google Sheets y Google Apps Script
2. **Repositorio de GitHub** para el despliegue
3. **Hoja de cálculo** con la estructura específica del sistema

## 🛠️ Instalación y Configuración

### **Paso 1: Clonar el Repositorio**
```bash
git clone https://github.com/condominiolosmolles/AdmConLosMolles.git
cd AdmConLosMolles
```

### **Paso 2: Instalar Dependencias**
```bash
npm install
# o
pnpm install
```

### **Paso 3: Configurar Google Apps Script**

1. **Crear un nuevo proyecto en Google Apps Script**
   - Ve a [script.google.com](https://script.google.com)
   - Crea un nuevo proyecto
   - Nombra el proyecto: "CRM Los Molles"

2. **Copiar el código del sistema**
   - Copia todo el contenido del archivo `funcionesSHEET.txt`
   - Pégalo en el editor de Google Apps Script
   - Guarda el proyecto

3. **Vincular con Google Sheets**
   - Asegúrate de que tu hoja de cálculo tenga la estructura exacta de `CONTABILIDADSISTEMALOSMOLLES.xlsx`
   - Actualiza el ID de la hoja de cálculo en el código

4. **Desplegar como Web App**
   - Ve a "Implementar" → "Nueva implementación"
   - Tipo: "Aplicación web"
   - Ejecutar como: "Yo"
   - Quién tiene acceso: "Cualquier persona"
   - Copia la URL generada (termina en `/exec`)

### **Paso 4: Configurar la Aplicación**

1. **Abrir la aplicación** en tu navegador
2. **Ir al módulo de Configuración**
3. **Pegar la URL del Web App** de Google Apps Script
4. **Probar la conexión** para verificar que funciona

## 🚀 Despliegue en GitHub Pages

### **Opción 1: Despliegue Automático (Recomendado)**

1. **Configurar GitHub Actions**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             
         - name: Install dependencies
           run: npm install
           
         - name: Build
           run: npm run build
           
         - name: Deploy to GitHub Pages
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

2. **Habilitar GitHub Pages**
   - Ve a Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "gh-pages"
   - Folder: "/ (root)"

### **Opción 2: Despliegue Manual**

1. **Construir la aplicación**
   ```bash
   npm run build
   ```

2. **Subir archivos**
   - Copia todo el contenido de la carpeta `dist/`
   - Súbelo a la rama `gh-pages` de tu repositorio
   - O usa el directorio `docs/` en la rama principal

## 📊 Estructura de Datos

### **Hojas Requeridas en Google Sheets**

| Hoja | Descripción | Columnas Principales |
|------|-------------|---------------------|
| **Residentes** | Información de propietarios | N_Parcela, Nombre_Completo, Email, Telefono, Estado |
| **Pagos_GC** | Registro de pagos | N_Parcela, Fecha_Pago, Monto_Pagado, Estado, Periodo |
| **Convenios** | Acuerdos de pago | ID_Convenio, N_Parcela, Estado, Saldo_Pendiente |
| **Egresos** | Gastos del condominio | Fecha, Descripcion, Monto, Categoria, Proveedor |
| **Ingresos_Extra** | Ingresos adicionales | Fecha, Descripcion, Monto, Tipo |
| **Configuracion** | Parámetros del sistema | Parametro, Valor, Descripcion |

### **Funciones Principales del Google Apps Script**

- `obtenerResidentes()` - Obtiene lista de residentes
- `agregarResidente_GS()` - Agrega nuevo residente
- `obtenerPagosGC()` - Obtiene historial de pagos
- `agregarPagoGC_GS()` - Registra nuevo pago
- `obtenerConvenios()` - Obtiene convenios activos
- `crearConvenio()` - Crea nuevo convenio
- `enviarCorreoComprobante_GS()` - Envía comprobantes por email
- `generarRegistrosDeMora()` - Procesa automáticamente morosos

## 🎨 Personalización

### **Colores y Tema**
El sistema utiliza un diseño neumorphism personalizable. Para modificar los colores:

1. **Editar variables CSS** en `src/App.css`
2. **Actualizar configuración de Tailwind** en `tailwind.config.js`
3. **Modificar gradientes** en las clases personalizadas

### **Agregar Nuevos Módulos**
1. Crear componente en `src/components/`
2. Agregar ruta en el sidebar
3. Implementar funciones en Google Apps Script
4. Crear hooks personalizados en `src/hooks/`

## 🔧 Desarrollo Local

### **Comandos Disponibles**
```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Vista previa del build
npm run lint         # Ejecuta linter

# Instalación de componentes
npx shadcn-ui@latest add [component]
```

### **Estructura del Proyecto**
```
src/
├── components/
│   ├── ui/                 # Componentes de shadcn/ui
│   └── ConfiguracionGoogleSheets.jsx
├── hooks/
│   └── useGoogleSheets.js  # Hooks para Google Sheets
├── services/
│   └── googleSheetsService.js  # Servicio de integración
├── App.jsx                 # Componente principal
├── App.css                 # Estilos neumorphism
└── main.jsx               # Punto de entrada
```

## 🔒 Seguridad y Privacidad

### **Medidas Implementadas**
- **Autenticación** mediante Google Apps Script
- **Validación** de datos en frontend y backend
- **Encriptación** de comunicaciones HTTPS
- **Control de acceso** granular por módulo
- **Respaldo automático** en Google Drive

### **Configuración de Permisos**
1. **Google Apps Script**: Acceso solo al propietario
2. **Google Sheets**: Permisos de edición controlados
3. **GitHub Pages**: Aplicación pública, datos privados

## 📞 Soporte y Mantenimiento

### **Resolución de Problemas Comunes**

| Problema | Solución |
|----------|----------|
| **Error de conexión con Google Sheets** | Verificar URL del Web App y permisos |
| **Datos no se actualizan** | Revisar estructura de hojas y nombres de columnas |
| **Aplicación no carga** | Verificar que GitHub Pages esté habilitado |
| **Estilos no se aplican** | Limpiar caché del navegador |

### **Actualizaciones**
- **Automáticas**: Configuradas mediante GitHub Actions
- **Manuales**: Ejecutar `npm run build` y subir archivos
- **Versioning**: Usar tags de Git para releases

## 📈 Roadmap Futuro

### **Funcionalidades Planificadas**
- [ ] **Módulo de Reportes** con gráficos avanzados
- [ ] **Aplicación móvil** con React Native
- [ ] **Notificaciones push** en tiempo real
- [ ] **Integración con WhatsApp** para comunicaciones
- [ ] **Sistema de reservas** para áreas comunes
- [ ] **Control de acceso** con códigos QR
- [ ] **Gestión de proveedores** avanzada
- [ ] **Dashboard financiero** con proyecciones

### **Mejoras Técnicas**
- [ ] **PWA** (Progressive Web App)
- [ ] **Modo offline** con sincronización
- [ ] **Tests automatizados** con Jest y Cypress
- [ ] **Optimización de rendimiento** con lazy loading
- [ ] **Internacionalización** (i18n)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. **Fork** el repositorio
2. **Crear** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abrir** un Pull Request

## 📧 Contacto

**Condominio Los Molles**
- **Email**: admin@losmolles.cl
- **Teléfono**: +56 9 XXXX XXXX
- **Dirección**: Los Molles, Región de Valparaíso, Chile

---

**Desarrollado con ❤️ por Manus AI**

*Sistema de administración profesional para condominios modernos*
