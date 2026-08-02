const SESSION_KEY = 'merchantgo.session';
const SESSION_EVENT = 'merchantgo:session-change';

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function normalizeTenantMembership(value) {
  if (!value || typeof value !== 'object') return null;
  const tenantId = typeof value.tenant_id === 'string'
    ? value.tenant_id
    : typeof value.tenantId === 'string'
      ? value.tenantId
      : typeof value.id === 'string'
        ? value.id
        : null;
  if (!tenantId) return null;

  return {
    ...value,
    id: typeof value.id === 'string' ? value.id : tenantId,
    tenant_id: tenantId,
    name: typeof value.name === 'string'
      ? value.name
      : typeof value.tenant_name === 'string'
        ? value.tenant_name
        : typeof value.label === 'string'
          ? value.label
          : undefined,
    branch_id: typeof value.branch_id === 'string'
      ? value.branch_id
      : typeof value.branchId === 'string'
        ? value.branchId
        : undefined,
  };
}

function normalizeSession(session) {
  if (!session || typeof session !== 'object') return null;
  const tenants = Array.isArray(session.tenants)
    ? session.tenants.map(normalizeTenantMembership).filter(Boolean)
    : undefined;
  return {
    ...session,
    ...(tenants ? { tenants } : {}),
    ...(typeof session.selected_tenant_id === 'string'
      ? { selected_tenant_id: session.selected_tenant_id }
      : {}),
  };
}

function emitSessionChange() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export const getSession = () => normalizeSession(readSession());

export const setSession = (session) => {
  const next = normalizeSession(session);
  if (!next) {
    sessionStorage.removeItem(SESSION_KEY);
    emitSessionChange();
    return null;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  emitSessionChange();
  return next;
};

export const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
  emitSessionChange();
};

export const getSelectedTenant = (session = getSession()) => {
  const tenants = Array.isArray(session?.tenants) ? session.tenants : [];
  if (tenants.length === 0) return null;
  return tenants.find(tenant => tenant.tenant_id === session?.selected_tenant_id)
    || tenants.find(tenant => tenant.tenant_id === session?.tenant_id)
    || null;
};

export const setSelectedTenant = (tenantId) => {
  const session = getSession();
  if (!session || !Array.isArray(session.tenants)) return session;
  const tenant = session.tenants.find(candidate => candidate.tenant_id === tenantId);
  if (!tenant) return session;
  return setSession({ ...session, selected_tenant_id: tenant.tenant_id });
};

export const subscribeSession = (listener) => {
  window.addEventListener(SESSION_EVENT, listener);
  return () => window.removeEventListener(SESSION_EVENT, listener);
};
