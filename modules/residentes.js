// Módulo Residentes - Gestión de residentes del condominio
class ResidentesModule {
    constructor() {
        this.residentes = [];
        this.filteredResidentes = [];
        this.searchTerm = '';
    }

    // Renderizar el módulo
    async render() {
        const container = document.getElementById('content-container');
        Utils.showLoading(container);

        try {
            // Cargar datos de residentes
            await this.loadResidentes();

            // Renderizar contenido
            container.innerHTML = this.getHTML();

            // Configurar eventos
            this.setupEvents();

        } catch (error) {
            console.error('Error cargando residentes:', error);
            Utils.showError(container, 'Error cargando los residentes');
        }
    }

    // Cargar residentes desde Google Sheets
    async loadResidentes() {
        try {
            const data = await window.googleAPI.readSheet(CONFIG.SHEETS.RESIDENTES);
            
            // Convertir datos a objetos (primera fila son headers)
            if (data.length > 1) {
                this.residentes = data.slice(1).map((row, index) => ({
                    id: row[0] || (index + 1),
                    nombreCompleto: row[1] || '',
                    rut: row[2] || '',
                    nParcela: row[3] || '',
                    email: row[4] || '',
                    telefono: row[5] || '',
                    estado: row[6] || 'Activo',
                    valorGastoComun: parseFloat(row[7]) || 0,
                    rowIndex: index + 1 // Para referencia en la hoja
                }));
            } else {
                this.residentes = [];
            }

            this.filteredResidentes = [...this.residentes];
        } catch (error) {
            console.error('Error cargando residentes:', error);
            throw error;
        }
    }

    // Obtener HTML del módulo
    getHTML() {
        return `
            <div class="residentes-container">
                <div class="module-header">
                    <h2>Gestión de Residentes</h2>
                    <div class="module-actions">
                        <button class="btn btn-success" id="add-residente-btn">
                            <i class="fas fa-plus"></i>
                            Agregar Residente
                        </button>
                        <button class="btn btn-secondary" id="export-residentes-btn">
                            <i class="fas fa-download"></i>
                            Descargar Excel
                        </button>
                    </div>
                </div>

                <div class="search-container">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-residentes" placeholder="Buscar por nombre, RUT o N° parcela..." class="search-input">
                    </div>
                </div>

                <div class="table-container">
                    <table class="table" id="residentes-table">
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>RUT</th>
                                <th>N° Parcela</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th>Valor Gasto Común</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="residentes-tbody">
                            ${this.getTableRows()}
                        </tbody>
                    </table>
                </div>

                ${this.residentes.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No hay residentes registrados</h3>
                    <p>Comience agregando el primer residente del condominio.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-residente-btn').click()">
                        Agregar Primer Residente
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    // Obtener filas de la tabla
    getTableRows() {
        if (this.filteredResidentes.length === 0) {
            return '<tr><td colspan="8" class="text-center">No se encontraron residentes</td></tr>';
        }

        return this.filteredResidentes.map(residente => `
            <tr>
                <td>${Utils.escapeHtml(residente.nombreCompleto)}</td>
                <td>${Utils.escapeHtml(residente.rut)}</td>
                <td>${Utils.escapeHtml(residente.nParcela)}</td>
                <td>${Utils.escapeHtml(residente.email)}</td>
                <td>${Utils.escapeHtml(residente.telefono)}</td>
                <td><span class="status-${residente.estado.toLowerCase()}">${residente.estado}</span></td>
                <td>${Utils.formatCurrency(residente.valorGastoComun)}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" onclick="window.App.getCurrentModule().editResidente('${residente.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="window.App.getCurrentModule().deleteResidente('${residente.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Configurar eventos
    setupEvents() {
        // Búsqueda
        const searchInput = document.getElementById('search-residentes');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.filterResidentes();
            }, 300));
        }

        // Botón agregar residente
        const addBtn = document.getElementById('add-residente-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showResidenteForm());
        }

        // Botón exportar
        const exportBtn = document.getElementById('export-residentes-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }
    }

    // Filtrar residentes
    filterResidentes() {
        if (!this.searchTerm) {
            this.filteredResidentes = [...this.residentes];
        } else {
            this.filteredResidentes = this.residentes.filter(residente => 
                residente.nombreCompleto.toLowerCase().includes(this.searchTerm) ||
                residente.rut.toLowerCase().includes(this.searchTerm) ||
                residente.nParcela.toLowerCase().includes(this.searchTerm)
            );
        }

        // Actualizar tabla
        const tbody = document.getElementById('residentes-tbody');
        if (tbody) {
            tbody.innerHTML = this.getTableRows();
        }
    }

    // Mostrar formulario de residente
    showResidenteForm(residenteId = null) {
        const residente = residenteId ? this.residentes.find(r => r.id === residenteId) : null;
        const isEdit = !!residente;

        const formHTML = `
            <form id="residente-form" class="residente-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Nombre Completo *</label>
                        <input type="text" id="nombreCompleto" class="form-input" value="${residente?.nombreCompleto || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">RUT *</label>
                        <input type="text" id="rut" class="form-input" value="${residente?.rut || ''}" placeholder="12.345.678-9" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">N° Parcela *</label>
                        <input type="text" id="nParcela" class="form-input" value="${residente?.nParcela || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email *</label>
                        <input type="email" id="email" class="form-input" value="${residente?.email || ''}" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Teléfono</label>
                        <input type="tel" id="telefono" class="form-input" value="${residente?.telefono || ''}" placeholder="+56 9 1234 5678">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Estado</label>
                        <select id="estado" class="form-select">
                            <option value="Activo" ${residente?.estado === 'Activo' ? 'selected' : ''}>Activo</option>
                            <option value="Moroso" ${residente?.estado === 'Moroso' ? 'selected' : ''}>Moroso</option>
                            <option value="Inactivo" ${residente?.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Valor Gasto Común *</label>
                    <input type="number" id="valorGastoComun" class="form-input" value="${residente?.valorGastoComun || ''}" min="0" step="1000" required>
                </div>
            </form>
        `;

        const footerHTML = `
            <button type="button" class="btn btn-secondary" onclick="window.App.closeModal()">Cancelar</button>
            <button type="button" class="btn btn-primary" onclick="window.App.getCurrentModule().saveResidente(${isEdit ? `'${residenteId}'` : 'null'})">
                ${isEdit ? 'Actualizar' : 'Guardar'} Residente
            </button>
        `;

        window.App.openModal(
            isEdit ? 'Editar Residente' : 'Agregar Residente',
            formHTML,
            footerHTML
        );

        // Configurar validación de RUT
        const rutInput = document.getElementById('rut');
        if (rutInput) {
            rutInput.addEventListener('blur', (e) => {
                const rut = e.target.value;
                if (rut && !Utils.validateRUT(rut)) {
                    e.target.setCustomValidity('RUT inválido');
                } else {
                    e.target.setCustomValidity('');
                    // Formatear RUT
                    if (rut) {
                        e.target.value = Utils.formatRUT(rut);
                    }
                }
            });
        }
    }

    // Guardar residente
    async saveResidente(residenteId = null) {
        try {
            const form = document.getElementById('residente-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Obtener datos del formulario
            const formData = {
                nombreCompleto: document.getElementById('nombreCompleto').value.trim(),
                rut: document.getElementById('rut').value.trim(),
                nParcela: document.getElementById('nParcela').value.trim(),
                email: document.getElementById('email').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                estado: document.getElementById('estado').value,
                valorGastoComun: parseFloat(document.getElementById('valorGastoComun').value) || 0
            };

            // Validaciones adicionales
            if (!Utils.validateRUT(formData.rut)) {
                Utils.showToast('RUT inválido', 'error');
                return;
            }

            if (!Utils.validateEmail(formData.email)) {
                Utils.showToast('Email inválido', 'error');
                return;
            }

            // Verificar duplicados
            const existingResidente = this.residentes.find(r => 
                (r.rut === formData.rut || r.nParcela === formData.nParcela) && 
                r.id !== residenteId
            );

            if (existingResidente) {
                Utils.showToast('Ya existe un residente con ese RUT o N° de parcela', 'error');
                return;
            }

            // Preparar datos para Google Sheets
            const rowData = [
                residenteId || Utils.generateId(),
                formData.nombreCompleto,
                formData.rut,
                formData.nParcela,
                formData.email,
                formData.telefono,
                formData.estado,
                formData.valorGastoComun
            ];

            if (residenteId) {
                // Actualizar residente existente
                const residente = this.residentes.find(r => r.id === residenteId);
                if (residente) {
                    const range = `A${residente.rowIndex + 1}:H${residente.rowIndex + 1}`;
                    await window.googleAPI.writeSheet(CONFIG.SHEETS.RESIDENTES, range, [rowData]);
                    Utils.showToast('Residente actualizado correctamente', 'success');
                }
            } else {
                // Agregar nuevo residente
                await window.googleAPI.appendToSheet(CONFIG.SHEETS.RESIDENTES, rowData);
                Utils.showToast('Residente agregado correctamente', 'success');
            }

            // Cerrar modal y recargar datos
            window.App.closeModal();
            await this.loadResidentes();
            this.filterResidentes();

        } catch (error) {
            console.error('Error guardando residente:', error);
            Utils.showToast('Error guardando el residente', 'error');
        }
    }

    // Editar residente
    editResidente(residenteId) {
        this.showResidenteForm(residenteId);
    }

    // Eliminar residente
    async deleteResidente(residenteId) {
        try {
            const residente = this.residentes.find(r => r.id === residenteId);
            if (!residente) return;

            const confirmed = await Utils.confirm(
                `¿Está seguro de que desea eliminar al residente "${residente.nombreCompleto}"?`,
                'Confirmar Eliminación'
            );

            if (!confirmed) return;

            // Eliminar de Google Sheets
            await window.googleAPI.deleteRow(CONFIG.SHEETS.RESIDENTES, residente.rowIndex);

            Utils.showToast('Residente eliminado correctamente', 'success');

            // Recargar datos
            await this.loadResidentes();
            this.filterResidentes();

        } catch (error) {
            console.error('Error eliminando residente:', error);
            Utils.showToast('Error eliminando el residente', 'error');
        }
    }

    // Exportar a Excel
    exportToExcel() {
        try {
            const headers = ['Nombre Completo', 'RUT', 'N° Parcela', 'Email', 'Teléfono', 'Estado', 'Valor Gasto Común'];
            const data = [headers];

            this.filteredResidentes.forEach(residente => {
                data.push([
                    residente.nombreCompleto,
                    residente.rut,
                    residente.nParcela,
                    residente.email,
                    residente.telefono,
                    residente.estado,
                    residente.valorGastoComun
                ]);
            });

            Utils.exportToExcel(data, 'Residentes_LosMolles', 'Residentes');
            Utils.showToast('Archivo Excel descargado correctamente', 'success');

        } catch (error) {
            console.error('Error exportando a Excel:', error);
            Utils.showToast('Error exportando a Excel', 'error');
        }
    }
}

// Exportar módulo
window.ResidentesModule = ResidentesModule;

