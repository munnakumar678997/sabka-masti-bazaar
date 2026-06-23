import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Loading from './pages/Loading';
import Login from './pages/Login';
import Home from './pages/Home';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
      <div id="app-root">
        <Routes>
          <Route path="/" element={<Navigate to="/loading" replace />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
