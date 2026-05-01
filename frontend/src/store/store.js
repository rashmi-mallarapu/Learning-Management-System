import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import uiReducer from '../features/ui/uiSlice';
import courseReducer from '../features/courses/courseSlice';
import notificationReducer from '../features/notifications/notificationSlice';
import quizReducer from '../features/quiz/quizSlice';

const AUTH_STORAGE_KEY = 'lms_auth';

const getPersistedAuthState = () => {
    if (typeof window === 'undefined') {
        return undefined;
    }

    try {
        const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (!raw) return undefined;

        const parsed = JSON.parse(raw);
        if (!parsed?.user || !parsed?.token) {
            return undefined;
        }

        return {
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true,
            loading: false,
            error: null,
            pendingVerificationEmail: null,
        };
    } catch {
        return undefined;
    }
};

const preloadedAuth = getPersistedAuthState();

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        courses: courseReducer,
        notifications: notificationReducer,
        quiz: quizReducer,
    },
    preloadedState: preloadedAuth
        ? {
            auth: preloadedAuth,
        }
        : undefined,
});

export default store;
