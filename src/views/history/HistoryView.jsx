import { useCallback, useEffect, useState } from 'react';
import { merchantGoRequest } from '../../api/merchantgo.js';
import { useI18n } from '../../locales/index.jsx';

export default function HistoryView() {
  const { t } = useI18n();
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(today);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await merchantGoRequest(`/orders/history?from=${from}`);
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [from]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>{t.history.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <label style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.history.filterLabel}:</label>
          <input
            type="date" value={from} onChange={e => setFrom(e.target.value)}
            style={{ backgroundColor: 'var(--glass-overlay)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '8px 12px', color: 'var(--text-main)', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {error && <div style={{ backgroundColor: 'rgba(var(--accent-error-rgb, 255, 77, 77),0.15)', border: '1px solid rgba(var(--accent-error-rgb, 255, 77, 77),0.4)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--accent-error)', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No settled orders found for this date.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: 'var(--glass-overlay)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Order</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Table</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Items</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Payment</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Server</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Time</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.8rem' }}>#{String(order.id || '').slice(-6)}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{order.table || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>{Array.isArray(order.items) ? order.items.join(', ') : '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ color: order.payment_method === 'CASH' ? 'var(--accent-success)' : '#4db8ff', fontWeight: 600, fontSize: '0.8rem' }}>
                      {order.payment_method || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{order.waiter || '—'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{order.settled_at ? new Date(order.settled_at).toLocaleTimeString() : '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700 }}>{order.total != null ? `$${Number(order.total).toFixed(2)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
