// import appConfig from '../config/appConfig'; // Para URLs de API, etc.
import googleApiService from './googleApiService.js'; // Para verificar usuarios contra la "base de datos" de Sheets
import { ROLES } from '../models/Residente.js'; // Importar roles

/**
 * Servicio de autenticación.
 * En una aplicación real, esto interactuaría con un backend.
 * Aquí, simularemos la lógica usando googleApiService para leer de 'residentesSheet'.
 */
const authService = {
  /**
   * Simula el inicio de sesión de un usuario.
   * @param {string} email - Email del usuario.
   * @param {string} password - Contraseña del usuario.
   * @returns {Promise<{user: Object, token: string} | {error: string}>}
   */
  login: async (email, password) => {
    console.log(`[AuthService SIM] Intentando login para email: ${email}`);
    try {
      // Leer la "tabla" de residentes/usuarios desde Google Sheets (simulado)
      const usuariosRegistrados = await googleApiService.getSheetData('residentesSheet', 'Sheet1');

      const usuarioEncontrado = usuariosRegistrados.find(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
      );

      if (!usuarioEncontrado) {
        console.warn(`[AuthService SIM] Usuario no encontrado: ${email}`);
        return { error: 'Usuario o contraseña incorrectos.' };
      }

      // Simulación de verificación de contraseña
      // En una app real, NUNCA almacenar contraseñas en texto plano.
      // Se compararía un hash de la contraseña enviada con un hash almacenado.
      // Para la simulación, usaremos una contraseña mock o una lógica simple.
      // Asumamos que la hoja 'residentesSheet' tiene un campo 'password_simulado'
      if (usuarioEncontrado.password_simulado === password) {
        console.log(`[AuthService SIM] Login exitoso para: ${email}`);
        const user = {
          id_residente: usuarioEncontrado.id_residente,
          nombre: usuarioEncontrado.nombre,
          email: usuarioEncontrado.email,
          parcela: usuarioEncontrado.parcela,
          rol: usuarioEncontrado.rol || ROLES.RESIDENTE, // Asignar rol por defecto si no está
        };
        // Generar un token simulado
        const token = `sim_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        return { user, token };
      } else {
        console.warn(`[AuthService SIM] Contraseña incorrecta para: ${email}`);
        return { error: 'Usuario o contraseña incorrectos.' };
      }
    } catch (e) {
      console.error('[AuthService SIM] Error durante el login:', e);
      return { error: 'Error en el servidor al intentar iniciar sesión.' };
    }
  },

  /**
   * Simula el cierre de sesión.
   * En una app real, podría invalidar el token en el backend.
   */
  logout: async () => {
    console.log('[AuthService SIM] Usuario cerró sesión.');
    // Aquí se podría llamar a un endpoint de logout en el backend.
    return Promise.resolve();
  },

  /**
   * Simula la verificación de un token.
   * @param {string} token - El token a verificar.
   * @returns {Promise<Object|null>} - Los datos del usuario si el token es válido, sino null.
   */
  verifyToken: async (token) => {
    console.log(`[AuthService SIM] Verificando token: ${token}`);
    if (token && token.startsWith('sim_token_')) {
      // En una simulación, podríamos extraer datos del token si los codificamos allí,
      // o simplemente asumir que es válido y devolver un usuario mock o buscarlo.
      // Por ahora, si el token parece válido, buscamos un usuario mock.
      // Esto es muy simplificado.
      try {
        const usuariosRegistrados = await googleApiService.getSheetData('residentesSheet', 'Sheet1');
        // Devolver el primer usuario admin o residente para la simulación de sesión persistida
        const mockUser = usuariosRegistrados.find(u => u.rol === ROLES.ADMINISTRADOR) || usuariosRegistrados[0];
        if (mockUser) {
          return {
            id_residente: mockUser.id_residente,
            nombre: mockUser.nombre,
            email: mockUser.email,
            parcela: mockUser.parcela,
            rol: mockUser.rol,
          };
        }
      } catch (e) {
        console.error('[AuthService SIM] Error al verificar token (buscando usuario):', e);
        return null;
      }
    }
    return null;
  },

  /**
   * Simula el registro de un nuevo usuario.
   * (Esta función sería más para el administrador creando cuentas)
   * @param {Object} userData - Datos del nuevo usuario.
   * @returns {Promise<{user: Object} | {error: string}>}
   */
  register: async (userData) => {
    console.log('[AuthService SIM] Registrando nuevo usuario:', userData);
    // Lógica para añadir el usuario a 'residentesSheet' a través de googleApiService.appendSheetRow
    // Asegurarse de no duplicar emails, generar ID, "hashear" contraseña simulada, etc.
    // const nuevoResidente = {
    //   id_residente: `res_${Date.now()}`,
    //   ...userData,
    //   password_simulado: userData.password, // ¡NO HACER ESTO EN PRODUCCIÓN!
    //   rol: userData.rol || ROLES.RESIDENTE,
    // };
    // delete nuevoResidente.password;
    // const result = await googleApiService.appendSheetRow('residentesSheet', 'Sheet1', nuevoResidente);
    // if (result.success) {
    //   return { user: result.newRow };
    // } else {
    //   return { error: 'Error al registrar usuario.' };
    // }
    return { error: 'Función de registro no implementada completamente en simulación.' };
  },
};

export default authService;
