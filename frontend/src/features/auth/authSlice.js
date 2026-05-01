import { createSlice } from '@reduxjs/toolkit';

const AUTH_STORAGE_KEY = 'lms_auth';

const readPersistedAuth = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.token || !parsed?.user) return null;
        return parsed;
    } catch {
        return null;
    }
};

const persistAuth = (user, token) => {
    if (typeof window === 'undefined') return;

    try {
        if (!user || !token) {
            window.localStorage.removeItem(AUTH_STORAGE_KEY);
            return;
        }

        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
    } catch {
    }
};

const persisted = readPersistedAuth();

const initialState = {
    user: persisted?.user || null,
    token: persisted?.token || null,
    isAuthenticated: Boolean(persisted?.token && persisted?.user),
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart(state) {
            state.loading = true;
            state.error = null;
        },
        loginSuccess(state, action) {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.error = null;
            persistAuth(action.payload.user, action.payload.token);
        },
        loginFailure(state, action) {
            state.loading = false;
            state.error = action.payload;
        },
        logout(state) {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            persistAuth(null, null);
        },
        updateUser(state, action) {
            state.user = { ...state.user, ...action.payload };
            persistAuth(state.user, state.token);
        },
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    logout,
    updateUser,
} = authSlice.actions;
export default authSlice.reducer;
