import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/bottomNav.css';

const NAV_TABS = [
  { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
  { key: 'games',   icon: '🎮', label: 'Games',   path: '/games'   },
  { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
  { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
  { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
];

export default function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const activePath = location.pathname;

  return (
    <div className="bottom-nav-bar">
      {NAV_TABS.map(tab => (
        <button
          key={tab.key}
          className={`bnav-tab ${activePath === tab.path ? 'bnav-active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="bnav-icon">{tab.icon}</span>
          <span className="bnav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
