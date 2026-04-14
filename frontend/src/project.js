// project.js - Project page logic

document.addEventListener('DOMContentLoaded', function () {
    initEditProjectMode();
    initCustomSelects();
    initAddCallButton();
    initAddEmployee();
});

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

    function toggleEditMode() {
        const isEdit = projectDetail.getAttribute('data-edit-mode') === 'true';
        setEditMode(!isEdit);
    }

    editBtns.forEach(function (btn) {
        btn.addEventListener('click', toggleEditMode);
    });

    setEditMode(false);
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
