// Módulo Contabilidad - Gestión de ingresos y egresos
class ContabilidadModule {
    constructor() {
        this.ingresos = [];
        this.egresos = [];
        this.activeTab = 'egresos';
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

            // Mostrar pestaña activa
            this.showTab(this.activeTab);

        } catch (error) {
            console.error('Error cargando contabilidad:', error);
            Utils.showError(container, 'Error cargando la contabilidad');
        }
    }

    // Cargar datos
    async loadData() {
        try {
            const [pagosData, egresosData, multasData] = await Promise.all([
                window.googleAPI.readSheet(CONFIG.SHEETS.PAGOS_GC),
                window.googleAPI.readSheet(CONFIG.SHEETS.EGRESOS),
                window.googleAPI.readSheet(CONFIG.SHEETS.MULTAS)
            ]);

            // Procesar ingresos (pagos + multas pagadas)
            this.ingresos = [];
            
            if (pagosData.length > 1) {
                pagosData.slice(1).forEach((row, index) => {
                    this.ingresos.push({
                        id: row[0] || (index + 1),
                        tipo: 'Gasto Común',
                        fecha: row[6] || '', // FechaPago
                        descripcion: `Pago Parcela ${row[2]} - Período ${row[3]}`,
                        monto: parseFloat(row[5]) || 0, // MontoPagado
                        origen: 'Pagos_GC'
                    });
                });
            }

            if (multasData.length > 1) {
                multasData.slice(1).forEach((row, index) => {
                    if (row[5] === 'Pagada') { // Estado
                        this.ingresos.push({
                            id: row[0] || (index + 1),
                            tipo: 'Multa',
                            fecha: row[6] || '', // FechaPago
                            descripcion: `Multa - ${row[3]}`, // Descripcion
                            monto: parseFloat(row[4]) || 0, // Monto
                            origen: 'Multas'
                        });
                    }
                });
            }

            // Procesar egresos
            if (egresosData.length > 1) {
                this.egresos = egresosData.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    fecha: row[1] || '',
                    categoria: row[2] || '',
                    descripcion: row[3] || '',
                    proveedor: row[4] || '',
                    monto: parseFloat(row[5]) || 0,
                    idFacturaDrive: row[6] || '',
                    rowIndex: index + 1
                }));
            }

        } catch (error) {
            console.error('Error cargando datos de contabilidad:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        const totalIngresos = this.ingresos.reduce((sum, item) => sum + item.monto, 0);
        const totalEgresos = this.egresos.reduce((sum, item) => sum + item.monto, 0);
        const balance = totalIngresos - totalEgresos;

        return `
            <div class="contabilidad-container">
                <div class="module-header">
                    <h2>Contabilidad</h2>
                </div>

                <!-- Resumen financiero -->
                <div class="summary-cards">
                    <div class="summary-card ingresos">
                        <div class="summary-value" style="color: var(--success-color);">
                            ${Utils.formatCurrency(totalIngresos)}
                        </div>
                        <div class="summary-label">Total Ingresos</div>
                    </div>
                    
                    <div class="summary-card egresos">
                        <div class="summary-value" style="color: var(--error-color);">
                            ${Utils.formatCurrency(totalEgresos)}
                        </div>
                        <div class="summary-label">Total Egresos</div>
                    </div>
                    
                    <div class="summary-card balance">
                        <div class="summary-value" style="color: ${balance >= 0 ? 'var(--success-color)' : 'var(--error-color)'};">
                            ${Utils.formatCurrency(balance)}
                        </div>
                        <div class="summary-label">Balance</div>
                    </div>
                </div>

                <!-- Pestañas -->
                <div class="tabs-container">
                    <div class="tabs-nav">
                        <button class="tab-button ${this.activeTab === 'egresos' ? 'active' : ''}" data-tab="egresos">
                            Egresos
                        </button>
                        <button class="tab-button ${this.activeTab === 'ingresos' ? 'active' : ''}" data-tab="ingresos">
                            Ingresos
                        </button>
                    </div>

                    <!-- Pestaña Egresos -->
                    <div class="tab-content ${this.activeTab === 'egresos' ? 'active' : ''}" id="tab-egresos">
                        <div class="tab-header">
                            <h3>Gestión de Egresos</h3>
                            <button class="btn btn-primary" id="add-egreso-btn">
                                <i class="fas fa-plus"></i>
                                Agregar Gasto
                            </button>
                        </div>
                        
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Categoría</th>
                                        <th>Descripción</th>
                                        <th>Proveedor</th>
                                        <th>Monto</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.getEgresosTableRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Pestaña Ingresos -->
                    <div class="tab-content ${this.activeTab === 'ingresos' ? 'active' : ''}" id="tab-ingresos">
                        <div class="tab-header">
                            <h3>Resumen de Ingresos</h3>
                        </div>
                        
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Tipo</th>
                                        <th>Descripción</th>
                                        <th>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.getIngresosTableRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Obtener filas de la tabla de egresos
    getEgresosTableRows() {
        if (this.egresos.length === 0) {
            return '<tr><td colspan="6" class="text-center">No hay egresos registrados</td></tr>';
        }

        return this.egresos.map(egreso => `
            <tr>
                <td>${Utils.formatDate(Utils.parseDate(egreso.fecha))}</td>
                <td>${Utils.escapeHtml(egreso.categoria)}</td>
                <td>${Utils.escapeHtml(egreso.descripcion)}</td>
                <td>${Utils.escapeHtml(egreso.proveedor)}</td>
                <td>${Utils.formatCurrency(egreso.monto)}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" onclick="window.App.getCurrentModule().editEgreso('${egreso.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="window.App.getCurrentModule().deleteEgreso('${egreso.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Obtener filas de la tabla de ingresos
    getIngresosTableRows() {
        if (this.ingresos.length === 0) {
            return '<tr><td colspan="4" class="text-center">No hay ingresos registrados</td></tr>';
        }

        return this.ingresos.map(ingreso => `
            <tr>
                <td>${Utils.formatDate(Utils.parseDate(ingreso.fecha))}</td>
                <td><span class="badge badge-${ingreso.tipo === 'Gasto Común' ? 'success' : 'warning'}">${ingreso.tipo}</span></td>
                <td>${Utils.escapeHtml(ingreso.descripcion)}</td>
                <td>${Utils.formatCurrency(ingreso.monto)}</td>
            </tr>
        `).join('');
    }

    // Configurar eventos
    setupEvents() {
        // Pestañas
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                this.showTab(tabId);
            });
        });

        // Botón agregar egreso
        const addBtn = document.getElementById('add-egreso-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showEgresoForm());
        }
    }

    // Mostrar pestaña
    showTab(tabId) {
        this.activeTab = tabId;

        // Actualizar botones
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');
    }

    // Mostrar formulario de egreso
    showEgresoForm(egresoId = null) {
        const egreso = egresoId ? this.egresos.find(e => e.id === egresoId) : null;
        const isEdit = !!egreso;

        const formHTML = `
            <form id="egreso-form" class="egreso-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Fecha *</label>
                        <input type="date" id="fecha" class="form-input" value="${egreso ? Utils.formatDateForInput(Utils.parseDate(egreso.fecha)) : Utils.formatDateForInput(new Date())}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Categoría *</label>
                        <select id="categoria" class="form-select" required>
                            <option value="">Seleccionar...</option>
                            <option value="Remuneraciones" ${egreso?.categoria === 'Remuneraciones' ? 'selected' : ''}>Remuneraciones</option>
                            <option value="Servicios Básicos" ${egreso?.categoria === 'Servicios Básicos' ? 'selected' : ''}>Servicios Básicos</option>
                            <option value="Mantención" ${egreso?.categoria === 'Mantención' ? 'selected' : ''}>Mantención</option>
                            <option value="Administrativo" ${egreso?.categoria === 'Administrativo' ? 'selected' : ''}>Administrativo</option>
                            <option value="Otros" ${egreso?.categoria === 'Otros' ? 'selected' : ''}>Otros</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Descripción *</label>
                    <textarea id="descripcion" class="form-textarea" rows="3" required>${egreso?.descripcion || ''}</textarea>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Proveedor</label>
                        <input type="text" id="proveedor" class="form-input" value="${egreso?.proveedor || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Monto *</label>
                        <input type="number" id="monto" class="form-input" value="${egreso?.monto || ''}" min="0" step="1000" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Factura/Boleta (PDF/JPG)</label>
                    <input type="file" id="factura" class="form-input" accept=".pdf,.jpg,.jpeg,.png">
                    <small class="form-help">Opcional: Adjunte la factura o boleta</small>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveEgreso(${isEdit ? `'${egresoId}'` : 'null'})">
                ${isEdit ? 'Actualizar' : 'Guardar'} Egreso
            </button>
        `;

        window.App.openModal(
            isEdit ? 'Editar Egreso' : 'Agregar Egreso',
            formHTML,
            footerHTML
        );
    }

    // Guardar egreso
    async saveEgreso(egresoId = null) {
        try {
            const form = document.getElementById('egreso-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const formData = {
                fecha: document.getElementById('fecha').value,
                categoria: document.getElementById('categoria').value,
                descripcion: document.getElementById('descripcion').value.trim(),
                proveedor: document.getElementById('proveedor').value.trim(),
                monto: parseFloat(document.getElementById('monto').value) || 0
            };

            const facturaFile = document.getElementById('factura').files[0];

            // Subir factura a Google Drive si existe
            let idFacturaDrive = '';
            if (facturaFile) {
                try {
                    const folders = await window.googleAPI.ensureFolderStructure();
                    const fileName = `${formData.fecha}-${formData.categoria}-${formData.descripcion.substring(0, 20)}.${facturaFile.name.split('.').pop()}`;
                    const uploadResult = await window.googleAPI.uploadFile(facturaFile, fileName, folders.egresos);
                    idFacturaDrive = uploadResult.id;
                } catch (error) {
                    console.error('Error subiendo factura:', error);
                    Utils.showToast('Error subiendo la factura, pero el egreso se registrará', 'warning');
                }
            }

            // Preparar datos para Google Sheets
            const rowData = [
                egresoId || Utils.generateId(),
                Utils.formatDate(new Date(formData.fecha)),
                formData.categoria,
                formData.descripcion,
                formData.proveedor,
                formData.monto,
                idFacturaDrive
            ];

            if (egresoId) {
                // Actualizar egreso existente
                const egreso = this.egresos.find(e => e.id === egresoId);
                if (egreso) {
                    const range = `A${egreso.rowIndex + 1}:G${egreso.rowIndex + 1}`;
                    await window.googleAPI.writeSheet(CONFIG.SHEETS.EGRESOS, range, [rowData]);
                    Utils.showToast('Egreso actualizado correctamente', 'success');
                }
            } else {
                // Agregar nuevo egreso
                await window.googleAPI.appendToSheet(CONFIG.SHEETS.EGRESOS, rowData);
                Utils.showToast('Egreso agregado correctamente', 'success');
            }

            window.App.closeModal();
            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.showTab(this.activeTab);

        } catch (error) {
            console.error('Error guardando egreso:', error);
            Utils.showToast('Error guardando el egreso', 'error');
        }
    }

    // Editar egreso
    editEgreso(egresoId) {
        this.showEgresoForm(egresoId);
    }

    // Eliminar egreso
    async deleteEgreso(egresoId) {
        try {
            const egreso = this.egresos.find(e => e.id === egresoId);
            if (!egreso) return;

            const confirmed = await Utils.confirm(
                `¿Está seguro de que desea eliminar el egreso "${egreso.descripcion}"?`,
                'Confirmar Eliminación'
            );

            if (!confirmed) return;

            await window.googleAPI.deleteRow(CONFIG.SHEETS.EGRESOS, egreso.rowIndex);
            Utils.showToast('Egreso eliminado correctamente', 'success');

            await this.loadData();
            
            // Actualizar vista
            const container = document.getElementById('content-container');
            container.innerHTML = this.getHTML();
            this.setupEvents();
            this.showTab(this.activeTab);

        } catch (error) {
            console.error('Error eliminando egreso:', error);
            Utils.showToast('Error eliminando el egreso', 'error');
        }
    }
}

// Exportar módulo
window.ContabilidadModule = ContabilidadModule;

