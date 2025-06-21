import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuthDispatch, useAuthState } from '../../contexts/AuthContext';
import { loginUser } from '../../contexts/AuthContext'; // Importar la acción
import CustomButton from '../../components/common/Button'; // Usar el botón personalizado
import appColors from '../../constants/colors';

// Mock de usuarios para demostración inicial en authService.js:
// Email: juan.perez@email.com, Pass: res123 (Residente)
// Email: admin@condominio.com, Pass: admin123 (Admin)
// Estos deben existir en MOCK_SHEETS_DB en googleApiService.js con un campo 'password_simulado'

const LoginScreen = ({ navigation }) => { // navigation prop es inyectada por React Navigation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useAuthDispatch();
  const { isLoading, error } = useAuthState(); // Obtener isLoading y error del contexto

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingrese email y contraseña.');
      return;
    }
    const response = await loginUser(dispatch, email, password);
    // La navegación se maneja automáticamente por AppNavigator al cambiar isAuthenticated
    // Pero podemos mostrar un error si la respuesta de loginUser lo indica
    if (response && response.error) {
      // El error ya se establece en el AuthContext, que podría mostrarlo en otro lugar
      // o podemos mostrar una alerta aquí también.
      Alert.alert('Error de Inicio de Sesión', response.error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido al Condominio</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={appColors.mediumGray}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={appColors.mediumGray}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isLoading ? (
        <ActivityIndicator size="large" color={appColors.primary} />
      ) : (
        <CustomButton title="Ingresar" onPress={handleLogin} />
      )}
      {/* Aquí podrían ir enlaces para "Olvidé mi contraseña" o "Registrarse" */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
});

export default LoginScreen;
