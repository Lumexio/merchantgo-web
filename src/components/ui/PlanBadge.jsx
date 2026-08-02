export default function PlanBadge({ plan }) {
  const colors = { FREE: '#888', STARTER: '#4db8ff', PRO: '#ff6b00', ENTERPRISE: '#a855f7' };
  return (
    <span style={{ background: colors[plan] || '#888', color: '#fff', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em' }}>
      {plan}
    </span>
  );
}
