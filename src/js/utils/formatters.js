// Formatting Utilities

export const formatters = {
  // Date formatting
  date(value, options = {}) {
    if (!value) return '';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
  },

  // DateTime formatting
  datetime(value, options = {}) {
    if (!value) return '';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return date.toLocaleDateString('es-ES', { ...defaultOptions, ...options });
  },

  // Time formatting
  time(value) {
    if (!value) return '';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Relative time (e.g., "hace 2 días")
  relativeTime(value) {
    if (!value) return '';
    
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return 'hace un momento';
    if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffMonths < 12) return `hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`;
    return `hace ${diffYears} año${diffYears > 1 ? 's' : ''}`;
  },

  // Currency formatting
  currency(value, options = {}) {
    if (value === null || value === undefined) return '';
    
    const defaultOptions = {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    return new Intl.NumberFormat('es-ES', { ...defaultOptions, ...options }).format(value);
  },

  // Number formatting
  number(value, options = {}) {
    if (value === null || value === undefined) return '';
    
    const defaultOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    };

    return new Intl.NumberFormat('es-ES', { ...defaultOptions, ...options }).format(value);
  },

  // Percentage formatting
  percentage(value, decimals = 0) {
    if (value === null || value === undefined) return '';
    
    return new Intl.NumberFormat('es-ES', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  },

  // File size formatting
  fileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Phone number formatting
  phone(value) {
    if (!value) return '';
    
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return value;
  },

  // Truncate text
  truncate(text, length = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= length) return text;
    
    return text.substring(0, length).trim() + suffix;
  },

  // Capitalize first letter
  capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  },

  // Title case
  titleCase(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Slug to title
  slugToTitle(slug) {
    if (!slug) return '';
    return slug
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },
};

// Helper function to format salary range
export function formatSalaryRange(min, max, currency = 'USD') {
  if (!min && !max) return 'A convenir';
  
  const minFormatted = formatters.currency(min, { currency });
  const maxFormatted = formatters.currency(max, { currency });
  
  if (min && max) {
    return `${minFormatted} - ${maxFormatted}`;
  }
  
  return min ? `Desde ${minFormatted}` : `Hasta ${maxFormatted}`;
}

// Helper function to format location
export function formatLocation(city, country) {
  if (!city && !country) return 'No especificado';
  if (city && country) return `${city}, ${country}`;
  return city || country;
}
