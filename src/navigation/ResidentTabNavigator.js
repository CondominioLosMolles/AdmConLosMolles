import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/Ionicons'; // Ejemplo de librería de iconos
import appColors from '../constants/colors';

// Importar pantallas del Residente
import ResidentDashboardScreen from '../screens/Resident/ResidentDashboardScreen';
import GastosComunesScreen from '../screens/Resident/GastosComunesScreen'; // Asegurarse que esta ruta es correcta
import RequerimientosScreen from '../screens/Resident/RequerimientosScreen'; // Placeholder
import AsambleasScreen from '../screens/Resident/AsambleasScreen'; // Placeholder
import ChatScreen from '../screens/Resident/ChatScreen'; // Podría ser un Stack anidado si tiene múltiples pantallas

const Tab = createBottomTabNavigator();

const ResidentTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // Lógica para seleccionar el icono basado en la ruta y el estado (focused)
          // Ejemplo:
          // if (route.name === 'Inicio') {
          //   iconName = focused ? 'home' : 'home-outline';
          // } else if (route.name === 'Gastos') {
          //   iconName = focused ? 'wallet' : 'wallet-outline';
          // } // ... etc.
          // return <Icon name={iconName} size={size} color={color} />;
          return null; // Placeholder hasta tener iconos
        },
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.mediumGray,
        headerStyle: { backgroundColor: appColors.headerBackground },
        headerTitleStyle: { color: appColors.textPrimary },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={ResidentDashboardScreen} // Esta será la pantalla principal del residente
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Gastos"
        component={GastosComunesScreen} // Placeholder, se creará
        options={{ title: 'Gastos Comunes' }}
      />
      <Tab.Screen
        name="Requerimientos"
        component={RequerimientosScreen} // Placeholder, se creará
        options={{ title: 'Requerimientos' }}
      />
      <Tab.Screen
        name="Asambleas"
        component={AsambleasScreen} // Placeholder, se creará
        options={{ title: 'Asambleas' }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen} // Placeholder, se creará
        options={{ title: 'Chat Admin' }}
      />
      {/* Aquí podrían ir más tabs como Certificados o Perfil */}
    </Tab.Navigator>
  );
};

// Crear pantallas placeholder para que el navegador no falle
const CreatePlaceholderScreen = (name) => () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Screen (Placeholder)</Text>
  </View>
);

// Si las pantallas no existen, crearlas como placeholders
if (!ResidentDashboardScreen) {
  const ResidentDashboardScreen = CreatePlaceholderScreen("ResidentDashboard");
}
if (!GastosComunesScreen) {
  const GastosComunesScreen = CreatePlaceholderScreen("GastosComunes");
}
if (!RequerimientosScreen) {
  const RequerimientosScreen = CreatePlaceholderScreen("Requerimientos");
}
if (!AsambleasScreen) {
  const AsambleasScreen = CreatePlaceholderScreen("Asambleas");
}
if (!ChatScreen) {
  const ChatScreen = CreatePlaceholderScreen("Chat");
}


export default ResidentTabNavigator;
