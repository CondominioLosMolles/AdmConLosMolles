## Instrucciones de Despliegue Final para GitHub Pages

Sigue estos pasos cuidadosamente para desplegar tu aplicación CRM en GitHub Pages y asegurarte de que funcione correctamente.

### Paso 1: Preparar tu Repositorio de GitHub

1.  **Descarga el archivo `condominio-crm.zip`** que te he proporcionado.
2.  **Descomprime el archivo `condominio-crm.zip`** en tu computadora. Esto creará una carpeta llamada `condominio-crm`.
3.  **Elimina el contenido actual de tu repositorio de GitHub** (excepto la carpeta `.git` si estás trabajando localmente y quieres mantener el historial). Si estás subiendo directamente a través de la interfaz web de GitHub, puedes crear un nuevo repositorio o asegurarte de que el repositorio existente esté vacío antes de subir los nuevos archivos.
4.  **Sube todo el contenido de la carpeta `condominio-crm`** (incluyendo las carpetas `docs`, `src`, `.github`, `public`, y todos los archivos de configuración como `vite.config.js`, `package.json`, etc.) a la **raíz** de tu repositorio de GitHub. Asegúrate de que la carpeta `docs` esté directamente en la raíz de tu repositorio.

    *   **Importante:** Asegúrate de que no haya un archivo `index.html` en la raíz de tu repositorio que no sea el que está dentro de la carpeta `docs`. El `index.html` principal de tu aplicación debe estar en `condominio-crm/docs/index.html`.

### Paso 2: Configurar GitHub Pages

Una vez que hayas subido todos los archivos, configura GitHub Pages de la siguiente manera:

1.  **Ve a tu repositorio** en GitHub (por ejemplo, `https://github.com/condominiolosmolles/AdmConLosMolles`).
2.  Haz clic en la pestaña **`Settings`** (Configuración).
3.  En el menú lateral izquierdo, haz clic en **`Pages`**.
4.  En la sección `Build and deployment`:
    *   Asegúrate de que `Source` esté configurado como **`Deploy from a branch`**.
    *   En `Branch`, selecciona la rama **`master`** (o `main`, dependiendo de cómo se llame tu rama principal).
    *   En `Folder`, selecciona **`/docs`**.
5.  Haz clic en el botón **`Save`** (Guardar).

GitHub Pages tardará unos minutos en desplegar la aplicación. Verás un mensaje que indica que tu sitio está siendo publicado en `https://condominiolosmolles.github.io/AdmConLosMolles/`.

### Paso 3: Configurar Google Apps Script

1.  **Crea un nuevo proyecto de Google Apps Script:**
    *   Ve a [script.google.com](https://script.google.com/).
    *   Haz clic en `New project` (Nuevo proyecto).
2.  **Copia el contenido del archivo `google-apps-script.js`** que te he proporcionado y pégalo en el editor de código de Google Apps Script, reemplazando cualquier código existente.
3.  **Guarda el proyecto** (Ctrl+S o Archivo > Guardar).
4.  **Despliega el script como una aplicación web:**
    *   Haz clic en `Deploy` (Desplegar) en la parte superior derecha y selecciona `New deployment` (Nueva implementación).
    *   En `Select type` (Seleccionar tipo), elige `Web app` (Aplicación web).
    *   Configura los siguientes campos:
        *   `Description`: `CRM Condominio API`
        *   `Execute as`: `Me` (tu correo electrónico)
        *   `Who has access`: `Anyone` (Cualquier persona)
    *   Haz clic en `Deploy` (Desplegar).
5.  **Autoriza el script:** La primera vez que lo despliegues, Google te pedirá que autorices el script para acceder a tus hojas de cálculo. Sigue las indicaciones para conceder los permisos necesarios.
6.  **Copia la URL de la aplicación web:** Una vez desplegado, se te proporcionará una `Web app URL`. **Copia esta URL**, la necesitarás para la aplicación React.

### Paso 4: Conectar la Aplicación React con Google Sheets

1.  Abre tu aplicación desplegada en GitHub Pages (`https://condominiolosmolles.github.io/AdmConLosMolles/`).
2.  Navega a la sección de **Configuración de Google Sheets** dentro de la aplicación.
3.  Pega la `Web app URL` que copiaste en el paso anterior en el campo correspondiente.
4.  Haz clic en el botón para **probar la conexión** y guardar la configuración.

¡Con estos pasos, tu aplicación CRM debería estar completamente funcional y conectada a tu Google Sheet!
