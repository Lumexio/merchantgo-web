import { useEffect, useState } from 'react';
import { listTenantStaff, createTenantStaff, updateTenantStaff } from '../../api/merchantgo.js';
import { getSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';
import { Plus, X } from 'lucide-react';

const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'SERVER'];
const EMPTY_FORM = { name: '', role: 'SERVER', active: true };

export default function StaffView() {
  const { t } = useI18n();
  const session = getSession();
  const isAdmin = session?.role === 'ADMIN';
  const [staff, setStaff] = useState([]);
  const [limit, setLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await listTenantStaff();
      setStaff(Array.isArray(data) ? data : (data?.staff || []));
      if (data?.limit != null) setLimit(data.limit);
    } catch (err) {
      setError(err.message);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const staffLimit = limit ?? session?.entitlements?.limits?.staff ?? 1;
  const atLimit = staff.length >= staffLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editId) {
        await updateTenantStaff(editId, form);
      } else {
        await createTenantStaff(form);
      }
      setShowForm(false); setForm(EMPTY_FORM); setEditId(null);
      fetchStaff();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member) => {
    setForm({ name: member.name || '', role: member.role || 'SERVER', active: member.active !== false });
    setEditId(member.id || member.$id);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>{t.staff.title}</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{staff.length} / {staffLimit}</span>
        {isAdmin && !atLimit && (
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }} className="btn-pos" style={{ marginLeft: 'auto' }}>
            <Plus size={16} /> Add Staff
          </button>
        )}
      </div>

      {atLimit && (
        <div style={{ backgroundColor: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.4)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--primary)', marginBottom: '20px', fontSize: '0.85rem' }}>
          {t.staff.limitWarning}
        </div>
      )}

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Outfit' }}>{editId ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>
            Staff display profiles are used for order attribution and role access. They do not create login accounts.
          </p>
          {error && <p style={{ color: 'var(--accent-error)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text" placeholder="Full name" value={form.name} required
              onChange={e => setForm(current => ({ ...current, name: e.target.value }))}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
            />
            <select value={form.role} onChange={e => setForm(current => ({ ...current, role: e.target.value }))}
              style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}>
              {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(current => ({ ...current, active: e.target.checked }))} />
              Active
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-pos" disabled={saving}>{saving ? t.common.loading : t.common.save}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t.common.cancel}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : staff.length === 0 && !error ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No staff found.
        </div>
      ) : staff.length > 0 ? (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Role</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Branch</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                {isAdmin && <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {staff.map((member, i) => (
                <tr key={member.id || member.$id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{member.name}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--primary)' }}>{member.role}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{member.branch_id || member.branchId || '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ color: member.active !== false ? 'var(--accent-success)' : 'var(--accent-error)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {member.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button onClick={() => openEdit(member)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {error && !loading && staff.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--accent-error)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
