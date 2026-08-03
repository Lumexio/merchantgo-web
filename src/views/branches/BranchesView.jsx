import { useEffect, useState } from 'react';
import { listTenantBranches, createTenantBranch, updateTenantBranch } from '../../api/merchantgo.js';
import { getSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';
import { Plus, X } from 'lucide-react';

const EMPTY_FORM = { name: '', active: true };

export default function BranchesView() {
  const { t } = useI18n();
  const session = getSession();
  const isAdmin = session?.role === 'ADMIN';
  const [branches, setBranches] = useState([]);
  const [limit, setLimit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await listTenantBranches();
      setBranches(Array.isArray(data) ? data : (data?.branches || []));
      if (data?.limit != null) setLimit(data.limit);
    } catch (err) {
      setError(err.message);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const branchLimit = limit ?? session?.entitlements?.limits?.branches ?? 1;
  const atLimit = branches.length >= branchLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (editId) {
        await updateTenantBranch(editId, form);
      } else {
        await createTenantBranch(form);
      }
      setShowForm(false); setForm(EMPTY_FORM); setEditId(null);
      fetchBranches();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (branch) => {
    setForm({ name: branch.name || '', active: branch.active !== false });
    setEditId(branch.$id || branch.id || branch.branch_id);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>{t.nav.branches}</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{branches.length} / {branchLimit}</span>
        {isAdmin && !atLimit && (
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }} className="btn-pos" style={{ marginLeft: 'auto' }}>
            <Plus size={16} /> Add Branch
          </button>
        )}
      </div>

      {atLimit && (
        <div style={{ backgroundColor: 'rgba(var(--primary-rgb, 255, 107, 0), 0.15)', border: '1px solid rgba(var(--primary-rgb, 255, 107, 0), 0.4)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--primary)', marginBottom: '20px', fontSize: '0.85rem' }}>
          Branch limit reached for your plan.
        </div>
      )}

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontFamily: 'Outfit' }}>{editId ? 'Edit Branch' : 'Add Branch'}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          {error && <p style={{ color: 'var(--accent-error)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text" placeholder="Branch name" value={form.name} required
              onChange={e => setForm(current => ({ ...current, name: e.target.value }))}
              style={{ backgroundColor: 'var(--glass-overlay)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
            />
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
      ) : branches.length === 0 && !error ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No branches found.
        </div>
      ) : branches.length > 0 ? (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: 'var(--glass-overlay)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Branch ID</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                {isAdmin && <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {branches.map((branch, i) => (
                <tr key={branch.$id || branch.id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>{branch.name}</td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{branch.$id || branch.id || branch.branch_id}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ color: branch.active !== false ? 'var(--accent-success)' : 'var(--accent-error)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {branch.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button onClick={() => openEdit(branch)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {error && !loading && branches.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--accent-error)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
