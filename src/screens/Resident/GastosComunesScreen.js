import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, ActivityIndicator,
    RefreshControl, ScrollView, Modal, TextInput, Alert, Picker // Picker es obsoleto, usar @react-native-picker/picker
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker as NativePicker } from '@react-native-picker/picker'; // Importar el Picker correcto

import { useAuthState } from '../../contexts/AuthContext';
import googleApiService from '../../services/googleApiService';
import paymentService from '../../services/paymentService'; // Importar paymentService
import appColors from '../../constants/colors';
import CustomButton from '../../components/common/Button';
import appConfig from '../../config/appConfig'; // Para nombre del condominio

const GastosComunesScreen = () => {
  const { user } = useAuthState();
  const [gastos, setGastos] = useState([]);
  const [saldoGeneral, setSaldoGeneral] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para el modal de pago
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedGastoToPay, setSelectedGastoToPay] = useState(null);
  const [metodoPago, setMetodoPago] = useState('Transferencia Simulada');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Estado para el modal de comprobante
  const [isComprobanteModalVisible, setIsComprobanteModalVisible] = useState(false);
  const [comprobanteData, setComprobanteData] = useState(null);


  const fetchGastosComunes = useCallback(async () => {
    if (!user || !user.id_residente) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }
    // No establecer isLoading(true) aquí si es solo un refresh,
    // para no mostrar el spinner de pantalla completa.
    if(!refreshing) setIsLoading(true);

    try {
      const todosLosGastos = await googleApiService.getSheetData('gastosComunesSheet', 'Sheet1');
      const gastosDelResidente = todosLosGastos.filter(g => g.id_residente === user.id_residente);

      gastosDelResidente.sort((a, b) => {
        if (b.anio !== a.anio) return b.anio - a.anio;
        // Mejorar orden de meses si es necesario con un map
        const mesesOrden = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return mesesOrden.indexOf(a.mes) - mesesOrden.indexOf(b.mes);
      });

      setGastos(gastosDelResidente);
      calculateSaldo(gastosDelResidente);

    } catch (error) {
      console.error("Error fetching gastos comunes:", error);
      Alert.alert("Error", "No se pudieron cargar los gastos comunes.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]); // Incluir refreshing en dependencias

  const calculateSaldo = (gastosDelResidente) => {
    let saldoCalculado = 0;
    gastosDelResidente.forEach(gasto => {
      if (gasto.estado_pago === 'Pendiente' || gasto.estado_pago === 'Atrasado') {
        saldoCalculado -= parseFloat(gasto.monto || 0);
      }
    });
    setSaldoGeneral(saldoCalculado);
  };

  useFocusEffect(
    useCallback(() => {
      fetchGastosComunes();
    }, [fetchGastosComunes]) // Ahora fetchGastosComunes es un useCallback
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchGastosComunes(); // fetchGastosComunes se encargará de setRefreshing(false)
  };

  // --- Funciones para el Flujo de Pago ---
  const handlePagarGastoPress = (gasto) => {
    setSelectedGastoToPay(gasto);
    setMetodoPago('Transferencia Simulada'); // Resetear
    setReferenciaPago(''); // Resetear
    setIsPaymentModalVisible(true);
  };

  const handleConfirmarPago = async () => {
    if (!selectedGastoToPay || !user) return;
    setIsProcessingPayment(true);
    const resultado = await paymentService.procesarPagoGastoComun(
      selectedGastoToPay.id_gasto,
      selectedGastoToPay.monto,
      metodoPago,
      referenciaPago,
      user.id_residente
    );
    setIsProcessingPayment(false);
    setIsPaymentModalVisible(false);

    if (resultado.success) {
      Alert.alert("Pago Exitoso", resultado.message);
      fetchGastosComunes(); // Recargar datos
      // Ofrecer subir comprobante
      Alert.alert(
        "Subir Comprobante",
        "¿Deseas subir el comprobante de pago ahora?",
        [
          { text: "Más tarde", style: "cancel" },
          { text: "Subir Ahora", onPress: () => handleSubirComprobantePress(resultado.updatedGasto) }
        ]
      );
    } else {
      Alert.alert("Error de Pago", resultado.message);
    }
  };

  // --- Funciones para Comprobantes ---
  const handleSubirComprobantePress = async (gasto) => {
    if (!gasto) return;
    // Simulación de selección de archivo
    Alert.alert(
      "Simulación de Subida",
      `Se simulará la subida de un PDF para el gasto ${gasto.mes} ${gasto.anio}.`,
      [
        {text: "Cancelar", style: "cancel"},
        {text: "Continuar Subida Simulada", onPress: async () => {
          setIsLoading(true); // Mostrar un loader general
          const fileDataMock = { name: `comprobante_${gasto.id_gasto}_${user.id_residente}.pdf`, type: 'application/pdf' };
          const resultado = await paymentService.subirComprobantePago(gasto.id_gasto, fileDataMock);
          setIsLoading(false);
          if (resultado.success) {
            Alert.alert("Comprobante Subido", resultado.message);
            fetchGastosComunes(); // Recargar para ver el cambio
          } else {
            Alert.alert("Error", resultado.message);
          }
        }}
      ]
    );
  };

  const handleVerComprobantePress = (gasto) => {
    // Simulación de generación de contenido PDF
    const data = {
      titulo: "Comprobante de Pago de Gastos Comunes (PDF Simulado)",
      condominio: appConfig.CONDOMINIO_NOMBRE || "Condominio Los Robles (Simulado)", // Añadir a appConfig
      fechaEmision: new Date().toLocaleDateString('es-CL'),
      residente: user.nombre,
      parcela: user.parcela,
      periodo: `${gasto.mes} ${gasto.anio}`,
      montoPagado: `$${Number(gasto.monto).toLocaleString('es-CL')}`,
      fechaPago: gasto.fecha_pago,
      metodoPago: gasto.metodo_pago || 'No especificado',
      referenciaPago: gasto.referencia_pago || 'N/A',
      idTransaccion: `sim_${gasto.id_gasto}_${new Date(gasto.fecha_pago).getTime()}`,
      leyendaLey: "Este comprobante acredita el pago de los gastos comunes correspondientes al periodo indicado, en conformidad con la Ley 21.442 de Copropiedad Inmobiliaria. Conserve este documento.",
      // Saldo podría calcularse si fuera necesario aquí también.
    };
    setComprobanteData(data);
    setIsComprobanteModalVisible(true);
  };

  // ... (renderGastoItem, JSX principal y estilos se actualizarán después)

// Placeholder para appConfig.CONDOMINIO_NOMBRE si no existe
if (appConfig && !appConfig.CONDOMINIO_NOMBRE) {
  appConfig.CONDOMINIO_NOMBRE = "Condominio Jardines del Este";
}

// Resto del archivo (renderGastoItem, JSX, styles) en el siguiente bloque
// ...
