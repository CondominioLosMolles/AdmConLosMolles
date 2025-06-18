// ===== FUNCIONES AUXILIARES =====

// Formateo de números
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatNumber(number) {
    return new Intl.NumberFormat('es-CL').format(number);
}

// Formateo de fechas
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    const formatOptions = { ...defaultOptions, ...options };
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return new Intl.DateTimeFormat('es-CL', formatOptions).format(date);
}

function formatDateTime(date) {
    return formatDate(date, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentDateTime() {
    return new Date().toISOString();
}

// Manipulación de fechas
function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    
    return Math.round((secondDate - firstDate) / oneDay);
}

function getMonthsDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

// Manipulación de strings
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function capitalizeWords(str) {
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
}

function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Manipulación de arrays
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

function sortBy(array, key, direction = 'asc') {
    return array.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        
        if (direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });
}

function filterBy(array, filters) {
    return array.filter(item => {
        return Object.keys(filters).every(key => {
            const filterValue = filters[key];
            const itemValue = item[key];
            
            if (filterValue === '' || filterValue === null || filterValue === undefined) {
                return true;
            }
            
            if (typeof filterValue === 'string') {
                return itemValue.toString().toLowerCase().includes(filterValue.toLowerCase());
            }
            
            return itemValue === filterValue;
        });
    });
}

// Utilidades DOM
function createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

function removeElement(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

function toggleClass(element, className) {
    element.classList.toggle(className);
}

function hasClass(element, className) {
    return element.classList.contains(className);
}

// Utilidades de formularios
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

function setFormData(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = data[key];
            } else if (field.type === 'radio') {
                const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                if (radio) radio.checked = true;
            } else {
                field.value = data[key];
            }
        }
    });
}

function clearForm(form) {
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = false;
        } else {
            field.value = '';
        }
    });
}

// Utilidades de validación
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidRUT(rut) {
    // Validación básica de RUT chileno
    const rutRegex = /^[0-9]+-[0-9kK]{1}$/;
    if (!rutRegex.test(rut)) return false;
    
    const [number, dv] = rut.split('-');
    return calculateRUTDV(number) === dv.toUpperCase();
}

function calculateRUTDV(rut) {
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rut.length - 1; i >= 0; i--) {
        sum += parseInt(rut[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const remainder = sum % 11;
    const dv = 11 - remainder;
    
    if (dv === 11) return '0';
    if (dv === 10) return 'K';
    return dv.toString();
}

function formatRUT(rut) {
    // Remover puntos y guiones
    const cleanRUT = rut.replace(/[.-]/g, '');
    
    // Separar número y dígito verificador
    const number = cleanRUT.slice(0, -1);
    const dv = cleanRUT.slice(-1);
    
    // Formatear con puntos
    const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedNumber}-${dv}`;
}

// Utilidades de almacenamiento local
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error cargando de localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removiendo de localStorage:', error);
        return false;
    }
}

// Utilidades de exportación
function exportToCSV(data, filename) {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, filename, 'text/csv');
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            // Escapar comillas y envolver en comillas si contiene comas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

// Utilidades de carga
function showLoading(container, message = 'Cargando...') {
    container.innerHTML = `
        <div class="text-center" style="padding: 2rem;">
            <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
            <p>${message}</p>
        </div>
    `;
}

function hideLoading(container) {
    const loadingElement = container.querySelector('.loading-spinner');
    if (loadingElement) {
        loadingElement.parentElement.remove();
    }
}

// Utilidades de debounce y throttle
function debounce(func, wait) {
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Utilidades de URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (let [key, value] of params) {
        result[key] = value;
    }
    return result;
}

function setQueryParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

function removeQueryParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
}

// Exportar funciones para uso global
window.helpers = {
    formatCurrency,
    formatNumber,
    formatDate,
    formatDateTime,
    getCurrentDate,
    getCurrentDateTime,
    addMonths,
    getDaysDifference,
    getMonthsDifference,
    capitalizeFirst,
    capitalizeWords,
    slugify,
    groupBy,
    sortBy,
    filterBy,
    createElement,
    removeElement,
    toggleClass,
    hasClass,
    getFormData,
    setFormData,
    clearForm,
    isValidEmail,
    isValidRUT,
    calculateRUTDV,
    formatRUT,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    exportToCSV,
    convertToCSV,
    downloadFile,
    showLoading,
    hideLoading,
    debounce,
    throttle,
    getQueryParams,
    setQueryParam,
    removeQueryParam
};

