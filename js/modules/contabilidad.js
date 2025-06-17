// ===== MÓDULO CONTABILIDAD =====

const ContabilidadModule = {
    data: {
        ingresos: [],
        egresos: [],
        activeTab: 'egresos',
        filteredData: [],
        currentPage: 1,
        itemsPerPage: 10,
        dateFilter: '',
        categoryFilter: ''
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando contabilidad...');
            
            // Cargar datos
            await this.loadData();
            
            // Renderizar contenido
            container.innerHTML = this.getHTML();
            
            // Configurar eventos
            this.setupEvents();
            
            // Mostrar pestaña activa
            this.showTab(this.data.activeTab);
            
        } catch (error) {
            console.error('Error cargando contabilidad:', error);
            container.innerHTML = `
                <div class="text-center">
                    <h2>Error cargando contabilidad</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="ContabilidadModule.render(document.getElementById('content-area'))">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    async loadData() {
        try {
            const [pagos, egresos] = await Promise.all([
                sheetsAPI.getPagos(),
                sheetsAPI.getEgresos()
            ]);

            // Convertir pagos a ingresos
            this.data.ingresos = pagos.map(pago => ({
                id: pago.ID_Pago,
                fecha: pago.FechaPago,
                descripcion: `Pago G.C. Parcela ${pago.N_Parcela} - ${pago.Periodo}`,
                categoria: 'Gastos Comunes',
                monto: parseFloat(pago.MontoPagado || 0),
                residente: pago.Nombre_Residente,
                parcela: pago.N_Parcela,
                periodo: pago.Periodo
            })).filter(ingreso => ingreso.fecha); // Solo pagos con fecha

            this.data.egresos = egresos.map(egreso => ({
                ...egreso,
                monto: parseFloat(egreso.Monto || 0)
            }));

        } catch (error) {
            console.error('Error cargando datos de contabilidad:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="contabilidad-module">
                <div class="module-header">
                    <h1>Contabilidad</h1>
                    <p>Vista financiera general del condominio</p>
                </div>

                <!-- Pestañas -->
                <div class="tabs-container">
                    <div class="tabs-nav">
                        <button class="tab-btn ${this.data.activeTab === 'egresos' ? 'active' : ''}" 
                                onclick="ContabilidadModule.showTab('egresos')">
                            <i class="fas fa-arrow-down"></i>
                            Egresos
                        </button>
                        <button class="tab-btn ${this.data.activeTab === 'ingresos' ? 'active' : ''}" 
                                onclick="ContabilidadModule.showTab('ingresos')">
                            <i class="fas fa-arrow-up"></i>
                            Ingresos
                        </button>
                    </div>
                </div>

                <!-- Pestaña Egresos -->
                <div id="egresos-tab" class="tab-content ${this.data.activeTab === 'egresos' ? 'active' : ''}">
                    ${this.getEgresosHTML()}
                </div>

                <!-- Pestaña Ingresos -->
                <div id="ingresos-tab" class="tab-content ${this.data.activeTab === 'ingresos' ? 'active' : ''}">
                    ${this.getIngresosHTML()}
                </div>
            </div>
        `;
    },

    getEgresosHTML() {
        return `
            <!-- Filtros y controles -->
            <div class="filters-container">
                <div class="search-container">
                    <div class="form-group">
                        <label class="form-label">Filtrar por fecha</label>
                        <input type="month" id="filter-date-egresos" class="form-control">
                    </div>
                </div>
                
                <div class="filter-group">
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select id="filter-category-egresos" class="form-control">
                            <option value="">Todas las categorías</option>
                            <option value="Remuneraciones">Remuneraciones</option>
                            <option value="Servicios Básicos">Servicios Básicos</option>
                            <option value="Mantención">Mantención</option>
                            <option value="Administrativo">Administrativo</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                </div>
                
                <div class="filter-group">
                    <div class="form-group">
                        <label class="form-label">&nbsp;</label>
                        <button id="add-egreso-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Agregar Gasto
                        </button>
                    </div>
                </div>
            </div>

            <!-- Resumen financiero -->
            <div class="financial-summary">
                <div class="row">
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-danger">
                                <i class="fas fa-arrow-down"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Total Egresos</div>
                                <div class="summary-value" id="total-egresos">$0</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-warning">
                                <i class="fas fa-calendar-month"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Egresos del Mes</div>
                                <div class="summary-value" id="egresos-mes">$0</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-info">
                                <i class="fas fa-chart-pie"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Categoría Principal</div>
                                <div class="summary-value" id="categoria-principal">-</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-secondary">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Total Registros</div>
                                <div class="summary-value" id="total-registros-egresos">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de egresos -->
            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">
                        Egresos (<span id="total-egresos-count">0</span>)
                    </div>
                    <div class="table-actions-header">
                        <button id="export-egresos-btn" class="btn btn-outline">
                            <i class="fas fa-file-excel"></i>
                            Exportar Excel
                        </button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Descripción</th>
                                <th>Proveedor</th>
                                <th>RUT Proveedor</th>
                                <th>Monto</th>
                                <th>Factura</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="egresos-tbody">
                            <!-- Contenido generado dinámicamente -->
                        </tbody>
                    </table>
                </div>
                
                <div class="table-pagination">
                    <div class="pagination-info">
                        Mostrando <span id="showing-from-egresos">0</span> a <span id="showing-to-egresos">0</span> 
                        de <span id="total-items-egresos">0</span> registros
                    </div>
                    <div class="pagination-controls">
                        <button id="prev-page-egresos" class="pagination-btn">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span id="page-numbers-egresos"></span>
                        <button id="next-page-egresos" class="pagination-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    getIngresosHTML() {
        return `
            <!-- Filtros y controles -->
            <div class="filters-container">
                <div class="search-container">
                    <div class="form-group">
                        <label class="form-label">Filtrar por fecha</label>
                        <input type="month" id="filter-date-ingresos" class="form-control">
                    </div>
                </div>
                
                <div class="filter-group">
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select id="filter-category-ingresos" class="form-control">
                            <option value="">Todas las categorías</option>
                            <option value="Gastos Comunes">Gastos Comunes</option>
                            <option value="Multas">Multas</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Resumen financiero -->
            <div class="financial-summary">
                <div class="row">
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-success">
                                <i class="fas fa-arrow-up"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Total Ingresos</div>
                                <div class="summary-value" id="total-ingresos">$0</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-info">
                                <i class="fas fa-calendar-month"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Ingresos del Mes</div>
                                <div class="summary-value" id="ingresos-mes">$0</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-primary">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Eficiencia Cobranza</div>
                                <div class="summary-value" id="eficiencia-cobranza">0%</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="summary-card">
                            <div class="summary-icon bg-secondary">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <div class="summary-content">
                                <div class="summary-title">Total Pagos</div>
                                <div class="summary-value" id="total-registros-ingresos">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabla de ingresos -->
            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">
                        Ingresos (<span id="total-ingresos-count">0</span>)
                    </div>
                    <div class="table-actions-header">
                        <button id="export-ingresos-btn" class="btn btn-outline">
                            <i class="fas fa-file-excel"></i>
                            Exportar Excel
                        </button>
                    </div>
                </div>
                
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Residente</th>
                                <th>Parcela</th>
                                <th>Período</th>
                                <th>Monto</th>
                                <th>Categoría</th>
                            </tr>
                        </thead>
                        <tbody id="ingresos-tbody">
                            <!-- Contenido generado dinámicamente -->
                        </tbody>
                    </table>
                </div>
                
                <div class="table-pagination">
                    <div class="pagination-info">
                        Mostrando <span id="showing-from-ingresos">0</span> a <span id="showing-to-ingresos">0</span> 
                        de <span id="total-items-ingresos">0</span> registros
                    </div>
                    <div class="pagination-controls">
                        <button id="prev-page-ingresos" class="pagination-btn">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span id="page-numbers-ingresos"></span>
                        <button id="next-page-ingresos" class="pagination-btn">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        // Eventos de pestañas ya configurados en el HTML

        // Eventos de egresos
        this.setupEgresosEvents();
        
        // Eventos de ingresos
        this.setupIngresosEvents();
    },

    setupEgresosEvents() {
        // Filtros
        const dateFilter = document.getElementById('filter-date-egresos');
        const categoryFilter = document.getElementById('filter-category-egresos');
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.data.dateFilter = dateFilter.value;
                this.data.currentPage = 1;
                this.applyFilters('egresos');
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.data.categoryFilter = categoryFilter.value;
                this.data.currentPage = 1;
                this.applyFilters('egresos');
            });
        }

        // Agregar egreso
        const addBtn = document.getElementById('add-egreso-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showEgresoModal());
        }

        // Exportar
        const exportBtn = document.getElementById('export-egresos-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel('egresos'));
        }

        // Paginación
        this.setupPaginationEvents('egresos');
    },

    setupIngresosEvents() {
        // Filtros
        const dateFilter = document.getElementById('filter-date-ingresos');
        const categoryFilter = document.getElementById('filter-category-ingresos');
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.data.dateFilter = dateFilter.value;
                this.data.currentPage = 1;
                this.applyFilters('ingresos');
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.data.categoryFilter = categoryFilter.value;
                this.data.currentPage = 1;
                this.applyFilters('ingresos');
            });
        }

        // Exportar
        const exportBtn = document.getElementById('export-ingresos-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel('ingresos'));
        }

        // Paginación
        this.setupPaginationEvents('ingresos');
    },

    setupPaginationEvents(type) {
        const prevBtn = document.getElementById(`prev-page-${type}`);
        const nextBtn = document.getElementById(`next-page-${type}`);
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.data.currentPage > 1) {
                    this.data.currentPage--;
                    this.renderTable(type);
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.data.filteredData.length / this.data.itemsPerPage);
                if (this.data.currentPage < totalPages) {
                    this.data.currentPage++;
                    this.renderTable(type);
                }
            });
        }
    },

    showTab(tabName) {
        this.data.activeTab = tabName;
        this.data.currentPage = 1;
        this.data.dateFilter = '';
        this.data.categoryFilter = '';

        // Actualizar pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[onclick="ContabilidadModule.showTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Aplicar filtros y renderizar
        this.applyFilters(tabName);
    },

    applyFilters(type) {
        const data = type === 'egresos' ? this.data.egresos : this.data.ingresos;
        let filtered = [...data];

        // Filtrar por fecha
        if (this.data.dateFilter) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.fecha);
                const filterDate = new Date(this.data.dateFilter + '-01');
                return itemDate.getMonth() === filterDate.getMonth() && 
                       itemDate.getFullYear() === filterDate.getFullYear();
            });
        }

        // Filtrar por categoría
        if (this.data.categoryFilter) {
            filtered = filtered.filter(item => item.Categoria === this.data.categoryFilter || item.categoria === this.data.categoryFilter);
        }

        this.data.filteredData = filtered;
        this.renderTable(type);
        this.updateSummary(type);
    },

    renderTable(type) {
        const tbody = document.getElementById(`${type}-tbody`);
        const totalItems = this.data.filteredData.length;
        const startIndex = (this.data.currentPage - 1) * this.data.itemsPerPage;
        const endIndex = Math.min(startIndex + this.data.itemsPerPage, totalItems);
        const pageItems = this.data.filteredData.slice(startIndex, endIndex);

        if (type === 'egresos') {
            tbody.innerHTML = pageItems.map((egreso, index) => `
                <tr>
                    <td>${helpers.formatDate(egreso.Fecha)}</td>
                    <td>
                        <span class="category-badge category-${egreso.Categoria.toLowerCase().replace(/\s+/g, '-')}">
                            ${egreso.Categoria}
                        </span>
                    </td>
                    <td>${egreso.Descripcion}</td>
                    <td>${egreso.Proveedor}</td>
                    <td>${egreso.Rut_Proveedor || '-'}</td>
                    <td class="text-danger">${helpers.formatCurrency(egreso.monto)}</td>
                    <td>
                        ${egreso.ID_Factura_Drive ? 
                            `<a href="${driveAPI.getPreviewLink(egreso.ID_Factura_Drive)}" target="_blank" class="btn btn-sm btn-outline">
                                <i class="fas fa-file"></i>
                            </a>` : '-'
                        }
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline" onclick="ContabilidadModule.editEgreso(${startIndex + index})" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="ContabilidadModule.deleteEgreso(${startIndex + index})" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = pageItems.map((ingreso) => `
                <tr>
                    <td>${helpers.formatDate(ingreso.fecha)}</td>
                    <td>${ingreso.descripcion}</td>
                    <td>${ingreso.residente}</td>
                    <td>${ingreso.parcela}</td>
                    <td>${ingreso.periodo}</td>
                    <td class="text-success">${helpers.formatCurrency(ingreso.monto)}</td>
                    <td>
                        <span class="category-badge category-${ingreso.categoria.toLowerCase().replace(/\s+/g, '-')}">
                            ${ingreso.categoria}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        // Actualizar información de paginación
        document.getElementById(`total-${type}-count`).textContent = totalItems;
        document.getElementById(`showing-from-${type}`).textContent = totalItems > 0 ? startIndex + 1 : 0;
        document.getElementById(`showing-to-${type}`).textContent = endIndex;
        document.getElementById(`total-items-${type}`).textContent = totalItems;

        // Actualizar controles de paginación
        this.updatePaginationControls(type);
    },

    updatePaginationControls(type) {
        const totalPages = Math.ceil(this.data.filteredData.length / this.data.itemsPerPage);
        const prevBtn = document.getElementById(`prev-page-${type}`);
        const nextBtn = document.getElementById(`next-page-${type}`);
        const pageNumbers = document.getElementById(`page-numbers-${type}`);

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
                        onclick="ContabilidadModule.goToPage(${i}, '${type}')">
                    ${i}
                </button>
            `;
        }

        pageNumbers.innerHTML = pagesHTML;
    },

    updateSummary(type) {
        if (type === 'egresos') {
            const totalEgresos = this.data.egresos.reduce((sum, e) => sum + e.monto, 0);
            const egresosMes = this.getMonthlyTotal(this.data.egresos);
            const categoriaPrincipal = this.getTopCategory(this.data.egresos);
            
            document.getElementById('total-egresos').textContent = helpers.formatCurrency(totalEgresos);
            document.getElementById('egresos-mes').textContent = helpers.formatCurrency(egresosMes);
            document.getElementById('categoria-principal').textContent = categoriaPrincipal;
            document.getElementById('total-registros-egresos').textContent = this.data.egresos.length;
        } else {
            const totalIngresos = this.data.ingresos.reduce((sum, i) => sum + i.monto, 0);
            const ingresosMes = this.getMonthlyTotal(this.data.ingresos);
            const eficienciaCobranza = this.calculateCobranzaEfficiency();
            
            document.getElementById('total-ingresos').textContent = helpers.formatCurrency(totalIngresos);
            document.getElementById('ingresos-mes').textContent = helpers.formatCurrency(ingresosMes);
            document.getElementById('eficiencia-cobranza').textContent = eficienciaCobranza + '%';
            document.getElementById('total-registros-ingresos').textContent = this.data.ingresos.length;
        }
    },

    getMonthlyTotal(data) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return data
            .filter(item => {
                const itemDate = new Date(item.fecha || item.Fecha);
                return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
            })
            .reduce((sum, item) => sum + item.monto, 0);
    },

    getTopCategory(data) {
        const categories = {};
        data.forEach(item => {
            const cat = item.Categoria || item.categoria;
            categories[cat] = (categories[cat] || 0) + item.monto;
        });
        
        const topCategory = Object.keys(categories).reduce((a, b) => 
            categories[a] > categories[b] ? a : b, Object.keys(categories)[0]
        );
        
        return topCategory || '-';
    },

    calculateCobranzaEfficiency() {
        // Calcular eficiencia de cobranza del mes actual
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const ingresosMes = this.getMonthlyTotal(this.data.ingresos);
        // Estimación simple: 26 parcelas * promedio de gasto común
        const promedioGastoComun = 50000; // Esto debería calcularse desde los datos reales
        const ingresoEsperado = 26 * promedioGastoComun;
        
        return ingresoEsperado > 0 ? Math.round((ingresosMes / ingresoEsperado) * 100) : 0;
    },

    goToPage(page, type) {
        this.data.currentPage = page;
        this.renderTable(type);
    },

    showEgresoModal(egresoIndex = null) {
        const isEdit = egresoIndex !== null;
        const egreso = isEdit ? this.data.filteredData[egresoIndex] : {};
        
        const modalContent = `
            <form id="egreso-form">
                <div class="form-section">
                    <h3 class="form-section-title">Información del Gasto</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Fecha *</label>
                            <input type="date" name="fecha" class="form-control" 
                                   value="${egreso.Fecha || helpers.getCurrentDate()}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Categoría *</label>
                            <select name="categoria" class="form-control" required>
                                <option value="">Seleccionar categoría</option>
                                <option value="Remuneraciones" ${egreso.Categoria === 'Remuneraciones' ? 'selected' : ''}>Remuneraciones</option>
                                <option value="Servicios Básicos" ${egreso.Categoria === 'Servicios Básicos' ? 'selected' : ''}>Servicios Básicos</option>
                                <option value="Mantención" ${egreso.Categoria === 'Mantención' ? 'selected' : ''}>Mantención</option>
                                <option value="Administrativo" ${egreso.Categoria === 'Administrativo' ? 'selected' : ''}>Administrativo</option>
                                <option value="Otros" ${egreso.Categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Descripción *</label>
                        <textarea name="descripcion" class="form-control" rows="3" required>${egreso.Descripcion || ''}</textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Proveedor *</label>
                            <input type="text" name="proveedor" class="form-control" 
                                   value="${egreso.Proveedor || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">RUT Proveedor</label>
                            <input type="text" name="rutProveedor" class="form-control" 
                                   value="${egreso.Rut_Proveedor || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Monto *</label>
                        <input type="number" name="monto" class="form-control" 
                               value="${egreso.Monto || ''}" min="0" step="1000" required>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Factura/Boleta</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Adjuntar Factura</label>
                        <div class="file-upload">
                            <input type="file" name="factura" accept=".pdf,.jpg,.jpeg,.png">
                            <div class="file-upload-label">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <span>Seleccionar archivo o arrastrar aquí</span>
                            </div>
                        </div>
                        <div class="form-help">Formatos permitidos: PDF, JPG, PNG</div>
                    </div>
                </div>
            </form>
        `;

        const actions = [
            {
                text: isEdit ? 'Actualizar' : 'Guardar',
                class: 'btn-primary',
                onclick: `ContabilidadModule.saveEgreso(${egresoIndex})`
            }
        ];

        app.showModal(
            isEdit ? 'Editar Gasto' : 'Agregar Gasto',
            modalContent,
            actions
        );

        // Configurar validación y eventos
        const form = document.getElementById('egreso-form');
        if (form) {
            validator.setupRealTimeValidation(form);
            
            // Configurar formateo de RUT
            const rutField = form.querySelector('[name="rutProveedor"]');
            if (rutField) {
                validator.setupRUTFormatting(rutField);
            }
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

    async saveEgreso(egresoIndex) {
        const form = document.getElementById('egreso-form');
        if (!form) return;

        // Validar formulario
        const validation = validator.validateForm(form);
        if (!validation.isValid) {
            app.showNotification('Por favor corrija los errores en el formulario', 'error');
            return;
        }

        try {
            const formData = helpers.getFormData(form);
            const isEdit = egresoIndex !== null;

            // Subir factura si existe
            let idFactura = '';
            const fileInput = form.querySelector('input[type="file"]');
            if (fileInput && fileInput.files[0]) {
                try {
                    const file = fileInput.files[0];
                    const fileName = `factura_${formData.proveedor}_${Date.now()}.${file.name.split('.').pop()}`;
                    const uploadResult = await driveAPI.uploadFacturaEgreso(file, fileName);
                    idFactura = uploadResult.id;
                } catch (uploadError) {
                    console.error('Error subiendo factura:', uploadError);
                    app.showNotification('Error subiendo factura, pero el gasto se guardará', 'warning');
                }
            }

            // Preparar datos para guardar
            const egresoData = {
                fecha: formData.fecha,
                categoria: formData.categoria,
                descripcion: formData.descripcion,
                proveedor: formData.proveedor,
                rutProveedor: formData.rutProveedor,
                monto: formData.monto,
                idFactura
            };

            if (isEdit) {
                // Actualizar egreso existente
                const realIndex = this.findRealEgresoIndex(egresoIndex);
                await sheetsAPI.updateEgreso(realIndex, egresoData);
                app.showNotification('Gasto actualizado correctamente', 'success');
            } else {
                // Agregar nuevo egreso
                await sheetsAPI.addEgreso(egresoData);
                app.showNotification('Gasto agregado correctamente', 'success');
            }

            // Recargar datos y cerrar modal
            await this.loadData();
            this.applyFilters('egresos');
            app.hideModal();

        } catch (error) {
            console.error('Error guardando egreso:', error);
            app.showNotification('Error al guardar el gasto: ' + error.message, 'error');
        }
    },

    findRealEgresoIndex(filteredIndex) {
        const egreso = this.data.filteredData[filteredIndex];
        return this.data.egresos.findIndex(e => 
            e.ID_Egreso === egreso.ID_Egreso
        );
    },

    editEgreso(index) {
        this.showEgresoModal(index);
    },

    async deleteEgreso(index) {
        const egreso = this.data.filteredData[index];
        
        if (!confirm(`¿Está seguro de que desea eliminar el gasto "${egreso.Descripcion}"?`)) {
            return;
        }

        try {
            const realIndex = this.findRealEgresoIndex(index);
            await sheetsAPI.deleteEgreso(realIndex);
            app.showNotification('Gasto eliminado correctamente', 'success');

            // Recargar datos
            await this.loadData();
            this.applyFilters('egresos');

        } catch (error) {
            console.error('Error eliminando egreso:', error);
            app.showNotification('Error al eliminar el gasto: ' + error.message, 'error');
        }
    },

    exportToExcel(type) {
        try {
            let data, fileName;
            
            if (type === 'egresos') {
                data = this.data.filteredData.map(e => ({
                    'Fecha': e.Fecha,
                    'Categoría': e.Categoria,
                    'Descripción': e.Descripcion,
                    'Proveedor': e.Proveedor,
                    'RUT Proveedor': e.Rut_Proveedor || '',
                    'Monto': e.monto
                }));
                fileName = `egresos_${helpers.getCurrentDate()}.xlsx`;
            } else {
                data = this.data.filteredData.map(i => ({
                    'Fecha': i.fecha,
                    'Descripción': i.descripcion,
                    'Residente': i.residente,
                    'Parcela': i.parcela,
                    'Período': i.periodo,
                    'Monto': i.monto,
                    'Categoría': i.categoria
                }));
                fileName = `ingresos_${helpers.getCurrentDate()}.xlsx`;
            }

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, type === 'egresos' ? 'Egresos' : 'Ingresos');
            
            XLSX.writeFile(wb, fileName);

            app.showNotification('Archivo Excel exportado correctamente', 'success');

        } catch (error) {
            console.error('Error exportando a Excel:', error);
            app.showNotification('Error al exportar a Excel: ' + error.message, 'error');
        }
    }
};

// Exportar para uso global
window.ContabilidadModule = ContabilidadModule;

