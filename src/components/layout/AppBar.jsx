import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import {
  clearSession,
  getSelectedTenant,
  getSession,
  setSelectedTenant,
  subscribeSession,
} from '../../store/auth.js';
import { logoutAppwriteSession } from '../../api/merchantgo.js';
import { useI18n } from '../../locales/index.jsx';
import { Menu } from 'lucide-react';

export default function AppBar({ onMenuToggle }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [session, setSessionState] = useState(() => getSession());

  useEffect(() => subscribeSession(() => setSessionState(getSession())), []);

  const handleLogout = async () => {
    if (session?.isCloud) await Promise.resolve(logoutAppwriteSession()).catch(() => {});
    clearSession();
    navigate('/login');
  };

  const selectedTenant = getSelectedTenant(session);
  const tenantOptions = Array.isArray(session?.tenants) ? session.tenants : [];
  const showTenantSelect = !session?.session_temporary && tenantOptions.length > 1;
  const tenantLabel = selectedTenant?.name || session?.tenant_name || session?.tenant_id;
  const tenantChipStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    border: '1px solid rgba(255,107,0,0.28)',
    backgroundColor: 'rgba(var(--primary-rgb, 255, 107, 0), 0.15)',
    color: '#ffd2b5',
    fontSize: '0.78rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  };

  return (
    <header style={{ borderBottom: '1px solid var(--border-glass)', padding: '12px 24px', backgroundColor: 'var(--header-bg)', backdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onMenuToggle} className="menu-toggle-btn">
          <Menu size={20} />
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {session?.name} <span style={{ color: 'var(--primary)', fontWeight: 700 }}>({session?.role})</span>
          {' · '}
          <span style={{ color: 'var(--text-muted)' }}>Plan: <strong style={{ color: 'var(--text-main)' }}>{session?.plan}</strong></span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {!session?.session_temporary && tenantLabel && !showTenantSelect && (
          <span style={tenantChipStyle} title={session?.tenant_id}>
            {tenantLabel}
          </span>
        )}
        {showTenantSelect && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t.dashboard.tenant}
            <select
              value={selectedTenant?.tenant_id || session?.tenant_id || ''}
              onChange={(event) => setSelectedTenant(event.target.value)}
              style={{
                minWidth: '160px',
                padding: '7px 10px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)',
                backgroundColor: 'var(--glass-overlay)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
              }}
            >
              {tenantOptions.map((tenant) => (
                <option key={tenant.tenant_id} value={tenant.tenant_id}>
                  {tenant.name || tenant.tenant_id}
                </option>
              ))}
            </select>
          </label>
        )}
        <button onClick={handleLogout} className="btn-secondary" style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', borderColor: 'rgba(var(--accent-error-rgb, 255, 77, 77),0.4)', color: 'var(--accent-error)' }}>
          <LogOut size={15} /> {t.common.logout}
        </button>
      </div>
    </header>
  );
}
