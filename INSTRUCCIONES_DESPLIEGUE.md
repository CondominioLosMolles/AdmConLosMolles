# 🚀 Instrucciones de Despliegue - CRM Condominio Los Molles

## 📋 Resumen Ejecutivo

Este documento contiene las instrucciones completas para desplegar el sistema CRM del Condominio Los Molles en GitHub Pages, incluyendo la configuración de Google Sheets y Google Apps Script.

## 🎯 Objetivos del Despliegue

- **Aplicación web funcional** accesible desde [https://condominiolosmolles.github.io/AdmConLosMolles/](https://condominiolosmolles.github.io/AdmConLosMolles/)

- **Integración completa** con Google Sheets para datos en tiempo real

- **Sistema seguro** con autenticación y control de acceso

- **Interfaz profesional** con diseño neumorphism

## 📁 Archivos Incluidos

| Archivo | Descripción | Uso |
| --- | --- | --- |
| `dist/` | Aplicación compilada para producción | Subir a GitHub Pages |
| `google-apps-script.js` | Código completo del backend | Copiar a Google Apps Script |
| `.github/workflows/deploy.yml` | Configuración de despliegue automático | GitHub Actions |
| `README.md` | Documentación completa del proyecto | Información general |
| `INSTRUCCIONES_DESPLIEGUE.md` | Este archivo | Guía de despliegue |

## 🔧 Paso 1: Preparar el Repositorio de GitHub

### **1.1 Crear/Actualizar el Repositorio**

```bash
# Si es un repositorio nuevo
git init
git remote add origin https://github.com/condominiolosmolles/AdmConLosMolles.git

# Si es un repositorio existente
git pull origin main
```

### **1.2 Subir los Archivos**

```bash
# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Deploy: CRM Condominio Los Molles v1.0"

# Subir a GitHub
git push origin main
```

### **1.3 Configurar GitHub Pages**

1. **Ir a Settings** del repositorio

1. **Navegar a Pages** en el menú lateral

1. **Configurar Source**:
  - Source: "Deploy from a branch"
  - Branch: "main"
  - Folder: "/docs" o usar GitHub Actions (recomendado)

### **1.4 Habilitar GitHub Actions (Recomendado)**

1. **Ir a Actions** en el repositorio

1. **Habilitar workflows** si están deshabilitados

1. **Verificar** que el archivo `.github/workflows/deploy.yml` esté presente

1. **Configurar permisos**:
  - Settings → Actions → General
  - Workflow permissions: "Read and write permissions"

## 📊 Paso 2: Configurar Google Sheets

### **2.1 Preparar la Hoja de Cálculo**

1. **Abrir** el archivo `CONTABILIDADSISTEMALOSMOLLES.xlsx`

1. **Subir a Google Drive** y convertir a Google Sheets

1. **Verificar** que todas las hojas estén presentes:
  - Residentes
  - Pagos_GC
  - Convenios
  - Cuotas_Convenio
  - Egresos
  - Ingresos_Extra
  - Proveedores
  - Categorias_Egresos
  - Comunicaciones
  - Tareas
  - Multas
  - Asambleas
  - Configuracion
  - TIMC

### **2.2 Obtener el ID de la Hoja de Cálculo**

1. **Abrir** la hoja de cálculo en Google Sheets

1. **Copiar el ID** de la URL:

1. **Guardar** este ID para el siguiente paso

### **2.3 Configurar Permisos**

1. **Compartir** la hoja de cálculo

1. **Agregar** el email que usarás para Google Apps Script

1. **Permisos**: "Editor" como mínimo

## ⚙️ Paso 3: Configurar Google Apps Script

### **3.1 Crear el Proyecto**

1. **Ir a** [script.google.com](https://script.google.com)

1. **Crear** un nuevo proyecto

1. **Nombrar** el proyecto: "CRM Los Molles Backend"

### **3.2 Copiar el Código**

1. **Abrir** el archivo `google-apps-script.js`

1. **Seleccionar todo** el contenido (Ctrl+A)

1. **Copiar** el código (Ctrl+C)

1. **Pegar** en el editor de Google Apps Script

1. **Reemplazar** la línea:

### **3.3 Guardar y Probar**

1. **Guardar** el proyecto (Ctrl+S)

1. **Ejecutar** la función `testFunction` para probar

1. **Autorizar** los permisos cuando se solicite

### **3.4 Desplegar como Web App**

1. **Ir a** "Implementar" → "Nueva implementación"

1. **Configurar**:
  - Tipo: "Aplicación web"
  - Descripción: "CRM Los Molles API v1.0"
  - Ejecutar como: "Yo (tu email)"
  - Quién tiene acceso: "Cualquier persona"

1. **Implementar** y copiar la URL generada

1. **Guardar** la URL (termina en `/exec`)

## 🌐 Paso 4: Configurar la Aplicación Web

### **4.1 Acceder a la Aplicación**

1. **Esperar** a que GitHub Pages se despliegue (5-10 minutos)

1. **Ir a** [https://condominiolosmolles.github.io/AdmConLosMolles/](https://condominiolosmolles.github.io/AdmConLosMolles/)

1. **Verificar** que la aplicación carga correctamente

### **4.2 Configurar la Conexión**

1. **La aplicación** mostrará automáticamente la página de configuración

1. **Pegar** la URL del Web App de Google Apps Script

1. **Hacer clic** en "Configurar Conexión"

1. **Probar** la conexión para verificar que funciona

### **4.3 Verificar Funcionalidad**

1. **Navegar** a cada módulo del sistema

1. **Verificar** que los datos se cargan correctamente

1. **Probar** agregar/editar registros

1. **Confirmar** que los cambios se reflejan en Google Sheets

## 🔒 Paso 5: Configuración de Seguridad

### **5.1 Configurar Permisos de Google Sheets**

1. **Limitar acceso** a la hoja de cálculo

1. **Solo usuarios autorizados** deben tener permisos de edición

1. **Configurar notificaciones** de cambios

### **5.2 Configurar Google Apps Script**

1. **Revisar permisos** del script

1. **Limitar acceso** solo a usuarios necesarios

1. **Habilitar logs** para auditoría

### **5.3 Monitoreo**

1. **Configurar alertas** en Google Sheets para cambios importantes

1. **Revisar logs** de Google Apps Script regularmente

1. **Hacer respaldos** periódicos de los datos

## 📋 Paso 6: Pruebas Finales

### **6.1 Lista de Verificación**

- [ ] **Aplicación carga** correctamente en GitHub Pages

- [ ] **Conexión con Google Sheets** funciona

- [ ] **Todos los módulos** son accesibles

- [ ] **Datos se muestran** correctamente

- [ ] **Formularios funcionan** para agregar/editar

- [ ] **Búsquedas y filtros** operan correctamente

- [ ] **Diseño neumorphism** se ve bien en diferentes dispositivos

- [ ] **Navegación** es fluida y sin errores

### **6.2 Pruebas de Funcionalidad**

| Módulo | Prueba | Estado |
| --- | --- | --- |
| **Dashboard** | Estadísticas se actualizan | ⏳ |
| **Residentes** | Agregar/editar residente | ⏳ |
| **Pagos GC** | Registrar nuevo pago | ⏳ |
| **Convenios** | Crear convenio | ⏳ |
| **Configuración** | Cambiar URL de conexión | ⏳ |

### **6.3 Pruebas de Rendimiento**

- **Tiempo de carga** inicial: < 3 segundos

- **Respuesta de API**: < 2 segundos

- **Navegación** entre módulos: < 1 segundo

- **Actualización** de datos: < 5 segundos

## 🚨 Solución de Problemas Comunes

### **Error: "No se puede conectar con Google Sheets"**

**Posibles causas:**

- URL del Web App incorrecta

- Permisos insuficientes en Google Apps Script

- ID de hoja de cálculo incorrecto

**Soluciones:**

1. Verificar que la URL termine en `/exec`

1. Revisar permisos en Google Apps Script

1. Confirmar el ID de la hoja de cálculo

### **Error: "Aplicación no carga en GitHub Pages"**

**Posibles causas:**

- GitHub Pages no habilitado

- Archivos no están en la rama correcta

- Error en el build de la aplicación

**Soluciones:**

1. Verificar configuración de GitHub Pages

1. Confirmar que los archivos están en `/dist`

1. Revisar logs de GitHub Actions

### **Error: "Datos no se actualizan"**

**Posibles causas:**

- Estructura de hojas incorrecta

- Nombres de columnas no coinciden

- Permisos de escritura insuficientes

**Soluciones:**

1. Verificar estructura de Google Sheets

1. Confirmar nombres de columnas

1. Revisar permisos de la hoja de cálculo

## 📞 Soporte Técnico

### **Recursos de Ayuda**

- **Documentación**: README.md del proyecto

- **Logs de GitHub**: Actions → Workflows

- **Logs de Google Apps Script**: Executions en el editor

- **Consola del navegador**: F12 → Console

### **Contacto**

Para soporte técnico adicional:

- **Email**: [soporte@losmolles.cl](mailto:soporte@losmolles.cl)

- **Teléfono**: +56 9 XXXX XXXX

- **Horario**: Lunes a Viernes, 9:00 - 18:00

## 📈 Próximos Pasos

### **Mejoras Inmediatas**

1. **Configurar respaldos** automáticos

1. **Implementar notificaciones** por email

1. **Agregar más validaciones** de datos

1. **Optimizar rendimiento** de consultas

### **Desarrollo Futuro**

1. **Módulos adicionales** según necesidades

1. **Aplicación móvil** nativa

1. **Integración con sistemas** de pago

1. **Dashboard avanzado** con gráficos

---

## ✅ Checklist Final de Despliegue

- [ ] **Repositorio GitHub** configurado y actualizado

- [ ] **GitHub Pages** habilitado y funcionando

- [ ] **Google Sheets** preparado con estructura correcta

- [ ] **Google Apps Script** desplegado como Web App

- [ ] **Aplicación web** conectada y funcionando

- [ ] **Pruebas completas** realizadas y exitosas

- [ ] **Documentación** revisada y actualizada

- [ ] **Usuarios finales** notificados y capacitados

**¡Felicitaciones! El CRM Condominio Los Molles está listo para usar.**

---

*Desarrollado con ❤️ por Manus AI - Sistema profesional para la administración moderna de condominios*

