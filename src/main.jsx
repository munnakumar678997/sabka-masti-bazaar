import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ── RELOAD DETECTION FIX ──
// Jab Telegram Mini App "Reload Page" kare, sessionStorage bachti hai
// React state fresh ho jaati hai (user=null, balance=0)
// Agar session clear na ho to SessionGuard /loading pe nahi bhejta
// Aur loadUser() kabhi call hi nahi hota — 0 coins dikhte hain!
//
// Fix: Page reload detect karo aur session clear karo
// Taaki Loading.jsx force run ho aur Supabase se fresh data aaye
const navEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
if (navEntry?.type === 'reload') {
  sessionStorage.removeItem('smb_session');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
