import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store/store';
import AppRouter from './AppRouter';
import { setAuthToken } from './services/api';
import { loginSuccess } from './features/auth/authSlice';
import { SocketProvider } from './context/SocketContext';

const AUTH_STORAGE_KEY = 'lms_auth';

function AuthBootstrap({ children }) {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector(s => s.auth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw && !isAuthenticated) {
        const parsed = JSON.parse(raw);
        if (parsed?.user && parsed?.token) {
          dispatch(loginSuccess(parsed));
        }
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthBootstrap>
          <SocketProvider>
            <AppRouter />
          </SocketProvider>
        </AuthBootstrap>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
