import { useLocation, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading  from './pages/Loading';
import Login    from './pages/Login';
import Home     from './pages/Home';
import Store    from './pages/Store';
import Wallet   from './pages/Wallet';
import Profile  from './pages/Profile';
import Games    from './pages/games/index';
import Referral from './pages/Referral';
import FAQ       from './pages/FAQ';
import BonusCode     from './pages/BonusCode';
import Notifications from './pages/Notifications';
import { AppProvider } from './context/AppContext';
import './styles/global.css';

// sessionStorage use karo — refresh pe user data reload ho (Loading se)
function SessionGuard({ children }) {
  const location      = useLocation();
  const sessionActive = sessionStorage.getItem('smb_session');
  if (!sessionActive && location.pathname !== '/loading') {
    return <Navigate to="/loading" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <div id="app-root">
          <SessionGuard>
            <Routes>
              <Route path="/"         element={<Navigate to="/loading" replace />} />
              <Route path="/loading"  element={<Loading  />} />
              <Route path="/login"    element={<Login    />} />
              <Route path="/home"     element={<Home     />} />
              <Route path="/store"    element={<Store    />} />
              <Route path="/wallet"   element={<Wallet   />} />
              <Route path="/profile"  element={<Profile  />} />
              <Route path="/games"    element={<Games    />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/faq"        element={<FAQ       />} />
              <Route path="/bonus-code"     element={<BonusCode />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="*"              element={<Navigate to="/home" replace />} />
            </Routes>
          </SessionGuard>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
