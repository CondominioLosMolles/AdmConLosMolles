import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
// import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen'; // Si se implementa
// import RegisterScreen from '../screens/Auth/RegisterScreen'; // Si se implementa para auto-registro

const Stack = createStackNavigator();

const AuthStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} /> */}
      {/* <Stack.Screen name="Register" component={RegisterScreen} /> */}
    </Stack.Navigator>
  );
};

export default AuthStackNavigator;
