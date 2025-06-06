/**
 * CondoAdmin - Sistema de Administración de Condominios
 * Configuración de la aplicación
 */

const CONFIG = {
    // ID de cliente de OAuth de Google Cloud Platform
    CLIENT_ID: '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com',
    
    // API Key de Google Cloud Platform (opcional)
    API_KEY: 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU',
    
    // ID del documento de Google Sheets
    SPREADSHEET_ID: '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8',
    
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
        NAME: 'LosMolles',
        VERSION: '1.0.0',
        MAX_RESIDENTES: 30,
        CURRENCY: '$',
        LANGUAGE: 'es-CL',
        TIMEZONE: 'America/Santiago'
    }
};

