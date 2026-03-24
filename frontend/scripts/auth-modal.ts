// scripts/auth-modal.ts

interface ScreenElements {
    login: HTMLElement;
    register: HTMLElement;
    forgot: HTMLElement;
}

interface ErrorContainers {
    login: HTMLElement;
    register: HTMLElement;
    forgot: HTMLElement;
}

class AuthModal {
    // Используем ! для указания, что свойства будут инициализированы позже
    private overlay!: HTMLElement;
    private closeBtn!: HTMLElement;
    private screens!: ScreenElements;
    private errors!: ErrorContainers;
    
    private loginForm!: HTMLFormElement;
    private emailInput!: HTMLInputElement;
    private passwordInput!: HTMLInputElement;
    private loginSubmitBtn!: HTMLButtonElement;
    
    private registerForm!: HTMLFormElement;
    private regName!: HTMLInputElement;
    private regEmail!: HTMLInputElement;
    private regPassword!: HTMLInputElement;
    private regConfirm!: HTMLInputElement;
    private registerSubmitBtn!: HTMLButtonElement;
    
    private forgotForm!: HTMLFormElement;
    private forgotEmail!: HTMLInputElement;
    private forgotSubmitBtn!: HTMLButtonElement;
    
    private forgotLink!: HTMLElement;
    private registerLink!: HTMLElement;
    private backToLoginFromRegister!: HTMLElement;
    private backToLoginFromForgot!: HTMLElement;
    
    private popupTitle!: HTMLElement;
    private popupDesc!: HTMLElement;
    
    private errorTimeout: number | null = null;
    private isInitialized: boolean = false;
    
    constructor() {
        console.log('AuthModal constructor called');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    private init(): void {
        console.log('AuthModal init started');
        
        try {
            // Получаем элементы
            this.overlay = document.getElementById('popupOverlay') as HTMLElement;
            this.closeBtn = document.getElementById('closePopupBtn') as HTMLElement;
            
            if (!this.overlay) {
                console.error('popupOverlay not found');
                return;
            }
            
            if (!this.closeBtn) {
                console.error('closePopupBtn not found');
                return;
            }
            
            console.log('Elements found successfully');
            
            // Получаем экраны
            this.screens = {
                login: document.getElementById('loginScreen') as HTMLElement,
                register: document.getElementById('registerScreen') as HTMLElement,
                forgot: document.getElementById('forgotScreen') as HTMLElement
            };
            
            // Получаем контейнеры ошибок
            this.errors = {
                login: document.getElementById('loginError') as HTMLElement,
                register: document.getElementById('registerError') as HTMLElement,
                forgot: document.getElementById('forgotError') as HTMLElement
            };
            
            // Получаем формы
            this.loginForm = document.getElementById('loginForm') as HTMLFormElement;
            this.emailInput = document.getElementById('email') as HTMLInputElement;
            this.passwordInput = document.getElementById('password') as HTMLInputElement;
            this.loginSubmitBtn = document.getElementById('loginSubmitBtn') as HTMLButtonElement;
            
            this.registerForm = document.getElementById('registerForm') as HTMLFormElement;
            this.regName = document.getElementById('regName') as HTMLInputElement;
            this.regEmail = document.getElementById('regEmail') as HTMLInputElement;
            this.regPassword = document.getElementById('regPassword') as HTMLInputElement;
            this.regConfirm = document.getElementById('regConfirm') as HTMLInputElement;
            this.registerSubmitBtn = document.getElementById('registerSubmitBtn') as HTMLButtonElement;
            
            this.forgotForm = document.getElementById('forgotForm') as HTMLFormElement;
            this.forgotEmail = document.getElementById('forgotEmail') as HTMLInputElement;
            this.forgotSubmitBtn = document.getElementById('forgotSubmitBtn') as HTMLButtonElement;
            
            // Получаем ссылки
            this.forgotLink = document.getElementById('forgotLink') as HTMLElement;
            this.registerLink = document.getElementById('registerLink') as HTMLElement;
            this.backToLoginFromRegister = document.getElementById('backToLoginFromRegister') as HTMLElement;
            this.backToLoginFromForgot = document.getElementById('backToLoginFromForgot') as HTMLElement;
            
            // Получаем динамические элементы
            this.popupTitle = document.getElementById('popup-title') as HTMLElement;
            this.popupDesc = document.getElementById('popup-desc') as HTMLElement;
            
            this.setupEventListeners();

            setTimeout(() => this.openPopup(), 100);
            
            this.isInitialized = true;
            console.log('AuthModal initialized successfully');
        } catch (error) {
            console.error('Error initializing AuthModal:', error);
        }
    }
    
    private setupEventListeners(): void {
        if (!this.overlay || !this.closeBtn) return;

        // Закрытие попапа
        this.closeBtn.addEventListener('click', () => this.closePopup());
        this.overlay.addEventListener('click', (e: MouseEvent) => {
            if (e.target === this.overlay) this.closePopup();
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.overlay && !this.overlay.classList.contains('hidden')) {
                this.closePopup();
            }
        });
        
        // Переключение экранов
        if (this.registerLink) {
            this.registerLink.addEventListener('click', (e: Event) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.register);
                    this.errors.register.classList.add('hidden');
                    if (this.registerForm) this.registerForm.reset();
                }
            });
        }
        
        if (this.forgotLink) {
            this.forgotLink.addEventListener('click', (e: Event) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.forgot);
                    this.errors.forgot.classList.add('hidden');
                    if (this.forgotForm) this.forgotForm.reset();
                }
            });
        }
        
        if (this.backToLoginFromRegister) {
            this.backToLoginFromRegister.addEventListener('click', (e: Event) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.login);
                    this.errors.login.classList.add('hidden');
                }
            });
        }
        
        if (this.backToLoginFromForgot) {
            this.backToLoginFromForgot.addEventListener('click', (e: Event) => {
                e.preventDefault();
                if (this.screens && this.errors) {
                    this.showScreen(this.screens.login);
                    this.errors.login.classList.add('hidden');
                }
            });
        }
        
        // Обработчики отправки форм
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e: Event) => this.handleLogin(e));
        }
        
        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e: Event) => this.handleRegister(e));
        }
        
        if (this.forgotForm) {
            this.forgotForm.addEventListener('submit', (e: Event) => this.handleForgot(e));
        }
        
        // Очистка ошибок при вводе
        this.setupInputListeners();
    }
    
    private setupInputListeners(): void {
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
                input.addEventListener('input', () => {
                    error.classList.add('hidden');
                });
            }
        });
    }
    
    private updateAriaLabels(screen: HTMLElement): void {
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
    
    private showScreen(screen: HTMLElement): void {
        if (!this.screens) return;
        
        this.screens.login.classList.add('hidden');
        this.screens.register.classList.add('hidden');
        this.screens.forgot.classList.add('hidden');
        screen.classList.remove('hidden');
        this.updateAriaLabels(screen);
        
        setTimeout(() => {
            const firstInput = screen.querySelector('input:not([type="hidden"])') as HTMLInputElement;
            if (firstInput) firstInput.focus();
        }, 100);
    }
    
    private showError(container: HTMLElement, message: string): void {
        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        container.textContent = message;
        container.classList.remove('hidden');
        this.errorTimeout = window.setTimeout(() => {
            container.classList.add('hidden');
            this.errorTimeout = null;
        }, 5000);
    }
    
    private showNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
        const notification = document.getElementById('notification');
        if (!notification) return;
        
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
    
    private isValidEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }
    
    private openPopup(): void {
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
    
    private closePopup(): void {
        if (!this.overlay) return;
        
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
    
    private async handleLogin(e: Event): Promise<void> {
        e.preventDefault();
        
        if (!this.emailInput || !this.passwordInput || !this.loginSubmitBtn || !this.errors) return;
        
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
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Успешный вход:', { login });
            this.showNotification('Вход выполнен успешно!', 'success');
            this.closePopup();
        } catch (error) {
            this.showError(this.errors.login, 'Ошибка при входе');
            console.error(error);
        } finally {
            if (this.loginSubmitBtn) {
                this.loginSubmitBtn.disabled = false;
                this.loginSubmitBtn.textContent = 'Войти';
            }
        }
    }
    
    private async handleRegister(e: Event): Promise<void> {
        e.preventDefault();
        
        if (!this.regName || !this.regEmail || !this.regPassword || !this.regConfirm || 
            !this.registerSubmitBtn || !this.errors) return;
        
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
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Регистрация:', { name, email });
            this.showNotification('Регистрация прошла успешно!', 'success');
            if (this.emailInput) this.emailInput.value = email;
            if (this.screens) this.showScreen(this.screens.login);
            if (this.registerForm) this.registerForm.reset();
        } catch (error) {
            this.showError(this.errors.register, 'Ошибка при регистрации');
            console.error(error);
        } finally {
            if (this.registerSubmitBtn) {
                this.registerSubmitBtn.disabled = false;
                this.registerSubmitBtn.textContent = 'Зарегистрироваться';
            }
        }
    }
    
    private async handleForgot(e: Event): Promise<void> {
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
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Восстановление пароля для:', email);
            this.showNotification('Ссылка для сброса пароля отправлена', 'info');
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

// Создаем экземпляр
console.log('Creating AuthModal instance');
new AuthModal();