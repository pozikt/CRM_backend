// scripts/filter-modal.ts

interface Filters {
    status: string[];
    priority: string[];
    responsible: string[];
}

class FilterModal {
    private modalOverlay: HTMLElement;
    private openBtn: HTMLElement;
    private closeBtn: HTMLElement;
    private cancelBtn: HTMLElement;
    private applyBtn: HTMLElement;
    private filterSelectors: NodeListOf<Element>;
    private filterDropdowns: NodeListOf<Element>;

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

        this.init();
    }

    private init(): void {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.applyBtn.addEventListener('click', () => this.apply());

        this.modalOverlay.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.modalOverlay) {
                this.close();
            }
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
                if (selector) {
                    selector.classList.remove('active');
                }
            }
        });
    }

    private closeAllDropdowns(): void {
        this.filterDropdowns.forEach((dropdown) => {
            (dropdown as HTMLElement).classList.remove('show');
            const selector = dropdown.previousElementSibling as HTMLElement;
            if (selector) {
                selector.classList.remove('active');
            }
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

    private apply(): void {
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