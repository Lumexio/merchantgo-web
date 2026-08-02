import { useEffect, useState } from 'react';
import { merchantGoRequest, listTenantReports, listTenantMenuItems } from '../../api/merchantgo.js';
import { useI18n } from '../../locales/index.jsx';

function MetricCard({ label, value }) {
  return (
    <div className="glass-panel" style={{ flex: 1, minWidth: '180px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'Outfit', color: 'var(--text-main)' }}>{value}</p>
    </div>
  );
}

export default function DashboardView() {
  const { t } = useI18n();
  const [activeOrders, setActiveOrders] = useState('—');
  const [latestRevenue, setLatestRevenue] = useState('—');
  const [menuItemCount, setMenuItemCount] = useState('—');
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.allSettled([
        merchantGoRequest('/orders/active').then(data => {
          const orders = Array.isArray(data) ? data : (data?.orders || []);
          setActiveOrders(orders.length);
        }),
        listTenantReports().then(data => {
          const reports = Array.isArray(data) ? data : (data?.reports || []);
          setRecentReports(reports.slice(0, 5));
          if (reports.length > 0 && reports[0].gross_revenue != null) {
            setLatestRevenue(`$${Number(reports[0].gross_revenue).toFixed(2)}`);
          }
        }),
        listTenantMenuItems().then(data => {
          const items = Array.isArray(data) ? data : (data?.items || []);
          setMenuItemCount(items.length);
        }).catch(() => {}),
      ]);
      setLoading(false);
    };
    loadAll();
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '24px' }}>{t.dashboard.title}</h2>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '32px' }}>
            <MetricCard label={t.dashboard.activeOrders} value={activeOrders} />
            <MetricCard label={t.dashboard.latestRevenue} value={latestRevenue} />
            <MetricCard label={t.dashboard.menuItems} value={menuItemCount} />
          </div>

          {recentReports.length > 0 && (
            <div className="glass-panel">
              <h3 style={{ fontFamily: 'Outfit', marginBottom: '16px', fontSize: '1rem' }}>Recent Z-Reports</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '8px' }}>Date</th>
                    <th style={{ paddingBottom: '8px' }}>Type</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'center' }}>Orders</th>
                    <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Gross Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report, i) => (
                    <tr key={report.$id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '10px 0' }}>{report.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 0', color: '#ff6b00' }}>{report.type || 'Z'}</td>
                      <td style={{ padding: '10px 0', textAlign: 'center' }}>{report.total_orders_closed ?? '—'}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 700 }}>{report.gross_revenue != null ? `$${Number(report.gross_revenue).toFixed(2)}` : '—'}</td>
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
