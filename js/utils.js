// Funciones utilitarias para la aplicación
class Utils {
    // Formatear fecha en formato DD/MM/YYYY
    static formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Formatear fecha para input type="date" (YYYY-MM-DD)
    static formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Parsear fecha desde string DD/MM/YYYY
    static parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }

    // Formatear moneda chilena
    static formatCurrency(amount) {
        if (amount === null || amount === undefined) return '$0';
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(amount);
    }

    // Parsear moneda a número
    static parseCurrency(currencyString) {
        if (!currencyString) return 0;
        return parseInt(currencyString.replace(/[^\d]/g, '')) || 0;
    }

    // Formatear RUT chileno
    static formatRUT(rut) {
        if (!rut) return '';
        // Remover puntos y guiones
        const cleanRUT = rut.replace(/[.-]/g, '');
        // Separar número y dígito verificador
        const number = cleanRUT.slice(0, -1);
        const dv = cleanRUT.slice(-1);
        // Formatear con puntos
        const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedNumber}-${dv}`;
    }

    // Validar RUT chileno
    static validateRUT(rut) {
        if (!rut) return false;
        const cleanRUT = rut.replace(/[.-]/g, '');
        if (cleanRUT.length < 2) return false;
        
        const number = cleanRUT.slice(0, -1);
        const dv = cleanRUT.slice(-1).toLowerCase();
        
        let sum = 0;
        let multiplier = 2;
        
        for (let i = number.length - 1; i >= 0; i--) {
            sum += parseInt(number[i]) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
        }
        
        const remainder = sum % 11;
        const calculatedDV = remainder < 2 ? remainder.toString() : (11 - remainder === 10 ? 'k' : (11 - remainder).toString());
        
        return dv === calculatedDV;
    }

    // Validar email
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Calcular meses de mora
    static calculateMesesMora(fechaVencimiento) {
        if (!fechaVencimiento) return 0;
        
        const vencimiento = new Date(fechaVencimiento);
        const hoy = new Date();
        
        if (hoy <= vencimiento) return 0;
        
        const diffTime = hoy.getTime() - vencimiento.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.ceil(diffDays / 30); // Aproximadamente un mes = 30 días
    }

    // Calcular interés por mora
    static calculateInteresMora(valorGastoComun, mesesMora, tmc = CONFIG.CALCULATIONS.TMC) {
        if (mesesMora <= 0) return 0;
        return (valorGastoComun * tmc / 100 / 12) * mesesMora;
    }

    // Calcular multa adicional (25%)
    static calculateMultaAdicional(valorGastoComun, mesesMora) {
        if (mesesMora <= 0) return 0;
        return (valorGastoComun * CONFIG.CALCULATIONS.MULTA_PORCENTAJE) * mesesMora;
    }

    // Calcular deuda total
    static calculateDeudaTotal(valorGastoComun, montoPagado, interesMora, multaAdicional) {
        return valorGastoComun + interesMora + multaAdicional - montoPagado;
    }

    // Generar fecha de vencimiento para un período
    static generateFechaVencimiento(year, month) {
        return new Date(year, month - 1, CONFIG.CALCULATIONS.DIA_VENCIMIENTO);
    }

    // Obtener período actual (YYYY-MM)
    static getCurrentPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    }

    // Parsear período (YYYY-MM) a año y mes
    static parsePeriod(period) {
        const parts = period.split('-');
        return {
            year: parseInt(parts[0]),
            month: parseInt(parts[1])
        };
    }

    // Mostrar loading spinner
    static showLoading(container) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.innerHTML = `
                <div class="text-center" style="padding: 2rem;">
                    <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                    <p>Cargando...</p>
                </div>
            `;
        }
    }

    // Mostrar mensaje de error
    static showError(container, message) {
        if (typeof container === 'string') {
            container = document.getElementById(container);
        }
        if (container) {
            container.innerHTML = `
                <div class="text-center" style="padding: 2rem; color: var(--error-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Mostrar notificación toast
    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Agregar estilos si no existen
        if (!document.getElementById('toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-lg);
                    padding: 1rem;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid;
                }
                .toast-success { border-left-color: var(--success-color); }
                .toast-error { border-left-color: var(--error-color); }
                .toast-warning { border-left-color: var(--warning-color); }
                .toast-info { border-left-color: var(--info-color); }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Obtener ícono para toast
    static getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Confirmar acción
    static async confirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            const modal = document.getElementById('modal-overlay');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            const modalFooter = document.getElementById('modal-footer');
            
            modalTitle.textContent = title;
            modalBody.innerHTML = `<p>${message}</p>`;
            modalFooter.innerHTML = `
                <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
                <button class="btn btn-danger" id="confirm-ok">Confirmar</button>
            `;
            
            modal.classList.remove('hidden');
            
            document.getElementById('confirm-cancel').onclick = () => {
                modal.classList.add('hidden');
                resolve(false);
            };
            
            document.getElementById('confirm-ok').onclick = () => {
                modal.classList.add('hidden');
                resolve(true);
            };
        });
    }

    // Exportar datos a Excel
    static exportToExcel(data, filename, sheetName = 'Datos') {
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    }

    // Generar ID único
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Escapar HTML
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Exportar Utils globalmente
window.Utils = Utils;

