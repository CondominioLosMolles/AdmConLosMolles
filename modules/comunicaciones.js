// Módulo Comunicaciones - Gestión de comunicaciones por email
class ComunicacionesModule {
    constructor() {
        this.comunicaciones = [];
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
            console.error('Error cargando comunicaciones:', error);
            Utils.showError(container, 'Error cargando las comunicaciones');
        }
    }

    // Cargar datos
    async loadData() {
        try {
            const [comunicacionesData, residentesData] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.COMUNICACIONES),
                window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES)
            ]);

            // Procesar comunicaciones
            if (comunicacionesData.length > 1) {
                this.comunicaciones = comunicacionesData.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    idResidente: row[1] || '',
                    fechaEnvio: row[2] || '',
                    asunto: row[3] || '',
                    mensaje: row[4] || '',
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
            console.error('Error cargando datos de comunicaciones:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        return `
            <div class="comunicaciones-container">
                <div class="module-header">
                    <h2>Comunicaciones</h2>
                    <div class="module-actions">
                        <button class="btn btn-primary" id="nueva-comunicacion-btn">
                            <i class="fas fa-envelope"></i>
                            Nueva Comunicación
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Historial de Comunicaciones</h3>
                    </div>
                    
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha Envío</th>
                                    <th>Destinatario</th>
                                    <th>Asunto</th>
                                    <th>Mensaje (Vista previa)</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.getComunicacionesTableRows()}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${this.comunicaciones.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-envelope-open"></i>
                    <h3>No hay comunicaciones enviadas</h3>
                    <p>Comience enviando la primera comunicación a los residentes.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('nueva-comunicacion-btn').click()">
                        Enviar Primera Comunicación
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Obtener filas de la tabla de comunicaciones
    getComunicacionesTableRows() {
        if (this.comunicaciones.length === 0) {
            return '<tr><td colspan="5" class="text-center">No hay comunicaciones registradas</td></tr>';
        }

        return this.comunicaciones.map(comunicacion => {
            const residente = this.residentes.find(r => r.id === comunicacion.idResidente);
            const destinatario = residente ? `${residente.nombreCompleto} (Parcela ${residente.nParcela})` : 'Residente no encontrado';
            const mensajePreview = comunicacion.mensaje.length > 100 ? 
                comunicacion.mensaje.substring(0, 100) + '...' : 
                comunicacion.mensaje;

            return `
                <tr>
                    <td>${Utils.formatDate(Utils.parseDate(comunicacion.fechaEnvio))}</td>
                    <td>${Utils.escapeHtml(destinatario)}</td>
                    <td>${Utils.escapeHtml(comunicacion.asunto)}</td>
                    <td>${Utils.escapeHtml(mensajePreview)}</td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-edit" onclick="window.App.getCurrentModule().viewComunicacion('${comunicacion.id}')" title="Ver completo">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Configurar eventos
    setupEvents() {
        // Botón nueva comunicación
        const nuevaBtn = document.getElementById('nueva-comunicacion-btn');
        if (nuevaBtn) {
            nuevaBtn.addEventListener('click', () => this.showComunicacionForm());
        }
    }

    // Mostrar formulario de nueva comunicación
    showComunicacionForm() {
        const formHTML = `
            <form id="comunicacion-form" class="comunicacion-form">
                <div class="form-group">
                    <label class="form-label">Destinatario *</label>
                    <select id="residente-select" class="form-select" required>
                        <option value="">Seleccionar residente...</option>
                        ${this.residentes.filter(r => r.estado === 'Activo').map(residente => `
                            <option value="${residente.id}" data-email="${residente.email}">
                                Parcela ${residente.nParcela} - ${residente.nombreCompleto} (${residente.email})
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Email del destinatario</label>
                    <input type="email" id="email-destinatario" class="form-input" readonly>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Asunto *</label>
                    <input type="text" id="asunto" class="form-input" placeholder="Ej: Aviso importante del condominio" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mensaje *</label>
                    <textarea id="mensaje" class="email-editor" placeholder="Escriba aquí el mensaje..." required></textarea>
                </div>
                
                <div class="email-preview" id="email-preview" style="display: none;">
                    <h4>Vista previa del email:</h4>
                    <div id="preview-content"></div>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-info" onclick="window.App.getCurrentModule().previewEmail()">Vista Previa</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().sendComunicacion()">
                <i class="fas fa-paper-plane"></i>
                Enviar
            </button>
        `;

        window.App.openModal('Nueva Comunicación', formHTML, footerHTML);

        // Configurar eventos del formulario
        this.setupFormEvents();
    }

    // Configurar eventos del formulario
    setupFormEvents() {
        // Actualizar email cuando se selecciona residente
        const residenteSelect = document.getElementById('residente-select');
        const emailInput = document.getElementById('email-destinatario');
        
        if (residenteSelect && emailInput) {
            residenteSelect.addEventListener('change', (e) => {
                const selectedOption = e.target.selectedOptions[0];
                if (selectedOption) {
                    emailInput.value = selectedOption.getAttribute('data-email') || '';
                } else {
                    emailInput.value = '';
                }
            });
        }
    }

    // Vista previa del email
    previewEmail() {
        const residenteSelect = document.getElementById('residente-select');
        const asunto = document.getElementById('asunto').value;
        const mensaje = document.getElementById('mensaje').value;
        
        if (!residenteSelect.value || !asunto || !mensaje) {
            Utils.showToast('Complete todos los campos para ver la vista previa', 'warning');
            return;
        }

        const residente = this.residentes.find(r => r.id === residenteSelect.value);
        if (!residente) return;

        const previewContent = `
            <div style="border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9;">
                <div style="margin-bottom: 15px;">
                    <strong>Para:</strong> ${residente.email}<br>
                    <strong>Asunto:</strong> ${asunto}
                </div>
                <div style="border-top: 1px solid #ddd; padding-top: 15px;">
                    <p>Estimado/a ${residente.nombreCompleto},</p>
                    <div style="white-space: pre-wrap;">${mensaje}</div>
                    <br>
                    <p>Atentamente,<br>
                    Administración Condominio Los Molles<br>
                    ${CONFIG.ADMIN_EMAIL}</p>
                </div>
            </div>
        `;

        document.getElementById('preview-content').innerHTML = previewContent;
        document.getElementById('email-preview').style.display = 'block';
    }

    // Enviar comunicación
    async sendComunicacion() {
        try {
            const form = document.getElementById('comunicacion-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const residenteId = document.getElementById('residente-select').value;
            const asunto = document.getElementById('asunto').value.trim();
            const mensaje = document.getElementById('mensaje').value.trim();

            const residente = this.residentes.find(r => r.id === residenteId);
            if (!residente) {
                Utils.showToast('Residente no encontrado', 'error');
                return;
            }

            // Construir el email completo
            const emailBody = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #2563eb, #10b981); color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Condominio Los Molles</h1>
                    </div>
                    <div style="padding: 30px; background: white;">
                        <p>Estimado/a <strong>${residente.nombreCompleto}</strong>,</p>
                        <div style="margin: 20px 0; line-height: 1.6; white-space: pre-wrap;">${mensaje}</div>
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p>Atentamente,<br>
                            <strong>Administración Condominio Los Molles</strong><br>
                            Email: ${CONFIG.ADMIN_EMAIL}</p>
                        </div>
                    </div>
                    <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
                        Este es un mensaje automático del sistema de administración del condominio.
                    </div>
                </div>
            `;

            // Enviar email
            await window.googleAPI.sendEmail(residente.email, asunto, emailBody);

            // Registrar en Google Sheets
            const fechaEnvio = Utils.formatDate(new Date());
            const rowData = [
                Utils.generateId(),
                residenteId,
                fechaEnvio,
                asunto,
                mensaje
            ];

            await window.googleAPI.appendToSheet(CONFIG.SHEETS.COMUNICACIONES, rowData);

            Utils.showToast('Comunicación enviada correctamente', 'success');
            window.App.closeModal();

            // Recargar datos y actualizar vista
            await this.loadData();
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();

        } catch (error) {
            console.error('Error enviando comunicación:', error);
            Utils.showToast('Error enviando la comunicación', 'error');
        }
    }

    // Ver comunicación completa
    viewComunicacion(comunicacionId) {
        const comunicacion = this.comunicaciones.find(c => c.id === comunicacionId);
        if (!comunicacion) return;

        const residente = this.residentes.find(r => r.id === comunicacion.idResidente);
        const destinatario = residente ? `${residente.nombreCompleto} (${residente.email})` : 'Residente no encontrado';

        const contentHTML = `
            <div class="comunicacion-detail">
                <div class="detail-row">
                    <strong>Fecha de envío:</strong> ${Utils.formatDate(Utils.parseDate(comunicacion.fechaEnvio))}
                </div>
                <div class="detail-row">
                    <strong>Destinatario:</strong> ${Utils.escapeHtml(destinatario)}
                </div>
                <div class="detail-row">
                    <strong>Asunto:</strong> ${Utils.escapeHtml(comunicacion.asunto)}
                </div>
                <div class="detail-row">
                    <strong>Mensaje:</strong>
                    <div style="margin-top: 10px; padding: 15px; background: #f9f9f9; border-radius: 5px; white-space: pre-wrap;">
                        ${Utils.escapeHtml(comunicacion.mensaje)}
                    </div>
                </div>
            </div>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cerrar</button>
        `;

        window.App.openModal('Detalle de Comunicación', contentHTML, footerHTML);
    }
}

// Exportar módulo
window.ComunicacionesModule = ComunicacionesModule;

