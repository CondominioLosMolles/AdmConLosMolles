// ===== MÓDULO RESIDENTES =====

const ResidentesModule = {
    data: {
        residentes: [],
        filteredResidentes: [],
        currentPage: 1,
        itemsPerPage: 10,
        searchTerm: '',
        filterEstado: '',
        sortField: 'NombreCompleto',
        sortDirection: 'asc'
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando residentes...');
            
            // Cargar datos
            await this.loadData();
            
            // Renderizar contenido
            container.innerHTML = this.getHTML();
            
            // Configurar eventos
            this.setupEvents();
            
            // Aplicar filtros iniciales
            this.applyFilters();
            
        } catch (error) {
            console.error('Error cargando residentes:', error);
            container.innerHTML = `
                <div class="text-center">
                    <h2>Error cargando residentes</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="ResidentesModule.render(document.getElementById('content-area'))">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    async loadData() {
        try {
            this.data.residentes = await sheetsAPI.getResidentes();
            this.data.filteredResidentes = [...this.data.residentes];
        } catch (error) {
            console.error('Error cargando datos de residentes:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="residentes-module">
                <div class="module-header">
                    <h1>Gestión de Residentes</h1>
                    <p>Administrar información de propietarios y residentes</p>
                </div>

                <!-- Filtros y controles -->
                <div class="filters-container">
                    <div class="search-container">
                        <div class="form-group">
                            <label class="form-label">Buscar</label>
                            <div class="search-input">
                                <input type="text" id="search-residentes" class="form-control" 
                                       placeholder="Buscar por nombre, RUT o parcela...">
                                <i class="fas fa-search"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <div class="form-group">
                            <label class="form-label">Estado</label>
                            <select id="filter-estado" class="form-control">
                                <option value="">Todos los estados</option>
                                <option value="Activo">Activo</option>
                                <option value="Moroso">Moroso</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <div class="form-group">
                            <label class="form-label">Ordenar por</label>
                            <select id="sort-field" class="form-control">
                                <option value="NombreCompleto">Nombre</option>
                                <option value="N_Parcela">Parcela</option>
                                <option value="Estado">Estado</option>
                                <option value="ValorGastoComun">Gasto Común</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <div class="form-group">
                            <label class="form-label">&nbsp;</label>
                            <button id="add-residente-btn" class="btn btn-primary">
                                <i class="fas fa-plus"></i>
                                Agregar Residente
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tabla de residentes -->
                <div class="table-container">
                    <div class="table-header">
                        <div class="table-title">
                            Residentes (<span id="total-residentes">0</span>)
                        </div>
                        <div class="table-actions-header">
                            <button id="export-excel-btn" class="btn btn-outline">
                                <i class="fas fa-file-excel"></i>
                                Exportar Excel
                            </button>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>RUT</th>
                                    <th>N° Parcela</th>
                                    <th>Email</th>
                                    <th>Teléfono</th>
                                    <th>Estado</th>
                                    <th>Gasto Común</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="residentes-tbody">
                                <!-- Contenido generado dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="table-pagination">
                        <div class="pagination-info">
                            Mostrando <span id="showing-from">0</span> a <span id="showing-to">0</span> 
                            de <span id="total-items">0</span> residentes
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

    setupEvents() {
        // Búsqueda
        const searchInput = document.getElementById('search-residentes');
        if (searchInput) {
            searchInput.addEventListener('input', helpers.debounce(() => {
                this.data.searchTerm = searchInput.value;
                this.data.currentPage = 1;
                this.applyFilters();
            }, 300));
        }

        // Filtro de estado
        const filterEstado = document.getElementById('filter-estado');
        if (filterEstado) {
            filterEstado.addEventListener('change', () => {
                this.data.filterEstado = filterEstado.value;
                this.data.currentPage = 1;
                this.applyFilters();
            });
        }

        // Ordenamiento
        const sortField = document.getElementById('sort-field');
        if (sortField) {
            sortField.addEventListener('change', () => {
                this.data.sortField = sortField.value;
                this.applyFilters();
            });
        }

        // Agregar residente
        const addBtn = document.getElementById('add-residente-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showResidenteModal());
        }

        // Exportar Excel
        const exportBtn = document.getElementById('export-excel-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }

        // Paginación
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
                const totalPages = Math.ceil(this.data.filteredResidentes.length / this.data.itemsPerPage);
                if (this.data.currentPage < totalPages) {
                    this.data.currentPage++;
                    this.renderTable();
                }
            });
        }
    },

    applyFilters() {
        let filtered = [...this.data.residentes];

        // Aplicar búsqueda
        if (this.data.searchTerm) {
            const term = this.data.searchTerm.toLowerCase();
            filtered = filtered.filter(r => 
                r.NombreCompleto.toLowerCase().includes(term) ||
                r.RUT.toLowerCase().includes(term) ||
                r.N_Parcela.toString().includes(term)
            );
        }

        // Aplicar filtro de estado
        if (this.data.filterEstado) {
            filtered = filtered.filter(r => r.Estado === this.data.filterEstado);
        }

        // Aplicar ordenamiento
        filtered.sort((a, b) => {
            const aVal = a[this.data.sortField];
            const bVal = b[this.data.sortField];
            
            if (this.data.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        this.data.filteredResidentes = filtered;
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('residentes-tbody');
        const totalItems = this.data.filteredResidentes.length;
        const startIndex = (this.data.currentPage - 1) * this.data.itemsPerPage;
        const endIndex = Math.min(startIndex + this.data.itemsPerPage, totalItems);
        const pageItems = this.data.filteredResidentes.slice(startIndex, endIndex);

        // Renderizar filas
        tbody.innerHTML = pageItems.map((residente, index) => `
            <tr>
                <td>${residente.NombreCompleto}</td>
                <td>${residente.RUT}</td>
                <td>${residente.N_Parcela}</td>
                <td>${residente.Email}</td>
                <td>${residente.Telefono}</td>
                <td>
                    <span class="status-badge status-${residente.Estado.toLowerCase()}">
                        <i class="fas fa-circle"></i>
                        ${residente.Estado}
                    </span>
                </td>
                <td>${helpers.formatCurrency(residente.ValorGastoComun)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="ResidentesModule.editResidente(${startIndex + index})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="ResidentesModule.deleteResidente(${startIndex + index})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Actualizar información de paginación
        document.getElementById('total-residentes').textContent = this.data.residentes.length;
        document.getElementById('showing-from').textContent = totalItems > 0 ? startIndex + 1 : 0;
        document.getElementById('showing-to').textContent = endIndex;
        document.getElementById('total-items').textContent = totalItems;

        // Actualizar controles de paginación
        this.updatePaginationControls();
    },

    updatePaginationControls() {
        const totalPages = Math.ceil(this.data.filteredResidentes.length / this.data.itemsPerPage);
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const pageNumbers = document.getElementById('page-numbers');

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
                        onclick="ResidentesModule.goToPage(${i})">
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

    showResidenteModal(residenteIndex = null) {
        const isEdit = residenteIndex !== null;
        const residente = isEdit ? this.data.filteredResidentes[residenteIndex] : {};
        
        const modalContent = `
            <form id="residente-form">
                <div class="form-section">
                    <h3 class="form-section-title">Información Personal</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nombre Completo *</label>
                            <input type="text" name="nombreCompleto" class="form-control" 
                                   value="${residente.NombreCompleto || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">RUT *</label>
                            <input type="text" name="rut" class="form-control" 
                                   value="${residente.RUT || ''}" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">N° Parcela *</label>
                            <select name="nParcela" class="form-control" required>
                                <option value="">Seleccionar parcela</option>
                                ${this.generateParcelaOptions(residente.N_Parcela)}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dirección</label>
                            <input type="text" name="direccion" class="form-control" 
                                   value="${residente.Direccion || ''}">
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Información de Contacto</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email *</label>
                            <input type="email" name="email" class="form-control" 
                                   value="${residente.Email || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Teléfono *</label>
                            <input type="tel" name="telefono" class="form-control" 
                                   value="${residente.Telefono || ''}" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3 class="form-section-title">Información Financiera</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Estado</label>
                            <select name="estado" class="form-control">
                                <option value="Activo" ${residente.Estado === 'Activo' ? 'selected' : ''}>Activo</option>
                                <option value="Moroso" ${residente.Estado === 'Moroso' ? 'selected' : ''}>Moroso</option>
                                <option value="Inactivo" ${residente.Estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Valor Gasto Común *</label>
                            <input type="number" name="valorGastoComun" class="form-control" 
                                   value="${residente.ValorGastoComun || ''}" min="0" step="1000" required>
                        </div>
                    </div>
                </div>
            </form>
        `;

        const actions = [
            {
                text: isEdit ? 'Actualizar' : 'Guardar',
                class: 'btn-primary',
                onclick: `ResidentesModule.saveResidente(${residenteIndex})`
            }
        ];

        app.showModal(
            isEdit ? 'Editar Residente' : 'Agregar Residente',
            modalContent,
            actions
        );

        // Configurar validación
        const form = document.getElementById('residente-form');
        if (form) {
            validator.setupRealTimeValidation(form);
            
            // Configurar formateo de RUT
            const rutField = form.querySelector('[name="rut"]');
            if (rutField) {
                validator.setupRUTFormatting(rutField);
            }
        }
    },

    generateParcelaOptions(selectedParcela) {
        let options = '';
        for (let i = 1; i <= 26; i++) {
            const selected = selectedParcela == i ? 'selected' : '';
            options += `<option value="${i}" ${selected}>Parcela ${i}</option>`;
        }
        return options;
    },

    async saveResidente(residenteIndex) {
        const form = document.getElementById('residente-form');
        if (!form) return;

        // Validar formulario
        const validation = validator.validateForm(form);
        if (!validation.isValid) {
            app.showNotification('Por favor corrija los errores en el formulario', 'error');
            return;
        }

        try {
            const formData = helpers.getFormData(form);
            const isEdit = residenteIndex !== null;

            if (isEdit) {
                // Actualizar residente existente
                await sheetsAPI.updateResidente(residenteIndex, formData);
                app.showNotification('Residente actualizado correctamente', 'success');
            } else {
                // Agregar nuevo residente
                await sheetsAPI.addResidente(formData);
                app.showNotification('Residente agregado correctamente', 'success');
            }

            // Recargar datos y cerrar modal
            await this.loadData();
            this.applyFilters();
            app.hideModal();

        } catch (error) {
            console.error('Error guardando residente:', error);
            app.showNotification('Error al guardar el residente: ' + error.message, 'error');
        }
    },

    editResidente(index) {
        this.showResidenteModal(index);
    },

    async deleteResidente(index) {
        const residente = this.data.filteredResidentes[index];
        
        if (!confirm(`¿Está seguro de que desea eliminar a ${residente.NombreCompleto}?`)) {
            return;
        }

        try {
            // Encontrar el índice real en la lista completa
            const realIndex = this.data.residentes.findIndex(r => 
                r.RUT === residente.RUT && r.N_Parcela === residente.N_Parcela
            );

            await sheetsAPI.deleteResidente(realIndex);
            app.showNotification('Residente eliminado correctamente', 'success');

            // Recargar datos
            await this.loadData();
            this.applyFilters();

        } catch (error) {
            console.error('Error eliminando residente:', error);
            app.showNotification('Error al eliminar el residente: ' + error.message, 'error');
        }
    },

    exportToExcel() {
        try {
            const data = this.data.filteredResidentes.map(r => ({
                'Nombre Completo': r.NombreCompleto,
                'RUT': r.RUT,
                'N° Parcela': r.N_Parcela,
                'Dirección': r.Direccion,
                'Email': r.Email,
                'Teléfono': r.Telefono,
                'Estado': r.Estado,
                'Valor Gasto Común': r.ValorGastoComun
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Residentes');
            
            const fileName = `residentes_${helpers.getCurrentDate()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            app.showNotification('Archivo Excel exportado correctamente', 'success');

        } catch (error) {
            console.error('Error exportando a Excel:', error);
            app.showNotification('Error al exportar a Excel: ' + error.message, 'error');
        }
    }
};

// Exportar para uso global
window.ResidentesModule = ResidentesModule;

