export default function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div style={{ backgroundColor: 'rgba(0,255,102,0.15)', borderBottom: '1px solid #00ff66', padding: '12px 24px', color: '#00ff66', fontSize: '0.9rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#00ff66', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
    </div>
  );
}
