/* Project page styles */

.project-detail {
    padding: 40px 0 80px;
}

.project-detail__container {
    width: 1200px;
    max-width: 100%;
    margin: 0 auto;
}

.project-overview,
.project-sections,
.calls-section {
    width: 100%;
}

/* Шапка: надпись «Project» — при наведении на ссылку с лого сдвиг к градиенту (розовый → фиолетовый → синий) */
.header__logo--with-gradient-hover .header__logo-label {
    display: inline-block;
    background-image: linear-gradient(
        115deg,
        #171717 0%,
        #171717 36%,
        #f472b6 48%,
        #c084fc 64%,
        #38bdf8 100%
    );
    background-size: 260% 100%;
    background-position: 0% 50%;
    background-repeat: no-repeat;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    transition: background-position 0.55s cubic-bezier(0.33, 1, 0.68, 1);
}

.header__logo--with-gradient-hover:hover .header__logo-label {
    background-position: 100% 50%;
}

@media (prefers-reduced-motion: reduce) {
    .header__logo--with-gradient-hover .header__logo-label {
        transition: none;
    }

    .header__logo--with-gradient-hover:hover .header__logo-label {
        background-image: linear-gradient(115deg, #f472b6, #c084fc, #38bdf8);
        background-size: 100% 100%;
        background-position: 0% 50%;
    }
}

/* Header adjustments for project page */
.project-detail .header__left .header__vertical-line,
.project-detail .header__left .header__nav {
    display: none;
}

/* Edit the project button - toggles edit mode */
.btn-edit-project {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 12px 24px;
    min-height: 44px;
    border-radius: 999px;
    border: 2px solid #e6e8ec;
    background: #ffffff;
    font-weight: 700;
    font-size: 14px;
    line-height: 1;
    color: #686B73;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-edit-project:hover {
    border-color: #C05BF0;
    color: #C05BF0;
}

.btn-edit-project.btn-edit-project--active {
    border-color: #C05BF0;
    background: linear-gradient(90deg, #C05BF0 0%, #4F7FFF 100%);
    color: #ffffff;
}

.btn-edit-project.btn-edit-project--active:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* Кнопка в колонке Project — как остальные поля строки (input / select), не pill */
.btn-edit-project--in-form {
    width: 100%;
    box-sizing: border-box;
    justify-content: flex-start;
    text-align: left;
    border-radius: 10px;
    border: 1px solid #e6e8ec;
    background-color: #F9FAFB;
    padding: 10px 16px;
    min-height: 44px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: #686B73;
    transform: none;
}

.btn-edit-project--in-form:hover {
    border-color: #C05BF0;
    color: #686B73;
    opacity: 1;
    transform: none;
}

.btn-edit-project--in-form.btn-edit-project--active {
    border-color: #C05BF0;
    background-color: #ffffff;
    color: #000000;
    font-weight: 500;
}

.btn-edit-project--in-form.btn-edit-project--active:hover {
    opacity: 1;
    transform: none;
}

.project-detail[data-edit-mode="false"] .btn-edit-project--in-form {
    background-color: #f0f0f0;
    border-color: #e6e8ec;
    pointer-events: auto;
    opacity: 1;
}

.project-detail[data-edit-mode="true"] .btn-edit-project--in-form {
    border: 1px solid #d1d5db;
    background-color: #ffffff;
}

.project-detail[data-edit-mode="true"] .btn-edit-project--in-form.btn-edit-project--active {
    border-color: #C05BF0;
    background-color: #ffffff;
}

.form-field--edit-trigger {
    min-width: 0;
}

/* Read-only state when edit mode is off */
.project-detail[data-edit-mode="false"] .form-input:not([data-always-enabled]),
.project-detail[data-edit-mode="false"] .custom-select:not([data-always-enabled]),
.project-detail[data-edit-mode="false"] .status-date-field input {
    pointer-events: none;
    opacity: 0.7;
}

/* Add Call buttons — только в режиме редактирования */
.project-detail[data-edit-mode="false"] .btn-add-call {
    display: none;
}

.project-detail[data-edit-mode="false"] .form-input:not([data-always-enabled]),
.project-detail[data-edit-mode="false"] .status-date-field input {
    background-color: #f0f0f0;
}

/* Режим редактирования: светло-серая обводка у полей */
.project-detail[data-edit-mode="true"] .form-input:not([data-always-enabled]),
.project-detail[data-edit-mode="true"] .status-date-field input,
.project-detail[data-edit-mode="true"] .custom-select:not([data-always-enabled]) {
    border: 1px solid #d1d5db;
    background-color: #ffffff;
    opacity: 1;
}

.project-detail[data-edit-mode="true"] .form-input:not([data-always-enabled]):focus,
.project-detail[data-edit-mode="true"] .status-date-field input:focus {
    border-color: #C05BF0;
    background-color: #ffffff;
}

/* Form fields */
.form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.form-row--overview {
    margin-bottom: 40px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 16px;
}

@media (max-width: 1100px) {
    .form-row--overview {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 700px) {
    .form-row--overview {
        grid-template-columns: 1fr;
    }
}

.form-field {
    min-width: 0;
}

.form-field--dropdown {
    min-width: 0;
}

.form-label {
    display: block;
    font-weight: 700;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
    margin-bottom: 8px;
}

.form-row--overview .form-field {
    display: flex;
    flex-direction: column;
}

.form-input {
    width: 100%;
    min-height: 44px;
    padding: 10px 16px;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    background-color: #F9FAFB;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
}

.form-input::placeholder {
    color: #686B73;
}

.form-input:focus {
    outline: none;
    border-color: #C05BF0;
    background-color: #ffffff;
}

/* Custom select */
.custom-select {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 10px 16px;
    background-color: #F9FAFB;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.custom-select:hover {
    border-color: #C05BF0;
}

.custom-select.active {
    border-color: #C05BF0;
    background-color: #ffffff;
}

.custom-select__placeholder {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #686B73;
}

.custom-select__value {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
}

.custom-select__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background-color: #ffffff;
    border: 1px solid #e6e8ec;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    padding: 8px;
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all 0.2s ease;
}

.custom-select.open .custom-select__dropdown {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}

.custom-select__option {
    padding: 10px 12px;
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
    color: #686B73;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.custom-select__option:hover {
    background-color: #F9FAFB;
    color: #C05BF0;
}

/* Section headings */
.section-heading {
    font-weight: 700;
    font-size: 20px;
    line-height: 28px;
    margin: 0 0 24px 0;
}

/* Две колонки: статусы | только сотрудники */
.project-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-bottom: 0;
    align-items: start;
}

.project-right-column {
    display: flex;
    flex-direction: column;
    gap: 0;
    align-items: stretch;
}

/* Project statuses */
.project-statuses {
    background: #ffffff;
    border: 1px solid #e6e8ec;
    border-radius: 24px;
    padding: 24px;
}

.status-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.status-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.status-name {
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
}

.status-dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.status-date-field {
    min-width: 0;
}

.status-date-field label {
    display: block;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: #686B73;
    margin-bottom: 8px;
}

.status-date-field input {
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid #e6e8ec;
    border-radius: 8px;
    background-color: #F9FAFB;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 18px;
    box-sizing: border-box;
}

.status-date-field input:focus {
    outline: none;
    border-color: #C05BF0;
}

/* Employee: отдельная карточка на каждого сотрудника */
.employee-list {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.employee-card {
    background: #ffffff;
    border: 1px solid #e6e8ec;
    border-radius: 24px;
    padding: 24px;
}

.employee-card__title {
    margin: 0 0 20px 0;
}

.employee-block {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.employee-block .form-label {
    margin-bottom: 8px;
}

/* Одна кнопка «Add employee» под списком карточек */
.btn-add-employee {
    margin-top: 24px;
    align-self: flex-start;
}

/* Calls: на всю ширину контейнера, отдельный блок под колонками */
.calls-section {
    margin: 48px 0 0 0;
    background: #ffffff;
    border: 1px solid #e6e8ec;
    border-radius: 24px;
    padding: 28px 32px 32px;
}

.calls-section--full {
    width: 100%;
    box-sizing: border-box;
}

.calls-section .section-heading {
    margin-bottom: 20px;
}

.calls-table {
    margin-bottom: 24px;
    border: 1px solid #e6e8ec;
    border-radius: 16px;
    overflow: hidden;
}

.calls-header {
    display: grid;
    grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
    gap: 20px;
    padding: 16px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #e6e8ec;
    font-weight: 700;
    font-size: 14px;
    line-height: 20px;
    color: #000000;
}

.calls-body {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 8px 0;
    background: #ffffff;
}

.calls-row {
    display: grid;
    grid-template-columns: minmax(160px, 220px) minmax(0, 1fr);
    gap: 20px;
    align-items: center;
    padding: 14px 24px;
    border-bottom: 1px solid #f0f0f0;
}

.calls-row:last-child {
    border-bottom: none;
}

.calls-row .form-input {
    min-height: 44px;
}

.calls-input--date {
    width: 100%;
}

.calls-input--link {
    min-width: 0;
}

.btn-add-call {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    padding: 12px 20px;
    border-radius: 999px;
    border: 2px solid #e6e8ec;
    background: #ffffff;
    font-weight: 600;
    font-size: 14px;
    line-height: 1;
    color: #686B73;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-add-call:hover {
    border-color: #C05BF0;
    color: #C05BF0;
}

.btn-add-call svg {
    flex-shrink: 0;
}

/* Responsive */
@media (max-width: 900px) {
    .project-sections {
        grid-template-columns: 1fr;
    }

    .calls-header,
    .calls-row {
        grid-template-columns: 1fr;
    }

}

