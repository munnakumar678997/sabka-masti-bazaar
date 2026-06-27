// 😊 Bottom navigation bar — sab main pages ke beech navigate karne ke liye 😊
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/bottomNav.css';

// 😊 Panchon tabs ka config — icon, label aur path 😊
const NAV_TABS = [
  { key: 'home',    icon: '🏠', label: 'Home',    path: '/home'    },
  { key: 'games',   icon: '🎮', label: 'Games',   path: '/games'   },
  { key: 'store',   icon: '🛒', label: 'Store',   path: '/store'   },
  { key: 'wallet',  icon: '💰', label: 'Wallet',  path: '/wallet'  },
  { key: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
];

// 😊 BottomNav component — fixed neeche rehta hai poore app mein 😊
export default function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  // 😊 Active tab pehchanne ke liye current path track karo 😊
  const activePath = location.pathname;

  const isActive = (tab) => {
    if (tab.key === 'games') return activePath.startsWith('/games');
    return activePath === tab.path;
  };

  return (
    <div className="bottom-nav-bar">
      {NAV_TABS.map(tab => (
        <button
          key={tab.key}
          className={`bnav-tab ${isActive(tab) ? 'bnav-active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="bnav-icon">{tab.icon}</span>
          <span className="bnav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
