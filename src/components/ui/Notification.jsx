export default function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{ backgroundColor: 'rgba(0,255,102,0.15)', borderBottom: '1px solid var(--accent-success)', padding: '12px 24px', color: 'var(--accent-success)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--accent-success)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
    </div>
  );
}
