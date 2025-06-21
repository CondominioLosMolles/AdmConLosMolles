import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import authService from '../services/authService'; // Se importará cuando authService esté implementado
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistir sesión

const AuthStateContext = createContext(undefined);
const AuthDispatchContext = createContext(undefined);

const initialAuthState = {
  isLoading: true,      // Para verificar si hay una sesión persistida al inicio
  isAuthenticated: false,
  user: null,           // Objeto del usuario (Residente o Administrador)
  token: null,          // Token de autenticación (si se usa)
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_REQUEST':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, isAuthenticated: false, error: action.payload.error, user: null, token: null };
    case 'LOGOUT':
      return { ...initialAuthState, isLoading: false }; // Restablecer al estado inicial, excepto isLoading
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.isLoading };
    case 'UPDATE_USER_DATA': // Para actualizar datos del usuario sin reloguear
        return { ...state, user: { ...state.user, ...action.payload.userData } };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Simulación de verificar sesión al inicio (reemplazar con AsyncStorage y authService)
  useEffect(() => {
    const checkUserSession = async () => {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });
      // Lógica para verificar token/sesión en AsyncStorage
      // const storedToken = await AsyncStorage.getItem('userToken');
      // if (storedToken) {
      //   try {
      //     const userData = await authService.verifyToken(storedToken); // Simulado
      //     if (userData) {
      //       dispatch({ type: 'LOGIN_SUCCESS', payload: { user: userData, token: storedToken } });
      //     } else {
      //       dispatch({ type: 'LOGOUT' }); // Token inválido
      //     }
      //   } catch (e) {
      //     dispatch({ type: 'LOGOUT' });
      //   }
      // } else {
      //   dispatch({ type: 'LOGOUT' }); // No hay sesión
      // }
      // Por ahora, simplemente simulamos que no hay sesión y terminamos la carga
      setTimeout(() => {
        dispatch({ type: 'LOGOUT' }); // Asegura que isLoading pase a false
      }, 500);
    };
    checkUserSession();
  }, []);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthDispatchContext.Provider value={dispatch}>
        {children}
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  );
};

export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
};

export const useAuthDispatch = () => {
  const context = useContext(AuthDispatchContext);
  if (context === undefined) {
    throw new Error('useAuthDispatch must be used within an AuthProvider');
  }
  return context;
};

// Ejemplo de acciones que se podrían exportar desde aquí o desde authService
import authService from '../services/authService'; // Descomentar para usar authService
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistir sesión

// ... (resto del AuthContext.js sin cambios hasta las funciones comentadas) ...

// Acciones de login y logout que pueden ser llamadas desde los componentes a través del dispatch o hooks.
export const loginUser = async (dispatch, email, password) => {
  dispatch({ type: 'LOGIN_REQUEST' });
  try {
    // En una app real, aquí iría la llamada al backend/servicio de autenticación.
    // const data = await authService.login(email, password);

    // Simulación basada en authService.js
    const data = await authService.login(email, password);

    if (data.user && data.token) {
      // await AsyncStorage.setItem('userToken', data.token); // Simulación: persistir token
      // await AsyncStorage.setItem('userData', JSON.stringify(data.user)); // Simulación: persistir datos de usuario
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data; // Devuelve los datos para posible manejo adicional en la pantalla
    } else {
      // Si authService.login devuelve { error: "mensaje" }
      dispatch({ type: 'LOGIN_FAILURE', payload: { error: data.error || 'Error desconocido en login' } });
      return { error: data.error || 'Error desconocido en login' };
    }
  } catch (error) {
    // Este catch es para errores inesperados en el proceso, no errores de login controlados (ej. credenciales inválidas)
    console.error("Error en loginUser (AuthContext):", error);
    dispatch({ type: 'LOGIN_FAILURE', payload: { error: error.message || 'Ocurrió un error inesperado.' } });
    return { error: error.message || 'Ocurrió un error inesperado.' };
  }
};

export const logoutUser = async (dispatch) => {
  // await AsyncStorage.removeItem('userToken');
  // await AsyncStorage.removeItem('userData');
  await authService.logout(); // Llama al servicio para cualquier limpieza necesaria (ej. invalidar token en backend)
  dispatch({ type: 'LOGOUT' });
};
