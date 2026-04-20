// filter-modal.js

class FilterModal {
    modalOverlay;
    openBtn;
    closeBtn;
    cancelBtn;
    applyBtn;
    filterSelectors;
    filterDropdowns;
    projectsContainer;

    constructor() {
        const modal = document.getElementById('filterModal');
        if (!modal) throw new Error('Modal element not found');
        this.modalOverlay = modal;

        const openButton = document.querySelector('.btn-filter');
        if (!openButton) throw new Error('Filter button not found');
        this.openBtn = openButton;

        const closeButton = document.getElementById('modalCloseBtn');
        if (!closeButton) throw new Error('Close button not found');
        this.closeBtn = closeButton;

        const cancelButton = document.getElementById('modalCancelBtn');
        if (!cancelButton) throw new Error('Cancel button not found');
        this.cancelBtn = cancelButton;

        const applyButton = document.getElementById('modalApplyBtn');
        if (!applyButton) throw new Error('Apply button not found');
        this.applyBtn = applyButton;

        this.filterSelectors = document.querySelectorAll('.filter-selector');
        this.filterDropdowns = document.querySelectorAll('.filter-dropdown');
        this.projectsContainer = document.querySelector('.projects-grid');

        this.init();
        this.loadInitialData();
    }

    async loadInitialData() {
        try {
            await this.loadProjects();
            const [statuses, priorities, employees] = await Promise.all([
                this.fetchStatuses(),
                this.fetchPriorities(),
                this.fetchEmployees()
            ]);
            this.updateStatusFilter(statuses);
            this.updatePriorityFilter(priorities);
            this.updateResponsibleFilter(employees);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    async loadProjects(filters) {
        try {
            let url = '/api/v1/projects';
            if (filters) {
                const params = new URLSearchParams();
                if (filters.status.length > 0) params.append('status', filters.status[0]);
                if (filters.priority.length > 0) params.append('priority', filters.priority[0]);
                if (filters.responsible.length > 0) params.append('responsible', filters.responsible[0]);
                const query = params.toString();
                if (query) url += '?' + query;
            }
            console.log('Загрузка проектов:', url);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки');
            const projects = await response.json();
            this.renderProjects(projects);
        } catch (error) {
            console.error('Ошибка:', error);
            if (this.projectsContainer) {
                this.projectsContainer.innerHTML = `
                    <div class="no-projects" style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
                        Ошибка загрузки. Убедитесь, что бэкенд запущен.
                    </div>
                `;
            }
        }
    }

    renderProjects(projects) {
        if (!this.projectsContainer) return;
        if (projects.length === 0) {
            this.projectsContainer.innerHTML = `
                <div class="no-projects" style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">
                    Нет проектов
                </div>
            `;
            return;
        }
        this.projectsContainer.innerHTML = projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <h3 class="card-title text-gradient">${this.escapeHtml(project.name)}</h3>
                <div class="card-body">
                    <div class="card-row">
                        <span class="label">Status</span>
                        <span class="pill">${this.escapeHtml(project.status?.name || 'Unknown')}</span>
                    </div>
                    <div class="card-row">
                        <span class="label">Priority</span>
                        <span class="pill" style="background-color: ${project.priority?.color || '#ccc'}20;">
                            ${this.escapeHtml(project.priority?.name || 'Unknown')}
                        </span>
                    </div>
                    <div class="card-row">
                        <span class="label">Responsible</span>
                        <span class="pill">${this.escapeHtml(project.manager?.fullName || 'Unassigned')}</span>
                    </div>
                    ${project.progress !== undefined ? `
                    <div class="card-row">
                        <span class="label">Progress</span>
                        <div style="width:100%;height:20px;background:#f0f0f0;border-radius:10px;overflow:hidden;">
                            <div style="width:${project.progress}%;height:100%;background:linear-gradient(90deg,#C05BF0,#4F7FFF);"></div>
                        </div>
                        <span style="margin-left:8px;">${project.progress}%</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                    const projectId = card.dataset.projectId;
                if (projectId) {
                    window.location.href = `/project.html?id=${projectId}`;
                }
            });
        });
    }


    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, (m) => {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }

    async fetchStatuses() {
        const response = await fetch('/api/v1/statuses');
        return response.json();
    }

    async fetchPriorities() {
        const response = await fetch('/api/v1/priorities');
        return response.json();
    }

    async fetchEmployees() {
        const response = await fetch('/api/v1/employees');
        return response.json();
    }

    updateStatusFilter(statuses) {
        const dropdown = document.getElementById('statusDropdown');
        if (!dropdown) return;
        dropdown.innerHTML = statuses.map(s => `
            <label class="filter-option">
                <input type="checkbox" name="status" value="${s.name.toLowerCase()}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(s.name)}</span>
            </label>
        `).join('');
    }

    updatePriorityFilter(priorities) {
        const dropdown = document.getElementById('priorityDropdown');
        if (!dropdown) return;
        dropdown.innerHTML = priorities.map(p => `
            <label class="filter-option">
                <input type="checkbox" name="priority" value="${p.name.toLowerCase()}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(p.name)}</span>
            </label>
        `).join('');
    }

    updateResponsibleFilter(employees) {
        const dropdown = document.getElementById('responsibleDropdown');
        if (!dropdown) return;
        dropdown.innerHTML = employees.map(e => `
            <label class="filter-option">
                <input type="checkbox" name="responsible" value="${e.id}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(e.fullName)}</span>
            </label>
        `).join('');
    }

    init() {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.applyBtn.addEventListener('click', () => this.applyFilters());

        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('modal-active')) {
                this.close();
            }
        });

        this.initDropdowns();
    }

    initDropdowns() {
        this.filterSelectors.forEach((selector) => {
            selector.addEventListener('click', (e) => {
                e.stopPropagation();
                const currentSelector = selector;
                const dropdown = currentSelector.nextElementSibling;
                this.closeAllDropdownsExcept(dropdown);
                dropdown.classList.toggle('show');
                currentSelector.classList.toggle('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-group')) {
                this.closeAllDropdowns();
            }
        });
    }

    closeAllDropdownsExcept(exceptDropdown = null) {
        this.filterDropdowns.forEach((dropdown) => {
            if (exceptDropdown !== dropdown) {
                dropdown.classList.remove('show');
                const selector = dropdown.previousElementSibling;
                if (selector) selector.classList.remove('active');
            }
        });
    }

    closeAllDropdowns() {
        this.filterDropdowns.forEach((dropdown) => {
            dropdown.classList.remove('show');
            const selector = dropdown.previousElementSibling;
            if (selector) selector.classList.remove('active');
        });
    }

    open() {
        this.modalOverlay.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modalOverlay.classList.remove('modal-active');
        document.body.style.overflow = '';
        this.closeAllDropdowns();
    }

    async applyFilters() {
        const filters = {
            status: [],
            priority: [],
            responsible: []
        };

        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach((checkbox) => {
            const name = checkbox.name;
            if (filters.hasOwnProperty(name)) {
                filters[name].push(checkbox.value);
            }
        });

        console.log('Applied filters:', filters);

        let url = '/api/v1/projects';
        const params = new URLSearchParams();
        if (filters.status.length > 0) params.append('status', filters.status[0]);
        if (filters.priority.length > 0) params.append('priority', filters.priority[0]);
        if (filters.responsible.length > 0) params.append('responsible', filters.responsible[0]);

        const queryString = params.toString();
        if (queryString) url += '?' + queryString;

        console.log('Загрузка отфильтрованных проектов:', url);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки');
            const projects = await response.json();
            console.log('Получено проектов:', projects.length);
            this.renderProjects(projects);
            this.updateAllSelectorText(filters);
            this.close();
        } catch (error) {
            console.error('Ошибка при применении фильтров:', error);
        }
    }

    updateAllSelectorText(filters) {
        this.updateSelectorText('status', filters.status);
        this.updateSelectorText('priority', filters.priority);
        this.updateSelectorText('responsible', filters.responsible);
    }

    updateSelectorText(filterType, values) {
        const selector = document.querySelector(
            `.filter-selector[data-filter="${filterType}"] .filter-placeholder`
        );
        if (!selector) return;

        const defaultTexts = {
            'status': 'Choosing a status',
            'priority': 'Choosing a priority',
            'responsible': 'Choosing a responsible'
        };

        if (values.length === 0) {
            selector.textContent = defaultTexts[filterType];
        } else if (values.length === 1) {
            selector.textContent = values[0].charAt(0).toUpperCase() + values[0].slice(1);
        } else {
            selector.textContent = `${values.length} selected`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, есть ли контейнер с проектами
    if (document.querySelector('.projects-grid')) {
        try {
            new FilterModal();
            console.log('FilterModal initialized successfully');
        } catch (error) {
            console.error('Failed to initialize FilterModal:', error);
        }
    }
});