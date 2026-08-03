export default function PlanBadge({ plan }) {
  const colors = { FREE: 'var(--text-muted)', STARTER: '#4db8ff', PRO: 'var(--primary)', ENTERPRISE: '#a855f7' };
  return (
    <span style={{ background: colors[plan] || 'var(--text-muted)', color: 'var(--text-main)', borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.03em' }}>
      {plan}
    </span>
  );
}
