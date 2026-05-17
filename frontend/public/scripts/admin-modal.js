// admin-modal.js

class AdminModal {
    modalOverlay;
    openBtn;
    closeBtn;
    importInput;
    
    // Элементы кастомного подтверждения
    confirmOverlay;
    confirmTitle;
    confirmMessage;
    confirmSuccessBtn;
    confirmCancelBtn;
    validationErrorsList;

    constructor() {
        console.log('AdminModal: Constructor started');
        const modal = document.getElementById('adminModal');
        if (!modal) {
            console.warn('AdminModal: modal not found, skipping');
            return;
        }
        this.modalOverlay = modal;

        const openButton = document.querySelector('.btn__log');
        if (!openButton) {
            console.warn('AdminModal: open button not found, skipping');
            return;
        }
        this.openBtn = openButton;

        const closeButton = document.getElementById('adminModalCloseBtn');
        if (!closeButton) {
            console.warn('AdminModal: close button not found, skipping');
            return;
        }
        this.closeBtn = closeButton;

        this.importInput = document.getElementById('csvImportInput');

        // Инициализация элементов подтверждения
        this.confirmOverlay = document.getElementById('confirmModal');
        this.confirmTitle = document.getElementById('confirmTitle');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.confirmSuccessBtn = document.getElementById('confirmSuccessBtn');
        this.confirmCancelBtn = document.getElementById('confirmCancelBtn');
        this.validationErrorsList = document.getElementById('validationErrorsList');

        this.init();
    }

    init() {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());

        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modalOverlay.classList.contains('modal-active')) this.close();
                if (this.confirmOverlay && this.confirmOverlay.classList.contains('modal-active')) this.closeConfirm();
            }
        });

        if (this.importInput) {
            this.importInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        this.initActionButtons();
    }

    initActionButtons() {
        const buttons = Array.from(document.querySelectorAll('.admin-btn'));
        
        const addProjectBtn = buttons.find(btn => btn.textContent?.includes('Add a project'));
        const exportBtn = buttons.find(btn => btn.textContent?.includes('Export'));
        const importBtn = buttons.find(btn => btn.textContent?.includes('Import'));
        const addEmployeeBtn = buttons.find(btn => btn.textContent?.includes('Add an employee'));
        const editEmployeeBtn = buttons.find(btn => btn.textContent?.includes('Edit an employee'));

        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => {
                this.close();
                window.location.assign('project.html?new=true');
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleExport();
                this.close();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.importInput) this.importInput.click();
            });
        }

        if (addEmployeeBtn) {
            addEmployeeBtn.addEventListener('click', () => this.close());
        }

        if (editEmployeeBtn) {
            editEmployeeBtn.addEventListener('click', () => this.close());
        }
    }

    open() {
        this.modalOverlay.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modalOverlay.classList.remove('modal-active');
        document.body.style.overflow = '';
    }

    // Кастомное подтверждение
    async askConfirm(title, message, errors = []) {
        return new Promise((resolve) => {
            if (!this.confirmOverlay) {
                resolve(confirm(message));
                return;
            }

            this.confirmTitle.textContent = title;
            this.confirmMessage.textContent = message;
            
            if (errors.length > 0) {
                this.validationErrorsList.innerHTML = errors.map(err => `<div class="validation-error-item">${err}</div>`).join('');
                this.validationErrorsList.classList.remove('hidden');
            } else {
                this.validationErrorsList.classList.add('hidden');
            }

            this.confirmOverlay.classList.add('modal-active');
            
            const handleSuccess = () => {
                this.closeConfirm();
                resolve(true);
            };
            
            const handleCancel = () => {
                this.closeConfirm();
                resolve(false);
            };

            this.confirmSuccessBtn.onclick = handleSuccess;
            this.confirmCancelBtn.onclick = handleCancel;
            this.confirmOverlay.onclick = (e) => {
                if (e.target === this.confirmOverlay) handleCancel();
            };
        });
    }

    closeConfirm() {
        this.confirmOverlay.classList.remove('modal-active');
        if (!this.modalOverlay.classList.contains('modal-active')) {
            document.body.style.overflow = '';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.textContent = message;
        notification.className = 'notification ' + type;
        notification.classList.remove('hidden');
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.classList.add('hidden'), 300);
        }, 4000);
    }

    async handleExport() {
        try {
            this.showNotification('Подготовка файла экспорта...', 'info');
            const response = await fetch('/api/v1/csv/export');
            if (!response.ok) throw new Error('Export failed');
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `projects_export_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Экспорт завершён успешно!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Ошибка при экспорте: ' + error.message, 'error');
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        event.target.value = '';
        if (!file.name.endsWith('.csv')) {
            this.showNotification('Пожалуйста, выберите CSV файл', 'error');
            return;
        }
        await this.processImport(file);
    }

    async processImport(file) {
        try {
            this.close();
            this.showNotification('Валидация файла...', 'info');
            
            const formData = new FormData();
            formData.append('file', file);

            const valResponse = await fetch('/api/v1/csv/validate', {
                method: 'POST',
                body: formData
            });

            if (!valResponse.ok) {
                const err = await valResponse.json();
                throw new Error(err.detail || 'Validation request failed');
            }

            const valResult = await valResponse.json();

            if (!valResult.is_valid) {
                await this.askConfirm(
                    'Ошибка валидации', 
                    `В файле обнаружено ${valResult.error_count} ошибок. Импорт невозможен.`,
                    valResult.errors
                );
                return;
            }

            // Используем кастомное модальное окно подтверждения
            const confirmed = await this.askConfirm(
                'Подтверждение импорта',
                `Файл успешно прошел проверку. Будет импортировано ${valResult.stats.total_rows} строк. Продолжить?`
            );

            if (confirmed) {
                this.showNotification('Импорт данных...', 'info');
                const impResponse = await fetch('/api/v1/csv/import', {
                    method: 'POST',
                    body: formData
                });

                if (!impResponse.ok) {
                    const err = await impResponse.json();
                    throw new Error(err.detail || 'Import failed');
                }

                const impResult = await impResponse.json();
                this.showNotification(`Успешно добавлено: ${impResult.imported} строк`, 'success');
                
                setTimeout(() => window.location.reload(), 2000);
            }

        } catch (error) {
            console.error('Import process error:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        new AdminModal();
    } catch (error) {
        console.error('AdminModal init error:', error);
    }
});
