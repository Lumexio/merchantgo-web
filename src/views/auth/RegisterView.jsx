import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAppwriteUser } from '../../api/merchantgo.js';
import { useI18n } from '../../locales/index.jsx';

export default function RegisterView() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState('SOLO_FOOD_TRUCK');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await registerAppwriteUser(email, password, name, mode);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 900 }}>
            MERCHANT<span style={{ color: 'var(--primary)' }}>GO</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>{t.auth.register}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(var(--accent-error-rgb, 255, 77, 77),0.15)', border: '1px solid rgba(var(--accent-error-rgb, 255, 77, 77),0.4)', borderRadius: 'var(--radius-md)', padding: '12px', color: 'var(--accent-error)', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['SOLO_FOOD_TRUCK', 'MULTI_STATION_BAR'].map(m => (
              <button
                key={m} type="button" onClick={() => setMode(m)}
                style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', backgroundColor: mode === m ? 'rgba(var(--primary-rgb, 255, 107, 0), 0.15)' : 'transparent', color: mode === m ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
              >
                {m === 'SOLO_FOOD_TRUCK' ? t.auth.soloFoodTruck : t.auth.multiStationBar}
              </button>
            ))}
          </div>
          <input
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={t.auth.businessName} required
            style={{ backgroundColor: 'var(--glass-overlay)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
          />
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder={t.auth.email} required
            style={{ backgroundColor: 'var(--glass-overlay)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder={t.auth.password} required minLength={8}
            style={{ backgroundColor: 'var(--glass-overlay)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
          />
          <button type="submit" className="btn-pos" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? t.auth.registering : t.auth.register}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            {t.auth.signIn}
          </Link>
        </p>
      </div>
    </div>
  );
}
