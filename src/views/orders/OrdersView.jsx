import { useEffect, useState } from 'react';
import { merchantGoRequest } from '../../api/merchantgo.js';
import { getSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';

export default function OrdersView() {
  const { t } = useI18n();
  const session = getSession();
  const canViewTotal = session?.role === 'ADMIN';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const data = await merchantGoRequest('/orders/active');
      setOrders(Array.isArray(data) ? data : (data?.orders || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '24px' }}>{t.orders.title}</h2>
      {error && <p style={{ color: 'var(--accent-error)', marginBottom: '16px' }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          {t.orders.noOrders}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Order</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Items</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Server</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Time</th>
                {canViewTotal && <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>Total</th>}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.$id || order.id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.8rem' }}>#{(order.$id || order.id || '').slice(-6)}</td>
                  <td style={{ padding: '14px 20px' }}>{Array.isArray(order.items) ? order.items.map(item => item.name || item).join(', ') : '—'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{order.waiter || '—'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{order.created_at ? new Date(order.created_at).toLocaleTimeString() : '—'}</td>
                  {canViewTotal && <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700 }}>{order.total != null ? `$${Number(order.total).toFixed(2)}` : '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
