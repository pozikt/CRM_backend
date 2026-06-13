// auth.js — управление токеном и автоматическая подстановка в API-запросы

const Auth = {
    TOKEN_KEY: 'crm_auth_token',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
        window.dispatchEvent(new CustomEvent('auth:login'));
    },

    clearToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('auth:logout'));
    },

    isAuthenticated() {
        return Boolean(this.getToken());
    },

    async apiRequest(url, options = {}) {
        const headers = new Headers(options.headers || {});
        const token = this.getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        if (options.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(url, { ...options, headers });

        if (response.status === 401 && this.getToken()) {
            this.clearToken();
            window.dispatchEvent(new CustomEvent('auth:required'));
        }

        return response;
    },

    async login(login, password) {
        const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, password }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Неверный логин или пароль');
        }

        const data = await response.json();
        this.setToken(data.access_token);
        return data;
    },

    async register(fullName, email, password) {
        const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email,
                password,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || 'Ошибка при регистрации');
        }

        const data = await response.json();
        this.setToken(data.access_token);
        return data;
    },

    async verifyToken() {
        if (!this.getToken()) return false;

        try {
            const response = await this.apiRequest('/api/v1/auth/me');
            return response.ok;
        } catch {
            return false;
        }
    },

    installFetchInterceptor() {
        if (window.__authFetchInstalled) return;
        window.__authFetchInstalled = true;

        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, init = {}) => {
            const url = typeof input === 'string' ? input : input.url;
            const isApiRequest = url.includes('/api/v1/');
            const isPublicAuth = url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/register');

            if (!isApiRequest || isPublicAuth) {
                return originalFetch(input, init);
            }

            const headers = new Headers(init.headers || {});
            const token = Auth.getToken();
            if (token && !headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
            }

            return originalFetch(input, { ...init, headers }).then((response) => {
                if (response.status === 401 && Auth.getToken()) {
                    Auth.clearToken();
                    window.dispatchEvent(new CustomEvent('auth:required'));
                }
                return response;
            });
        };
    },
};

Auth.installFetchInterceptor();
window.Auth = Auth;
