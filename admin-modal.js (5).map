// scripts/admin-modal.ts

class AdminModal {
    private modalOverlay: HTMLElement;
    private openBtn: HTMLElement;
    private closeBtn: HTMLElement;

    constructor() {
        const modal = document.getElementById('adminModal');
        if (!modal) throw new Error('Admin modal element not found');
        this.modalOverlay = modal;

        const openButton = document.querySelector('.btn__log');
        if (!openButton) throw new Error('Admin panel button not found');
        this.openBtn = openButton as HTMLElement;

        const closeButton = document.getElementById('adminModalCloseBtn');
        if (!closeButton) throw new Error('Admin modal close button not found');
        this.closeBtn = closeButton;

        this.init();
    }

    private init(): void {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());

        // Закрытие по клику на оверлей
        this.modalOverlay.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.modalOverlay) {
                this.close();
            }
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('modal-active')) {
                this.close();
            }
        });

        // Инициализация кнопок действий
        this.initActionButtons();
    }

    private initActionButtons(): void {
        const addProjectBtn = Array.from(document.querySelectorAll('.admin-btn')).find(
            btn => btn.textContent?.includes('Add a project')
        );
        
        const exportBtn = Array.from(document.querySelectorAll('.admin-btn')).find(
            btn => btn.textContent?.includes('Export')
        );
        
        const addEmployeeBtn = Array.from(document.querySelectorAll('.admin-btn')).find(
            btn => btn.textContent?.includes('Add an employee')
        );
        
        const editEmployeeBtn = Array.from(document.querySelectorAll('.admin-btn')).find(
            btn => btn.textContent?.includes('Edit an employee')
        );

        if (addProjectBtn) {
            addProjectBtn.addEventListener('click', () => {
                this.close();
                window.location.assign('/project.html');
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('Export clicked');
                this.close();
                // Здесь будет логика экспорта
            });
        }

        if (addEmployeeBtn) {
            addEmployeeBtn.addEventListener('click', () => {
                console.log('Add employee clicked');
                this.close();
                // Здесь будет логика добавления сотрудника
            });
        }

        if (editEmployeeBtn) {
            editEmployeeBtn.addEventListener('click', () => {
                console.log('Edit employee clicked');
                this.close();
                // Здесь будет логика редактирования сотрудника
            });
        }
    }

    private open(): void {
        this.modalOverlay.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    private close(): void {
        this.modalOverlay.classList.remove('modal-active');
        document.body.style.overflow = '';
    }
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        new AdminModal();
        console.log('AdminModal initialized successfully');
    } catch (error) {
        console.error('Failed to initialize AdminModal:', error);
    }
});