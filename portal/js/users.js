/* =========================================================================
   Zainpreneur Agency — Users admin (SRS v2 §10 users, §15/§55 access)
   Agency staff (read-only), delivery team CRUD, customer user oversight.
   Operational roles are separate from application access roles.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'agency', active: 'users' });
  if (!session) return;

  const alertBox = document.getElementById('formAlert');
  function notice(html) {
    alertBox.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* --- staff (read-only) --- */
  document.querySelector('#staffTable tbody').innerHTML = ZP.data.agencyUsers.map(a =>
    `<tr><td><strong>${a.name}</strong></td><td>${a.email}</td><td>${a.role}</td></tr>`
  ).join('');

  /* --- delivery team (REST-bound in rest mode, mock fallback) --- */
  const tbody = document.querySelector('#teamTable tbody');
  let teamRows = [];
  let teamSource = 'mock';

  async function loadTeam() {
    teamRows = ZP.data.teamUsers;
    teamSource = 'mock';
    if (Api.mode === 'rest') {
      try {
        teamRows = await Api.rest.team.list();
        teamSource = 'rest';
      } catch (e) { /* fall through to mock */ }
    }
  }

  function renderTeam() {
    tbody.innerHTML = teamRows.map(m => {
      const open = zpGetTasksForAssignee(m.id).filter(t => t.status !== 'done').length;
      const active = m.active !== false;
      const custom = m.customRoleId ? (ZP.data.customRoles || []).find(r => r.id === m.customRoleId) : null;
      const roleCell = m.role + (custom ? `<br><span class="chip">${custom.name}</span>` : '');
      return `<tr>
        <td><strong>${m.name}</strong></td>
        <td>${m.email}</td>
        <td>${roleCell}</td>
        <td class="text-muted" style="font-size:0.8rem;">${(m.skills || []).join(', ')}</td>
        <td>${open}</td>
        <td>${active ? '<span class="badge badge--success">Active</span>' : '<span class="badge badge--muted">Inactive</span>'}</td>
        <td><button type="button" class="btn btn-secondary btn-sm" data-member="${m.id}">Edit</button></td>
      </tr>`;
    }).join('');
  }

  tbody.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-member]');
    if (btn) openMemberModal(btn.getAttribute('data-member'));
  });

  const memberModal = document.getElementById('memberModal');
  let editingId = null;

  document.getElementById('addMemberBtn').addEventListener('click', () => openMemberModal(null));
  document.getElementById('memberModalClose').addEventListener('click', () => memberModal.classList.remove('open'));
  document.getElementById('memberCancelBtn').addEventListener('click', () => memberModal.classList.remove('open'));
  memberModal.addEventListener('click', e => { if (e.target === memberModal) memberModal.classList.remove('open'); });

  function accessOptions(selected) {
    const customs = (ZP.data.customRoles || []).map(r =>
      `<option value="${r.id}" ${r.id === selected ? 'selected' : ''}>${r.name} (custom)</option>`).join('');
    return `<option value="" ${!selected ? 'selected' : ''}>Team default</option>` + customs;
  }

  function openMemberModal(id) {
    editingId = id;
    const m = id ? teamRows.find(x => x.id === id) : null;
    document.getElementById('memberModalTitle').textContent = m ? 'Edit Team Member' : 'Add Team Member';
    document.getElementById('memberDeleteBtn').style.display = m ? '' : 'none';
    document.getElementById('m_name').value = m ? m.name : '';
    document.getElementById('m_email').value = m ? m.email : '';
    document.getElementById('m_role').value = m ? m.role : 'Implementer';
    document.getElementById('m_status').value = m && m.active === false ? 'inactive' : 'active';
    document.getElementById('m_skills').value = m ? (m.skills || []).join(', ') : '';
    document.getElementById('m_access').innerHTML = accessOptions(m ? m.customRoleId || '' : '');
    const accessSel = document.getElementById('m_access');
    accessSel.disabled = teamSource === 'rest';
    accessSel.title = teamSource === 'rest' ? 'Custom access roles apply to the mock store only' : '';
    document.getElementById('m_password').value = '';
    memberModal.classList.add('open');
  }

  document.getElementById('memberSaveBtn').addEventListener('click', async () => {
    const name = document.getElementById('m_name').value.trim();
    const email = document.getElementById('m_email').value.trim();
    if (!name || !email) return;
    const skills = document.getElementById('m_skills').value.split(',').map(s => s.trim()).filter(Boolean);
    const active = document.getElementById('m_status').value === 'active';
    const password = document.getElementById('m_password').value;
    const customRoleId = document.getElementById('m_access').value || null;
    if (teamSource === 'rest') {
      // Whitelisted fields only — the API rejects unknown columns, and
      // portal passwords stay mock-side (backend members have no login).
      const body = { name, email, role: document.getElementById('m_role').value, skills, active };
      try {
        if (editingId) await Api.rest.team.update(editingId, body);
        else await Api.rest.team.create(body);
      } catch (e) {
        notice(`<div class="alert alert-danger">Save failed: ${e.message}</div>`);
        return;
      }
      await loadTeam();
    } else if (editingId) {
      const m = zpGetTeamMember(editingId);
      if (!m) return;
      m.name = name; m.email = email; m.role = document.getElementById('m_role').value;
      m.skills = skills; m.active = active;
      if (customRoleId) m.customRoleId = customRoleId; else delete m.customRoleId;
      if (password) m.password = password;
    } else {
      const member = {
        id: 'team-' + Date.now().toString().slice(-6),
        name, email, role: document.getElementById('m_role').value,
        skills, active, password: password || 'team1234'
      };
      if (customRoleId) member.customRoleId = customRoleId;
      ZP.data.teamUsers.push(member);
    }
    zpPersist();
    memberModal.classList.remove('open');
    renderTeam();
  });

  document.getElementById('memberDeleteBtn').addEventListener('click', async () => {
    if (!editingId) return;
    const assigned = zpGetTasksForAssignee(editingId).length;
    if (assigned > 0) {
      notice(`<div class="alert alert-warning">Cannot delete — ${assigned} task${assigned === 1 ? ' is' : 's are'} assigned to this member. Deactivate instead.</div>`);
      return;
    }
    if (!window.confirm('Delete this team member? This cannot be undone.')) return;
    if (teamSource === 'rest') {
      try {
        await Api.rest.team.remove(editingId);
      } catch (e) {
        notice(`<div class="alert alert-danger">Delete failed: ${e.message}</div>`);
        return;
      }
      await loadTeam();
    } else {
      ZP.data.teamUsers = ZP.data.teamUsers.filter(m => m.id !== editingId);
      zpPersist();
    }
    memberModal.classList.remove('open');
    renderTeam();
  });

  /* --- customer users --- */
  const ctbody = document.querySelector('#customerTable tbody');

  function renderCustomers() {
    const rows = [];
    ZP.data.customers.forEach(c => {
      rows.push({ customer: c, user: null, name: c.contact, email: c.email, role: 'Owner', status: 'active', fixed: true });
      (c.users || []).forEach(u => rows.push({ customer: c, user: u, name: u.name, email: u.email, role: u.role === 'admin' ? 'Admin' : 'User', status: u.status === 'disabled' ? 'disabled' : 'active', fixed: false }));
    });
    ctbody.innerHTML = rows.map((r, i) =>
      `<tr><td><strong>${r.name}</strong></td><td>${r.customer.company}</td><td>${r.role}</td>
      <td>${r.status === 'disabled' ? '<span class="badge badge--muted">Disabled</span>' : '<span class="badge badge--success">Active</span>'}</td>
      <td>${r.fixed ? '' : `<button type="button" class="btn btn-secondary btn-sm" data-custuser="${i}">Toggle Access</button>`}</td></tr>`
    ).join('');
    ctbody.querySelectorAll('[data-custuser]').forEach(btn => btn.addEventListener('click', () => {
      const r = rows[Number(btn.getAttribute('data-custuser'))];
      if (!r || !r.user) return;
      r.user.status = r.user.status === 'disabled' ? 'active' : 'disabled';
      zpPersist();
      renderCustomers();
    }));
    // stash rows for handler use
    ctbody._rows = rows;
  }

  renderCustomers();
  loadTeam().then(renderTeam);
});
