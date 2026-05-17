// status-priority-manager.js - Manager for Status and Priority CRUD operations

class StatusPriorityManager {
    constructor() {
        this.modalOverlay = document.getElementById('statusPriorityModal');
        this.openBtn = document.getElementById('openStatusPriorityBtn');
        this.closeBtn = document.getElementById('statusPriorityModalCloseBtn');
        
        this.tabButtons = document.querySelectorAll('.sp-tab-btn');
        this.tabContents = document.querySelectorAll('.sp-tab-content');
        
        this.statusList = document.getElementById('statusList');
        this.priorityList = document.getElementById('priorityList');
        
        this.addStatusBtn = document.getElementById('addStatusBtn');
        this.addPriorityBtn = document.getElementById('addPriorityBtn');
        
        this.statusFormModal = document.getElementById('statusFormModal');
        this.priorityFormModal = document.getElementById('priorityFormModal');
        
        this.statusFormCloseBtn = document.getElementById('statusFormCloseBtn');
        this.priorityFormCloseBtn = document.getElementById('priorityFormCloseBtn');
        
        this.statusForm = document.getElementById('statusForm');
        this.priorityForm = document.getElementById('priorityForm');
        
        this.notificationEl = document.getElementById('notification');
        
        this.currentEditingStatusId = null;
        this.currentEditingPriorityId = null;
        
        this.init();
    }

    init() {
        if (!this.modalOverlay || !this.openBtn) {
            console.warn('StatusPriorityManager: required elements not found');
            return;
        }

        // Main modal controls
        this.openBtn.addEventListener('click', () => this.openModal());
        this.closeBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });

        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Form modal controls
        this.statusFormCloseBtn.addEventListener('click', () => this.closeStatusForm());
        this.priorityFormCloseBtn.addEventListener('click', () => this.closePriorityForm());
        
        this.statusFormModal.addEventListener('click', (e) => {
            if (e.target === this.statusFormModal) this.closeStatusForm();
        });
        this.priorityFormModal.addEventListener('click', (e) => {
            if (e.target === this.priorityFormModal) this.closePriorityForm();
        });

        // Add buttons
        this.addStatusBtn.addEventListener('click', () => this.openStatusForm());
        this.addPriorityBtn.addEventListener('click', () => this.openPriorityForm());

        // Form submissions
        this.statusForm.addEventListener('submit', (e) => this.handleStatusFormSubmit(e));
        this.priorityForm.addEventListener('submit', (e) => this.handlePriorityFormSubmit(e));

        // Cancel buttons
        document.getElementById('statusFormCancelBtn').addEventListener('click', () => this.closeStatusForm());
        document.getElementById('priorityFormCancelBtn').addEventListener('click', () => this.closePriorityForm());

        // Keyboard handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.modalOverlay.classList.contains('modal-active')) this.closeModal();
                if (this.statusFormModal.classList.contains('modal-active')) this.closeStatusForm();
                if (this.priorityFormModal.classList.contains('modal-active')) this.closePriorityForm();
            }
        });

        // Load initial data
        this.loadStatuses();
        this.loadPriorities();
    }

    // Modal management
    openModal() {
        this.modalOverlay.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modalOverlay.classList.remove('modal-active');
        document.body.style.overflow = '';
    }

    switchTab(tabName) {
        // Update active tab button
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('sp-tab-btn--active', btn.dataset.tab === tabName);
        });

        // Update active tab content
        this.tabContents.forEach(content => {
            content.classList.toggle('sp-tab-content--active', content.dataset.tab === tabName);
        });
    }

    // Status management
    async loadStatuses() {
        try {
            const response = await fetch('/api/v1/statuses');
            if (!response.ok) throw new Error('Failed to load statuses');
            
            const statuses = await response.json();
            this.renderStatuses(statuses);
        } catch (error) {
            console.error('Error loading statuses:', error);
            notify.error('Ошибка при загрузке статусов');
        }
    }

    renderStatuses(statuses) {
        this.statusList.innerHTML = statuses.map(status => `
            <div class="sp-item">
                <div class="sp-item__content">
                    <div class="sp-item__name">${this.escapeHtml(status.name)}</div>
                    <div class="sp-item__meta">
                        ${status.is_default ? '<span class="sp-badge">По умолчанию</span>' : ''}
                    </div>
                </div>
                <div class="sp-item__actions">
                    <button type="button" class="sp-btn-edit" data-id="${status.id}" title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button type="button" class="sp-btn-delete" data-id="${status.id}" title="Удалить">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        this.statusList.querySelectorAll('.sp-btn-edit').forEach(btn => {
            btn.addEventListener('click', () => this.editStatus(parseInt(btn.dataset.id)));
        });
        this.statusList.querySelectorAll('.sp-btn-delete').forEach(btn => {
            btn.addEventListener('click', () => this.deleteStatus(parseInt(btn.dataset.id)));
        });
    }

    openStatusForm(statusId = null) {
        this.currentEditingStatusId = statusId;
        const form = this.statusForm;
        
        if (statusId) {
            // Edit mode
            document.querySelector('.sp-form-title').textContent = 'Редактировать статус';
            // Load status data
            this.loadStatusForEdit(statusId);
        } else {
            // Create mode
            document.querySelector('.sp-form-title').textContent = 'Создать новый статус';
            form.reset();
            document.getElementById('statusIsDefault').checked = false;
        }
        
        this.statusFormModal.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    async loadStatusForEdit(statusId) {
        try {
            const response = await fetch(`/api/v1/statuses/${statusId}`);
            if (!response.ok) throw new Error('Failed to load status');
            
            const status = await response.json();
            document.getElementById('statusName').value = status.name;
            document.getElementById('statusIsDefault').checked = status.is_default;
        } catch (error) {
            console.error('Error loading status:', error);
            notify.error('Ошибка при загрузке статуса');
        }
    }

    closeStatusForm() {
        this.statusFormModal.classList.remove('modal-active');
        document.body.style.overflow = '';
        this.currentEditingStatusId = null;
    }

    async handleStatusFormSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('statusName').value.trim();
        const isDefault = document.getElementById('statusIsDefault').checked;

        if (!name) {
            notify.error('Введите название статуса');
            return;
        }

        const payload = { name, is_default: isDefault };
        const method = this.currentEditingStatusId ? 'PUT' : 'POST';
        const url = this.currentEditingStatusId 
            ? `/api/v1/statuses/${this.currentEditingStatusId}`
            : '/api/v1/statuses';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to save status');
            }

            notify.success(this.currentEditingStatusId ? 'Статус обновлён' : 'Статус создан');
            this.closeStatusForm();
            this.loadStatuses();
        } catch (error) {
            console.error('Error saving status:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async editStatus(statusId) {
        this.openStatusForm(statusId);
    }

    async deleteStatus(statusId) {
        // Проверяем использование статуса
        try {
            const response = await fetch(`/api/v1/statuses/${statusId}/projects`);
            if (response.ok) {
                const projects = await response.json();
                if (projects.length > 0) {
                    notify.error(`Статус используется в ${projects.length} проекте(ах). Удаление невозможно.`, 5000);
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking status usage:', error);
        }

        notify.confirm('Вы уверены, что хотите удалить этот статус?', async () => {
            try {
                const response = await fetch(`/api/v1/statuses/${statusId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Failed to delete status');
                }

                notify.success('Статус удалён');
                this.loadStatuses();
            } catch (error) {
                console.error('Error deleting status:', error);
                notify.error('Ошибка: ' + error.message);
            }
        });
    }

    // Priority management
    async loadPriorities() {
        try {
            const response = await fetch('/api/v1/priorities');
            if (!response.ok) throw new Error('Failed to load priorities');
            
            const priorities = await response.json();
            this.renderPriorities(priorities);
        } catch (error) {
            console.error('Error loading priorities:', error);
            notify.error('Ошибка при загрузке приоритетов');
        }
    }

    renderPriorities(priorities) {
        this.priorityList.innerHTML = priorities.map(priority => `
            <div class="sp-item">
                <div class="sp-item__content">
                    <div class="sp-item__color-box" style="background-color: ${this.escapeHtml(priority.color)}"></div>
                    <div class="sp-item__info">
                        <div class="sp-item__name">${this.escapeHtml(priority.name)}</div>
                        <div class="sp-item__order">Порядок: ${priority.order}</div>
                    </div>
                </div>
                <div class="sp-item__actions">
                    <button type="button" class="sp-btn-edit" data-id="${priority.id}" title="Редактировать">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button type="button" class="sp-btn-delete" data-id="${priority.id}" title="Удалить">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        this.priorityList.querySelectorAll('.sp-btn-edit').forEach(btn => {
            btn.addEventListener('click', () => this.editPriority(parseInt(btn.dataset.id)));
        });
        this.priorityList.querySelectorAll('.sp-btn-delete').forEach(btn => {
            btn.addEventListener('click', () => this.deletePriority(parseInt(btn.dataset.id)));
        });
    }

    openPriorityForm(priorityId = null) {
        this.currentEditingPriorityId = priorityId;
        const form = this.priorityForm;
        
        if (priorityId) {
            // Edit mode
            document.querySelector('.sp-priority-form-title').textContent = 'Редактировать приоритет';
            this.loadPriorityForEdit(priorityId);
        } else {
            // Create mode
            document.querySelector('.sp-priority-form-title').textContent = 'Создать новый приоритет';
            form.reset();
            document.getElementById('priorityColor').value = '#CCCCCC';
            document.getElementById('priorityOrder').value = '0';
        }
        
        this.priorityFormModal.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    async loadPriorityForEdit(priorityId) {
        try {
            const response = await fetch(`/api/v1/priorities/${priorityId}`);
            if (!response.ok) throw new Error('Failed to load priority');
            
            const priority = await response.json();
            document.getElementById('priorityName').value = priority.name;
            document.getElementById('priorityColor').value = priority.color;
            document.getElementById('priorityOrder').value = priority.order;
        } catch (error) {
            console.error('Error loading priority:', error);
            notify.error('Ошибка при загрузке приоритета');
        }
    }

    closePriorityForm() {
        this.priorityFormModal.classList.remove('modal-active');
        document.body.style.overflow = '';
        this.currentEditingPriorityId = null;
    }

    async handlePriorityFormSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('priorityName').value.trim();
        const color = document.getElementById('priorityColor').value;
        const order = parseInt(document.getElementById('priorityOrder').value) || 0;

        if (!name) {
            notify.error('Введите название приоритета');
            return;
        }

        const payload = { name, color, order };
        const method = this.currentEditingPriorityId ? 'PUT' : 'POST';
        const url = this.currentEditingPriorityId 
            ? `/api/v1/priorities/${this.currentEditingPriorityId}`
            : '/api/v1/priorities';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to save priority');
            }

            notify.success(this.currentEditingPriorityId ? 'Приоритет обновлён' : 'Приоритет создан');
            this.closePriorityForm();
            this.loadPriorities();
        } catch (error) {
            console.error('Error saving priority:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async editPriority(priorityId) {
        this.openPriorityForm(priorityId);
    }

    async deletePriority(priorityId) {
        // Проверяем использование приоритета
        try {
            const response = await fetch(`/api/v1/priorities/${priorityId}/projects`);
            if (response.ok) {
                const projects = await response.json();
                if (projects.length > 0) {
                    notify.error(`Приоритет используется в ${projects.length} проекте(ах). Удаление невозможно.`, 5000);
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking priority usage:', error);
        }

        notify.confirm('Вы уверены, что хотите удалить этот приоритет?', async () => {
            try {
                const response = await fetch(`/api/v1/priorities/${priorityId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.detail || 'Failed to delete priority');
                }

                notify.success('Приоритет удалён');
                this.loadPriorities();
            } catch (error) {
                console.error('Error deleting priority:', error);
                notify.error('Ошибка: ' + error.message);
            }
        });
    }

    // Utilities
    showNotification(message, type = 'success') {
        if (!this.notificationEl) return;
        
        this.notificationEl.textContent = message;
        this.notificationEl.className = 'notification ' + type;
        this.notificationEl.classList.remove('hidden');
        
        setTimeout(() => this.notificationEl.classList.add('show'), 10);
        setTimeout(() => {
            this.notificationEl.classList.remove('show');
            setTimeout(() => this.notificationEl.classList.add('hidden'), 300);
        }, 4000);
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        new StatusPriorityManager();
    } catch (error) {
        console.error('StatusPriorityManager init error:', error);
    }
});
