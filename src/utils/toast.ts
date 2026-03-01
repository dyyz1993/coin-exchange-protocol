/**
 * Toast 通知工具
 * 用于替代 alert()，提供更好的用户体验
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right';
}

class ToastManager {
  private container: HTMLDivElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.createContainer();
    }
  }

  private createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(this.container);
  }

  private showToast(message: string, type: ToastType, options: ToastOptions = {}) {
    if (!this.container && typeof document !== 'undefined') {
      this.createContainer();
    }

    if (!this.container) return;

    const toast = document.createElement('div');
    const bgColor = this.getBackgroundColor(type);
    const icon = this.getIcon(type);

    toast.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 300px;
      max-width: 500px;
      animation: slideIn 0.3s ease-out;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
    `;

    toast.innerHTML = `
      <span style="font-size: 20px;">${icon}</span>
      <span style="flex: 1;">${message}</span>
      <button style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; opacity: 0.7;" onclick="this.parentElement.remove()">×</button>
    `;

    this.container.appendChild(toast);

    const duration = options.duration || 3000;
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  private getBackgroundColor(type: ToastType): string {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
    }
  }

  private getIcon(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
    }
  }

  success(message: string, options?: ToastOptions) {
    this.showToast(message, 'success', options);
  }

  error(message: string, options?: ToastOptions) {
    this.showToast(message, 'error', options);
  }

  warning(message: string, options?: ToastOptions) {
    this.showToast(message, 'warning', options);
  }

  info(message: string, options?: ToastOptions) {
    this.showToast(message, 'info', options);
  }
}

// 添加动画样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export const toast = new ToastManager();
