const API_BASE = '/api/v1';

document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('employeesGrid');
    if (grid) {
        loadEmployees();
        initEmployeeModal();
    }
});

async function loadEmployees() {
    try {
        const res = await fetch(`${API_BASE}/employees`);
        if (!res.ok) throw new Error('Ошибка загрузки');
        const employees = await res.json();
        if (Array.isArray(employees)) {
            renderEmployees(employees);
        } else {
            console.error('Ожидался массив, получено:', employees);
        }
    } catch (err) {
        console.error('Ошибка загрузки:', err);
    }
}

function renderEmployees(employees) {
    const grid = document.getElementById('employeesGrid');
    if (!grid) return;
    
    const existing = new Map();
    grid.querySelectorAll('.project-card').forEach(card => {
        existing.set(parseInt(card.dataset.id), card);
    });

    employees.forEach(emp => {
        if (existing.has(emp.id)) {
            const card = existing.get(emp.id);
            updateCard(card, emp.full_name, emp.role);
            existing.delete(emp.id);
        } else {
            const card = createCard(emp.full_name, emp.role, emp.id);
            grid.appendChild(card);
        }
    });

    existing.forEach(card => card.remove());
}

function updateCard(card, name, role) {
    const title = card.querySelector('.card-title');
    const pill = card.querySelector('.pill');
    if (title) title.textContent = name;
    if (pill) pill.textContent = role;
}

async function createOnServer(data) {
    const res = await fetch(`${API_BASE}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) {
        const newEmp = await res.json();
        const card = createCard(newEmp.full_name, newEmp.role, newEmp.id);
        document.getElementById('employeesGrid').appendChild(card);
    }
    return res.ok;
}

async function updateOnServer(id, data) {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (res.ok) {
        const updated = await res.json();
        const card = document.querySelector(`.project-card[data-id="${id}"]`);
        if (card) updateCard(card, updated.full_name, updated.role);
    }
    return res.ok;
}

async function deleteOnServer(id) {
    const res = await fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' });
    if (res.ok) {
        const card = document.querySelector(`.project-card[data-id="${id}"]`);
        if (card) card.remove();
    }
    return res.ok;
}

function createCard(name, role, id) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.id = id;
    card.innerHTML = `
        <h3 class="card-title text-gradient">${escapeHtml(name)}</h3>
        <div class="card-body">
            <div class="card-row">
                <span class="label">Role</span>
                <span class="pill">${escapeHtml(role)}</span>
            </div>
        </div>
        <div class="employee-actions">
            <button type="button" class="btn-edit-employee">Edit</button>
            <button type="button" class="btn-delete-employee">Delete</button>
        </div>
    `;
    
    const editBtn = card.querySelector('.btn-edit-employee');
    const delBtn = card.querySelector('.btn-delete-employee');

    editBtn.onclick = () => openEditModal(card, name, role, id);
    delBtn.onclick = async () => {
        if (confirm('Удалить?')) await deleteOnServer(id);
    };

    return card;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"]/g, m => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '"') return '&quot;';
        return m;
    });
}

function initEmployeeModal() {
    const modal = document.getElementById('employeeModal');
    const addBtn = document.getElementById('addEmployeePageBtn');
    if (!modal || !addBtn) return;

    const closeBtn = document.getElementById('closeEmployeeModalBtn');
    const cancelBtn = document.getElementById('cancelEmployeeBtn');
    const saveBtn = document.getElementById('saveEmployeeBtn');
    const modalTitle = document.getElementById('employeeModalTitle');
    const roleSelect = document.getElementById('roleSelect');
    const nameInput = document.getElementById('empFullName');
    let editId = null;
    let editCard = null;

    function initSelect() {
        if (!roleSelect) return;
        const placeholder = roleSelect.querySelector('.custom-select__placeholder');
        const dropdown = roleSelect.querySelector('.custom-select__dropdown');
        
        roleSelect.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-select.open').forEach(s => {
                if (s !== roleSelect) s.classList.remove('open');
            });
            roleSelect.classList.toggle('open');
        };
        
        dropdown.querySelectorAll('.custom-select__option').forEach(opt => {
            opt.onclick = (e) => {
                e.stopPropagation();
                placeholder.textContent = opt.textContent;
                placeholder.classList.add('custom-select__value');
                roleSelect.classList.remove('open');
            };
        });
        
        document.onclick = () => roleSelect.classList.remove('open');
    }

    function openModal(isEdit, id, name, role, card) {
        const placeholder = roleSelect.querySelector('.custom-select__placeholder');
        if (isEdit) {
            modalTitle.textContent = 'Edit employee';
            editId = id;
            editCard = card;
            nameInput.value = name;
            placeholder.textContent = role;
            placeholder.classList.add('custom-select__value');
        } else {
            modalTitle.textContent = 'Add employee';
            editId = null;
            editCard = null;
            nameInput.value = '';
            placeholder.textContent = 'Choosing a role';
            placeholder.classList.remove('custom-select__value');
        }
        modal.classList.add('modal-active'); 
    }

    window.openEditModal = function(card, name, role, id) {
        openModal(true, id, name, role, card);
    };

    function closeModal() {
        modal.classList.remove('modal-active');
    }

    async function save() {
        const name = nameInput.value.trim();
        const placeholder = roleSelect.querySelector('.custom-select__placeholder');
        const role = placeholder.textContent;
         
        if (!name || !role || role === 'Choosing a role') {
            alert('Заполните все поля');
            return;
        }
        
        const data = { full_name: name, role: role };
        
        if (editId) {
            await updateOnServer(editId, data);
        } else {
            await createOnServer(data);
        }
        closeModal();
    }

    addBtn.onclick = (e) => { e.preventDefault(); openModal(false); };
    if (closeBtn) closeBtn.onclick = (e) => { e.preventDefault(); closeModal(); };
    if (cancelBtn) cancelBtn.onclick = (e) => { e.preventDefault(); closeModal(); };
    if (saveBtn) saveBtn.onclick = (e) => { e.preventDefault(); save(); };

    initSelect();
}