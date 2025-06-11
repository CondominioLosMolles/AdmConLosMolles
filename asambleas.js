// Módulo Asambleas - Gestión de asambleas según Ley 21.442 y Decreto 7
class AsambleasModule {
    constructor() {
        this.asambleas = [];
        this.residentes = [];
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

        } catch (error) {
            console.error('Error cargando asambleas:', error);
            Utils.showError(container, 'Error cargando las asambleas');
        }
    }

    // Cargar datos
    async loadData() {
        try {
            const [asambleasData, residentesData] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.ASAMBLEAS),
                window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES)
            ]);

            // Procesar asambleas
            if (asambleasData.length > 1) {
                this.asambleas = asambleasData.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    fecha: row[1] || '',
                    tipo: row[2] || 'Ordinaria',
                    descripcion: row[3] || '',
                    estado: row[4] || 'Programada',
                    idActaDrive: row[5] || '',
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

        } catch (error) {
            console.error('Error cargando datos de asambleas:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        const stats = this.calculateStats();

        return `
            <div class="asambleas-container">
                <div class="module-header">
                    <h2>Asambleas</h2>
                    <div class="module-actions">
                        <button class="btn btn-primary" id="programar-asamblea-btn">
                            <i class="fas fa-calendar-plus"></i>
                            Programar Asamblea
                        </button>
                    </div>
                </div>

                <!-- Aviso legal -->
                <div class="legal-notice">
                    <h4><i class="fas fa-gavel"></i> Marco Legal</h4>
                    <p>Las asambleas deben cumplir con los requisitos de la Ley 21.442 y el Decreto 7. 
                    Las asambleas ordinarias requieren citación con 15 días de anticipación, las extraordinarias con 8 días.</p>
                </div>

                <!-- Estadísticas -->
                <div class="summary-cards">
                    <div class="summary-card">
                        <div class="summary-value status-pendiente">${stats.programadas}</div>
                        <div class="summary-label">Programadas</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value status-completada">${stats.realizadas}</div>
                        <div class="summary-label">Realizadas</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value status-moroso">${stats.canceladas}</div>
                        <div class="summary-label">Canceladas</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value">${stats.proximaAsamblea || 'N/A'}</div>
                        <div class="summary-label">Próxima Asamblea</div>
                    </div>
                </div>

                <!-- Lista de asambleas -->
                <div class="asambleas-list">
                    ${this.getAsambleasCards()}
                </div>

                ${this.asambleas.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-users-cog"></i>
                    <h3>No hay asambleas programadas</h3>
                    <p>Programe la primera asamblea del condominio.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('programar-asamblea-btn').click()">
                        Programar Primera Asamblea
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Calcular estadísticas
    calculateStats() {
        const programadas = this.asambleas.filter(a => a.estado === 'Programada').length;
        const realizadas = this.asambleas.filter(a => a.estado === 'Realizada').length;
        const canceladas = this.asambleas.filter(a => a.estado === 'Cancelada').length;
        
        // Encontrar próxima asamblea
        const proximasAsambleas = this.asambleas
            .filter(a => a.estado === 'Programada' && new Date(a.fecha) > new Date())
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        const proximaAsamblea = proximasAsambleas.length > 0 ? 
            Utils.formatDate(Utils.parseDate(proximasAsambleas[0].fecha)) : null;

        return { programadas, realizadas, canceladas, proximaAsamblea };
    }

    // Obtener tarjetas de asambleas
    getAsambleasCards() {
        if (this.asambleas.length === 0) return '';

        // Ordenar por fecha (más recientes primero)
        const asambleasOrdenadas = [...this.asambleas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        return asambleasOrdenadas.map(asamblea => `
            <div class="asamblea-card ${asamblea.tipo.toLowerCase()}">
                <div class="asamblea-header">
                    <h3 class="asamblea-title">Asamblea ${asamblea.tipo}</h3>
                    <span class="asamblea-tipo ${asamblea.tipo.toLowerCase()}">${asamblea.tipo}</span>
                </div>
                
                <div class="asamblea-info">
                    <div class="asamblea-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${Utils.formatDate(Utils.parseDate(asamblea.fecha))}</span>
                    </div>
                    <div class="asamblea-info-item">
                        <i class="fas fa-info-circle"></i>
                        <span class="status-${asamblea.estado.toLowerCase()}">${asamblea.estado}</span>
                    </div>
                    ${asamblea.idActaDrive ? `
                    <div class="asamblea-info-item">
                        <i class="fas fa-file-alt"></i>
                        <span>Acta disponible</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="asamblea-descripcion">
                    <p>${Utils.escapeHtml(asamblea.descripcion)}</p>
                </div>
                
                <div class="asamblea-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.App.getCurrentModule().editAsamblea('${asamblea.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                    
                    ${asamblea.estado === 'Programada' ? `
                    <button class="btn btn-sm btn-success" onclick="window.App.getCurrentModule().marcarRealizada('${asamblea.id}')">
                        <i class="fas fa-check"></i>
                        Marcar Realizada
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="window.App.getCurrentModule().cancelarAsamblea('${asamblea.id}')">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    ` : ''}
                    
                    ${asamblea.estado === 'Realizada' && !asamblea.idActaDrive ? `
                    <button class="btn btn-sm btn-info" onclick="window.App.getCurrentModule().adjuntarActa('${asamblea.id}')">
                        <i class="fas fa-upload"></i>
                        Adjuntar Acta
                    </button>
                    ` : ''}
                    
                    ${asamblea.idActaDrive ? `
                    <button class="btn btn-sm btn-info" onclick="window.App.getCurrentModule().verActa('${asamblea.idActaDrive}')">
                        <i class="fas fa-eye"></i>
                        Ver Acta
                    </button>
                    ` : ''}
                    
                    <button class="btn btn-sm btn-danger" onclick="window.App.getCurrentModule().deleteAsamblea('${asamblea.id}')">
                        <i class="fas fa-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Configurar eventos
    setupEvents() {
        // Botón programar asamblea
        const programarBtn = document.getElementById('programar-asamblea-btn');
        if (programarBtn) {
            programarBtn.addEventListener('click', () => this.showAsambleaForm());
        }
    }

    // Mostrar formulario de asamblea
    showAsambleaForm(asambleaId = null) {
        const asamblea = asambleaId ? this.asambleas.find(a => a.id === asambleaId) : null;
        const isEdit = !!asamblea;

        // Calcular fecha mínima (8 días para extraordinaria, 15 para ordinaria)
        const today = new Date();
        const minDateOrd = new Date(today.getTime() + (15 * 24 * 60 * 60 * 1000));
        const minDateExt = new Date(today.getTime() + (8 * 24 * 60 * 60 * 1000));

        const formHTML = `
            <form id="asamblea-form" class="asamblea-form">
                <div class="legal-notice">
                    <h4>Requisitos Legales</h4>
                    <p><strong>Asambleas Ordinarias:</strong> Citación con 15 días de anticipación mínimo.<br>
                    <strong>Asambleas Extraordinarias:</strong> Citación con 8 días de anticipación mínimo.</p>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Tipo de Asamblea *</label>
                        <select id="tipo" class="form-select" required ${isEdit ? 'disabled' : ''}>
                            <option value="Ordinaria" ${asamblea?.tipo === 'Ordinaria' ? 'selected' : ''}>Ordinaria</option>
                            <option value="Extraordinaria" ${asamblea?.tipo === 'Extraordinaria' ? 'selected' : ''}>Extraordinaria</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha y Hora *</label>
                        <input type="datetime-local" id="fecha" class="form-input" 
                               value="${asamblea ? this.formatDateTimeForInput(asamblea.fecha) : ''}" 
                               min="${Utils.formatDateForInput(minDateExt)}T09:00" required>
                        <small class="form-help" id="fecha-help">Mínimo 8 días de anticipación</small>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Descripción / Tabla de Temas *</label>
                    <textarea id="descripcion" class="form-textarea" rows="6" required placeholder="Ej:&#10;1. Lectura y aprobación del acta anterior&#10;2. Informe del administrador&#10;3. Estados financieros&#10;4. Varios">${asamblea?.descripcion || ''}</textarea>
                </div>

                ${isEdit ? `
                <div class="form-group">
                    <label class="form-label">Estado</label>
                    <select id="estado" class="form-select">
                        <option value="Programada" ${asamblea?.estado === 'Programada' ? 'selected' : ''}>Programada</option>
                        <option value="Realizada" ${asamblea?.estado === 'Realizada' ? 'selected' : ''}>Realizada</option>
                        <option value="Cancelada" ${asamblea?.estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                    </select>
                </div>
                ` : ''}

                <div class="form-group">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="notificar-residentes" ${!isEdit ? 'checked' : ''}>
                        <label for="notificar-residentes" class="form-label" style="margin: 0;">
                            Notificar a todos los residentes activos por email
                        </label>
                    </div>
                    <small class="form-help">Se enviará la citación oficial a todos los residentes</small>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveAsamblea(${isEdit ? `'${asambleaId}'` : 'null'})">
                ${isEdit ? 'Actualizar' : 'Programar'} Asamblea
            </button>
        `;

        window.App.openModal(
            isEdit ? 'Editar Asamblea' : 'Programar Asamblea',
            formHTML,
            footerHTML
        );

        // Configurar eventos del formulario
        this.setupFormEvents();
    }

    // Configurar eventos del formulario
    setupFormEvents() {
        const tipoSelect = document.getElementById('tipo');
        const fechaInput = document.getElementById('fecha');
        const fechaHelp = document.getElementById('fecha-help');

        if (tipoSelect && fechaInput && fechaHelp) {
            tipoSelect.addEventListener('change', () => {
                const today = new Date();
                const tipo = tipoSelect.value;
                const diasMinimos = tipo === 'Ordinaria' ? 15 : 8;
                const minDate = new Date(today.getTime() + (diasMinimos * 24 * 60 * 60 * 1000));
                
                fechaInput.min = Utils.formatDateForInput(minDate) + 'T09:00';
                fechaHelp.textContent = `Mínimo ${diasMinimos} días de anticipación`;
            });
        }
    }

    // Formatear fecha y hora para input datetime-local
    formatDateTimeForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    }

    // Guardar asamblea
    async saveAsamblea(asambleaId = null) {
        try {
            const form = document.getElementById('asamblea-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = {
                tipo: document.getElementById('tipo').value,
                fecha: document.getElementById('fecha').value,
                descripcion: document.getElementById('descripcion').value.trim()
            };

            // Para edición, incluir estado
            if (asambleaId) {
                formData.estado = document.getElementById('estado').value;
            } else {
                formData.estado = 'Programada';
            }

            const notificarResidentes = document.getElementById('notificar-residentes').checked;

            // Validar fecha mínima
            const fechaAsamblea = new Date(formData.fecha);
            const today = new Date();
            const diasAnticipacion = Math.ceil((fechaAsamblea - today) / (1000 * 60 * 60 * 24));
            const diasMinimos = formData.tipo === 'Ordinaria' ? 15 : 8;

            if (diasAnticipacion < diasMinimos && !asambleaId) {
                Utils.showToast(`La asamblea ${formData.tipo.toLowerCase()} requiere mínimo ${diasMinimos} días de anticipación`, 'error');
                return;
            }

            // Preparar datos para Google Sheets
            const rowData = [
                asambleaId || Utils.generateId(),
                formData.fecha,
                formData.tipo,
                formData.descripcion,
                formData.estado,
                '' // idActaDrive
            ];

            if (asambleaId) {
                // Actualizar asamblea existente
                const asamblea = this.asambleas.find(a => a.id === asambleaId);
                if (asamblea) {
                    rowData[5] = asamblea.idActaDrive; // Mantener acta existente
                    const range = `A${asamblea.rowIndex + 1}:F${asamblea.rowIndex + 1}`;
                    await window.googleAPI.writeSheet(CONFIG.SHEETS.ASAMBLEAS, range, [rowData]);
                    Utils.showToast('Asamblea actualizada correctamente', 'success');
                }
            } else {
                // Agregar nueva asamblea
                await window.googleAPI.appendToSheet(CONFIG.SHEETS.ASAMBLEAS, rowData);

                // Enviar notificaciones si está marcado
                if (notificarResidentes) {
                    await this.sendCitacionNotifications(formData);
                }

                Utils.showToast('Asamblea programada correctamente', 'success');
            }

            window.App.closeModal();
            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();

        } catch (error) {
            console.error('Error guardando asamblea:', error);
            Utils.showToast('Error guardando la asamblea', 'error');
        }
    }

    // Enviar notificaciones de citación
    async sendCitacionNotifications(asambleaData) {
        try {
            const residentesActivos = this.residentes.filter(r => r.estado === 'Activo');
            const fechaAsamblea = new Date(asambleaData.fecha);
            
            const asunto = `Citación a Asamblea ${asambleaData.tipo} - Condominio Los Molles`;
            
            // Enviar email a cada residente
            for (const residente of residentesActivos) {
                const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 20px; text-align: center;">
                            <h1 style="margin: 0;">Condominio Los Molles</h1>
                            <h2 style="margin: 10px 0 0 0;">Citación a Asamblea</h2>
                        </div>
                        <div style="padding: 30px; background: white;">
                            <p>Estimado/a <strong>${residente.nombreCompleto}</strong>,</p>
                            
                            <p>Por medio de la presente, se le cita a la <strong>Asamblea ${asambleaData.tipo}</strong> que se realizará:</p>
                            
                            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                <h3 style="color: #0369a1; margin-top: 0;">Detalles de la Asamblea</h3>
                                <p><strong>Fecha:</strong> ${fechaAsamblea.toLocaleDateString('es-CL', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                })}</p>
                                <p><strong>Hora:</strong> ${fechaAsamblea.toLocaleTimeString('es-CL', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                })}</p>
                                <p><strong>Lugar:</strong> Sede social del condominio</p>
                                <p><strong>Parcela:</strong> ${residente.nParcela}</p>
                            </div>
                            
                            <div style="margin: 20px 0;">
                                <h3>Tabla de Temas:</h3>
                                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-line;">
                                    ${asambleaData.descripcion}
                                </div>
                            </div>
                            
                            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0;"><strong>Importante:</strong> Su asistencia es fundamental para el buen funcionamiento del condominio. En caso de no poder asistir, puede otorgar poder a otro copropietario.</p>
                            </div>
                            
                            <p>Para cualquier consulta, puede contactarnos respondiendo a este correo.</p>
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p>Atentamente,<br>
                                <strong>Administración Condominio Los Molles</strong><br>
                                Email: ${CONFIG.ADMIN_EMAIL}</p>
                            </div>
                        </div>
                        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                            Esta citación se envía en cumplimiento de la Ley 21.442 sobre copropiedad inmobiliaria.
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
                    `Citación a asamblea ${asambleaData.tipo} para el ${Utils.formatDate(fechaAsamblea)}`
                ];

                await window.googleAPI.appendToSheet(CONFIG.SHEETS.COMUNICACIONES, comunicacionData);
            }

            Utils.showToast(`Citaciones enviadas a ${residentesActivos.length} residentes`, 'success');

        } catch (error) {
            console.error('Error enviando citaciones:', error);
            Utils.showToast('Error enviando las citaciones', 'warning');
        }
    }

    // Editar asamblea
    editAsamblea(asambleaId) {
        this.showAsambleaForm(asambleaId);
    }

    // Marcar asamblea como realizada
    async marcarRealizada(asambleaId) {
        try {
            const asamblea = this.asambleas.find(a => a.id === asambleaId);
            if (!asamblea) return;

            const confirmed = await Utils.confirm(
                '¿Confirma que la asamblea se ha realizado?',
                'Confirmar Realización'
            );

            if (!confirmed) return;

            // Actualizar estado en Google Sheets
            const rowData = [
                asamblea.id,
                asamblea.fecha,
                asamblea.tipo,
                asamblea.descripcion,
                'Realizada',
                asamblea.idActaDrive
            ];

            const range = `A${asamblea.rowIndex + 1}:F${asamblea.rowIndex + 1}`;
            await window.googleAPI.writeSheet(CONFIG.SHEETS.ASAMBLEAS, range, [rowData]);

            Utils.showToast('Asamblea marcada como realizada', 'success');

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();

        } catch (error) {
            console.error('Error marcando asamblea como realizada:', error);
            Utils.showToast('Error actualizando el estado de la asamblea', 'error');
        }
    }

    // Cancelar asamblea
    async cancelarAsamblea(asambleaId) {
        try {
            const asamblea = this.asambleas.find(a => a.id === asambleaId);
            if (!asamblea) return;

            const confirmed = await Utils.confirm(
                '¿Está seguro de que desea cancelar la asamblea?',
                'Confirmar Cancelación'
            );

            if (!confirmed) return;

            // Actualizar estado en Google Sheets
            const rowData = [
                asamblea.id,
                asamblea.fecha,
                asamblea.tipo,
                asamblea.descripcion,
                'Cancelada',
                asamblea.idActaDrive
            ];

            const range = `A${asamblea.rowIndex + 1}:F${asamblea.rowIndex + 1}`;
            await window.googleAPI.writeSheet(CONFIG.SHEETS.ASAMBLEAS, range, [rowData]);

            Utils.showToast('Asamblea cancelada', 'success');

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();

        } catch (error) {
            console.error('Error cancelando asamblea:', error);
            Utils.showToast('Error cancelando la asamblea', 'error');
        }
    }

    // Adjuntar acta
    adjuntarActa(asambleaId) {
        const formHTML = `
            <form id="acta-form">
                <div class="form-group">
                    <label class="form-label">Acta de la Asamblea (PDF) *</label>
                    <input type="file" id="acta-file" class="form-input" accept=".pdf" required>
                    <small class="form-help">Seleccione el archivo PDF del acta de la asamblea</small>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveActa('${asambleaId}')">
                Subir Acta
            </button>
        `;

        window.App.openModal('Adjuntar Acta', formHTML, footerHTML);
    }

    // Guardar acta
    async saveActa(asambleaId) {
        try {
            const actaFile = document.getElementById('acta-file').files[0];
            if (!actaFile) {
                Utils.showToast('Seleccione un archivo PDF', 'error');
                return;
            }

            const asamblea = this.asambleas.find(a => a.id === asambleaId);
            if (!asamblea) return;

            // Subir archivo a Google Drive
            const folders = await window.googleAPI.ensureFolderStructure();
            const fileName = `Acta_${asamblea.tipo}_${Utils.formatDate(Utils.parseDate(asamblea.fecha)).replace(/\//g, '-')}.pdf`;
            const uploadResult = await window.googleAPI.uploadFile(actaFile, fileName, folders.asambleas);

            // Actualizar registro en Google Sheets
            const rowData = [
                asamblea.id,
                asamblea.fecha,
                asamblea.tipo,
                asamblea.descripcion,
                asamblea.estado,
                uploadResult.id
            ];

            const range = `A${asamblea.rowIndex + 1}:F${asamblea.rowIndex + 1}`;
            await window.googleAPI.writeSheet(CONFIG.SHEETS.ASAMBLEAS, range, [rowData]);

            Utils.showToast('Acta adjuntada correctamente', 'success');
            window.App.closeModal();

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();

        } catch (error) {
            console.error('Error adjuntando acta:', error);
            Utils.showToast('Error adjuntando el acta', 'error');
        }
    }

    // Ver acta
    verActa(driveId) {
        const driveUrl = `https://drive.google.com/file/d/${driveId}/view`;
        window.open(driveUrl, '_blank');
    }

    // Eliminar asamblea
    async deleteAsamblea(asambleaId) {
        try {
            const asamblea = this.asambleas.find(a => a.id === asambleaId);
            if (!asamblea) return;

            const confirmed = await Utils.confirm(
                `¿Está seguro de que desea eliminar la asamblea ${asamblea.tipo.toLowerCase()}?`,
                'Confirmar Eliminación'
            );

            if (!confirmed) return;

            await window.googleAPI.deleteRow(CONFIG.SHEETS.ASAMBLEAS, asamblea.rowIndex);
            Utils.showToast('Asamblea eliminada correctamente', 'success');

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();

        } catch (error) {
            console.error('Error eliminando asamblea:', error);
            Utils.showToast('Error eliminando la asamblea', 'error');
        }
    }
}

// Exportar módulo
window.AsambleasModule = AsambleasModule;

