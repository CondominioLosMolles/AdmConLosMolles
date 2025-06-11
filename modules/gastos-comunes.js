// Módulo Gastos Comunes - Gestión de pagos y cálculos de gastos comunes
class GastosComunesModule {
    constructor() {
        this.residentes = [];
        this.pagos = [];
        this.selectedResidente = null;
        this.historialPagos = [];
    }

    // Renderizar el módulo
    async render() {
        const container = document.getElementById('content-container');
        Utils.showLoading(container);

        try {
            // Cargar datos necesarios
            await this.loadData();

            // Renderizar contenido
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents();

        } catch (error) {
            console.error('Error cargando gastos comunes:', error);
            Utils.showError(container, 'Error cargando los gastos comunes');
        }
    }

    // Cargar datos necesarios
    async loadData() {
        try {
            const [residentesData, pagosData] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES),
                window.googleAPI.readSheet(CONFIG.SHEETS.PAGOS_GC)
            ]);

            // Procesar residentes
            if (residentesData.length > 1) {
                this.residentes = residentesData.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    nombreCompleto: row[1] || '',
                    rut: row[2] || '',
                    nParcela: row[3] || '',
                    email: row[4] || '',
                    telefono: row[5] || '',
                    estado: row[6] || 'Activo',
                    valorGastoComun: parseFloat(row[7]) || 0,
                    rowIndex: index + 1
                }));
            }

            // Procesar pagos
            if (pagosData.length > 1) {
                this.pagos = pagosData.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    idResidente: row[1] || '',
                    nParcela: row[2] || '',
                    periodo: row[3] || '',
                    fechaVencimiento: row[4] || '',
                    montoPagado: parseFloat(row[5]) || 0,
                    fechaPago: row[6] || '',
                    metodoPago: row[7] || '',
                    idComprobanteDrive: row[8] || '',
                    rowIndex: index + 1
                }));
            }

        } catch (error) {
            console.error('Error cargando datos:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        return `
            <div class="gastos-comunes-container">
                <div class="module-header">
                    <h2>Gastos Comunes</h2>
                    <div class="module-actions">
                        <button class="btn btn-primary" id="config-tmc-btn">
                            <i class="fas fa-cog"></i>
                            Configurar TMC
                        </button>
                    </div>
                </div>

                <div class="residente-selector-container">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Seleccionar Residente</h3>
                        </div>
                        <div class="residente-selector">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="search-residente" placeholder="Buscar por N° parcela, RUT o nombre..." class="search-input">
                            </div>
                            <div id="residente-results" class="residente-results"></div>
                        </div>
                    </div>
                </div>

                <div id="historial-container" class="historial-container hidden">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Historial de Pagos - <span id="residente-info"></span></h3>
                            <button class="btn btn-success" id="registrar-pago-btn">
                                <i class="fas fa-plus"></i>
                                Registrar Pago
                            </button>
                        </div>
                        <div class="table-container">
                            <table class="table" id="historial-table">
                                <thead>
                                    <tr>
                                        <th>Mes</th>
                                        <th>Valor Gasto Común</th>
                                        <th>Fecha Vencimiento</th>
                                        <th>Monto Pagado</th>
                                        <th>Valor Pendiente</th>
                                        <th>Interés por Mora</th>
                                        <th>¼ Multa Adicional</th>
                                        <th>Meses de Mora</th>
                                        <th>Deuda Total</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody id="historial-tbody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Configurar eventos
    setupEvents() {
        // Búsqueda de residente
        const searchInput = document.getElementById('search-residente');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchResidentes(e.target.value);
            }, 300));
        }

        // Botón configurar TMC
        const configBtn = document.getElementById('config-tmc-btn');
        if (configBtn) {
            configBtn.addEventListener('click', () => this.showConfigTMC());
        }

        // Botón registrar pago
        const registrarBtn = document.getElementById('registrar-pago-btn');
        if (registrarBtn) {
            registrarBtn.addEventListener('click', () => this.showRegistrarPago());
        }
    }

    // Buscar residentes
    searchResidentes(term) {
        const resultsContainer = document.getElementById('residente-results');
        if (!resultsContainer) return;

        if (!term || term.length < 2) {
            resultsContainer.innerHTML = '<p class="text-center">Ingrese al menos 2 caracteres para buscar</p>';
            return;
        }

        const filteredResidentes = this.residentes.filter(residente =>
            residente.nParcela.toLowerCase().includes(term.toLowerCase()) ||
            residente.rut.toLowerCase().includes(term.toLowerCase()) ||
            residente.nombreCompleto.toLowerCase().includes(term.toLowerCase())
        );

        if (filteredResidentes.length === 0) {
            resultsContainer.innerHTML = '<p class="text-center">No se encontraron residentes</p>';
            return;
        }

        resultsContainer.innerHTML = filteredResidentes.map(residente => `
            <div class="residente-item" onclick="window.App.getCurrentModule().selectResidente('${residente.id}')">
                <div class="residente-info">
                    <strong>Parcela ${residente.nParcela}</strong> - ${residente.nombreCompleto}
                    <br>
                    <small>RUT: ${residente.rut} | Gasto Común: ${Utils.formatCurrency(residente.valorGastoComun)}</small>
                </div>
                <div class="residente-status">
                    <span class="status-${residente.estado.toLowerCase()}">${residente.estado}</span>
                </div>
            </div>
        `).join('');
    }

    // Seleccionar residente
    async selectResidente(residenteId) {
        try {
            this.selectedResidente = this.residentes.find(r => r.id === residenteId);
            if (!this.selectedResidente) return;

            // Mostrar información del residente
            const residenteInfo = document.getElementById('residente-info');
            if (residenteInfo) {
                residenteInfo.textContent = `Parcela ${this.selectedResidente.nParcela} - ${this.selectedResidente.nombreCompleto}`;
            }

            // Generar historial de pagos
            await this.generateHistorialPagos();

            // Mostrar contenedor de historial
            const historialContainer = document.getElementById('historial-container');
            if (historialContainer) {
                historialContainer.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Error seleccionando residente:', error);
            Utils.showToast('Error cargando el historial del residente', 'error');
        }
    }

    // Generar historial de pagos para el año actual
    async generateHistorialPagos() {
        if (!this.selectedResidente) return;

        const currentYear = new Date().getFullYear();
        const historial = [];

        // Generar 12 meses del año actual
        for (let month = 1; month <= 12; month++) {
            const periodo = `${currentYear}-${String(month).padStart(2, '0')}`;
            const fechaVencimiento = Utils.generateFechaVencimiento(currentYear, month);
            
            // Buscar pago existente para este período
            const pago = this.pagos.find(p => 
                p.idResidente === this.selectedResidente.id && 
                p.periodo === periodo
            );

            const montoPagado = pago ? pago.montoPagado : 0;
            const valorGastoComun = this.selectedResidente.valorGastoComun;
            
            // Calcular valores
            const valorPendiente = valorGastoComun - montoPagado;
            const mesesMora = Utils.calculateMesesMora(fechaVencimiento);
            const interesMora = Utils.calculateInteresMora(valorGastoComun, mesesMora);
            const multaAdicional = Utils.calculateMultaAdicional(valorGastoComun, mesesMora);
            const deudaTotal = Utils.calculateDeudaTotal(valorGastoComun, montoPagado, interesMora, multaAdicional);
            
            const estado = deudaTotal <= 0 ? 'Pagado' : 'Pendiente';

            historial.push({
                mes: new Date(currentYear, month - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }),
                periodo,
                valorGastoComun,
                fechaVencimiento,
                montoPagado,
                valorPendiente,
                interesMora,
                multaAdicional,
                mesesMora,
                deudaTotal,
                estado,
                pago
            });
        }

        this.historialPagos = historial;
        this.renderHistorialTable();
    }

    // Renderizar tabla de historial
    renderHistorialTable() {
        const tbody = document.getElementById('historial-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.historialPagos.map(item => `
            <tr class="${item.estado === 'Pendiente' && item.deudaTotal > 0 ? 'row-pending' : ''}">
                <td>${item.mes}</td>
                <td>${Utils.formatCurrency(item.valorGastoComun)}</td>
                <td>${Utils.formatDate(item.fechaVencimiento)}</td>
                <td>${Utils.formatCurrency(item.montoPagado)}</td>
                <td class="${item.valorPendiente > 0 ? 'text-danger' : item.valorPendiente < 0 ? 'text-success' : ''}">
                    ${Utils.formatCurrency(Math.abs(item.valorPendiente))}
                    ${item.valorPendiente < 0 ? ' (Saldo a favor)' : ''}
                </td>
                <td>${Utils.formatCurrency(item.interesMora)}</td>
                <td>${Utils.formatCurrency(item.multaAdicional)}</td>
                <td>${item.mesesMora}</td>
                <td class="${item.deudaTotal > 0 ? 'text-danger' : 'text-success'}">
                    ${Utils.formatCurrency(Math.abs(item.deudaTotal))}
                </td>
                <td>
                    <span class="status-${item.estado.toLowerCase()}">${item.estado}</span>
                </td>
            </tr>
        `).join('');
    }

    // Mostrar formulario de configuración TMC
    showConfigTMC() {
        const formHTML = `
            <form id="config-tmc-form">
                <div class="form-group">
                    <label class="form-label">Tasa Máxima Convencional (TMC) - Porcentaje mensual</label>
                    <input type="number" id="tmc-value" class="form-input" value="${CONFIG.CALCULATIONS.TMC}" min="0" max="10" step="0.1" required>
                    <small class="form-help">Valor actual: ${CONFIG.CALCULATIONS.TMC}% mensual</small>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveTMC()">Guardar</button>
        `;

        window.App.openModal('Configurar TMC', formHTML, footerHTML);
    }

    // Guardar configuración TMC
    saveTMC() {
        const tmcValue = parseFloat(document.getElementById('tmc-value').value);
        if (isNaN(tmcValue) || tmcValue < 0) {
            Utils.showToast('Valor de TMC inválido', 'error');
            return;
        }

        CONFIG.CALCULATIONS.TMC = tmcValue;
        Utils.showToast('TMC actualizada correctamente', 'success');
        window.App.closeModal();

        // Recalcular historial si hay un residente seleccionado
        if (this.selectedResidente) {
            this.generateHistorialPagos();
        }
    }

    // Mostrar formulario de registro de pago
    showRegistrarPago() {
        if (!this.selectedResidente) return;

        const currentPeriod = Utils.getCurrentPeriod();
        
        const formHTML = `
            <form id="registrar-pago-form">
                <div class="form-group">
                    <label class="form-label">Residente</label>
                    <input type="text" class="form-input" value="Parcela ${this.selectedResidente.nParcela} - ${this.selectedResidente.nombreCompleto}" readonly>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Período *</label>
                        <input type="month" id="periodo" class="form-input" value="${currentPeriod}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Monto Pagado *</label>
                        <input type="number" id="monto-pagado" class="form-input" min="0" step="1000" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha de Pago *</label>
                        <input type="date" id="fecha-pago" class="form-input" value="${Utils.formatDateForInput(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Método de Pago *</label>
                        <select id="metodo-pago" class="form-select" required>
                            <option value="">Seleccionar...</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Efectivo">Efectivo</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Comprobante (PDF/JPG)</label>
                    <input type="file" id="comprobante" class="form-input" accept=".pdf,.jpg,.jpeg,.png">
                    <small class="form-help">Opcional: Adjunte el comprobante de pago</small>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveRegistrarPago()">Registrar Pago</button>
        `;

        window.App.openModal('Registrar Pago', formHTML, footerHTML);
    }

    // Guardar registro de pago
    async saveRegistrarPago() {
        try {
            const form = document.getElementById('registrar-pago-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = {
                periodo: document.getElementById('periodo').value,
                montoPagado: parseFloat(document.getElementById('monto-pagado').value),
                fechaPago: document.getElementById('fecha-pago').value,
                metodoPago: document.getElementById('metodo-pago').value
            };

            const comprobanteFile = document.getElementById('comprobante').files[0];

            // Verificar si ya existe un pago para este período
            const existingPago = this.pagos.find(p => 
                p.idResidente === this.selectedResidente.id && 
                p.periodo === formData.periodo
            );

            if (existingPago) {
                const confirmed = await Utils.confirm(
                    'Ya existe un pago registrado para este período. ¿Desea actualizarlo?',
                    'Pago Existente'
                );
                if (!confirmed) return;
            }

            // Subir comprobante a Google Drive si existe
            let idComprobanteDrive = '';
            if (comprobanteFile) {
                try {
                    // Crear estructura de carpetas si no existe
                    const folders = await window.googleAPI.ensureFolderStructure();
                    
                    // Crear carpeta específica para la parcela
                    const parcelaFolderName = `Parcela_${this.selectedResidente.nParcela}`;
                    let parcelaFolder = await window.googleAPI.findFile(parcelaFolderName, 'application/vnd.google-apps.folder');
                    
                    if (parcelaFolder.length === 0) {
                        parcelaFolder = await window.googleAPI.createFolder(parcelaFolderName, folders.parcela_pagos);
                        idComprobanteDrive = parcelaFolder.id;
                    } else {
                        idComprobanteDrive = parcelaFolder[0].id;
                    }

                    // Subir archivo
                    const fileName = `${formData.periodo}-Comprobante.${comprobanteFile.name.split('.').pop()}`;
                    const uploadResult = await window.googleAPI.uploadFile(comprobanteFile, fileName, idComprobanteDrive);
                    idComprobanteDrive = uploadResult.id;

                } catch (error) {
                    console.error('Error subiendo comprobante:', error);
                    Utils.showToast('Error subiendo el comprobante, pero el pago se registrará', 'warning');
                }
            }

            // Calcular fecha de vencimiento
            const [year, month] = formData.periodo.split('-');
            const fechaVencimiento = Utils.formatDate(Utils.generateFechaVencimiento(parseInt(year), parseInt(month)));

            // Preparar datos para Google Sheets
            const rowData = [
                Utils.generateId(),
                this.selectedResidente.id,
                this.selectedResidente.nParcela,
                formData.periodo,
                fechaVencimiento,
                formData.montoPagado,
                formData.fechaPago,
                formData.metodoPago,
                idComprobanteDrive
            ];

            if (existingPago) {
                // Actualizar pago existente
                const range = `A${existingPago.rowIndex + 1}:I${existingPago.rowIndex + 1}`;
                await window.googleAPI.writeSheet(CONFIG.SHEETS.PAGOS_GC, range, [rowData]);
            } else {
                // Agregar nuevo pago
                await window.googleAPI.appendToSheet(CONFIG.SHEETS.PAGOS_GC, rowData);
            }

            Utils.showToast('Pago registrado correctamente', 'success');
            window.App.closeModal();

            // Recargar datos y actualizar historial
            await this.loadData();
            await this.generateHistorialPagos();

        } catch (error) {
            console.error('Error registrando pago:', error);
            Utils.showToast('Error registrando el pago', 'error');
        }
    }
}

// Exportar módulo
window.GastosComunesModule = GastosComunesModule;

