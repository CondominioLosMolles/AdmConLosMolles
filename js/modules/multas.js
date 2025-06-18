// ===== MÓDULO MULTAS =====

const MultasModule = {
    data: {
        multas: [],
        residentes: [],
        filteredMultas: [],
        currentPage: 1,
        itemsPerPage: 10
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando multas...');
            await this.loadData();
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.applyFilters();
        } catch (error) {
            console.error('Error cargando multas:', error);
            container.innerHTML = `<div class="text-center"><h2>Error cargando multas</h2><p>${error.message}</p></div>`;
        }
    },

    async loadData() {
        try {
            const [multas, residentes] = await Promise.all([
                sheetsAPI.getMultas(),
                sheetsAPI.getResidentes()
            ]);
            this.data.multas = multas;
            this.data.residentes = residentes;
            this.data.filteredMultas = [...multas];
        } catch (error) {
            console.error('Error cargando datos de multas:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="multas-module">
                <div class="module-header">
                    <h1>Multas</h1>
                    <p>Gestión de multas y sanciones del condominio</p>
                </div>

                <div class="filters-container">
                    <div class="filter-group">
                        <label class="form-label">Estado</label>
                        <select id="filter-estado-multas" class="form-control">
                            <option value="">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Pagada">Pagada</option>
                            <option value="Anulada">Anulada</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button id="add-multa-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Agregar Multa
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Residente</th>
                                    <th>Parcela</th>
                                    <th>Motivo</th>
                                    <th>Monto</th>
                                    <th>Estado</th>
                                    <th>Fecha Pago</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="multas-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        document.getElementById('filter-estado-multas')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('add-multa-btn')?.addEventListener('click', () => this.showMultaModal());
    },

    applyFilters() {
        let filtered = [...this.data.multas];
        const estadoFilter = document.getElementById('filter-estado-multas')?.value;
        if (estadoFilter) filtered = filtered.filter(m => m.Estado === estadoFilter);
        this.data.filteredMultas = filtered;
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('multas-tbody');
        tbody.innerHTML = this.data.filteredMultas.map((multa, index) => {
            const residente = this.data.residentes.find(r => r.N_Parcela == multa.N_Parcela);
            return `
                <tr>
                    <td>${helpers.formatDate(multa.Fecha)}</td>
                    <td>${residente?.NombreCompleto || 'No encontrado'}</td>
                    <td>${multa.N_Parcela}</td>
                    <td>${multa.Motivo}</td>
                    <td>${helpers.formatCurrency(multa.Monto)}</td>
                    <td><span class="status-badge status-${multa.Estado.toLowerCase()}">${multa.Estado}</span></td>
                    <td>${multa.FechaPago ? helpers.formatDate(multa.FechaPago) : '-'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline" onclick="MultasModule.editMulta(${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${multa.Estado === 'Pendiente' ? 
                                `<button class="btn btn-sm btn-success" onclick="MultasModule.markAsPaid(${index})">
                                    <i class="fas fa-check"></i>
                                </button>` : ''
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    showMultaModal(index = null) {
        const isEdit = index !== null;
        const multa = isEdit ? this.data.filteredMultas[index] : {};
        
        const modalContent = `
            <form id="multa-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha *</label>
                        <input type="date" name="fecha" class="form-control" value="${multa.Fecha || helpers.getCurrentDate()}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Parcela *</label>
                        <select name="nParcela" class="form-control" required>
                            <option value="">Seleccionar parcela</option>
                            ${this.generateParcelaOptions(multa.N_Parcela)}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Motivo *</label>
                    <select name="motivo" class="form-control" required>
                        <option value="">Seleccionar motivo</option>
                        <option value="Ruidos molestos" ${multa.Motivo === 'Ruidos molestos' ? 'selected' : ''}>Ruidos molestos</option>
                        <option value="Mal uso áreas comunes" ${multa.Motivo === 'Mal uso áreas comunes' ? 'selected' : ''}>Mal uso áreas comunes</option>
                        <option value="Estacionamiento indebido" ${multa.Motivo === 'Estacionamiento indebido' ? 'selected' : ''}>Estacionamiento indebido</option>
                        <option value="Incumplimiento reglamento" ${multa.Motivo === 'Incumplimiento reglamento' ? 'selected' : ''}>Incumplimiento reglamento</option>
                        <option value="Otros" ${multa.Motivo === 'Otros' ? 'selected' : ''}>Otros</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea name="descripcion" class="form-control" rows="3">${multa.Descripcion || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Monto *</label>
                        <input type="number" name="monto" class="form-control" value="${multa.Monto || ''}" min="0" step="1000" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado</label>
                        <select name="estado" class="form-control">
                            <option value="Pendiente" ${multa.Estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Pagada" ${multa.Estado === 'Pagada' ? 'selected' : ''}>Pagada</option>
                            <option value="Anulada" ${multa.Estado === 'Anulada' ? 'selected' : ''}>Anulada</option>
                        </select>
                    </div>
                </div>
            </form>
        `;

        app.showModal(
            isEdit ? 'Editar Multa' : 'Agregar Multa',
            modalContent,
            [{ text: isEdit ? 'Actualizar' : 'Guardar', class: 'btn-primary', onclick: `MultasModule.saveMulta(${index})` }]
        );
    },

    generateParcelaOptions(selectedParcela) {
        let options = '';
        for (let i = 1; i <= 26; i++) {
            const selected = selectedParcela == i ? 'selected' : '';
            options += `<option value="${i}" ${selected}>Parcela ${i}</option>`;
        }
        return options;
    },

    async saveMulta(index) {
        const form = document.getElementById('multa-form');
        const formData = helpers.getFormData(form);
        
        try {
            if (index !== null) {
                await sheetsAPI.updateMulta(index, formData);
                app.showNotification('Multa actualizada correctamente', 'success');
            } else {
                await sheetsAPI.addMulta(formData);
                app.showNotification('Multa agregada correctamente', 'success');
            }
            
            await this.loadData();
            this.applyFilters();
            app.hideModal();
        } catch (error) {
            app.showNotification('Error al guardar multa: ' + error.message, 'error');
        }
    },

    async markAsPaid(index) {
        const multa = this.data.filteredMultas[index];
        
        try {
            await sheetsAPI.updateMulta(index, {
                ...multa,
                estado: 'Pagada',
                fechaPago: helpers.getCurrentDate()
            });
            
            app.showNotification('Multa marcada como pagada', 'success');
            await this.loadData();
            this.applyFilters();
        } catch (error) {
            app.showNotification('Error al actualizar multa: ' + error.message, 'error');
        }
    },

    editMulta(index) {
        this.showMultaModal(index);
    }
};

window.MultasModule = MultasModule;

