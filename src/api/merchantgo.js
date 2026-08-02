const API_BASE = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://api.merchantgo.store');
const SESSION_KEY = 'merchantgo.session';
const LOCAL_CATALOG_PREFIX = 'merchantgo.catalog.';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/v1${path}`, options);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message || `HTTP ${response.status}`);
  return json.data ?? json;
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function registerAppwriteUser(email, password, name, mode) {
  return saveSession(await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, mode }),
  }));
}

export async function loginAppwriteUser(email, password) {
  return saveSession(await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }));
}

export async function loginMerchantGoPin(pin) {
  return saveSession(await request('/auth/pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  }));
}

export function checkAppwriteSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function logoutAppwriteSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function merchantGoRequest(path, options = {}) {
  const session = checkAppwriteSession();
  return request(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...options.headers,
    },
  });
}

function localCatalogKey(session) {
  return `${LOCAL_CATALOG_PREFIX}${session.tenant_id || session.id}`;
}

function defaultLocalCatalog(session) {
  return {
    schema: 'merchantgo.catalog',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      menuItems: [],
      branches: [{ id: session.branch_id, name: session.branch_id }],
      staffProfiles: [{
        id: session.id,
        branchId: session.branch_id,
        name: session.name,
        role: session.role,
      }],
    },
  };
}

function validateLocalCatalog(snapshot, session) {
  if (
    !snapshot || snapshot.schema !== 'merchantgo.catalog' || snapshot.version !== 1 ||
    !snapshot.data || !Array.isArray(snapshot.data.menuItems) ||
    !Array.isArray(snapshot.data.branches) || !Array.isArray(snapshot.data.staffProfiles)
  ) {
    throw new Error('Unsupported MerchantGo snapshot');
  }
  const limits = session.entitlements?.limits || { menuItems: 25, branches: 1, staff: 1 };
  if (
    snapshot.data.menuItems.length > limits.menuItems ||
    snapshot.data.branches.length > limits.branches ||
    snapshot.data.staffProfiles.length > limits.staff
  ) {
    throw new Error('Snapshot exceeds the current plan limits');
  }
  return {
    ...snapshot,
    exportedAt: new Date().toISOString(),
  };
}

function readLocalCatalog() {
  const session = checkAppwriteSession();
  if (!session) throw new Error('Authentication required');
  try {
    const stored = JSON.parse(localStorage.getItem(localCatalogKey(session)));
    return stored ? validateLocalCatalog(stored, session) : defaultLocalCatalog(session);
  } catch {
    return defaultLocalCatalog(session);
  }
}

function saveLocalCatalog(snapshot) {
  const session = checkAppwriteSession();
  if (!session) throw new Error('Authentication required');
  const validated = validateLocalCatalog(snapshot, session);
  localStorage.setItem(localCatalogKey(session), JSON.stringify(validated));
  return validated;
}

function usesLocalCatalog() {
  return checkAppwriteSession()?.plan === 'FREE';
}

export function listTenantMenuItems() {
  if (usesLocalCatalog()) {
    return Promise.resolve({
      items: readLocalCatalog().data.menuItems.map(item => ({
        $id: item.id,
        branch_id: item.branchId,
        name: item.name,
        category: item.category,
        price: item.price,
        notes: item.notes,
        active: item.active,
      })),
    });
  }
  return merchantGoRequest('/tenant/menu-items');
}

export function createTenantMenuItem(payload) {
  if (usesLocalCatalog()) {
    const snapshot = readLocalCatalog();
    const limit = checkAppwriteSession().entitlements?.limits?.menuItems || 25;
    if (snapshot.data.menuItems.length >= limit) {
      return Promise.reject(new Error('Menu item limit reached for Free plan'));
    }
    const item = {
      id: globalThis.crypto.randomUUID(),
      branchId: checkAppwriteSession().branch_id,
      name: String(payload.name).slice(0, 120),
      category: String(payload.category).slice(0, 80),
      price: Number(payload.price),
      notes: String(payload.notes || '').slice(0, 320),
      active: payload.active !== false,
    };
    snapshot.data.menuItems.push(item);
    saveLocalCatalog(snapshot);
    return Promise.resolve({ item: { ...item, $id: item.id } });
  }
  return merchantGoRequest('/tenant/menu-items', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTenantMenuItem(id, payload) {
  if (usesLocalCatalog()) {
    const snapshot = readLocalCatalog();
    const index = snapshot.data.menuItems.findIndex(item => item.id === id);
    if (index < 0) return Promise.reject(new Error('Menu item not found'));
    snapshot.data.menuItems[index] = { ...snapshot.data.menuItems[index], ...payload };
    saveLocalCatalog(snapshot);
    return Promise.resolve({ item: { ...snapshot.data.menuItems[index], $id: id } });
  }
  return merchantGoRequest(`/tenant/menu-items/${id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listTenantStaff() {
  if (usesLocalCatalog()) return Promise.resolve({ staff: readLocalCatalog().data.staffProfiles });
  return merchantGoRequest('/tenant/staff');
}

export function createTenantStaff(payload) {
  if (usesLocalCatalog()) {
    const snapshot = readLocalCatalog();
    const limit = checkAppwriteSession().entitlements?.limits?.staff || 1;
    if (snapshot.data.staffProfiles.length >= limit) {
      return Promise.reject(new Error('Staff limit reached for your plan'));
    }
    const member = {
      id: globalThis.crypto.randomUUID(),
      branchId: checkAppwriteSession().branch_id,
      name: String(payload.name).slice(0, 120),
      role: payload.role || 'SERVER',
      active: payload.active !== false,
    };
    snapshot.data.staffProfiles.push(member);
    saveLocalCatalog(snapshot);
    return Promise.resolve({ member: { ...member, $id: member.id } });
  }
  return merchantGoRequest('/tenant/staff', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTenantStaff(id, payload) {
  if (usesLocalCatalog()) {
    const snapshot = readLocalCatalog();
    const index = snapshot.data.staffProfiles.findIndex(staff => staff.id === id);
    if (index < 0) return Promise.reject(new Error('Staff member not found'));
    snapshot.data.staffProfiles[index] = { ...snapshot.data.staffProfiles[index], ...payload };
    saveLocalCatalog(snapshot);
    return Promise.resolve({ member: { ...snapshot.data.staffProfiles[index], $id: id } });
  }
  return merchantGoRequest(`/tenant/staff/${id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listTenantBranches() {
  if (usesLocalCatalog()) return Promise.resolve({ branches: readLocalCatalog().data.branches });
  return merchantGoRequest('/tenant/branches');
}

export function createTenantBranch(payload) {
  if (usesLocalCatalog()) {
    const snapshot = readLocalCatalog();
    const limit = checkAppwriteSession().entitlements?.limits?.branches || 1;
    if (snapshot.data.branches.length >= limit) {
      return Promise.reject(new Error('Branch limit reached for your plan'));
    }
    const branch = {
      id: globalThis.crypto.randomUUID(),
      name: String(payload.name).slice(0, 120),
      active: payload.active !== false,
    };
    snapshot.data.branches.push(branch);
    saveLocalCatalog(snapshot);
    return Promise.resolve({ branch: { ...branch, $id: branch.id } });
  }
  return merchantGoRequest('/tenant/branches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTenantBranch(id, payload) {
  if (usesLocalCatalog()) {
    const snapshot = readLocalCatalog();
    const index = snapshot.data.branches.findIndex(branch => branch.id === id);
    if (index < 0) return Promise.reject(new Error('Branch not found'));
    snapshot.data.branches[index] = { ...snapshot.data.branches[index], ...payload };
    saveLocalCatalog(snapshot);
    return Promise.resolve({ branch: { ...snapshot.data.branches[index], $id: id } });
  }
  return merchantGoRequest(`/tenant/branches/${id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listTenantReports() {
  return merchantGoRequest('/tenant/reports');
}

export function exportTenantSnapshot() {
  if (usesLocalCatalog()) return Promise.resolve({ snapshot: readLocalCatalog() });
  return merchantGoRequest('/tenant/snapshot');
}

export function importTenantSnapshot(snapshot, dryRun) {
  if (usesLocalCatalog()) {
    const validated = validateLocalCatalog(snapshot, checkAppwriteSession());
    const counts = {
      menuItems: validated.data.menuItems.length,
      branches: validated.data.branches.length,
      staffProfiles: validated.data.staffProfiles.length,
    };
    if (!dryRun) saveLocalCatalog(validated);
    return Promise.resolve({
      dryRun,
      counts,
      message: dryRun
        ? 'Snapshot is valid. Import will replace the local Free catalog.'
        : 'Local Free catalog imported.',
    });
  }
  return merchantGoRequest('/tenant/snapshot/import', {
    method: 'POST',
    body: JSON.stringify({ snapshot, dryRun }),
  });
}

export function googleDriveStatus() {
  return merchantGoRequest('/cloud/google/status');
}

export async function connectGoogleDrive() {
  const { url } = await merchantGoRequest('/cloud/google/authorize');
  window.location.assign(url);
}

export async function pushCatalogToGoogleDrive() {
  const { snapshot } = await exportTenantSnapshot();
  return merchantGoRequest('/cloud/google/push', {
    method: 'POST',
    body: JSON.stringify({ snapshot }),
  });
}

export async function pullCatalogFromGoogleDrive() {
  const { snapshot } = await merchantGoRequest('/cloud/google/pull', { method: 'POST' });
  saveLocalCatalog(snapshot);
  return snapshot;
}
