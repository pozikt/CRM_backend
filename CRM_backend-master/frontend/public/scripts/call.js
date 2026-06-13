// call.js

class CallsManager {
    constructor() {
        this.API_BASE = '/api/v1';
        
        this.allCalls = [];
        this.allProjects = [];
        this.allEmployees = [];
        this.currentProjectFilter = [];
        this.currentStatusFilter = [];
        this.lastAppliedProjectFilter = [];
        this.lastAppliedStatusFilter = [];
        this.selectedParticipants = [];
        
        this.isCallsPage = !!document.getElementById('callsGrid');
        
        this.STATUS = {
            SCHEDULED: 'scheduled',
            IN_PROGRESS: 'in_progress',
            COMPLETED: 'completed',
            CANCELLED: 'cancelled'
        };
        
        this.statusCheckInterval = null;
        
        this.init();
    }
    
    async init() {
        await this.loadProjects();
        await this.loadEmployees();
        
        this.initCallModal();
        this.initCallViewModal();
        this.initRescheduleModal();
        this.initCompleteModal();
        
        if (this.isCallsPage) {
            await this.loadCalls();
            this.initCallFilters();
            this.initCallSearchModal();
            this.startAutoStatusCheck();
        }
    }
    
    parseLocalDateTime(dateTimeStr) {
        if (!dateTimeStr) return null;
        const match = dateTimeStr.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/);
        if (!match) return null;
        return new Date(match[3], match[2] - 1, match[1], match[4], match[5]);
    }

    async checkAndUpdateSingleCallStatus(callId) {
        const call = this.allCalls.find(c => c.id === callId);
        if (!call) return;
        
        const newStatus = this.calculateCurrentStatus(call);
        if (newStatus !== call.status) {
            const success = await this.updateCallStatus(call.id, newStatus);
            if (success) {
                call.status = newStatus;
                this.applyFiltersAndSearch();
                this.updateCurrentViewModal();
            }
        }
    }
    
    async cancelCall(callId) {
        const success = await this.updateCallStatus(callId, this.STATUS.CANCELLED);
        if (success) {
            this.showNotification('Созвон отменён', 'success');
            await this.loadCalls();
        }
        return success;
    }
    
    async completeCall(callId) {
        const success = await this.updateCallStatus(callId, this.STATUS.COMPLETED);
        if (success) {
            this.showNotification('Созвон завершён', 'success');
            await this.loadCalls();
        }
        return success;
    }
    
    async rescheduleCall(callId, newDateTime) {
        const call = this.allCalls.find(c => c.id === callId);
        if (!call) return false;
        
        const newStatus = call.status === this.STATUS.CANCELLED ? this.STATUS.CANCELLED : this.STATUS.SCHEDULED;
        
        const updateData = {
            scheduled_datetime: newDateTime,
            status: newStatus
        };
        
        const res = await fetch(`${this.API_BASE}/calls/${callId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (res.ok) {
            this.showNotification('Созвон перенесён', 'success');
            await this.loadCalls();
            await this.checkAndUpdateSingleCallStatus(callId);
            return true;
        }
        this.showNotification('Ошибка при переносе', 'error');
        return false;
    }
    
    async createCall(data) {
        const payload = {
            ...data,
            status: this.STATUS.SCHEDULED
        };
        
        const res = await fetch(`${this.API_BASE}/calls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            const newCall = await res.json();
            if (this.isCallsPage) await this.loadCalls();
            this.showNotification('Созвон создан', 'success');

            if (newCall && newCall.id) {
                await this.checkAndUpdateSingleCallStatus(newCall.id);
            }
            
            return true;
        }
        const error = await res.json();
        this.showNotification('Ошибка: ' + (error.detail || 'Неизвестная ошибка'), 'error');
        return false;
    }
    
    async updateCall(id, data) {
        const { status, ...cleanData } = data;
        
        const res = await fetch(`${this.API_BASE}/calls/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanData)
        });
        
        if (res.ok) {
            if (this.isCallsPage) await this.loadCalls();
            this.showNotification('Созвон обновлён', 'success');
            return true;
        }
        const error = await res.json();
        this.showNotification('Ошибка: ' + (error.detail || 'Неизвестная ошибка'), 'error');
        await this.checkAndUpdateSingleCallStatus(id);
        return false;
    }
    
    async deleteCall(id) {
        const res = await fetch(`${this.API_BASE}/calls/${id}`, { method: 'DELETE' });
        if (res.ok) {
            if (this.isCallsPage) await this.loadCalls();
            this.showNotification('Созвон удалён', 'success');
        } else {
            this.showNotification('Ошибка при удалении', 'error');
        }
        return res.ok;
    }
    
    async loadProjects() {
        try {
            const res = await fetch(`${this.API_BASE}/projects?limit=1000`);
            if (!res.ok) throw new Error('Ошибка загрузки проектов');
            this.allProjects = await res.json();
            this.updateProjectSelect();
            this.updateProjectFilterDropdown();
        } catch (err) {
            console.error('Ошибка загрузки проектов:', err);
        }
    }
    
    async loadEmployees() {
        try {
            const res = await fetch(`${this.API_BASE}/employees`);
            if (!res.ok) throw new Error('Ошибка загрузки сотрудников');
            this.allEmployees = await res.json();
        } catch (err) {
            console.error('Ошибка загрузки сотрудников:', err);
        }
    }
    
    async loadCalls() {
        try {
            const res = await fetch(`${this.API_BASE}/calls`);
            if (!res.ok) throw new Error('Ошибка загрузки созвонов');
            this.allCalls = await res.json();
            this.applyFiltersAndSearch();
        } catch (err) {
            console.error('Ошибка загрузки созвонов:', err);
            if (document.getElementById('callsGrid')) {
                document.getElementById('callsGrid').innerHTML = '<div class="no-calls" style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Ошибка загрузки созвонов</div>';
            }
        }
    }
    
    updateProjectSelect() {
        const dropdown = document.getElementById('callProjectDropdown');
        if (dropdown) {
            dropdown.innerHTML = this.allProjects.map(p => `
                <div class="custom-select__option" data-value="${p.id}">${this.escapeHtml(p.name)}</div>
            `).join('');
        }
    }
    
    updateProjectFilterDropdown() {
        const dropdown = document.getElementById('projectFilterDropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = this.allProjects.map(project => `
            <label class="filter-option">
                <input type="checkbox" name="project" value="${project.id}">
                <span class="checkbox-custom"></span>
                <span>${this.escapeHtml(project.name)}</span>
            </label>
        `).join('');
    }
    
    applyFiltersAndSearch() {
        if (!this.isCallsPage) return;
        
        let filtered = [...this.allCalls];
        
        if (this.currentProjectFilter.length > 0) {
            filtered = filtered.filter(call => this.currentProjectFilter.includes(call.project_id));
        }
        
        if (this.currentStatusFilter.length > 0) {
            filtered = filtered.filter(call => this.currentStatusFilter.includes(call.status));
        }
        
        const searchTerm = this._currentSearch || '';
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(call => 
                (call.title && call.title.toLowerCase().includes(lowerSearchTerm)) ||
                (call.project?.name && call.project.name.toLowerCase().includes(lowerSearchTerm))
            );
        }
        
        this.renderCalls(filtered);
    }
    
    renderCalls(calls) {
        const grid = document.getElementById('callsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (calls.length === 0) {
            grid.innerHTML = '<div class="no-calls" style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">No calls found</div>';
            return;
        }
        
        calls.forEach(call => {
            const card = this.createCallCard(call);
            grid.appendChild(card);
        });
    }
    
    createCallCard(call) {
        const card = document.createElement('div');
        card.className = 'call-card';
        card.dataset.id = call.id;
        
        let statusClass = '';
        let statusText = '';
        switch (call.status) {
            case this.STATUS.SCHEDULED:
                statusClass = 'status-scheduled';
                statusText = 'Scheduled';
                break;
            case this.STATUS.IN_PROGRESS:
                statusClass = 'status-in-progress';
                statusText = 'In Progress';
                break;
            case this.STATUS.COMPLETED:
                statusClass = 'status-completed';
                statusText = 'Completed';
                break;
            case this.STATUS.CANCELLED:
                statusClass = 'status-cancelled';
                statusText = 'Cancelled';
                break;
        }
        
        let actionButtons = '';
        if (call.status === this.STATUS.SCHEDULED) {
            actionButtons = `
                <button type="button" class="btn-reschedule-call">Reschedule</button>
                <button type="button" class="btn-cancel-call">Cancel</button>
            `;
        } else if (call.status === this.STATUS.IN_PROGRESS) {
            actionButtons = `
                <button type="button" class="btn-complete-call">Complete</button>
            `;
        } else {
            actionButtons = '';
        }
        
        card.innerHTML = `
            <h3 class="call-card__title call-card__title--clickable">${this.escapeHtml(call.title || 'Untitled Call')}</h3>
            <div class="call-card__project">Project: ${this.escapeHtml(call.project?.name || 'Unknown Project')}</div>
            <div class="call-card__datetime">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#686B73" stroke-width="2" stroke-linecap="round"/>
                </svg>
                ${this.escapeHtml(call.scheduled_datetime || '')}
            </div>
            ${call.duration_minutes ? `<div class="call-card__duration">Duration: ${call.duration_minutes} min</div>` : ''}
            <span class="call-card__status ${statusClass}">${statusText}</span>
            <div class="call-actions">
                <button type="button" class="btn-edit-call">Edit</button>
                ${actionButtons}
                <button type="button" class="btn-delete-call">Delete</button>
            </div>
        `;
        
        const editBtn = card.querySelector('.btn-edit-call');
        const delBtn = card.querySelector('.btn-delete-call');
        const cancelBtn = card.querySelector('.btn-cancel-call');
        const completeBtn = card.querySelector('.btn-complete-call');
        const rescheduleBtn = card.querySelector('.btn-reschedule-call');
        
        editBtn.onclick = (e) => {
            e.stopPropagation();
            openEditCallModal(call);
        };
        
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm('Удалить созвон?')) {
                await this.deleteCall(call.id);
            }
        };
        
        if (cancelBtn) {
            cancelBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Отменить созвон?')) {
                    await this.cancelCall(call.id);
                }
            };
        }
        
        if (completeBtn) {
            completeBtn.onclick = (e) => {
                e.stopPropagation();
                this.openCompleteCallModal(call);
            };
        }
        
        if (rescheduleBtn) {
            rescheduleBtn.onclick = (e) => {
                e.stopPropagation();
                this.openRescheduleModal(call);
            };
        }

        const titleElement = card.querySelector('.call-card__title');
        if (titleElement) {
            titleElement.onclick = (e) => {
                e.stopPropagation();
                openViewCallModal(call.id);
            };
        }
        
        return card;
    }
    
    openRescheduleModal(call) {
        const modal = document.getElementById('rescheduleCallModal');
        const dateTimeInput = document.getElementById('rescheduleDateTime');
        const cancelBtn = document.getElementById('cancelRescheduleBtn');
        const saveBtn = document.getElementById('saveRescheduleBtn');
        
        if (!modal || !dateTimeInput) return;
        
        this.applyDateTimeMask(dateTimeInput);
        dateTimeInput.value = call.scheduled_datetime || '';
        
        const closeModal = () => {
            modal.classList.remove('modal-active');
            document.body.style.overflow = '';
        };
        
        const saveReschedule = async () => {
            const newDateTime = dateTimeInput.value.trim();
            if (!newDateTime) {
                this.showNotification('Введите новую дату и время', 'error');
                return;
            }
            
            const regex = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/;
            if (!regex.test(newDateTime)) {
                this.showNotification('Неверный формат. Используйте ДД.ММ.ГГГГ ЧЧ:ММ', 'error');
                return;
            }
            
            const success = await this.rescheduleCall(call.id, newDateTime);
            if (success) {
                closeModal();
            }
        };
        
        const newSaveBtn = saveBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.onclick = closeModal;
        newSaveBtn.onclick = saveReschedule;
        
        const handleClickOutside = (e) => { if (e.target === modal) closeModal(); };
        const handleKeyDown = (e) => { if (e.key === 'Escape' && modal.classList.contains('modal-active')) closeModal(); };
        
        modal.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        
        modal.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
    }
    
    openCompleteCallModal(call) {
        const modal = document.getElementById('completeCallModal');
        const resultTextarea = document.getElementById('completeCallResult');
        const cancelBtn = document.getElementById('cancelCompleteBtn');
        const saveBtn = document.getElementById('saveCompleteBtn');
        
        if (!modal || !resultTextarea) return;
        
        const autoResizeTextarea = () => {
            resultTextarea.style.height = 'auto';
            resultTextarea.style.height = resultTextarea.scrollHeight + 'px';
        };
        
        resultTextarea.style.resize = 'none';
        resultTextarea.style.overflowY = 'hidden';
        resultTextarea.addEventListener('input', autoResizeTextarea);
        resultTextarea.value = call.result || '';
        
        const closeModal = () => {
            modal.classList.remove('modal-active');
            document.body.style.overflow = '';
        };
        
        const saveComplete = async () => {
            const resultNotes = resultTextarea.value.trim() || null;
            
            const success = await this.updateCall(call.id, { result: resultNotes });
            if (success) {
                const completeSuccess = await this.completeCall(call.id);
                if (completeSuccess) {
                    closeModal();
                }
            }
        };
        
        const newSaveBtn = saveBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        newCancelBtn.onclick = closeModal;
        newSaveBtn.onclick = saveComplete;
        
        const handleClickOutside = (e) => { if (e.target === modal) closeModal(); };
        const handleKeyDown = (e) => { if (e.key === 'Escape' && modal.classList.contains('modal-active')) closeModal(); };
        
        modal.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        
        modal.classList.add('modal-active');
        document.body.style.overflow = 'hidden';
        setTimeout(autoResizeTextarea, 10);
    }
    
    initRescheduleModal() {
        const modal = document.getElementById('rescheduleCallModal');
        if (!modal) return;
        
        const dateTimeInput = document.getElementById('rescheduleDateTime');
        if (dateTimeInput) {
            this.applyDateTimeMask(dateTimeInput);
        }
    }
    
    initCompleteModal() {
        const modal = document.getElementById('completeCallModal');
        if (!modal) return;
        
        const resultTextarea = document.getElementById('completeCallResult');
        if (resultTextarea) {
            const autoResizeTextarea = () => {
                resultTextarea.style.height = 'auto';
                resultTextarea.style.height = resultTextarea.scrollHeight + 'px';
            };
            resultTextarea.style.resize = 'none';
            resultTextarea.style.overflowY = 'hidden';
            resultTextarea.addEventListener('input', autoResizeTextarea);
        }
    }
    
    calculateCurrentStatus(call) {
        if (call.status === this.STATUS.CANCELLED) return this.STATUS.CANCELLED;
        
        const now = new Date();
        const startTime = this.parseLocalDateTime(call.scheduled_datetime);
        if (!startTime) return call.status;
        
        const durationMs = (call.duration_minutes || 0) * 60 * 1000;
        const endTime = new Date(startTime.getTime() + durationMs);
        
        const nowMs = now.getTime();
        const startMs = startTime.getTime();
        const endMs = endTime.getTime();
        
        if (nowMs < startMs) return this.STATUS.SCHEDULED;
        if (nowMs >= startMs && nowMs <= endMs) return this.STATUS.IN_PROGRESS;
        if (nowMs > endMs) return this.STATUS.COMPLETED;
        
        return call.status;
    }
    
    async updateCallStatus(callId, newStatus) {
        try {
            const res = await fetch(`${this.API_BASE}/calls/${callId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!res.ok && res.status === 404) {
                const call = this.allCalls.find(c => c.id === callId);
                if (call) {
                    const updateRes = await fetch(`${this.API_BASE}/calls/${callId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...call, status: newStatus })
                    });
                    return updateRes.ok;
                }
                return false;
            }
            return res.ok;
        } catch (error) {
            console.error(`Ошибка при обновлении статуса звонка ${callId}:`, error);
            return false;
        }
    }
    
    async updateAllCallsStatuses() {
        if (!this.allCalls.length) return;
        
        let updated = false;
        for (const call of this.allCalls) {
            const newStatus = this.calculateCurrentStatus(call);
            if (newStatus !== call.status) {
                console.log(`Обновление статуса созвона ${call.id}: ${call.status} -> ${newStatus}`);
                const success = await this.updateCallStatus(call.id, newStatus);
                if (success) {
                    call.status = newStatus;
                    updated = true;
                }
            }
        }
        
        if (updated) {
            this.applyFiltersAndSearch();
            this.updateCurrentViewModal();
        }
    }
    
    updateCurrentViewModal() {
        const viewModal = document.getElementById('callViewModal');
        if (viewModal && viewModal.classList.contains('modal-active') && viewModal.dataset.currentCallId) {
            const updatedCall = this.allCalls.find(c => c.id == viewModal.dataset.currentCallId);
            if (updatedCall) this.updateViewModalContent(updatedCall);
        }
    }
    
    updateViewModalContent(call) {
        if (!call) return;
        
        document.getElementById('viewCallProject').textContent = call.project?.name || '—';
        document.getElementById('viewCallDateTime').textContent = call.scheduled_datetime || '—';
        document.getElementById('viewCallDuration').textContent = call.duration_minutes ? `${call.duration_minutes} min` : '—';
        
        const meetingLink = call.meeting_link;
        document.getElementById('viewCallMeetingLink').innerHTML = meetingLink ? 
            `<a href="${meetingLink}" target="_blank" style="color:#C05BF0;">${this.escapeHtml(meetingLink)}</a>` : '—';
        
        const participantsList = call.participants?.map(p => p.employee?.full_name).filter(Boolean).join(', ') || '—';
        document.getElementById('viewCallParticipants').textContent = participantsList;
        
        document.getElementById('viewCallResult').textContent = call.result || '—';
    }
    
    startAutoStatusCheck() {
        if (this.statusCheckInterval) clearInterval(this.statusCheckInterval);
        this.updateAllCallsStatuses();
        this.statusCheckInterval = setInterval(() => {
            console.log('Автоматическая проверка статусов созвонов...');
            this.updateAllCallsStatuses();
        }, 60000);
    }
    
    applyDateTimeMask(input) {
        const showError = (message) => {
            const notification = document.getElementById('notification');
            if (!notification) return;
            notification.textContent = message;
            notification.className = 'notification error';
            notification.classList.remove('hidden');
            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.classList.add('hidden'), 300);
            }, 3000);
        };
        
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 12) value = value.slice(0, 12);
            
            let formatted = '';
            if (value.length > 0) {
                formatted = value.slice(0, 2);
                if (value.length >= 3) formatted += '.' + value.slice(2, 4);
                if (value.length >= 5) formatted += '.' + value.slice(4, 8);
                if (value.length >= 9) formatted += ' ' + value.slice(8, 10);
                if (value.length >= 11) formatted += ':' + value.slice(10, 12);
            }
            e.target.value = formatted;
        });
        
        input.addEventListener('blur', () => {
            const val = input.value.trim();
            if (val.length === 0) return;
            
            const regex = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/;
            if (!regex.test(val)) {
                showError('Введены неверные дата и время');
                input.value = '';
                return;
            }
            
            const day = parseInt(RegExp.$1, 10);
            const month = parseInt(RegExp.$2, 10);
            const year = parseInt(RegExp.$3, 10);
            const hour = parseInt(RegExp.$4, 10);
            const minute = parseInt(RegExp.$5, 10);
            
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                showError('Введены неверные дата и время');
                input.value = '';
                return;
            }
            
            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                showError('Введены неверные дата и время');
                input.value = '';
                return;
            }
        });
    }
    
    initCustomSelects() {
        const projectSelect = document.getElementById('callProjectSelect');
        if (projectSelect) {
            const placeholder = projectSelect.querySelector('.custom-select__placeholder');
            const dropdown = projectSelect.querySelector('.custom-select__dropdown');
            
            if (dropdown && this.allProjects.length > 0) {
                dropdown.innerHTML = this.allProjects.map(p => `
                    <div class="custom-select__option" data-value="${p.id}">${this.escapeHtml(p.name)}</div>
                `).join('');
                
                dropdown.querySelectorAll('.custom-select__option').forEach(opt => {
                    opt.onclick = (e) => {
                        e.stopPropagation();
                        if (placeholder) {
                            placeholder.textContent = opt.textContent;
                            placeholder.classList.add('custom-select__value');
                            placeholder.setAttribute('data-value', opt.dataset.value);
                        }
                        projectSelect.classList.remove('open');
                    };
                });
            }
            
            projectSelect.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('#callModal .custom-select.open').forEach(s => {
                    if (s !== projectSelect) s.classList.remove('open');
                });
                projectSelect.classList.toggle('open');
            };
        }
    }
    
    updateParticipantsTags() {
        const container = document.getElementById('participantsTags');
        if (!container) return;
        
        if (this.selectedParticipants.length === 0) {
            container.innerHTML = '<div class="participants-placeholder">No participants selected</div>';
        } else {
            container.innerHTML = this.selectedParticipants.map(emp => `
                <div class="participant-tag" data-id="${emp.id}">
                    <span>${this.escapeHtml(emp.full_name)}</span>
                    <span class="participant-tag-remove" data-id="${emp.id}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                </div>
            `).join('');
            
            container.querySelectorAll('.participant-tag-remove').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = parseInt(btn.dataset.id);
                    this.selectedParticipants = this.selectedParticipants.filter(p => p.id !== id);
                    this.updateParticipantsTags();
                });
            });
        }
    }
    
    initParticipantsSearch() {
        const searchInput = document.getElementById('participantsSearchInput');
        const dropdown = document.getElementById('participantsSearchDropdown');
        
        if (!searchInput || !dropdown) return;
        
        let debounceTimer;
        
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const searchTerm = searchInput.value.trim().toLowerCase();
                if (searchTerm.length < 1) {
                    dropdown.style.display = 'none';
                    return;
                }
                
                const selectedIds = this.selectedParticipants.map(p => p.id);
                const filtered = this.allEmployees.filter(emp => 
                    !selectedIds.includes(emp.id) && 
                    emp.full_name.toLowerCase().includes(searchTerm)
                );
                
                if (filtered.length === 0) {
                    dropdown.innerHTML = '<div style="padding:12px; text-align:center; color:#9CA3AF;">No employees found</div>';
                    dropdown.style.display = 'block';
                    return;
                }
                
                dropdown.innerHTML = filtered.map(emp => `
                    <div class="participants-search-item" data-id="${emp.id}">
                        <div>
                            <div class="participants-search-item-name">${this.escapeHtml(emp.full_name)}</div>
                            <div class="participants-search-item-role">${this.escapeHtml(emp.role)}</div>
                        </div>
                        <div class="participants-search-item-add">+</div>
                    </div>
                `).join('');
                
                dropdown.querySelectorAll('.participants-search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = parseInt(item.dataset.id);
                        const employee = this.allEmployees.find(e => e.id === id);
                        if (employee && !this.selectedParticipants.find(p => p.id === id)) {
                            this.selectedParticipants.push(employee);
                            this.updateParticipantsTags();
                            searchInput.value = '';
                            dropdown.style.display = 'none';
                        }
                    });
                });
                
                dropdown.style.display = 'block';
            }, 300);
        });
        
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
    
    initCallModal() {
        const modal = document.getElementById('callModal');
        if (!modal) return;
        
        const cancelBtn = document.getElementById('cancelCallBtn');
        const saveBtn = document.getElementById('saveCallBtn');
        const titleInput = document.getElementById('callTitle');
        const dateTimeInput = document.getElementById('callDateTime');
        const durationInput = document.getElementById('callDuration');
        const meetingLinkInput = document.getElementById('callMeetingLink');
        const resultTextarea = document.getElementById('callResult');
        
        if (dateTimeInput) this.applyDateTimeMask(dateTimeInput);
        
        const autoResizeTextarea = () => {
            if (!resultTextarea) return;
            resultTextarea.style.height = 'auto';
            resultTextarea.style.height = resultTextarea.scrollHeight + 'px';
        };
        
        if (resultTextarea) {
            resultTextarea.style.resize = 'none';
            resultTextarea.style.overflowY = 'hidden';
            resultTextarea.addEventListener('input', autoResizeTextarea);
        }
        
        let editId = null;
        
        const openModal = (isEdit, call = null) => {
            this.updateProjectSelect();
            this.initCustomSelects();
            this.initParticipantsSearch();
            
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) modalBody.scrollTop = 0;
            
            if (isEdit && call) {
                document.getElementById('callModalTitle').textContent = 'Edit call';
                editId = call.id;
                if (titleInput) titleInput.value = call.title || '';
                dateTimeInput.value = call.scheduled_datetime || '';
                durationInput.value = call.duration_minutes || 60;
                meetingLinkInput.value = call.meeting_link || '';
                resultTextarea.value = call.result || '';
                
                if (call.project_id) {
                    const projectSelect = document.getElementById('callProjectSelect');
                    const placeholder = projectSelect?.querySelector('.custom-select__placeholder');
                    const project = this.allProjects.find(p => p.id === call.project_id);
                    if (placeholder && project) {
                        placeholder.textContent = project.name;
                        placeholder.classList.add('custom-select__value');
                        placeholder.setAttribute('data-value', call.project_id);
                    }
                }
                
                if (call.participants) {
                    this.selectedParticipants = call.participants.map(p => p.employee).filter(e => e);
                    this.updateParticipantsTags();
                }
            } else {
                document.getElementById('callModalTitle').textContent = 'Add a call';
                editId = null;
                if (titleInput) titleInput.value = '';
                dateTimeInput.value = '';
                durationInput.value = 60;
                meetingLinkInput.value = '';
                resultTextarea.value = '';
                
                const projectSelect = document.getElementById('callProjectSelect');
                const projectPlaceholder = projectSelect?.querySelector('.custom-select__placeholder');
                if (projectPlaceholder) {
                    projectPlaceholder.textContent = 'Select project';
                    projectPlaceholder.classList.remove('custom-select__value');
                    projectPlaceholder.removeAttribute('data-value');
                }
                
                this.selectedParticipants = [];
                this.updateParticipantsTags();
            }
            
            setTimeout(() => { if (resultTextarea) autoResizeTextarea(); }, 10);
            
            modal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';
        };
        
        window.openAddCallModal = () => openModal(false);
        window.openEditCallModal = (call) => openModal(true, call);
        
        const closeModal = () => {
            modal.classList.remove('modal-active');
            document.body.style.overflow = '';
            const searchInput = document.getElementById('participantsSearchInput');
            if (searchInput) searchInput.value = '';
            const dropdown = document.getElementById('participantsSearchDropdown');
            if (dropdown) dropdown.style.display = 'none';
        };
        
        const save = async () => {
            const projectSelect = document.getElementById('callProjectSelect');
            const projectValue = projectSelect?.querySelector('.custom-select__value');
            const projectId = projectValue ? projectValue.getAttribute('data-value') : '';
            
            const title = titleInput ? titleInput.value.trim() : '';
            const scheduledDatetime = dateTimeInput.value;
            const durationMinutes = parseInt(durationInput.value) || 60;
            const meetingLink = meetingLinkInput.value.trim();
            const result = resultTextarea.value.trim() || null;
            const participantIds = this.selectedParticipants.map(p => p.id);
            
            if (!projectId) {
                this.showNotification('Выберите проект', 'error');
                return;
            }
            
            if (!title) {
                this.showNotification('Введите название созвона', 'error');
                return;
            }
            
            if (!scheduledDatetime) {
                this.showNotification('Выберите дату и время', 'error');
                return;
            }
            
            if (!meetingLink) {
                this.showNotification('Введите ссылку на созвон (Zoom, Google Meet, Яндекс Телемост и т.д.)', 'error');
                return;
            }
            
            if (participantIds.length === 0) {
                this.showNotification('Выберите хотя бы одного участника', 'error');
                return;
            }
            
            const datetimeRegex = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/;
            if (!datetimeRegex.test(scheduledDatetime)) {
                this.showNotification('Используйте формат: ДД.ММ.ГГГГ ЧЧ:ММ', 'error');
                return;
            }
            
            const data = {
                project_id: parseInt(projectId),
                title: title,
                scheduled_datetime: scheduledDatetime,
                duration_minutes: durationMinutes,
                meeting_link: meetingLink,
                result: result,
                participant_ids: participantIds
            };
            
            let success;
            if (editId) {
                success = await this.updateCall(editId, data);
            } else {
                success = await this.createCall(data);
            }
            
            if (success) closeModal();
        };
        
        if (cancelBtn) cancelBtn.onclick = closeModal;
        if (saveBtn) saveBtn.onclick = save;
        
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('modal-active')) closeModal(); });
    }
    
    initCallViewModal() {
        const viewModal = document.getElementById('callViewModal');
        if (!viewModal) return;
        
        const closeBtn = document.getElementById('closeCallViewModalBtn');
        let currentCallId = null;
        
        window.openViewCallModal = async (callId) => {
            try {
                const res = await fetch(`${this.API_BASE}/calls/${callId}`);
                if (!res.ok) throw new Error('Созвон не найден');
                const call = await res.json();
                currentCallId = call.id;
                viewModal.dataset.currentCallId = callId;
                this.updateViewModalContent(call);
                viewModal.classList.add('modal-active');
                document.body.style.overflow = 'hidden';
            } catch (error) {
                console.error('Ошибка:', error);
                this.showNotification('Не удалось загрузить данные созвона', 'error');
            }
        };
        
        const closeModal = () => {
            viewModal.classList.remove('modal-active');
            document.body.style.overflow = '';
            currentCallId = null;
            delete viewModal.dataset.currentCallId;
        };
        
        if (closeBtn) closeBtn.onclick = closeModal;
        
        viewModal.addEventListener('click', (e) => { if (e.target === viewModal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && viewModal.classList.contains('modal-active')) closeModal(); });
    }
    
    initCallFilters() {
        if (!this.isCallsPage) return;
        
        const filterBtn = document.getElementById('filterCallsBtn');
        const filterModal = document.getElementById('callFilterModal');
        if (!filterBtn || !filterModal) return;
        
        const cancelBtn = document.getElementById('callFilterCancelBtn');
        const applyBtn = document.getElementById('callFilterApplyBtn');
        const projectDropdown = document.getElementById('projectFilterDropdown');
        const statusDropdown = document.getElementById('statusFilterDropdown');
        
        const updateSelectorText = () => {
            const projectSelector = document.querySelector('#callFilterModal .filter-selector[data-filter="project"] .filter-placeholder');
            const statusSelector = document.querySelector('#callFilterModal .filter-selector[data-filter="status"] .filter-placeholder');
            
            const selectedProjects = [];
            const selectedStatuses = [];
            
            if (projectDropdown) {
                projectDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    const project = this.allProjects.find(p => p.id == cb.value);
                    selectedProjects.push(project?.name || cb.value);
                });
            }
            
            if (statusDropdown) {
                statusDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    let text = '';
                    switch (cb.value) {
                        case this.STATUS.SCHEDULED: text = 'Scheduled'; break;
                        case this.STATUS.IN_PROGRESS: text = 'In Progress'; break;
                        case this.STATUS.COMPLETED: text = 'Completed'; break;
                        case this.STATUS.CANCELLED: text = 'Cancelled'; break;
                        default: text = cb.value;
                    }
                    selectedStatuses.push(text);
                });
            }
            
            if (projectSelector) {
                if (selectedProjects.length === 0) projectSelector.textContent = 'Choose a project';
                else if (selectedProjects.length === 1) projectSelector.textContent = selectedProjects[0];
                else projectSelector.textContent = `${selectedProjects.length} projects selected`;
            }
            
            if (statusSelector) {
                if (selectedStatuses.length === 0) statusSelector.textContent = 'Choose a status';
                else if (selectedStatuses.length === 1) statusSelector.textContent = selectedStatuses[0];
                else statusSelector.textContent = `${selectedStatuses.length} statuses selected`;
            }
        };
        
        const openFilterModal = () => {
            this.lastAppliedProjectFilter = [...this.currentProjectFilter];
            this.lastAppliedStatusFilter = [...this.currentStatusFilter];
            
            if (projectDropdown) {
                projectDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                    cb.checked = this.currentProjectFilter.includes(parseInt(cb.value));
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
            
            document.querySelectorAll('#callFilterModal .filter-dropdown').forEach(d => d.classList.remove('show'));
            document.querySelectorAll('#callFilterModal .filter-selector').forEach(s => s.classList.remove('active'));
            
            if (cancel) {
                this.currentProjectFilter = [...this.lastAppliedProjectFilter];
                this.currentStatusFilter = [...this.lastAppliedStatusFilter];
                
                if (projectDropdown) {
                    projectDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        cb.checked = this.currentProjectFilter.includes(parseInt(cb.value));
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
            this.currentProjectFilter = [];
            this.currentStatusFilter = [];
            
            if (projectDropdown) {
                projectDropdown.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                    this.currentProjectFilter.push(parseInt(cb.value));
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
            const filterSelectors = document.querySelectorAll('#callFilterModal .filter-selector');
            
            filterSelectors.forEach(selector => {
                selector.onclick = (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('#callFilterModal .filter-dropdown').forEach(d => {
                        if (d !== selector.nextElementSibling) d.classList.remove('show');
                    });
                    document.querySelectorAll('#callFilterModal .filter-selector').forEach(s => {
                        if (s !== selector) s.classList.remove('active');
                    });
                    
                    const dropdown = selector.nextElementSibling;
                    dropdown.classList.toggle('show');
                    selector.classList.toggle('active');
                };
            });
            
            document.addEventListener('click', function(e) {
                if (!e.target.closest('#callFilterModal .filter-group')) {
                    document.querySelectorAll('#callFilterModal .filter-dropdown').forEach(d => d.classList.remove('show'));
                    document.querySelectorAll('#callFilterModal .filter-selector').forEach(s => s.classList.remove('active'));
                }
            });
        };
        
        if (statusDropdown) {
            statusDropdown.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.addEventListener('change', updateSelectorText);
            });
        }
        
        initFilterDropdowns();
        
        filterBtn.onclick = openFilterModal;
        if (cancelBtn) cancelBtn.onclick = () => closeFilterModal(true);
        if (applyBtn) applyBtn.onclick = applyFilters;
        
        filterModal.addEventListener('click', (e) => { if (e.target === filterModal) closeFilterModal(true); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && filterModal.classList.contains('modal-active')) closeFilterModal(true); });
    }
    
    _updateFilterBtnLabel() {
        const filterBtn = document.getElementById('filterCallsBtn');
        if (!filterBtn) return;
        
        const totalActive = this.currentProjectFilter.length + this.currentStatusFilter.length;
        
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
    
    initCallSearchModal() {
        if (!this.isCallsPage) return;
        
        const searchBtn = document.getElementById('searchCallsBtn');
        const searchModal = document.getElementById('searchModalCalls');
        const closeBtn = document.getElementById('searchCallsCloseBtn');
        const searchInput = document.getElementById('searchCallsInput');
        const clearBtn = document.getElementById('searchCallsClearBtn');
        
        if (!searchBtn || !searchModal) return;
        
        const openModal = () => {
            searchModal.classList.add('modal-active');
            document.body.style.overflow = 'hidden';
            if (searchInput) {
                searchInput.value = this._currentSearch || '';
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
            this.applyFiltersAndSearch();
            this._updateSearchBtnLabel();
            closeModal();
        };
        
        const clearSearch = () => {
            if (searchInput) searchInput.value = '';
            this._currentSearch = '';
            this.applyFiltersAndSearch();
            this._updateSearchBtnLabel();
        };
        
        let debounceTimer;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this._currentSearch = searchInput.value.trim();
                    this.applyFiltersAndSearch();
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
        
        searchModal.addEventListener('click', (e) => { if (e.target === searchModal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && searchModal.classList.contains('modal-active')) closeModal(); });
        
        this._currentSearch = '';
    }
    
    _updateSearchBtnLabel() {
        const searchBtn = document.getElementById('searchCallsBtn');
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
    
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
}

const callsManager = new CallsManager();