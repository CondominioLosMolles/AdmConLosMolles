// Servicio para integración con Google Sheets API
class GoogleSheetsService {
  constructor() {
    // URL base del Google Apps Script desplegado como Web App
    this.baseURL = null; // Se configurará desde la interfaz
    this.isConfigured = false;
  }

  // Configurar la URL del Google Apps Script
  configure(webAppURL) {
    this.baseURL = webAppURL;
    this.isConfigured = true;
    // Guardar en localStorage para persistencia
    localStorage.setItem('googleSheetsURL', webAppURL);
  }

  // Cargar configuración desde localStorage
  loadConfiguration() {
    const savedURL = localStorage.getItem('googleSheetsURL');
    if (savedURL) {
      this.configure(savedURL);
    }
  }

  // Método genérico para hacer llamadas a Google Apps Script
  async callGoogleScript(functionName, parameters = []) {
    if (!this.isConfigured) {
      throw new Error('Google Sheets no está configurado. Configure la URL del Web App primero.');
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          functionName: functionName,
          parameters: parameters
        })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'error') {
        throw new Error(result.error.message);
      }

      return result.data === null || result.data === undefined ? [] : result.data;
    } catch (error) {
      console.error('Error calling Google Script:', error);
      throw error;
    }
  }

  // Método genérico para obtener datos (GET)
  async getData(action) {
    if (!this.isConfigured) {
      throw new Error('Google Sheets no está configurado. Configure la URL del Web App primero.');
    }

    try {
      const url = `${this.baseURL}?action=${action}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        return result.data === null || result.data === undefined ? [] : result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error getting data:', error);
      throw error;
    }
  }

  // === MÉTODOS ESPECÍFICOS PARA RESIDENTES ===
  async obtenerResidentes() {
    return await this.getData('obtenerResidentes');
  }

  async agregarResidente(datosResidente) {
    return await this.callGoogleScript('agregarResidente_GS', [datosResidente]);
  }

  async actualizarResidente(datosResidente) {
    return await this.callGoogleScript('actualizarResidente_GS', [datosResidente]);
  }

  // === MÉTODOS ESPECÍFICOS PARA PAGOS GC ===
  async obtenerPagosGC() {
    return await this.getData('obtenerPagosGC');
  }

  async agregarPagoGC(datosPago) {
    return await this.callGoogleScript('agregarPagoGC_GS', [datosPago]);
  }

  async actualizarPagoGC(datosPago) {
    return await this.callGoogleScript('actualizarPagoGC_GS', [datosPago]);
  }

  async obtenerEstadoDeCuenta(nParcela) {
    return await this.callGoogleScript('obtenerEstadoDeCuenta', [nParcela]);
  }

  async obtenerResumenDeuda(nParcela) {
    return await this.callGoogleScript('obtenerResumenDeuda', [nParcela]);
  }

  // === MÉTODOS ESPECÍFICOS PARA CONVENIOS ===
  async obtenerConvenios() {
    return await this.getData('obtenerConvenios');
  }

  async obtenerCuotasConvenio() {
    return await this.getData('obtenerCuotasConvenio');
  }

  async crearConvenio(datosConvenio) {
    return await this.callGoogleScript('crearConvenio', [datosConvenio]);
  }

  async formalizarConvenio(nParcela, urlConvenio) {
    return await this.callGoogleScript('formalizarConvenio_GS', [nParcela, urlConvenio]);
  }

  // === MÉTODOS ESPECÍFICOS PARA EGRESOS ===
  async obtenerEgresos() {
    return await this.getData('obtenerEgresos');
  }

  async agregarEgreso(datosEgreso) {
    return await this.callGoogleScript('agregarEgreso_GS', [datosEgreso]);
  }

  // === MÉTODOS ESPECÍFICOS PARA INGRESOS EXTRA ===
  async obtenerIngresosExtra() {
    return await this.getData('obtenerIngresosExtra');
  }

  async agregarIngresoExtra(datosIngreso) {
    return await this.callGoogleScript('agregarIngresoExtra_GS', [datosIngreso]);
  }

  // === MÉTODOS ESPECÍFICOS PARA PROVEEDORES ===
  async obtenerProveedores() {
    return await this.getData('obtenerProveedores');
  }

  async agregarProveedor(datosProveedor) {
    return await this.callGoogleScript('agregarProveedor_GS', [datosProveedor]);
  }

  // === MÉTODOS ESPECÍFICOS PARA CATEGORÍAS ===
  async obtenerCategoriasEgresos() {
    return await this.getData('obtenerCategoriasEgresos');
  }

  // === MÉTODOS ESPECÍFICOS PARA COMUNICACIONES ===
  async obtenerComunicaciones() {
    return await this.getData('obtenerComunicaciones');
  }

  async agregarComunicacion(datosComunicacion) {
    return await this.callGoogleScript('agregarComunicacion_GS', [datosComunicacion]);
  }

  // === MÉTODOS ESPECÍFICOS PARA TAREAS ===
  async obtenerTareas() {
    return await this.getData('obtenerTareas');
  }

  async agregarTarea(datosTarea) {
    return await this.callGoogleScript('agregarTarea_GS', [datosTarea]);
  }

  // === MÉTODOS ESPECÍFICOS PARA MULTAS ===
  async obtenerMultas() {
    return await this.getData('obtenerMultas');
  }

  async agregarMulta(datosMulta) {
    return await this.callGoogleScript('agregarMulta_GS', [datosMulta]);
  }

  // === MÉTODOS ESPECÍFICOS PARA ASAMBLEAS ===
  async obtenerAsambleas() {
    return await this.getData('obtenerAsambleas');
  }

  async agregarAsamblea(datosAsamblea) {
    return await this.callGoogleScript('agregarAsamblea_GS', [datosAsamblea]);
  }

  // === MÉTODOS ESPECÍFICOS PARA CONFIGURACIÓN ===
  async obtenerConfiguracion() {
    return await this.getData('obtenerConfiguracion');
  }

  async guardarTIMC(anio, mes, valor) {
    return await this.callGoogleScript('guardarTIMC_GS', [anio, mes, valor]);
  }

  // === MÉTODOS ESPECÍFICOS PARA CORREOS ===
  async enviarCorreoComprobante(destinatario, asunto, cuerpo) {
    return await this.callGoogleScript('enviarCorreoComprobante_GS', [destinatario, asunto, cuerpo]);
  }

  async enviarCorreoConvenio(datosResidente, datosConvenio) {
    return await this.callGoogleScript('enviarCorreoConvenio_GS', [datosResidente, datosConvenio]);
  }

  async enviarAvisosDeCobro() {
    return await this.callGoogleScript('enviarAvisosDeCobro', []);
  }

  async marcarComprobanteEnviado(rowNum) {
    return await this.callGoogleScript('marcarComprobanteEnviado_GS', [rowNum]);
  }

  // === MÉTODOS PARA PROCESAMIENTO AUTOMÁTICO ===
  async generarRegistrosDeMora() {
    return await this.callGoogleScript('generarRegistrosDeMora', []);
  }

  // === MÉTODO PARA VERIFICAR CONEXIÓN ===
  async verificarConexion() {
    try {
      await this.obtenerConfiguracion();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Crear instancia singleton del servicio
const googleSheetsService = new GoogleSheetsService();

// Cargar configuración al inicializar
googleSheetsService.loadConfiguration();

export default googleSheetsService;
