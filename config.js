/**
 * CondoAdminLosMolles - Sistema de Administración de Condominios
 * Configuración de la aplicación
 */
const CONFIG = {
    CLIENT_ID: '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com',
    API_KEY: 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU',
    SPREADSHEET_ID: '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8',
    SHEETS: {
    RESIDENTES: 'Residentes',
    GASTOS_COMUNES: 'Gastos_Comunes', // Sin espacios
    PAGOS: 'Pagos',
    GASTOS: 'Gastos',
    MANTENCIONES: 'Mantenciones',
    COMUNICACIONES: 'Comunicaciones',
    MULTAS: 'Multas',
    ASAMBLEAS: 'Asambleas'
},
    APP: {
        NAME: 'CondoAdminLosMolles',
        VERSION: '1.0.0',
        MAX_RESIDENTES: 30,
        CURRENCY: '$',
        LANGUAGE: 'es-CL',
        TIMEZONE: 'America/Santiago'
    }
};
