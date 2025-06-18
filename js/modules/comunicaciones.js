// ===== MÓDULO COMUNICACIONES =====

const ComunicacionesModule = {
    data: {
        residentes: [],
        comunicaciones: [],
        selectedResidentes: [],
        emailTemplates: {
            'recordatorio-pago': {
                asunto: 'Recordatorio de Pago - Gastos Comunes {{mes}}',
                mensaje: `Estimado/a {{nombre}},

Le recordamos que tiene pendiente el pago de los gastos comunes correspondientes al mes de {{mes}}.

Detalles del pago:
- Parcela: {{parcela}}
- Monto: {{monto}}
- Fecha de vencimiento: {{fechaVencimiento}}

Por favor, realice el pago a la brevedad para evitar recargos por mora.

Saludos cordiales,
Administración Condominio Los Molles`
            },
            'aviso-general': {
                asunto: 'Aviso Importante - Condominio Los Molles',
                mensaje: `Estimados residentes,

{{mensaje}}

Saludos cordiales,
Administración Condominio Los Molles`
            },
            'convocatoria-asamblea': {
                asunto: 'Convocatoria a Asamblea de Copropietarios',
                mensaje: `Estimado/a {{nombre}},

Se convoca a la Asamblea de Copropietarios que se realizará:

Fecha: {{fecha}}
Hora: {{hora}}
Lugar: {{lugar}}

Tabla de temas a tratar:
{{temas}}

Su asistencia es muy importante.

Saludos cordiales,
Administración Condominio Los Molles`
            }
        }
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando comunicaciones...');
            
            // Cargar datos
            await this.loadData();
            
            // Renderizar contenido
            container.innerHTML = this.getHTML();
            
            // Configurar eventos
            this.setupEvents();
            
        } catch (error) {
            console.error('Error cargando comunicaciones:', error);
            container.innerHTML = `
                <div class="text-center">
                    <h2>Error cargando comunicaciones</h2>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="ComunicacionesModule.render(document.getElementById('content-area'))">
                        Reintentar
                    </button>
                </div>
            `;
        }
    },

    async loadData() {
        try {
            const [residentes, comunicaciones] = await Promise.all([
                sheetsAPI.getResidentes(),
                sheetsAPI.getComunicaciones()
            ]);

            this.data.residentes = residentes.filter(r => r.Estado === 'Activo');
            this.data.comunicaciones = comunicaciones;
        } catch (error) {
            console.error('Error cargando datos de comunicaciones:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="comunicaciones-module">
                <div class="module-header">
                    <h1>Comunicaciones</h1>
                    <p>Envío de correos electrónicos y gestión de comunicaciones</p>
                </div>

                <!-- Pestañas -->
                <div class="tabs-container">
                    <div class="tabs-nav">
                        <button class="tab-btn active" onclick="ComunicacionesModule.showTab('enviar')">
                            <i class="fas fa-paper-plane"></i>
                            Enviar Comunicación
                        </button>
                        <button class="tab-btn" onclick="ComunicacionesModule.showTab('historial')">
                            <i class="fas fa-history"></i>
                            Historial
                        </button>
                    </div>
                </div>

                <!-- Pestaña Enviar -->
                <div id="enviar-tab" class="tab-content active">
                    ${this.getEnviarHTML()}
                </div>

                <!-- Pestaña Historial -->
                <div id="historial-tab" class="tab-content">
                    ${this.getHistorialHTML()}
                </div>
            </div>
        `;
    },

    getEnviarHTML() {
        return `
            <div class="row">
                <!-- Formulario de envío -->
                <div class="col-8">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Nueva Comunicación</h3>
                        </div>
                        <div class="card-body">
                            <form id="comunicacion-form">
                                <div class="form-section">
                                    <h4 class="form-section-title">Destinatarios</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Seleccionar destinatarios</label>
                                        <div class="recipients-controls">
                                            <button type="button" id="select-all-btn" class="btn btn-sm btn-outline">
                                                <i class="fas fa-check-double"></i>
                                                Seleccionar Todos
                                            </button>
                                            <button type="button" id="select-none-btn" class="btn btn-sm btn-outline">
                                                <i class="fas fa-times"></i>
                                                Deseleccionar Todos
                                            </button>
                                            <button type="button" id="select-morosos-btn" class="btn btn-sm btn-warning">
                                                <i class="fas fa-exclamation-triangle"></i>
                                                Solo Morosos
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="recipients-list" id="recipients-list">
                                        ${this.getRecipientsList()}
                                    </div>
                                    
                                    <div class="selected-count">
                                        <span id="selected-count">0</span> destinatarios seleccionados
                                    </div>
                                </div>

                                <div class="form-section">
                                    <h4 class="form-section-title">Mensaje</h4>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Plantilla</label>
                                        <select id="email-template" class="form-control">
                                            <option value="">Mensaje personalizado</option>
                                            <option value="recordatorio-pago">Recordatorio de Pago</option>
                                            <option value="aviso-general">Aviso General</option>
                                            <option value="convocatoria-asamblea">Convocatoria Asamblea</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Asunto *</label>
                                        <input type="text" id="email-asunto" class="form-control" 
                                               placeholder="Ingrese el asunto del correo" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">Mensaje *</label>
                                        <textarea id="email-mensaje" class="form-control" rows="10" 
                                                  placeholder="Escriba su mensaje aquí..." required></textarea>
                                        <div class="form-help">
                                            Variables disponibles: {{nombre}}, {{parcela}}, {{email}}, {{mes}}, {{monto}}, {{fechaVencimiento}}
                                        </div>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="button" id="preview-btn" class="btn btn-secondary">
                                        <i class="fas fa-eye"></i>
                                        Vista Previa
                                    </button>
                                    <button type="button" id="send-btn" class="btn btn-primary">
                                        <i class="fas fa-paper-plane"></i>
                                        Enviar Comunicación
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Panel lateral -->
                <div class="col-4">
                    <!-- Plantillas -->
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">Plantillas Disponibles</h4>
                        </div>
                        <div class="card-body">
                            ${this.getTemplatesHTML()}
                        </div>
                    </div>

                    <!-- Estadísticas -->
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">Estadísticas</h4>
                        </div>
                        <div class="card-body">
                            <div class="stat-item">
                                <div class="stat-label">Total Residentes</div>
                                <div class="stat-value">${this.data.residentes.length}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Comunicaciones Enviadas (Mes)</div>
                                <div class="stat-value">${this.getMonthlyEmailCount()}</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-label">Última Comunicación</div>
                                <div class="stat-value">${this.getLastEmailDate()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getHistorialHTML() {
        return `
            <!-- Filtros -->
            <div class="filters-container">
                <div class="search-container">
                    <div class="form-group">
                        <label class="form-label">Buscar</label>
                        <div class="search-input">
                            <input type="text" id="search-comunicaciones" class="form-control" 
                                   placeholder="Buscar por asunto o destinatario...">
                            <i class="fas fa-search"></i>
                        </div>
                    </div>
                </div>
                
                <div class="filter-group">
                    <div class="form-group">
                        <label class="form-label">Fecha</label>
                        <input type="month" id="filter-date-comunicaciones" class="form-control">
                    </div>
                </div>
            </div>

            <!-- Tabla de historial -->
            <div class="table-container">
                <div class="table-header">
                    <div class="table-title">
                        Historial de Comunicaciones (<span id="total-comunicaciones">0</span>)
                    </div>
                    <div class="table-actions-header">
                        <button id="export-comunicaciones-btn" class="btn btn-outline">
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
                                <th>Asunto</th>
                                <th>Destinatarios</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="comunicaciones-tbody">
                            <!-- Contenido generado dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getRecipientsList() {
        return this.data.residentes.map(residente => `
            <div class="recipient-item">
                <label class="recipient-checkbox">
                    <input type="checkbox" value="${residente.N_Parcela}" data-email="${residente.Email}" data-nombre="${residente.NombreCompleto}">
                    <span class="checkmark"></span>
                    <div class="recipient-info">
                        <div class="recipient-name">${residente.NombreCompleto}</div>
                        <div class="recipient-details">Parcela ${residente.N_Parcela} • ${residente.Email}</div>
                    </div>
                </label>
            </div>
        `).join('');
    },

    getTemplatesHTML() {
        return Object.keys(this.data.emailTemplates).map(key => {
            const template = this.data.emailTemplates[key];
            const templateName = key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            return `
                <div class="email-template" onclick="ComunicacionesModule.loadTemplate('${key}')">
                    <div class="email-template-title">${templateName}</div>
                    <div class="email-template-preview">${template.asunto}</div>
                </div>
            `;
        }).join('');
    },

    getMonthlyEmailCount() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.data.comunicaciones.filter(c => {
            const emailDate = new Date(c.FechaEnvio);
            return emailDate.getMonth() === currentMonth && emailDate.getFullYear() === currentYear;
        }).length;
    },

    getLastEmailDate() {
        if (this.data.comunicaciones.length === 0) return 'Nunca';
        
        const lastEmail = this.data.comunicaciones.reduce((latest, current) => {
            return new Date(current.FechaEnvio) > new Date(latest.FechaEnvio) ? current : latest;
        });
        
        return helpers.formatDate(lastEmail.FechaEnvio);
    },

    setupEvents() {
        // Eventos de pestañas ya configurados en el HTML

        // Eventos de envío
        this.setupEnviarEvents();
        
        // Eventos de historial
        this.setupHistorialEvents();
    },

    setupEnviarEvents() {
        // Selección de destinatarios
        const selectAllBtn = document.getElementById('select-all-btn');
        const selectNoneBtn = document.getElementById('select-none-btn');
        const selectMorososBtn = document.getElementById('select-morosos-btn');
        
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllRecipients(true));
        }
        
        if (selectNoneBtn) {
            selectNoneBtn.addEventListener('click', () => this.selectAllRecipients(false));
        }
        
        if (selectMorososBtn) {
            selectMorososBtn.addEventListener('click', () => this.selectMorosos());
        }

        // Checkboxes de destinatarios
        document.querySelectorAll('#recipients-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateSelectedCount());
        });

        // Plantilla de email
        const templateSelect = document.getElementById('email-template');
        if (templateSelect) {
            templateSelect.addEventListener('change', () => {
                const templateKey = templateSelect.value;
                if (templateKey) {
                    this.loadTemplate(templateKey);
                }
            });
        }

        // Botones de acción
        const previewBtn = document.getElementById('preview-btn');
        const sendBtn = document.getElementById('send-btn');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showPreview());
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendCommunication());
        }

        // Actualizar contador inicial
        this.updateSelectedCount();
    },

    setupHistorialEvents() {
        // Búsqueda
        const searchInput = document.getElementById('search-comunicaciones');
        if (searchInput) {
            searchInput.addEventListener('input', helpers.debounce(() => {
                this.filterHistorial();
            }, 300));
        }

        // Filtro de fecha
        const dateFilter = document.getElementById('filter-date-comunicaciones');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.filterHistorial();
            });
        }

        // Exportar
        const exportBtn = document.getElementById('export-comunicaciones-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportHistorial());
        }
    },

    showTab(tabName) {
        // Actualizar pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[onclick="ComunicacionesModule.showTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        if (tabName === 'historial') {
            this.renderHistorial();
        }
    },

    selectAllRecipients(select) {
        document.querySelectorAll('#recipients-list input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = select;
        });
        this.updateSelectedCount();
    },

    selectMorosos() {
        // Primero deseleccionar todos
        this.selectAllRecipients(false);
        
        // Luego seleccionar solo morosos
        const morosos = this.data.residentes.filter(r => r.Estado === 'Moroso');
        morosos.forEach(moroso => {
            const checkbox = document.querySelector(`#recipients-list input[value="${moroso.N_Parcela}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        this.updateSelectedCount();
    },

    updateSelectedCount() {
        const selectedCheckboxes = document.querySelectorAll('#recipients-list input[type="checkbox"]:checked');
        const count = selectedCheckboxes.length;
        
        document.getElementById('selected-count').textContent = count;
        
        // Actualizar array de seleccionados
        this.data.selectedResidentes = Array.from(selectedCheckboxes).map(checkbox => ({
            parcela: checkbox.value,
            email: checkbox.dataset.email,
            nombre: checkbox.dataset.nombre
        }));
    },

    loadTemplate(templateKey) {
        const template = this.data.emailTemplates[templateKey];
        if (!template) return;

        document.getElementById('email-asunto').value = template.asunto;
        document.getElementById('email-mensaje').value = template.mensaje;
    },

    showPreview() {
        const asunto = document.getElementById('email-asunto').value;
        const mensaje = document.getElementById('email-mensaje').value;
        
        if (!asunto || !mensaje) {
            app.showNotification('Complete el asunto y mensaje para ver la vista previa', 'warning');
            return;
        }

        if (this.data.selectedResidentes.length === 0) {
            app.showNotification('Seleccione al menos un destinatario', 'warning');
            return;
        }

        // Tomar el primer destinatario como ejemplo
        const ejemplo = this.data.selectedResidentes[0];
        const residente = this.data.residentes.find(r => r.N_Parcela == ejemplo.parcela);
        
        const previewAsunto = this.replaceVariables(asunto, residente);
        const previewMensaje = this.replaceVariables(mensaje, residente);

        const modalContent = `
            <div class="email-preview">
                <div class="preview-header">
                    <strong>Para:</strong> ${ejemplo.email}<br>
                    <strong>Asunto:</strong> ${previewAsunto}
                </div>
                <div class="preview-body">
                    ${previewMensaje.replace(/\n/g, '<br>')}
                </div>
                <div class="preview-footer">
                    <small><em>Vista previa usando datos de ${ejemplo.nombre} (Parcela ${ejemplo.parcela})</em></small>
                </div>
            </div>
        `;

        app.showModal('Vista Previa del Email', modalContent, []);
    },

    replaceVariables(text, residente) {
        if (!residente) return text;
        
        const currentDate = new Date();
        const currentMonth = currentDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        
        return text
            .replace(/{{nombre}}/g, residente.NombreCompleto)
            .replace(/{{parcela}}/g, residente.N_Parcela)
            .replace(/{{email}}/g, residente.Email)
            .replace(/{{mes}}/g, currentMonth)
            .replace(/{{monto}}/g, helpers.formatCurrency(residente.ValorGastoComun))
            .replace(/{{fechaVencimiento}}/g, helpers.formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 10)));
    },

    async sendCommunication() {
        const asunto = document.getElementById('email-asunto').value;
        const mensaje = document.getElementById('email-mensaje').value;
        
        // Validaciones
        if (!asunto || !mensaje) {
            app.showNotification('Complete el asunto y mensaje', 'error');
            return;
        }

        if (this.data.selectedResidentes.length === 0) {
            app.showNotification('Seleccione al menos un destinatario', 'error');
            return;
        }

        if (!confirm(`¿Está seguro de enviar la comunicación a ${this.data.selectedResidentes.length} destinatarios?`)) {
            return;
        }

        try {
            app.showNotification('Enviando comunicaciones...', 'info');
            
            let enviados = 0;
            let errores = 0;

            // Enviar emails uno por uno
            for (const destinatario of this.data.selectedResidentes) {
                try {
                    const residente = this.data.residentes.find(r => r.N_Parcela == destinatario.parcela);
                    
                    const asuntoPersonalizado = this.replaceVariables(asunto, residente);
                    const mensajePersonalizado = this.replaceVariables(mensaje, residente);

                    await gmailAPI.sendEmail({
                        to: destinatario.email,
                        subject: asuntoPersonalizado,
                        body: mensajePersonalizado
                    });

                    // Registrar comunicación
                    await sheetsAPI.addComunicacion({
                        idResidente: residente.ID_Residente,
                        nParcela: destinatario.parcela,
                        nombreCompleto: destinatario.nombre,
                        email: destinatario.email,
                        fechaEnvio: helpers.getCurrentDateTime(),
                        asunto: asuntoPersonalizado,
                        mensaje: mensajePersonalizado
                    });

                    enviados++;
                } catch (error) {
                    console.error(`Error enviando a ${destinatario.email}:`, error);
                    errores++;
                }
            }

            // Mostrar resultado
            if (errores === 0) {
                app.showNotification(`Comunicación enviada exitosamente a ${enviados} destinatarios`, 'success');
            } else {
                app.showNotification(`Enviados: ${enviados}, Errores: ${errores}`, 'warning');
            }

            // Limpiar formulario
            this.clearForm();

            // Recargar datos
            await this.loadData();

        } catch (error) {
            console.error('Error enviando comunicaciones:', error);
            app.showNotification('Error al enviar comunicaciones: ' + error.message, 'error');
        }
    },

    clearForm() {
        document.getElementById('email-asunto').value = '';
        document.getElementById('email-mensaje').value = '';
        document.getElementById('email-template').value = '';
        this.selectAllRecipients(false);
    },

    renderHistorial() {
        const tbody = document.getElementById('comunicaciones-tbody');
        if (!tbody) return;

        const comunicaciones = this.data.comunicaciones.slice().reverse(); // Más recientes primero

        tbody.innerHTML = comunicaciones.map(comunicacion => `
            <tr>
                <td>${helpers.formatDateTime(comunicacion.FechaEnvio)}</td>
                <td>${comunicacion.Asunto}</td>
                <td>
                    <div class="recipient-info">
                        <div>${comunicacion.NombreCompleto}</div>
                        <small class="text-muted">Parcela ${comunicacion.N_Parcela} • ${comunicacion.Email}</small>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-success">
                        <i class="fas fa-check"></i>
                        Enviado
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="ComunicacionesModule.viewCommunication('${comunicacion.ID_Comunicacion}')" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('total-comunicaciones').textContent = comunicaciones.length;
    },

    filterHistorial() {
        // Implementar filtrado del historial
        this.renderHistorial();
    },

    viewCommunication(id) {
        const comunicacion = this.data.comunicaciones.find(c => c.ID_Comunicacion === id);
        if (!comunicacion) return;

        const modalContent = `
            <div class="communication-details">
                <div class="detail-row">
                    <strong>Fecha:</strong> ${helpers.formatDateTime(comunicacion.FechaEnvio)}
                </div>
                <div class="detail-row">
                    <strong>Destinatario:</strong> ${comunicacion.NombreCompleto} (${comunicacion.Email})
                </div>
                <div class="detail-row">
                    <strong>Parcela:</strong> ${comunicacion.N_Parcela}
                </div>
                <div class="detail-row">
                    <strong>Asunto:</strong> ${comunicacion.Asunto}
                </div>
                <div class="detail-row">
                    <strong>Mensaje:</strong>
                    <div class="message-content">${comunicacion.Mensaje.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `;

        app.showModal('Detalle de Comunicación', modalContent, []);
    },

    exportHistorial() {
        try {
            const data = this.data.comunicaciones.map(c => ({
                'Fecha': c.FechaEnvio,
                'Destinatario': c.NombreCompleto,
                'Email': c.Email,
                'Parcela': c.N_Parcela,
                'Asunto': c.Asunto,
                'Mensaje': c.Mensaje
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Comunicaciones');
            
            const fileName = `comunicaciones_${helpers.getCurrentDate()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            app.showNotification('Archivo Excel exportado correctamente', 'success');

        } catch (error) {
            console.error('Error exportando historial:', error);
            app.showNotification('Error al exportar historial: ' + error.message, 'error');
        }
    }
};

// Exportar para uso global
window.ComunicacionesModule = ComunicacionesModule;

