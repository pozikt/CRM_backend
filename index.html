"use strict";
class FilterModal {
    constructor() {
        const modal = document.getElementById('filterModal');
        if (!modal)
            throw new Error('Modal element not found');
        this.modalOverlay = modal;
        const openButton = document.querySelector('.btn-filter');
        if (!openButton)
            throw new Error('Filter button not found');
        this.openBtn = openButton;
        const closeButton = document.getElementById('modalCloseBtn');
        if (!closeButton)
            throw new Error('Close button not found');
        this.closeBtn = closeButton;
        const cancelButton = document.getElementById('modalCancelBtn');
        if (!cancelButton)
            throw new Error('Cancel button not found');
        this.cancelBtn = cancelButton;
        const applyButton = document.getElementById('modalApplyBtn');
        if (!applyButton)
            throw new Error('Apply button not found');
        this.applyBtn = applyButton;
        this.filterSelectors = document.querySelectorAll('.filter-selector');
        this.filterDropdowns = document.querySelectorAll('.filter-dropdown');
        this.init();
    }
    init() {
        this.openBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.applyBtn.addEventListener('click', () => this.apply());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.close();
            }
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
            const currentDropdown = dropdown;
            if (exceptDropdown !== currentDropdown) {
                currentDropdown.classList.remove('show');
                const selector = currentDropdown.previousElementSibling;
                if (selector) {
                    selector.classList.remove('active');
                }
            }
        });
    }
    closeAllDropdowns() {
        this.filterDropdowns.forEach((dropdown) => {
            dropdown.classList.remove('show');
            const selector = dropdown.previousElementSibling;
            if (selector) {
                selector.classList.remove('active');
            }
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
    apply() {
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
        this.updateAllSelectorText(filters);
        this.close();
    }
    updateAllSelectorText(filters) {
        this.updateSelectorText('status', filters.status);
        this.updateSelectorText('priority', filters.priority);
        this.updateSelectorText('responsible', filters.responsible);
    }
    updateSelectorText(filterType, values) {
        const selector = document.querySelector(`.filter-selector[data-filter="${filterType}"] .filter-placeholder`);
        if (!selector)
            return;
        const defaultTexts = {
            'status': 'Choosing a status',
            'priority': 'Choosing a priority',
            'responsible': 'Choosing a responsible'
        };
        if (values.length === 0) {
            selector.textContent = defaultTexts[filterType];
        }
        else if (values.length === 1) {
            selector.textContent = values[0].charAt(0).toUpperCase() + values[0].slice(1);
        }
        else {
            selector.textContent = `${values.length} selected`;
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    try {
        new FilterModal();
        console.log('FilterModal initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize FilterModal:', error);
    }
});
//# sourceMappingURL=filter-modal.js.map