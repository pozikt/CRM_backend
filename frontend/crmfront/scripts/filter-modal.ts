// scripts/filter-modal.ts

interface Filters {
    status: string[];
    priority: string[];
    responsible: string[];
}

interface Project {
    id: number;
    name: string;
    description?: string;
    status: { id: number; name: string; };
    priority: { id: number; name: string; color?: string; order?: number; };
    manager?: { id: number; fullName: string; role: string; };
    progress?: number;
    clientName?: string;
    clientContact?: string;
}

class FilterModal {
    private modalOverlay: HTMLElement;
    private openBtn: HTMLElement;
    private closeBtn: HTMLElement;
    private cancelBtn: HTMLElement;
    private applyBtn: HTMLElement;
    private filterSelectors: NodeListOf<Element>;
    private filterDropdowns: NodeListOf<Element>;
    private projectsContainer: HTMLElement;
    private apiBaseUrl: string = 'http://localhost:3000/api'; // Адрес бэкенда

    constructor() {
        const modal = document.getElementById('filterModal');
        if (!modal) throw new Error('Modal element not found');
        this.modalOverlay = modal;

        const openButton = document.querySelector('.btn-filter');
        if (!openButton) throw new Error('Filter button not found');
        this.openBtn = openButton as HTMLElement;

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
        this.projectsContainer = document.querySelector('.projects-grid') as HTMLElement;

        this.init();
        this.loadInitialData();
    }

    private async loadInitialData(): Promise<void> {
        try {
            // Загружаем проекты
            await this.loadProjects();
            
            // Загружаем справочники для фильтров
            const statuses = await this.fetchStatuses();
            this.updateStatusFilter(statuses);
            
            const priorities = await this.fetchPriorities();
            this.updatePriorityFilter(priorities);
            
            const employees = await this.fetchEmployees();
            this.updateResponsibleFilter(employees);
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    private async loadProjects(filters?: Filters): Promise<void> {
        try {
            let url = `${this.apiBaseUrl}/projects`;
            
            // Добавляем фильтры в URL, если они есть
            if (filters) {
                const params = new URLSearchParams();
                if (filters.status.length > 0) params.append('status', filters.status[0]);
                if (filters.priority.length > 0) params.append('priority', filters.priority[0]);
                if (filters.responsible.length > 0) params.append('responsible', filters.responsible[0]);
                
                const queryString = params.toString();
                if (queryString) url += `?${queryString}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Ошибка загрузки проектов');
            
            const projects: Project[] = await response.json();
            this.renderProjects(projects);
            
        } catch (error) {
            console.error('Ошибка загрузки проектов:', error);
            if (this.projectsContainer) {
                this.projectsContainer.innerHTML = '<div class="no-projects">Ошибка загрузки данных. Убедитесь, что бэкенд запущен на порту 3000</div>';
            }
        }
    }

    private renderProjects(projects: Project[]): void {
        if (!this.projectsContainer) {
            console.error('Контейнер .projects-grid не найден');
            return;
        }
        
        if (projects.length === 0) {
            this.projectsContainer.innerHTML = `
                <div class="no-projects" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">
                    Нет проектов по выбранным фильтрам
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
                        <span class="pill" style="background-color: ${project.priority?.color || '#ccc'}20; color: ${project.priority?.color || '#686B73'}">
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
                        <div class="progress-bar-container" style="width: 100%; height: 20px; background-color: #f0f0f0; border-radius: 10px; overflow: hidden;">
                            <div class="progress-bar" style="width: ${project.progress}%; height: 100%; background: linear-gradient(90deg, #C05BF0, #4F7FFF); transition: width 0.3s ease;"></div>
                        </div>
                        <span style="margin-left: 8px; font-size: 14px;">${project.progress}%</span>
                    </div>
                    ` : ''}
                    ${project.clientName ? `
                    <div class="card-row">
                        <span class="label">Client</span>
                        <span class="pill">${this.escapeHtml(project.clientName)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private async fetchStatuses(): Promise<any[]> {
        const response = await fetch(`${this.apiBaseUrl}/statuses`);
        if (!response.ok) throw new Error('Ошибка загрузки статусов');
        return response.json();
    }

    private async fetchPriorities(): Promise<any[]> {
        const response = await fetch(`${this.apiBaseUrl}/priorities`);
        if (!response.ok) throw new Error('Ошибка загрузки приоритетов');
        return response.json();
    }

    private async fetchEmployees(): Promise<any[]> {
        const response = await fetch(`${this.apiBaseUrl}/employees`);
        if (!response.ok) throw new Error('Ошибка загрузки сотрудников');
        return response.json();
    }

    private updateStatusFilter(statuses: any[]): void {
        const dropdown = document.getElementById('statusDropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = statuses.map(status => `
            <label class="filter-option">
                <input type="checkbox" name="status" value="${status.name.toLowerCase()}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(status.name)}</span>
            </label>
        `).join('');
    }

    private updatePriorityFilter(priorities: any[]): void {
        const dropdown = document.getElementById('priorityDropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = priorities.map(priority => `
            <label class="filter-option">
                <input type="checkbox" name="priority" value="${priority.name.toLowerCase()}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(priority.name)}</span>
            </label>
        `).join('');
    }

    private updateResponsibleFilter(employees: any[]): void {
        const dropdown = document.getElementById('responsibleDropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = employees.map(emp => `
            <label class="filter-option">
                <input type="checkbox" name="responsible" value="${emp.id}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(emp.fullName)}</span>
            </label>
        `).join('');
    }

    private init(): void {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.applyBtn.addEventListener('click', () => this.applyFilters());

        this.modalOverlay.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.modalOverlay) this.close();
        });

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('modal-active')) {
                this.close();
            }
        });

        this.initDropdowns();
    }

    private initDropdowns(): void {
        this.filterSelectors.forEach((selector) => {
            selector.addEventListener('click', (e: Event) => {
                e.stopPropagation();
                const currentSelector = selector as HTMLElement;
                const dropdown = currentSelector.nextElementSibling as HTMLElement;
                this.closeAllDropdownsExcept(dropdown);
                dropdown.classList.toggle('show');
                currentSelector.classList.toggle('active');
            });
        });

        document.addEventListener('click', (e: MouseEvent) => {
            if (!(e.target as HTMLElement).closest('.filter-group')) {
                this.closeAllDropdowns();
            }
        });
    }

    private closeAllDropdownsExcept(exceptDropdown: HTMLElement | null = null): void {
        this.filterDropdowns.forEach((dropdown) => {
            const currentDropdown = dropdown as HTMLElement;
            if (exceptDropdown !== currentDropdown) {
                currentDropdown.classList.remove('show');
                const selector = currentDropdown.previousElementSibling as HTMLElement;
                if (selector) selector.classList.remove('active');
            }
        });
    }

    private closeAllDropdowns(): void {
        this.filterDropdowns.forEach((dropdown) => {
            (dropdown as HTMLElement).classList.remove('show');
            const selector = dropdown.previousElementSibling as HTMLElement;
            if (selector) selector.classList.remove('active');
        });
    }

    private open(): void {
        this.modalOverlay.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }

    private close(): void {
        this.modalOverlay.classList.remove('modal-active');
        document.body.style.overflow = '';
        this.closeAllDropdowns();
    }

    private async applyFilters(): Promise<void> {
        const filters: Filters = {
            status: [],
            priority: [],
            responsible: []
        };

        const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked');
        
        checkboxes.forEach((checkbox) => {
            const name = checkbox.name as keyof Filters;
            if (filters.hasOwnProperty(name)) {
                filters[name].push(checkbox.value);
            }
        });

        console.log('Applied filters:', filters);
        
        // Загружаем проекты с применёнными фильтрами
        await this.loadProjects(filters);
        
        this.updateAllSelectorText(filters);
        this.close();
    }

    private updateAllSelectorText(filters: Filters): void {
        this.updateSelectorText('status', filters.status);
        this.updateSelectorText('priority', filters.priority);
        this.updateSelectorText('responsible', filters.responsible);
    }

    private updateSelectorText(filterType: string, values: string[]): void {
        const selector = document.querySelector<HTMLElement>(
            `.filter-selector[data-filter="${filterType}"] .filter-placeholder`
        );
        
        if (!selector) return;

        const defaultTexts: Record<string, string> = {
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

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    try {
        new FilterModal();
        console.log('FilterModal initialized successfully');
    } catch (error) {
        console.error('Failed to initialize FilterModal:', error);
    }
});