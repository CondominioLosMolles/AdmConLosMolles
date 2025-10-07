import { useState, useEffect, useCallback } from 'react';
import googleSheetsService from '../services/googleSheetsService';

// Hook personalizado para manejar datos de Google Sheets
export const useGoogleSheets = () => {
  const [isConfigured, setIsConfigured] = useState(googleSheetsService.isConfigured);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configurar la URL del Google Apps Script
  const configure = useCallback((webAppURL) => {
    try {
      googleSheetsService.configure(webAppURL);
      setIsConfigured(true);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Verificar conexión
  const verificarConexion = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isConnected = await googleSheetsService.verificarConexion();
      return isConnected;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isConfigured,
    isLoading,
    error,
    configure,
    verificarConexion,
    service: googleSheetsService
  };
};

// Hook específico para residentes
export const useResidentes = () => {
  const [residentes, setResidentes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarResidentes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.obtenerResidentes();
      setResidentes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const agregarResidente = useCallback(async (datosResidente) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.agregarResidente(datosResidente);
      await cargarResidentes(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarResidentes]);

  const actualizarResidente = useCallback(async (datosResidente) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.actualizarResidente(datosResidente);
      await cargarResidentes(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarResidentes]);

  useEffect(() => {
    if (googleSheetsService.isConfigured) {
      cargarResidentes();
    }
  }, [cargarResidentes]);

  return {
    residentes,
    isLoading,
    error,
    cargarResidentes,
    agregarResidente,
    actualizarResidente
  };
};

// Hook específico para pagos GC
export const usePagosGC = () => {
  const [pagos, setPagos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarPagos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.obtenerPagosGC();
      setPagos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const agregarPago = useCallback(async (datosPago) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.agregarPagoGC(datosPago);
      await cargarPagos(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarPagos]);

  const actualizarPago = useCallback(async (datosPago) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.actualizarPagoGC(datosPago);
      await cargarPagos(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarPagos]);

  const obtenerEstadoDeCuenta = useCallback(async (nParcela) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.obtenerEstadoDeCuenta(nParcela);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const obtenerResumenDeuda = useCallback(async (nParcela) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.obtenerResumenDeuda(nParcela);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (googleSheetsService.isConfigured) {
      cargarPagos();
    }
  }, [cargarPagos]);

  return {
    pagos,
    isLoading,
    error,
    cargarPagos,
    agregarPago,
    actualizarPago,
    obtenerEstadoDeCuenta,
    obtenerResumenDeuda
  };
};

// Hook específico para convenios
export const useConvenios = () => {
  const [convenios, setConvenios] = useState([]);
  const [cuotas, setCuotas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarConvenios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dataConvenios = await googleSheetsService.obtenerConvenios();
      const dataCuotas = await googleSheetsService.obtenerCuotasConvenio();
      setConvenios(dataConvenios);
      setCuotas(dataCuotas);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const crearConvenio = useCallback(async (datosConvenio) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.crearConvenio(datosConvenio);
      await cargarConvenios(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarConvenios]);

  const formalizarConvenio = useCallback(async (nParcela, urlConvenio) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.formalizarConvenio(nParcela, urlConvenio);
      await cargarConvenios(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarConvenios]);

  useEffect(() => {
    if (googleSheetsService.isConfigured) {
      cargarConvenios();
    }
  }, [cargarConvenios]);

  return {
    convenios,
    cuotas,
    isLoading,
    error,
    cargarConvenios,
    crearConvenio,
    formalizarConvenio
  };
};

// Hook específico para egresos
export const useEgresos = () => {
  const [egresos, setEgresos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarEgresos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await googleSheetsService.obtenerEgresos();
      setEgresos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const agregarEgreso = useCallback(async (datosEgreso) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.agregarEgreso(datosEgreso);
      await cargarEgresos(); // Recargar la lista
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cargarEgresos]);

  useEffect(() => {
    if (googleSheetsService.isConfigured) {
      cargarEgresos();
    }
  }, [cargarEgresos]);

  return {
    egresos,
    isLoading,
    error,
    cargarEgresos,
    agregarEgreso
  };
};

// Hook específico para correos
export const useCorreos = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const enviarCorreoComprobante = useCallback(async (destinatario, asunto, cuerpo) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.enviarCorreoComprobante(destinatario, asunto, cuerpo);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enviarCorreoConvenio = useCallback(async (datosResidente, datosConvenio) => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.enviarCorreoConvenio(datosResidente, datosConvenio);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enviarAvisosDeCobro = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await googleSheetsService.enviarAvisosDeCobro();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    enviarCorreoComprobante,
    enviarCorreoConvenio,
    enviarAvisosDeCobro
  };
};
