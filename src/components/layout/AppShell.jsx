import { Outlet } from 'react-router-dom';
import NavDrawer from './NavDrawer.jsx';
import AppBar from './AppBar.jsx';

export default function AppShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      <NavDrawer />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar />
        <main style={{ flex: 1, padding: '32px 28px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
