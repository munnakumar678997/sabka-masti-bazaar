// 😊 Saare page imports — har ek page ka component yahan se aata hai 😊
import { useLocation, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading  from './pages/Loading';
import Login    from './pages/Login';
import Home     from './pages/Home';
import Store    from './pages/store/index';
import Wallet   from './pages/Wallet';
import Profile  from './pages/Profile';
import Games    from './pages/games/index';
import Referral from './pages/Referral';
import FAQ       from './pages/FAQ';
import BonusCode     from './pages/BonusCode';
import Notifications from './pages/Notifications';
import { AppProvider } from './context/AppContext';

// 😊 Global CSS imports — sab pages pe ye styles lagte hain 😊
import './styles/global.css';
import './styles/shared.css';

// 😊 Session guard — bina login ke home pe nahi jana 😊
function SessionGuard({ children }) {
  const location      = useLocation();
  const sessionActive = sessionStorage.getItem('smb_session');
  if (!sessionActive && location.pathname !== '/loading') {
    return <Navigate to="/loading" replace />;
  }
  return children;
}

// 😊 Main App — routing aur global context yahan set hota hai 😊
export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        {/* 😊 Mobile frame — 430px max width mein sab pages render hote hain 😊 */}
        <div id="app-root">
          <SessionGuard>
            <Routes>
              {/* 😊 Default route — seedha loading pe le jao 😊 */}
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
              {/* 😊 Unknown route — home pe wapas le jao 😊 */}
              <Route path="*"              element={<Navigate to="/home" replace />} />
            </Routes>
          </SessionGuard>
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
