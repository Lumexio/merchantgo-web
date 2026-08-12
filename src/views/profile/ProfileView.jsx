import { useEffect, useState } from 'react';
import { getSession } from '../../store/auth.js';
import { listTenantMenuItems, listTenantStaff, listTenantBranches, createCheckoutSession } from '../../api/merchantgo.js';
import { useI18n } from '../../locales/index.jsx';
import PlanBadge from '../../components/ui/PlanBadge.jsx';

const PLANS = [
  { code: 'FREE', name: 'Free Starter', prices: { solo: '$0/mo', team: '$0/mo' }, limits: '25 items · 1 staff · 1 branch' },
  { code: 'PRO', name: 'Merchantgo Pro', prices: { solo: '$12.99/mo', team: '$59.99/mo' }, limits: '100 items · 3 staff · 1 branch' },
  { code: 'ENTERPRISE', name: 'Merchantgo Overlord', prices: { solo: '$39.99/mo', team: '$119.99/mo' }, limits: '250 items · 100 staff · 25 branches' },
];

export default function ProfileView() {
  const { t } = useI18n();
  const session = getSession();
  const limits = session?.entitlements?.limits || {};

  const [counts, setCounts] = useState({ menuItems: '…', staff: '…', branches: '…' });
  const [countError, setCountError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [menuData, staffData, branchData] = await Promise.allSettled([
          listTenantMenuItems(),
          listTenantStaff(),
          listTenantBranches(),
        ]);
        setCounts({
          menuItems: menuData.status === 'fulfilled'
            ? (Array.isArray(menuData.value) ? menuData.value : (menuData.value?.items || [])).length
            : '—',
          staff: staffData.status === 'fulfilled'
            ? (Array.isArray(staffData.value) ? staffData.value : (staffData.value?.staff || [])).length
            : '—',
          branches: branchData.status === 'fulfilled'
            ? (Array.isArray(branchData.value) ? branchData.value : (branchData.value?.branches || [])).length
            : '—',
        });
        const errors = [menuData, staffData, branchData]
          .filter(result => result.status === 'rejected')
          .map(result => result.reason?.message)
          .filter(Boolean);
        if (errors.length) setCountError(errors[0]);
      } catch (err) {
        setCountError(err.message);
      }
    };
    load();
  }, []);

  const handleUpgrade = async (planCode, accountType) => {
    try {
      const res = await createCheckoutSession(planCode, accountType);
      if (res && res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (err) {
      alert(`Failed to start checkout: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '32px' }}>{t.profile.title}</h2>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Outfit', marginBottom: '16px', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.profile.accountInfo}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Name</span>
            <span style={{ fontWeight: 600 }}>{session?.name || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Email</span>
            <span style={{ fontWeight: 600 }}>{session?.email || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Role</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{session?.role || '—'}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.profile.planLimits}</h3>
          <PlanBadge plan={session?.plan || 'FREE'} />
        </div>
        {countError && <p style={{ color: 'var(--accent-error)', fontSize: '0.8rem', marginBottom: '12px' }}>{countError}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem' }}>
          {[
            { label: t.profile.menuItems, current: counts.menuItems, max: limits.menuItems || '—' },
            { label: t.profile.staff, current: counts.staff, max: limits.staff || '—' },
            { label: t.profile.branches, current: counts.branches, max: limits.branches || '—' },
          ].map(({ label, current, max }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{current} / {max}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontFamily: 'Outfit', marginBottom: '16px', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.profile.plan}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PLANS.map(plan => {
            const isCurrent = session?.plan === plan.code;
            return (
              <div key={plan.code} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px', borderRadius: 'var(--radius-md)',
                border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border-glass)'}`,
                backgroundColor: isCurrent ? 'rgba(255,107,0,0.08)' : 'transparent',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{plan.name}</strong>
                    {isCurrent && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>CURRENT</span>}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{plan.limits}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plan.code !== 'FREE' ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Solo <strong style={{ color: 'var(--text-main)' }}>{plan.prices.solo}</strong></span>
                          {!isCurrent && (
                            <button onClick={() => handleUpgrade(plan.code, 'solo')} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', border: '1px solid rgba(var(--primary-rgb, 255, 107, 0), 0.4)', borderRadius: '6px', padding: '4px 10px' }}>Upgrade Solo</button>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Team <strong style={{ color: 'var(--text-main)' }}>{plan.prices.team}</strong></span>
                          {!isCurrent && (
                            <button onClick={() => handleUpgrade(plan.code, 'team')} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'transparent', cursor: 'pointer', border: '1px solid rgba(var(--primary-rgb, 255, 107, 0), 0.4)', borderRadius: '6px', padding: '4px 10px' }}>Upgrade Team</button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p style={{ fontWeight: 700, color: isCurrent ? 'var(--primary)' : 'var(--text-main)', marginBottom: '6px' }}>{plan.prices.solo}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
