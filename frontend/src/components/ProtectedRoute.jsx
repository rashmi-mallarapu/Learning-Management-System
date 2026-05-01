import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

const getRoleHome = (role) => {
    const normalizedRole = String(role || '').toLowerCase();

    if (normalizedRole === ROLES.INSTRUCTOR) return ROUTES.INSTRUCTOR_DASHBOARD;
    if (normalizedRole === ROLES.ADMIN) return ROUTES.ADMIN_DASHBOARD;
    return ROUTES.LEARNER_DASHBOARD;
};

const readPersistedSession = () => {
    if (typeof window === 'undefined') return null;

    try {
        const raw = window.localStorage.getItem('lms_auth');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.user || !parsed?.token) return null;
        return parsed;
    } catch {
        return null;
    }
};

export default function ProtectedRoute({ children, roles }) {
    const { isAuthenticated, user, token } = useSelector(s => s.auth);
    const location = useLocation();
    const persisted = readPersistedSession();
    const sessionUser = user || persisted?.user || null;
    const sessionToken = token || persisted?.token || null;
    const hasSession = Boolean((isAuthenticated || sessionToken) && sessionUser);

    if (!hasSession) {
        return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    const currentRole = String(sessionUser?.role || '').toLowerCase();
    const allowedRoles = Array.isArray(roles) ? roles.map((role) => String(role).toLowerCase()) : null;

    if (allowedRoles && !allowedRoles.includes(currentRole)) {
        return <Navigate to={getRoleHome(currentRole)} replace />;
    }

    return children;
}
