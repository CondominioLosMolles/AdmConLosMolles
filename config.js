/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Configuración de la aplicación
 */

const CONFIG = {
    // ID de cliente de OAuth de Google Cloud Platform
    CLIENT_ID: 'YOUR_CLIENT_ID',
    
    // API Key de Google Cloud Platform (opcional)
    API_KEY: 'YOUR_API_KEY',
    
    // ID del documento de Google Sheets
    SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
    
    // Nombres de las hojas en el documento de Google Sheets
    SHEETS: {
        RESIDENTES: 'Residentes',
        GASTOS_COMUNES: 'Gastos_Comunes',
        PAGOS: 'Pagos',
        GASTOS: 'Gastos',
        MANTENCIONES: 'Mantenciones',
        COMUNICACIONES: 'Comunicaciones',
        MULTAS: 'Multas',
        ASAMBLEAS: 'Asambleas'
    },
    
    // Configuración de la aplicación
    APP: {
        NAME: 'CondoAdmin',
        VERSION: '1.0.0',
        MAX_RESIDENTES: 30,
        CURRENCY: '$',
        LANGUAGE: 'es-CL',
        TIMEZONE: 'America/Santiago'
    }
};

