// admin-modal.js

class AdminModal {
    modalOverlay;
    openBtn;
    closeBtn;

    constructor() {
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

        this.init();
    }

    init() {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());

        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('modal-active')) {
                this.close();
            }
        });

        this.initActionButtons();
    }

    initActionButtons() {
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
            window.location.assign('project.html?new=true');
        });
}
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('Export clicked');
                this.close();
            });
        }
        if (addEmployeeBtn) {
            addEmployeeBtn.addEventListener('click', () => {
                console.log('Add employee clicked');
                this.close();
            });
        }
        if (editEmployeeBtn) {
            editEmployeeBtn.addEventListener('click', () => {
                console.log('Edit employee clicked');
                this.close();
            });
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
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        new AdminModal();
        console.log('AdminModal initialized successfully');
    } catch (error) {
        console.error('Failed to initialize AdminModal:', error);
    }
});