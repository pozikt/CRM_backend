// auth-modal.js

class AuthModal {
    overlay;
    closeBtn;
    screens;
    errors;
    loginForm;
    emailInput;
    passwordInput;
    loginSubmitBtn;
    registerForm;
    regName;
    regEmail;
    regPassword;
    regConfirm;
    registerSubmitBtn;
    forgotForm;
    forgotEmail;
    forgotSubmitBtn;
    forgotLink;
    registerLink;
    backToLoginFromRegister;
    backToLoginFromForgot;
    popupTitle;
    popupDesc;
    errorTimeout = null;
    isInitialized = false;
    isAuthenticated = false;

    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            this.overlay = document.getElementById('popupOverlay');
            this.closeBtn = document.getElementById('closePopupBtn');
            if (!this.overlay || !this.closeBtn) {
                console.warn('AuthModal: popup elements not found, skipping');
                return;
            }

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
            await this.bootstrapSession();
            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing AuthModal:', error);
        }
    }

    async bootstrapSession() {
        if (window.Auth?.isAuthenticated()) {
            const valid = await window.Auth.verifyToken();
            if (valid) {
                this.isAuthenticated = true;
                this.setModalLocked(false);
                this.closePopup();
                return;
            }
            window.Auth.clearToken();
        }

        this.isAuthenticated = false;
        this.setModalLocked(true);
        this.openPopup();
    }

    setupEventListeners() {
        if (!this.overlay || !this.closeBtn) return;

        this.closeBtn.addEventListener('click', () => {
            if (this.isAuthenticated) this.closePopup();
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay && this.isAuthenticated) {
                this.closePopup();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (
                e.key === 'Escape' &&
                this.overlay &&
                !this.overlay.classList.contains('hidden') &&
                this.isAuthenticated
            ) {
                this.closePopup();
            }
        });

        window.addEventListener('auth:required', () => {
            this.isAuthenticated = false;
            this.setModalLocked(true);
            this.openPopup();
            this.showNotification('Сессия истекла. Войдите снова.', 'info');
        });

        if (this.registerLink) {
            this.registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.register);
                    this.errors.register.classList.add('hidden');
                    if (this.registerForm) this.registerForm.reset();
                }
            });
        }
        if (this.forgotLink) {
            this.forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.forgot);
                    this.errors.forgot.classList.add('hidden');
                    if (this.forgotForm) this.forgotForm.reset();
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

        if (this.loginForm) this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (this.registerForm) this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (this.forgotForm) this.forgotForm.addEventListener('submit', (e) => this.handleForgot(e));

        this.setupInputListeners();
    }

    setupInputListeners() {
        const inputs = [
            { input: this.emailInput, error: this.errors?.login },
            { input: this.passwordInput, error: this.errors?.login },
            { input: this.regName, error: this.errors?.register },
            { input: this.regEmail, error: this.errors?.register },
            { input: this.regPassword, error: this.errors?.register },
            { input: this.regConfirm, error: this.errors?.register },
            { input: this.forgotEmail, error: this.errors?.forgot }
        ];
        inputs.forEach(({ input, error }) => {
            if (input && error) {
                input.addEventListener('input', () => error.classList.add('hidden'));
            }
        });
    }

    setModalLocked(locked) {
        if (!this.overlay) return;

        this.overlay.classList.toggle('auth-required', locked);
        document.body.classList.toggle('app-locked', locked);

        if (this.closeBtn) {
            this.closeBtn.style.display = locked ? 'none' : '';
        }
    }

    updateAriaLabels(screen) {
        if (!this.popupTitle || !this.popupDesc) return;
        if (screen === this.screens?.login) {
            this.popupTitle.textContent = 'Добро пожаловать!';
            this.popupDesc.textContent = 'Войдите, чтобы продолжить';
        } else if (screen === this.screens?.register) {
            this.popupTitle.textContent = 'Создать аккаунт';
            this.popupDesc.textContent = 'Заполните данные для регистрации';
        } else if (screen === this.screens?.forgot) {
            this.popupTitle.textContent = 'Восстановление пароля';
            this.popupDesc.textContent = 'Мы отправим ссылку на ваш email';
        }
    }

    showScreen(screen) {
        if (!this.screens) return;
        this.screens.login.classList.add('hidden');
        this.screens.register.classList.add('hidden');
        this.screens.forgot.classList.add('hidden');
        screen.classList.remove('hidden');
        this.updateAriaLabels(screen);
        setTimeout(() => {
            const firstInput = screen.querySelector('input:not([type="hidden"])');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    showError(container, message) {
        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        container.textContent = message;
        container.classList.remove('hidden');
        this.errorTimeout = window.setTimeout(() => {
            container.classList.add('hidden');
            this.errorTimeout = null;
        }, 5000);
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

    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    openPopup() {
        if (!this.overlay) return;
        this.overlay.classList.remove('hidden');
        this.overlay.setAttribute('aria-hidden', 'false');
        if (this.screens) this.showScreen(this.screens.login);
        document.body.style.overflow = 'hidden';
    }

    closePopup() {
        if (!this.overlay || !this.isAuthenticated) return;
        this.overlay.classList.add('hidden');
        this.overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (this.errors) {
            this.errors.login.classList.add('hidden');
            this.errors.register.classList.add('hidden');
            this.errors.forgot.classList.add('hidden');
        }
        if (this.loginForm) this.loginForm.reset();
        if (this.registerForm) this.registerForm.reset();
        if (this.forgotForm) this.forgotForm.reset();
    }

    async handleLogin(e) {
        e.preventDefault();
        if (!this.emailInput || !this.passwordInput || !this.loginSubmitBtn || !this.errors || !window.Auth) return;

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
        } else if (login.length < 2) {
            this.showError(this.errors.login, 'Введите логин (от 2 символов) или email');
            return;
        }

        this.loginSubmitBtn.disabled = true;
        this.loginSubmitBtn.textContent = 'Вход...';
        try {
            await window.Auth.login(login, password);
            this.isAuthenticated = true;
            this.setModalLocked(false);
            this.showNotification('Вход выполнен успешно!', 'success');
            this.closePopup();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ошибка при входе';
            this.showError(this.errors.login, message);
        } finally {
            if (this.loginSubmitBtn) {
                this.loginSubmitBtn.disabled = false;
                this.loginSubmitBtn.textContent = 'Войти';
            }
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        if (!this.regName || !this.regEmail || !this.regPassword || !this.regConfirm ||
            !this.registerSubmitBtn || !this.errors || !window.Auth) return;

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
            await window.Auth.register(name, email, password);
            this.isAuthenticated = true;
            this.setModalLocked(false);
            this.showNotification('Регистрация прошла успешно!', 'success');
            this.closePopup();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Ошибка при регистрации';
            this.showError(this.errors.register, message);
        } finally {
            if (this.registerSubmitBtn) {
                this.registerSubmitBtn.disabled = false;
                this.registerSubmitBtn.textContent = 'Зарегистрироваться';
            }
        }
    }

    async handleForgot(e) {
        e.preventDefault();
        if (!this.forgotEmail || !this.forgotSubmitBtn || !this.errors) return;
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
            await new Promise(resolve => setTimeout(resolve, 800));
            this.showNotification('Восстановление пароля пока недоступно', 'info');
            if (this.screens) this.showScreen(this.screens.login);
            if (this.forgotForm) this.forgotForm.reset();
        } catch (error) {
            this.showError(this.errors.forgot, 'Ошибка при отправке');
            console.error(error);
        } finally {
            if (this.forgotSubmitBtn) {
                this.forgotSubmitBtn.disabled = false;
                this.forgotSubmitBtn.textContent = 'Отправить';
            }
        }
    }
}

new AuthModal();
