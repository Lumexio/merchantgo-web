import { clearSession, getSelectedTenant, getSession, setSession } from '../store/auth.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://api.merchantgo.store');
const SNAPSHOT_SCHEMA = 'merchantgo.catalog';
const SNAPSHOT_VERSION = 2;
const LEGACY_SNAPSHOT_VERSION = 1;
const LOCAL_CATALOG_PREFIX = 'merchantgo.catalog.';
const LOCAL_DEVICE_PREFIX = 'merchantgo.device.';
const LOCAL_ID_COUNTER_PREFIX = 'merchantgo.ids.';
const LEGACY_DEVICE_ID = 'legacy-import';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api/v1${path}`, options);
  const json = await response.json().catch(() => ({}));
  // ponytail: Automatically handle token expiry or manual invalidation edge cases
  if (response.status === 401 && !path.startsWith('/auth/')) {
    clearSession();
    window.location.href = '/login';
    return Promise.reject(new Error('Session expired. Please log in again.'));
  }
  if (!response.ok) throw new Error(json.message || `HTTP ${response.status}`);
  return json.data ?? json;
}

function saveSession(session) {
  return setSession(session);
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
  return getSession();
}

export function logoutAppwriteSession() {
  clearSession();
}

export function merchantGoRequest(path, options = {}) {
  const session = checkAppwriteSession();
  const selectedTenant = getSelectedTenant(session);
  return request(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
      ...(selectedTenant?.tenant_id ? { 'X-MerchantGo-Tenant': selectedTenant.tenant_id } : {}),
      ...options.headers,
    },
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function hashHex(input) {
  let left = 2166136261;
  let right = 16777619;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    left ^= code;
    left = Math.imul(left, 16777619);
    right ^= code;
    right = Math.imul(right, 2246822519);
  }
  return `${(left >>> 0).toString(16).padStart(8, '0')}${(right >>> 0).toString(16).padStart(8, '0')}`;
}

function createRevision(kind, payload) {
  return hashHex(`${kind}:${stableStringify(payload)}`);
}

function isoDate(value, fallback = new Date().toISOString()) {
  if (typeof value !== 'string') return fallback;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : fallback;
}

function activeTenantId(session) {
  const selectedTenant = getSelectedTenant(session);
  return selectedTenant?.tenant_id || session?.tenant_id || session?.id;
}

function activeBranchId(session) {
  const selectedTenant = getSelectedTenant(session);
  return selectedTenant?.branch_id || session?.branch_id || 'branch_root';
}

function localCatalogKey(session) {
  return `${LOCAL_CATALOG_PREFIX}${activeTenantId(session)}`;
}

function localDeviceKey(session) {
  return `${LOCAL_DEVICE_PREFIX}${activeTenantId(session)}`;
}

function localCounterKey(session, kind) {
  return `${LOCAL_ID_COUNTER_PREFIX}${activeTenantId(session)}.${kind}`;
}

function getLocalDeviceId(session = checkAppwriteSession()) {
  if (!session) throw new Error('Authentication required');
  const key = localDeviceKey(session);
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = `browser:${activeTenantId(session)}:${globalThis.crypto.randomUUID()}`;
  localStorage.setItem(key, next);
  return next;
}

function nextLocalId(kind, session = checkAppwriteSession()) {
  if (!session) throw new Error('Authentication required');
  const key = localCounterKey(session, kind);
  const next = Number(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, String(next));
  return `${kind}_${hashHex(String(activeTenantId(session))).slice(0, 8)}_${String(next).padStart(4, '0')}`;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMutableBranch(branch, fallback = {}) {
  const id = String(branch?.id || fallback.id || nextLocalId('branch'));
  const payload = {
    id,
    name: String(branch?.name || fallback.name || id).slice(0, 120),
    active: branch?.active !== false,
  };
  return {
    ...payload,
    deviceId: String(branch?.deviceId || fallback.deviceId || LEGACY_DEVICE_ID),
    updatedAt: isoDate(branch?.updatedAt, fallback.updatedAt || new Date(0).toISOString()),
    revision: String(branch?.revision || fallback.revision || createRevision('branch', payload)),
  };
}

function normalizeMutableMenuItem(item, fallback = {}) {
  const id = String(item?.id || fallback.id || nextLocalId('menu'));
  const payload = {
    id,
    branchId: String(item?.branchId || fallback.branchId),
    name: String(item?.name || fallback.name || '').slice(0, 120),
    category: String(item?.category || fallback.category || '').slice(0, 80),
    price: Number(item?.price ?? fallback.price ?? 0),
    notes: String(item?.notes || fallback.notes || '').slice(0, 320),
    active: item?.active !== false,
  };
  return {
    ...payload,
    deviceId: String(item?.deviceId || fallback.deviceId || LEGACY_DEVICE_ID),
    updatedAt: isoDate(item?.updatedAt, fallback.updatedAt || new Date(0).toISOString()),
    revision: String(item?.revision || fallback.revision || createRevision('menuItem', payload)),
  };
}

function normalizeMutableStaff(staff, fallback = {}) {
  const id = String(staff?.id || fallback.id || nextLocalId('staff'));
  const payload = {
    id,
    branchId: String(staff?.branchId || fallback.branchId),
    name: String(staff?.name || fallback.name || '').slice(0, 120),
    role: String(staff?.role || fallback.role || 'SERVER'),
    active: staff?.active !== false,
  };
  return {
    ...payload,
    deviceId: String(staff?.deviceId || fallback.deviceId || LEGACY_DEVICE_ID),
    updatedAt: isoDate(staff?.updatedAt, fallback.updatedAt || new Date(0).toISOString()),
    revision: String(staff?.revision || fallback.revision || createRevision('staffProfile', payload)),
  };
}

function normalizeClosedShiftOrder(order) {
  const payload = {
    id: String(order?.id || ''),
    branchId: String(order?.branchId || ''),
    table: String(order?.table || '').slice(0, 80),
    waiter: String(order?.waiter || '').slice(0, 120),
    userId: String(order?.userId || ''),
    total: Number(order?.total || 0),
    items: ensureArray(order?.items).map(item => String(item).slice(0, 160)),
    paymentMethod: order?.paymentMethod === 'CARD' ? 'CARD' : 'CASH',
    settledAt: isoDate(order?.settledAt, new Date(0).toISOString()),
    cashedOutAt: isoDate(order?.cashedOutAt, new Date(0).toISOString()),
  };
  return {
    ...payload,
    deviceId: String(order?.deviceId || LEGACY_DEVICE_ID),
    updatedAt: isoDate(order?.updatedAt, payload.cashedOutAt),
    revision: String(order?.revision || createRevision('closedShiftOrder', payload)),
  };
}

function normalizeClosedShift(shift) {
  const payload = {
    id: String(shift?.id || ''),
    branchId: String(shift?.branchId || ''),
    type: shift?.type === 'GENERAL' ? 'GENERAL' : 'INDIVIDUAL',
    closedAt: isoDate(shift?.closedAt, new Date(0).toISOString()),
    generatedBy: String(shift?.generatedBy || ''),
    orderIds: ensureArray(shift?.orderIds).map(item => String(item)),
    zReportId: String(shift?.zReportId || ''),
  };
  return {
    ...payload,
    deviceId: String(shift?.deviceId || LEGACY_DEVICE_ID),
    updatedAt: isoDate(shift?.updatedAt, payload.closedAt),
    revision: String(shift?.revision || createRevision('closedShift', payload)),
  };
}

function normalizeZReport(report) {
  const payload = {
    id: String(report?.id || ''),
    branchId: String(report?.branchId || ''),
    type: report?.type === 'GENERAL' ? 'GENERAL' : 'INDIVIDUAL',
    generatedAt: isoDate(report?.generatedAt, new Date(0).toISOString()),
    generatedBy: String(report?.generatedBy || ''),
    totalOrdersClosed: Number(report?.totalOrdersClosed || 0),
    grossRevenue: Number(report?.grossRevenue || 0),
    paymentBreakdown: {
      cash: Number(report?.paymentBreakdown?.cash || 0),
      card: Number(report?.paymentBreakdown?.card || 0),
    },
    waiterTipsPool: Number(report?.waiterTipsPool || 0),
    status: String(report?.status || 'SHIFT_CLOSED_SUCCESS'),
    closedShiftId: String(report?.closedShiftId || ''),
  };
  return {
    ...payload,
    deviceId: String(report?.deviceId || LEGACY_DEVICE_ID),
    updatedAt: isoDate(report?.updatedAt, payload.generatedAt),
    revision: String(report?.revision || createRevision('zReport', payload)),
  };
}

function normalizeSnapshot(snapshot, session = checkAppwriteSession()) {
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Unsupported MerchantGo snapshot');
  if (snapshot.schema !== SNAPSHOT_SCHEMA) throw new Error('Unsupported MerchantGo snapshot');
  if (snapshot.version === LEGACY_SNAPSHOT_VERSION) {
    const exportedAt = isoDate(snapshot.exportedAt);
    const branches = ensureArray(snapshot?.data?.branches).map(branch => normalizeMutableBranch(branch, {
      deviceId: LEGACY_DEVICE_ID,
      updatedAt: exportedAt,
    }));
    const branchIds = new Set(branches.map(branch => branch.id));
    const menuItems = ensureArray(snapshot?.data?.menuItems).map(item => normalizeMutableMenuItem(item, {
      deviceId: LEGACY_DEVICE_ID,
      updatedAt: exportedAt,
    }));
    const staffProfiles = ensureArray(snapshot?.data?.staffProfiles).map(staff => normalizeMutableStaff(staff, {
      deviceId: LEGACY_DEVICE_ID,
      updatedAt: exportedAt,
      active: true,
    }));
    assertBranchReferences(menuItems, 'branchId', 'Menu item', branchIds);
    assertBranchReferences(staffProfiles, 'branchId', 'Staff profile', branchIds);
    return validateLocalSnapshotLimits({
      schema: SNAPSHOT_SCHEMA,
      version: SNAPSHOT_VERSION,
      deviceId: LEGACY_DEVICE_ID,
      exportedAt,
      data: {
        menuItems,
        branches,
        staffProfiles,
        closedShiftOrders: [],
        closedShifts: [],
        zReports: [],
      },
    }, session);
  }
  if (snapshot.version !== SNAPSHOT_VERSION) throw new Error('Unsupported MerchantGo snapshot');
  const exportedAt = isoDate(snapshot.exportedAt);
  const branches = ensureArray(snapshot?.data?.branches).map(branch => normalizeMutableBranch(branch));
  const branchIds = new Set(branches.map(branch => branch.id));
  const menuItems = ensureArray(snapshot?.data?.menuItems).map(item => normalizeMutableMenuItem(item));
  const staffProfiles = ensureArray(snapshot?.data?.staffProfiles).map(staff => normalizeMutableStaff(staff));
  const closedShiftOrders = ensureArray(snapshot?.data?.closedShiftOrders).map(normalizeClosedShiftOrder);
  const closedShifts = ensureArray(snapshot?.data?.closedShifts).map(normalizeClosedShift);
  const zReports = ensureArray(snapshot?.data?.zReports).map(normalizeZReport);
  assertBranchReferences(menuItems, 'branchId', 'Menu item', branchIds);
  assertBranchReferences(staffProfiles, 'branchId', 'Staff profile', branchIds);
  assertBranchReferences(closedShiftOrders, 'branchId', 'Closed-shift order', branchIds);
  assertBranchReferences(closedShifts, 'branchId', 'Closed shift', branchIds);
  assertBranchReferences(zReports, 'branchId', 'Z-report', branchIds);
  return validateLocalSnapshotLimits({
    schema: SNAPSHOT_SCHEMA,
    version: SNAPSHOT_VERSION,
    deviceId: String(snapshot.deviceId || getLocalDeviceId(session)),
    exportedAt,
    data: {
      menuItems,
      branches,
      staffProfiles,
      closedShiftOrders,
      closedShifts,
      zReports,
    },
  }, session);
}

function validateLocalSnapshotLimits(snapshot, session = checkAppwriteSession()) {
  if (!session) throw new Error('Authentication required');
  const limits = session.entitlements?.limits || { menuItems: 25, branches: 1, staff: 1 };
  if (snapshot.data.menuItems.length > limits.menuItems) throw new Error('Snapshot exceeds the current plan limits');
  if (snapshot.data.branches.length > limits.branches) throw new Error('Snapshot exceeds the current plan limits');
  if (snapshot.data.staffProfiles.length > limits.staff) throw new Error('Snapshot exceeds the current plan limits');
  return snapshot;
}

function assertBranchReferences(records, field, label, branchIds) {
  for (const record of records) {
    if (!branchIds.has(record[field])) throw new Error(`${label} ${record.id} references a missing branch`);
  }
}

function touchRecord(kind, record, session = checkAppwriteSession()) {
  const deviceId = getLocalDeviceId(session);
  const updatedAt = new Date().toISOString();
  const payload = { ...record };
  delete payload.deviceId;
  delete payload.updatedAt;
  delete payload.revision;
  return {
    ...payload,
    deviceId,
    updatedAt,
    revision: createRevision(kind, payload),
  };
}

function defaultLocalCatalog(session = checkAppwriteSession()) {
  if (!session) throw new Error('Authentication required');
  const branchId = activeBranchId(session);
  const base = {
    schema: SNAPSHOT_SCHEMA,
    version: SNAPSHOT_VERSION,
    deviceId: getLocalDeviceId(session),
    exportedAt: new Date().toISOString(),
    data: {
      menuItems: [],
      branches: [touchRecord('branch', { id: branchId, name: branchId, active: true }, session)],
      staffProfiles: [touchRecord('staffProfile', {
        id: session.id,
        branchId,
        name: session.name,
        role: session.role,
        active: true,
      }, session)],
      closedShiftOrders: [],
      closedShifts: [],
      zReports: [],
    },
  };
  return validateLocalSnapshotLimits(base, session);
}

function readLocalCatalog() {
  const session = checkAppwriteSession();
  if (!session) throw new Error('Authentication required');
  try {
    const stored = JSON.parse(localStorage.getItem(localCatalogKey(session)));
    return stored ? normalizeSnapshot(stored, session) : defaultLocalCatalog(session);
  } catch {
    return defaultLocalCatalog(session);
  }
}

function saveLocalCatalog(snapshot) {
  const session = checkAppwriteSession();
  if (!session) throw new Error('Authentication required');
  const normalized = validateLocalSnapshotLimits(normalizeSnapshot(snapshot, session), session);
  localStorage.setItem(localCatalogKey(session), JSON.stringify(normalized));
  return normalized;
}

function usesLocalCatalog() {
  return checkAppwriteSession()?.plan === 'FREE';
}

function mergeBranches(localBranches, remoteBranches) {
  const byId = new Map(localBranches.map(branch => [branch.id, branch]));
  for (const branch of remoteBranches) {
    if (!byId.has(branch.id)) byId.set(branch.id, branch);
  }
  return [...byId.values()];
}

function blankMergePreview(dryRun, current) {
  return {
    dryRun,
    applied: false,
    message: '',
    collections: {
      menuItems: { create: 0, update: 0, append: 0, unchanged: 0, duplicate: 0, conflicts: 0 },
      branches: { create: 0, update: 0, append: 0, unchanged: 0, duplicate: 0, conflicts: 0 },
      staffProfiles: { create: 0, update: 0, append: 0, unchanged: 0, duplicate: 0, conflicts: 0 },
      closedShiftOrders: { create: 0, update: 0, append: 0, unchanged: 0, duplicate: 0, conflicts: 0 },
      closedShifts: { create: 0, update: 0, append: 0, unchanged: 0, duplicate: 0, conflicts: 0 },
      zReports: { create: 0, update: 0, append: 0, unchanged: 0, duplicate: 0, conflicts: 0 },
    },
    counts: {
      menuItems: current.data.menuItems.length,
      branches: current.data.branches.length,
      staffProfiles: current.data.staffProfiles.length,
      closedShiftOrders: current.data.closedShiftOrders.length,
      closedShifts: current.data.closedShifts.length,
      zReports: current.data.zReports.length,
    },
    conflicts: [],
  };
}

function equivalentSnapshotRecord(left, right) {
  const clean = (value) => {
    const next = { ...value };
    delete next.deviceId;
    delete next.updatedAt;
    delete next.revision;
    return next;
  };
  return stableStringify(clean(left)) === stableStringify(clean(right));
}

function previewLocalSnapshotMerge(snapshot, resolutions = {}) {
  const current = readLocalCatalog();
  const preview = blankMergePreview(true, current);

  const mergeMutable = (collection, currentRecords, incomingRecords, keyOf, labelOf) => {
    const currentMap = new Map(currentRecords.map(record => [keyOf(record), record]));
    for (const incoming of incomingRecords) {
      const key = keyOf(incoming);
      const resolutionKey = `${collection}:${key}`;
      const currentRecord = currentMap.get(key);
      if (!currentRecord) {
        preview.collections[collection].create += 1;
        continue;
      }
      if (currentRecord.revision === incoming.revision || equivalentSnapshotRecord(currentRecord, incoming)) {
        preview.collections[collection].unchanged += 1;
        continue;
      }
      if (resolutions[resolutionKey] === 'use_snapshot') {
        preview.collections[collection].update += 1;
        continue;
      }
      if (resolutions[resolutionKey] === 'keep_current') {
        preview.collections[collection].unchanged += 1;
        continue;
      }
      preview.collections[collection].conflicts += 1;
      preview.conflicts.push({
        key: resolutionKey,
        collection,
        id: incoming.id,
        label: labelOf(incoming),
        currentRevision: currentRecord.revision,
        incomingRevision: incoming.revision,
        allowedResolutions: ['keep_current', 'use_snapshot'],
      });
    }
  };

  mergeMutable('branches', current.data.branches, snapshot.data.branches, record => record.id, record => record.name);
  mergeMutable('menuItems', current.data.menuItems, snapshot.data.menuItems, record => `${record.branchId}:${record.id}`, record => record.name);
  mergeMutable('staffProfiles', current.data.staffProfiles, snapshot.data.staffProfiles, record => record.id, record => record.name);

  preview.counts = {
    ...preview.counts,
    branches: current.data.branches.length + preview.collections.branches.create,
    menuItems: current.data.menuItems.length + preview.collections.menuItems.create,
    staffProfiles: current.data.staffProfiles.length + preview.collections.staffProfiles.create,
  };
  preview.message = preview.conflicts.length > 0
    ? 'Snapshot preview found conflicts that require explicit resolution.'
    : 'Snapshot preview generated.';
  return preview;
}

function commitLocalSnapshotMerge(snapshot, resolutions = {}) {
  const current = readLocalCatalog();
  const preview = previewLocalSnapshotMerge(snapshot, resolutions);
  if (preview.conflicts.length > 0) throw new Error('Snapshot merge has unresolved conflicts');

  const upsertCollection = (collection, currentRecords, incomingRecords, keyOf) => {
    const byKey = new Map(currentRecords.map(record => [keyOf(record), record]));
    for (const incoming of incomingRecords) {
      const key = keyOf(incoming);
      const currentRecord = byKey.get(key);
      if (!currentRecord) {
        byKey.set(key, incoming);
        continue;
      }
      if (currentRecord.revision === incoming.revision || equivalentSnapshotRecord(currentRecord, incoming)) continue;
      if (resolutions[`${collection}:${key}`] === 'use_snapshot') byKey.set(key, incoming);
    }
    return [...byKey.values()];
  };

  const next = {
    ...current,
    exportedAt: new Date().toISOString(),
    data: {
      ...current.data,
      branches: upsertCollection('branches', current.data.branches, snapshot.data.branches, record => record.id),
      menuItems: upsertCollection('menuItems', current.data.menuItems, snapshot.data.menuItems, record => `${record.branchId}:${record.id}`),
      staffProfiles: upsertCollection('staffProfiles', current.data.staffProfiles, snapshot.data.staffProfiles, record => record.id),
      closedShiftOrders: current.data.closedShiftOrders,
      closedShifts: current.data.closedShifts,
      zReports: current.data.zReports,
    },
  };

  saveLocalCatalog(next);
  return {
    ...preview,
    dryRun: false,
    applied: true,
    message: 'Snapshot merged successfully.',
    counts: {
      ...preview.counts,
      closedShiftOrders: next.data.closedShiftOrders.length,
      closedShifts: next.data.closedShifts.length,
      zReports: next.data.zReports.length,
    },
  };
}

function mapBackendPreview(preview) {
  return preview || blankMergePreview(true, readLocalCatalog());
}

function combineMergePreviews(localPreview, backendPreview) {
  const combined = {
    ...backendPreview,
    dryRun: localPreview.dryRun && backendPreview.dryRun,
    applied: localPreview.applied && backendPreview.applied,
    collections: {
      ...backendPreview.collections,
      branches: localPreview.collections.branches,
      menuItems: localPreview.collections.menuItems,
      staffProfiles: localPreview.collections.staffProfiles,
    },
    counts: {
      ...backendPreview.counts,
      branches: localPreview.counts.branches,
      menuItems: localPreview.counts.menuItems,
      staffProfiles: localPreview.counts.staffProfiles,
    },
    conflicts: [...localPreview.conflicts, ...(backendPreview.conflicts || [])],
  };
  combined.message = combined.conflicts.length > 0
    ? 'Snapshot preview found conflicts that require explicit resolution.'
    : combined.applied
      ? 'Snapshot merged successfully.'
      : 'Snapshot preview generated.';
  return combined;
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
    const session = checkAppwriteSession();
    const snapshot = readLocalCatalog();
    const limit = session?.entitlements?.limits?.menuItems || 25;
    if (snapshot.data.menuItems.length >= limit) return Promise.reject(new Error('Menu item limit reached for Free plan'));
    const item = touchRecord('menuItem', {
      id: nextLocalId('menu', session),
      branchId: activeBranchId(session),
      name: String(payload.name).slice(0, 120),
      category: String(payload.category).slice(0, 80),
      price: Number(payload.price),
      notes: String(payload.notes || '').slice(0, 320),
      active: payload.active !== false,
    }, session);
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
    const session = checkAppwriteSession();
    const snapshot = readLocalCatalog();
    const index = snapshot.data.menuItems.findIndex(item => item.id === id);
    if (index < 0) return Promise.reject(new Error('Menu item not found'));
    snapshot.data.menuItems[index] = touchRecord('menuItem', {
      ...snapshot.data.menuItems[index],
      ...payload,
    }, session);
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
    const session = checkAppwriteSession();
    const snapshot = readLocalCatalog();
    const limit = session?.entitlements?.limits?.staff || 1;
    if (snapshot.data.staffProfiles.length >= limit) return Promise.reject(new Error('Staff limit reached for your plan'));
    const member = touchRecord('staffProfile', {
      id: nextLocalId('staff', session),
      branchId: activeBranchId(session),
      name: String(payload.name).slice(0, 120),
      role: payload.role || 'SERVER',
      active: payload.active !== false,
    }, session);
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
    const session = checkAppwriteSession();
    const snapshot = readLocalCatalog();
    const index = snapshot.data.staffProfiles.findIndex(staff => staff.id === id);
    if (index < 0) return Promise.reject(new Error('Staff member not found'));
    snapshot.data.staffProfiles[index] = touchRecord('staffProfile', {
      ...snapshot.data.staffProfiles[index],
      ...payload,
    }, session);
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
    const session = checkAppwriteSession();
    const snapshot = readLocalCatalog();
    const limit = session?.entitlements?.limits?.branches || 1;
    if (snapshot.data.branches.length >= limit) return Promise.reject(new Error('Branch limit reached for your plan'));
    const branch = touchRecord('branch', {
      id: nextLocalId('branch', session),
      name: String(payload.name).slice(0, 120),
      active: payload.active !== false,
    }, session);
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
    const session = checkAppwriteSession();
    const snapshot = readLocalCatalog();
    const index = snapshot.data.branches.findIndex(branch => branch.id === id);
    if (index < 0) return Promise.reject(new Error('Branch not found'));
    snapshot.data.branches[index] = touchRecord('branch', {
      ...snapshot.data.branches[index],
      ...payload,
    }, session);
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

export function getTenantDashboardReport(consolidated = false) {
  return merchantGoRequest(consolidated ? '/tenant/reports/dashboard?consolidated=true' : '/tenant/reports/dashboard');
}

export async function exportTenantSnapshot() {
  if (usesLocalCatalog()) {
    const localSnapshot = readLocalCatalog();
    const { snapshot: serverSnapshot } = await merchantGoRequest('/tenant/snapshot?serverOnly=true');
    const normalizedServer = normalizeSnapshot(serverSnapshot, checkAppwriteSession());
    return {
      snapshot: {
        ...localSnapshot,
        exportedAt: new Date().toISOString(),
        data: {
          ...localSnapshot.data,
          branches: mergeBranches(localSnapshot.data.branches, normalizedServer.data.branches),
          closedShiftOrders: normalizedServer.data.closedShiftOrders,
          closedShifts: normalizedServer.data.closedShifts,
          zReports: normalizedServer.data.zReports,
        },
      },
    };
  }
  return merchantGoRequest('/tenant/snapshot');
}

export async function importTenantSnapshot(snapshotValue, dryRun, resolutions = {}) {
  const snapshot = normalizeSnapshot(snapshotValue, checkAppwriteSession());
  if (usesLocalCatalog()) {
    const localPreview = previewLocalSnapshotMerge(snapshot, resolutions);
    const backendPreview = mapBackendPreview(await merchantGoRequest('/tenant/snapshot/import', {
      method: 'POST',
      body: JSON.stringify({ snapshot, dryRun: true, serverManagedOnly: true, resolutions }),
    }));
    const combined = combineMergePreviews(localPreview, backendPreview);
    if (dryRun) return combined;
    if (combined.conflicts.length > 0) throw new Error('Snapshot merge has unresolved conflicts');
    const backup = readLocalCatalog();
    try {
      commitLocalSnapshotMerge(snapshot, resolutions);
      const committedBackend = mapBackendPreview(await merchantGoRequest('/tenant/snapshot/import', {
        method: 'POST',
        body: JSON.stringify({ snapshot, dryRun: false, serverManagedOnly: true, resolutions }),
      }));
      return combineMergePreviews({ ...localPreview, dryRun: false, applied: true, message: 'Snapshot merged successfully.' }, committedBackend);
    } catch (error) {
      saveLocalCatalog(backup);
      throw error;
    }
  }
  return merchantGoRequest('/tenant/snapshot/import', {
    method: 'POST',
    body: JSON.stringify({ snapshot, dryRun, resolutions, serverManagedOnly: false }),
  });
}

export function createCheckoutSession(targetPlan, targetAccountType = 'solo') {
  const session = checkAppwriteSession();
  return merchantGoRequest('/billing/checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      userId: session?.id,
      target_plan: targetPlan,
      target_account_type: targetAccountType,
      return_url: `${window.location.origin}/profile?session_id={CHECKOUT_SESSION_ID}&plan=${targetPlan}`
    }),
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

export async function fetchGoogleDriveSnapshot() {
  const { snapshot } = await merchantGoRequest('/cloud/google/pull', { method: 'POST' });
  return normalizeSnapshot(snapshot, checkAppwriteSession());
}
