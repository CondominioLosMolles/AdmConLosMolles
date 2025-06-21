import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomButton from '../../components/common/Button';
import { useAuthDispatch, useAuthState } from '../../contexts/AuthContext';
import { logoutUser } from '../../contexts/AuthContext';
import appColors from '../../constants/colors';

const ResidentDashboardScreen = ({ navigation }) => { // navigation es provisto por React Navigation
  const dispatch = useAuthDispatch();
  const { user } = useAuthState(); // Obtener datos del usuario del contexto

  const handleLogout = async () => {
    await logoutUser(dispatch);
    // La navegación al LoginScreen es manejada automáticamente por AppNavigator
    // cuando isAuthenticated cambia a false.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Portal del Residente</Text>
      {user && (
        <>
          <Text style={styles.userInfo}>Bienvenido, {user.nombre}</Text>
          <Text style={styles.userInfo}>Parcela: {user.parcela}</Text>
        </>
      )}
      {/* Aquí se agregarán los módulos del residente */}
      <View style={styles.modulePlaceholder}>
        <Text style={styles.placeholderText}>Módulo Gastos Comunes (Próximamente)</Text>
      </View>
      <View style={styles.modulePlaceholder}>
        <Text style={styles.placeholderText}>Módulo Ingreso de Requerimientos (Próximamente)</Text>
      </View>
      <View style={styles.modulePlaceholder}>
        <Text style={styles.placeholderText}>Módulo Asambleas (Próximamente)</Text>
      </View>
      <View style={styles.modulePlaceholder}>
        <Text style={styles.placeholderText}>Módulo Descarga de Certificados (Próximamente)</Text>
      </View>
      <View style={styles.modulePlaceholder}>
        <Text style={styles.placeholderText}>Chat Interno (Próximamente)</Text>
      </View>
      <CustomButton
        title="Cerrar Sesión"
        onPress={handleLogout}
        style={styles.logoutButton}
        textStyle={styles.logoutButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  modulePlaceholder: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
  },
});

export default ResidentDashboard;
