import { useAuthState, useAuthDispatch } from '../contexts/AuthContext';
// import authService from '../services/authService'; // Se importará cuando authService esté implementado
// import AsyncStorage from '@react-native-async-storage/async-storage'; // Para persistir sesión

/**
 * Hook personalizado para acceder al estado de autenticación y funciones de dispatch.
 * Proporciona una API simplificada para interactuar con la autenticación.
 */
export const useAuth = () => {
  const state = useAuthState();
  const dispatch = useAuthDispatch();

  // Aquí podrían ir funciones de conveniencia que usan authService
  // Ejemplo:
  // const login = async (credentials) => {
  //   dispatch({ type: 'LOGIN_REQUEST' });
  //   try {
  //     const data = await authService.login(credentials); // { user, token }
  //     if (data.user && data.token) {
  //       await AsyncStorage.setItem('userToken', data.token);
  //       await AsyncStorage.setItem('userData', JSON.stringify(data.user));
  //       dispatch({ type: 'LOGIN_SUCCESS', payload: data });
  //       return data;
  //     } else {
  //       throw new Error(data.error || 'Error desconocido en login');
  //     }
  //   } catch (error) {
  //     dispatch({ type: 'LOGIN_FAILURE', payload: { error: error.message } });
  //     return { error: error.message };
  //   }
  // };

  // const logout = async () => {
  //   await AsyncStorage.removeItem('userToken');
  //   await AsyncStorage.removeItem('userData');
  //   // await authService.logout(); // Si hay limpieza en backend
  //   dispatch({ type: 'LOGOUT' });
  // };

  // const checkInitialAuth = async () => {
  //   dispatch({ type: 'SET_LOADING', payload: { isLoading: true } });
  //   const token = await AsyncStorage.getItem('userToken');
  //   const userDataString = await AsyncStorage.getItem('userData');
  //   if (token && userDataString) {
  //       try {
  //           const user = JSON.parse(userDataString);
  //           // Podrías querer verificar el token con el backend aquí
  //           // const isValid = await authService.verifyToken(token);
  //           // if (isValid) {
  //           dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token }});
  //           // } else { dispatch({ type: 'LOGOUT' }); }
  //       } catch (e) {
  //           dispatch({ type: 'LOGOUT' }); // Error parseando o token inválido
  //       }
  //   } else {
  //       dispatch({ type: 'LOGOUT' });
  //   }
  //   dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
  // };


  return {
    ...state,
    dispatch, // Exponer dispatch directamente para flexibilidad
    // login,  // Exponer funciones de conveniencia
    // logout,
    // checkInitialAuth, // Para llamar desde el AppNavigator o un componente de carga
  };
};
