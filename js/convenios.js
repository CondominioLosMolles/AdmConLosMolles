<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Módulo de Convenios - Funcionalidad</title>
    <style>
        /* Estilos mínimos solo para visualización básica */
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        button { padding: 8px 12px; margin: 4px; cursor: pointer; }
        .modal { display: none; position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
        .modal-content { background-color: #fff; margin: 5% auto; padding: 20px; width: 80%; max-width: 600px; }
        .close { float: right; cursor: pointer; font-size: 24px; }
    </style>
</head>
<body>
    <h1>Módulo de Gestión de Convenios</h1>
    
    <div>
        <button id="btnNuevoConvenio">Nuevo Convenio</button>
    </div>
    
    <table id="tabla-convenios">
        <thead>
            <tr>
                <th>N° Parcela</th>
                <th>Residente</th>
                <th>Deuda Original</th>
                <th>N° Cuotas</th>
                <th>Valor Cuota</th>
                <th>Saldo Pendiente</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody id="tabla-convenios-body">
            <!-- Los datos se cargarán aquí -->
        </tbody>
    </table>

    <!-- Modal Nuevo Convenio -->
    <div id="modalNuevoConvenio" class="modal">
        <div class="modal-content">
            <span class="close" id="btnCerrarModalNuevo">&times;</span>
            <h2>Crear Nuevo Convenio</h2>
            <form id="formNuevoConvenio">
                <div>
                    <label for="convenioResidente">Residente / Parcela:</label>
                    <select id="convenioResidente" required></select>
                </div>
                <div>
                    <label for="convenioDeudaTotal">Monto Deuda Total ($):</label>
                    <input type="number" id="convenioDeudaTotal" required min="1" step="0.01">
                </div>
                <div>
                    <label for="convenioCuotas">Número de Cuotas:</label>
                    <input type="number" id="convenioCuotas" required min="1" max="120">
                </div>
                <div>
                    <label for="convenioValorCuota">Valor Cuota (calculado):</label>
                    <input type="text" id="convenioValorCuota" disabled>
                </div>
                <div>
                    <label for="convenioFechaInicio">Fecha Primera Cuota:</label>
                    <input type="date" id="convenioFechaInicio" required>
                </div>
                <div>
                    <label for="convenioInteres">Interés (%):</label>
                    <input type="number" id="convenioInteres" value="0" min="0" step="0.01">
                </div>
                <div>
                    <label for="convenioObservaciones">Observaciones:</label>
                    <textarea id="convenioObservaciones" rows="3"></textarea>
                </div>
                <div>
                    <button type="button" id="btnCancelarConvenio">Cancelar</button>
                    <button type="submit">Guardar Convenio</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal Detalle Convenio -->
    <div id="modalDetalleConvenio" class="modal">
        <div class="modal-content">
            <span class="close" id="btnCerrarModalDetalle">&times;</span>
            <h2 id="detalleConvenioTitle">Detalle de Cuotas</h2>
            <div id="detalle-convenio-info"></div>
            <table>
                <thead>
                    <tr>
                        <th>N° Cuota</th>
                        <th>Fecha Vencimiento</th>
                        <th>Monto Cuota</th>
                        <th>Monto Pagado</th>
                        <th>Saldo Pendiente</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-cuotas-body"></tbody>
            </table>
        </div>
    </div>

    <!-- Modal Pago Cuota -->
    <div id="modalPagoCuota" class="modal">
        <div class="modal-content">
            <span class="close" id="btnCerrarModalPago">&times;</span>
            <h2>Registrar Pago de Cuota</h2>
            <div id="info-cuota-pago"></div>
            <form id="formPagoCuota">
                <input type="hidden" id="pagoCuotaId">
                <div>
                    <label for="pagoMonto">Monto a Pagar ($):</label>
                    <input type="number" id="pagoMonto" required min="0.01" step="0.01">
                </div>
                <div>
                    <label for="pagoFecha">Fecha de Pago:</label>
                    <input type="date" id="pagoFecha" required>
                </div>
                <div>
                    <label for="pagoMetodo">Método de Pago:</label>
                    <select id="pagoMetodo" required>
                        <option value="">Seleccione...</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Efectivo">Efectivo</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="Otro">Otro</option>
                    </select>
                </div>
                <div>
                    <label for="pagoComprobante">Comprobante de Pago:</label>
                    <input type="file" id="pagoComprobante" accept=".pdf,.jpg,.jpeg,.png">
                </div>
                <div>
                    <label for="pagoObservaciones">Observaciones:</label>
                    <textarea id="pagoObservaciones" rows="2"></textarea>
                </div>
                <div>
                    <button type="button" id="btnCancelarPago">Cancelar</button>
                    <button type="submit">Registrar Pago</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Variables globales
        let convenios = [];
        let cuotas = [];
        let residentes = [];
        let currentConvenioId = null;
        let archivoComprobante = null;

        // Inicialización cuando el DOM esté cargado
        document.addEventListener('DOMContentLoaded', function() {
            inicializarComponentes();
            cargarConvenios();
        });

        // Inicializar event listeners
        function inicializarComponentes() {
            // Event listeners para modales
            document.getElementById('btnNuevoConvenio').addEventListener('click', abrirModalNuevo);
            document.getElementById('btnCerrarModalNuevo').addEventListener('click', cerrarModalNuevo);
            document.getElementById('btnCerrarModalDetalle').addEventListener('click', cerrarModalDetalle);
            document.getElementById('btnCerrarModalPago').addEventListener('click', cerrarModalPago);
            document.getElementById('btnCancelarConvenio').addEventListener('click', cerrarModalNuevo);
            document.getElementById('btnCancelarPago').addEventListener('click', cerrarModalPago);

            // Event listeners para formularios
            document.getElementById('formNuevoConvenio').addEventListener('submit', guardarConvenio);
            document.getElementById('formPagoCuota').addEventListener('submit', registrarPagoCuota);

            // Event listeners para cálculos
            document.getElementById('convenioDeudaTotal').addEventListener('input', calcularValorCuota);
            document.getElementById('convenioCuotas').addEventListener('input', calcularValorCuota);
            document.getElementById('convenioInteres').addEventListener('input', calcularValorCuota);

            // Event listener para subida de archivos
            document.getElementById('pagoComprobante').addEventListener('change', manejarSubidaArchivo);
        }

        // Cargar datos de convenios
        async function cargarConvenios() {
            try {
                // En un entorno real, aquí se llamaría a la API de Google Sheets
                // const data = await obtenerDatosConvenios();
                
                // Simulamos datos de prueba
                await simularCargaDatos();
                
                renderizarTablaConvenios();
            } catch (error) {
                mostrarError('Error al cargar datos de convenios: ' + error.message);
                console.error(error);
            }
        }

        // Simular carga de datos
        async function simularCargaDatos() {
            return new Promise(resolve => {
                setTimeout(() => {
                    // Datos de residentes de ejemplo
                    residentes = [
                        { ID_Residente: 1, N_Parcela: 101, Nombre_Completo: "Juan Pérez" },
                        { ID_Residente: 2, N_Parcela: 102, Nombre_Completo: "María González" },
                        { ID_Residente: 3, N_Parcela: 103, Nombre_Completo: "Carlos López" },
                        { ID_Residente: 4, N_Parcela: 104, Nombre_Completo: "Ana Martínez" }
                    ];

                    // Datos de convenios de ejemplo
                    convenios = [
                        { 
                            ID_Convenio: 1, 
                            N_Parcela: 101, 
                            Nombre_Residente: "Juan Pérez", 
                            Deuda_Original: 1200000, 
                            N_Cuotas: 12, 
                            Valor_Cuota: 100000, 
                            Interes_Convenio: 0, 
                            Estado: "Activo", 
                            Saldo_Convenio: 600000,
                            Fecha_Inicio: "2023-05-15",
                            Observaciones: "Convenio por deuda acumulada"
                        },
                        { 
                            ID_Convenio: 2, 
                            N_Parcela: 103, 
                            Nombre_Residente: "Carlos López", 
                            Deuda_Original: 800000, 
                            N_Cuotas: 8, 
                            Valor_Cuota: 100000, 
                            Interes_Convenio: 0, 
                            Estado: "Pagado", 
                            Saldo_Convenio: 0,
                            Fecha_Inicio: "2023-03-10",
                            Observaciones: ""
                        }
                    ];

                    // Datos de cuotas de ejemplo
                    cuotas = [
                        { ID_Cuota: 1, ID_Convenio: 1, N_Cuota: 1, Fecha_Vencimiento: "2023-06-15", Monto_Cuota: 100000, Monto_Pagado: 100000, Saldo_Cuota: 0, Estado: "Pagado" },
                        { ID_Cuota: 2, ID_Convenio: 1, N_Cuota: 2, Fecha_Vencimiento: "2023-07-15", Monto_Cuota: 100000, Monto_Pagado: 100000, Saldo_Cuota: 0, Estado: "Pagado" },
                        { ID_Cuota: 3, ID_Convenio: 1, N_Cuota: 3, Fecha_Vencimiento: "2023-08-15", Monto_Cuota: 100000, Monto_Pagado: 100000, Saldo_Cuota: 0, Estado: "Pagado" },
                        { ID_Cuota: 6, ID_Convenio: 1, N_Cuota: 6, Fecha_Vencimiento: "2023-11-15", Monto_Cuota: 100000, Monto_Pagado: 100000, Saldo_Cuota: 0, Estado: "Pagado" },
                        { ID_Cuota: 7, ID_Convenio: 1, N_Cuota: 7, Fecha_Vencimiento: "2023-12-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" },
                        { ID_Cuota: 8, ID_Convenio: 1, N_Cuota: 8, Fecha_Vencimiento: "2024-01-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" },
                        { ID_Cuota: 9, ID_Convenio: 1, N_Cuota: 9, Fecha_Vencimiento: "2024-02-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" },
                        { ID_Cuota: 10, ID_Convenio: 1, N_Cuota: 10, Fecha_Vencimiento: "2024-03-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" },
                        { ID_Cuota: 11, ID_Convenio: 1, N_Cuota: 11, Fecha_Vencimiento: "2024-04-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" },
                        { ID_Cuota: 12, ID_Convenio: 1, N_Cuota: 12, Fecha_Vencimiento: "2024-05-15", Monto_Cuota: 100000, Monto_Pagado: 0, Saldo_Cuota: 100000, Estado: "Pendiente" }
                    ];

                    resolve();
                }, 500);
            });
        }

        // Renderizar tabla de convenios
        function renderizarTablaConvenios() {
            const tbody = document.getElementById('tabla-convenios-body');
            if (!tbody) return;
            
            if (!convenios || convenios.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay convenios registrados.</td></tr>';
                return;
            }
            
            tbody.innerHTML = convenios.map(c => `
                <tr>
                    <td>${c.N_Parcela}</td>
                    <td>${c.Nombre_Residente}</td>
                    <td>$${(c.Deuda_Original || 0).toLocaleString('es-CL')}</td>
                    <td>${c.N_Cuotas}</td>
                    <td>$${(c.Valor_Cuota || 0).toLocaleString('es-CL')}</td>
                    <td>$${(c.Saldo_Convenio || 0).toLocaleString('es-CL')}</td>
                    <td>${c.Estado}</td>
                    <td>
                        <button class="btn-ver-detalle" data-id="${c.ID_Convenio}">Ver Detalle</button>
                        ${c.Estado === 'Activo' ? `
                            <button class="btn-editar" data-id="${c.ID_Convenio}">Editar</button>
                            <button class="btn-anular" data-id="${c.ID_Convenio}">Anular</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
            
            // Agregar event listeners a los botones
            document.querySelectorAll('.btn-ver-detalle').forEach(btn => {
                btn.addEventListener('click', (e) => verDetalleConvenio(e.currentTarget.dataset.id));
            });
            
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', (e) => editarConvenio(e.currentTarget.dataset.id));
            });
            
            document.querySelectorAll('.btn-anular').forEach(btn => {
                btn.addEventListener('click', (e) => anularConvenio(e.currentTarget.dataset.id));
            });
        }

        // Ver detalle de convenio
        function verDetalleConvenio(convenioId) {
            currentConvenioId = convenioId;
            const convenio = convenios.find(c => c.ID_Convenio == convenioId);
            const cuotasConvenio = cuotas.filter(cu => cu.ID_Convenio == convenioId).sort((a, b) => a.N_Cuota - b.N_Cuota);
            
            document.getElementById('detalleConvenioTitle').textContent = `Detalle de Cuotas - Parcela ${convenio.N_Parcela} (${convenio.Nombre_Residente})`;
            
            document.getElementById('detalle-convenio-info').innerHTML = `
                <div>
                    <strong>Deuda Original:</strong> $${(convenio.Deuda_Original || 0).toLocaleString('es-CL')}<br>
                    <strong>Saldo Pendiente:</strong> $${(convenio.Saldo_Convenio || 0).toLocaleString('es-CL')}<br>
                    <strong>Estado:</strong> ${convenio.Estado}
                </div>
            `;
            
            document.getElementById('tabla-cuotas-body').innerHTML = cuotasConvenio.map(cuota => `
                <tr>
                    <td>${cuota.N_Cuota}</td>
                    <td>${new Date(cuota.Fecha_Vencimiento).toLocaleDateString('es-CL')}</td>
                    <td>$${(cuota.Monto_Cuota || 0).toLocaleString('es-CL')}</td>
                    <td>$${(cuota.Monto_Pagado || 0).toLocaleString('es-CL')}</td>
                    <td>$${(cuota.Saldo_Cuota || 0).toLocaleString('es-CL')}</td>
                    <td>${cuota.Estado}</td>
                    <td>
                        ${cuota.Estado === 'Pendiente' ? `
                            <button class="btn-pagar-cuota" data-id="${cuota.ID_Cuota}">Registrar Pago</button>
                        ` : 'N/A'}
                    </td>
                </tr>
            `).join('');
            
            // Agregar event listeners a los botones de pago
            document.querySelectorAll('.btn-pagar-cuota').forEach(btn => {
                btn.addEventListener('click', (e) => abrirModalPagoCuota(e.currentTarget.dataset.id));
            });
            
            document.getElementById('modalDetalleConvenio').style.display = 'block';
        }

        // Abrir modal para nuevo convenio
        function abrirModalNuevo() {
            const select = document.getElementById('convenioResidente');
            const residentesConConvenioActivo = convenios.filter(c => c.Estado === 'Activo').map(c => c.N_Parcela);
            const residentesFiltrados = residentes.filter(r => !residentesConConvenioActivo.includes(r.N_Parcela));
            
            select.innerHTML = '<option value="">Seleccione...</option>' + 
                residentesFiltrados.sort((a, b) => a.N_Parcela - b.N_Parcela)
                    .map(r => `<option value="${r.N_Parcela}">P.${r.N_Parcela} - ${r.Nombre_Completo}</option>`)
                    .join('');
            
            document.getElementById('formNuevoConvenio').reset();
            document.getElementById('convenioValorCuota').value = '';
            document.getElementById('convenioFechaInicio').valueAsDate = new Date();
            document.getElementById('modalNuevoConvenio').style.display = 'block';
        }

        // Calcular valor de cuota
        function calcularValorCuota() {
            const deuda = parseFloat(document.getElementById('convenioDeudaTotal').value) || 0;
            const numCuotas = parseInt(document.getElementById('convenioCuotas').value) || 0;
            const interes = parseFloat(document.getElementById('convenioInteres').value) || 0;
            
            if (deuda > 0 && numCuotas > 0) {
                const valorConInteres = deuda * (1 + interes / 100);
                const valorCuota = valorConInteres / numCuotas;
                document.getElementById('convenioValorCuota').value = `$${Math.round(valorCuota).toLocaleString('es-CL')}`;
            } else {
                document.getElementById('convenioValorCuota').value = '';
            }
        }

        // Guardar nuevo convenio
        async function guardarConvenio(e) {
            e.preventDefault();
            
            const nParcela = document.getElementById('convenioResidente').value;
            if (!nParcela) {
                mostrarError('Debe seleccionar un residente.');
                return;
            }
            
            const residente = residentes.find(r => r.N_Parcela == nParcela);
            if (!residente) {
                mostrarError('Residente no encontrado.');
                return;
            }
            
            const deudaOriginal = parseFloat(document.getElementById('convenioDeudaTotal').value);
            const nCuotas = parseInt(document.getElementById('convenioCuotas').value);
            const fechaInicio = document.getElementById('convenioFechaInicio').value;
            const interes = parseFloat(document.getElementById('convenioInteres').value) || 0;
            const observaciones = document.getElementById('convenioObservaciones').value;
            
            if (deudaOriginal <= 0) {
                mostrarError('La deuda debe ser mayor a cero.');
                return;
            }
            
            if (nCuotas <= 0) {
                mostrarError('El número de cuotas debe ser mayor a cero.');
                return;
            }
            
            try {
                // En un entorno real, aquí se llamaría a la API de Google Sheets
                // const nuevoConvenio = await crearConvenio({ ... });
                
                // Simulamos la creación de un convenio
                const nuevoId = Math.max(...convenios.map(c => c.ID_Convenio), 0) + 1;
                const valorCuota = deudaOriginal * (1 + interes / 100) / nCuotas;
                
                const nuevoConvenio = {
                    ID_Convenio: nuevoId,
                    N_Parcela: parseInt(nParcela),
                    Nombre_Residente: residente.Nombre_Completo,
                    Deuda_Original: deudaOriginal,
                    N_Cuotas: nCuotas,
                    Valor_Cuota: Math.round(valorCuota),
                    Interes_Convenio: interes,
                    Estado: "Activo",
                    Saldo_Convenio: deudaOriginal * (1 + interes / 100),
                    Fecha_Inicio: fechaInicio,
                    Observaciones: observaciones
                };
                
                convenios.push(nuevoConvenio);
                
                // Crear las cuotas
                const nuevasCuotas = [];
                for (let i = 1; i <= nCuotas; i++) {
                    const fechaVencimiento = new Date(fechaInicio);
                    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);
                    
                    nuevasCuotas.push({
                        ID_Cuota: Math.max(...cuotas.map(c => c.ID_Cuota), 0) + i,
                        ID_Convenio: nuevoId,
                        N_Cuota: i,
                        Fecha_Vencimiento: fechaVencimiento.toISOString().split('T')[0],
                        Monto_Cuota: Math.round(valorCuota),
                        Monto_Pagado: 0,
                        Saldo_Cuota: Math.round(valorCuota),
                        Estado: "Pendiente"
                    });
                }
                
                cuotas.push(...nuevasCuotas);
                
                renderizarTablaConvenios();
                mostrarExito('Convenio creado exitosamente.');
                cerrarModalNuevo();
            } catch (error) {
                mostrarError('Error al crear convenio: ' + error.message);
                console.error(error);
            }
        }

        // Abrir modal para pago de cuota
        function abrirModalPagoCuota(cuotaId) {
            const cuota = cuotas.find(c => c.ID_Cuota == cuotaId);
            if (!cuota) {
                mostrarError('Cuota no encontrada.');
                return;
            }
            
            const convenio = convenios.find(c => c.ID_Convenio == cuota.ID_Convenio);
            if (!convenio) {
                mostrarError('Convenio no encontrado.');
                return;
            }
            
            document.getElementById('pagoCuotaId').value = cuotaId;
            document.getElementById('pagoMonto').value = cuota.Saldo_Cuota;
            document.getElementById('pagoMonto').max = cuota.Saldo_Cuota;
            document.getElementById('pagoFecha').valueAsDate = new Date();
            
            document.getElementById('info-cuota-pago').innerHTML = `
                <strong>Convenio:</strong> Parcela ${convenio.N_Parcela} - ${convenio.Nombre_Residente}<br>
                <strong>Cuota N°:</strong> ${cuota.N_Cuota}<br>
                <strong>Monto pendiente:</strong> $${cuota.Saldo_Cuota.toLocaleString('es-CL')}<br>
                <strong>Vencimiento:</strong> ${new Date(cuota.Fecha_Vencimiento).toLocaleDateString('es-CL')}
            `;
            
            // Limpiar formulario de pago
            document.getElementById('pagoMetodo').value = "";
            document.getElementById('pagoObservaciones').value = "";
            archivoComprobante = null;
            
            document.getElementById('modalPagoCuota').style.display = 'block';
        }

        // Manejar subida de archivo
        function manejarSubidaArchivo(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validar tipo de archivo
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!validTypes.includes(file.type)) {
                mostrarError('Solo se permiten archivos PDF, JPG o PNG.');
                e.target.value = '';
                return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                mostrarError('El archivo no debe superar los 5MB.');
                e.target.value = '';
                return;
            }
            
            archivoComprobante = file;
        }

        // Registrar pago de cuota
        async function registrarPagoCuota(e) {
            e.preventDefault();
            
            const cuotaId = document.getElementById('pagoCuotaId').value;
            const monto = parseFloat(document.getElementById('pagoMonto').value);
            const fechaPago = document.getElementById('pagoFecha').value;
            const metodo = document.getElementById('pagoMetodo').value;
            const observaciones = document.getElementById('pagoObservaciones').value;
            
            if (!cuotaId || monto <= 0) {
                mostrarError('Monto inválido.');
                return;
            }
            
            if (!metodo) {
                mostrarError('Debe seleccionar un método de pago.');
                return;
            }
            
            if (!archivoComprobante) {
                if (!confirm('¿Está seguro de continuar sin adjuntar un comprobante?')) {
                    return;
                }
            }
            
            try {
                const cuota = cuotas.find(c => c.ID_Cuota == cuotaId);
                if (!cuota) throw new Error('Cuota no encontrada');
                
                if (monto > cuota.Saldo_Cuota) {
                    mostrarError('El monto ingresado supera el saldo pendiente de la cuota.');
                    return;
                }
                
                // Simular subida de archivo
                let comprobanteUrl = null;
                if (archivoComprobante) {
                    // En producción, aquí se llamaría a la función para subir a Drive
                    // comprobanteUrl = await subirComprobante(archivoComprobante, folderId);
                    comprobanteUrl = "https://drive.google.com/file/d/simulado/view"; // URL simulada
                }
                
                // Actualizar cuota
                cuota.Monto_Pagado += monto;
                cuota.Saldo_Cuota -= monto;
                
                if (cuota.Saldo_Cuota <= 0) {
                    cuota.Estado = "Pagado";
                }
                
                // Actualizar convenio
                const convenio = convenios.find(c => c.ID_Convenio == cuota.ID_Convenio);
                if (convenio) {
                    convenio.Saldo_Convenio -= monto;
                    
                    if (convenio.Saldo_Convenio <= 0) {
                        convenio.Estado = "Pagado";
                    }
                }
                
                // Registrar pago (en producción se guardaría en Google Sheets)
                const pago = {
                    ID_Pago: Math.random().toString(36).substring(7),
                    ID_Cuota: cuotaId,
                    Fecha_Pago: fechaPago,
                    Monto: monto,
                    Metodo: metodo,
                    Comprobante_URL: comprobanteUrl,
                    Observaciones: observaciones
                };
                
                mostrarExito('Pago registrado correctamente.');
                cerrarModalPago();
                
                // Actualizar vistas
                if (document.getElementById('modalDetalleConvenio').style.display === 'block') {
                    verDetalleConvenio(convenio.ID_Convenio);
                }
                
                renderizarTablaConvenios();
            } catch (error) {
                mostrarError('Error al registrar pago: ' + error.message);
                console.error(error);
            }
        }

        // Anular convenio
        async function anularConvenio(convenioId) {
            if (!confirm('¿Está seguro de anular este convenio? Esta acción no se puede deshacer.')) {
                return;
            }
            
            try {
                // En un entorno real, aquí se llamaría a la API de Google Sheets
                // await anularConvenio(convenioId);
                
                const convenio = convenios.find(c => c.ID_Convenio == convenioId);
                if (convenio) {
                    convenio.Estado = "Anulado";
                    convenio.Saldo_Convenio = 0;
                }
                
                // Anular cuotas pendientes
                cuotas.forEach(cuota => {
                    if (cuota.ID_Convenio == convenioId && cuota.Estado === "Pendiente") {
                        cuota.Estado = "Anulada";
                        cuota.Saldo_Cuota = 0;
                    }
                });
                
                renderizarTablaConvenios();
                
                if (document.getElementById('modalDetalleConvenio').style.display === 'block') {
                    document.getElementById('modalDetalleConvenio').style.display = 'none';
                }
                
                mostrarExito('Convenio anulado correctamente.');
            } catch (error) {
                mostrarError('Error al anular convenio: ' + error.message);
                console.error(error);
            }
        }

        // Editar convenio (función básica)
        function editarConvenio(convenioId) {
            mostrarInfo('Funcionalidad de edición en desarrollo.');
            // Aquí se implementaría la lógica para editar un convenio existente
        }

        // Cerrar modales
        function cerrarModalNuevo() {
            document.getElementById('modalNuevoConvenio').style.display = 'none';
        }
        
        function cerrarModalDetalle() {
            document.getElementById('modalDetalleConvenio').style.display = 'none';
        }
        
        function cerrarModalPago() {
            document.getElementById('modalPagoCuota').style.display = 'none';
        }

        // Utilidades de UI
        function mostrarError(mensaje) {
            alert('Error: ' + mensaje);
        }
        
        function mostrarExito(mensaje) {
            alert('Éxito: ' + mensaje);
        }
        
        function mostrarInfo(mensaje) {
            alert('Información: ' + mensaje);
        }
    </script>
</body>
</html>
