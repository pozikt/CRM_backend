// project.js - Project page logic
// project.js - Project page logic
const urlParams = new URLSearchParams(window.location.search);
const isNewProject = urlParams.get('new') === 'true';
const projectId = urlParams.get('id'); // для будущего редактирования
let statusesList = [];
let prioritiesList = [];

document.addEventListener('DOMContentLoaded', async function () {
    // Загружаем справочники статусов и приоритетов
    await loadStatusesAndPriorities();

    initEditProjectMode();
    initCustomSelects();
    initAddCallButton();
    initAddEmployee();
    initDateMasks();

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
    }
});

async function loadStatusesAndPriorities() {
    try {
        const [statusRes, priorityRes] = await Promise.all([
            fetch('/api/v1/statuses'),
            fetch('/api/v1/priorities')
        ]);
        statusesList = await statusRes.json();
        prioritiesList = await priorityRes.json();

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
        // Собираем данные из формы
        const nameInput = document.getElementById('projectNameInput');
        const projectName = nameInput ? nameInput.value.trim() : 'Новый проект';
        
        const statusPlaceholder = projectDetail.querySelector('.custom-select[data-select="status"] .custom-select__value');
        const statusText = statusPlaceholder ? statusPlaceholder.textContent.trim() : '';
        const status = statusesList.find(s => s.name === statusText);
        const status_id = status ? status.id : 1;
        
        const priorityPlaceholder = projectDetail.querySelector('.custom-select[data-select="priority"] .custom-select__value');
        const priorityText = priorityPlaceholder ? priorityPlaceholder.textContent.trim() : '';
        const priority = prioritiesList.find(p => p.name === priorityText);
        const priority_id = priority ? priority.id : 1;
        
        const progressInput = document.getElementById('projectProgress');
        const progress = progressInput ? parseInt(progressInput.value) || 0 : 0;
        
        const payload = {
            name: projectName, // <-- теперь переменная существует
            description: '',
            status_id: status_id,
            priority_id: priority_id,
            manager_id: null,
            progress: progress,
            start_date: new Date().toISOString(),
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
            alert('Ошибка сети: ' + error.message);
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

    setEditMode(isNewProject); // для нового сразу режим редактирования
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

// Add employee — одна кнопка под последним блоком; новая карточка в конец списка, кнопка остаётся снизу
function initAddEmployee() {
    const btn = document.getElementById('addEmployeeBtn');
    const list = document.getElementById('employeeList');
    const template = document.getElementById('employeeCardTemplate');

    if (!btn || !list || !template) return;

    let nextRoleIndex = list.querySelectorAll('.employee-card').length;

    btn.addEventListener('click', function () {
        const projectDetail = document.getElementById('projectDetail');
        if (projectDetail?.getAttribute('data-edit-mode') !== 'true') return;

        nextRoleIndex += 1;
        const fragment = template.content.cloneNode(true);
        const select = fragment.querySelector('.custom-select');
        if (select) select.setAttribute('data-select', 'role' + nextRoleIndex);
        list.appendChild(fragment);

        const isEdit = projectDetail.getAttribute('data-edit-mode') === 'true';
        const newCard = list.lastElementChild;
        if (newCard) {
            newCard.querySelectorAll('.form-input').forEach(function (inp) {
                inp.readOnly = !isEdit;
            });
        }
    });
}

