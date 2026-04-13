// Toast Notification Component
import { store } from '@core/store';

export class ToastComponent {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.init();
  }

  init() {
    // Create toast container
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);

    // Subscribe to store changes
    store.subscribe('toasts', (toasts) => {
      this.render(toasts);
    });

    // Add styles
    this.addStyles();
  }

  render(toasts) {
    this.container.innerHTML = '';
    toasts.forEach(toast => {
      this.showToast(toast);
    });
  }

  showToast(toast) {
    const toastEl = document.createElement('div');
    toastEl.className = `toast toast--${toast.type}`;
    toastEl.innerHTML = `
      <div class="toast__content">
        ${this.getIcon(toast.type)}
        <div class="toast__message">${toast.message}</div>
        <button class="toast__close" aria-label="Cerrar">&times;</button>
      </div>
      ${toast.type === 'error' ? `<div class="toast__progress toast__progress--error"></div>` : ''}
    `;

    this.container.appendChild(toastEl);

    // Auto remove after delay
    const delay = toast.duration || 4000;
    const timeout = setTimeout(() => {
      this.removeToast(toastEl, toast.id);
    }, delay);

    // Close button handler
    const closeBtn = toastEl.querySelector('.toast__close');
    closeBtn.addEventListener('click', () => {
      clearTimeout(timeout);
      this.removeToast(toastEl, toast.id);
    });

    // Animate in
    requestAnimationFrame(() => {
      toastEl.classList.add('toast--visible');
    });
  }

  removeToast(element, id) {
    element.classList.remove('toast--visible');
    element.classList.add('toast--hiding');
    
    setTimeout(() => {
      element.remove();
      if (id) {
        store.removeToast(id);
      }
    }, 300);
  }

  getIcon(type) {
    const icons = {
      success: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`,
      error: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      warning: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`,
      info: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`,
    };
    return icons[type] || icons.info;
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
        min-width: 300px;
        max-width: 500px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
      }

      .toast--visible {
        opacity: 1;
        transform: translateX(0);
      }

      .toast--hiding {
        opacity: 0;
        transform: translateX(100%);
      }

      .toast__content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
      }

      .toast__message {
        flex: 1;
        font-size: 14px;
        color: #333;
      }

      .toast__close {
        background: none;
        border: none;
        font-size: 24px;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .toast__close:hover {
        color: #333;
      }

      .toast--success {
        border-left: 4px solid #10b981;
      }

      .toast--success svg {
        color: #10b981;
      }

      .toast--error {
        border-left: 4px solid #ef4444;
      }

      .toast--error svg {
        color: #ef4444;
      }

      .toast--warning {
        border-left: 4px solid #f59e0b;
      }

      .toast--warning svg {
        color: #f59e0b;
      }

      .toast--info {
        border-left: 4px solid #3b82f6;
      }

      .toast--info svg {
        color: #3b82f6;
      }

      @media (max-width: 768px) {
        .toast-container {
          top: 10px;
          right: 10px;
          left: 10px;
        }

        .toast {
          min-width: unset;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
