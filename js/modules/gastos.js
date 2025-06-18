// ===== MÓDULO GASTOS COMUNES =====

const GastosModule = {
    data: {
        residentes: [],
        pagos: [],
        filteredPagos: [],
        selectedParcela: '',
        selectedYear: new Date().getFullYear(),
        timcRates: {},
        currentPage: 1,
        itemsPerPage: 10
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando gastos comunes...');
            
            // Cargar datos
            await this.loadData();
            
            // Renderizar contenido
            container.innerHTML = this.getHTML();
            
            // Configurar eventos
            this.setupEvents();
            
            // Aplicar filtros iniciales
            this.applyFilters();
            
        } catch (error) {
            console.error('Error cargando gastos comunes:', error);
            container.innerHTML = `
                <div class="text-center">
                    <h2>Error cargando gastos comunes</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="GastosModule.render(document.getElementById('content-area'))">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    async loadData() {
        try {
            const [residentes, pagos] = await Promise.all([
                sheetsAPI.getResidentes(),
                sheetsAPI.getPagos()
            ]);

            this.data.residentes = residentes;
            this.data.pagos = pagos;
            this.data.filteredPagos = [...pagos];

            // Cargar tasas TIMC guardadas
            this.loadTIMCRates();
        } catch (error) {
            console.error('Error cargando datos:', error);
            throw error;
        }
    },

    loadTIMCRates() {
        // Cargar tasas TIMC desde localStorage o desde los datos existentes
        const savedRates = helpers.loadFromLocalStorage('timc_rates', {});
        this.data.timcRates = savedRates;

        // Configurar en el calculador financiero
        Object.keys(savedRates).forEach(key => {
            const [year, month] = key.split('-');
            financialCalc.setTIMCRate(parseInt(year), parseInt(month), savedRates[key]);
        });
    },

    saveTIMCRates() {
        helpers.saveToLocalStorage('timc_rates', this.data.timcRates);
    },

    getHTML() {
        return `
            <div class="gastos-module">
                <div class="module-header">
                    <h1>Gastos Comunes</h1>
                    <p>Gestión de pagos y cálculos financieros</p>
                </div>

                <!-- Controles superiores -->
                <div class="gastos-controls">
                    <div class="gastos-controls-row">
                        <div class="control-group">
                            <label class="form-label">Seleccionar Parcela</label>
                            <select id="select-parcela" class="form-control">
                                <option value="">Todas las parcelas</option>
                                ${this.generateParcelaOptions()}
                            </select>
                        </div>
                        
                        <div class="control-group">
                            <label class="form-label">Año</label>
                            <select id="select-year" class="form-control">
                                ${this.generateYearOptions()}
                            </select>
                        </div>
                        
                        <div class="control-group">
                            <label class="form-label">TIMC del Mes</label>
                            <div style="display: flex; gap: 8px;">
                                <select id="timc-month" class="form-control">
                                    ${this.generateMonthOptions()}
                                </select>
                                <input type="number" id="timc-rate" class="form-control" 
                                       placeholder="Tasa %" step="0.1" min="0">
                                <button id="save-timc-btn" class="btn btn-secondary">
                                    <i class="fas fa-save"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="control-group">
                            <label class="form-label">&nbsp;</label>
                            <button id="add-pago-btn" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Agregar Gasto Común
                            </button>
                        </div>
                    </div>
                    
                    <!-- Mostrar TIMC del año -->
                    <div class="timc-display">
                        <div class="timc-title">Tasas TIMC ${this.data.selectedYear}</div>
                        <div class="timc-list" id="timc-list">
                            ${this.generateTIMCList()}
                        </div>
                    </div>
                </div>

                <!-- Tabla de gastos comunes -->
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">
                            Gastos Comunes (<span id="total-pagos">0</span>)
                        </div>
                        <div class="table-actions-header">
                            <button id="export-gastos-btn" class="btn btn-outline">
                                <i class="fas fa-file-excel"></i>
                                Exportar Excel
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Parcela</th>
                                    <th>Valor G.C.</th>
                                    <th>Período</th>
                                    <th>F. Vencimiento</th>
                                    <th>Monto Pagado</th>
                                    <th>Saldo</th>
                                    <th>Interés</th>
                                    <th>Multa 1/4</th>
                                    <th>Meses Impago</th>
                                    <th>Deuda Total</th>
                                    <th>F. Pago</th>
                                    <th>Método</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="gastos-tbody">
                                <!-- Contenido generado dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="table-pagination">
                        <div class="pagination-info">
                            Mostrando <span id="showing-from">0</span> a <span id="showing-to">0</span> 
                            de <span id="total-items">0</span> registros
                        </div>
                        <div class="pagination-controls">
                            <button id="prev-page" class="pagination-btn">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <span id="page-numbers"></span>
                            <button id="next-page" class="pagination-btn">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generateParcelaOptions() {
        let options = '';
        for (let i = 1; i <= 26; i++) {
            options += `<option value="${i}">Parcela ${i}</option>`;
        }
        return options;
    },

    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let year = currentYear - 5; year <= currentYear + 1; year++) {
            const selected = year === this.data.selectedYear ? 'selected' : '';
            options += `<option value="${year}" ${selected}>${year}</option>`;
        }
        return options;
    },

    generateMonthOptions() {
        const months = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const currentMonth = new Date().getMonth() + 1;
        let options = '';
        
        months.forEach((month, index) => {
            const value = index + 1;
            const selected = value === currentMonth ? 'selected' : '';
            options += `<option value="${value}" ${selected}>${month}</option>`;
        });
        
        return options;
    },

    generateTIMCList() {
        const months = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];
        
        let html = '';
        for (let month = 1; month <= 12; month++) {
            const key = `${this.data.selectedYear}-${month.toString().padStart(2, '0')}`;
            const rate = this.data.timcRates[key] || 0;
            html += `<div class="timc-item">${months[month - 1]}: ${rate}%</div>`;
        }
        
        return html;
    },

    setupEvents() {
        // Filtro por parcela
        const selectParcela = document.getElementById('select-parcela');
        if (selectParcela) {
            selectParcela.addEventListener('change', () => {
                this.data.selectedParcela = selectParcela.value;
                this.data.currentPage = 1;
                this.applyFilters();
            });
        }

        // Filtro por año
        const selectYear = document.getElementById('select-year');
        if (selectYear) {
            selectYear.addEventListener('change', () => {
                this.data.selectedYear = parseInt(selectYear.value);
                this.data.currentPage = 1;
                this.applyFilters();
                this.updateTIMCDisplay();
            });
        }

        // TIMC
        const timcMonth = document.getElementById('timc-month');
        const timcRate = document.getElementById('timc-rate');
        const saveTIMCBtn = document.getElementById('save-timc-btn');

        if (timcMonth && timcRate) {
            // Cargar tasa actual al cambiar mes
            timcMonth.addEventListener('change', () => {
                const key = `${this.data.selectedYear}-${timcMonth.value.padStart(2, '0')}`;
                timcRate.value = this.data.timcRates[key] || '';
            });

            // Cargar tasa inicial
            const currentKey = `${this.data.selectedYear}-${timcMonth.value.padStart(2, '0')}`;
            timcRate.value = this.data.timcRates[currentKey] || '';
        }

        if (saveTIMCBtn) {
            saveTIMCBtn.addEventListener('click', () => this.saveTIMCRate());
        }

        // Agregar pago
        const addPagoBtn = document.getElementById('add-pago-btn');
        if (addPagoBtn) {
            addPagoBtn.addEventListener('click', () => this.showPagoModal());
        }

        // Exportar Excel
        const exportBtn = document.getElementById('export-gastos-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }

        // Paginación
        this.setupPaginationEvents();
    },

    setupPaginationEvents() {
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.data.currentPage > 1) {
                    this.data.currentPage--;
                    this.renderTable();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.data.filteredPagos.length / this.data.itemsPerPage);
                if (this.data.currentPage < totalPages) {
                    this.data.currentPage++;
                    this.renderTable();
                }
            });
        }
    },

    saveTIMCRate() {
        const timcMonth = document.getElementById('timc-month');
        const timcRate = document.getElementById('timc-rate');
        
        if (!timcMonth || !timcRate || !timcRate.value) {
            app.showNotification('Ingrese una tasa TIMC válida', 'warning');
            return;
        }

        const month = timcMonth.value.padStart(2, '0');
        const rate = parseFloat(timcRate.value);
        const key = `${this.data.selectedYear}-${month}`;

        // Guardar en datos locales
        this.data.timcRates[key] = rate;
        this.saveTIMCRates();

        // Configurar en calculador financiero
        financialCalc.setTIMCRate(this.data.selectedYear, parseInt(month), rate);

        // Actualizar display
        this.updateTIMCDisplay();

        // Recalcular pagos si es necesario
        this.recalculatePayments();

        app.showNotification(`TIMC de ${timcMonth.options[timcMonth.selectedIndex].text} ${this.data.selectedYear} guardado: ${rate}%`, 'success');
    },

    updateTIMCDisplay() {
        const timcList = document.getElementById('timc-list');
        if (timcList) {
            timcList.innerHTML = this.generateTIMCList();
        }
    },

    async recalculatePayments() {
        // Recalcular todos los pagos con las nuevas tasas TIMC
        // Esto se haría en un escenario real, por ahora solo refrescamos la tabla
        this.applyFilters();
    },

    applyFilters() {
        let filtered = [...this.data.pagos];

        // Filtrar por parcela
        if (this.data.selectedParcela) {
            filtered = filtered.filter(p => p.N_Parcela == this.data.selectedParcela);
        }

        // Filtrar por año
        filtered = filtered.filter(p => {
            const [year] = p.Periodo.split('-');
            return parseInt(year) === this.data.selectedYear;
        });

        // Calcular datos financieros para cada pago
        filtered = filtered.map(pago => {
            const residente = this.data.residentes.find(r => r.N_Parcela == pago.N_Parcela);
            const gastoComun = parseFloat(pago.Valor_Gasto_Comun || residente?.ValorGastoComun || 0);
            
            const summary = financialCalc.calculatePaymentSummary({
                gastoComun,
                periodo: pago.Periodo,
                montoPagado: parseFloat(pago.MontoPagado || 0),
                fechaPago: pago.FechaPago
            });

            return {
                ...pago,
                ...summary,
                nombreResidente: residente?.NombreCompleto || 'No encontrado'
            };
        });

        this.data.filteredPagos = filtered;
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('gastos-tbody');
        const totalItems = this.data.filteredPagos.length;
        const startIndex = (this.data.currentPage - 1) * this.data.itemsPerPage;
        const endIndex = Math.min(startIndex + this.data.itemsPerPage, totalItems);
        const pageItems = this.data.filteredPagos.slice(startIndex, endIndex);

        // Renderizar filas
        tbody.innerHTML = pageItems.map((pago, index) => `
            <tr>
                <td>${pago.nombreResidente}</td>
                <td>${pago.N_Parcela}</td>
                <td>${helpers.formatCurrency(pago.gastoComun)}</td>
                <td>${pago.periodo}</td>
                <td>${helpers.formatDate(pago.fechaVencimiento)}</td>
                <td>${helpers.formatCurrency(pago.montoPagado)}</td>
                <td class="${pago.saldo >= 0 ? 'text-success' : 'text-danger'}">
                    ${helpers.formatCurrency(pago.saldo)}
                </td>
                <td>${helpers.formatCurrency(pago.interes)}</td>
                <td>${helpers.formatCurrency(pago.multaTotal)}</td>
                <td>${pago.mesesImpago}</td>
                <td class="${pago.deudaTotal > 0 ? 'text-danger' : 'text-success'}">
                    ${helpers.formatCurrency(pago.deudaTotal)}
                </td>
                <td>${pago.fechaPago ? helpers.formatDate(pago.fechaPago) : '-'}</td>
                <td>${pago.MetodoPago || '-'}</td>
                <td>
                    <span class="status-badge status-${pago.estado.toLowerCase()}">
                        <i class="fas fa-circle"></i>
                        ${pago.estado}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="GastosModule.editPago(${startIndex + index})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="GastosModule.sendComprobante(${startIndex + index})" title="Enviar Comprobante">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Actualizar información de paginación
        document.getElementById('total-pagos').textContent = totalItems;
        document.getElementById('showing-from').textContent = totalItems > 0 ? startIndex + 1 : 0;
        document.getElementById('showing-to').textContent = endIndex;
        document.getElementById('total-items').textContent = totalItems;

        // Actualizar controles de paginación
        this.updatePaginationControls();
    },

    updatePaginationControls() {
        const totalPages = Math.ceil(this.data.filteredPagos.length / this.data.itemsPerPage);
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageNumbers = document.getElementById('page-numbers');

        if (!prevBtn || !nextBtn || !pageNumbers) return;

        // Habilitar/deshabilitar botones
        prevBtn.disabled = this.data.currentPage === 1;
        nextBtn.disabled = this.data.currentPage === totalPages || totalPages === 0;

        // Generar números de página
        let pagesHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.data.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pagesHTML += `
                <button class="pagination-btn ${i === this.data.currentPage ? 'active' : ''}" 
                        onclick="GastosModule.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        pageNumbers.innerHTML = pagesHTML;
    },

    goToPage(page) {
        this.data.currentPage = page;
        this.renderTable();
    },

    showPagoModal(pagoIndex = null) {
        const isEdit = pagoIndex !== null;
        const pago = isEdit ? this.data.filteredPagos[pagoIndex] : {};
        
        const modalContent = `
            <form id="pago-form">
                <div class="form-section">
                    <h3 class="form-section-title">Información del Pago</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">N° Parcela *</label>
                            <select name="nParcela" id="pago-parcela" class="form-control" required ${isEdit ? 'disabled' : ''}>
                                <option value="">Seleccionar parcela</option>
                                ${this.generateParcelaOptionsForModal(pago.N_Parcela)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nombre Residente</label>
                            <input type="text" id="pago-nombre" class="form-control" readonly>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha de Pago *</label>
                            <input type="date" name="fechaPago" class="form-control" 
                                   value="${pago.FechaPago || helpers.getCurrentDate()}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Período (Mes que está pagando) *</label>
                            <input type="month" name="periodo" class="form-control" 
                                   value="${pago.Periodo || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Monto Pagado *</label>
                            <input type="number" name="montoPagado" class="form-control" 
                                   value="${pago.MontoPagado || ''}" min="0" step="1000" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Método de Pago *</label>
                            <select name="metodoPago" class="form-control" required>
                                <option value="">Seleccionar método</option>
                                <option value="Transferencia" ${pago.MetodoPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                                <option value="Efectivo" ${pago.MetodoPago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                                <option value="Deposito" ${pago.MetodoPago === 'Deposito' ? 'selected' : ''}>Depósito</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Comprobante de Pago</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Adjuntar Comprobante</label>
                        <div class="file-upload">
                            <input type="file" name="comprobante" accept=".pdf,.jpg,.jpeg,.png">
                            <div class="file-upload-label">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <span>Seleccionar archivo o arrastrar aquí</span>
                            </div>
                        </div>
                        <div class="form-help">Formatos permitidos: PDF, JPG, PNG</div>
                    </div>
                </div>

                <!-- Resumen de cálculos (solo en edición) -->
                ${isEdit ? this.getCalculationSummaryHTML(pago) : ''}
            </form>
        `;

        const actions = [
            {
                text: isEdit ? 'Actualizar' : 'Guardar',
                class: 'btn-primary',
                onclick: `GastosModule.savePago(${pagoIndex})`
            }
        ];

        app.showModal(
            isEdit ? 'Editar Pago' : 'Registrar Pago',
            modalContent,
            actions
        );

        // Configurar eventos del modal
        this.setupModalEvents();
    },

    generateParcelaOptionsForModal(selectedParcela) {
        let options = '';
        for (let i = 1; i <= 26; i++) {
            const selected = selectedParcela == i ? 'selected' : '';
            options += `<option value="${i}" ${selected}>Parcela ${i}</option>`;
        }
        return options;
    },

    getCalculationSummaryHTML(pago) {
        return `
            <div class="form-section">
                <h3 class="form-section-title">Resumen de Cálculos</h3>
                
                <div class="row">
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label">Valor Gasto Común</label>
                            <input type="text" class="form-control" value="${helpers.formatCurrency(pago.gastoComun)}" readonly>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label">Fecha Vencimiento</label>
                            <input type="text" class="form-control" value="${helpers.formatDate(pago.fechaVencimiento)}" readonly>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-4">
                        <div class="form-group">
                            <label class="form-label">Interés</label>
                            <input type="text" class="form-control" value="${helpers.formatCurrency(pago.interes)}" readonly>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="form-group">
                            <label class="form-label">Multa 1/4</label>
                            <input type="text" class="form-control" value="${helpers.formatCurrency(pago.multaTotal)}" readonly>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="form-group">
                            <label class="form-label">Meses Impago</label>
                            <input type="text" class="form-control" value="${pago.mesesImpago}" readonly>
                        </div>
                    </div>
                </div>
                
                <div class="row">
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label">Deuda Total</label>
                            <input type="text" class="form-control text-danger" value="${helpers.formatCurrency(pago.deudaTotal)}" readonly>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-group">
                            <label class="form-label">Saldo</label>
                            <input type="text" class="form-control ${pago.saldo >= 0 ? 'text-success' : 'text-danger'}" 
                                   value="${helpers.formatCurrency(pago.saldo)}" readonly>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    setupModalEvents() {
        // Autocompletar nombre al seleccionar parcela
        const parcelaSelect = document.getElementById('pago-parcela');
        const nombreInput = document.getElementById('pago-nombre');
        
        if (parcelaSelect && nombreInput) {
            parcelaSelect.addEventListener('change', () => {
                const parcela = parcelaSelect.value;
                if (parcela) {
                    const residente = this.data.residentes.find(r => r.N_Parcela == parcela);
                    nombreInput.value = residente ? residente.NombreCompleto : 'No encontrado';
                } else {
                    nombreInput.value = '';
                }
            });

            // Trigger inicial si hay parcela seleccionada
            if (parcelaSelect.value) {
                parcelaSelect.dispatchEvent(new Event('change'));
            }
        }

        // Configurar validación
        const form = document.getElementById('pago-form');
        if (form) {
            validator.setupRealTimeValidation(form);
        }

        // Configurar file upload
        this.setupFileUpload();
    },

    setupFileUpload() {
        const fileInput = document.querySelector('input[type="file"]');
        const fileLabel = document.querySelector('.file-upload-label span');
        const fileUpload = document.querySelector('.file-upload');
        
        if (fileInput && fileLabel && fileUpload) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    fileLabel.textContent = file.name;
                    fileUpload.classList.add('has-file');
                } else {
                    fileLabel.textContent = 'Seleccionar archivo o arrastrar aquí';
                    fileUpload.classList.remove('has-file');
                }
            });
        }
    },

    async savePago(pagoIndex) {
        const form = document.getElementById('pago-form');
        if (!form) return;

        // Validar formulario
        const validation = validator.validateForm(form);
        if (!validation.isValid) {
            app.showNotification('Por favor corrija los errores en el formulario', 'error');
            return;
        }

        try {
            const formData = helpers.getFormData(form);
            const isEdit = pagoIndex !== null;

            // Obtener datos del residente
            const residente = this.data.residentes.find(r => r.N_Parcela == formData.nParcela);
            if (!residente) {
                app.showNotification('Residente no encontrado', 'error');
                return;
            }

            // Subir comprobante si existe
            let idComprobante = '';
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && fileInput.files[0]) {
                try {
                    const file = fileInput.files[0];
                    const fileName = `comprobante_${formData.nParcela}_${formData.periodo}_${Date.now()}.${file.name.split('.').pop()}`;
                    const uploadResult = await driveAPI.uploadComprobantePago(file, formData.nParcela, fileName);
                    idComprobante = uploadResult.id;
                } catch (uploadError) {
                    console.error('Error subiendo comprobante:', uploadError);
                    app.showNotification('Error subiendo comprobante, pero el pago se guardará', 'warning');
                }
            }

            // Calcular datos financieros
            const gastoComun = parseFloat(residente.ValorGastoComun);
            const summary = financialCalc.calculatePaymentSummary({
                gastoComun,
                periodo: formData.periodo,
                montoPagado: parseFloat(formData.montoPagado),
                fechaPago: formData.fechaPago
            });

            // Preparar datos para guardar
            const pagoData = {
                nombreResidente: residente.NombreCompleto,
                nParcela: formData.nParcela,
                valorGastoComun: gastoComun,
                periodo: formData.periodo,
                fechaVencimiento: summary.fechaVencimiento,
                montoPagado: formData.montoPagado,
                saldoPendiente: summary.saldo,
                interes: summary.interes,
                timc: this.data.timcRates[`${formData.periodo.split('-')[0]}-${formData.periodo.split('-')[1]}`] || 0,
                multa: summary.multaTotal,
                mesesImpagos: summary.mesesImpago,
                deudaTotal: summary.deudaTotal,
                fechaPago: formData.fechaPago,
                metodoPago: formData.metodoPago,
                estado: summary.estado,
                idComprobante
            };

            if (isEdit) {
                // Actualizar pago existente
                const realIndex = this.findRealPagoIndex(pagoIndex);
                await sheetsAPI.updatePago(realIndex, pagoData);
                app.showNotification('Pago actualizado correctamente', 'success');
            } else {
                // Agregar nuevo pago
                await sheetsAPI.addPago(pagoData);
                app.showNotification('Pago registrado correctamente', 'success');
            }

            // Recargar datos y cerrar modal
            await this.loadData();
            this.applyFilters();
            app.hideModal();

        } catch (error) {
            console.error('Error guardando pago:', error);
            app.showNotification('Error al guardar el pago: ' + error.message, 'error');
        }
    },

    findRealPagoIndex(filteredIndex) {
        const pago = this.data.filteredPagos[filteredIndex];
        return this.data.pagos.findIndex(p => 
            p.N_Parcela === pago.N_Parcela && 
            p.Periodo === pago.Periodo &&
            p.FechaPago === pago.FechaPago
        );
    },

    editPago(index) {
        this.showPagoModal(index);
    },

    async sendComprobante(index) {
        const pago = this.data.filteredPagos[index];
        const residente = this.data.residentes.find(r => r.N_Parcela == pago.N_Parcela);
        
        if (!residente) {
            app.showNotification('Residente no encontrado', 'error');
            return;
        }

        try {
            await gmailAPI.sendComprobantePago(residente, pago);
            
            // Registrar comunicación
            await sheetsAPI.addComunicacion({
                idResidente: residente.ID_Residente,
                nParcela: residente.N_Parcela,
                nombreCompleto: residente.NombreCompleto,
                email: residente.Email,
                fechaEnvio: helpers.getCurrentDateTime(),
                asunto: `Comprobante de Pago - ${pago.periodo}`,
                mensaje: 'Comprobante de pago enviado'
            });

            app.showNotification('Comprobante enviado correctamente', 'success');
        } catch (error) {
            console.error('Error enviando comprobante:', error);
            app.showNotification('Error al enviar comprobante: ' + error.message, 'error');
        }
    },

    exportToExcel() {
        try {
            const data = this.data.filteredPagos.map(p => ({
                'Nombre': p.nombreResidente,
                'Parcela': p.N_Parcela,
                'Valor G.C.': p.gastoComun,
                'Período': p.periodo,
                'F. Vencimiento': p.fechaVencimiento,
                'Monto Pagado': p.montoPagado,
                'Saldo': p.saldo,
                'Interés': p.interes,
                'Multa 1/4': p.multaTotal,
                'Meses Impago': p.mesesImpago,
                'Deuda Total': p.deudaTotal,
                'F. Pago': p.fechaPago || '',
                'Método': p.MetodoPago || '',
                'Estado': p.estado
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Gastos Comunes');
            
            const fileName = `gastos_comunes_${this.data.selectedYear}_${helpers.getCurrentDate()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            app.showNotification('Archivo Excel exportado correctamente', 'success');

        } catch (error) {
            console.error('Error exportando a Excel:', error);
            app.showNotification('Error al exportar a Excel: ' + error.message, 'error');
        }
    }
};

// Exportar para uso global
window.GastosModule = GastosModule;

