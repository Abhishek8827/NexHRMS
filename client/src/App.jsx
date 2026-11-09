import { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from '@firebase/auth';
import { store } from './app/store';
import AppRoutes from './routes/index';
import { authReady, clearAuth, getCurrentUser } from './features/auth/authSlice';
import { firebaseAuth } from './services/firebase';
import Spinner from './components/common/Spinner';

const AuthLoader = ({ children }) => {
  const dispatch = useDispatch();
  const initialLoading = useSelector((state) => state.auth.initialLoading);

  useEffect(() => {
    if (!firebaseAuth) {
      dispatch(authReady());
      return undefined;
    }

    return onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (firebaseUser) {
        dispatch(getCurrentUser());
      } else {
        dispatch(clearAuth());
      }
    });
  }, [dispatch]);

  if (initialLoading) return <Spinner fullScreen />;

  return children;
};

function AppLoaderWrapper() {
  return (
    <>
      <AuthLoader>
        <AppRoutes />
      </AuthLoader>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#1f2937',
            color: '#fff',
            fontSize: '14px',
          },
          success: { style: { background: '#059669' } },
          error: { style: { background: '#dc2626' } },
        }}
      />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppLoaderWrapper />
    </Provider>
  );
}

export default App;
