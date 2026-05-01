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

    // Хранение текущих активных фильтров и поискового запроса
    _currentFilters = { status: [], priority: [], responsible: [] };
    _currentSearch = '';

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

    async loadProjects(filters, search) {
        try {
            const params = new URLSearchParams();

            if (filters) {
                // Передаём числовые ID — бэкенд принимает integer
                if (filters.status.length > 0) params.append('status', filters.status[0]);
                if (filters.priority.length > 0) params.append('priority', filters.priority[0]);
                if (filters.responsible.length > 0) params.append('responsible', filters.responsible[0]);
            }

            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            const queryString = params.toString();
            const url = '/api/v1/projects' + (queryString ? '?' + queryString : '');

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
                        <span class="pill">${this.escapeHtml(project.manager?.full_name || 'Unassigned')}</span>
                    </div>
                    ${project.progress !== undefined ? `
            <div class="card-row card-row--progress">
                <span class="label">Progress</span>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${project.progress}%"></div>
                </div>
                <span class="progress-percentage">${Math.round(project.progress)}%</span>
            </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.project-card[data-project-id]').forEach(card => {
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
        // Используем числовой ID для передачи в API
        dropdown.innerHTML = statuses.map(s => `
            <label class="filter-option">
                <input type="checkbox" name="status" value="${s.id}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(s.name)}</span>
            </label>
        `).join('');
    }

    updatePriorityFilter(priorities) {
        const dropdown = document.getElementById('priorityDropdown');
        if (!dropdown) return;
        // Используем числовой ID для передачи в API
        dropdown.innerHTML = priorities.map(p => `
            <label class="filter-option">
                <input type="checkbox" name="priority" value="${p.id}">
                <span class="checkbox-custom"></span>
                <span style="display:flex;align-items:center;gap:6px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${p.color || '#ccc'};flex-shrink:0;"></span>
                    ${this.escapeHtml(p.name)}
                </span>
            </label>
        `).join('');
    }

    updateResponsibleFilter(employees) {
        const dropdown = document.getElementById('responsibleDropdown');
        if (!dropdown) return;
        // Используем числовой ID для передачи в API
        dropdown.innerHTML = employees.map(e => `
            <label class="filter-option">
                <input type="checkbox" name="responsible" value="${e.id}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(e.full_name)}</span>
            </label>
        `).join('');
    }

    init() {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => {
            // Сброс чекбоксов при отмене
            this._resetCheckboxes();
            this.close();
        });
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
        this.initSearchButton();
    }

    // Инициализация кнопки поиска в хедере (btn__reg)
    initSearchButton() {
        const searchBtn = document.querySelector('.btn__reg');
        if (!searchBtn) return;

        const searchModal = document.getElementById('searchModal');
        if (!searchModal) return;

        const searchInput = document.getElementById('searchInput');
        const searchCloseBtn = document.getElementById('searchModalCloseBtn');
        const searchClearBtn = document.getElementById('searchClearBtn');

        searchBtn.addEventListener('click', () => {
            searchModal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';
            if (searchInput) {
                searchInput.value = this._currentSearch;
                searchInput.focus();
            }
        });

        if (searchCloseBtn) {
            searchCloseBtn.addEventListener('click', () => {
                searchModal.classList.remove('modal-active');
                document.body.style.overflow = '';
            });
        }

        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                searchModal.classList.remove('modal-active');
                document.body.style.overflow = '';
            }
        });

        if (searchInput) {
            // Поиск при вводе с debounce
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this._currentSearch = searchInput.value;
                    this.loadProjects(
                        this._currentFilters.status.length || this._currentFilters.priority.length || this._currentFilters.responsible.length
                            ? this._currentFilters
                            : null,
                        this._currentSearch
                    );
                    this._updateSearchBtnLabel();
                }, 350);
            });

            // Поиск при нажатии Enter
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(debounceTimer);
                    this._currentSearch = searchInput.value;
                    this.loadProjects(
                        this._currentFilters.status.length || this._currentFilters.priority.length || this._currentFilters.responsible.length
                            ? this._currentFilters
                            : null,
                        this._currentSearch
                    );
                    this._updateSearchBtnLabel();
                    searchModal.classList.remove('modal-active');
                    document.body.style.overflow = '';
                }
            });
        }

        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this._currentSearch = '';
                this.loadProjects(
                    this._currentFilters.status.length || this._currentFilters.priority.length || this._currentFilters.responsible.length
                        ? this._currentFilters
                        : null,
                    ''
                );
                this._updateSearchBtnLabel();
            });
        }
    }

    _updateSearchBtnLabel() {
        const searchBtn = document.querySelector('.btn__reg');
        if (!searchBtn) return;
        if (this._currentSearch && this._currentSearch.trim()) {
            searchBtn.textContent = `Search: "${this._currentSearch.trim()}"`;
            searchBtn.style.borderColor = '#C05BF0';
            searchBtn.style.color = '#C05BF0';
        } else {
            searchBtn.textContent = 'Search';
            searchBtn.style.borderColor = '';
            searchBtn.style.color = '';
        }
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
        // Восстановить состояние чекбоксов из текущих фильтров
        this._restoreCheckboxes();
    }

    close() {
        this.modalOverlay.classList.remove('modal-active');
        document.body.style.overflow = '';
        this.closeAllDropdowns();
    }

    _restoreCheckboxes() {
        // Снять все чекбоксы
        document.querySelectorAll('#filterModal input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        // Восстановить активные
        ['status', 'priority', 'responsible'].forEach(type => {
            this._currentFilters[type].forEach(val => {
                const cb = document.querySelector(`#filterModal input[name="${type}"][value="${val}"]`);
                if (cb) cb.checked = true;
            });
        });
    }

    _resetCheckboxes() {
        document.querySelectorAll('#filterModal input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }

    async applyFilters() {
        const filters = {
            status: [],
            priority: [],
            responsible: []
        };

        // Собираем только чекбоксы внутри filterModal
        const checkboxes = document.querySelectorAll('#filterModal input[type="checkbox"]:checked');
        checkboxes.forEach((checkbox) => {
            const name = checkbox.name;
            if (Object.prototype.hasOwnProperty.call(filters, name)) {
                filters[name].push(checkbox.value);
            }
        });

        console.log('Applied filters:', filters);

        // Сохраняем текущие фильтры
        this._currentFilters = filters;

        const hasFilters = filters.status.length > 0 || filters.priority.length > 0 || filters.responsible.length > 0;
        await this.loadProjects(hasFilters ? filters : null, this._currentSearch);

        this.updateAllSelectorText(filters);
        this._updateFilterBtnLabel(filters);
        this.close();
    }

    _updateFilterBtnLabel(filters) {
        const totalActive = filters.status.length + filters.priority.length + filters.responsible.length;
        const btn = document.querySelector('.btn-filter');
        if (!btn) return;
        if (totalActive > 0) {
            btn.textContent = `Filters (${totalActive})`;
            btn.style.borderColor = '#C05BF0';
            btn.style.color = '#C05BF0';
        } else {
            btn.textContent = 'Filters';
            btn.style.borderColor = '';
            btn.style.color = '';
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
            // Найти текст выбранного элемента
            const cb = document.querySelector(`#filterModal input[name="${filterType}"][value="${values[0]}"]`);
            const label = cb ? cb.closest('.filter-option')?.querySelector('span:last-child')?.textContent?.trim() : null;
            selector.textContent = label || values[0];
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
