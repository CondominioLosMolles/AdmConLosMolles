import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import appColors from '../../constants/colors';

const LoadingScreen = ({ message = "Cargando..." }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={appColors.primary} />
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.background || '#FFFFFF',
  },
  messageText: {
    marginTop: 10,
    fontSize: 16,
    color: appColors.textSecondary || '#333333',
  }
});

export default LoadingScreen;
