// gastos_comunes.js - Parte 1

// Variables globales
const SPREADSHEET_ID = "tu_spreadsheet_id_aqui"; // Ajusta con tu ID real
const SHEET_RESIDENTES = "Residentes";
const SHEET_PAGOS_GC = "Pagos_GC";
const CONTACTO_PRINCIPAL_COL = "Contacto Principal"; // Columna J en Residentes

// Inicialización
let residentesData = [];
let pagosData = [];
let contactosPorParcela = {}; // Nuevo objeto para guardar contactos por parcela

// Carga inicial de datos
async function cargarDatos() {
  // Carga residentes
  residentesData = await obtenerDatosSheet(SHEET_RESIDENTES);
  // Carga pagos gastos comunes
  pagosData = await obtenerDatosSheet(SHEET_PAGOS_GC);

  // Construir el mapa contactosPorParcela
  contactosPorParcela = {};
  residentesData.forEach(residente => {
    const parcela = residente["N_Parcela"];
    if (!contactosPorParcela[parcela]) {
      contactosPorParcela[parcela] = [];
    }
    // Guardar solo si Contacto Principal = TRUE (o valor equivalente)
    if (residente[CONTACTO_PRINCIPAL_COL] && residente[CONTACTO_PRINCIPAL_COL].toString().toLowerCase() === "true") {
      contactosPorParcela[parcela].push({
        nombre: residente["Nombre_Completo"],
        email: residente["Email"],
        rut: residente["RUT"]
      });
    }
  });
}

// Función genérica para obtener datos desde Google Sheets (con tu método ya existente)
async function obtenerDatosSheet(sheetName) {
  // Aquí debe ir tu función que usa la API de Google Sheets para leer filas completas y devolver array de objetos
  // Ejemplo simplificado:
  // return await fetchGoogleSheetData(sheetName);
}

// Función para buscar residentes por parcela
function buscarResidentesPorParcela(parcela) {
  // Retorna arreglo de residentes que coinciden con la parcela
  return residentesData.filter(r => r["N_Parcela"] === parcela);
}

// Función para obtener contactos principales de una parcela
function obtenerContactosPrincipalesDeParcela(parcela) {
  return contactosPorParcela[parcela] || [];
}

// Función para enviar cobranza a todos los contactos principales de la parcela
async function enviarCobranza(parcela, asunto, mensaje, adjuntosDriveIds) {
  const contactos = obtenerContactosPrincipalesDeParcela(parcela);

  if (contactos.length === 0) {
    console.warn(`No hay contactos principales definidos para la parcela ${parcela}. No se enviará correo.`);
    return;
  }

  // Enviar correo a cada contacto principal
  for (const contacto of contactos) {
    await enviarCorreo(contacto.email, asunto, mensaje, adjuntosDriveIds);
  }
}

// Función para enviar correo con Google Apps Script o tu backend
async function enviarCorreo(email, asunto, mensaje, adjuntosDriveIds) {
  // Aquí debes mantener tu función de envío de correo
  // que utiliza la API Gmail o Apps Script
  // Ejemplo simplificado:
  /*
  await gmailApiSend({
    to: email,
    subject: asunto,
    body: mensaje,
    attachments: adjuntosDriveIds
  });
  */
}

// --- Aquí continúa el resto de tu código sin cambios ---

// Eventualmente aquí tienes funciones para:
// - Mostrar tabla gastos comunes
// - Filtrar por parcela y año
// - Formulario para agregar pagos
// - Subir comprobantes a Drive
// - Calcular intereses y multas
// Todas esas deben permanecer igual salvo que requieras que implemente el manejo de múltiples residentes al seleccionar parcela

// Recuerda al mostrar datos relacionados a parcela (en tabla o en formularios), si necesitas mostrar nombre o email,
// deberás decidir si mostrar solo contacto principal o listado completo. Por ahora se prioriza contactos principales.
// gastos_comunes.js - Parte 2

// --- Variables DOM ---
const selectParcela = document.getElementById("select-parcela");
const selectAno = document.getElementById("select-ano");
const tablaGastosComunes = document.getElementById("tabla-gastos-comunes");
const formAgregarPago = document.getElementById("form-agregar-pago");
const inputParcelaPago = document.getElementById("input-parcela-pago");
const inputNombrePago = document.getElementById("input-nombre-pago");

// --- Inicialización ---
async function inicializarModulo() {
  await cargarDatos();

  // Cargar select de parcelas
  cargarSelectParcela();

  // Cargar select de años según pagosData
  cargarSelectAno();

  // Mostrar tabla inicialmente sin filtro
  mostrarTablaGastos();

  // Eventos
  selectParcela.addEventListener("change", () => mostrarTablaGastos());
  selectAno.addEventListener("change", () => mostrarTablaGastos());

  inputParcelaPago.addEventListener("change", () => autocompletarDatosPago());
  formAgregarPago.addEventListener("submit", manejarEnvioPago);
}

// Cargar select parcela con opciones únicas
function cargarSelectParcela() {
  const parcelas = [...new Set(residentesData.map(r => r["N_Parcela"]))].sort((a,b)=>a-b);
  selectParcela.innerHTML = `<option value="">-- Todas las parcelas --</option>`;
  parcelas.forEach(p => {
    selectParcela.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

// Cargar select año basado en pagosData
function cargarSelectAno() {
  const anos = [...new Set(pagosData.map(p => new Date(p["Fecha_Vencimiento"]).getFullYear()))].sort((a,b) => b - a);
  selectAno.innerHTML = `<option value="">-- Todos los años --</option>`;
  anos.forEach(año => {
    selectAno.innerHTML += `<option value="${año}">${año}</option>`;
  });
}

// Mostrar tabla de gastos comunes con filtros y múltiples residentes por parcela
function mostrarTablaGastos() {
  const filtroParcela = selectParcela.value;
  const filtroAno = selectAno.value;

  // Filtrar pagos
  let pagosFiltrados = pagosData;
  if (filtroParcela) {
    pagosFiltrados = pagosFiltrados.filter(p => p["N_Parcela"] == filtroParcela);
  }
  if (filtroAno) {
    pagosFiltrados = pagosFiltrados.filter(p => new Date(p["Fecha_Vencimiento"]).getFullYear() == filtroAno);
  }

  // Construir tabla HTML
  let html = `
  <thead>
    <tr>
      <th>Nombre Residente(s)</th>
      <th>N° Parcela</th>
      <th>Valor Gasto Común</th>
      <th>Periodo</th>
      <th>Fecha Vencimiento</th>
      <th>Monto Pagado</th>
      <th>Saldo Pendiente/A Favor</th>
      <th>Interés</th>
      <th>Multa 1/4</th>
      <th>Meses Impagos</th>
      <th>Deuda Total</th>
      <th>Fecha Pago</th>
      <th>Método Pago</th>
      <th>Estado</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody>`;

  pagosFiltrados.forEach(pago => {
    // Obtener todos los nombres residentes de la parcela (que sean contacto principal o todos si prefieres)
    const parcela = pago["N_Parcela"];
    const residentesParcela = buscarResidentesPorParcela(parcela);
    const nombresResidentes = residentesParcela.map(r => r["Nombre_Completo"]).join(", ");

    // Calcular saldo pendiente/favor (ejemplo simple)
    const saldo = (pago["Monto_Pagado"] || 0) - (pago["Deuda_Total"] || 0);

    html += `<tr>
      <td>${nombresResidentes}</td>
      <td>${parcela}</td>
      <td>${formatearMoneda(pago["Valor_Gasto_Comun"])}</td>
      <td>${pago["Periodo"]}</td>
      <td>${formatearFecha(pago["Fecha_Vencimiento"])}</td>
      <td>${formatearMoneda(pago["Monto_Pagado"])}</td>
      <td>${formatearMoneda(saldo)}</td>
      <td>${formatearMoneda(pago["Interes"])}</td>
      <td>${formatearMoneda(pago["Multa_1/4"])}</td>
      <td>${pago["Meses_Inpagos"]}</td>
      <td>${formatearMoneda(pago["Deuda_Total"])}</td>
      <td>${formatearFecha(pago["Fecha_Pago"])}</td>
      <td>${pago["Metodo_Pago"] || ""}</td>
      <td>${pago["Estado"] || ""}</td>
      <td>
        <button class="btn-editar" data-id="${pago["ID_Pago"]}">Editar</button>
        <button class="btn-eliminar" data-id="${pago["ID_Pago"]}">Eliminar</button>
      </td>
    </tr>`;
  });

  html += `</tbody>`;
  tablaGastosComunes.innerHTML = html;

  // Agregar listeners botones editar y eliminar (si aplican)
  agregarListenersAcciones();
}

// Función para formatear moneda
function formatearMoneda(valor) {
  if (!valor) return "-";
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(valor);
}

// Función para formatear fecha
function formatearFecha(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (isNaN(d)) return "-";
  return d.toLocaleDateString('es-CL');
}

// Autocompletar datos en formulario pago al ingresar parcela
function autocompletarDatosPago() {
  const parcela = inputParcelaPago.value;
  if (!parcela) {
    inputNombrePago.value = "";
    return;
  }

  // Obtener residentes de la parcela
  const residentes = buscarResidentesPorParcela(parcela);
  if (residentes.length === 0) {
    inputNombrePago.value = "Parcela sin residentes";
    return;
  }

  // Concatenar todos los nombres para mostrar (puede ajustarse a solo contactos principales)
  const nombres = residentes.map(r => r["Nombre_Completo"]).join(", ");
  inputNombrePago.value = nombres;

  // Aquí puedes agregar autocompletado de otros campos si quieres (ej: Valor_Gasto_Comun)
}

// Manejar envío de pago nuevo
async function manejarEnvioPago(event) {
  event.preventDefault();

  // Validar campos necesarios
  const parcela = inputParcelaPago.value;
  if (!parcela) {
    alert("Debe ingresar un número de parcela válido.");
    return;
  }

  // Otros campos de validación según tu formulario
  // ...

  // Construir objeto pago nuevo
  const pagoNuevo = {
    // Aquí asigna los campos que corresponden, por ejemplo:
    N_Parcela: parcela,
    Nombre_Completo: inputNombrePago.value,
    // Fecha, monto, método, etc
  };

  // Guardar en Google Sheets (llama a función que implementes)
  await guardarPagoEnSheet(pagoNuevo);

  // Actualizar datos y refrescar tabla
  await cargarDatos();
  mostrarTablaGastos();

  // Reset form
  formAgregarPago.reset();
}

// Función para guardar pago en Google Sheets (debes tener tu implementación)
async function guardarPagoEnSheet(pago) {
  // Implementar con tu API Google Sheets
}

// Función para agregar listeners a botones editar/eliminar (simplificado)
function agregarListenersAcciones() {
  const btnsEditar = document.querySelectorAll(".btn-editar");
  btnsEditar.forEach(btn => {
    btn.addEventListener("click", () => {
      const idPago = btn.getAttribute("data-id");
      editarPago(idPago);
    });
  });

  const btnsEliminar = document.querySelectorAll(".btn-eliminar");
  btnsEliminar.forEach(btn => {
    btn.addEventListener("click", () => {
      const idPago = btn.getAttribute("data-id");
      eliminarPago(idPago);
    });
  });
}

// Funciones editar y eliminar (debes implementar)
function editarPago(idPago) {
  // Tu código para editar pago
}

function eliminarPago(idPago) {
  // Tu código para eliminar pago
}

// --- Inicializar módulo al cargar página ---
document.addEventListener("DOMContentLoaded", inicializarModulo);
// gastos_comunes.js - Parte 3

// Función para obtener emails de todos los contactos principales de una parcela
function obtenerEmailsContactosPrincipales(parcela) {
  // Filtrar residentes por parcela
  const residentesParcela = residentesData.filter(r => r["N_Parcela"] == parcela);
  // Filtrar solo contactos principales (asumiendo columna "Contacto Principal" con valores true/false o "Sí"/"No")
  const contactosPrincipales = residentesParcela.filter(r => {
    const cp = r["Contacto Principal"];
    return (typeof cp === "string" && (cp.toLowerCase() === "sí" || cp.toLowerCase() === "si")) || cp === true;
  });
  // Extraer emails
  const emails = contactosPrincipales.map(r => r["Email"]).filter(email => email && email.trim() !== "");
  return emails;
}

// Función para enviar correo cobranza a todos contactos principales de la parcela
async function enviarCorreoCobranza(parcela, asunto, cuerpoMensaje, idPago) {
  const emails = obtenerEmailsContactosPrincipales(parcela);
  if (emails.length === 0) {
    console.warn(`No se encontraron contactos principales con email para la parcela ${parcela}`);
    return;
  }

  // Preparar el objeto con información necesaria para el envío
  const infoCorreo = {
    destinatarios: emails.join(","),
    asunto: asunto,
    mensaje: cuerpoMensaje,
    idPago: idPago
  };

  // Llamar a la función que hace el envío vía Gmail API o tu backend
  await enviarCorreoGmail(infoCorreo);
}

// Función para enviar comprobante de pago a todos contactos principales de la parcela
async function enviarComprobantePago(parcela, asunto, cuerpoMensaje, idPago, idComprobanteDrive) {
  const emails = obtenerEmailsContactosPrincipales(parcela);
  if (emails.length === 0) {
    console.warn(`No se encontraron contactos principales con email para la parcela ${parcela}`);
    return;
  }

  // Obtener URL del comprobante en Drive
  const urlComprobante = await obtenerUrlArchivoDrive(idComprobanteDrive);

  const mensajeConComprobante = `${cuerpoMensaje}\n\nComprobante de pago: ${urlComprobante}`;

  const infoCorreo = {
    destinatarios: emails.join(","),
    asunto: asunto,
    mensaje: mensajeConComprobante,
    idPago: idPago
  };

  await enviarCorreoGmail(infoCorreo);
}

// Función que envía correo vía Gmail API o tu sistema
async function enviarCorreoGmail({ destinatarios, asunto, mensaje, idPago }) {
  try {
    // Aquí el código para llamar la API Gmail con los parámetros.
    // Por ejemplo, usando fetch a un endpoint o con la API cliente de Google.
    // Esto depende de tu implementación actual.

    console.log("Enviando correo a:", destinatarios);
    console.log("Asunto:", asunto);
    console.log("Mensaje:", mensaje);

    // Simulación de envío
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("Correo enviado exitosamente para pago ID:", idPago);
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
}

// Función para obtener URL archivo en Drive (debes implementar según tu sistema)
async function obtenerUrlArchivoDrive(idArchivo) {
  // Implementar llamada a Drive API para obtener link de visualización o descarga
  // Por ejemplo:
  // return `https://drive.google.com/uc?id=${idArchivo}&export=download`;

  // Simulación para ejemplo
  return `https://drive.google.com/file/d/${idArchivo}/view?usp=sharing`;
}
// gastos_comunes.js - Parte 4

// Función para agregar un pago de gasto común, considerando que puede haber varios residentes en una parcela
async function agregarPagoGastoComun(datosPago) {
  /*
  datosPago = {
    parcela: número o string,
    periodo: string (ej. "2025-06"),
    fechaPago: Date,
    montoPagado: number,
    metodoPago: string,
    idComprobanteDrive: string,
  }
  */

  // Obtener residentes de la parcela
  const residentesParcela = residentesData.filter(r => r["N_Parcela"] == datosPago.parcela);

  if (residentesParcela.length === 0) {
    alert("No se encontraron residentes para la parcela " + datosPago.parcela);
    return;
  }

  // Para cada residente, crear un registro de pago en la hoja Pagos_GC
  for (const residente of residentesParcela) {
    const nuevoPago = {
      ID_Pago: generarIdPago(), // función para generar id único
      ID_Residente: residente["ID_Residente"],
      N_Parcela: datosPago.parcela,
      Valor_Gasto_Comun: residente["Valor_Gasto_Comun"], // carga valor por residente
      Periodo: datosPago.periodo,
      Fecha_Vencimiento: calcularFechaVencimiento(datosPago.periodo),
      Monto_Pagado: datosPago.montoPagado,
      Saldo_Pendiente_o_a_favor: 0, // se calcula después
      Interes: 0,
      TIMC: 0,
      Multa_1_4: 0,
      Meses_Inpagos: 0,
      Deuda_Total: 0,
      Fecha_Pago: formatFecha(datosPago.fechaPago),
      Metodo_Pago: datosPago.metodoPago,
      Estado: "Pagado",
      ID_Comprobante_Drive: datosPago.idComprobanteDrive,
    };

    // Lógica para calcular saldos, intereses y multas según tus reglas (puedes extraerla a otra función)
    calcularFinanzasPago(nuevoPago);

    // Insertar nuevoPago en la hoja Pagos_GC
    await insertarPagoEnSheet(nuevoPago);
  }

  alert("Pagos agregados correctamente para todos los residentes de la parcela " + datosPago.parcela);
}

// Funciones auxiliares usadas arriba (ejemplos):

function generarIdPago() {
  // Puede ser timestamp + random o alguna lógica según tu sistema
  return "PAGO_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

function calcularFechaVencimiento(periodo) {
  // Asumimos periodo en formato "YYYY-MM"
  const [year, month] = periodo.split("-").map(Number);
  // Vencimiento siempre día 10 del mes
  return new Date(year, month - 1, 10);
}

function formatFecha(fecha) {
  // Formatear fecha a string 'YYYY-MM-DD'
  if (!(fecha instanceof Date)) return fecha;
  const y = fecha.getFullYear();
  const m = ("0" + (fecha.getMonth() + 1)).slice(-2);
  const d = ("0" + fecha.getDate()).slice(-2);
  return `${y}-${m}-${d}`;
}

function calcularFinanzasPago(pago) {
  // Implementa aquí las reglas de cálculo de saldos, intereses, multas, deuda total
  // Según fecha actual, fecha de vencimiento, monto pagado, etc.

  // Ejemplo simplificado:
  const fechaActual = new Date();
  const fechaVenc = new Date(pago.Fecha_Vencimiento);

  if (fechaActual > fechaVenc) {
    // Calcular meses impagos (redondeo)
    let diffMs = fechaActual - fechaVenc;
    let diffMonths = Math.floor(diffMs / (30 * 24 * 60 * 60 * 1000));
    pago.Meses_Inpagos = diffMonths > 0 ? diffMonths : 0;

    // Calcular multa 1/4
    pago.Multa_1_4 = (pago.Valor_Gasto_Comun / 4) * pago.Meses_Inpagos;

    // Calcular interes (ejemplo 1% mensual)
    pago.Interes = pago.Valor_Gasto_Comun * 0.01 * pago.Meses_Inpagos;

    // Calcular deuda total
    pago.Deuda_Total = pago.Valor_Gasto_Comun + pago.Interes + pago.Multa_1_4 - pago.Monto_Pagado;

    pago.Saldo_Pendiente_o_a_favor = pago.Deuda_Total;
    pago.Estado = pago.Deuda_Total > 0 ? "Moroso" : "Pagado";
  } else {
    pago.Meses_Inpagos = 0;
    pago.Multa_1_4 = 0;
    pago.Interes = 0;
    pago.Deuda_Total = pago.Valor_Gasto_Comun - pago.Monto_Pagado;
    pago.Saldo_Pendiente_o_a_favor = pago.Deuda_Total;
    pago.Estado = pago.Deuda_Total > 0 ? "Moroso" : "Pagado";
  }
}

async function insertarPagoEnSheet(pago) {
  // Aquí tu función que agrega la fila en la hoja Pagos_GC usando Google Sheets API o Sheets JS
  // Ejemplo básico:

  const fila = [
    pago.ID_Pago,
    pago.ID_Residente,
    pago.N_Parcela,
    pago.Valor_Gasto_Comun,
    pago.Periodo,
    formatFecha(pago.Fecha_Vencimiento),
    pago.Monto_Pagado,
    pago.Saldo_Pendiente_o_a_favor,
    pago.Interes,
    pago.TIMC,
    pago.Multa_1_4,
    pago.Meses_Inpagos,
    pago.Deuda_Total,
    pago.Fecha_Pago,
    pago.Metodo_Pago,
    pago.Estado,
    pago.ID_Comprobante_Drive
  ];

  // Llama la API Sheets para append fila (depende de tu código actual)
  await appendRowToSheet("Pagos_GC", fila);
}

async function appendRowToSheet(sheetName, fila) {
  // Implementa llamada a Google Sheets API appendRow aquí
  console.log(`Append fila a hoja ${sheetName}:`, fila);
  // Simula con delay
  await new Promise(r => setTimeout(r, 300));
}




