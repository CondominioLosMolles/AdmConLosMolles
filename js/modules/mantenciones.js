// ===== MÓDULO MANTENCIONES =====

const MantencionesModule = {
    data: {
        mantenciones: [],
        filteredMantenciones: [],
        currentPage: 1,
        itemsPerPage: 10,
        filterEstado: '',
        filterPrioridad: ''
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando mantenciones...');
            await this.loadData();
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.applyFilters();
        } catch (error) {
            console.error('Error cargando mantenciones:', error);
            container.innerHTML = `<div class="text-center"><h2>Error cargando mantenciones</h2><p>${error.message}</p></div>`;
        }
    },

    async loadData() {
        try {
            this.data.mantenciones = await sheetsAPI.getMantenciones();
            this.data.filteredMantenciones = [...this.data.mantenciones];
        } catch (error) {
            console.error('Error cargando datos de mantenciones:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="mantenciones-module">
                <div class="module-header">
                    <h1>Mantenciones</h1>
                    <p>Gestión de mantenciones y reparaciones del condominio</p>
                </div>

                <div class="filters-container">
                    <div class="filter-group">
                        <label class="form-label">Estado</label>
                        <select id="filter-estado" class="form-control">
                            <option value="">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="Completada">Completada</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="form-label">Prioridad</label>
                        <select id="filter-prioridad" class="form-control">
                            <option value="">Todas las prioridades</option>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Crítica">Crítica</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <button id="add-mantencion-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Agregar Mantención
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Descripción</th>
                                    <th>Área</th>
                                    <th>Prioridad</th>
                                    <th>Estado</th>
                                    <th>Costo Estimado</th>
                                    <th>Responsable</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="mantenciones-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        document.getElementById('filter-estado')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-prioridad')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('add-mantencion-btn')?.addEventListener('click', () => this.showMantencionModal());
    },

    applyFilters() {
        let filtered = [...this.data.mantenciones];
        
        const estadoFilter = document.getElementById('filter-estado')?.value;
        const prioridadFilter = document.getElementById('filter-prioridad')?.value;
        
        if (estadoFilter) filtered = filtered.filter(m => m.Estado === estadoFilter);
        if (prioridadFilter) filtered = filtered.filter(m => m.Prioridad === prioridadFilter);
        
        this.data.filteredMantenciones = filtered;
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('mantenciones-tbody');
        tbody.innerHTML = this.data.filteredMantenciones.map((mantencion, index) => `
            <tr>
                <td>${helpers.formatDate(mantencion.Fecha)}</td>
                <td>${mantencion.Descripcion}</td>
                <td>${mantencion.Area}</td>
                <td><span class="priority-badge priority-${mantencion.Prioridad.toLowerCase()}">${mantencion.Prioridad}</span></td>
                <td><span class="status-badge status-${mantencion.Estado.toLowerCase().replace(/\s+/g, '-')}">${mantencion.Estado}</span></td>
                <td>${helpers.formatCurrency(mantencion.CostoEstimado)}</td>
                <td>${mantencion.Responsable}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="MantencionesModule.editMantencion(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    showMantencionModal(index = null) {
        const isEdit = index !== null;
        const mantencion = isEdit ? this.data.filteredMantenciones[index] : {};
        
        const modalContent = `
            <form id="mantencion-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha *</label>
                        <input type="date" name="fecha" class="form-control" value="${mantencion.Fecha || helpers.getCurrentDate()}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Área *</label>
                        <select name="area" class="form-control" required>
                            <option value="">Seleccionar área</option>
                            <option value="Áreas Verdes" ${mantencion.Area === 'Áreas Verdes' ? 'selected' : ''}>Áreas Verdes</option>
                            <option value="Piscina" ${mantencion.Area === 'Piscina' ? 'selected' : ''}>Piscina</option>
                            <option value="Quincho" ${mantencion.Area === 'Quincho' ? 'selected' : ''}>Quincho</option>
                            <option value="Portería" ${mantencion.Area === 'Portería' ? 'selected' : ''}>Portería</option>
                            <option value="Estacionamientos" ${mantencion.Area === 'Estacionamientos' ? 'selected' : ''}>Estacionamientos</option>
                            <option value="Iluminación" ${mantencion.Area === 'Iluminación' ? 'selected' : ''}>Iluminación</option>
                            <option value="Otros" ${mantencion.Area === 'Otros' ? 'selected' : ''}>Otros</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción *</label>
                    <textarea name="descripcion" class="form-control" rows="3" required>${mantencion.Descripcion || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Prioridad *</label>
                        <select name="prioridad" class="form-control" required>
                            <option value="Baja" ${mantencion.Prioridad === 'Baja' ? 'selected' : ''}>Baja</option>
                            <option value="Media" ${mantencion.Prioridad === 'Media' ? 'selected' : ''}>Media</option>
                            <option value="Alta" ${mantencion.Prioridad === 'Alta' ? 'selected' : ''}>Alta</option>
                            <option value="Crítica" ${mantencion.Prioridad === 'Crítica' ? 'selected' : ''}>Crítica</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado *</label>
                        <select name="estado" class="form-control" required>
                            <option value="Pendiente" ${mantencion.Estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="En Proceso" ${mantencion.Estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                            <option value="Completada" ${mantencion.Estado === 'Completada' ? 'selected' : ''}>Completada</option>
                            <option value="Urgente" ${mantencion.Estado === 'Urgente' ? 'selected' : ''}>Urgente</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Costo Estimado</label>
                        <input type="number" name="costoEstimado" class="form-control" value="${mantencion.CostoEstimado || ''}" min="0" step="1000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Responsable</label>
                        <input type="text" name="responsable" class="form-control" value="${mantencion.Responsable || ''}">
                    </div>
                </div>
            </form>
        `;

        app.showModal(
            isEdit ? 'Editar Mantención' : 'Agregar Mantención',
            modalContent,
            [{ text: isEdit ? 'Actualizar' : 'Guardar', class: 'btn-primary', onclick: `MantencionesModule.saveMantencion(${index})` }]
        );
    },

    async saveMantencion(index) {
        const form = document.getElementById('mantencion-form');
        const formData = helpers.getFormData(form);
        
        try {
            if (index !== null) {
                await sheetsAPI.updateMantencion(index, formData);
                app.showNotification('Mantención actualizada correctamente', 'success');
            } else {
                await sheetsAPI.addMantencion(formData);
                app.showNotification('Mantención agregada correctamente', 'success');
            }
            
            await this.loadData();
            this.applyFilters();
            app.hideModal();
        } catch (error) {
            app.showNotification('Error al guardar mantención: ' + error.message, 'error');
        }
    },

    editMantencion(index) {
        this.showMantencionModal(index);
    }
};

window.MantencionesModule = MantencionesModule;

