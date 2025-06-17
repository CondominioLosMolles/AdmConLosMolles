// ===== VALIDACIONES =====

class FormValidator {
    constructor() {
        this.rules = {};
        this.messages = {
            required: 'Este campo es obligatorio',
            email: 'Ingrese un email válido',
            rut: 'Ingrese un RUT válido',
            number: 'Ingrese un número válido',
            min: 'El valor debe ser mayor a {min}',
            max: 'El valor debe ser menor a {max}',
            minLength: 'Debe tener al menos {min} caracteres',
            maxLength: 'No puede tener más de {max} caracteres',
            pattern: 'El formato no es válido',
            date: 'Ingrese una fecha válida',
            phone: 'Ingrese un teléfono válido',
            positive: 'El valor debe ser positivo',
            integer: 'Ingrese un número entero'
        };
    }

    // Configurar reglas de validación para un formulario
    setRules(formId, rules) {
        this.rules[formId] = rules;
    }

    // Validar un formulario completo
    validateForm(form) {
        const formId = form.id;
        const rules = this.rules[formId];
        
        if (!rules) return { isValid: true, errors: {} };

        const errors = {};
        let isValid = true;

        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const fieldRules = rules[fieldName];
            const fieldErrors = this.validateField(field, fieldRules);

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
                isValid = false;
                this.showFieldError(field, fieldErrors[0]);
            } else {
                this.clearFieldError(field);
            }
        });

        return { isValid, errors };
    }

    // Validar un campo individual
    validateField(field, rules) {
        const errors = [];
        const value = field.value.trim();
        const fieldType = field.type;

        // Validación requerido
        if (rules.required && !value) {
            errors.push(this.messages.required);
            return errors;
        }

        // Si el campo está vacío y no es requerido, no validar más
        if (!value && !rules.required) {
            return errors;
        }

        // Validación de email
        if (rules.email && !this.isValidEmail(value)) {
            errors.push(this.messages.email);
        }

        // Validación de RUT
        if (rules.rut && !this.isValidRUT(value)) {
            errors.push(this.messages.rut);
        }

        // Validación de número
        if (rules.number && !this.isValidNumber(value)) {
            errors.push(this.messages.number);
        }

        // Validación de entero
        if (rules.integer && !this.isValidInteger(value)) {
            errors.push(this.messages.integer);
        }

        // Validación de positivo
        if (rules.positive && parseFloat(value) <= 0) {
            errors.push(this.messages.positive);
        }

        // Validación de valor mínimo
        if (rules.min !== undefined && parseFloat(value) < rules.min) {
            errors.push(this.messages.min.replace('{min}', rules.min));
        }

        // Validación de valor máximo
        if (rules.max !== undefined && parseFloat(value) > rules.max) {
            errors.push(this.messages.max.replace('{max}', rules.max));
        }

        // Validación de longitud mínima
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(this.messages.minLength.replace('{min}', rules.minLength));
        }

        // Validación de longitud máxima
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(this.messages.maxLength.replace('{max}', rules.maxLength));
        }

        // Validación de patrón
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push(rules.patternMessage || this.messages.pattern);
        }

        // Validación de fecha
        if (rules.date && !this.isValidDate(value)) {
            errors.push(this.messages.date);
        }

        // Validación de teléfono
        if (rules.phone && !this.isValidPhone(value)) {
            errors.push(this.messages.phone);
        }

        // Validación personalizada
        if (rules.custom && typeof rules.custom === 'function') {
            const customResult = rules.custom(value, field);
            if (customResult !== true) {
                errors.push(customResult || 'Valor no válido');
            }
        }

        return errors;
    }

    // Mostrar error en un campo
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'form-error';
        errorElement.textContent = message;
        
        field.parentNode.appendChild(errorElement);
    }

    // Limpiar error de un campo
    clearFieldError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Limpiar todos los errores de un formulario
    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.form-error');
        errorElements.forEach(element => element.remove());
        
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    }

    // Validaciones específicas
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidRUT(rut) {
        // Remover puntos y guiones
        const cleanRUT = rut.replace(/[.-]/g, '');
        
        // Verificar formato básico
        if (!/^[0-9]+[0-9kK]$/.test(cleanRUT)) return false;
        
        // Separar número y dígito verificador
        const number = cleanRUT.slice(0, -1);
        const dv = cleanRUT.slice(-1).toUpperCase();
        
        // Calcular dígito verificador
        const calculatedDV = this.calculateRUTDV(number);
        
        return calculatedDV === dv;
    }

    calculateRUTDV(rut) {
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

    isValidNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    isValidInteger(value) {
        return Number.isInteger(parseFloat(value));
    }

    isValidDate(date) {
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
    }

    isValidPhone(phone) {
        // Validación básica para teléfonos chilenos
        const phoneRegex = /^(\+56|56)?[2-9][0-9]{8}$/;
        const cleanPhone = phone.replace(/[\s-()]/g, '');
        return phoneRegex.test(cleanPhone);
    }

    // Validaciones específicas del dominio
    isValidParcela(numero) {
        const parcelaNum = parseInt(numero);
        return parcelaNum >= 1 && parcelaNum <= 26;
    }

    isValidPeriodo(periodo) {
        const periodoRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
        return periodoRegex.test(periodo);
    }

    isValidMonto(monto) {
        const amount = parseFloat(monto);
        return !isNaN(amount) && amount >= 0;
    }

    // Configurar validación en tiempo real
    setupRealTimeValidation(form) {
        const formId = form.id;
        const rules = this.rules[formId];
        
        if (!rules) return;

        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const fieldRules = rules[fieldName];

            // Validar al perder el foco
            field.addEventListener('blur', () => {
                const errors = this.validateField(field, fieldRules);
                if (errors.length > 0) {
                    this.showFieldError(field, errors[0]);
                } else {
                    this.clearFieldError(field);
                }
            });

            // Limpiar errores al escribir
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.clearFieldError(field);
                }
            });
        });
    }

    // Formatear RUT mientras se escribe
    setupRUTFormatting(field) {
        field.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9kK]/g, '');
            
            if (value.length > 1) {
                const number = value.slice(0, -1);
                const dv = value.slice(-1);
                
                // Formatear con puntos
                const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                value = `${formattedNumber}-${dv}`;
            }
            
            e.target.value = value;
        });
    }

    // Formatear números mientras se escribe
    setupNumberFormatting(field, options = {}) {
        const { decimals = 0, prefix = '', suffix = '' } = options;
        
        field.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            
            if (value) {
                let number = parseInt(value);
                
                if (decimals > 0) {
                    number = number / Math.pow(10, decimals);
                }
                
                const formatted = new Intl.NumberFormat('es-CL', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                }).format(number);
                
                e.target.value = `${prefix}${formatted}${suffix}`;
            }
        });
    }
}

// Crear instancia global
window.validator = new FormValidator();

// Configurar reglas comunes
window.validator.setRules('residente-form', {
    nombreCompleto: {
        required: true,
        minLength: 2,
        maxLength: 100
    },
    rut: {
        required: true,
        rut: true
    },
    nParcela: {
        required: true,
        integer: true,
        min: 1,
        max: 26
    },
    email: {
        required: true,
        email: true
    },
    telefono: {
        required: true,
        phone: true
    },
    valorGastoComun: {
        required: true,
        number: true,
        positive: true
    }
});

window.validator.setRules('pago-form', {
    nParcela: {
        required: true,
        integer: true,
        min: 1,
        max: 26
    },
    fechaPago: {
        required: true,
        date: true
    },
    periodo: {
        required: true,
        custom: (value) => window.validator.isValidPeriodo(value) || 'Formato de período inválido (YYYY-MM)'
    },
    montoPagado: {
        required: true,
        number: true,
        positive: true
    },
    metodoPago: {
        required: true
    }
});

window.validator.setRules('egreso-form', {
    fecha: {
        required: true,
        date: true
    },
    categoria: {
        required: true
    },
    descripcion: {
        required: true,
        minLength: 5,
        maxLength: 500
    },
    proveedor: {
        required: true,
        maxLength: 100
    },
    monto: {
        required: true,
        number: true,
        positive: true
    }
});

// Exportar para uso en otros módulos
window.FormValidator = FormValidator;

