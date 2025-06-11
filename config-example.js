// Configuración de ejemplo - DEBE SER PERSONALIZADA
const CONFIG = {
    // ⚠️ IMPORTANTE: Reemplazar con su Client ID de Google Cloud Console
    // Instrucciones en README.md
    GOOGLE_CLIENT_ID: '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com',
    
    // Email del administrador del condominio
    ADMIN_EMAIL: 'losmollestunquen@gmail.com',
    
    // Configuración de Google Sheets
    // Estos IDs se generarán automáticamente al crear las hojas
    SHEETS: {
        RESIDENTES: '',
        PAGOS_GC: '',
        EGRESOS: '',
        MANTENCIONES: '',
        MULTAS: '',
        ASAMBLEAS: '',
        COMUNICACIONES: ''
    },
    
    // Configuración de cálculos financieros (según normativa chilena)
    FINANCIAL: {
        // Tasa de interés mensual por mora (1.5% según Ley 21.442)
        INTERES_MORA_MENSUAL: 0.015,
        
        // Días de gracia antes de aplicar intereses
        DIAS_GRACIA: 10,
        
        // Multa adicional por mora prolongada (% del gasto común)
        MULTA_MORA_PROLONGADA: 0.1, // 10%
        
        // Días para aplicar multa adicional
        DIAS_MULTA_ADICIONAL: 60
    },
    
    // Configuración de asambleas (según Decreto 7)
    ASAMBLEAS: {
        // Días mínimos de anticipación para citación
        DIAS_ANTICIPACION_ORDINARIA: 15,
        DIAS_ANTICIPACION_EXTRAORDINARIA: 8
    },
    
    // Configuración de la aplicación
    APP: {
        NOMBRE_CONDOMINIO: 'Condominio Los Molles',
        VERSION: '1.0.0',
        DESARROLLADO_POR: 'Sistema de Administración Condominial'
    }
};

// Validación de configuración
function validateConfig() {
    if (CONFIG.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
        console.warn('⚠️ CONFIGURACIÓN PENDIENTE: Debe configurar su Google Client ID en config.js');
        return false;
    }
    return true;
}

// Exportar configuración
window.CONFIG = CONFIG;
window.validateConfig = validateConfig;

