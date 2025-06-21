import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import appColors from '../../constants/colors'; // Suponiendo que colors.js existe

const MainContainer = ({ children, style, statusBarColor, statusBarStyle = 'default' }) => {
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: statusBarColor || appColors.background }]}>
      <StatusBar
        backgroundColor={statusBarColor || appColors.background}
        barStyle={statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
      />
      <View style={[styles.container, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15, // Padding general
    paddingVertical: 10,
    backgroundColor: appColors.background || '#f5f5f5', // Color de fondo o default
  },
});

export default MainContainer;
