import { useLocation, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading from './pages/Loading';
import Login from './pages/Login';
import Home from './pages/Home';
import Store from './pages/Store';
import { AppProvider } from './context/AppContext';
import './styles/global.css';

function SessionGuard({ children }) {
  const location = useLocation();
  const sessionActive = sessionStorage.getItem('smb_session');

  if (!sessionActive && location.pathname !== '/loading') {
    return <Navigate to="/loading" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div id="app-root">
          <SessionGuard>
            <Routes>
              <Route path="/" element={<Navigate to="/loading" replace />} />
              <Route path="/loading" element={<Loading />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/store" element={<Store />} />
            </Routes>
          </SessionGuard>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
