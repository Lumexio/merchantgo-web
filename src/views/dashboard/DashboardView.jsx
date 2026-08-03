import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  connectGoogleDrive,
  getTenantDashboardReport,
  googleDriveStatus,
} from '../../api/merchantgo.js';
import { getSession, subscribeSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function MetricCard({ label, value }) {
  return (
    <div className="glass-panel" style={{ flex: 1, minWidth: '170px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--text-main)' }}>{value}</p>
    </div>
  );
}

function PaymentDonut({ label, value, total, stroke, progress }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--border-glass)" strokeWidth="10" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="40" textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </text>
        <text x="44" y="53" textAnchor="middle" style={{ fill: 'var(--text-main)', fontSize: '11px', fontWeight: 700 }}>
          {total > 0 ? `${Math.round(progress * 100)}%` : '0%'}
        </text>
      </svg>
      <div>
        <p style={{ color: 'var(--text-main)', fontWeight: 700 }}>{formatCurrency(value)}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{total > 0 ? `${Math.round(progress * 100)}% ${label.toLowerCase()}` : '—'}</p>
      </div>
    </div>
  );
}

function SalesBars({ title, items, emptyLabel, accent }) {
  const max = Math.max(...items.map(item => item.soldQuantity), 0);

  return (
    <div className="glass-panel" style={{ flex: 1, minWidth: '260px' }}>
      <h3 style={{ fontFamily: 'Outfit', marginBottom: '18px', fontSize: '1rem' }}>{title}</h3>
      {items.length === 0 || max === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{emptyLabel}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {items.map((item) => (
            <div key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', fontSize: '0.88rem' }}>
                <span style={{ fontWeight: 600 }}>{item.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{item.soldQuantity}</span>
              </div>
              <div style={{ height: '9px', borderRadius: '999px', backgroundColor: 'var(--border-glass)', overflow: 'hidden' }}>
                <div style={{ width: `${(item.soldQuantity / max) * 100}%`, height: '100%', borderRadius: '999px', background: accent }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DriveAlert({ onConnect, t }) {
  return (
    <div className="glass-panel" style={{ marginBottom: '24px', borderColor: 'rgba(255,107,0,0.3)', background: 'linear-gradient(135deg, rgba(var(--primary-rgb, 255, 107, 0), 0.15), var(--bg-card))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'Outfit', fontWeight: 700, marginBottom: '6px' }}>{t.dashboard.driveAlertTitle}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{t.dashboard.driveAlertBody}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/settings" className="btn-secondary" style={{ textDecoration: 'none' }}>{t.dashboard.openSettings}</Link>
          <button onClick={onConnect} className="btn-pos">{t.settings.connectDrive}</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { t } = useI18n();
  const [sessionStamp, setSessionStamp] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const session = getSession();

  useEffect(() => subscribeSession(() => setSessionStamp((value) => value + 1)), []);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      setLoading(true);
      setError('');
      const dashboardResult = await getTenantDashboardReport()
        .then((data) => ({ status: 'fulfilled', value: data }))
        .catch((reason) => ({ status: 'rejected', reason }));
      const driveResult = session?.plan === 'FREE'
        ? await googleDriveStatus()
          .then((data) => ({ status: 'fulfilled', value: data }))
          .catch((reason) => ({ status: 'rejected', reason }))
        : { status: 'fulfilled', value: null };

      if (cancelled) return;
      if (dashboardResult.status === 'fulfilled') {
        setDashboard(dashboardResult.value?.dashboard || dashboardResult.value);
      } else {
        setError(dashboardResult.reason?.message || t.common.error);
      }
      setDrive(driveResult.status === 'fulfilled' ? driveResult.value : null);
      setLoading(false);
    };

    loadAll();
    return () => {
      cancelled = true;
    };
  }, [session?.plan, session?.selected_tenant_id, session?.tenant_id, sessionStamp, t.common.error]);

  const paymentTotal = Number(dashboard?.paymentBreakdown?.total || 0);
  const cash = Number(dashboard?.paymentBreakdown?.cash || 0);
  const card = Number(dashboard?.paymentBreakdown?.card || 0);

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '24px' }}>{t.dashboard.title}</h2>
      {session?.plan === 'FREE' && drive?.connected === false && (
        <DriveAlert
          t={t}
          onConnect={() => connectGoogleDrive().catch((err) => setError(err.message))}
        />
      )}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : error ? (
        <p style={{ color: 'var(--accent-error)' }}>{error}</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <MetricCard label={t.dashboard.activeOrders} value={dashboard?.activeOrders ?? '—'} />
            <MetricCard label={t.dashboard.settledOrders} value={dashboard?.settledOrders ?? '—'} />
            <MetricCard label={t.dashboard.grossRevenue} value={dashboard ? formatCurrency(dashboard.grossRevenue) : '—'} />
            <MetricCard label={t.dashboard.menuItems} value={dashboard?.menuItemCount ?? '—'} />
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ minWidth: '260px', flex: '0 0 280px' }}>
              <h3 style={{ fontFamily: 'Outfit', marginBottom: '18px', fontSize: '1rem' }}>{t.dashboard.salesMix}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <PaymentDonut label={t.dashboard.cash} value={cash} total={paymentTotal} stroke="var(--primary)" progress={paymentTotal > 0 ? cash / paymentTotal : 0} />
                <PaymentDonut label={t.dashboard.card} value={card} total={paymentTotal} stroke="#5aa9ff" progress={paymentTotal > 0 ? card / paymentTotal : 0} />
              </div>
            </div>
            <SalesBars
              title={t.dashboard.mostSold}
              items={dashboard?.mostSoldItems || []}
              emptyLabel={t.dashboard.noSalesYet}
              accent="linear-gradient(90deg, var(--primary), #ff9d57)"
            />
            <SalesBars
              title={t.dashboard.leastSold}
              items={dashboard?.leastSoldItems || []}
              emptyLabel={t.dashboard.noSalesYet}
              accent="linear-gradient(90deg, #5aa9ff, #8bd3ff)"
            />
          </div>

          {Array.isArray(dashboard?.recentReports) && dashboard.recentReports.length > 0 && (
            <div className="glass-panel">
              <h3 style={{ fontFamily: 'Outfit', marginBottom: '16px', fontSize: '1rem' }}>{t.dashboard.recentReports}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '8px' }}>{t.dashboard.reportDate}</th>
                    <th style={{ paddingBottom: '8px' }}>{t.dashboard.reportType}</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'center' }}>{t.dashboard.reportOrders}</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'right' }}>{t.dashboard.reportRevenue}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentReports.map((report, index) => (
                    <tr key={report.$id || `${report.generated_at || 'report'}-${index}`} style={{ borderTop: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '10px 0' }}>{report.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 0', color: 'var(--primary)' }}>{report.type || 'Z'}</td>
                      <td style={{ padding: '10px 0', textAlign: 'center' }}>{report.total_orders_closed ?? '—'}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{report.gross_revenue != null ? formatCurrency(report.gross_revenue) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
