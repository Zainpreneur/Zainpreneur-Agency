/* =========================================================================
   Zainpreneur Agency — Frontend service abstraction (SRS v2 §12)
   Pages must depend on this interface, never on data.js internals directly.

   Modes: 'mock' (localStorage seed, default) and later 'rest' (live API).
   Switching modes changes no UI code — only this file's bindings.

   Permission model mirrors the backend RBAC (roles → granular permissions).
   Frontend checks are UI-visibility only; the server enforces everything.
   ========================================================================= */

const Api = { mode: 'mock', baseUrl: 'http://localhost:3000' };

try {
  const storedMode = localStorage.getItem('zp_api_mode');
  if (storedMode === 'rest' || storedMode === 'mock') Api.mode = storedMode;
  const storedBase = localStorage.getItem('zp_api_base');
  if (storedBase) Api.baseUrl = storedBase;
} catch (e) { /* private mode — stay mock */ }

/**
 * REST transport. Throws on transport/HTTP errors; read bindings below
 * fall back to mock data so the demo never hard-fails offline.
 */
async function apiFetch(path, options) {
  const res = await fetch(Api.baseUrl + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...((options && options.headers) || {}) },
    ...(options || {})
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
}

function apiRead(path, mockFn) {
  if (Api.mode !== 'rest') return mockFn();
  return apiFetch(path).catch(() => mockFn());
}

/* ---------------- REST bindings (live API; mock stays default) ----------------
   Thin async wrappers over the DeployHub endpoints, verified 26/26 against
   the local stack. Pages adopt these one entity at a time (Phase 4c);
   nothing calls them until a page opts in, so mock behavior is unchanged. */

function restCrud(base) {
  return {
    list: () => apiFetch(base),
    get: (id) => apiFetch(base + '/' + id),
    create: (body) => apiFetch(base, { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch(base + '/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => apiFetch(base + '/' + id, { method: 'DELETE' })
  };
}

Api.rest = {
  health: () => apiFetch('/api/health'),
  register: (body) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (email, password) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch('/api/me'),
  catalog: Object.assign(restCrud('/api/catalog'), {
    list: () => apiFetch('/api/catalog').then(d => d.items || []),
    refresh: (id) => apiFetch('/api/catalog/' + id + '/refresh', { method: 'POST' })
  }),
  team: restCrud('/api/team'),
  assets: restCrud('/api/assets'),
  credentials: Object.assign(restCrud('/api/credentials'), {
    reveal: (id) => apiFetch('/api/credentials/' + id + '/reveal')
  }),
  invoices: { list: () => apiFetch('/api/invoices') },
  services: {
    list: () => apiFetch('/api/services'),
    create: (body) => apiFetch('/api/services', { method: 'POST', body: JSON.stringify(body) })
  },
  projects: Object.assign(restCrud('/api/projects'), {
    tasks: (projectId) => apiFetch('/api/projects/' + projectId + '/tasks'),
    createTask: (projectId, body) => apiFetch('/api/projects/' + projectId + '/tasks', { method: 'POST', body: JSON.stringify(body) })
  }),
  tickets: {
    list: (query) => apiFetch('/api/tickets' + (query || '')),
    create: (body) => apiFetch('/api/tickets', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => apiFetch('/api/tickets/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => apiFetch('/api/tickets/' + id, { method: 'DELETE' })
  },
  tasks: {
    update: (id, body) => apiFetch('/api/tasks/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => apiFetch('/api/tasks/' + id, { method: 'DELETE' })
  },
  admin: {
    customers: () => apiFetch('/api/admin/customers'),
    updateUser: (id, body) => apiFetch('/api/admin/users/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    services: () => apiFetch('/api/admin/services'),
    updateService: (id, body) => apiFetch('/api/admin/services/' + id, { method: 'PATCH', body: JSON.stringify(body) }),
    deleteService: (id) => apiFetch('/api/admin/services/' + id, { method: 'DELETE' })
  },
  rbac: { roles: () => apiFetch('/api/rbac/roles') }
};

/* ---------------- Permission registry (UI gating only) ---------------- */

const ZP_ROLE_PERMISSIONS = {
  customer: [
    'catalog:read', 'services:read', 'services:create', 'projects:read',
    'tasks:read', 'assets:*', 'credentials:*', 'invoices:read',
    'tickets:*', 'documents:read', 'notifications:read', 'support:*'
  ],
  agency: [
    'catalog:*', 'customers:*', 'services:*', 'projects:*', 'tasks:*',
    'team:*', 'assets:read', 'credentials:read', 'credentials:reveal',
    'invoices:*', 'tickets:*', 'users:*', 'roles:read', 'permissions:read',
    'reports:read', 'documents:*', 'settings:*', 'notifications:read'
  ],
  team: [
    'catalog:read', 'services:read', 'projects:read', 'projects:update',
    'tasks:*', 'team:read', 'assets:read', 'credentials:read',
    'documents:read', 'notifications:read', 'support:read'
  ]
};

/** Frontend mirror of backend `can()`: supports `scope:*` wildcards. */
function zpCan(permission) {
  const s = zpSession();
  if (!s || !s.type) return false;
  let granted = (ZP_ROLE_PERMISSIONS[s.type] || []).slice();
  // Team members may hold a custom role granting extra permissions.
  if (s.type === 'team') {
    const member = zpGetTeamMember(s.id);
    const custom = member && member.customRoleId
      ? (ZP.data.customRoles || []).find(r => r.id === member.customRoleId) : null;
    if (custom && custom.grants) granted = granted.concat(custom.grants);
  }
  if (granted.includes('*') || granted.includes(permission)) return true;
  const scope = permission.split(':')[0] + ':*';
  return granted.includes(scope);
}

/**
 * Hides elements carrying `data-require="some:permission"` when the current
 * session lacks it. Safe no-op on pages without such attributes.
 */
function zpApplyPermissions(root) {
  (root || document).querySelectorAll('[data-require]').forEach(el => {
    if (!zpCan(el.getAttribute('data-require'))) el.style.display = 'none';
  });
}

/* ---------------- Entity services (mock bindings) ---------------- */

Api.auth = {
  login: (type, id) => zpLogin(type, id),
  logout: () => zpLogout(),
  session: () => zpSession(),
  require: (role) => zpRequireAuth(role),
  can: (permission) => zpCan(permission)
};

Api.customers = {
  get: (id) => zpGetCustomer(id),
  findByEmail: (email) => zpFindCustomerByEmail(email),
  stats: (id) => zpCustomerStats(id)
};

Api.catalog = {
  categories: () => ZP_SERVICE_CATEGORIES,
  categoryDef: (id) => zpServiceCategoryDef(id),
  getTool: (id) => zpGetTool(id),
  getToolPlan: (toolId, planId) => zpGetToolPlan(toolId, planId),
  toolsForCategory: (id) => zpToolsForCategoryDef(id),
  isStale: (tool) => zpIsToolStale(tool),
  updatePricing: (toolId, plans) => zpUpdateToolPricing(toolId, plans),
  defaultChecklist: (category) => zpDefaultChecklist(category)
};

Api.services = {
  get: (id) => zpGetService(id),
  forCustomer: (customerId) => zpGetServicesForCustomer(customerId),
  forAsset: (assetId) => zpGetServicesForAsset(assetId)
};

Api.projects = {
  /** Projects are services carrying milestones or in a delivery status. */
  forCustomer(customerId) {
    return zpGetServicesForCustomer(customerId).filter(s =>
      (s.milestones && s.milestones.length > 0) ||
      ['provisioning', 'in-development', 'paused'].indexOf(s.status) !== -1
    );
  },
  progress(s) {
    if (s.milestones && s.milestones.length > 0) {
      const done = s.milestones.filter(m => m.status === 'completed').length;
      return { done, total: s.milestones.length, pct: Math.round((done / s.milestones.length) * 100) };
    }
    const linked = zpGetTasksForService(s.id);
    const done = linked.filter(t => t.status === 'done').length;
    return { done, total: linked.length, pct: linked.length ? Math.round((done / linked.length) * 100) : 0 };
  }
};

Api.tasks = {
  get: (id) => zpGetTask(id),
  forAssignee: (teamId) => zpGetTasksForAssignee(teamId),
  forService: (serviceId) => zpGetTasksForService(serviceId),
  forCustomer: (customerId) => zpGetTasksForCustomer(customerId),
  progress: (task) => zpTaskProgress(task),
  statsForMember: (teamId) => zpTeamStats(teamId)
};

Api.team = {
  get: (id) => zpGetTeamMember(id),
  findByEmail: (email) => zpFindTeamByEmail(email)
};

Api.assets = {
  get: (id) => zpGetAsset(id),
  forCustomer: (customerId) => zpGetAssetsForCustomer(customerId),
  annualCost: (asset) => zpAssetAnnualCost(asset),
  chargedTotal: (assetId) => zpAssetChargedTotal(assetId),
  spend: (customerId) => zpCustomerSoftwareSpend(customerId),
  analyze: (asset) => zpAnalyzeAsset(asset),
  savingsForCustomer: (customerId) => zpAllSavingsForCustomer(customerId)
};

Api.invoices = {
  get: (id) => zpGetInvoice(id),
  forCustomer: (customerId) => zpGetInvoicesForCustomer(customerId),
  forService: (serviceId) => zpGetInvoicesForService(serviceId),
  total: (invoice) => zpInvoiceTotal(invoice),
  effectiveStatus: (invoice) => zpEffectiveInvoiceStatus(invoice)
};

Api.tickets = {
  get: (id) => zpGetTicket(id),
  forCustomer: (customerId) => zpGetTicketsForCustomer(customerId)
};

Api.documents = {
  get: (id) => zpGetDocument(id),
  forCustomer: (customerId) => zpGetDocumentsForCustomer(customerId),
  forService: (serviceId) => zpGetDocumentsForService(serviceId)
};

/**
 * Credential REFERENCES only (provider/purpose/status) — never secrets.
 * Mirrors the backend vault-metadata concept; reveal lives server-side.
 */
Api.credentials = {
  forService: (serviceId) => zpGetAccountsForService(serviceId),
  forCustomer: (customerId) => zpGetAllAccountsForCustomer(customerId),
  find: (accountId) => zpFindAccountAndService(accountId)
};

Api.visits = {
  get: (id) => zpGetVisit(id),
  upcomingFor: (teamId) => zpUpcomingVisitsForAssignee(teamId)
};

Api.agency = {
  findByEmail: (email) => zpFindAgencyByEmail(email),
  stats: () => zpAgencyStats()
};

Api.format = {
  currency: (amount, currency) => zpFormatCurrency(amount, currency),
  date: (dateStr) => zpFormatDate(dateStr),
  badge: (status, extraClass) => zpBadge(status, extraClass),
  statusLabel: (s) => zpStatusLabel(s),
  categoryLabel: (cat) => zpCategoryLabel(cat),
  categoryIcon: (cat) => zpCategoryIcon(cat)
};

Api.store = {
  persist: () => zpPersist(),
  reset: () => zpResetData()
};

/* ---------------- Declared for Phase 3 (no mock yet) ---------------- */

Api.users = {
  list: () => [],
  get: () => null
};
Api.roles = {
  list: () => [],
  permissions: () => []
};
Api.notifications = {
  list() {
    const s = zpSession();
    if (!s || !s.type || !s.id) return [];
    const record = s.type === 'agency' ? (ZP.data.agencyUsers.find(a => a.id === s.id) || null)
      : s.type === 'team' ? zpGetTeamMember(s.id)
      : zpGetCustomer(s.id);
    if (!record) return [];
    return zpBuildFeed({ type: s.type, id: s.id, record });
  }
};
