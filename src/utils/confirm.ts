/**
 * 确认对话框工具
 * 用于替代 confirm()，提供更好的用户体验
 */

export type ConfirmType = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

class ConfirmManager {
  private container: HTMLDivElement | null = null;
  private resolvePromise: ((value: boolean) => void) | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.createContainer();
    }
  }

  private createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'confirm-dialog-container';
    document.body.appendChild(this.container);
  }

  show(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.container && typeof document !== 'undefined') {
        this.createContainer();
      }

      if (!this.container) {
        resolve(false);
        return;
      }

      this.resolvePromise = resolve;

      const {
        title = '确认操作',
        confirmText = '确认',
        cancelText = '取消',
        type = 'warning',
      } = options;

      const icon = this.getIcon(type);
      const iconBg = this.getIconBg(type);
      const confirmBtnColor = this.getConfirmBtnColor(type);

      const dialogHTML = `
        <div class="confirm-overlay" style="
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        ">
          <div class="confirm-dialog" style="
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 90%;
            animation: scaleIn 0.2s ease-out;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 20px;
              border-bottom: 1px solid #e5e7eb;
            ">
              <div style="
                background: ${iconBg};
                border-radius: 50%;
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
              ">${icon}</div>
              <h3 style="
                font-size: 20px;
                font-weight: bold;
                color: #111827;
                margin: 0;
              ">${title}</h3>
            </div>
            <div style="
              padding: 20px;
            ">
              <p style="
                color: #4b5563;
                font-size: 15px;
                margin: 0;
                line-height: 1.6;
              ">${message}</p>
            </div>
            <div style="
              display: flex;
              gap: 12px;
              padding: 20px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              border-radius: 0 0 12px 12px;
            ">
              <button class="confirm-cancel" style="
                flex: 1;
                padding: 10px 20px;
                background: #e5e7eb;
                color: #374151;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s;
              " onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'">
                ${cancelText}
              </button>
              <button class="confirm-ok" style="
                flex: 1;
                padding: 10px 20px;
                background: ${confirmBtnColor};
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 500;
                cursor: pointer;
                transition: opacity 0.2s;
              " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      this.container.innerHTML = dialogHTML;

      // 绑定事件
      const overlay = this.container.querySelector('.confirm-overlay') as HTMLElement;
      const cancelBtn = this.container.querySelector('.confirm-cancel') as HTMLButtonElement;
      const okBtn = this.container.querySelector('.confirm-ok') as HTMLButtonElement;

      cancelBtn.onclick = () => this.handleClose(false);
      okBtn.onclick = () => this.handleClose(true);
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          this.handleClose(false);
        }
      };
    });
  }

  private handleClose(result: boolean) {
    if (this.container) {
      const overlay = this.container.querySelector('.confirm-overlay') as HTMLElement;
      if (overlay) {
        overlay.style.animation = 'fadeOut 0.2s ease-in';
        setTimeout(() => {
          if (this.container) {
            this.container.innerHTML = '';
          }
        }, 200);
      }
    }
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
  }

  private getIcon(type: ConfirmType): string {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  }

  private getIconBg(type: ConfirmType): string {
    switch (type) {
      case 'danger':
        return '#fee2e2';
      case 'warning':
        return '#fef3c7';
      case 'info':
        return '#dbeafe';
    }
  }

  private getConfirmBtnColor(type: ConfirmType): string {
    switch (type) {
      case 'danger':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
    }
  }
}

// 添加动画样式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export const confirm = new ConfirmManager();
