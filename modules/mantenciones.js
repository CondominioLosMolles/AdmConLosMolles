// Módulo Mantenciones - Gestión de mantenciones del condominio
class MantencionesModule {
    constructor() {
        this.mantenciones = [];
        this.filteredMantenciones = [];
        this.activeFilter = 'todas';
    }

    // Renderizar el módulo
    async render() {
        const container = document.getElementById('content-container');
        Utils.showLoading(container);

        try {
            // Cargar datos
            await this.loadMantenciones();

            // Renderizar contenido
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents();

            // Aplicar filtro inicial
            this.filterMantenciones(this.activeFilter);

        } catch (error) {
            console.error('Error cargando mantenciones:', error);
            Utils.showError(container, 'Error cargando las mantenciones');
        }
    }

    // Cargar mantenciones
    async loadMantenciones() {
        try {
            const data = await window.googleAPI.readSheet(CONFIG.SHEETS.MANTENCIONES);
            
            if (data.length > 1) {
                this.mantenciones = data.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    fecha: row[1] || '',
                    encargado: row[2] || '',
                    tipo: row[3] || '',
                    descripcion: row[4] || '',
                    estado: row[5] || 'Pendiente',
                    costoTotal: parseFloat(row[6]) || 0,
                    idComprobanteDrive: row[7] || '',
                    rowIndex: index + 1
                }));
            } else {
                this.mantenciones = [];
            }

            this.filteredMantenciones = [...this.mantenciones];

        } catch (error) {
            console.error('Error cargando mantenciones:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        const stats = this.calculateStats();

        return `
            <div class="mantenciones-container">
                <div class="module-header">
                    <h2>Mantenciones</h2>
                    <div class="module-actions">
                        <button class="btn btn-primary" id="add-mantencion-btn">
                            <i class="fas fa-plus"></i>
                            Agregar Mantención
                        </button>
                    </div>
                </div>

                <!-- Estadísticas rápidas -->
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value status-pendiente">${stats.pendientes}</div>
                        <div class="summary-label">Pendientes</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value status-urgente">${stats.urgentes}</div>
                        <div class="summary-label">Urgentes</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value status-en_progreso">${stats.enProgreso}</div>
                        <div class="summary-label">En Progreso</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value status-completada">${stats.completadas}</div>
                        <div class="summary-label">Completadas</div>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="mantencion-filters">
                    <div class="filter-chip ${this.activeFilter === 'todas' ? 'active' : ''}" data-filter="todas">
                        Todas (${this.mantenciones.length})
                    </div>
                    <div class="filter-chip ${this.activeFilter === 'Pendiente' ? 'active' : ''}" data-filter="Pendiente">
                        Pendientes (${stats.pendientes})
                    </div>
                    <div class="filter-chip ${this.activeFilter === 'Urgente' ? 'active' : ''}" data-filter="Urgente">
                        Urgentes (${stats.urgentes})
                    </div>
                    <div class="filter-chip ${this.activeFilter === 'En Progreso' ? 'active' : ''}" data-filter="En Progreso">
                        En Progreso (${stats.enProgreso})
                    </div>
                    <div class="filter-chip ${this.activeFilter === 'Completada' ? 'active' : ''}" data-filter="Completada">
                        Completadas (${stats.completadas})
                    </div>
                </div>

                <!-- Tabla de mantenciones -->
                <div class="table-container">
                    <table class="table" id="mantenciones-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Encargado</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Costo Total</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="mantenciones-tbody">
                            ${this.getTableRows()}
                        </tbody>
                    </table>
                </div>

                ${this.mantenciones.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <h3>No hay mantenciones registradas</h3>
                    <p>Comience registrando la primera mantención del condominio.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-mantencion-btn').click()">
                        Registrar Primera Mantención
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Calcular estadísticas
    calculateStats() {
        return {
            pendientes: this.mantenciones.filter(m => m.estado === 'Pendiente').length,
            urgentes: this.mantenciones.filter(m => m.estado === 'Urgente').length,
            enProgreso: this.mantenciones.filter(m => m.estado === 'En Progreso').length,
            completadas: this.mantenciones.filter(m => m.estado === 'Completada').length
        };
    }

    // Obtener filas de la tabla
    getTableRows() {
        if (this.filteredMantenciones.length === 0) {
            return '<tr><td colspan="7" class="text-center">No se encontraron mantenciones</td></tr>';
        }

        return this.filteredMantenciones.map(mantencion => `
            <tr class="${mantencion.estado === 'Urgente' ? 'row-urgent' : ''}">
                <td>${Utils.formatDate(Utils.parseDate(mantencion.fecha))}</td>
                <td>${Utils.escapeHtml(mantencion.encargado)}</td>
                <td>${Utils.escapeHtml(mantencion.tipo)}</td>
                <td>${Utils.escapeHtml(mantencion.descripcion.length > 50 ? mantencion.descripcion.substring(0, 50) + '...' : mantencion.descripcion)}</td>
                <td><span class="status-${mantencion.estado.toLowerCase().replace(' ', '_')}">${mantencion.estado}</span></td>
                <td>${Utils.formatCurrency(mantencion.costoTotal)}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" onclick="window.App.getCurrentModule().editMantencion('${mantencion.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="window.App.getCurrentModule().deleteMantencion('${mantencion.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${mantencion.idComprobanteDrive ? `
                    <button class="btn-icon btn-view" onclick="window.App.getCurrentModule().viewComprobante('${mantencion.idComprobanteDrive}')" title="Ver comprobante">
                        <i class="fas fa-file-alt"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    // Configurar eventos
    setupEvents() {
        // Botón agregar mantención
        const addBtn = document.getElementById('add-mantencion-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showMantencionForm());
        }

        // Filtros
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterMantenciones(filter);
            });
        });
    }

    // Filtrar mantenciones
    filterMantenciones(filter) {
        this.activeFilter = filter;

        // Actualizar chips activos
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filtrar datos
        if (filter === 'todas') {
            this.filteredMantenciones = [...this.mantenciones];
        } else {
            this.filteredMantenciones = this.mantenciones.filter(m => m.estado === filter);
        }

        // Actualizar tabla
        const tbody = document.getElementById('mantenciones-tbody');
        if (tbody) {
            tbody.innerHTML = this.getTableRows();
        }
    }

    // Mostrar formulario de mantención
    showMantencionForm(mantencionId = null) {
        const mantencion = mantencionId ? this.mantenciones.find(m => m.id === mantencionId) : null;
        const isEdit = !!mantencion;

        const formHTML = `
            <form id="mantencion-form" class="mantencion-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha *</label>
                        <input type="date" id="fecha" class="form-input" value="${mantencion ? Utils.formatDateForInput(Utils.parseDate(mantencion.fecha)) : Utils.formatDateForInput(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Encargado *</label>
                        <input type="text" id="encargado" class="form-input" value="${mantencion?.encargado || ''}" placeholder="Nombre del encargado" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Tipo de Mantención *</label>
                        <select id="tipo" class="form-select" required>
                            <option value="">Seleccionar...</option>
                            <option value="Preventiva" ${mantencion?.tipo === 'Preventiva' ? 'selected' : ''}>Preventiva</option>
                            <option value="Correctiva" ${mantencion?.tipo === 'Correctiva' ? 'selected' : ''}>Correctiva</option>
                            <option value="Emergencia" ${mantencion?.tipo === 'Emergencia' ? 'selected' : ''}>Emergencia</option>
                            <option value="Mejora" ${mantencion?.tipo === 'Mejora' ? 'selected' : ''}>Mejora</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado *</label>
                        <select id="estado" class="form-select" required>
                            <option value="Pendiente" ${mantencion?.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="En Progreso" ${mantencion?.estado === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
                            <option value="Completada" ${mantencion?.estado === 'Completada' ? 'selected' : ''}>Completada</option>
                            <option value="Urgente" ${mantencion?.estado === 'Urgente' ? 'selected' : ''}>Urgente</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Descripción Detallada *</label>
                    <textarea id="descripcion" class="form-textarea" rows="4" required placeholder="Describa detalladamente la mantención a realizar...">${mantencion?.descripcion || ''}</textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Costo Total</label>
                    <input type="number" id="costoTotal" class="form-input" value="${mantencion?.costoTotal || ''}" min="0" step="1000" placeholder="0">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Comprobantes/Facturas (PDF/JPG)</label>
                    <input type="file" id="comprobante" class="form-input" accept=".pdf,.jpg,.jpeg,.png" multiple>
                    <small class="form-help">Opcional: Adjunte facturas, fotos del trabajo, etc.</small>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveMantencion(${isEdit ? `'${mantencionId}'` : 'null'})">
                ${isEdit ? 'Actualizar' : 'Guardar'} Mantención
            </button>
        `;

        window.App.openModal(
            isEdit ? 'Editar Mantención' : 'Agregar Mantención',
            formHTML,
            footerHTML
        );
    }

    // Guardar mantención
    async saveMantencion(mantencionId = null) {
        try {
            const form = document.getElementById('mantencion-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = {
                fecha: document.getElementById('fecha').value,
                encargado: document.getElementById('encargado').value.trim(),
                tipo: document.getElementById('tipo').value,
                descripcion: document.getElementById('descripcion').value.trim(),
                estado: document.getElementById('estado').value,
                costoTotal: parseFloat(document.getElementById('costoTotal').value) || 0
            };

            const comprobanteFiles = document.getElementById('comprobante').files;

            // Subir comprobantes a Google Drive si existen
            let idComprobanteDrive = '';
            if (comprobanteFiles.length > 0) {
                try {
                    const folders = await window.googleAPI.ensureFolderStructure();
                    
                    // Subir cada archivo
                    const uploadPromises = Array.from(comprobanteFiles).map(async (file, index) => {
                        const fileName = `${formData.fecha}-${formData.tipo}-${index + 1}.${file.name.split('.').pop()}`;
                        return await window.googleAPI.uploadFile(file, fileName, folders.mantenciones);
                    });

                    const uploadResults = await Promise.all(uploadPromises);
                    idComprobanteDrive = uploadResults.map(result => result.id).join(',');

                } catch (error) {
                    console.error('Error subiendo comprobantes:', error);
                    Utils.showToast('Error subiendo comprobantes, pero la mantención se registrará', 'warning');
                }
            }

            // Preparar datos para Google Sheets
            const rowData = [
                mantencionId || Utils.generateId(),
                Utils.formatDate(new Date(formData.fecha)),
                formData.encargado,
                formData.tipo,
                formData.descripcion,
                formData.estado,
                formData.costoTotal,
                idComprobanteDrive
            ];

            if (mantencionId) {
                // Actualizar mantención existente
                const mantencion = this.mantenciones.find(m => m.id === mantencionId);
                if (mantencion) {
                    const range = `A${mantencion.rowIndex + 1}:H${mantencion.rowIndex + 1}`;
                    await window.googleAPI.writeSheet(CONFIG.SHEETS.MANTENCIONES, range, [rowData]);
                    Utils.showToast('Mantención actualizada correctamente', 'success');
                }
            } else {
                // Agregar nueva mantención
                await window.googleAPI.appendToSheet(CONFIG.SHEETS.MANTENCIONES, rowData);
                Utils.showToast('Mantención agregada correctamente', 'success');
            }

            window.App.closeModal();
            await this.loadMantenciones();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.filterMantenciones(this.activeFilter);

        } catch (error) {
            console.error('Error guardando mantención:', error);
            Utils.showToast('Error guardando la mantención', 'error');
        }
    }

    // Editar mantención
    editMantencion(mantencionId) {
        this.showMantencionForm(mantencionId);
    }

    // Eliminar mantención
    async deleteMantencion(mantencionId) {
        try {
            const mantencion = this.mantenciones.find(m => m.id === mantencionId);
            if (!mantencion) return;

            const confirmed = await Utils.confirm(
                `¿Está seguro de que desea eliminar la mantención "${mantencion.descripcion.substring(0, 50)}..."?`,
                'Confirmar Eliminación'
            );

            if (!confirmed) return;

            await window.googleAPI.deleteRow(CONFIG.SHEETS.MANTENCIONES, mantencion.rowIndex);
            Utils.showToast('Mantención eliminada correctamente', 'success');

            await this.loadMantenciones();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.filterMantenciones(this.activeFilter);

        } catch (error) {
            console.error('Error eliminando mantención:', error);
            Utils.showToast('Error eliminando la mantención', 'error');
        }
    }

    // Ver comprobante
    viewComprobante(driveId) {
        // Abrir archivo de Google Drive en nueva ventana
        const driveUrl = `https://drive.google.com/file/d/${driveId}/view`;
        window.open(driveUrl, '_blank');
    }
}

// Exportar módulo
window.MantencionesModule = MantencionesModule;

