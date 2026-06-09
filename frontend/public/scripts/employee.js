// employee.js - страница сотрудников
class EmployeesManager {
    constructor() {
        this.API_BASE = '/api/v1';
        
        this.allEmployees = [];
        this.currentRoleFilter = [];
        this.currentStatusFilter = [];
        this.lastAppliedRoleFilter = [];
        this.lastAppliedStatusFilter = [];
        this._currentSearch = '';
        
        this.init();
    }
    
    init() {
        const grid = document.getElementById('employeesGrid');
        if (grid) {
            this.loadEmployees();
        }
        this.initEmployeeModal();
        this.initViewModal();
        this.initEmployeeFilters();
        this.initSearch();
        this.initEmployeeSearchModal();
    }
    
    async loadEmployees() {
        try {
            const res = await fetch(`${this.API_BASE}/employees`);
            if (!res.ok) throw new Error('Ошибка загрузки');
            this.allEmployees = await res.json();
            if (Array.isArray(this.allEmployees)) {
                this.applyFiltersAndSearch();
            }
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            this.showNotification('Ошибка загрузки сотрудников', 'error');
        }
    }
    
    applyFiltersAndSearch() {
        let filtered = [...this.allEmployees];
        
        if (this.currentRoleFilter.length > 0) {
            filtered = filtered.filter(emp => this.currentRoleFilter.includes(emp.role));
        }
        
        if (this.currentStatusFilter.length > 0) {
            filtered = filtered.filter(emp => {
                const status = emp.is_active ? 'Active' : 'Inactive';
                return this.currentStatusFilter.includes(status);
            });
        }
        
        const searchTerm = document.getElementById('searchEmployeeInput')?.value.toLowerCase().trim() || '';
        if (searchTerm) {
            filtered = filtered.filter(emp => 
                emp.full_name && emp.full_name.toLowerCase().includes(searchTerm)
            );
        }
        
        this.renderEmployees(filtered);
    }
    
    renderEmployees(employees) {
        const grid = document.getElementById('employeesGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (employees.length === 0) {
            grid.innerHTML = '<div class="no-employees" style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">No employees found</div>';
            return;
        }
        
        employees.forEach(emp => {
            const card = this.createCard(
                emp.full_name, 
                emp.role, 
                emp.id, 
                emp.telegram,
                emp.email,
                emp.is_active,
                emp.notes
            );
            grid.appendChild(card);
        });
    }
    
    updateCard(card, name, role, telegram, email, isActive, notes) {
        const title = card.querySelector('.card-title');
        const rolePill = card.querySelector('.pill-role');
        const statusPill = card.querySelector('.pill-status');
        
        if (title) title.textContent = name;
        if (rolePill) rolePill.textContent = role;
        if (statusPill) {
            statusPill.textContent = isActive ? 'Active' : 'Inactive';
            statusPill.style.backgroundColor = isActive ? '#4CAF5020' : '#f4433620';
            statusPill.style.color = isActive ? '#4CAF50' : '#f44336';
        }
    }
    
    async createOnServer(data) {
        const res = await fetch(`${this.API_BASE}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const newEmp = await res.json();
            await this.loadEmployees();
            this.showNotification('Сотрудник добавлен', 'success');
        } else {
            const error = await res.json();
            console.error('Create error:', error);
            this.showNotification('Ошибка: ' + (error.error || 'Неизвестная ошибка'), 'error');
        }
        return res.ok;
    }
    
    async updateOnServer(id, data) {
        const res = await fetch(`${this.API_BASE}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const updated = await res.json();
            await this.loadEmployees();
            this.showNotification('Сотрудник обновлён', 'success');
        } else {
            const error = await res.json();
            console.error('Update error:', error);
            this.showNotification('Ошибка: ' + (error.error || 'Неизвестная ошибка'), 'error');
        }
        return res.ok;
    }
    
    async deleteOnServer(id) {
        const res = await fetch(`${this.API_BASE}/employees/${id}`, { method: 'DELETE' });
        if (res.ok) {
            await this.loadEmployees();
            this.showNotification('Сотрудник удалён', 'success');
        } else {
            this.showNotification('Ошибка при удалении', 'error');
        }
        return res.ok;
    }
    
    async loadEmployeeProjects(employeeId) {
        try {
            const res = await fetch(`${this.API_BASE}/employees/${employeeId}/projects`);
            if (!res.ok) throw new Error('Ошибка загрузки проектов');
            return await res.json();
        } catch (err) {
            console.error('Ошибка загрузки проектов:', err);
            return [];
        }
    }
    
    createCard(name, role, id, telegram, email, isActive, notes) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.id = id;
        card.innerHTML = `
            <h3 class="card-title text-gradient" style="cursor: pointer;">${this.escapeHtml(name || '')}</h3>
            <div class="card-body">
                <div class="card-row">
                    <span class="label">Role</span>
                    <span class="pill pill-role">${this.escapeHtml(role || '—')}</span>
                </div>
                <div class="card-row">
                    <span class="label">Status</span>
                    <span class="pill pill-status" style="background-color: ${isActive ? '#4CAF5020' : '#f4433620'}; color: ${isActive ? '#4CAF50' : '#f44336'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>
            <div class="employee-actions">
                <button type="button" class="btn-edit-employee">Edit</button>
                <button type="button" class="btn-delete-employee">Delete</button>
            </div>
        `;
        
        const title = card.querySelector('.card-title');
        if (title) {
            title.onclick = (e) => {
                e.stopPropagation();
                this.openViewModal(id);
            };
        }
        
        const editBtn = card.querySelector('.btn-edit-employee');
        const delBtn = card.querySelector('.btn-delete-employee');
        
        editBtn.onclick = () => {
            openEditEmployeeModal(card, name, role, id, telegram, email, isActive, notes);
        };
        
        delBtn.onclick = async () => {
            if (confirm('Удалить сотрудника?')) await this.deleteOnServer(id);
        };
        
        return card;
    }
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"]/g, m => {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            return m;
        });
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
        }, 3000);
    }
    
    initSearch() {
        const searchInput = document.getElementById('searchEmployeeInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                this.applyFiltersAndSearch();
            });
        }
    }
    
    initEmployeeSearchModal() {
        const searchBtn = document.getElementById('searchHeaderBtn');
        const searchModal = document.getElementById('searchModalEmployees');
        const closeBtn = document.getElementById('searchEmployeesCloseBtn');
        const searchInput = document.getElementById('searchEmployeesInput');
        const clearBtn = document.getElementById('searchEmployeesClearBtn');
        
        if (!searchBtn || !searchModal) return;
        
        const openModal = () => {
            searchModal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';
            if (searchInput) {
                searchInput.value = this._getCurrentSearchValue();
                searchInput.focus();
            }
        };
        
        const closeModal = () => {
            searchModal.classList.remove('modal-active');
            document.body.style.overflow = '';
        };
        
        const applySearch = () => {
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            this._currentSearch = searchTerm;
            
            let filtered = [...this.allEmployees];
            
            if (this.currentRoleFilter.length > 0) {
                filtered = filtered.filter(emp => this.currentRoleFilter.includes(emp.role));
            }
            
            if (this.currentStatusFilter.length > 0) {
                filtered = filtered.filter(emp => {
                    const status = emp.is_active ? 'Active' : 'Inactive';
                    return this.currentStatusFilter.includes(status);
                });
            }
            
            if (searchTerm) {
                filtered = filtered.filter(emp => 
                    emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            this.renderEmployees(filtered);
            this._updateSearchBtnLabel();
            closeModal();
        };
        
        const clearSearch = () => {
            if (searchInput) {
                searchInput.value = '';
            }
            this._currentSearch = '';
            this.currentRoleFilter = [];
            this.currentStatusFilter = [];
            this.renderEmployees(this.allEmployees);
            this._updateSearchBtnLabel();
        };
        
        let debounceTimer;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const searchTerm = searchInput.value.trim();
                    this._currentSearch = searchTerm;
                    
                    let filtered = [...this.allEmployees];
                    
                    if (this.currentRoleFilter.length > 0) {
                        filtered = filtered.filter(emp => this.currentRoleFilter.includes(emp.role));
                    }
                    
                    if (this.currentStatusFilter.length > 0) {
                        filtered = filtered.filter(emp => {
                            const status = emp.is_active ? 'Active' : 'Inactive';
                            return this.currentStatusFilter.includes(status);
                        });
                    }
                    
                    if (searchTerm) {
                        filtered = filtered.filter(emp => 
                            emp.full_name && emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                    }
                    
                    this.renderEmployees(filtered);
                    this._updateSearchBtnLabel();
                }, 350);
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(debounceTimer);
                    applySearch();
                }
            });
        }
        
        searchBtn.onclick = openModal;
        if (closeBtn) closeBtn.onclick = closeModal;
        if (clearBtn) clearBtn.onclick = clearSearch;
        
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchModal.classList.contains('modal-active')) {
                closeModal();
            }
        });
        
        this._currentSearch = '';
        this._updateSearchBtnLabel();
    }

    _getCurrentSearchValue() {
        return this._currentSearch || '';
    }

    _updateSearchBtnLabel() {
        const searchBtn = document.getElementById('searchHeaderBtn');
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
    
    initEmployeeFilters() {
        const filterBtn = document.getElementById('filterEmployeesBtn');
        const filterModal = document.getElementById('employeeFilterModal');
        
        if (!filterBtn || !filterModal) return;
        
        const closeBtn = document.getElementById('employeeFilterCloseBtn');
        const cancelBtn = document.getElementById('employeeFilterCancelBtn');
        const applyBtn = document.getElementById('employeeFilterApplyBtn');
        const roleDropdown = document.getElementById('roleFilterDropdown');
        const statusDropdown = document.getElementById('statusFilterDropdown');
        
        const updateSelectorText = () => {
            const roleSelector = document.querySelector('#employeeFilterModal .filter-selector[data-filter="role"] .filter-placeholder');
            const statusSelector = document.querySelector('#employeeFilterModal .filter-selector[data-filter="status"] .filter-placeholder');
            
            const selectedRoles = [];
            const selectedStatuses = [];
            
            if (roleDropdown) {
                roleDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedRoles.push(cb.value);
                });
            }
            
            if (statusDropdown) {
                statusDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    selectedStatuses.push(cb.value);
                });
            }
            
            if (roleSelector) {
                if (selectedRoles.length === 0) {
                    roleSelector.textContent = 'Choose a role';
                } else if (selectedRoles.length === 1) {
                    roleSelector.textContent = selectedRoles[0];
                } else {
                    roleSelector.textContent = `${selectedRoles.length} roles selected`;
                }
            }
            
            if (statusSelector) {
                if (selectedStatuses.length === 0) {
                    statusSelector.textContent = 'Choose a status';
                } else if (selectedStatuses.length === 1) {
                    statusSelector.textContent = selectedStatuses[0];
                } else {
                    statusSelector.textContent = `${selectedStatuses.length} statuses selected`;
                }
            }
        };
        
        const updateRoleDropdown = () => {
            if (!roleDropdown) return;
            const allRoles = ['Project manager', 'Developer', 'Designer', 'Intern'];
            roleDropdown.innerHTML = allRoles.map(role => `
                <label class="filter-option">
                    <input type="checkbox" name="role" value="${this.escapeHtml(role)}">
                    <span class="checkbox-custom"></span>
                    <span>${this.escapeHtml(role)}</span>
                </label>
            `).join('');
            
            roleDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', updateSelectorText);
            });
        };
        
        const initStatusCheckboxes = () => {
            if (!statusDropdown) return;
            statusDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.removeEventListener('change', updateSelectorText);
                cb.addEventListener('change', updateSelectorText);
            });
        };
        
        const openFilterModal = () => {
            this.lastAppliedRoleFilter = [...this.currentRoleFilter];
            this.lastAppliedStatusFilter = [...this.currentStatusFilter];
            
            if (roleDropdown) {
                roleDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = this.currentRoleFilter.includes(cb.value);
                });
            }
            if (statusDropdown) {
                statusDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = this.currentStatusFilter.includes(cb.value);
                });
            }
            
            updateSelectorText();
            filterModal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';
        };
        
        const closeFilterModal = (cancel = false) => {
            filterModal.classList.remove('modal-active');
            document.body.style.overflow = '';
            
            document.querySelectorAll('#employeeFilterModal .filter-dropdown').forEach(d => {
                d.classList.remove('show');
            });
            document.querySelectorAll('#employeeFilterModal .filter-selector').forEach(s => {
                s.classList.remove('active');
            });
            
            if (cancel) {
                this.currentRoleFilter = [...this.lastAppliedRoleFilter];
                this.currentStatusFilter = [...this.lastAppliedStatusFilter];
                
                if (roleDropdown) {
                    roleDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        cb.checked = this.currentRoleFilter.includes(cb.value);
                    });
                }
                if (statusDropdown) {
                    statusDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        cb.checked = this.currentStatusFilter.includes(cb.value);
                    });
                }
                
                updateSelectorText();
                this.applyFiltersAndSearch();
            }
        };
        
        const applyFilters = () => {
            this.currentRoleFilter = [];
            this.currentStatusFilter = [];
            
            if (roleDropdown) {
                roleDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    this.currentRoleFilter.push(cb.value);
                });
            }
            
            if (statusDropdown) {
                statusDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    this.currentStatusFilter.push(cb.value);
                });
            }
            
            updateSelectorText();
            this.applyFiltersAndSearch();
            this._updateFilterBtnLabel();
            closeFilterModal();
        };
        
        const initFilterDropdowns = () => {
            const filterSelectors = document.querySelectorAll('#employeeFilterModal .filter-selector');
            
            filterSelectors.forEach(selector => {
                selector.removeEventListener('click', selector._handler);
                selector._handler = (e) => {
                    e.stopPropagation();
                    
                    document.querySelectorAll('#employeeFilterModal .filter-dropdown').forEach(d => {
                        if (d !== selector.nextElementSibling) {
                            d.classList.remove('show');
                        }
                    });
                    document.querySelectorAll('#employeeFilterModal .filter-selector').forEach(s => {
                        if (s !== selector) s.classList.remove('active');
                    });
                    
                    const dropdown = selector.nextElementSibling;
                    dropdown.classList.toggle('show');
                    selector.classList.toggle('active');
                };
                selector.addEventListener('click', selector._handler);
            });
            
            document.addEventListener('click', function(e) {
                if (!e.target.closest('#employeeFilterModal .filter-group')) {
                    document.querySelectorAll('#employeeFilterModal .filter-dropdown').forEach(d => {
                        d.classList.remove('show');
                    });
                    document.querySelectorAll('#employeeFilterModal .filter-selector').forEach(s => {
                        s.classList.remove('active');
                    });
                }
            });
        };
        
        updateRoleDropdown();
        initStatusCheckboxes();
        initFilterDropdowns();
        
        filterBtn.onclick = openFilterModal;
        if (closeBtn) closeBtn.onclick = () => closeFilterModal(true);
        if (cancelBtn) cancelBtn.onclick = () => closeFilterModal(true);
        if (applyBtn) applyBtn.onclick = applyFilters;
        
        filterModal.addEventListener('click', (e) => {
            if (e.target === filterModal) closeFilterModal(true);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && filterModal.classList.contains('modal-active')) {
                closeFilterModal(true);
            }
        });
    }

    _updateFilterBtnLabel() {
        const filterBtn = document.getElementById('filterEmployeesBtn');
        if (!filterBtn) return;
        
        const totalActive = this.currentRoleFilter.length + this.currentStatusFilter.length;
        
        if (totalActive > 0) {
            filterBtn.textContent = `Filters (${totalActive})`;
            filterBtn.style.borderColor = '#C05BF0';
            filterBtn.style.color = '#C05BF0';
        } else {
            filterBtn.textContent = 'Filters';
            filterBtn.style.borderColor = '';
            filterBtn.style.color = '';
        }
    }
    
    initEmployeeModal() {
        const modal = document.getElementById('employeeModal');
        if (!modal) {
            return;
        }
        
        const cancelBtn = document.getElementById('cancelEmployeeBtn');
        const saveBtn = document.getElementById('saveEmployeeBtn');
        const modalTitle = document.getElementById('employeeModalTitle');
        const roleSelect = document.getElementById('roleSelect');
        const nameInput = document.getElementById('empFullName');
        const telegramInput = document.getElementById('empTelegram');
        const emailInput = document.getElementById('empEmail');
        const activeCheckbox = document.getElementById('empActive');
        const notesInput = document.getElementById('empNotes');
        
        if (telegramInput) {
            telegramInput.addEventListener('input', (e) => {
                let value = e.target.value.trim();
                if (value && !value.startsWith('@')) {
                    e.target.value = '@' + value;
                }
            });
        }
        
        let editId = null;
        let editCard = null;
        
        const initSelect = (selectElement) => {
            if (!selectElement) return;
            const placeholder = selectElement.querySelector('.custom-select__placeholder');
            const dropdown = selectElement.querySelector('.custom-select__dropdown');
            
            if (!placeholder || !dropdown) return;
            
            selectElement.onclick = null;
            
            selectElement.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom-select.open').forEach(s => {
                    if (s !== selectElement) s.classList.remove('open');
                });
                selectElement.classList.toggle('open');
            };
            
            dropdown.querySelectorAll('.custom-select__option').forEach(opt => {
                opt.onclick = (e) => {
                    e.stopPropagation();
                    placeholder.textContent = opt.textContent;
                    placeholder.classList.add('custom-select__value');
                    selectElement.classList.remove('open');
                };
            });
        };
        
        const openModal = (isEdit, id, name, role, telegram, email, isActive, notes, card) => {
            if (!modal || !roleSelect || !nameInput) return;
            
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
            
            initSelect(roleSelect);
            
            const rolePlaceholder = roleSelect.querySelector('.custom-select__placeholder');
            if (!rolePlaceholder) return;
            
            if (isEdit) {
                modalTitle.textContent = 'Edit employee';
                editId = id;
                editCard = card;
                nameInput.value = name || '';
                telegramInput.value = telegram || '';
                emailInput.value = email || '';
                activeCheckbox.checked = isActive === true || isActive === 1;
                notesInput.value = notes || '';
                
                if (role && role !== 'Select role') {
                    rolePlaceholder.textContent = role;
                    rolePlaceholder.classList.add('custom-select__value');
                } else {
                    rolePlaceholder.textContent = 'Select role';
                    rolePlaceholder.classList.remove('custom-select__value');
                }
            } else {
                modalTitle.textContent = 'Add an employee';
                editId = null;
                editCard = null;
                nameInput.value = '';
                telegramInput.value = '';
                emailInput.value = '';
                activeCheckbox.checked = true;
                notesInput.value = '';
                rolePlaceholder.textContent = 'Select role';
                rolePlaceholder.classList.remove('custom-select__value');
            }
            modal.classList.add('modal-active');
            
            setTimeout(() => {
                if (notesInput) {
                    this.autoResizeTextarea(notesInput);
                }
            }, 10);
        };
        
        window.openAddEmployeeModal = () => {
            openModal(false);
        };
        
        window.openEditEmployeeModal = (card, name, role, id, telegram, email, isActive, notes) => {
            openModal(true, id, name, role, telegram, email, isActive, notes, card);
        };
        
        const closeModal = () => {
            modal.classList.remove('modal-active');
        };
        
        const save = async () => {
            const name = nameInput.value.trim();
            const rolePlaceholder = roleSelect.querySelector('.custom-select__placeholder');
            const role = rolePlaceholder.textContent;
            const telegram = telegramInput.value.trim();
            const email = emailInput.value.trim();
            const isActive = activeCheckbox.checked;
            const notes = notesInput.value.trim();
            
            if (!name) {
                this.showNotification('Заполните имя', 'error');
                return;
            }
            
            if (!role || role === 'Select role') {
                this.showNotification('Выберите роль', 'error');
                return;
            }
            
            const data = { 
                full_name: name, 
                role: role,
                telegram: telegram || null,
                email: email || null,
                is_active: isActive,
                notes: notes || null
            };
            
            if (editId) {
                await this.updateOnServer(editId, data);
            } else {
                await this.createOnServer(data);
            }
            closeModal();
        };
        
        if (cancelBtn) cancelBtn.onclick = (e) => { e.preventDefault(); closeModal(); };
        if (saveBtn) saveBtn.onclick = (e) => { e.preventDefault(); save(); };
        
        const autoResizeTextarea = (textarea) => {
            if (!textarea) return;
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };
        
        const initAutoResizeTextarea = () => {
            if (notesInput) {
                notesInput.style.resize = 'none';
                notesInput.style.overflowY = 'hidden';
                notesInput.addEventListener('input', () => {
                    autoResizeTextarea(notesInput);
                });
                autoResizeTextarea(notesInput);
            }
        };
        
        initAutoResizeTextarea();
    }
    
    initViewModal() {
        const viewModal = document.getElementById('employeeViewModal');
        if (!viewModal) return;
        
        const closeBtn = document.getElementById('closeViewModalBtn');
        
        const closeModal = () => {
            viewModal.classList.remove('modal-active');
            document.body.style.overflow = '';
        };
        
        if (closeBtn) closeBtn.onclick = closeModal;
        
        viewModal.addEventListener('click', (e) => {
            if (e.target === viewModal) closeModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && viewModal.classList.contains('modal-active')) {
                closeModal();
            }
        });
    }
    
    async openViewModal(employeeId) {
        try {
            const res = await fetch(`${this.API_BASE}/employees/${employeeId}`);
            if (!res.ok) throw new Error('Сотрудник не найден');
            const employee = await res.json();
            
            document.getElementById('viewFullName').textContent = employee.full_name || '—';
            document.getElementById('viewRole').textContent = employee.role || '—';
            document.getElementById('viewTelegram').textContent = employee.telegram || '—';
            document.getElementById('viewEmail').textContent = employee.email || '—';
            document.getElementById('viewActive').textContent = employee.is_active ? 'Active' : 'Inactive';
            document.getElementById('viewNotes').textContent = employee.notes || '—';
            
            const projects = await this.loadEmployeeProjects(employeeId);
            const projectsContainer = document.getElementById('viewProjects');
            
            if (projectsContainer) {
                if (projects.length === 0) {
                    projectsContainer.innerHTML = '<span class="view-projects-empty">No projects assigned</span>';
                } else {
                    projectsContainer.innerHTML = projects.map(project => `
                        <div class="view-project-item" data-project-id="${project.id}">
                            <span class="view-project-name">${this.escapeHtml(project.name)}</span>
                            <span class="view-project-status">${this.escapeHtml(project.status?.name || '—')}</span>
                        </div>
                    `).join('');
                    
                    projectsContainer.querySelectorAll('.view-project-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const projectId = item.dataset.projectId;
                            if (projectId) {
                                window.location.href = `/project.html?id=${projectId}`;
                            }
                        });
                    });
                }
            }
            
            const editBtn = document.getElementById('editFromViewBtn');
            if (editBtn) {
                editBtn.onclick = () => {
                    this.closeViewModal();
                    window.openEditEmployeeModal(null, employee.full_name, employee.role, employee.id, employee.telegram, employee.email, employee.is_active, employee.notes);
                };
            }
            
            const viewModal = document.getElementById('employeeViewModal');
            viewModal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.showNotification('Не удалось загрузить данные сотрудника', 'error');
        }
    }
    
    closeViewModal() {
        const viewModal = document.getElementById('employeeViewModal');
        if (viewModal) {
            viewModal.classList.remove('modal-active');
            document.body.style.overflow = '';
        }
    }
    
    autoResizeTextarea(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
}

const employeesManager = new EmployeesManager();