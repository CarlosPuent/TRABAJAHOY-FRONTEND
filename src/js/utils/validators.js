// Form Validation Utilities

export const validators = {
  // Email validation
  email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value) ? null : 'Email inválido';
  },

  // Required field
  required(value) {
    return value && value.trim().length > 0 ? null : 'Este campo es obligatorio';
  },

  // Minimum length
  minLength(min) {
    return (value) => {
      return value && value.length >= min ? null : `Debe tener al menos ${min} caracteres`;
    };
  },

  // Maximum length
  maxLength(max) {
    return (value) => {
      return value && value.length <= max ? null : `No debe exceder ${max} caracteres`;
    };
  },

  // Password strength
  password(value) {
    const errors = [];
    
    if (value.length < 8) {
      errors.push('Al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('Al menos una mayúscula');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('Al menos una minúscula');
    }
    if (!/[0-9]/.test(value)) {
      errors.push('Al menos un número');
    }
    
    return errors.length > 0 ? errors.join(', ') : null;
  },

  // Match two fields
  match(fieldValue, matchValue) {
    return fieldValue === matchValue ? null : 'Los campos no coinciden';
  },

  // URL validation
  url(value) {
    if (!value) return null; // Optional
    try {
      new URL(value);
      return null;
    } catch {
      return 'URL inválida';
    }
  },

  // Number validation
  number(value) {
    return !isNaN(value) ? null : 'Debe ser un número';
  },

  // Min number
  minNumber(min) {
    return (value) => {
      return Number(value) >= min ? null : `Debe ser mayor o igual a ${min}`;
    };
  },

  // Max number
  maxNumber(max) {
    return (value) => {
      return Number(value) <= max ? null : `Debe ser menor o igual a ${max}`;
    };
  },
};

// Validate form with rules
export function validateForm(formData, rules) {
  const errors = {};

  for (const field in rules) {
    const value = formData[field] || '';
    const fieldRules = rules[field];
    
    for (const rule of fieldRules) {
      const error = typeof rule === 'function' ? rule(value) : validators[rule]?.(value);
      
      if (error) {
        errors[field] = error;
        break; // Stop on first error
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Add validation to form inputs
export function addValidationListeners(form, rules) {
  const inputs = form.querySelectorAll('input, textarea, select');

  inputs.forEach(input => {
    const fieldName = input.name || input.id;
    const fieldRules = rules[fieldName];

    if (!fieldRules) return;

    // Validate on blur
    input.addEventListener('blur', () => {
      validateAndShowError(input, fieldRules);
    });

    // Clear error on focus
    input.addEventListener('focus', () => {
      clearFieldError(input);
    });
  });

  // Validate on submit
  form.addEventListener('submit', (e) => {
    let isValid = true;

    inputs.forEach(input => {
      const fieldName = input.name || input.id;
      const fieldRules = rules[fieldName];

      if (fieldRules) {
        const valid = validateAndShowError(input, fieldRules);
        if (!valid) isValid = false;
      }
    });

    if (!isValid) {
      e.preventDefault();
    }

    return isValid;
  });
}

function validateAndShowError(input, rules) {
  const value = input.value;
  let error = null;

  for (const rule of rules) {
    const validator = typeof rule === 'function' ? rule : validators[rule];
    if (validator) {
      error = validator(value);
      if (error) break;
    }
  }

  if (error) {
    showFieldError(input, error);
    return false;
  } else {
    clearFieldError(input);
    return true;
  }
}

function showFieldError(input, message) {
  clearFieldError(input);

  input.classList.add('input--error');
  
  const errorEl = document.createElement('div');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  input.parentNode.appendChild(errorEl);
}

function clearFieldError(input) {
  input.classList.remove('input--error');
  const errorEl = input.parentNode.querySelector('.field-error');
  if (errorEl) {
    errorEl.remove();
  }
}
