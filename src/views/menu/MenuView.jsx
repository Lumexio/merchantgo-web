import { useEffect, useState } from 'react';
import { listTenantMenuItems, createTenantMenuItem, updateTenantMenuItem } from '../../api/merchantgo.js';
import { getSession } from '../../store/auth.js';
import { useI18n } from '../../locales/index.jsx';
import { Plus, X } from 'lucide-react';

const EMPTY_FORM = { name: '', category: '', price: '', notes: '', active: true };

export default function MenuView() {
  const { t } = useI18n();
  const session = getSession();
  const isAdmin = session?.role === 'ADMIN';
  const itemLimit = session?.entitlements?.limits?.menuItems || 25;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await listTenantMenuItems();
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const atLimit = items.length >= itemLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { ...form, price: parseFloat(form.price) || 0 };
      if (editId) {
        await updateTenantMenuItem(editId, payload);
      } else {
        await createTenantMenuItem(payload);
      }
      setShowForm(false); setForm(EMPTY_FORM); setEditId(null);
      fetchItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item) => {
    setForm({ name: item.name || '', category: item.category || '', price: String(item.price || ''), notes: item.notes || '', active: item.active !== false });
    setEditId(item.$id || item.id);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>{t.menu.title}</h2>
        {isAdmin && !atLimit && (
          <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }} className="btn-pos" style={{ marginLeft: 'auto', gap: '6px' }}>
            <Plus size={16} /> {t.menu.addItem}
          </button>
        )}
      </div>

      {atLimit && isAdmin && (
        <div style={{ backgroundColor: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.4)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--primary)', marginBottom: '20px', fontSize: '0.85rem' }}>
          {t.menu.limitWarning}
        </div>
      )}

      {showForm && (
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Outfit' }}>{editId ? 'Edit Item' : t.menu.addItem}</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          {error && <p style={{ color: 'var(--accent-error)', fontSize: '0.85rem', marginBottom: '12px' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              {[
                { key: 'name', placeholder: 'Item name', type: 'text', required: true },
                { key: 'category', placeholder: 'Category', type: 'text' },
                { key: 'price', placeholder: 'Price', type: 'number' },
              ].map(({ key, placeholder, type, required }) => (
                <input
                  key={key} type={type} placeholder={placeholder} value={form[key]} required={required}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}
                />
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active
              </label>
            </div>
            <textarea
              placeholder="Ingredient notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-main)', fontSize: '0.9rem', resize: 'vertical', outline: 'none', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-pos" disabled={saving}>{saving ? t.common.loading : t.common.save}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>{t.common.cancel}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>{t.common.loading}</p>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No menu items yet.
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Status</th>
                {isAdmin && <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600 }}>Edit</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.$id || i} style={{ borderTop: '1px solid var(--border-glass)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                    {item.name}
                    {item.notes && <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.notes}</span>}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{item.category || '—'}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>${Number(item.price || 0).toFixed(2)}</td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ color: item.active !== false ? 'var(--accent-success)' : 'var(--accent-error)', fontWeight: 600, fontSize: '0.8rem' }}>
                      {item.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <button onClick={() => openEdit(item)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
