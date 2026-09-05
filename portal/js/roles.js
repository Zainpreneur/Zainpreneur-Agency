/* =========================================================================
   Zainpreneur Agency — Roles & Permissions UI (SRS v2 §10 roles, §55)
   Catalogue view + built-in matrix + custom role builder. Custom roles
   extend a base role with extra grants and are assignable to team members
   (see Users page). UI gating only — the server enforces everything.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'agency', active: 'roles' });
  if (!session) return;

  if (!Array.isArray(ZP.data.customRoles)) ZP.data.customRoles = [];

  const CATALOG = [
    { scope: 'customers', label: 'Customers', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'users', label: 'Users', actions: ['read', 'create', 'update', 'disable'] },
    { scope: 'catalog', label: 'Catalogue', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'services', label: 'Services', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'projects', label: 'Projects', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'tasks', label: 'Tasks', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'team', label: 'Team', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'assets', label: 'Assets', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'credentials', label: 'Credentials', actions: ['read', 'create', 'update', 'reveal', 'delete'] },
    { scope: 'invoices', label: 'Invoices', actions: ['read', 'create', 'update'] },
    { scope: 'tickets', label: 'Support Tickets', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'documents', label: 'Documents', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'reports', label: 'Reports', actions: ['read'] },
    { scope: 'settings', label: 'Settings', actions: ['read', 'update'] },
    { scope: 'roles', label: 'Roles', actions: ['read', 'create', 'update', 'delete'] },
    { scope: 'permissions', label: 'Permissions', actions: ['read'] },
    { scope: 'audit', label: 'Audit Log', actions: ['read'] }
  ];

  function expandsTo(rolePerms, scope, action) {
    return rolePerms.includes(scope + ':' + action) || rolePerms.includes(scope + ':*') || rolePerms.includes('*');
  }

  /* --- built-in matrix --- */
  const mtbody = document.querySelector('#matrixTable tbody');
  mtbody.innerHTML = CATALOG.map(entry => {
    const cells = ['customer', 'agency', 'team'].map(role => {
      const perms = ZP_ROLE_PERMISSIONS[role] || [];
      const have = entry.actions.filter(a => expandsTo(perms, entry.scope, a));
      if (!have.length) return '<td class="text-muted">—</td>';
      return `<td style="font-size:0.78rem;">${have.join(', ')}</td>`;
    }).join('');
    return `<tr><td><strong>${entry.label}</strong><br><span class="text-muted" style="font-size:0.76rem;">${entry.scope}.*</span></td>${cells}</tr>`;
  }).join('');

  /* --- custom roles --- */
  const rtbody = document.querySelector('#roleTable tbody');

  function assignees(roleId) {
    return ZP.data.teamUsers.filter(m => m.customRoleId === roleId).map(m => m.name);
  }

  function renderRoles() {
    if (!ZP.data.customRoles.length) {
      rtbody.innerHTML = `<tr><td colspan="5" class="table-empty">No custom roles yet. Create one for scoped access like “Field Technician”.</td></tr>`;
      return;
    }
    rtbody.innerHTML = ZP.data.customRoles.map(r => {
      const who = assignees(r.id);
      return `<tr>
        <td><strong>${r.name}</strong></td>
        <td>${r.base}</td>
        <td class="text-muted" style="font-size:0.8rem;">${(r.grants || []).join(', ') || '—'}</td>
        <td>${who.length ? who.join(', ') : '<span class="text-muted">Unassigned</span>'}</td>
        <td><button type="button" class="btn btn-secondary btn-sm" data-role="${r.id}">Edit</button></td>
      </tr>`;
    }).join('');
    rtbody.querySelectorAll('[data-role]').forEach(btn => {
      btn.addEventListener('click', () => openRoleModal(btn.getAttribute('data-role')));
    });
  }

  const roleModal = document.getElementById('roleModal');
  let editingId = null;

  document.getElementById('addRoleBtn').addEventListener('click', () => openRoleModal(null));
  document.getElementById('roleModalClose').addEventListener('click', () => roleModal.classList.remove('open'));
  document.getElementById('roleCancelBtn').addEventListener('click', () => roleModal.classList.remove('open'));
  roleModal.addEventListener('click', e => { if (e.target === roleModal) roleModal.classList.remove('open'); });

  function openRoleModal(id) {
    editingId = id;
    const r = id ? ZP.data.customRoles.find(x => x.id === id) : null;
    document.getElementById('roleModalTitle').textContent = r ? 'Edit Role' : 'Create Role';
    document.getElementById('roleDeleteBtn').style.display = r ? '' : 'none';
    document.getElementById('r_name').value = r ? r.name : '';
    document.getElementById('r_base').value = r ? r.base : 'team';
    const grants = r ? r.grants || [] : [];
    document.getElementById('grantGrid').innerHTML = CATALOG.map(entry => `
      <div class="field" style="margin-bottom:10px;">
        <label>${entry.label}</label>
        <div>${entry.actions.map(a => {
          const perm = entry.scope + ':' + a;
          const checked = grants.includes(perm) ? 'checked' : '';
          return `<label style="display:inline-block;font-weight:400;margin-right:12px;font-size:0.82rem;">
            <input type="checkbox" data-grant="${perm}" ${checked} style="width:auto;display:inline-block;margin-right:4px;">${a}</label>`;
        }).join('')}</div>
      </div>`).join('');
    roleModal.classList.add('open');
  }

  document.getElementById('roleSaveBtn').addEventListener('click', () => {
    const name = document.getElementById('r_name').value.trim();
    if (!name) return;
    const grants = Array.from(document.querySelectorAll('#grantGrid [data-grant]:checked'))
      .map(el => el.getAttribute('data-grant'));
    if (editingId) {
      const r = ZP.data.customRoles.find(x => x.id === editingId);
      if (!r) return;
      r.name = name;
      r.base = document.getElementById('r_base').value;
      r.grants = grants;
    } else {
      ZP.data.customRoles.push({
        id: 'role-' + Date.now().toString().slice(-6),
        name, base: document.getElementById('r_base').value, grants
      });
    }
    zpPersist();
    roleModal.classList.remove('open');
    renderRoles();
  });

  document.getElementById('roleDeleteBtn').addEventListener('click', () => {
    if (!editingId) return;
    const who = assignees(editingId);
    if (who.length && !window.confirm(`“${who.join(', ')}” currently hold${who.length === 1 ? 's' : ''} this role. Delete anyway and fall back to base permissions?`)) return;
    if (!who.length && !window.confirm('Delete this custom role?')) return;
    ZP.data.teamUsers.forEach(m => { if (m.customRoleId === editingId) delete m.customRoleId; });
    ZP.data.customRoles = ZP.data.customRoles.filter(r => r.id !== editingId);
    zpPersist();
    roleModal.classList.remove('open');
    renderRoles();
  });

  renderRoles();
});
