import { useEffect, useState } from 'react';
import { listTenantReports, merchantGoRequest } from '../../api/merchantgo.js';
import { getSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';

export default function ZReportsView() {
  const { t } = useI18n();
  const session = getSession();
  const isAdmin = session?.role === 'ADMIN';
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [corteError, setCorteError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await listTenantReports();
      setReports(Array.isArray(data) ? data : (data?.reports || []));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleCorte = async () => {
    if (!window.confirm(t.zreports.confirmCorte)) return;
    setRunning(true); setTicket(null); setCorteError('');
    try {
      const res = await merchantGoRequest('/orders/corte-de-caja', {
        method: 'POST',
        body: JSON.stringify({ type: 'GENERAL' }),
      });
      setTicket(res.z_report_ticket);
      fetchReports();
    } catch (err) {
      setCorteError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>{t.zreports.title}</h2>
        {isAdmin && (
          <button onClick={handleCorte} disabled={running} className="btn-pos" style={{ marginLeft: 'auto' }}>
            {running ? t.common.loading : t.zreports.triggerCorte}
          </button>
        )}
      </div>

      {corteError && (
        <div style={{ backgroundColor: 'rgba(var(--accent-error-rgb, 255, 77, 77),0.15)', border: '1px solid rgba(var(--accent-error-rgb, 255, 77, 77),0.4)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px', color: 'var(--accent-error)', fontSize: '0.85rem' }}>
          {corteError}
        </div>
      )}

      {ticket && (
        <div className="glass-panel" style={{ marginBottom: '24px', border: '1px solid rgba(0,255,102,0.3)' }}>
          <h3 style={{ fontFamily: 'Outfit', color: 'var(--accent-success)', marginBottom: '16px' }}>Z-Report Generated</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Type: </span><strong>{ticket.type}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Status: </span><strong style={{ color: 'var(--accent-success)' }}>{ticket.status}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Orders Closed: </span><strong>{ticket.total_orders_closed}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Gross Revenue: </span><strong style={{ color: 'var(--primary)' }}>${Number(ticket.gross_revenue || 0).toFixed(2)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Cash: </span><strong style={{ color: 'var(--accent-success)' }}>${Number(ticket.payment_breakdown?.cash || 0).toFixed(2)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Card: </span><strong style={{ color: '#4db8ff' }}>${Number(ticket.payment_breakdown?.card || 0).toFixed(2)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Tips Pool (est.): </span><strong>${Number(ticket.waiter_tips_pool || 0).toFixed(2)}</strong></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Generated: </span><strong>{ticket.generated_at ? new Date(ticket.generated_at).toLocaleString() : '—'}</strong></div>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : reports.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          {t.zreports.noReports}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: 'var(--glass-overlay)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Generated At</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Orders</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>Cash</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>Card</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>Gross Revenue</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, i) => (
                <tr key={report.$id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 20px' }}>{report.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--primary)', fontWeight: 600 }}>{report.type || 'GENERAL'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>{report.total_orders_closed ?? '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: 'var(--accent-success)' }}>{report.payment_breakdown?.cash != null ? `$${Number(report.payment_breakdown.cash).toFixed(2)}` : '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', color: '#4db8ff' }}>{report.payment_breakdown?.card != null ? `$${Number(report.payment_breakdown.card).toFixed(2)}` : '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700 }}>{report.gross_revenue != null ? `$${Number(report.gross_revenue).toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
