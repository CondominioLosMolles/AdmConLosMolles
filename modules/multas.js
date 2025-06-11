// Módulo Multas - Gestión de multas según Ley 21.442
class MultasModule {
    constructor() {
        this.multas = [];
        this.residentes = [];
        this.filteredMultas = [];
        this.activeFilter = 'todas';
    }

    // Renderizar el módulo
    async render() {
        const container = document.getElementById('content-container');
        Utils.showLoading(container);

        try {
            // Cargar datos
            await this.loadData();

            // Renderizar contenido
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents();

            // Aplicar filtro inicial
            this.filterMultas(this.activeFilter);

        } catch (error) {
            console.error('Error cargando multas:', error);
            Utils.showError(container, 'Error cargando las multas');
        }
    }

    // Cargar datos
    async loadData() {
        try {
            const [multasData, residentesData] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.MULTAS),
                window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES)
            ]);

            // Procesar multas
            if (multasData.length > 1) {
                this.multas = multasData.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    idResidente: row[1] || '',
                    fechaInfraccion: row[2] || '',
                    descripcion: row[3] || '',
                    monto: parseFloat(row[4]) || 0,
                    estado: row[5] || 'Pendiente',
                    fechaPago: row[6] || '',
                    rowIndex: index + 1
                }));
            }

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
                    valorGastoComun: parseFloat(row[7]) || 0
                }));
            }

            this.filteredMultas = [...this.multas];

        } catch (error) {
            console.error('Error cargando datos de multas:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        const stats = this.calculateStats();

        return `
            <div class="multas-container">
                <div class="module-header">
                    <h2>Multas</h2>
                    <div class="module-actions">
                        <button class="btn btn-warning" id="cursar-multa-btn">
                            <i class="fas fa-exclamation-triangle"></i>
                            Cursar Multa
                        </button>
                    </div>
                </div>

                <!-- Aviso legal -->
                <div class="legal-notice">
                    <h4><i class="fas fa-info-circle"></i> Información Legal</h4>
                    <p>Las multas deben cursarse conforme a la Ley 21.442 y el reglamento de copropiedad. 
                    Asegúrese de que la infracción esté debidamente tipificada y que se respeten los procedimientos establecidos.</p>
                </div>

                <!-- Estadísticas -->
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value status-pendiente">${stats.pendientes}</div>
                        <div class="summary-label">Multas Pendientes</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value status-pagado">${stats.pagadas}</div>
                        <div class="summary-label">Multas Pagadas</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${Utils.formatCurrency(stats.montoPendiente)}</div>
                        <div class="summary-label">Monto Pendiente</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${Utils.formatCurrency(stats.montoRecaudado)}</div>
                        <div class="summary-label">Monto Recaudado</div>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="mantencion-filters">
                    <div class="filter-chip ${this.activeFilter === 'todas' ? 'active' : ''}" data-filter="todas">
                        Todas (${this.multas.length})
                    </div>
                    <div class="filter-chip ${this.activeFilter === 'Pendiente' ? 'active' : ''}" data-filter="Pendiente">
                        Pendientes (${stats.pendientes})
                    </div>
                    <div class="filter-chip ${this.activeFilter === 'Pagada' ? 'active' : ''}" data-filter="Pagada">
                        Pagadas (${stats.pagadas})
                    </div>
                </div>

                <!-- Tabla de multas -->
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Fecha Infracción</th>
                                <th>Residente</th>
                                <th>Descripción</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th>Fecha Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="multas-tbody">
                            ${this.getTableRows()}
                        </tbody>
                    </table>
                </div>

                ${this.multas.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>No hay multas registradas</h3>
                    <p>Las multas se registrarán aquí cuando sea necesario aplicar sanciones por infracciones al reglamento.</p>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Calcular estadísticas
    calculateStats() {
        const pendientes = this.multas.filter(m => m.estado === 'Pendiente').length;
        const pagadas = this.multas.filter(m => m.estado === 'Pagada').length;
        const montoPendiente = this.multas
            .filter(m => m.estado === 'Pendiente')
            .reduce((sum, m) => sum + m.monto, 0);
        const montoRecaudado = this.multas
            .filter(m => m.estado === 'Pagada')
            .reduce((sum, m) => sum + m.monto, 0);

        return { pendientes, pagadas, montoPendiente, montoRecaudado };
    }

    // Obtener filas de la tabla
    getTableRows() {
        if (this.filteredMultas.length === 0) {
            return '<tr><td colspan="7" class="text-center">No se encontraron multas</td></tr>';
        }

        return this.filteredMultas.map(multa => {
            const residente = this.residentes.find(r => r.id === multa.idResidente);
            const residenteInfo = residente ? `${residente.nombreCompleto} (Parcela ${residente.nParcela})` : 'Residente no encontrado';

            return `
                <tr>
                    <td>${Utils.formatDate(Utils.parseDate(multa.fechaInfraccion))}</td>
                    <td>${Utils.escapeHtml(residenteInfo)}</td>
                    <td>${Utils.escapeHtml(multa.descripcion.length > 50 ? multa.descripcion.substring(0, 50) + '...' : multa.descripcion)}</td>
                    <td>${Utils.formatCurrency(multa.monto)}</td>
                    <td><span class="status-${multa.estado.toLowerCase()}">${multa.estado}</span></td>
                    <td>${multa.fechaPago ? Utils.formatDate(Utils.parseDate(multa.fechaPago)) : '-'}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-edit" onclick="window.App.getCurrentModule().editMulta('${multa.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="window.App.getCurrentModule().deleteMulta('${multa.id}')" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${multa.estado === 'Pendiente' ? `
                        <button class="btn-icon btn-success" onclick="window.App.getCurrentModule().marcarPagada('${multa.id}')" title="Marcar como pagada">
                            <i class="fas fa-check"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Configurar eventos
    setupEvents() {
        // Botón cursar multa
        const cursarBtn = document.getElementById('cursar-multa-btn');
        if (cursarBtn) {
            cursarBtn.addEventListener('click', () => this.showMultaForm());
        }

        // Filtros
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterMultas(filter);
            });
        });
    }

    // Filtrar multas
    filterMultas(filter) {
        this.activeFilter = filter;

        // Actualizar chips activos
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filtrar datos
        if (filter === 'todas') {
            this.filteredMultas = [...this.multas];
        } else {
            this.filteredMultas = this.multas.filter(m => m.estado === filter);
        }

        // Actualizar tabla
        const tbody = document.getElementById('multas-tbody');
        if (tbody) {
            tbody.innerHTML = this.getTableRows();
        }
    }

    // Mostrar formulario de multa
    showMultaForm(multaId = null) {
        const multa = multaId ? this.multas.find(m => m.id === multaId) : null;
        const isEdit = !!multa;

        const formHTML = `
            <form id="multa-form" class="multa-form">
                <div class="legal-notice">
                    <h4>Procedimiento Legal</h4>
                    <p>Verifique que la infracción esté tipificada en el reglamento de copropiedad y que se hayan seguido los procedimientos establecidos por la Ley 21.442.</p>
                </div>

                <div class="form-group">
                    <label class="form-label">Residente Infractor *</label>
                    <select id="residente-select" class="form-select" required ${isEdit ? 'disabled' : ''}>
                        <option value="">Seleccionar residente...</option>
                        ${this.residentes.filter(r => r.estado === 'Activo').map(residente => `
                            <option value="${residente.id}" ${multa?.idResidente === residente.id ? 'selected' : ''}>
                                Parcela ${residente.nParcela} - ${residente.nombreCompleto}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha de Infracción *</label>
                        <input type="date" id="fechaInfraccion" class="form-input" value="${multa ? Utils.formatDateForInput(Utils.parseDate(multa.fechaInfraccion)) : Utils.formatDateForInput(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Monto de la Multa *</label>
                        <input type="number" id="monto" class="form-input" value="${multa?.monto || ''}" min="1000" step="1000" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Descripción de la Infracción *</label>
                    <textarea id="descripcion" class="form-textarea" rows="4" required placeholder="Describa detalladamente la infracción cometida, citando el artículo del reglamento correspondiente...">${multa?.descripcion || ''}</textarea>
                    <small class="form-help">Incluya el artículo específico del reglamento que se ha infringido</small>
                </div>

                ${isEdit ? `
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Estado</label>
                        <select id="estado" class="form-select">
                            <option value="Pendiente" ${multa?.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Pagada" ${multa?.estado === 'Pagada' ? 'selected' : ''}>Pagada</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha de Pago</label>
                        <input type="date" id="fechaPago" class="form-input" value="${multa?.fechaPago ? Utils.formatDateForInput(Utils.parseDate(multa.fechaPago)) : ''}">
                    </div>
                </div>
                ` : ''}
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-warning" onclick="window.App.getCurrentModule().saveMulta(${isEdit ? `'${multaId}'` : 'null'})">
                ${isEdit ? 'Actualizar' : 'Cursar'} Multa
            </button>
        `;

        window.App.openModal(
            isEdit ? 'Editar Multa' : 'Cursar Multa',
            formHTML,
            footerHTML
        );
    }

    // Guardar multa
    async saveMulta(multaId = null) {
        try {
            const form = document.getElementById('multa-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = {
                idResidente: document.getElementById('residente-select').value,
                fechaInfraccion: document.getElementById('fechaInfraccion').value,
                descripcion: document.getElementById('descripcion').value.trim(),
                monto: parseFloat(document.getElementById('monto').value) || 0
            };

            // Para edición, incluir estado y fecha de pago
            if (multaId) {
                formData.estado = document.getElementById('estado').value;
                formData.fechaPago = document.getElementById('fechaPago').value || '';
            } else {
                formData.estado = 'Pendiente';
                formData.fechaPago = '';
            }

            const residente = this.residentes.find(r => r.id === formData.idResidente);
            if (!residente) {
                Utils.showToast('Residente no encontrado', 'error');
                return;
            }

            // Preparar datos para Google Sheets
            const rowData = [
                multaId || Utils.generateId(),
                formData.idResidente,
                Utils.formatDate(new Date(formData.fechaInfraccion)),
                formData.descripcion,
                formData.monto,
                formData.estado,
                formData.fechaPago ? Utils.formatDate(new Date(formData.fechaPago)) : ''
            ];

            if (multaId) {
                // Actualizar multa existente
                const multa = this.multas.find(m => m.id === multaId);
                if (multa) {
                    const range = `A${multa.rowIndex + 1}:G${multa.rowIndex + 1}`;
                    await window.googleAPI.writeSheet(CONFIG.SHEETS.MULTAS, range, [rowData]);
                    Utils.showToast('Multa actualizada correctamente', 'success');
                }
            } else {
                // Agregar nueva multa
                await window.googleAPI.appendToSheet(CONFIG.SHEETS.MULTAS, rowData);

                // Enviar notificación por email al residente
                await this.sendMultaNotification(residente, formData);

                Utils.showToast('Multa cursada y notificada correctamente', 'success');
            }

            window.App.closeModal();
            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.filterMultas(this.activeFilter);

        } catch (error) {
            console.error('Error guardando multa:', error);
            Utils.showToast('Error guardando la multa', 'error');
        }
    }

    // Enviar notificación de multa por email
    async sendMultaNotification(residente, multaData) {
        try {
            const asunto = 'Notificación de Multa - Condominio Los Molles';
            
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Condominio Los Molles</h1>
                        <h2 style="margin: 10px 0 0 0;">Notificación de Multa</h2>
                    </div>
                    <div style="padding: 30px; background: white;">
                        <p>Estimado/a <strong>${residente.nombreCompleto}</strong>,</p>
                        
                        <p>Por medio de la presente, se le notifica que se ha cursado una multa en su contra por infracción al reglamento de copropiedad:</p>
                        
                        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                            <h3 style="color: #dc2626; margin-top: 0;">Detalles de la Multa</h3>
                            <p><strong>Parcela:</strong> ${residente.nParcela}</p>
                            <p><strong>Fecha de infracción:</strong> ${Utils.formatDate(new Date(multaData.fechaInfraccion))}</p>
                            <p><strong>Monto:</strong> ${Utils.formatCurrency(multaData.monto)}</p>
                            <p><strong>Descripción:</strong></p>
                            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                                ${multaData.descripcion}
                            </div>
                        </div>
                        
                        <p><strong>Importante:</strong> Esta multa debe ser pagada junto con el próximo gasto común. En caso de desacuerdo, puede presentar sus descargos por escrito dentro de los plazos establecidos en el reglamento.</p>
                        
                        <p>Para cualquier consulta, puede contactarnos respondiendo a este correo.</p>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p>Atentamente,<br>
                            <strong>Administración Condominio Los Molles</strong><br>
                            Email: ${CONFIG.ADMIN_EMAIL}</p>
                        </div>
                    </div>
                    <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                        Esta notificación se envía en cumplimiento de la Ley 21.442 sobre copropiedad inmobiliaria.
                    </div>
                </div>
            `;

            await window.googleAPI.sendEmail(residente.email, asunto, emailBody);

            // Registrar la comunicación
            const comunicacionData = [
                Utils.generateId(),
                residente.id,
                Utils.formatDate(new Date()),
                asunto,
                `Notificación de multa por ${multaData.descripcion.substring(0, 100)}...`
            ];

            await window.googleAPI.appendToSheet(CONFIG.SHEETS.COMUNICACIONES, comunicacionData);

        } catch (error) {
            console.error('Error enviando notificación de multa:', error);
            // No lanzar error para no interrumpir el proceso principal
        }
    }

    // Editar multa
    editMulta(multaId) {
        this.showMultaForm(multaId);
    }

    // Eliminar multa
    async deleteMulta(multaId) {
        try {
            const multa = this.multas.find(m => m.id === multaId);
            if (!multa) return;

            const confirmed = await Utils.confirm(
                `¿Está seguro de que desea eliminar la multa de ${Utils.formatCurrency(multa.monto)}?`,
                'Confirmar Eliminación'
            );

            if (!confirmed) return;

            await window.googleAPI.deleteRow(CONFIG.SHEETS.MULTAS, multa.rowIndex);
            Utils.showToast('Multa eliminada correctamente', 'success');

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.filterMultas(this.activeFilter);

        } catch (error) {
            console.error('Error eliminando multa:', error);
            Utils.showToast('Error eliminando la multa', 'error');
        }
    }

    // Marcar multa como pagada
    async marcarPagada(multaId) {
        try {
            const multa = this.multas.find(m => m.id === multaId);
            if (!multa) return;

            const confirmed = await Utils.confirm(
                `¿Confirma que la multa de ${Utils.formatCurrency(multa.monto)} ha sido pagada?`,
                'Confirmar Pago'
            );

            if (!confirmed) return;

            // Actualizar estado en Google Sheets
            const fechaPago = Utils.formatDate(new Date());
            const rowData = [
                multa.id,
                multa.idResidente,
                multa.fechaInfraccion,
                multa.descripcion,
                multa.monto,
                'Pagada',
                fechaPago
            ];

            const range = `A${multa.rowIndex + 1}:G${multa.rowIndex + 1}`;
            await window.googleAPI.writeSheet(CONFIG.SHEETS.MULTAS, range, [rowData]);

            Utils.showToast('Multa marcada como pagada', 'success');

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.filterMultas(this.activeFilter);

        } catch (error) {
            console.error('Error marcando multa como pagada:', error);
            Utils.showToast('Error actualizando el estado de la multa', 'error');
        }
    }
}

// Exportar módulo
window.MultasModule = MultasModule;

