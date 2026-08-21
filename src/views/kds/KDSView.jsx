import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { getSession } from '../../store/auth.js';

export default function KDSView() {
  const session = getSession();
  const [orders, setOrders] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.token) return;
    
    // Connect to WebSocket gateway
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'https://api.merchantgo.store', {
      auth: { token: session.token },
      withCredentials: true,
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('joinTenantRoom', {});
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('orderCreated', (payload) => {
      setOrders(current => [...current, { ...payload, kds_received_at: new Date() }]);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}
    });

    socket.on('shiftClosed', () => setOrders([]));

    return () => socket.disconnect();
  }, [session?.token]);

  const bumpOrder = (orderId) => setOrders(c => c.filter(o => o.id !== orderId));

  if (!session || session.plan === 'FREE') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: '#ffc107' }}>KDS Unlocked on Paid Plans</h2>
        <p style={{ color: 'var(--text-muted)' }}>The Kitchen Display System requires a Pro or Overlord active subscription.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!connected && (
        <div style={{ background: '#ff4444', color: '#fff', padding: '16px', textAlign: 'center', fontWeight: 800, fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', zIndex: 100, position: 'relative' }}>
          ⚠️ DISCONNECTED: Kitchen is flying blind. Check network.
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px 24px 0 24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>Kitchen Display System</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: connected ? 'var(--accent-success)' : 'var(--accent-error)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: connected ? 'var(--accent-success)' : 'var(--accent-error)' }}></div>
          {connected ? 'LIVE RELAY ACTIVE' : 'CONNECTING...'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', flex: 1 }}>
        {orders.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-glass)', borderRadius: '16px' }}>
            <p>Waiting for incoming orders...</p>
          </div>
        ) : (
          orders.map((order, idx) => (
            <div key={order.id || idx} style={{ minWidth: '280px', background: 'var(--glass-overlay)', border: '1px solid var(--border-glass)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', backgroundColor: 'rgba(255,107,0,0.15)', borderBottom: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-main)' }}>{order.table || 'Counter'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.kds_received_at?.toLocaleTimeString()}</span>
                </div>
                <div style={{ fontSize: '0.9rem' }}>Server: <span style={{ color: 'var(--text-main)' }}>{order.waiter || 'Staff'}</span></div>
              </div>
              <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(order.items || []).map((item, i) => (
                    <li key={i} style={{ fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      {typeof item === 'string' ? item : `${item.name} x${item.qty || 1}`}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
                <button onClick={() => bumpOrder(order.id)} className="btn-pos" style={{ width: '100%', padding: '14px', fontSize: '1.1rem', backgroundColor: 'var(--accent-success)', color: '#000' }}>
                  BUMP (DONE)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
