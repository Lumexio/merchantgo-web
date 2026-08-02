import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getSession, clearSession } from '../../store/auth.js';
import { logoutAppwriteSession } from '../../api/merchantgo.js';
import { useI18n } from '../../locales/index.jsx';

export default function AppBar() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = async () => {
    if (session?.isCloud) await Promise.resolve(logoutAppwriteSession()).catch(() => {});
    clearSession();
    navigate('/login');
  };

  return (
    <header style={{ borderBottom: '1px solid var(--border-glass)', padding: '12px 24px', backgroundColor: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        {session?.name} <span style={{ color: '#ff6b00', fontWeight: 700 }}>({session?.role})</span>
        {' · '}
        <span style={{ color: '#888' }}>Plan: <strong style={{ color: '#fff' }}>{session?.plan}</strong></span>
      </span>
      <button onClick={handleLogout} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(255,77,77,0.4)', color: '#ff8585' }}>
        <LogOut size={15} /> {t.common.logout}
      </button>
    </header>
  );
}
