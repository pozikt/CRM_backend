"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class AuthModal {
    constructor() {
        this.errorTimeout = null;
        this.isInitialized = false;
        console.log('AuthModal constructor called');
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        }
        else {
            this.init();
        }
    }
    init() {
        console.log('AuthModal init started');
        try {
            this.overlay = document.getElementById('popupOverlay');
            this.closeBtn = document.getElementById('closePopupBtn');
            if (!this.overlay) {
                console.error('popupOverlay not found');
                return;
            }
            if (!this.closeBtn) {
                console.error('closePopupBtn not found');
                return;
            }
            console.log('Elements found successfully');
            this.screens = {
                login: document.getElementById('loginScreen'),
                register: document.getElementById('registerScreen'),
                forgot: document.getElementById('forgotScreen')
            };
            this.errors = {
                login: document.getElementById('loginError'),
                register: document.getElementById('registerError'),
                forgot: document.getElementById('forgotError')
            };
            this.loginForm = document.getElementById('loginForm');
            this.emailInput = document.getElementById('email');
            this.passwordInput = document.getElementById('password');
            this.loginSubmitBtn = document.getElementById('loginSubmitBtn');
            this.registerForm = document.getElementById('registerForm');
            this.regName = document.getElementById('regName');
            this.regEmail = document.getElementById('regEmail');
            this.regPassword = document.getElementById('regPassword');
            this.regConfirm = document.getElementById('regConfirm');
            this.registerSubmitBtn = document.getElementById('registerSubmitBtn');
            this.forgotForm = document.getElementById('forgotForm');
            this.forgotEmail = document.getElementById('forgotEmail');
            this.forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
            this.forgotLink = document.getElementById('forgotLink');
            this.registerLink = document.getElementById('registerLink');
            this.backToLoginFromRegister = document.getElementById('backToLoginFromRegister');
            this.backToLoginFromForgot = document.getElementById('backToLoginFromForgot');
            this.popupTitle = document.getElementById('popup-title');
            this.popupDesc = document.getElementById('popup-desc');
            this.setupEventListeners();
            setTimeout(() => this.openPopup(), 100);
            this.isInitialized = true;
            console.log('AuthModal initialized successfully');
        }
        catch (error) {
            console.error('Error initializing AuthModal:', error);
        }
    }
    setupEventListeners() {
        if (!this.overlay || !this.closeBtn)
            return;
        this.closeBtn.addEventListener('click', () => this.closePopup());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay)
                this.closePopup();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('hidden')) {
                this.closePopup();
            }
        });
        if (this.registerLink) {
            this.registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.register);
                    this.errors.register.classList.add('hidden');
                    if (this.registerForm)
                        this.registerForm.reset();
                }
            });
        }
        if (this.forgotLink) {
            this.forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.forgot);
                    this.errors.forgot.classList.add('hidden');
                    if (this.forgotForm)
                        this.forgotForm.reset();
                }
            });
        }
        if (this.backToLoginFromRegister) {
            this.backToLoginFromRegister.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.login);
                    this.errors.login.classList.add('hidden');
                }
            });
        }
        if (this.backToLoginFromForgot) {
            this.backToLoginFromForgot.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.login);
                    this.errors.login.classList.add('hidden');
                }
            });
        }
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        if (this.forgotForm) {
            this.forgotForm.addEventListener('submit', (e) => this.handleForgot(e));
        }
        this.setupInputListeners();
    }
    setupInputListeners() {
        var _a, _b, _c, _d, _e, _f, _g;
        const inputs = [
            { input: this.emailInput, error: (_a = this.errors) === null || _a === void 0 ? void 0 : _a.login },
            { input: this.passwordInput, error: (_b = this.errors) === null || _b === void 0 ? void 0 : _b.login },
            { input: this.regName, error: (_c = this.errors) === null || _c === void 0 ? void 0 : _c.register },
            { input: this.regEmail, error: (_d = this.errors) === null || _d === void 0 ? void 0 : _d.register },
            { input: this.regPassword, error: (_e = this.errors) === null || _e === void 0 ? void 0 : _e.register },
            { input: this.regConfirm, error: (_f = this.errors) === null || _f === void 0 ? void 0 : _f.register },
            { input: this.forgotEmail, error: (_g = this.errors) === null || _g === void 0 ? void 0 : _g.forgot }
        ];
        inputs.forEach(({ input, error }) => {
            if (input && error) {
                input.addEventListener('input', () => {
                    error.classList.add('hidden');
                });
            }
        });
    }
    updateAriaLabels(screen) {
        var _a, _b, _c;
        if (!this.popupTitle || !this.popupDesc)
            return;
        if (screen === ((_a = this.screens) === null || _a === void 0 ? void 0 : _a.login)) {
            this.popupTitle.textContent = 'Добро пожаловать!';
            this.popupDesc.textContent = 'Войдите, чтобы продолжить';
        }
        else if (screen === ((_b = this.screens) === null || _b === void 0 ? void 0 : _b.register)) {
            this.popupTitle.textContent = 'Создать аккаунт';
            this.popupDesc.textContent = 'Заполните данные для регистрации';
        }
        else if (screen === ((_c = this.screens) === null || _c === void 0 ? void 0 : _c.forgot)) {
            this.popupTitle.textContent = 'Восстановление пароля';
            this.popupDesc.textContent = 'Мы отправим ссылку на ваш email';
        }
    }
    showScreen(screen) {
        if (!this.screens)
            return;
        this.screens.login.classList.add('hidden');
        this.screens.register.classList.add('hidden');
        this.screens.forgot.classList.add('hidden');
        screen.classList.remove('hidden');
        this.updateAriaLabels(screen);
        setTimeout(() => {
            const firstInput = screen.querySelector('input:not([type="hidden"])');
            if (firstInput)
                firstInput.focus();
        }, 100);
    }
    showError(container, message) {
        if (this.errorTimeout)
            clearTimeout(this.errorTimeout);
        container.textContent = message;
        container.classList.remove('hidden');
        this.errorTimeout = window.setTimeout(() => {
            container.classList.add('hidden');
            this.errorTimeout = null;
        }, 5000);
    }
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification)
            return;
        notification.textContent = message;
        notification.className = 'notification';
        notification.classList.add(type);
        notification.classList.remove('hidden');
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 3000);
    }
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    openPopup() {
        if (!this.overlay) {
            console.error('Cannot open popup: overlay is null');
            return;
        }
        console.log('Opening popup, current classes:', this.overlay.className);
        this.overlay.classList.remove('hidden');
        this.overlay.setAttribute('aria-hidden', 'false');
        if (this.screens) {
            this.showScreen(this.screens.login);
        }
        document.body.style.overflow = 'hidden';
        console.log('Popup opened, classes after:', this.overlay.className);
    }
    closePopup() {
        if (!this.overlay)
            return;
        this.overlay.classList.add('hidden');
        this.overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (this.errors) {
            this.errors.login.classList.add('hidden');
            this.errors.register.classList.add('hidden');
            this.errors.forgot.classList.add('hidden');
        }
        if (this.loginForm)
            this.loginForm.reset();
        if (this.registerForm)
            this.registerForm.reset();
        if (this.forgotForm)
            this.forgotForm.reset();
    }
    handleLogin(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            if (!this.emailInput || !this.passwordInput || !this.loginSubmitBtn || !this.errors)
                return;
            const email = this.emailInput.value.trim();
            const password = this.passwordInput.value.trim();
            if (!email || !password) {
                this.showError(this.errors.login, 'Заполните все поля');
                return;
            }
            if (password.length < 6) {
                this.showError(this.errors.login, 'Пароль должен быть минимум 6 символов');
                return;
            }
            const login = email;
            if (login.includes('@')) {
                if (!this.isValidEmail(login)) {
                    this.showError(this.errors.login, 'Введите корректный email');
                    return;
                }
            }
            else if (login.length < 2) {
                this.showError(this.errors.login, 'Введите логин (от 2 символов) или email');
                return;
            }
            this.loginSubmitBtn.disabled = true;
            this.loginSubmitBtn.textContent = 'Вход...';
            try {
                yield new Promise(resolve => setTimeout(resolve, 1500));
                console.log('Успешный вход:', { login });
                this.showNotification('Вход выполнен успешно!', 'success');
                this.closePopup();
            }
            catch (error) {
                this.showError(this.errors.login, 'Ошибка при входе');
                console.error(error);
            }
            finally {
                if (this.loginSubmitBtn) {
                    this.loginSubmitBtn.disabled = false;
                    this.loginSubmitBtn.textContent = 'Войти';
                }
            }
        });
    }
    handleRegister(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            if (!this.regName || !this.regEmail || !this.regPassword || !this.regConfirm ||
                !this.registerSubmitBtn || !this.errors)
                return;
            const name = this.regName.value.trim();
            const email = this.regEmail.value.trim();
            const password = this.regPassword.value.trim();
            const confirm = this.regConfirm.value.trim();
            if (!name || !email || !password || !confirm) {
                this.showError(this.errors.register, 'Заполните все поля');
                return;
            }
            if (password.length < 6) {
                this.showError(this.errors.register, 'Пароль должен быть минимум 6 символов');
                return;
            }
            if (password !== confirm) {
                this.showError(this.errors.register, 'Пароли не совпадают');
                return;
            }
            if (!this.isValidEmail(email)) {
                this.showError(this.errors.register, 'Введите корректный email');
                return;
            }
            this.registerSubmitBtn.disabled = true;
            this.registerSubmitBtn.textContent = 'Регистрация...';
            try {
                yield new Promise(resolve => setTimeout(resolve, 1500));
                console.log('Регистрация:', { name, email });
                this.showNotification('Регистрация прошла успешно!', 'success');
                if (this.emailInput)
                    this.emailInput.value = email;
                if (this.screens)
                    this.showScreen(this.screens.login);
                if (this.registerForm)
                    this.registerForm.reset();
            }
            catch (error) {
                this.showError(this.errors.register, 'Ошибка при регистрации');
                console.error(error);
            }
            finally {
                if (this.registerSubmitBtn) {
                    this.registerSubmitBtn.disabled = false;
                    this.registerSubmitBtn.textContent = 'Зарегистрироваться';
                }
            }
        });
    }
    handleForgot(e) {
        return __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            if (!this.forgotEmail || !this.forgotSubmitBtn || !this.errors)
                return;
            const email = this.forgotEmail.value.trim();
            if (!email) {
                this.showError(this.errors.forgot, 'Введите email');
                return;
            }
            if (!this.isValidEmail(email)) {
                this.showError(this.errors.forgot, 'Введите корректный email');
                return;
            }
            this.forgotSubmitBtn.disabled = true;
            this.forgotSubmitBtn.textContent = 'Отправка...';
            try {
                yield new Promise(resolve => setTimeout(resolve, 1500));
                console.log('Восстановление пароля для:', email);
                this.showNotification('Ссылка для сброса пароля отправлена', 'info');
                if (this.screens)
                    this.showScreen(this.screens.login);
                if (this.forgotForm)
                    this.forgotForm.reset();
            }
            catch (error) {
                this.showError(this.errors.forgot, 'Ошибка при отправке');
                console.error(error);
            }
            finally {
                if (this.forgotSubmitBtn) {
                    this.forgotSubmitBtn.disabled = false;
                    this.forgotSubmitBtn.textContent = 'Отправить';
                }
            }
        });
    }
}
console.log('Creating AuthModal instance');
new AuthModal();
//# sourceMappingURL=auth-modal.js.map