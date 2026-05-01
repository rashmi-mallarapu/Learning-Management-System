import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const setAuthToken = (token) => {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        return;
    }

    delete api.defaults.headers.common.Authorization;
};

api.interceptors.request.use((config) => {
    const hasAuthHeader = Boolean(config?.headers?.Authorization || config?.headers?.authorization);
    if (hasAuthHeader) {
        return config;
    }

    if (typeof window === 'undefined') {
        return config;
    }

    try {
        const raw = window.localStorage.getItem('lms_auth');
        if (!raw) return config;

        const parsed = JSON.parse(raw);
        if (parsed?.token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${parsed.token}`;
        }
    } catch {
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error?.response?.data?.message || error?.message || 'Request failed';
        return Promise.reject(new Error(message));
    }
);
