// Система кастомных уведомлений
class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            padding: 16px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            line-height: 1.4;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
            pointer-events: auto;
            max-width: 400px;
            word-wrap: break-word;
        `;

        const colors = {
            success: { bg: '#10b981', text: '#ffffff' },
            error: { bg: '#ef4444', text: '#ffffff' },
            warning: { bg: '#f59e0b', text: '#ffffff' },
            info: { bg: '#3b82f6', text: '#ffffff' }
        };

        const color = colors[type] || colors.info;
        notification.style.backgroundColor = color.bg;
        notification.style.color = color.text;
        notification.textContent = message;

        this.container.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        return notification;
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    confirm(message, onConfirm, onCancel) {
        const modalOverlay = document.createElement('div');
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 400px;
            box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
            animation: modalSlideIn 0.3s ease;
        `;

        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0 0 16px 0;
            font-size: 18px;
            font-weight: 700;
            color: #171717;
        `;
        title.textContent = 'Подтверждение';

        const messageEl = document.createElement('p');
        messageEl.style.cssText = `
            margin: 0 0 24px 0;
            font-size: 14px;
            line-height: 1.6;
            color: #686B73;
        `;
        messageEl.textContent = message;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        `;

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: 2px solid #e6e8ec;
            background: white;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            color: #686B73;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        cancelBtn.onmouseover = () => {
            cancelBtn.style.borderColor = '#C05BF0';
            cancelBtn.style.color = '#C05BF0';
        };
        cancelBtn.onmouseout = () => {
            cancelBtn.style.borderColor = '#e6e8ec';
            cancelBtn.style.color = '#686B73';
        };

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Подтвердить';
        confirmBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            background: linear-gradient(90deg, #C05BF0 0%, #4F7FFF 100%);
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
        `;
        confirmBtn.onmouseover = () => {
            confirmBtn.style.opacity = '0.9';
            confirmBtn.style.transform = 'translateY(-1px)';
        };
        confirmBtn.onmouseout = () => {
            confirmBtn.style.opacity = '1';
            confirmBtn.style.transform = 'translateY(0)';
        };

        const close = () => {
            modalOverlay.style.animation = 'modalSlideOut 0.3s ease';
            setTimeout(() => modalOverlay.remove(), 300);
        };

        cancelBtn.addEventListener('click', () => {
            close();
            if (onCancel) onCancel();
        });

        confirmBtn.addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                close();
                if (onCancel) onCancel();
            }
        });

        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);

        modal.appendChild(title);
        modal.appendChild(messageEl);
        modal.appendChild(buttonContainer);
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);

        // Add animations if not already present
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
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
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                @keyframes modalSlideIn {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                @keyframes modalSlideOut {
                    from {
                        transform: scale(1);
                        opacity: 1;
                    }
                    to {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Глобальный экземпляр
const notify = new NotificationSystem();
