import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { useAuth } from '../hooks/useAuth'; // Hook para obtener el estado de autenticación
import AuthStackNavigator from './AuthStackNavigator';
import ResidentTabNavigator from './ResidentTabNavigator'; // Se creará después
import AdminTabNavigator from './AdminTabNavigator'; // Se creará después
import LoadingScreen from '../screens/Common/LoadingScreen'; // Una pantalla de carga genérica

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user, isLoading, checkInitialAuth } = useAuth();

  // useEffect(() => {
  //   // Esta lógica ahora está en AuthContext, pero podría ser llamada desde aquí si fuera necesario
  //   // checkInitialAuth();
  // }, [checkInitialAuth]);

  if (isLoading) {
    // Muestra una pantalla de carga mientras se verifica el estado de autenticación inicial
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          user.rol === 'administrador' ? ( // Asegúrate que 'user.rol' coincida con tu modelo
            <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
          ) : (
            <Stack.Screen name="ResidentApp" component={ResidentTabNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
