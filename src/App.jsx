import React, { useEffect, useRef, useState } from 'react';
import { Utensils, DollarSign, Activity, Layers, Plus, Lock, TrendingUp, ShieldAlert, LogOut, KeyRound, Cloud, Database, Settings, Download, Upload } from 'lucide-react';
import {
  checkAppwriteSession,
  createTenantMenuItem,
  exportTenantSnapshot,
  googleDriveStatus,
  importTenantSnapshot,
  listTenantBranches,
  listTenantMenuItems,
  listTenantReports,
  listTenantStaff,
  loginAppwriteUser,
  loginMerchantGoPin,
  logoutAppwriteSession,
  merchantGoRequest,
  connectGoogleDrive,
  pullCatalogFromGoogleDrive,
  pushCatalogToGoogleDrive,
  registerAppwriteUser,
} from './appwrite';
import './index.css';

// ==========================================
// 1. SECURITY SHIELD COMPONENT (RBAC GUARD)
// ==========================================
function SecurityShield({ requiredRole, currentRole }) {
  return (
    <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 28px', border: '1px solid rgba(255, 77, 77, 0.3)', background: 'radial-gradient(circle at center, rgba(255, 77, 77, 0.08) 0%, rgba(12,13,18,0.95) 100%)', maxWidth: '680px', margin: '40px auto', borderRadius: '24px' }}>
      <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(255, 77, 77, 0.12)', border: '2px solid rgba(255, 77, 77, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <ShieldAlert size={42} color="#ff4d4d" />
      </div>
      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.15)', padding: '6px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Protected Executive Tier • Clearance Denied
      </span>
      <h2 style={{ fontSize: '2.2rem', marginTop: '16px', marginBottom: '12px', color: '#fff' }}>Administrative Authority Required</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '28px', maxWidth: '520px', margin: '0 auto 28px' }}>
        This module contains protected analytics, menu, or cashout actions reserved for <strong>{requiredRole === 'ADMIN' ? '👑 Global Owners / Admins' : '🛡️ Shift Managers'}</strong>. Your current session credential (<strong>{currentRole}</strong>) does not include the required API permission.
      </p>
      <span style={{ display: 'block', fontSize: '0.82rem', color: '#888' }}>
        Sign in with an account that has the required server-side permission.
      </span>
    </div>
  );
}

// ==========================================
// 2. AUTHENTICATION & ONBOARDING PORTAL
// ==========================================
function AuthPortal({ onAuthenticate }) {
  const [mode, setMode] = useState('SIGNIN'); // 'SIGNIN' | 'REGISTER'
  const [authMethod, setAuthMethod] = useState('CLOUD'); // 'CLOUD' (Appwrite) | 'PIN' (Local Staff Terminal)
  const [tenantType, setTenantType] = useState('SOLO_FOOD_TRUCK');
  
  // Appwrite Cloud Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (authMethod === 'PIN') {
      setLoading(true);
      try {
        onAuthenticate({ ...(await loginMerchantGoPin(pin)), avatar: '🔐', isCloud: false });
      } catch (err) {
        setError(err.message || 'Invalid staff PIN');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      if (mode === 'REGISTER') {
        const profile = await registerAppwriteUser(email, password, username || 'New Workspace Owner', tenantType);
        onAuthenticate({ ...profile, avatar: '☁️👑', isCloud: true });
      } else {
        const profile = await loginAppwriteUser(email, password);
        onAuthenticate({ ...profile, avatar: '☁️', isCloud: true });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || (mode === 'REGISTER'
        ? 'We could not create your MerchantGo account. Check your details and try again.'
        : 'We could not sign you in. Check your email and password, or use a staff PIN.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'radial-gradient(circle at top right, rgba(255, 107, 0, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(0, 255, 102, 0.15), transparent 40%), #090a0d' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '40px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        
        {/* LOGO & BRANDING */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', justifyContent: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: tenantType === 'SOLO_FOOD_TRUCK' ? 'linear-gradient(135deg, #00ff66, #008033)' : 'linear-gradient(135deg, var(--primary-pos), #b34600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tenantType === 'SOLO_FOOD_TRUCK' ? '#000' : '#fff', fontWeight: 900, fontSize: '1.6rem', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            {tenantType === 'SOLO_FOOD_TRUCK' ? '🚚' : 'M'}
          </div>
          <div>
            <span style={{ fontSize: '1.8rem', fontWeight: 900, fontFamily: 'Outfit', letterSpacing: '-0.03em', color: '#fff', display: 'block' }}>
              MERCHANT<span style={{ color: tenantType === 'SOLO_FOOD_TRUCK' ? '#00ff66' : 'var(--primary-pos)' }}>GO</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#00ff66', fontWeight: 700, display: 'block', background: 'rgba(0,255,102,0.12)', padding: '2px 8px', borderRadius: '6px', width: 'fit-content' }}>
              ● Your point-of-sale workspace
            </span>
          </div>
        </div>

        {/* TAB SWITCHER: SIGN IN vs REGISTER WORKSPACE */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '5px', borderRadius: '14px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => setMode('SIGNIN')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: mode === 'SIGNIN' ? 'rgba(255,255,255,0.1)' : 'transparent', color: mode === 'SIGNIN' ? '#fff' : '#888', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'Outfit', transition: 'all 0.2s' }}>
            🔑 Sign In
          </button>
          <button onClick={() => { setMode('REGISTER'); setAuthMethod('CLOUD'); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: mode === 'REGISTER' ? (tenantType === 'SOLO_FOOD_TRUCK' ? '#00ff66' : 'var(--primary-pos)') : 'transparent', color: mode === 'REGISTER' ? (tenantType === 'SOLO_FOOD_TRUCK' ? '#000' : '#fff') : '#888', fontWeight: 800, fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'Outfit', transition: 'all 0.2s' }}>
            📝 Create Account
          </button>
        </div>

        {/* AUTH METHOD TOGGLE: OWNER ACCOUNT vs STAFF PIN */}
        {mode === 'SIGNIN' && <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <button 
            type="button" 
            onClick={() => setAuthMethod('CLOUD')} 
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: authMethod === 'CLOUD' ? '1px solid #00ff66' : '1px solid var(--border-glass)', background: authMethod === 'CLOUD' ? 'rgba(0,255,102,0.1)' : 'transparent', color: authMethod === 'CLOUD' ? '#00ff66' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Cloud size={14} /> Owner Account
          </button>
          <button 
            type="button" 
            onClick={() => setAuthMethod('PIN')} 
            style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, border: authMethod === 'PIN' ? '1px solid var(--primary-pos)' : '1px solid var(--border-glass)', background: authMethod === 'PIN' ? 'rgba(255,107,0,0.1)' : 'transparent', color: authMethod === 'PIN' ? 'var(--primary-pos)' : '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <KeyRound size={14} /> Staff PIN
          </button>
        </div>}

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 77, 77, 0.2)', border: '1px solid #ff4d4d', padding: '12px', borderRadius: '12px', color: '#ff4d4d', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', marginBottom: '20px' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'REGISTER' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#ccc', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                What type of business are you setting up?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div onClick={() => setTenantType('SOLO_FOOD_TRUCK')} style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', border: tenantType === 'SOLO_FOOD_TRUCK' ? '2px solid #00ff66' : '1px solid rgba(255,255,255,0.08)', background: tenantType === 'SOLO_FOOD_TRUCK' ? 'rgba(0, 255, 102, 0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '6px' }}>🚚</span>
                  <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>Solo Food Truck</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>A simple owner-operated setup for fast counter service.</span>
                </div>
                <div onClick={() => setTenantType('MULTI_STATION_BAR')} style={{ padding: '16px', borderRadius: '16px', cursor: 'pointer', border: tenantType === 'MULTI_STATION_BAR' ? '2px solid var(--primary-pos)' : '1px solid rgba(255,255,255,0.08)', background: tenantType === 'MULTI_STATION_BAR' ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '6px' }}>🏢</span>
                  <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>Multi-Station Bar</strong>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>A team setup with shared terminals and staff PINs.</span>
                </div>
              </div>
            </div>
          )}

          {mode === 'REGISTER' && <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              Business or owner name
            </label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter' }}
            />
          </div>}

          {authMethod === 'CLOUD' ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Email address
                </label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@merchantgo.store"
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.5)', color: '#00ff66', fontSize: '1rem', outline: 'none', fontFamily: 'Inter' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Password
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '1rem', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Staff Terminal PIN
              </label>
              <input 
                type="password" 
                maxLength={4}
                value={pin} 
                onChange={(e) => setPin(e.target.value)}
                style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '1.25rem', letterSpacing: '0.4em', outline: 'none', textAlign: 'center', fontFamily: 'monospace' }}
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-pos" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '1.05rem', background: tenantType === 'SOLO_FOOD_TRUCK' ? '#00cc52' : 'var(--primary-pos)', color: tenantType === 'SOLO_FOOD_TRUCK' ? '#000' : '#fff', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Please wait...' : (mode === 'REGISTER' ? '🚀 Create My MerchantGo Account' : (authMethod === 'PIN' ? '⚡ Open Staff Terminal' : '⚡ Sign In'))}
          </button>
        </form>

      </div>
    </div>
  );
}

// ==========================================
// 3. MAIN ENTERPRISE DASHBOARD & POWER TOOL
// ==========================================
export default function App() {
  const [session, setSession] = useState(checkAppwriteSession());
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'floor' | 'menu' | 'corte' | 'settings'
  const [corteResult, setCorteResult] = useState(null);
  const [notification, setNotification] = useState(null);

  const [orders, setOrders] = useState([]);

  // --- PHASE 1: INGREDIENT & MENU DB ---
  const [menuItems, setMenuItems] = useState([]);

  const [ingredients, setIngredients] = useState([
    { id: 'i1', name: 'Onions', stockCode: 'VEG_ONION_01' },
    { id: 'i2', name: 'Tomato', stockCode: 'VEG_TOMATO_01' },
    { id: 'i3', name: 'Double Chuck Patty', stockCode: 'PATTY_CHUCK_01' },
  ]);
  
  const [showIngredientManager, setShowIngredientManager] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState(null);
  const [staffCount, setStaffCount] = useState(0);
  const [branchCount, setBranchCount] = useState(0);
  const [recentReports, setRecentReports] = useState([]);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [googleDrive, setGoogleDrive] = useState({ connected: false, connectedAt: null });
  const snapshotInput = useRef(null);

  useEffect(() => {
    if (!session?.token) return;
    merchantGoRequest('/orders/active')
      .then(result => setOrders(result.orders.map(order => ({
        ...order,
        server: order.waiter,
        time: 'Active',
      }))))
      .catch(error => setNotification(error.message));
  }, [session?.token]);

  useEffect(() => {
    if (!session?.token || session.plan !== 'FREE') return;
    googleDriveStatus()
      .then(setGoogleDrive)
      .catch(error => setNotification(error.message));
  }, [session?.token, session?.plan]);

  useEffect(() => {
    if (!session?.token) return;
    listTenantMenuItems()
      .then(result => setMenuItems((result.items || []).map(item => ({
        id: item.$id || item.id,
        name: item.name,
        cat: item.category || 'General',
        price: `$${Number(item.price || 0).toFixed(2)}`,
        ing: item.notes || '',
        rawIngredients: item.rawIngredients || [],
      }))))
      .catch(error => setNotification(error.message));
    listTenantStaff()
      .then(result => setStaffCount((result.staff || []).length))
      .catch(() => setStaffCount(0));
    listTenantBranches()
      .then(result => setBranchCount((result.branches || []).length))
      .catch(() => setBranchCount(0));
    listTenantReports()
      .then(result => setRecentReports(result.reports || []))
      .catch(() => setRecentReports([]));
  }, [session?.token]);

  const topMovers = [
    { name: 'Gourmet Smash Burger', volume: '142 units sold today', revenue: '$2,343.00', trend: '+28% vs last Friday', icon: '🍔' },
    { name: 'Ribeye Tacos (3pc)', volume: '94 units sold today', revenue: '$1,739.00', trend: '+14% vs last Friday', icon: '🌮' },
    { name: 'Agave Craft Lemonade', volume: '118 units sold today', revenue: '$767.00', trend: '+42% heatwave rush', icon: '🍋' },
  ];

  // If Unauthenticated -> Display Authentication Portal
  if (!session) {
    return <AuthPortal onAuthenticate={(userSession) => { 
      setSession(userSession); 
      setActiveTab(userSession.role === 'CASHIER' ? 'floor' : 'analytics'); 
      if (userSession.notice) {
        setNotification(userSession.notice);
        setTimeout(() => setNotification(null), 5000);
      }
    }} />;
  }

  const operatingMode = session.mode; // 'SOLO_FOOD_TRUCK' | 'MULTI_STATION_BAR'
  const can = (feature) => session.entitlements?.features?.includes(feature);
  const limits = session.entitlements?.limits || { menuItems: 25, staff: 1, branches: 1 };

  const handleLogout = async () => {
    if (session.isCloud) {
      await logoutAppwriteSession();
    }
    setSession(null);
  };

  const executeCorte = async (type) => {
    try {
      const result = await merchantGoRequest('/orders/corte-de-caja', {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      const report = result.z_report_ticket;
      setCorteResult({
        type: report.type,
        timestamp: report.generated_at,
        total_orders: report.total_orders_closed,
        gross_revenue: `$${report.gross_revenue.toFixed(2)}`,
        cash_collected: `$${report.payment_breakdown.cash.toFixed(2)}`,
        card_settled: `$${report.payment_breakdown.card.toFixed(2)}`,
        waiter_tips_pool: `$${report.waiter_tips_pool.toFixed(2)}`,
        status: report.status,
      });
      setRecentReports(previous => [{ ...report }, ...previous].slice(0, 20));
    } catch (error) {
      setNotification(error.message);
    }
  };

  const transferOrder = async (id) => {
    try {
      await merchantGoRequest(`/orders/${id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ staffName: 'Helper #2 (Sofia)' }),
      });
      setOrders(orders.map(o => o.id === id ? { ...o, server: 'Helper #2 (Sofia)' } : o));
    } catch (error) {
      setNotification(error.message);
    }
  };

  const settleOrder = async (id) => {
    try {
      await merchantGoRequest('/orders/settle', {
        method: 'POST',
        body: JSON.stringify({ orderId: id, paymentMethod: 'CASH' }),
      });
      setOrders(orders.filter(order => order.id !== id));
      setNotification(`Account ${id} settled by ${session.name}.`);
    } catch (error) {
      setNotification(error.message);
    }
  };

  const createMenuItem = async () => {
    const name = prompt('Menu item name');
    if (!name) return;
    const category = prompt('Category', 'General');
    const priceInput = prompt('Price', '0');
    const price = Number(priceInput || '0');
    if (!Number.isFinite(price)) {
      setNotification('Price must be numeric.');
      return;
    }
    try {
      const result = await createTenantMenuItem({
        name,
        category: category || 'General',
        price,
      });
      const item = result.item;
      setMenuItems([
        ...menuItems,
        {
          id: item.$id || item.id,
          name: item.name,
          cat: item.category,
          price: `$${Number(item.price || 0).toFixed(2)}`,
          ing: item.notes || '',
          rawIngredients: item.rawIngredients || [],
        },
      ]);
    } catch (error) {
      setNotification(error.message);
    }
  };

  const downloadSnapshot = async () => {
    setSnapshotBusy(true);
    try {
      const { snapshot } = await exportTenantSnapshot();
      const url = URL.createObjectURL(new Blob(
        [JSON.stringify(snapshot, null, 2)],
        { type: 'application/json' },
      ));
      const link = document.createElement('a');
      link.href = url;
      link.download = `merchantgo-catalog-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotification('Catalog snapshot downloaded. You can save it in your cloud-drive folder.');
    } catch (error) {
      setNotification(error.message);
    } finally {
      setSnapshotBusy(false);
    }
  };

  const restoreSnapshot = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 500_000) {
      setNotification('Snapshot exceeds the 500 KB limit.');
      return;
    }

    setSnapshotBusy(true);
    try {
      const snapshot = JSON.parse(await file.text());
      const preview = await importTenantSnapshot(snapshot, true);
      const approved = window.confirm(
        `${preview.message}\n\n` +
        `${preview.counts.menuItems} menu items, ${preview.counts.branches} branches, ` +
        `${preview.counts.staffProfiles} staff profiles.\n\nContinue?`,
      );
      if (!approved) return;

      const result = await importTenantSnapshot(snapshot, false);
      const [menu, staff, branches] = await Promise.all([
        listTenantMenuItems(),
        listTenantStaff(),
        listTenantBranches(),
      ]);
      setMenuItems((menu.items || []).map(item => ({
        id: item.$id || item.id,
        name: item.name,
        cat: item.category || 'General',
        price: `$${Number(item.price || 0).toFixed(2)}`,
        ing: item.notes || '',
        rawIngredients: item.rawIngredients || [],
      })));
      setStaffCount((staff.staff || []).length);
      setBranchCount((branches.branches || []).length);
      setNotification(result.message);
    } catch (error) {
      setNotification(error instanceof SyntaxError ? 'Snapshot is not valid JSON.' : error.message);
    } finally {
      setSnapshotBusy(false);
    }
  };

  const syncGoogleDrive = async (direction) => {
    setSnapshotBusy(true);
    try {
      if (direction === 'push') {
        const result = await pushCatalogToGoogleDrive();
        setNotification(result.message);
      } else {
        await pullCatalogFromGoogleDrive();
        const [menu, staff, branches] = await Promise.all([
          listTenantMenuItems(),
          listTenantStaff(),
          listTenantBranches(),
        ]);
        setMenuItems((menu.items || []).map(item => ({
          id: item.$id || item.id,
          name: item.name,
          cat: item.category || 'General',
          price: `$${Number(item.price || 0).toFixed(2)}`,
          ing: item.notes || '',
          rawIngredients: item.rawIngredients || [],
        })));
        setStaffCount((staff.staff || []).length);
        setBranchCount((branches.branches || []).length);
        setNotification('Catalog restored from Google Drive.');
      }
    } catch (error) {
      setNotification(error.message);
    } finally {
      setSnapshotBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER & ENTERPRISE RBAC COMMAND BAR */}
      <header style={{ borderBottom: '1px solid var(--border-glass)', padding: '14px 24px', backgroundColor: 'rgba(12,13,18,0.95)', backdropFilter: 'blur(16px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* BRAND LOGO & WORKSPACE IDENTITY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: operatingMode === 'SOLO_FOOD_TRUCK' ? 'linear-gradient(135deg, #00ff66, #008033)' : 'linear-gradient(135deg, var(--primary-pos), #b34600)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: operatingMode === 'SOLO_FOOD_TRUCK' ? '#000' : '#fff', fontWeight: 900, fontSize: '1.4rem', boxShadow: '0 4px 18px rgba(0,0,0,0.4)' }}>
            {operatingMode === 'SOLO_FOOD_TRUCK' ? '🚚' : 'M'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '-0.02em', color: '#fff' }}>
                MERCHANT<span style={{ color: operatingMode === 'SOLO_FOOD_TRUCK' ? '#00ff66' : 'var(--primary-pos)' }}>GO</span>
              </span>
              <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: operatingMode === 'SOLO_FOOD_TRUCK' ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 107, 0, 0.15)', borderRadius: '6px', color: operatingMode === 'SOLO_FOOD_TRUCK' ? '#00ff66' : 'var(--primary-pos)', fontWeight: 800 }}>
                {operatingMode === 'SOLO_FOOD_TRUCK' ? 'SOLO TRUCK TENANT' : 'MULTI-STATION ENTERPRISE'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Authenticated Staff: <strong style={{ color: '#fff' }}>{session.avatar} {session.name} ({session.role})</strong>
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={activeTab === 'analytics' ? 'btn-pos' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem', background: activeTab === 'analytics' && operatingMode === 'SOLO_FOOD_TRUCK' ? '#00b368' : '' }}
          >
            <TrendingUp size={16} /> Home Analytics {!can('VIEW_ANALYTICS') && '🔒'}
          </button>
          <button 
            onClick={() => setActiveTab('floor')}
            className={activeTab === 'floor' ? 'btn-pos' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <Utensils size={16} /> Live Register & Floor ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={activeTab === 'menu' ? 'btn-pos' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <Layers size={16} /> Menu Engineering {!can('MANAGE_MENU') && '🔒'}
          </button>
          <button 
            onClick={() => setActiveTab('corte')}
            className={activeTab === 'corte' ? 'btn-pos' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem', backgroundColor: activeTab === 'corte' ? '#00b368' : '' }}
          >
            <DollarSign size={16} /> Corte de Caja (Z-Report)
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? 'btn-pos' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <Settings size={16} /> Plan & Capacity {session.role !== 'ADMIN' && '🔒'}
          </button>
        </nav>

        {/* AUTHENTICATED SESSION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: 'rgba(255, 77, 77, 0.4)', color: '#ff8585' }} title="Lock Terminal & Sign Out">
            <LogOut size={16} /> Lock Terminal
          </button>
        </div>

      </header>
      
      {/* TENANT OPERATIONAL BAR */}
      <div style={{ backgroundColor: '#07080b', borderBottom: '1px solid var(--border-glass)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>Active Mode: <strong>{operatingMode === 'SOLO_FOOD_TRUCK' ? '🚚 Solo Food Truck & Weekend Helpers' : '🏢 Enterprise Multi-Station Hospitality Suite'}</strong></span>
          <span>Plan: <strong>{session.plan}</strong></span>
        </div>
        <span style={{ color: '#00ff66', fontWeight: 700 }}>● Authenticated API session</span>
      </div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div style={{ backgroundColor: 'rgba(0, 255, 102, 0.2)', borderBottom: '1px solid #00ff66', padding: '12px 24px', color: '#00ff66', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center' }}>
          {notification}
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      <main style={{ flex: 1, padding: '40px 28px', maxWidth: '1380px', width: '100%', margin: '0 auto' }}>
        
        {/* VIEW 1: HOME STATISTICS & ANALYTICS POWER TOOL */}
        {activeTab === 'analytics' && (
          <div>
            {!can('VIEW_ANALYTICS') ? (
              <SecurityShield requiredRole="MANAGER" currentRole={session.role} />
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#00ff66', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ● After-Hours Executive Management Hub
                    </span>
                    <h1 style={{ fontSize: '2.8rem', marginTop: '4px' }}>Daily Shift Statistics & Insights</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                      Review the current MVP analytics dashboard for your authenticated workspace.
                    </p>
                  </div>

                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Plan changes are managed by MerchantGo support during the MVP.
                  </span>
                </div>

                {/* TOP METRIC SUMMARY CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '22px', marginBottom: '36px' }}>
                  
                  <div className="glass-panel" style={{ borderTop: '4px solid #00ff66', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Today's Gross Sales</span>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(0, 255, 102, 0.15)', color: '#00ff66', fontSize: '0.75rem', fontWeight: 800 }}>
                        +18.4% vs Avg
                      </span>
                    </div>
                    <strong style={{ fontSize: '2.6rem', fontFamily: 'Outfit', display: 'block', color: '#fff', marginBottom: '6px' }}>
                      {session.role === 'ADMIN' ? '$4,849.00' : '••••••••'}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                      {session.role === 'ADMIN' ? 'Cash and external card settlement summary' : '🔒 Financial figures restricted to Global Admin'}
                    </span>
                  </div>

                  <div className="glass-panel" style={{ borderTop: '4px solid var(--primary-pos)', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Order Ticket Volume</span>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary-pos)', fontSize: '0.75rem', fontWeight: 800 }}>
                        Express Speed
                      </span>
                    </div>
                    <strong style={{ fontSize: '2.6rem', fontFamily: 'Outfit', display: 'block', color: '#fff', marginBottom: '6px' }}>84 Orders</strong>
                    <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Avg Ticket Value: <strong>{session.role === 'ADMIN' ? '$57.72 MXN/USD' : '••••••'}</strong></span>
                  </div>

                  <div className="glass-panel" style={{ borderTop: '4px solid #ffb800', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Helper Staff Attribution</span>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(255, 184, 0, 0.15)', color: '#ffb800', fontSize: '0.75rem', fontWeight: 800 }}>
                        3 Active Helpers
                      </span>
                    </div>
                    <strong style={{ fontSize: '2.4rem', fontFamily: 'Outfit', display: 'block', color: '#fff', marginBottom: '6px' }}>Marco & Sofia</strong>
                    <span style={{ fontSize: '0.85rem', color: '#ccc' }}>Owner handled 68% • Helpers handled 32% of line</span>
                  </div>

                </div>

                {/* MVP ANALYTICS PREVIEW */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '26px', marginBottom: '36px' }}>
                  
                  <div className="glass-panel" style={{ padding: '28px' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#fff' }}>Peak Sales Velocity & Hourly Rushes</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                      Sample visualization layout for a future persisted analytics endpoint.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingBottom: '10px', borderBottom: '1px solid var(--border-glass)' }}>
                      {[
                        { time: '11am', height: '35%', val: '$310' },
                        { time: '12pm', height: '75%', val: '$920' },
                        { time: '1pm (Rush)', height: '100%', val: '$1,480', peak: true },
                        { time: '2pm', height: '80%', val: '$1,050' },
                        { time: '3pm', height: '45%', val: '$510' },
                        { time: '4pm', height: '30%', val: '$320' },
                        { time: '5pm', height: '20%', val: '$259' },
                      ].map((bar, i) => (
                        <div key={i} style={{ flex: 1, margin: '0 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: bar.peak ? '#00ff66' : '#bbb', marginBottom: '6px' }}>{session.role === 'ADMIN' ? bar.val : '•'}</span>
                          <div style={{ width: '100%', height: bar.height, backgroundColor: bar.peak ? '#00ff66' : 'var(--primary-pos)', borderRadius: '8px 8px 0 0', boxShadow: bar.peak ? '0 0 15px rgba(0, 255, 102, 0.4)' : 'none', transition: 'all 0.3s' }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 700 }}>{bar.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INVENTORY BOUNDARY */}
                  <div className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(255, 77, 77, 0.4)', background: 'linear-gradient(180deg, rgba(255, 77, 77, 0.08) 0%, rgba(12,13,18,0.9) 100%)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4d4d', fontWeight: 800, marginBottom: '14px' }}>
                      <ShieldAlert size={24} /> Inventory Boundary
                    </div>
                    <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>StockMachine remains separate</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '22px', lineHeight: 1.5 }}>
                      MerchantGo does not automatically deduct inventory in this MVP. Use StockMachine independently for inventory operations.
                    </p>

                    <div style={{ background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#ff8585', fontWeight: 700 }}>Automatic depletion</span>
                        <strong style={{ color: '#ff4d4d' }}>Not implemented</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px' }}>
                        <div style={{ width: '0%', height: '100%', background: '#ff4d4d', borderRadius: '999px' }} />
                      </div>
                    </div>

                    <a href="https://stockmachine.online" target="_blank" rel="noreferrer" className="btn-pos" style={{ width: '100%', justifyContent: 'center', background: '#ff4d4d', color: '#000', fontSize: '0.95rem' }}>
                      Open StockMachine Separately →
                    </a>
                  </div>

                </div>

                {/* TOP MENU MOVERS TABLE */}
                <div className="glass-panel" style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.6rem', marginBottom: '6px', color: '#fff' }}>Top Menu Movers (Today's Route)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
                    High-margin items generated by your express billing lines.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    {topMovers.map((it, idx) => (
                      <div key={idx} style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '2.4rem' }}>{it.icon}</span>
                          <div>
                            <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '4px' }}>{it.name}</h4>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block' }}>{it.volume}</span>
                            <span style={{ color: '#00ff66', fontSize: '0.78rem', fontWeight: 700 }}>▲ {it.trend}</span>
                          </div>
                        </div>
                        <strong style={{ fontSize: '1.5rem', fontFamily: 'Outfit', color: 'var(--primary-pos)' }}>{session.role === 'ADMIN' ? it.revenue : '••••'}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LIVE REGISTER & FLOOR ACCOUNTS */}
        {activeTab === 'floor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '2.4rem', marginBottom: '6px' }}>
                  {operatingMode === 'SOLO_FOOD_TRUCK' ? '⚡ Express Register Quick-Serve Counter' : 'Shared Table Stations & Active Accounts'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  {operatingMode === 'SOLO_FOOD_TRUCK' 
                    ? 'All-in-One register view for lone operators with authenticated cash or external card settlement.' 
                    : 'Waitstaff orders entered via shared PIN tablets emit instant WebSocket events directly to this Manager & Cashier terminal.'}
                </p>
              </div>
              <button onClick={() => alert('New ticket cart opened directly on express line.')} className="btn-pos" style={{ gap: '6px' }}>
                <Plus size={18} /> {operatingMode === 'SOLO_FOOD_TRUCK' ? '+ New Express Counter Cart' : 'Open Manual Table Account'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
              {orders.map((o) => (
                <div key={o.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: o.status === 'READY_TO_CLOSE' ? '3px solid #00b368' : '3px solid var(--primary-pos)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', padding: '3px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                        {o.id} • {o.table}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: o.status === 'READY_TO_CLOSE' ? '#00ff66' : 'var(--primary-pos)' }}>
                        {o.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Lock size={14} color="var(--primary-pos)" /> Operator ID: <strong style={{ color: '#fff' }}>{o.server}</strong>
                    </div>

                    <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '10px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Line Items</span>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', color: '#ccc' }}>
                        {o.items.map((it, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--primary-pos)' }}>▪</span> {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Amount Due:</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', fontFamily: 'Outfit' }}>${o.total.toFixed(2)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button disabled={!can('TRANSFER_ORDER')} onClick={() => transferOrder(o.id)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '10px', opacity: can('TRANSFER_ORDER') ? 1 : 0.5 }}>
                        {operatingMode === 'SOLO_FOOD_TRUCK' ? '👤 Reassign Helper' : 'Transfer Table'}
                      </button>
                      <button disabled={!can('SETTLE_ORDER')} onClick={() => settleOrder(o.id)} className="btn-pos" style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.85rem', padding: '10px', background: '#00cc52', color: '#000', opacity: can('SETTLE_ORDER') ? 1 : 0.5 }}>
                        ⚡ Rapid Settle ($) →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: MENU & INGREDIENT ENGINEERING */}
        {activeTab === 'menu' && (
          <div>
            {!can('MANAGE_MENU') ? (
              <SecurityShield requiredRole="MANAGER" currentRole={session.role} />
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div>
                    <h1 style={{ fontSize: '2.4rem', marginBottom: '6px' }}>Menu & Ingredient Mapping</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                      Manage the current client-side menu draft. Automatic StockMachine consumption is not implemented in this MVP.
                    </p>
                  </div>
                  {session.role === 'ADMIN' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setShowIngredientManager(true)} className="btn-secondary" style={{ gap: '6px', padding: '8px 16px' }}>
                        <Database size={16} /> Manage Ingredients
                      </button>
                      <button onClick={createMenuItem} className="btn-pos" style={{ gap: '6px' }}>
                        + Create Menu Item
                      </button>
                    </div>
                  )}
                </div>

                <div className="glass-panel">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        <th style={{ padding: '14px 12px' }}>Menu Item Title</th>
                        <th style={{ padding: '14px 12px' }}>Category</th>
                        <th style={{ padding: '14px 12px' }}>Base Price</th>
                        <th style={{ padding: '14px 12px' }}>Ingredient Notes</th>
                        <th style={{ padding: '14px 12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item, index) => (
                        <tr key={index} style={{ borderBottom: index === menuItems.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '16px 12px', fontWeight: 700, color: '#fff' }}>{item.name}</td>
                          <td style={{ padding: '16px 12px' }}>
                            <span style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                              {item.cat}
                            </span>
                          </td>
                          <td style={{ padding: '16px 12px', fontWeight: 800, color: 'var(--primary-pos)' }}>{item.price}</td>
                          <td style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {item.rawIngredients && item.rawIngredients.length > 0 
                              ? item.rawIngredients.map(id => ingredients.find(i => i.id === id)?.name).join(', ') 
                              : item.ing}
                          </td>
                          <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                            {session.role === 'ADMIN' ? (
                              <button onClick={() => setEditingMenuItemId(item.id)} style={{ background: 'transparent', border: '1px solid var(--border-glass)', padding: '6px 12px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
                                Edit Specs
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: '#777' }}>🔒 View Only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* INGREDIENT MANAGER OVERLAY */}
            {showIngredientManager && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ width: '480px', padding: '32px' }}>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '16px', color: '#fff' }}>Ingredient Database</h2>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    {ingredients.map(ing => (
                      <div key={ing.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
                        <span>{ing.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ing.stockCode}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <input type="text" placeholder="New Ingredient Name" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.5)', color: '#fff' }} value={newIngredientName} onChange={e => setNewIngredientName(e.target.value)} />
                    <button className="btn-pos" onClick={() => { if(newIngredientName) { setIngredients([...ingredients, { id: 'i'+Date.now(), name: newIngredientName, stockCode: 'NEW_ING_01' }]); setNewIngredientName(''); } }}>Add</button>
                  </div>
                  <button className="btn-secondary" style={{ width: '100%' }} onClick={() => setShowIngredientManager(false)}>Close Database</button>
                </div>
              </div>
            )}

            {/* EDIT SPECS / MAPPING OVERLAY */}
            {editingMenuItemId && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ width: '480px', padding: '32px' }}>
                  <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', color: '#fff' }}>Map Ingredients</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '20px' }}>Select the raw ingredients that comprise this menu item.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                    {ingredients.map(ing => {
                      const menuItem = menuItems.find(m => m.id === editingMenuItemId);
                      const isMapped = menuItem?.rawIngredients?.includes(ing.id);
                      return (
                        <label key={ing.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer', background: isMapped ? 'rgba(255, 107, 0, 0.1)' : 'rgba(0,0,0,0.2)' }}>
                          <input type="checkbox" checked={isMapped || false} onChange={() => {
                            setMenuItems(menuItems.map(m => {
                              if (m.id === editingMenuItemId) {
                                const raw = m.rawIngredients || [];
                                return { ...m, rawIngredients: isMapped ? raw.filter(id => id !== ing.id) : [...raw, ing.id] };
                              }
                              return m;
                            }));
                          }} />
                          <span style={{ color: '#fff' }}>{ing.name}</span>
                        </label>
                      );
                    })}
                  </div>

                  <button className="btn-pos" style={{ width: '100%' }} onClick={() => setEditingMenuItemId(null)}>Save & Close</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: CORTE DE CAJA (Z-REPORT SHIFT SETTLEMENT) */}
        {activeTab === 'corte' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00ff66', background: 'rgba(0, 255, 102, 0.15)', padding: '4px 12px', borderRadius: '999px', border: '1px solid rgba(0, 255, 102, 0.3)', display: 'inline-block', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Shift Cashout Operations • {session.role} LEVEL AUTHORITY
              </span>
              <h1 style={{ fontSize: '2.8rem', marginBottom: '10px' }}>El Corte de Caja (Z-Report)</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '660px', margin: '0 auto' }}>
                Execute only the cashout operations allowed by your authenticated role and subscription plan.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '36px' }}>
              <div className="glass-panel" style={{ borderTop: '3px solid #ff6b00', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: can('GENERAL_CASHOUT') ? 1 : 0.5 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>General Cashout ("Corte General")</h3>
                    {!can('GENERAL_CASHOUT') && <span style={{ fontSize: '0.75rem', color: '#ff4d4d', fontWeight: 800 }}>🔒 ENTERPRISE ADMIN ONLY</span>}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '22px', lineHeight: 1.5 }}>
                    Closes out the entire truck or bar shift across all active operators. Locks active cash drawers and compiles full payment method analytics.
                  </p>
                </div>
                <button 
                  onClick={() => executeCorte('GENERAL')}
                  disabled={!can('GENERAL_CASHOUT')}
                  className="btn-pos" 
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', background: can('GENERAL_CASHOUT') ? 'var(--primary-pos)' : '#555', cursor: can('GENERAL_CASHOUT') ? 'pointer' : 'not-allowed' }}
                >
                  {can('GENERAL_CASHOUT') ? 'Execute General Corte →' : '🔒 Enterprise Admin Required'}
                </button>
              </div>

              <div className="glass-panel" style={{ borderTop: '3px solid #00b368', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '10px', color: '#fff' }}>
                    {operatingMode === 'SOLO_FOOD_TRUCK' ? 'Helper Station Reconcile' : 'Individual Waiter Cashout'}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '22px', lineHeight: 1.5 }}>
                    {operatingMode === 'SOLO_FOOD_TRUCK'
                      ? 'Reconciles sales processed by weekend helpers (Marco & Sofia) without interrupting the owner\'s ongoing register line.'
                      : 'Tailored for servers or bartenders concluding their shift early. Reconciles only their assigned PIN accounts.'}
                  </p>
                </div>
                <button onClick={() => executeCorte('INDIVIDUAL')} disabled={!can('INDIVIDUAL_CASHOUT')} className="btn-pos" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', backgroundColor: '#00b368', color: '#000' }}>
                  Reconcile {session.role === 'CASHIER' ? 'My Personal Drawer' : 'Helper Station'} →
                </button>
              </div>
            </div>

            {/* Generated Z-Report Ticket */}
            {corteResult && (
              <div className="glass-panel" style={{ border: '2px solid #00b368', background: 'rgba(10,23,17,0.85)', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ color: '#00ff66', fontWeight: 800, fontSize: '0.85rem', display: 'block' }}>✔ OFFICIAL Z-REPORT TICKET GENERATED (APPWRITE CLOUD STORED)</span>
                    <h3 style={{ fontSize: '1.6rem', color: '#fff' }}>{corteResult.type}</h3>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{corteResult.timestamp}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase' }}>Orders Settled</span>
                    <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{corteResult.total_orders} Tickets</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase' }}>Gross Revenue</span>
                    <strong style={{ fontSize: '1.5rem', color: '#00ff66' }}>{corteResult.gross_revenue}</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', textTransform: 'uppercase' }}>Tips & Gratuities Pool</span>
                    <strong style={{ fontSize: '1.3rem', color: '#ffb800' }}>{corteResult.waiter_tips_pool}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.9rem', color: '#ccc', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                  <span>Cash Collector Drawer: <strong>{corteResult.cash_collected}</strong></span>
                  <span>External Card Settlements: <strong>{corteResult.card_settled}</strong></span>
                  <span style={{ color: '#00ff66', fontWeight: 700 }}>● {corteResult.status}</span>
                </div>
              </div>
            )}
            {recentReports.length > 0 && (
              <div style={{ marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Recent durable reports stored: <strong>{recentReports.length}</strong>
              </div>
            )}

          </div>
        )}
        {/* VIEW 5: SETTINGS & STORAGE CAPACITY */}
        {activeTab === 'settings' && (
          <div>
            {session.role !== 'ADMIN' ? (
              <SecurityShield requiredRole="ADMIN" currentRole={session.role} />
            ) : (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h1 style={{ fontSize: '2.4rem', marginBottom: '6px' }}>Plan & Capacity</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    Plan limits are assigned by the MerchantGo backend and cannot be bypassed from a client.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  
                  <div className="glass-panel">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '16px', color: '#fff' }}>
                      <Database size={20} color="var(--primary-pos)" /> Active Subscription
                    </h3>
                    <strong style={{ color: '#fff', fontSize: '1.5rem' }}>{session.plan}</strong>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Appwrite validates identity; your VPS SQLite database stores MerchantGo data.
                    </p>
                  </div>

                  <div className="glass-panel">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '12px', color: '#fff' }}>
                      <Cloud size={20} color="#38bdf8" /> Portable Catalog Snapshot
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
                      Export menu items, branches, and staff display profiles as JSON. Save the file in Dropbox, Google Drive, or OneDrive yourself. Orders, cashouts, credentials, and telemetry are never included.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn-pos" onClick={downloadSnapshot} disabled={snapshotBusy}>
                        <Download size={16} /> Export snapshot
                      </button>
                      <button className="btn-secondary" onClick={() => snapshotInput.current?.click()} disabled={snapshotBusy}>
                        <Upload size={16} /> Validate & import
                      </button>
                      <input
                        ref={snapshotInput}
                        type="file"
                        accept="application/json,.json"
                        onChange={restoreSnapshot}
                        style={{ display: 'none' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#ffb800', marginTop: '14px' }}>
                      Import replaces these catalog records only after a validation preview and confirmation.
                    </p>
                    {session.plan === 'FREE' && (
                      <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '18px', paddingTop: '18px' }}>
                        <strong style={{ display: 'block', color: googleDrive.connected ? '#00ff66' : '#fff', marginBottom: '8px' }}>
                          Google Drive: {googleDrive.connected ? 'Connected' : 'Not connected'}
                        </strong>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                          Free catalog data stays on this device. Connect Drive to move the same catalog between web, mobile, and desktop clients.
                        </p>
                        {!googleDrive.connected ? (
                          <button className="btn-pos" onClick={connectGoogleDrive} disabled={snapshotBusy}>
                            <Cloud size={16} /> Connect Google Drive
                          </button>
                        ) : (
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button className="btn-pos" onClick={() => syncGoogleDrive('push')} disabled={snapshotBusy}>
                              <Upload size={16} /> Sync this device
                            </button>
                            <button className="btn-secondary" onClick={() => syncGoogleDrive('pull')} disabled={snapshotBusy}>
                              <Download size={16} /> Restore from Drive
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '16px', color: '#fff' }}>
                      <Activity size={20} color="var(--primary-pos)" /> Capacity Quotas
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Menu Capacity Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: '#fff' }}>Registered Menu Items</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary-pos)' }}>{menuItems.length} / {limits.menuItems}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (menuItems.length / limits.menuItems) * 100)}%`, height: '100%', background: 'var(--primary-pos)', transition: 'width 0.3s ease' }}></div>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Menu items mapped to raw ingredients.</p>
                        </div>

                        {/* Staff Capacity Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: '#fff' }}>Active Staff / Users</span>
                            <span style={{ fontWeight: 600, color: '#00b368' }}>{staffCount} / {limits.staff}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (staffCount / limits.staff) * 100)}%`, height: '100%', background: '#00b368', transition: 'width 0.3s ease' }}></div>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Waitstaff and cashiers registered under this tenant.</p>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <span style={{ color: '#fff' }}>Active Branches</span>
                            <span style={{ fontWeight: 600, color: '#38bdf8' }}>{branchCount} / {limits.branches}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (branchCount / limits.branches) * 100)}%`, height: '100%', background: '#38bdf8', transition: 'width 0.3s ease' }}></div>
                          </div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Branches available for this tenant.</p>
                        </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: '#070709' }}>
        © 2026 MerchantGo POS & Cashout Suite • Powered by Comet Pocket Machinery • Appwrite identity + VPS data
      </footer>
    </div>
  );
}
