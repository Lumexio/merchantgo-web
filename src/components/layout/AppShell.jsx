import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import NavDrawer from './NavDrawer.jsx';
import AppBar from './AppBar.jsx';

export default function AppShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <NavDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      {/* Mobile overlay */}
      {isMenuOpen && (
        <div 
          onClick={() => setIsMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998 }}
        />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar onMenuToggle={toggleMenu} />
        <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
