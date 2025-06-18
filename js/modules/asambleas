// ===== MÓDULO ASAMBLEAS =====

const AsambleasModule = {
    data: {
        asambleas: [],
        residentes: [],
        filteredAsambleas: []
    },

    async render(container) {
        try {
            helpers.showLoading(container, 'Cargando asambleas...');
            await this.loadData();
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.applyFilters();
        } catch (error) {
            console.error('Error cargando asambleas:', error);
            container.innerHTML = `<div class="text-center"><h2>Error cargando asambleas</h2><p>${error.message}</p></div>`;
        }
    },

    async loadData() {
        try {
            const [asambleas, residentes] = await Promise.all([
                sheetsAPI.getAsambleas(),
                sheetsAPI.getResidentes()
            ]);
            this.data.asambleas = asambleas;
            this.data.residentes = residentes;
            this.data.filteredAsambleas = [...asambleas];
        } catch (error) {
            console.error('Error cargando datos de asambleas:', error);
            throw error;
        }
    },

    getHTML() {
        return `
            <div class="asambleas-module">
                <div class="module-header">
                    <h1>Asambleas</h1>
                    <p>Gestión de asambleas de copropietarios</p>
                </div>

                <div class="filters-container">
                    <div class="filter-group">
                        <button id="add-asamblea-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Programar Asamblea
                        </button>
                    </div>
                </div>

                <div class="table-container">
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Hora</th>
                                    <th>Lugar</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Asistentes</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="asambleas-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    setupEvents() {
        document.getElementById('add-asamblea-btn')?.addEventListener('click', () => this.showAsambleaModal());
    },

    applyFilters() {
        this.data.filteredAsambleas = [...this.data.asambleas];
        this.renderTable();
    },

    renderTable() {
        const tbody = document.getElementById('asambleas-tbody');
        tbody.innerHTML = this.data.filteredAsambleas.map((asamblea, index) => `
            <tr>
                <td>${helpers.formatDate(asamblea.Fecha)}</td>
                <td>${asamblea.Hora}</td>
                <td>${asamblea.Lugar}</td>
                <td>${asamblea.Tipo}</td>
                <td><span class="status-badge status-${asamblea.Estado.toLowerCase().replace(/\s+/g, '-')}">${asamblea.Estado}</span></td>
                <td>${asamblea.Asistentes || 0}/${this.data.residentes.length}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline" onclick="AsambleasModule.editAsamblea(${index})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-info" onclick="AsambleasModule.sendConvocatoria(${index})">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    showAsambleaModal(index = null) {
        const isEdit = index !== null;
        const asamblea = isEdit ? this.data.filteredAsambleas[index] : {};
        
        const modalContent = `
            <form id="asamblea-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha *</label>
                        <input type="date" name="fecha" class="form-control" value="${asamblea.Fecha || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hora *</label>
                        <input type="time" name="hora" class="form-control" value="${asamblea.Hora || ''}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Lugar *</label>
                    <input type="text" name="lugar" class="form-control" value="${asamblea.Lugar || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Tipo *</label>
                        <select name="tipo" class="form-control" required>
                            <option value="">Seleccionar tipo</option>
                            <option value="Ordinaria" ${asamblea.Tipo === 'Ordinaria' ? 'selected' : ''}>Ordinaria</option>
                            <option value="Extraordinaria" ${asamblea.Tipo === 'Extraordinaria' ? 'selected' : ''}>Extraordinaria</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado</label>
                        <select name="estado" class="form-control">
                            <option value="Programada" ${asamblea.Estado === 'Programada' ? 'selected' : ''}>Programada</option>
                            <option value="Realizada" ${asamblea.Estado === 'Realizada' ? 'selected' : ''}>Realizada</option>
                            <option value="Cancelada" ${asamblea.Estado === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Temas a Tratar *</label>
                    <textarea name="temas" class="form-control" rows="4" required>${asamblea.Temas || ''}</textarea>
                    <div class="form-help">Ingrese cada tema en una línea separada</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Observaciones</label>
                    <textarea name="observaciones" class="form-control" rows="3">${asamblea.Observaciones || ''}</textarea>
                </div>
            </form>
        `;

        app.showModal(
            isEdit ? 'Editar Asamblea' : 'Programar Asamblea',
            modalContent,
            [{ text: isEdit ? 'Actualizar' : 'Guardar', class: 'btn-primary', onclick: `AsambleasModule.saveAsamblea(${index})` }]
        );
    },

    async saveAsamblea(index) {
        const form = document.getElementById('asamblea-form');
        const formData = helpers.getFormData(form);
        
        try {
            if (index !== null) {
                await sheetsAPI.updateAsamblea(index, formData);
                app.showNotification('Asamblea actualizada correctamente', 'success');
            } else {
                await sheetsAPI.addAsamblea(formData);
                app.showNotification('Asamblea programada correctamente', 'success');
            }
            
            await this.loadData();
            this.applyFilters();
            app.hideModal();
        } catch (error) {
            app.showNotification('Error al guardar asamblea: ' + error.message, 'error');
        }
    },

    async sendConvocatoria(index) {
        const asamblea = this.data.filteredAsambleas[index];
        
        if (!confirm('¿Enviar convocatoria a todos los residentes?')) return;
        
        try {
            const asunto = `Convocatoria a Asamblea ${asamblea.Tipo} - ${helpers.formatDate(asamblea.Fecha)}`;
            const mensaje = `
Estimado/a residente,

Se convoca a Asamblea ${asamblea.Tipo} de Copropietarios:

Fecha: ${helpers.formatDate(asamblea.Fecha)}
Hora: ${asamblea.Hora}
Lugar: ${asamblea.Lugar}

Temas a tratar:
${asamblea.Temas}

Su asistencia es muy importante.

Saludos cordiales,
Administración Condominio Los Molles
            `;

            let enviados = 0;
            for (const residente of this.data.residentes) {
                try {
                    await gmailAPI.sendEmail({
                        to: residente.Email,
                        subject: asunto,
                        body: mensaje
                    });
                    enviados++;
                } catch (error) {
                    console.error(`Error enviando a ${residente.Email}:`, error);
                }
            }

            app.showNotification(`Convocatoria enviada a ${enviados} residentes`, 'success');
        } catch (error) {
            app.showNotification('Error enviando convocatoria: ' + error.message, 'error');
        }
    },

    editAsamblea(index) {
        this.showAsambleaModal(index);
    }
};

window.AsambleasModule = AsambleasModule;

