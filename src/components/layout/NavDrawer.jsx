import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Clock, FileText, Users, GitBranch, UtensilsCrossed, Settings, User } from 'lucide-react';
import { useI18n } from '../../locales/index.jsx';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/orders', icon: ShoppingBag, key: 'orders' },
  { to: '/history', icon: Clock, key: 'history' },
  { to: '/zreports', icon: FileText, key: 'zreports' },
  { to: '/staff', icon: Users, key: 'staff' },
  { to: '/branches', icon: GitBranch, key: 'branches' },
  { to: '/menu', icon: UtensilsCrossed, key: 'menu' },
  { to: '/settings', icon: Settings, key: 'settings' },
  { to: '/profile', icon: User, key: 'profile' },
];

export default function NavDrawer({ isOpen, onClose }) {
  const { t } = useI18n();
  return (
    <nav className={`nav-drawer ${isOpen ? 'open' : ''}`} style={{ width: '220px', minHeight: '100vh', borderRight: '1px solid var(--border-glass)', backgroundColor: 'var(--nav-bg)', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-glass)', marginBottom: '16px' }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--text-main)' }}>
          MERCHANT<span style={{ color: 'var(--primary)' }}>GO</span>
        </span>
      </div>
      {NAV.map(({ to, icon: Icon, key }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClose}
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 20px', textDecoration: 'none',
            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
            backgroundColor: isActive ? 'rgba(var(--primary-rgb, 255, 107, 0), 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: isActive ? 700 : 500, fontSize: '0.9rem',
            transition: 'all 0.15s',
          })}
        >
          <Icon size={18} />
          {t.nav[key]}
        </NavLink>
      ))}
    </nav>
  );
}
