// Configuración de la aplicación
const CONFIG = {
    // Credenciales de Google API
    CLIENT_ID: '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com',
      
    // ID de la hoja de cálculo de Google Sheets
    SPREADSHEET_ID: '1bFo5dBC3HM0xupginTBe-hrrUNgkiuUn4fkXXzHide8',
    
    // Scopes necesarios para las APIs de Google
    SCOPES: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/gmail.send'
    ],
    
    // Configuración de las hojas de cálculo
    SHEETS: {
        RESIDENTES: 'Residentes',
        PAGOS_GC: 'Pagos_GC',
        EGRESOS: 'Egresos',
        MANTENCIONES: 'Mantenciones',
        MULTAS: 'Multas',
        ASAMBLEAS: 'Asambleas',
        COMUNICACIONES: 'Comunicaciones'
    },
    
    // Configuración de Google Drive
    DRIVE_FOLDERS: {
        ROOT: '/LosMolles',
        CONTABILIDAD: '/LosMolles/Contabilidad',
        PARCELA_PAGOS: '/LosMolles/Contabilidad/Parcela Pagos',
        EGRESOS: '/LosMolles/Contabilidad/Egresos',
        MANTENCIONES: '/LosMolles/Contabilidad/Mantenciones',
        ASAMBLEAS: '/LosMolles/Asambleas'
    },
    
    // Configuración de cálculos
    CALCULATIONS: {
        TMC: 2.5, // Tasa Máxima Convencional por defecto (2.5% mensual)
        MULTA_PORCENTAJE: 0.25, // 25% del valor del gasto común
        DIA_VENCIMIENTO: 10 // Día 10 de cada mes
    },
    
    // Email del administrador
    ADMIN_EMAIL: 'losmollestunquen@gmail.com'
};

// Exportar configuración para uso en otros módulos
window.CONFIG = CONFIG;

