import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthDispatch, useAuthState } from '../../contexts/AuthContext';
import { logoutUser } from '../../contexts/AuthContext';
import googleApiService from '../../services/googleApiService';
import appColors from '../../constants/colors';
import CustomButton from '../../components/common/Button';
// Modelos para constantes de estado (si se usan para filtrar)
// import { ESTADOS_REQUERIMIENTO } from '../../models/Requerimiento';
// import { ESTADOS_PAGO } from '../../models/GastoComun';

const AdminDashboardScreen = ({ navigation }) => {
  const dispatch = useAuthDispatch();
  const { user } = useAuthState();

  const [dashboardData, setDashboardData] = useState({
    requerimientosPendientes: 0,
    totalResidentes: 0,
    gastosPendientesMesActual: 0,
    proximasAsambleasCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if(!refreshing) setIsLoading(true);

    try {
      // Simulación de datos ya que las hojas de requerimientos y asambleas no están pobladas
      // y la lógica de filtrado por fecha/mes es compleja para simular sin datos reales.

      // 1. Requerimientos Pendientes (Simulado)
      // En una implementación real:
      // const requerimientos = await googleApiService.getSheetData(appConfig.GOOGLE_API_CONFIG.requerimientosSheetId, 'Sheet1');
      // const reqPendientes = requerimientos.filter(
      //   r => r.estado === ESTADOS_REQUERIMIENTO.ABIERTO || r.estado === ESTADOS_REQUERIMIENTO.EN_PROCESO
      // ).length;
      const reqPendientes = Math.floor(Math.random() * 10) + 1; // Simulación: entre 1 y 10

      // 2. Total Residentes
      const residentesData = await googleApiService.getSheetData('residentesSheet', 'Sheet1');
      const totalRes = residentesData.filter(r => r.rol === 'residente').length;

      // 3. Gastos Pendientes del Mes Actual (Simulado)
      // En una implementación real:
      // const gastos = await googleApiService.getSheetData(appConfig.GOOGLE_API_CONFIG.gastosComunesSheetId, 'Sheet1');
      // const hoy = new Date();
      // const mesActualNombre = hoy.toLocaleString('es-CL', { month: 'long' });
      // const anioActual = hoy.getFullYear();
      // const gastosPend = gastos.filter(
      //   g => (g.estado_pago === ESTADOS_PAGO.PENDIENTE || g.estado_pago === ESTADOS_PAGO.ATRASADO) &&
      //        g.mes.toLowerCase() === mesActualNombre.toLowerCase() && Number(g.anio) === anioActual
      // ).length;
      const gastosPend = Math.floor(Math.random() * 5); // Simulación

      // 4. Próximas Asambleas (Simulado)
      // En una implementación real:
      // const asambleas = await googleApiService.getSheetData(appConfig.GOOGLE_API_CONFIG.asambleasSheetId, 'Sheet1');
      // const hoyF = new Date();
      // hoyF.setHours(0,0,0,0); // Para comparar solo fechas
      // const proxAsambleas = asambleas.filter(a => new Date(a.fecha) >= hoyF).length;
      const proxAsambleas = Math.floor(Math.random() * 3); // Simulación

      setDashboardData({
        requerimientosPendientes: reqPendientes,
        totalResidentes: totalRes,
        gastosPendientesMesActual: gastosPend,
        proximasAsambleasCount: proxAsambleas,
      });

    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del dashboard. Por favor, intente recargar.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]); // Dependencia de refreshing

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]) // fetchDashboardData ya está envuelta en useCallback
  );

  const onRefresh = () => {
    setRefreshing(true);
    // fetchDashboardData se llamará debido al cambio en 'refreshing' en su useEffect de dependencias,
    // o podemos llamarlo explícitamente si quitamos 'refreshing' de sus dependencias y lo manejamos aquí.
    // Por simplicidad y para asegurar que se ejecute:
    fetchDashboardData();
  };

  const handleLogout = async () => {
    await logoutUser(dispatch);
  };

  const Card = ({ title, value, onPress, iconName, color = appColors.primary }) => (
    <TouchableOpacity style={[styles.card, {borderLeftColor: color}]} onPress={onPress} disabled={!onPress}>
      {/* Icono podría ir aquí si se usa una librería de iconos */}
      <Text style={[styles.cardTitle, {color: color}]}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {onPress && <Text style={styles.cardAction}>Ver más →</Text>}
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={appColors.primary} />
        <Text style={styles.loadingText}>Cargando Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[appColors.primary]}/>}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Administrador</Text>
        {user && <Text style={styles.userInfo}>Bienvenido, {user.nombre}</Text>}
      </View>

      <View style={styles.cardsContainer}>
        <Card
          title="Requerimientos Pendientes"
          value={dashboardData.requerimientosPendientes}
          // onPress={() => navigation.navigate('GestionRequerimientos')} // Futura navegación
          color={appColors.warning}
          // iconName="file-text-outline"
        />
        <Card
          title="Total Residentes"
          value={dashboardData.totalResidentes}
          onPress={() => navigation.navigate('GestionResidentes')} // Asumiendo que esta pantalla existe en AdminTabNavigator
          color={appColors.info}
          // iconName="people-outline"
        />
        <Card
          title="Gastos Comunes Pendientes (Este Mes)"
          value={dashboardData.gastosPendientesMesActual}
          // onPress={() => navigation.navigate('AdminGastos')}
          color={appColors.error}
          // iconName="alert-circle-outline"
        />
        <Card
          title="Próximas Asambleas"
          value={dashboardData.proximasAsambleasCount}
          // onPress={() => navigation.navigate('GestionAsambleas')}
          color={appColors.secondary}
          // iconName="calendar-outline"
        />
      </View>

      <View style={styles.actionsContainer}>
        {/* Aquí podrían ir acciones rápidas como "Nuevo Comunicado" */}
      </View>

      <CustomButton
        title="Cerrar Sesión"
        onPress={handleLogout}
        style={styles.logoutButton}
        textStyle={styles.logoutButtonText}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.background || '#f5f5f5',
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.background || '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: appColors.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 20, // Ajuste para StatusBar en Android
    paddingBottom: 15,
    backgroundColor: appColors.white,
    borderBottomWidth: 1,
    borderBottomColor: appColors.lightGray,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: appColors.textPrimary,
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 16,
    color: appColors.textSecondary,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Asegura que las tarjetas se espacien bien
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: appColors.white,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 15,
    width: '48%', // Para dos tarjetas por fila con espacio entre ellas
    marginBottom: 15,
    shadowColor: appColors.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
    borderLeftWidth: 6,
  },
  cardTitle: {
    fontSize: 14, // Ligeramente más pequeño para títulos potencialmente largos
    fontWeight: '600',
    marginBottom: 10, // Más espacio antes del valor
    minHeight: 30, // Para alinear títulos de diferente longitud
  },
  cardValue: {
    fontSize: 30, // Más grande para destacar
    fontWeight: 'bold',
    color: appColors.textPrimary,
    textAlign: 'left', // Alinear a la izquierda
    marginBottom: 8,
  },
  cardAction: {
    fontSize: 13,
    fontWeight: '500',
    color: appColors.primary, // Usar color primario para la acción
    textAlign: 'right',
    marginTop: 8,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    // Para futuros botones de acción rápida
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: appColors.error, // Color distintivo para logout
  },
  logoutButtonText: {
    color: appColors.white,
    fontWeight: 'bold',
  }
});

export default AdminDashboardScreen;
