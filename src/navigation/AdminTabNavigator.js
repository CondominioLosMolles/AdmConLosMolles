import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/Ionicons'; // Ejemplo
import appColors from '../constants/colors';

// Importar pantallas del Administrador (placeholders por ahora)
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen'; // Renombrar el existente
import GestionResidentesScreen from '../screens/Admin/GestionResidentesScreen';
import AdminGastosComunesScreen from '../screens/Admin/AdminGastosComunesScreen';
import GestionMantencionScreen from '../screens/Admin/GestionMantencionScreen';
// ... otras pantallas de admin

const Tab = createBottomTabNavigator();

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // Lógica para iconos
          // return <Icon name={iconName} size={size} color={color} />;
          return null; // Placeholder
        },
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.mediumGray,
        headerStyle: { backgroundColor: appColors.headerBackground },
        headerTitleStyle: { color: appColors.textPrimary },
      })}
    >
      <Tab.Screen
        name="DashboardAdmin"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="GestionResidentes"
        component={GestionResidentesScreen} // Placeholder
        options={{ title: 'Residentes' }}
      />
      <Tab.Screen
        name="AdminGastos"
        component={AdminGastosComunesScreen} // Placeholder
        options={{ title: 'Gastos Comunes' }}
      />
      <Tab.Screen
        name="Mantenciones"
        component={GestionMantencionScreen} // Placeholder
        options={{ title: 'Mantenciones' }}
      />
      {/* Más tabs: Informes, Comunicaciones, Asambleas (Admin) */}
    </Tab.Navigator>
  );
};

// Crear pantallas placeholder
const CreatePlaceholderScreen = (name) => () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{name} Screen (Placeholder)</Text>
  </View>
);

if (!AdminDashboardScreen) {
  const AdminDashboardScreen = CreatePlaceholderScreen("AdminDashboard");
}
if (!GestionResidentesScreen) {
  const GestionResidentesScreen = CreatePlaceholderScreen("GestionResidentes");
}
if (!AdminGastosComunesScreen) {
  const AdminGastosComunesScreen = CreatePlaceholderScreen("AdminGastosComunes");
}
if (!GestionMantencionScreen) {
  const GestionMantencionScreen = CreatePlaceholderScreen("GestionMantencion");
}


export default AdminTabNavigator;
