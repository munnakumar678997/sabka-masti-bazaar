import { useApp } from '../../context/AppContext';
import BottomNav from '../../components/BottomNav';

export default function Games() {
  const { balance } = useApp();

  return (
    <div style={{
      width: '100%', minHeight: '100dvh',
      background: 'linear-gradient(180deg, #08081a 0%, #0d0d22 50%, #060610 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎮</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 8 }}>
        Games Coming Soon!
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
        Naye games jald aayenge...
      </div>
      <BottomNav />
    </div>
  );
}
