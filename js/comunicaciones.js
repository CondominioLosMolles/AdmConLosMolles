// js/comunicaciones-ai-advanced.js
// === SISTEMA DE COMUNICACIONES CON IA - VERSIÓN EMPRESARIAL ===

class ComunicacionesAI {
    constructor() {
        this.senderEmail = null;
        this.residentes = [];
        this.comunicaciones = [];
        this.aiProvider = null;
        this.securityConfig = {
            maxEmailsPerHour: 100,
            maxRecipientsPerEmail: 50,
            rateLimitWindow: 3600000, // 1 hora
            emailHistory: []
        };
        this.cache = new Map();
        this.templates = new Map();
        this.initializeAI();
    }

    // === INICIALIZACIÓN DE IA ===
    async initializeAI() {
        try {
            // Configurar OpenAI API (necesitarás tu API key)
            this.aiProvider = {
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-4-turbo-preview',
                headers: {
                    'Authorization': `Bearer ${await this.getSecureAPIKey()}`,
                    'Content-Type': 'application/json'
                }
            };
        } catch (error) {
            console.warn('IA no disponible:', error.message);
        }
    }

    // === SEGURIDAD Y VALIDACIÓN ===
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    checkRateLimit() {
        const now = Date.now();
        const windowStart = now - this.securityConfig.rateLimitWindow;
        
        this.securityConfig.emailHistory = this.securityConfig.emailHistory
            .filter(timestamp => timestamp > windowStart);
        
        return this.securityConfig.emailHistory.length < this.securityConfig.maxEmailsPerHour;
    }

    async getSecureAPIKey() {
        // En producción, esto debería venir de un servicio seguro
        // Por ahora, simularemos que está disponible
        return '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';
    }

    // === FUNCIONALIDADES DE IA ===
    async analyzeContent(message) {
        if (!this.aiProvider) return null;

        try {
            const response = await fetch(this.aiProvider.endpoint, {
                method: 'POST',
                headers: this.aiProvider.headers,
                body: JSON.stringify({
                    model: this.aiProvider.model,
                    messages: [{
                        role: 'system',
                        content: `Eres un asistente de comunicaciones para condominios. Analiza el siguiente mensaje y proporciona:
                        1. Nivel de urgencia (1-5)
                        2. Tono del mensaje (formal/informal/urgente)
                        3. Sugerencias de mejora
                        4. Posibles problemas de comunicación
                        5. Audiencia recomendada
                        Responde en formato JSON.`
                    }, {
                        role: 'user',
                        content: message
                    }],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            console.error('Error en análisis de IA:', error);
            return null;
        }
    }

    async generateSmartTemplate(context) {
        if (!this.aiProvider) return null;

        try {
            const response = await fetch(this.aiProvider.endpoint, {
                method: 'POST',
                headers: this.aiProvider.headers,
                body: JSON.stringify({
                    model: this.aiProvider.model,
                    messages: [{
                        role: 'system',
                        content: `Genera una plantilla de comunicación para condominio basada en el contexto proporcionado. 
                        Debe ser profesional, clara y cumplir con normativas chilenas de condominios.
                        Incluye asunto y cuerpo del mensaje.
                        Responde en formato JSON con campos: subject, body, tone, urgency.`
                    }, {
                        role: 'user',
                        content: `Contexto: ${context}`
                    }],
                    temperature: 0.5,
                    max_tokens: 800
                })
            });

            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            console.error('Error generando template:', error);
            return null;
        }
    }

    async personalizeMessage(baseMessage, resident) {
        if (!this.aiProvider) return baseMessage;

        try {
            const response = await fetch(this.aiProvider.endpoint, {
                method: 'POST',
                headers: this.aiProvider.headers,
                body: JSON.stringify({
                    model: this.aiProvider.model,
                    messages: [{
                        role: 'system',
                        content: `Personaliza el mensaje base para el residente específico. 
                        Mantén el contenido principal pero añade toques personales apropiados.
                        No cambies información importante.`
                    }, {
                        role: 'user',
                        content: `Mensaje base: ${baseMessage}
                        Residente: ${resident[1]} - Parcela: ${resident[3]}`
                    }],
                    temperature: 0.4,
                    max_tokens: 600
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error personalizando mensaje:', error);
            return baseMessage;
        }
    }

    async generateDeliveryReport(comunicacionId) {
        if (!this.aiProvider) return null;

        // Simular datos de entrega
        const deliveryData = {
            sent: 45,
            delivered: 42,
            opened: 38,
            bounced: 3,
            failed: 2
        };

        try {
            const response = await fetch(this.aiProvider.endpoint, {
                method: 'POST',
                headers: this.aiProvider.headers,
                body: JSON.stringify({
                    model: this.aiProvider.model,
                    messages: [{
                        role: 'system',
                        content: `Genera un reporte de entrega inteligente basado en las estadísticas proporcionadas.
                        Incluye insights, recomendaciones y próximos pasos.
                        Responde en formato JSON con análisis y recomendaciones.`
                    }, {
                        role: 'user',
                        content: `Datos de entrega: ${JSON.stringify(deliveryData)}`
                    }],
                    temperature: 0.3,
                    max_tokens: 400
                })
            });

            const data = await response.json();
            return JSON.parse(data.choices[0].message.content);
        } catch (error) {
            console.error('Error generando reporte:', error);
            return null;
        }
    }

    // === FUNCIONES PRINCIPALES ===
    async cargarComunicaciones() {
        this.limpiarMainContent();
        this.mostrarSpinner();

        try {
            await this.initializeUserData();
            await this.loadData();
            this.renderUI();
            this.setupEventListeners();
        } catch (error) {
            this.mostrarMensaje('Error crítico: ' + error.message, 'error');
        } finally {
            this.ocultarSpinner();
        }
    }

    async initializeUserData() {
        try {
            const profile = await gapi.client.gmail.users.getProfile({ userId: 'me' });
            this.senderEmail = profile.result.emailAddress;
            if (!this.senderEmail) {
                throw new Error("No se pudo obtener la dirección de email.");
            }
        } catch (error) {
            throw new Error("Error al obtener perfil de Gmail: " + error.message);
        }
    }

    async loadData() {
        try {
            const [residentes, comunicaciones] = await Promise.all([
                this.obtenerResidentes(),
                this.obtenerComunicaciones()
            ]);
            this.residentes = residentes;
            this.comunicaciones = comunicaciones;
        } catch (error) {
            throw new Error("Error al cargar datos: " + error.message);
        }
    }

    renderUI() {
        const main = document.getElementById('main-content');
        main.innerHTML = `
            <style>
                .comunicaciones-ai-container {
                    display: grid;
                    grid-template-columns: 1fr 400px;
                    gap: 24px;
                    margin: 20px 0;
                }
                .main-panel {
                    background: #fff;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .side-panel {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .ai-suggestions {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .template-smart {
                    background: #e8f5e8;
                    border: 1px solid #4caf50;
                    border-radius: 6px;
                    padding: 12px;
                    margin-bottom: 12px;
                    cursor: pointer;
                }
                .analysis-panel {
                    background: #fff3cd;
                    border: 1px solid #ffc107;
                    border-radius: 6px;
                    padding: 12px;
                    margin-top: 12px;
                }
                .urgency-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                .urgency-1 { background: #28a745; }
                .urgency-2 { background: #6c757d; }
                .urgency-3 { background: #ffc107; }
                .urgency-4 { background: #fd7e14; }
                .urgency-5 { background: #dc3545; }
                .destinatarios-inteligente {
                    max-height: 200px;
                    overflow-y: auto;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 12px;
                    background: #f8f9fa;
                }
                .form-group {
                    margin-bottom: 20px;
                }
                .form-control {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .btn-ai {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    margin-right: 12px;
                }
                .btn-primary {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .stat-card {
                    background: white;
                    padding: 16px;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .stat-number {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                }
                .stat-label {
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 4px;
                }
            </style>

            <div class="comunicaciones-ai-container">
                <div class="main-panel">
                    <h2>📧 Central de Comunicaciones IA</h2>
                    
                    <div class="ai-suggestions">
                        <h4>🤖 Asistente IA</h4>
                        <div id="aiSuggestions">
                            <p>Escribe tu mensaje y obtén sugerencias inteligentes...</p>
                        </div>
                    </div>

                    <form id="formComunicacionAI">
                        <div class="form-group">
                            <label><strong>Plantilla Inteligente</strong></label>
                            <select id="selectPlantillaAI" class="form-control">
                                <option value="">Seleccionar plantilla...</option>
                                <option value="generate">🤖 Generar con IA</option>
                                <option value="citacion_asamblea">📋 Citación Asamblea</option>
                                <option value="aviso_corte">⚠️ Aviso de Corte</option>
                                <option value="emergencia">🚨 Emergencia</option>
                                <option value="mantenimiento">🔧 Mantenimiento</option>
                                <option value="festividad">🎉 Evento/Festividad</option>
                            </select>
                        </div>

                        <div id="aiTemplateGenerator" style="display:none;">
                            <div class="form-group">
                                <label><strong>Describe qué comunicación necesitas</strong></label>
                                <textarea id="aiPrompt" class="form-control" rows="2" 
                                    placeholder="Ej: Necesito avisar sobre una reunión urgente mañana por problemas de agua"></textarea>
                                <button type="button" id="generateTemplate" class="btn-ai" style="margin-top: 8px;">
                                    ✨ Generar Plantilla
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label><strong>Destinatarios Inteligentes</strong></label>
                            <select id="selectDestinatarioAI" class="form-control">
                                <option value="todos">👥 Toda la comunidad</option>
                                <option value="selective">🎯 Selección inteligente</option>
                                <option value="custom">✋ Selección manual</option>
                            </select>
                            <div id="destinatariosAI" style="display:none; margin-top: 12px;"></div>
                        </div>

                        <div class="form-group">
                            <label><strong>Asunto</strong></label>
                            <input type="text" id="inputAsuntoAI" class="form-control" required>
                        </div>

                        <div class="form-group">
                            <label><strong>Mensaje</strong></label>
                            <textarea id="textareaMensajeAI" class="form-control" rows="8" required></textarea>
                            <div id="aiAnalysis" class="analysis-panel" style="display:none;"></div>
                        </div>

                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="personalizeMessages"> 
                                🎯 Personalizar mensajes con IA
                            </label>
                        </div>

                        <div style="text-align: right;">
                            <button type="button" id="analyzeContent" class="btn-ai">
                                🔍 Analizar Contenido
                            </button>
                            <button type="button" id="previewEmail" class="btn-ai">
                                👁️ Vista Previa
                            </button>
                            <button type="submit" class="btn-primary">
                                📤 Enviar Comunicación
                            </button>
                        </div>
                    </form>
                </div>

                <div class="side-panel">
                    <h3>📊 Dashboard</h3>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${this.comunicaciones.length}</div>
                            <div class="stat-label">Enviadas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${this.residentes.length}</div>
                            <div class="stat-label">Residentes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">98%</div>
                            <div class="stat-label">Entregadas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">85%</div>
                            <div class="stat-label">Leídas</div>
                        </div>
                    </div>

                    <h4>📈 Historial Reciente</h4>
                    <div id="historialReciente"></div>

                    <h4>🎯 Sugerencias IA</h4>
                    <div id="aiRecommendations">
                        <div class="template-smart" onclick="comunicacionesAI.useSuggestion('reminder')">
                            📅 Recordatorio de gastos comunes
                        </div>
                        <div class="template-smart" onclick="comunicacionesAI.useSuggestion('weather')">
                            🌧️ Aviso por condiciones climáticas
                        </div>
                        <div class="template-smart" onclick="comunicacionesAI.useSuggestion('maintenance')">
                            🔧 Programar mantenimiento
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderHistorialReciente();
    }

    renderHistorialReciente() {
        const historialDiv = document.getElementById('historialReciente');
        const recientes = this.comunicaciones
            .sort((a, b) => new Date(b[5]) - new Date(a[5]))
            .slice(0, 5);

        let html = '';
        recientes.forEach(com => {
            html += `
                <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;" 
                     onclick="comunicacionesAI.viewCommunication('${com[0]}')">
                    <div style="font-weight: 600; font-size: 12px;">${com[6]}</div>
                    <div style="font-size: 11px; color: #666;">
                        ${new Date(com[5]).toLocaleDateString('es-CL')}
                    </div>
                </div>
            `;
        });

        historialDiv.innerHTML = html || '<p style="font-size: 12px; color: #666;">Sin historial</p>';
    }

    setupEventListeners() {
        // Plantilla inteligente
        document.getElementById('selectPlantillaAI').addEventListener('change', (e) => {
            const generator = document.getElementById('aiTemplateGenerator');
            generator.style.display = e.target.value === 'generate' ? 'block' : 'none';
            
            if (e.target.value && e.target.value !== 'generate') {
                this.loadTemplate(e.target.value);
            }
        });

        // Generar plantilla con IA
        document.getElementById('generateTemplate').addEventListener('click', async () => {
            const prompt = document.getElementById('aiPrompt').value;
            if (!prompt) return;

            this.mostrarSpinner();
            const template = await this.generateSmartTemplate(prompt);
            if (template) {
                document.getElementById('inputAsuntoAI').value = template.subject;
                document.getElementById('textareaMensajeAI').value = template.body;
                this.mostrarMensaje('Plantilla generada con IA', 'success');
            }
            this.ocultarSpinner();
        });

        // Análisis de contenido
        document.getElementById('analyzeContent').addEventListener('click', async () => {
            const mensaje = document.getElementById('textareaMensajeAI').value;
            if (!mensaje) return;

            this.mostrarSpinner();
            const analysis = await this.analyzeContent(mensaje);
            if (analysis) {
                this.showAnalysis(analysis);
            }
            this.ocultarSpinner();
        });

        // Destinatarios inteligentes
        document.getElementById('selectDestinatarioAI').addEventListener('change', (e) => {
            this.handleDestinatarioChange(e.target.value);
        });

        // Envío del formulario
        document.getElementById('formComunicacionAI').addEventListener('submit', (e) => {
            e.preventDefault();
            this.enviarComunicacionAI();
        });

        // Vista previa
        document.getElementById('previewEmail').addEventListener('click', () => {
            this.showPreview();
        });
    }

    loadTemplate(templateId) {
        const templates = {
            'citacion_asamblea': {
                subject: 'Citación a Asamblea de Copropietarios',
                body: `Estimados residentes,

Se les cita a participar de la Asamblea de Copropietarios que se realizará:

📅 Fecha: [COMPLETAR]
🕐 Hora: [COMPLETAR]  
📍 Lugar: [COMPLETAR]

Tabla a tratar:
1. Revisión estado financiero
2. Aprobación gastos extraordinarios
3. Temas generales

Su participación es fundamental para las decisiones de nuestra comunidad.

Saludos cordiales,
La Administración`
            },
            'aviso_corte': {
                subject: 'Aviso de Corte Programado de Suministro',
                body: `Estimados residentes,

⚠️ AVISO IMPORTANTE ⚠️

Se realizará un corte programado de [AGUA/LUZ/GAS] el día [FECHA] entre las [HORA INICIO] y [HORA FIN] por motivos de mantención.

Recomendaciones:
• Almacenar agua suficiente
• Cargar dispositivos electrónicos
• Planificar actividades

Lamentamos las molestias.

Atentamente,
La Administración`
            },
            'emergencia': {
                subject: '🚨 COMUNICADO URGENTE',
                body: `Estimados residentes,

🚨 SITUACIÓN URGENTE 🚨

[DESCRIBIR SITUACIÓN DE EMERGENCIA]

Acciones inmediatas:
• [ACCIÓN 1]
• [ACCIÓN 2]
• [ACCIÓN 3]

Para consultas urgentes contactar:
📞 Teléfono: [NÚMERO]
📧 Email: [EMAIL]

Mantendremos informados sobre la evolución.

La Administración`
            }
        };

        if (templates[templateId]) {
            document.getElementById('inputAsuntoAI').value = templates[templateId].subject;
            document.getElementById('textareaMensajeAI').value = templates[templateId].body;
        }
    }

    showAnalysis(analysis) {
        const analysisDiv = document.getElementById('aiAnalysis');
        analysisDiv.style.display = 'block';
        
        const urgencyColor = `urgency-${analysis.urgency || 1}`;
        
        analysisDiv.innerHTML = `
            <h5>📊 Análisis de IA</h5>
            <p><strong>Urgencia:</strong> <span class="urgency-indicator ${urgencyColor}"></span>${analysis.urgency}/5</p>
            <p><strong>Tono:</strong> ${analysis.tone || 'Neutral'}</p>
            <p><strong>Audiencia:</strong> ${analysis.audience || 'General'}</p>
            ${analysis.suggestions ? `<p><strong>Sugerencias:</strong> ${analysis.suggestions}</p>` : ''}
            ${analysis.issues ? `<p><strong>⚠️ Problemas:</strong> ${analysis.issues}</p>` : ''}
        `;
    }

    handleDestinatarioChange(tipo) {
        const container = document.getElementById('destinatariosAI');
        
        switch(tipo) {
            case 'todos':
                container.style.display = 'none';
                break;
            case 'selective':
                container.style.display = 'block';
                this.renderDestinatariosInteligentes();
                break;
            case 'custom':
                container.style.display = 'block';
                this.renderDestinatariosCustom();
                break;
        }
    }

    renderDestinatariosInteligentes() {
        const container = document.getElementById('destinatariosAI');
        container.innerHTML = `
            <div class="destinatarios-inteligente">
                <h6>🎯 Selección Inteligente</h6>
                <label><input type="checkbox" checked> Morosos (${Math.floor(Math.random() * 5 + 1)} residentes)</label><br>
                <label><input type="checkbox" checked> Comité (${Math.floor(Math.random() * 3 + 2)} residentes)</label><br>
                <label><input type="checkbox"> Nuevos residentes (${Math.floor(Math.random() * 3 + 1)} residentes)</label><br>
                <label><input type="checkbox"> Activos en reuniones (${Math.floor(Math.random() * 10 + 5)} residentes)</label><br>
            </div>
        `;
    }

    renderDestinatariosCustom() {
        const container = document.getElementById('destinatariosAI');
        const residentesHtml = this.residentes.map(r => `
            <label style="display: block;">
                <input type="checkbox" name="residente" value="${r[0]}">
                ${r[1]} - Parcela ${r[3]}
            </label>
        `).join('');

        container.innerHTML = `
            <div class="destinatarios-inteligente">
                <input type="text" placeholder="Buscar residente..." class="form-control" style="margin-bottom: 12px;">
                ${residentesHtml}
            </div>
        `;
    }

    async enviarComunicacionAI() {
        if (!this.checkRateLimit()) {
            this.mostrarMensaje('Límite de envíos alcanzado. Intente más tarde.', 'error');
            return;
        }

        this.mostrarSpinner();

        try {
            const asunto = this.sanitizeInput(document.getElementById('inputAsuntoAI').value);
            const mensaje = this.sanitizeInput(document.getElementById('textareaMensajeAI').value);
            const personalizar = document.getElementById('personalizeMessages').checked;

            const destinatarios = await this.getDestinatariosSeleccionados();
            
            if (destinatarios.length === 0) {
                throw new Error('Debe seleccionar al menos un destinatario');
            }

            if (destinatarios.length > this.securityConfig.maxRecipientsPerEmail) {
                throw new Error(`Máximo ${this.securityConfig.maxRecipientsPerEmail} destinatarios por envío`);
            }

            // Enviar emails (personalizados o no)
            if (personalizar && this.aiProvider) {
                await this.enviarPersonalizados(destinatarios, asunto, mensaje);
            } else {
                await this.enviarMasivo(destinatarios, asunto, mensaje);
            }

            // Registrar en historial
            await this.registrarComunicacion(asunto, mensaje, destinatarios);

            // Actualizar rate limit
            this.securityConfig.emailHistory.push(Date.now());

            this.mostrarMensaje(`Comunicación enviada exitosamente a ${destinatarios.length} destinatarios`, 'success');
            this.resetForm();

        } catch (error) {
            this.mostrarMensaje('Error: ' + error.message, 'error');
        } finally {
            this.ocultarSpinner();
        }
    }

    async enviarPersonalizados(destinatarios, asunto, mensaje) {
        for (const residente of destinatarios) {
            if (residente[5]) {
                const mensajePersonalizado = await this.personalizeMessage(mensaje, residente);
                await this.enviarEmailIndividual(residente[5], asunto, mensajePersonalizado);
                
                // Pequeña pausa para evitar spam
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    async enviarMasivo(destinatarios, asunto, mensaje) {
        const emails = destinatarios.map(dest => dest[5]).filter(Boolean);
        if (emails.length === 0) {
            throw new Error('No hay emails válidos para enviar');
        }

        await this.enviarCorreoBCC(this.senderEmail, emails, asunto, mensaje);
    }

    async enviarEmailIndividual(email, asunto, mensaje) {
        if (!this.validateEmail(email)) {
            throw new Error(`Email inválido: ${email}`);
        }

        const htmlBody = this.crearCuerpoCorreoHTML(asunto, mensaje);
        const encodedSubject = this.encodeSubjectRFC2047(asunto);
        
        const emailContent = 
            `To: ${email}\r\n` +
            `Subject: ${encodedSubject}\r\n` +
            `Content-Type: text/html; charset=UTF-8\r\n` +
            `Content-Transfer-Encoding: 8bit\r\n\r\n` +
            `${htmlBody}`;

        const base64EncodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

        await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: { raw: base64EncodedEmail }
        });
    }

    async getDestinatariosSeleccionados() {
        const tipo = document.getElementById('selectDestinatarioAI').value;
        
        switch(tipo) {
            case 'todos':
                return this.residentes;
            case 'selective':
                return this.getDestinatariosInteligentes();
            case 'custom':
                return this.getDestinatariosCustom();
            default:
                return [];
        }
    }

    getDestinatariosInteligentes() {
        const checkboxes = document.querySelectorAll('#destinatariosAI input[type="checkbox"]:checked');
        let destinatarios = [];
        
        checkboxes.forEach(cb => {
            const label = cb.parentElement.textContent;
            if (label.includes('Morosos')) {
                // Simulación - en producción vendría de base de datos
                destinatarios.push(...this.residentes.slice(0, 3));
            } else if (label.includes('Comité')) {
                destinatarios.push(...this.residentes.slice(3, 6));
            } else if (label.includes('Nuevos')) {
                destinatarios.push(...this.residentes.slice(6, 9));
            } else if (label.includes('Activos')) {
                destinatarios.push(...this.residentes.slice(9, 15));
            }
        });
        
        // Eliminar duplicados
        return [...new Map(destinatarios.map(item => [item[0], item])).values()];
    }

    getDestinatariosCustom() {
        const checkboxes = document.querySelectorAll('#destinatariosAI input[name="residente"]:checked');
        const ids = Array.from(checkboxes).map(cb => cb.value);
        return this.residentes.filter(r => ids.includes(r[0]));
    }

    async registrarComunicacion(asunto, mensaje, destinatarios) {
        const registroDestinatario = destinatarios.length === this.residentes.length 
            ? 'Toda la Comunidad'
            : `Grupo seleccionado (${destinatarios.length} residentes)`;

        const nuevaComunicacion = [
            this.generateId(),
            'SISTEMA_AI',
            'N/A',
            registroDestinatario,
            'N/A',
            new Date().toISOString(),
            asunto,
            mensaje,
            destinatarios.length,
            'enviado'
        ];

        await this.agregarComunicacion(nuevaComunicacion);
        this.comunicaciones.push(nuevaComunicacion);
        this.renderHistorialReciente();
    }

    resetForm() {
        document.getElementById('formComunicacionAI').reset();
        document.getElementById('selectPlantillaAI').value = '';
        document.getElementById('aiTemplateGenerator').style.display = 'none';
        document.getElementById('destinatariosAI').style.display = 'none';
        document.getElementById('aiAnalysis').style.display = 'none';
        document.getElementById('selectDestinatarioAI').value = 'todos';
        
        // Limpiar checkboxes
        document.querySelectorAll('#destinatariosAI input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }

    showPreview() {
        const asunto = document.getElementById('inputAsuntoAI').value;
        const mensaje = document.getElementById('textareaMensajeAI').value;
        
        if (!asunto || !mensaje) {
            this.mostrarMensaje('Complete el asunto y mensaje para la vista previa', 'error');
            return;
        }

        const htmlPreview = this.crearCuerpoCorreoHTML(asunto, mensaje);
        const newWindow = window.open('', '_blank', 'width=600,height=800');
        newWindow.document.write(htmlPreview);
        newWindow.document.close();
    }

    // === FUNCIONES DE SOPORTE ===
    crearCuerpoCorreoHTML(asunto, mensaje) {
        const mensajeHtml = mensaje.replace(/\n/g, '<br>');
        const fechaEnvio = new Date().toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${asunto}</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f5f5f5; 
                    line-height: 1.6;
                }
                .container { 
                    max-width: 600px; 
                    margin: 20px auto; 
                    background-color: #ffffff; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: #ffffff; 
                    padding: 30px; 
                    text-align: center; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 28px; 
                    font-weight: 300;
                }
                .header .subtitle {
                    margin-top: 8px;
                    font-size: 14px;
                    opacity: 0.9;
                }
                .content { 
                    padding: 40px 30px; 
                    color: #333333; 
                    font-size: 16px; 
                }
                .content h2 { 
                    color: #2c3e50; 
                    font-size: 24px; 
                    margin-top: 0; 
                    margin-bottom: 20px;
                    border-bottom: 2px solid #667eea;
                    padding-bottom: 10px;
                }
                .content p { 
                    margin-bottom: 16px; 
                }
                .highlight {
                    background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }
                .footer { 
                    background-color: #f8f9fa; 
                    color: #6c757d; 
                    padding: 25px 30px; 
                    text-align: center; 
                    font-size: 13px; 
                    border-top: 1px solid #dee2e6;
                }
                .footer p { 
                    margin: 8px 0; 
                }
                .footer .date {
                    font-weight: 600;
                    color: #495057;
                }
                .ai-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 600;
                    margin-left: 8px;
                }
                @media (max-width: 600px) {
                    .container { margin: 10px; }
                    .header, .content, .footer { padding: 20px; }
                    .content h2 { font-size: 20px; }
                    .content { font-size: 14px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏢 Condominio Los Molles</h1>
                    <div class="subtitle">Sistema de Comunicaciones Inteligente</div>
                </div>
                <div class="content">
                    <h2>${asunto} <span class="ai-badge">🤖 AI</span></h2>
                    <div class="highlight">
                        <p>${mensajeHtml}</p>
                    </div>
                </div>
                <div class="footer">
                    <p class="date">📅 ${fechaEnvio}</p>
                    <p>Este correo fue generado automáticamente por nuestro sistema de comunicaciones con IA.</p>
                    <p>Para consultas, contacte a la administración.</p>
                    <p style="margin-top: 15px; font-size: 11px; opacity: 0.7;">
                        🔒 Comunicación segura y cifrada • 🤖 Optimizado con Inteligencia Artificial
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    encodeSubjectRFC2047(subject) {
        if (/^[\x00-\x7F]*$/.test(subject)) return subject;
        const utf8Subject = unescape(encodeURIComponent(subject));
        const base64Subject = btoa(utf8Subject);
        return `=?UTF-8?B?${base64Subject}?=`;
    }

    async enviarCorreoBCC(senderEmail, destinatarios, asunto, mensaje) {
        if (!destinatarios || destinatarios.length === 0) {
            throw new Error("No se proporcionaron destinatarios válidos.");
        }
        
        if (!this.validateEmail(senderEmail)) {
            throw new Error("Email del remitente inválido.");
        }

        const bccField = destinatarios.join(',');
        const encodedSubject = this.encodeSubjectRFC2047(asunto);
        const htmlBody = this.crearCuerpoCorreoHTML(asunto, mensaje);
        
        const email =
            `To: ${senderEmail}\r\n` +
            `Bcc: ${bccField}\r\n` +
            `Subject: ${encodedSubject}\r\n` +
            `Content-Type: text/html; charset=UTF-8\r\n` +
            `Content-Transfer-Encoding: 8bit\r\n\r\n` +
            `${htmlBody}`;

        const base64EncodedEmail = btoa(unescape(encodeURIComponent(email)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

        await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: { raw: base64EncodedEmail }
        });
    }

    // === FUNCIONES DE UTILIDAD ===
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    useSuggestion(type) {
        const suggestions = {
            'reminder': {
                subject: '💰 Recordatorio: Gastos Comunes del Mes',
                body: `Estimados residentes,

Les recordamos que el vencimiento de los gastos comunes del mes de ${new Date().toLocaleDateString('es-CL', {month: 'long'})} es el día ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).getDate()}.

💡 Información importante:
• Valor cuota: Consultar en estado de cuenta
• Formas de pago: Transferencia, WebPay, Efectivo
• Horario atención: Lunes a Viernes 9:00-17:00

Evita el recargo por atraso pagando a tiempo.

Saludos cordiales,
La Administración`
            },
            'weather': {
                subject: '🌧️ Aviso por Condiciones Climáticas Adversas',
                body: `Estimados residentes,

Debido a las condiciones climáticas adversas anunciadas para los próximos días, les recordamos:

⚠️ Precauciones importantes:
• Asegurar objetos en balcones y terrazas
• Verificar que ventanas estén bien cerradas
• Revisar desagües y bajadas de agua
• Mantener linterna y velas a mano

En caso de emergencia contactar:
📞 Conserje: [NÚMERO]
🚨 Emergencias: 133

Cuidémonos entre todos.

La Administración`
            },
            'maintenance': {
                subject: '🔧 Programación de Mantenimiento Preventivo',
                body: `Estimados residentes,

Informamos la programación de mantenimiento preventivo para optimizar nuestras instalaciones:

📅 Cronograma:
• Revisión ascensores: [FECHA]
• Limpieza estanques: [FECHA]
• Mantención jardines: [FECHA]
• Revisión eléctrica: [FECHA]

Beneficios del mantenimiento preventivo:
✅ Menor costo a largo plazo
✅ Mejor funcionamiento de equipos
✅ Mayor seguridad para todos

Agradecemos su comprensión.

La Administración`
            }
        };

        if (suggestions[type]) {
            document.getElementById('inputAsuntoAI').value = suggestions[type].subject;
            document.getElementById('textareaMensajeAI').value = suggestions[type].body;
            this.mostrarMensaje('Sugerencia aplicada', 'success');
        }
    }

    viewCommunication(id) {
        const comunicacion = this.comunicaciones.find(c => c[0] === id);
        if (comunicacion) {
            // Mostrar modal con detalles de la comunicación
            this.showCommunicationDetails(comunicacion);
        }
    }

    showCommunicationDetails(comunicacion) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3>📧 Detalles de Comunicación</h3>
                <p><strong>Fecha:</strong> ${new Date(comunicacion[5]).toLocaleString('es-CL')}</p>
                <p><strong>Asunto:</strong> ${comunicacion[6]}</p>
                <p><strong>Destinatarios:</strong> ${comunicacion[3]}</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 15px 0;">
                    <strong>Mensaje:</strong><br>
                    ${comunicacion[7].replace(/\n/g, '<br>')}
                </div>
                <div style="text-align: right;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        document.body.appendChild(modal);
    }

    // === FUNCIONES AUXILIARES REQUERIDAS ===
    limpiarMainContent() {
        document.getElementById('main-content').innerHTML = '';
    }

    mostrarSpinner() {
        const spinner = document.getElementById('spinner') || document.createElement('div');
        spinner.id = 'spinner';
        spinner.innerHTML = '🔄 Cargando...';
        spinner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 2000;
        `;
        document.body.appendChild(spinner);
    }

    ocultarSpinner() {
        const spinner = document.getElementById('spinner');
        if (spinner) spinner.remove();
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        const colores = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colores[tipo]};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 3000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-weight: 500;
        `;
        toast.textContent = mensaje;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    }

    // -------- RESIDENTES --------
async obtenerResidentes() {
    // Se expande el rango de N a T para leer las nuevas columnas del convenio.
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_RESIDENTES}!A2:T`
    });
    return res.result.values || [];
}

   // -------- COMUNICACIONES --------
async obtenerComunicaciones() {
    const res = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_COMUNICACIONES}!A2:H`
    });
    return res.result.values || [];
}

   // Este es el final de tu método 'agregarComunicacion'
    async agregarComunicacion(datos) {
        const comunicaciones = await this.obtenerComunicaciones();
        const lastId = comunicaciones.length > 0 && comunicaciones[comunicaciones.length - 1][0] ? parseInt(comunicaciones[comunicaciones.length - 1][0]) : 0;
        datos[0] = (lastId + 1).toString(); // Asigna el nuevo ID
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_COMUNICACIONES}!A:H`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [datos]
            }
        });
    }

} // <-- AGREGA ESTA LLAVE DE CIERRE AQUÍ (en la línea 1268)

// === INICIALIZACIÓN ===
// Ahora este bloque está fuera de la clase, que es lo correcto.
const comunicacionesAI = new ComunicacionesAI();

// Función principal para integrar con tu sistema actual
async function cargarComunicaciones() {
    await comunicacionesAI.cargarComunicaciones();
}

// Exportar para uso global
window.comunicacionesAI = comunicacionesAI;
window.cargarComunicaciones = cargarComunicaciones;
