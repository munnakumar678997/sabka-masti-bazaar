// 😊 Games page — abhi khaali hai, baad mein games add honge 😊
import BottomNav from '../../components/BottomNav';

// 😊 Simple placeholder — Games tab kaam karta hai, content baad mein aayega 😊
export default function Games() {
  return (
    <div style={{
      width: '100%',
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #08081a 0%, #0d0d22 50%, #060610 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* 😊 Baaki sab content yahan baad mein add hoga 😊 */}
      <div style={{ flex: 1 }} />
      <BottomNav />
    </div>
  );
}
