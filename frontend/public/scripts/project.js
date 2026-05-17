// project.js - Project page logic

const urlParams = new URLSearchParams(window.location.search);
const isNewProject = urlParams.get('new') === 'true';
const projectId = urlParams.get('id'); // для будущего редактирования
let statusesList = [];
let prioritiesList = [];
let employeesList = [];

document.addEventListener('DOMContentLoaded', async function () {
    // Загружаем справочники статусов и приоритетов
    await loadStatusesAndPriorities();

    initEditProjectMode();
    initCustomSelects();
    initAddEmployee();
    initDateMasks();
    initDeleteButton();

    if (isNewProject) {
        const projectDetail = document.getElementById('projectDetail');
        if (projectDetail) {
            projectDetail.setAttribute('data-edit-mode', 'true');
            const editBtns = document.querySelectorAll('.js-edit-project-toggle');
            editBtns.forEach(btn => {
                btn.classList.add('btn-edit-project--active');
                btn.textContent = 'Save';
            });
            const inputs = projectDetail.querySelectorAll('.form-input, .status-date-field input');
            inputs.forEach(input => input.readOnly = false);
        }
        const deleteBtn = document.getElementById('deleteProjectBtn');
        if (deleteBtn) deleteBtn.style.display = 'none';
    } else if (projectId) {
        const deleteBtn = document.getElementById('deleteProjectBtn');
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    }
});

async function loadStatusesAndPriorities() {
    try {
        const [statusRes, priorityRes, employeeRes] = await Promise.all([
            fetch('/api/v1/statuses'),
            fetch('/api/v1/priorities'),
            fetch('/api/v1/employees')
        ]);
        statusesList = await statusRes.json();
        prioritiesList = await priorityRes.json();
        employeesList = await employeeRes.json();

        // Заполняем выпадающий список приоритетов (у него id="priorityDropdown")
        const priorityDropdown = document.querySelector('#priorityDropdown');
        if (priorityDropdown) {
            priorityDropdown.innerHTML = prioritiesList.map(p => `
                <div class="custom-select__option" data-value="${p.id}">${p.name}</div>
            `).join('');
        }

        // Если для статуса тоже динамическое наполнение (замени статичные опции)
        const statusDropdown = document.querySelector('[data-select="status"] .custom-select__dropdown');
        if (statusDropdown) {
            statusDropdown.innerHTML = statusesList.map(s => `
                <div class="custom-select__option" data-value="${s.id}">${s.name}</div>
            `).join('');
        }

        // Заполняем выпадающий список ответственных сотрудников
        const managerDropdown = document.querySelector('#managerDropdown');
        if (managerDropdown) {
            managerDropdown.innerHTML = employeesList.map(e => `
                <div class="custom-select__option" data-value="${e.id}">${e.full_name}</div>
            `).join('');
        }

        fillEmployeeDropdowns();
    } catch (e) {
        console.error('Ошибка загрузки справочников', e);
    }
}

// Маска для даты (дд.мм.гггг)
function applyDateMask(input) {
    input.addEventListener('input', function (e) {
        let value = this.value.replace(/\D/g, ''); // оставляем только цифры
        if (value.length > 8) value = value.slice(0, 8);
        
        let formatted = '';
        if (value.length > 0) {
            formatted = value.slice(0, 2);
            if (value.length > 2) formatted += '.' + value.slice(2, 4);
            if (value.length > 4) formatted += '.' + value.slice(4, 8);
        }
        this.value = formatted;
    });

    input.addEventListener('keydown', function (e) {
        // Разрешаем backspace, delete, стрелки, Tab
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
            return;
        }
        // Блокируем ввод не-цифр
        if (!/^\d$/.test(e.key) && e.key !== '.') {
            e.preventDefault();
        }
        // Автоматически ставим точки
        const value = this.value.replace(/\D/g, '');
        if (value.length === 2 || value.length === 4) {
            this.value = value.slice(0,2) + '.' + (value.length > 2 ? value.slice(2,4) : '') + (value.length > 4 ? '.' + value.slice(4,8) : '');
        }
    });

    // Проверка валидности при потере фокуса
    input.addEventListener('blur', function() {
        const val = this.value.trim();
        if (val.length === 0) return; // пустое поле не проверяем
        
        if (val.length !== 10) {
            notify.error('Дата должна быть в формате дд.мм.гггг');
            this.value = '';
            return;
        }
        
        const parts = val.split('.');
        if (parts.length !== 3) {
            notify.error('Неверный формат даты');
            this.value = '';
            return;
        }
        
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            notify.error('Дата должна содержать только цифры');
            this.value = '';
            return;
        }
        
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            notify.error('Введена несуществующая дата');
            this.value = '';
        }
    });
}

// Применяем маску ко всем полям с плейсхолдером "дд.мм.гггг"
function initDateMasks() {
    document.querySelectorAll('input[placeholder*="дд.мм.гггг"]').forEach(applyDateMask);
}

// Кнопки «Edit the project» / «Save» (в шапке и в строке Project) — одинаково переключают режим
function initEditProjectMode() {
    const projectDetail = document.getElementById('projectDetail');
    const editBtns = document.querySelectorAll('.js-edit-project-toggle');

    if (!projectDetail || editBtns.length === 0) return;

    function setEditMode(isEdit) {
        projectDetail.setAttribute('data-edit-mode', isEdit ? 'true' : 'false');
        const label = isEdit ? 'Save' : 'Edit the project';
        editBtns.forEach(function (btn) {
            btn.classList.toggle('btn-edit-project--active', isEdit);
            btn.textContent = label;
        });
    
        const inputs = projectDetail.querySelectorAll('.form-input, .status-date-field input');
        inputs.forEach(function (input) {
            input.readOnly = !isEdit;
        });
    
        if (!isEdit) closeAllSelects();
    }

async function handleSave() {
    // Название проекта
    const nameInput = document.getElementById('projectNameInput');
    const projectName = nameInput ? nameInput.value.trim() : 'Новый проект';

    // Клиент
    const clientInput = document.getElementById('clientNameInput');
    const clientName = clientInput ? clientInput.value.trim() : '';

    // Тип проекта (пока сохраним в поле tags)
    const typePlaceholder = projectDetail.querySelector('.custom-select[data-select="type"] .custom-select__value');
    const typeText = typePlaceholder ? typePlaceholder.textContent.trim() : '';

    // Статус
    const statusPlaceholder = projectDetail.querySelector('.custom-select[data-select="status"] .custom-select__value');
    const statusText = statusPlaceholder ? statusPlaceholder.textContent.trim() : '';
    const status = statusesList.find(s => s.name === statusText);
    const status_id = status ? status.id : 1;

    // Приоритет
    const priorityPlaceholder = projectDetail.querySelector('.custom-select[data-select="priority"] .custom-select__value');
    const priorityText = priorityPlaceholder ? priorityPlaceholder.textContent.trim() : '';
    const priority = prioritiesList.find(p => p.name === priorityText);
    const priority_id = priority ? priority.id : 1;

    // Даты
    const startDateInput = document.getElementById('startDate');
    const deadlineInput = document.getElementById('deadlineDate');

    // Функция для преобразования даты из дд.мм.гггг в ISO
    const parseDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const trimmed = dateStr.trim();
        if (trimmed.length === 0) return null;
        const parts = trimmed.split('.');
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return null;
        }
        return date.toISOString();
    };

    console.log('deadlineInput element:', deadlineInput);
    console.log('deadlineInput value:', deadlineInput?.value);
    console.log('parsed deadline:', parseDate(deadlineInput?.value));

    // Прогресс
    const progressInput = document.getElementById('projectProgress');
    const progress = progressInput ? parseFloat(progressInput.value) || 0 : 0;

    // Получаем выбранного менеджера
    const managerPlaceholder = document.querySelector('.custom-select[data-select="manager"] .custom-select__placeholder');
    let manager_id = null;
    if (managerPlaceholder && managerPlaceholder.classList.contains('custom-select__value')) {
        const managerValue = parseInt(managerPlaceholder.getAttribute('data-value'), 10);
        if (!Number.isNaN(managerValue)) {
            manager_id = managerValue;
        } else {
            const managerText = managerPlaceholder.textContent;
            const selectedManager = employeesList.find(e => e.full_name === managerText);
            manager_id = selectedManager ? selectedManager.id : null;
        }
    }

    const employee_ids = collectSelectedProjectEmployeeIds();

    const payload = {
        name: projectName,
        description: '',
        client_name: clientName,
        tags: typeText,
        status_id: status_id,
        priority_id: priority_id,
        manager_id: manager_id,
        start_date: startDateInput ? parseDate(startDateInput.value) : null,
        deadline_date: deadlineInput ? parseDate(deadlineInput.value) : null,
        progress: progress,
        hours: 0,
        employee_ids: employee_ids
    };

    const method = isNewProject ? 'POST' : 'PUT';
    const url = isNewProject ? '/api/v1/projects' : `/api/v1/projects/${projectId}`;

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json();
            alert('Ошибка: ' + (err.detail || 'Неизвестная ошибка'));
            return;
        }
        const project = await res.json();
        alert(`Проект "${project.name}" ${isNewProject ? 'создан' : 'обновлён'}!`);
        if (isNewProject) {
            window.location.href = '/index.html';
        } else {
            setEditMode(false);
        }
    } catch (error) {
        notify.error('Ошибка сети: ' + error.message);
    }
}

    function toggleEditMode() {
        const isEdit = projectDetail.getAttribute('data-edit-mode') === 'true';
        if (isEdit) {
            // Было редактирование -> сохраняем
            handleSave();
        } else {
            setEditMode(true);
        }
    }

    editBtns.forEach(function (btn) {
        btn.addEventListener('click', toggleEditMode);
    });

    // Если это существующий проект, можно загрузить данные
    if (!isNewProject && projectId) {
        // TODO: загрузить проект и заполнить поля
    }

        // Загрузка существующего проекта
    async function loadProject(id) {
        try {
            const res = await fetch(`/api/v1/projects/${id}`);
            if (!res.ok) throw new Error('Проект не найден');
            const project = await res.json();

            // Название
            const nameInput = document.getElementById('projectNameInput');
            if (nameInput) nameInput.value = project.name;

            // Клиент
            const clientInput = document.getElementById('clientNameInput');
            if (clientInput) clientInput.value = project.client_name || '';

            // Прогресс
            const progressInput = document.getElementById('projectProgress');
            if (progressInput) progressInput.value = project.progress || 0;

            // Тип (из tags)
            const typePlaceholder = projectDetail.querySelector('.custom-select[data-select="type"] .custom-select__placeholder');
            if (typePlaceholder && project.tags) {
                typePlaceholder.textContent = project.tags;
                typePlaceholder.classList.add('custom-select__value');
            }

            // Статус
            const statusPlaceholder = projectDetail.querySelector('.custom-select[data-select="status"] .custom-select__placeholder');
            if (statusPlaceholder && project.status) {
                statusPlaceholder.textContent = project.status.name;
                statusPlaceholder.classList.add('custom-select__value');
            }

            // Приоритет
            const priorityPlaceholder = projectDetail.querySelector('.custom-select[data-select="priority"] .custom-select__placeholder');
            if (priorityPlaceholder && project.priority) {
                priorityPlaceholder.textContent = project.priority.name;
                priorityPlaceholder.classList.add('custom-select__value');
            }

            // Ответственный
            const managerPlaceholder = projectDetail.querySelector('.custom-select[data-select="manager"] .custom-select__placeholder');
            if (managerPlaceholder && project.manager) {
                managerPlaceholder.textContent = project.manager.full_name;
                managerPlaceholder.classList.add('custom-select__value');
                managerPlaceholder.setAttribute('data-value', project.manager.id);
            }

            renderProjectEmployees(project.employees || []);

            // Даты
            const startDateInput = document.getElementById('startDate');
            if (startDateInput && project.start_date) {
                const date = new Date(project.start_date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                startDateInput.value = `${day}.${month}.${year}`;
            }

            const deadlineInput = document.getElementById('deadlineDate');
            if (deadlineInput && project.deadline_date) {
                const date = new Date(project.deadline_date);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                deadlineInput.value = `${day}.${month}.${year}`;
            }

            setEditMode(false);
        } catch (err) {
            console.error('Ошибка загрузки проекта:', err);
            alert('Не удалось загрузить проект');
        }
    }

    if (!isNewProject && projectId) {
        loadProject(projectId);
    } else {
        setEditMode(isNewProject);
    }
}


// Выпадающие списки (делегирование — работают для динамически добавленных сотрудников)
function initCustomSelects() {
    const root = document.getElementById('projectDetail');
    if (!root) return;

    root.addEventListener('click', function (e) {
        if (root.getAttribute('data-edit-mode') !== 'true') return;

        const option = e.target.closest('.custom-select__option');
        if (option) {
            e.stopPropagation();
            const select = option.closest('.custom-select');
            if (!select || !root.contains(select)) return;
            const placeholder = select.querySelector('.custom-select__placeholder');
            if (!placeholder) return;
            const value = option.getAttribute('data-value');
            const text = option.textContent;
            placeholder.textContent = text;
            placeholder.classList.add('custom-select__value');
            placeholder.setAttribute('data-value', value);

            if (select.dataset.select && select.dataset.select.startsWith('employee')) {
                const card = select.closest('.employee-card');
                const employee = employeesList.find(e => String(e.id) === String(value));
                if (employee && card) setEmployeeRole(card, employee.role);
            }

            select.classList.remove('open');
            return;
        }

        const select = e.target.closest('.custom-select');
        if (select && root.contains(select)) {
            e.stopPropagation();
            closeAllSelectsExcept(select);
            select.classList.toggle('open');
        }
    });

    document.addEventListener('click', function () {
        closeAllSelects();
    });
}

function closeAllSelectsExcept(exceptSelect) {
    document.querySelectorAll('.custom-select.open').forEach(function (s) {
        if (s !== exceptSelect) s.classList.remove('open');
    });
}

function closeAllSelects() {
    document.querySelectorAll('.custom-select').forEach(function (s) {
        s.classList.remove('open');
    });
}

// Add Call (общий блок Calls)
function initAddCallButton() {
    const addBtn = document.getElementById('addCallBtn');
    const callsBody = document.getElementById('callsBody');

    if (!addBtn || !callsBody) return;

    addBtn.addEventListener('click', function () {
        if (document.getElementById('projectDetail')?.getAttribute('data-edit-mode') !== 'true') return;
        const row = document.createElement('div');
        row.className = 'calls-row';
        row.innerHTML = '<input type="text" class="form-input calls-input--date" placeholder="дд.мм.гг/чч:мм">' +
            '<input type="text" class="form-input calls-input--link" placeholder="Insert the link and enter the results after completion">';
        callsBody.appendChild(row);
    });
}


function buildEmployeeOptions() {
    if (!employeesList || employeesList.length === 0) {
        return '<div class="custom-select__option custom-select__option--empty" data-value="">Нет созданных сотрудников</div>';
    }

    return employeesList.map(employee => `
        <div class="custom-select__option" data-value="${employee.id}">${escapeHtml(employee.full_name)}</div>
    `).join('');
}

function fillEmployeeDropdowns() {
    document.querySelectorAll('.custom-select[data-select^="employee"] .custom-select__dropdown').forEach(dropdown => {
        dropdown.innerHTML = buildEmployeeOptions();
    });
}

function setEmployeeRole(card, role) {
    const rolePlaceholder = card.querySelector('.custom-select[data-select^="role"] .custom-select__placeholder');
    if (!rolePlaceholder || !role) return;
    rolePlaceholder.textContent = role;
    rolePlaceholder.classList.add('custom-select__value');
    rolePlaceholder.setAttribute('data-value', role);
}

function setEmployeeCardValue(card, employee) {
    const employeePlaceholder = card.querySelector('.custom-select[data-select^="employee"] .custom-select__placeholder');
    if (!employeePlaceholder || !employee) return;
    employeePlaceholder.textContent = employee.full_name;
    employeePlaceholder.classList.add('custom-select__value');
    employeePlaceholder.setAttribute('data-value', employee.id);
    setEmployeeRole(card, employee.role);
}

function collectSelectedProjectEmployeeIds() {
    const ids = [];
    const seen = new Set();
    document.querySelectorAll('.custom-select[data-select^="employee"] .custom-select__placeholder.custom-select__value').forEach(placeholder => {
        const id = parseInt(placeholder.getAttribute('data-value'), 10);
        if (!Number.isNaN(id) && !seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    });
    return ids;
}

function createEmployeeCard(index, employee = null) {
    const template = document.getElementById('employeeCardTemplate');
    if (!template) return null;

    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector('.employee-card');
    const employeeSelect = fragment.querySelector('.custom-select[data-select^="employee"]');
    const roleSelect = fragment.querySelector('.custom-select[data-select^="role"]');

    if (employeeSelect) employeeSelect.setAttribute('data-select', 'employee' + index);
    if (roleSelect) roleSelect.setAttribute('data-select', 'role' + index);

    const dropdown = fragment.querySelector('.custom-select[data-select^="employee"] .custom-select__dropdown');
    if (dropdown) dropdown.innerHTML = buildEmployeeOptions();

    if (employee && card) setEmployeeCardValue(card, employee);

    return fragment;
}

function renderProjectEmployees(projectEmployees) {
    const list = document.getElementById('employeeList');
    if (!list) return;

    const employees = projectEmployees
        .map(item => item.employee || employeesList.find(employee => employee.id === item.employee_id))
        .filter(Boolean);

    list.innerHTML = '';

    if (employees.length === 0) {
        const emptyCard = createEmployeeCard(1);
        if (emptyCard) list.appendChild(emptyCard);
        return;
    }

    employees.forEach((employee, index) => {
        const card = createEmployeeCard(index + 1, employee);
        if (card) list.appendChild(card);
    });
}

// Add employee — одна кнопка под последним блоком; новая карточка в конец списка, кнопка остаётся снизу
function initAddEmployee() {
    const btn = document.getElementById('addEmployeeBtn');
    const list = document.getElementById('employeeList');

    if (!btn || !list) return;

    btn.addEventListener('click', function () {
        const projectDetail = document.getElementById('projectDetail');
        if (projectDetail?.getAttribute('data-edit-mode') !== 'true') return;

        const nextIndex = list.querySelectorAll('.employee-card').length + 1;
        const fragment = createEmployeeCard(nextIndex);
        if (fragment) list.appendChild(fragment);
    });
}
// Инициализация кнопки Delete
function initDeleteButton() {
    const deleteBtn = document.getElementById('deleteProjectBtn');
    if (!deleteBtn) return;

    deleteBtn.addEventListener('click', async function() {
        if (!projectId) {
            notify.error('Невозможно удалить новый проект');
            return;
        }

        const projectName = document.getElementById('projectNameInput')?.value || 'этот проект';
        notify.confirm(`Вы уверены, что хотите удалить проект "${projectName}"? Это действие невозможно отменить.`, async () => {
            try {
                const res = await fetch(`/api/v1/projects/${projectId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    const err = await res.json();
                    notify.error('Ошибка при удалении: ' + (err.detail || 'Неизвестная ошибка'));
                    return;
                }

                notify.success('Проект успешно удален');
                window.location.href = '/index.html';
            } catch (error) {
                notify.error('Ошибка сети: ' + error.message);
            }
        });
    });
}

// Загрузка созвонов проекта
async function loadProjectCalls() {
    if (!projectId) return;
    
    try {
        const response = await fetch(`/api/v1/calls?project_id=${projectId}`);
        if (!response.ok) throw new Error('Failed to load calls');
        
        const calls = await response.json();
        renderProjectCalls(calls);
    } catch (error) {
        console.error('Error loading project calls:', error);
        notify.error('Ошибка при загрузке созвонов');
    }
}

// Отображение созвонов в сетке
function renderProjectCalls(calls) {
    const grid = document.getElementById('projectCallsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (calls.length === 0) {
        grid.innerHTML = '<div class="no-calls-message">Нет созвонов для этого проекта</div>';
        return;
    }
    
    calls.forEach(call => {
        const card = createProjectCallCard(call);
        grid.appendChild(card);
    });
}

// Создание карточки созвона для проекта
function createProjectCallCard(call) {
    const card = document.createElement('div');
    card.className = 'project-call-card';
    card.dataset.id = call.id;
    
    let statusClass = '';
    let statusText = '';
    switch (call.status) {
        case 'scheduled':
            statusClass = 'status-scheduled';
            statusText = 'Запланирован';
            break;
        case 'in_progress':
            statusClass = 'status-in-progress';
            statusText = 'В процессе';
            break;
        case 'completed':
            statusClass = 'status-completed';
            statusText = 'Завершен';
            break;
        case 'cancelled':
            statusClass = 'status-cancelled';
            statusText = 'Отменен';
            break;
    }
    
    const participantsText = call.participants && call.participants.length > 0 
        ? call.participants.map(p => p.employee?.full_name || 'Unknown').join(', ')
        : 'Нет участников';
    
    card.innerHTML = `
        <div class="project-call-card__header">
            <h3 class="project-call-card__title">${escapeHtml(call.title || 'Без названия')}</h3>
            <span class="project-call-card__status ${statusClass}">${statusText}</span>
        </div>
        <div class="project-call-card__info">
            <div class="project-call-card__datetime">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${escapeHtml(call.scheduled_datetime || '')}
            </div>
            ${call.duration_minutes ? `<div class="project-call-card__duration">⏱ ${call.duration_minutes} мин</div>` : ''}
            <div class="project-call-card__participants">👥 ${escapeHtml(participantsText)}</div>
            ${call.meeting_link ? `<div class="project-call-card__link"><a href="${escapeHtml(call.meeting_link)}" target="_blank">Ссылка на встречу</a></div>` : ''}
        </div>
        ${call.result ? `<div class="project-call-card__result"><strong>Результат:</strong> ${escapeHtml(call.result)}</div>` : ''}
    `;
    
    return card;
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Загрузка созвонов при загрузке проекта
if (projectId && !isNewProject) {
    document.addEventListener('DOMContentLoaded', async function () {
        await loadProjectCalls();
    });
}
