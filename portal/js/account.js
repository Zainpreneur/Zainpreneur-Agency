/* =========================================================================
   Zainpreneur Agency — Account page (SRS v2 §9 account, §15 users)
   Business profile, preferences, organization users, and sessions.
   Org users live on the customer record (runtime-added, migration-safe);
   the primary contact is always present as the account owner.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'account' });
  if (!session) return;

  const customer = session.record;
  if (!customer.prefs) {
    customer.prefs = { currency: 'USD', notifications: 'all', billingEmail: customer.email, lang: 'en' };
  }
  if (!Array.isArray(customer.users)) customer.users = [];

  const alertBox = document.getElementById('formAlert');
  function notice(html) {
    alertBox.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* --- profile --- */
  document.getElementById('p_company').value = customer.company || '';
  document.getElementById('p_contact').value = customer.contact || '';
  document.getElementById('p_email').value = customer.email || '';
  document.getElementById('p_phone').value = customer.phone || '';
  document.getElementById('p_industry').value = customer.industry || '';

  document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();
    customer.company = document.getElementById('p_company').value.trim();
    customer.contact = document.getElementById('p_contact').value.trim();
    customer.email = document.getElementById('p_email').value.trim();
    customer.phone = document.getElementById('p_phone').value.trim();
    customer.industry = document.getElementById('p_industry').value.trim();
    zpPersist();
    notice('<div class="alert alert-success">Business profile saved.</div>');
  });

  /* --- preferences --- */
  const initialLang = customer.prefs.lang || 'en';
  document.getElementById('pf_currency').value = customer.prefs.currency || 'USD';
  document.getElementById('pf_notifications').value = customer.prefs.notifications || 'all';
  document.getElementById('pf_billingEmail').value = customer.prefs.billingEmail || customer.email || '';
  document.getElementById('pf_lang').value = customer.prefs.lang || 'en';

  document.getElementById('prefsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    customer.prefs.currency = document.getElementById('pf_currency').value;
    customer.prefs.notifications = document.getElementById('pf_notifications').value;
    customer.prefs.billingEmail = document.getElementById('pf_billingEmail').value.trim();
    customer.prefs.lang = document.getElementById('pf_lang').value;
    zpPersist();
    if (typeof zpSetLang === 'function') zpSetLang(customer.prefs.lang);
    if (customer.prefs.lang !== initialLang) { window.location.reload(); return; }
    notice('<div class="alert alert-success">Preferences saved. Display currency applies to new invoices once billing moves server-side.</div>');
  });

  /* --- organization users --- */
  const tbody = document.querySelector('#userTable tbody');

  function allUsers() {
    const owner = [{
      id: '__owner__', name: customer.contact, email: customer.email,
      phone: customer.phone, role: 'admin', status: 'active', lastActivity: 'Current session'
    }];
    return owner.concat(customer.users);
  }

  function renderUsers() {
    const users = allUsers();
    tbody.innerHTML = users.map(function (u) {
      const ownerTag = u.id === '__owner__' ? ' <span class="chip">Owner</span>' : '';
      const badge = u.status === 'disabled'
        ? '<span class="badge badge--muted">Disabled</span>'
        : '<span class="badge badge--success">Active</span>';
      const actions = u.id === '__owner__'
        ? ''
        : '<button type="button" class="btn btn-secondary btn-sm" data-edit="' + u.id + '">Edit</button> ' +
          (u.status === 'disabled'
            ? '<button type="button" class="btn btn-primary btn-sm" data-enable="' + u.id + '">Enable</button>'
            : '<button type="button" class="btn btn-secondary btn-sm" data-reset="' + u.id + '">Reset Password</button>');
      return '<tr><td><strong>' + u.name + '</strong>' + ownerTag + '</td>' +
        '<td>' + u.email + '</td>' +
        '<td>' + (u.role === 'admin' ? 'Admin' : 'User') + '</td>' +
        '<td>' + badge + '</td>' +
        '<td>' + (u.lastActivity || '—') + '</td>' +
        '<td>' + actions + '</td></tr>';
    }).join('');
  }

  tbody.addEventListener('click', function (e) {
    const editBtn = e.target.closest('[data-edit]');
    const enableBtn = e.target.closest('[data-enable]');
    const resetBtn = e.target.closest('[data-reset]');
    if (editBtn) { openUserModal(editBtn.getAttribute('data-edit')); return; }
    if (enableBtn) {
      const u = customer.users.find(x => x.id === enableBtn.getAttribute('data-enable'));
      if (u) { u.status = 'active'; zpPersist(); renderUsers(); }
      return;
    }
    if (resetBtn) {
      notice('<div class="alert alert-info">A password reset link was issued (demo: the new temporary password is <strong>demo1234</strong>).</div>');
    }
  });

  const userModal = document.getElementById('userModal');
  let editingId = null;

  document.getElementById('addUserBtn').addEventListener('click', function () { openUserModal(null); });
  document.getElementById('userModalClose').addEventListener('click', closeUserModal);
  document.getElementById('userCancelBtn').addEventListener('click', closeUserModal);
  userModal.addEventListener('click', function (e) {
    if (e.target === userModal) closeUserModal();
  });
  function closeUserModal() { userModal.classList.remove('open'); }

  function openUserModal(id) {
    editingId = id;
    const u = id ? customer.users.find(x => x.id === id) : null;
    document.getElementById('userModalTitle').textContent = u ? 'Edit User' : 'Add User';
    document.getElementById('userDeleteBtn').style.display = u ? '' : 'none';
    document.getElementById('userDeleteBtn').textContent = u && u.status === 'disabled' ? 'Enable' : 'Disable';
    document.getElementById('u_name').value = u ? u.name : '';
    document.getElementById('u_email').value = u ? u.email : '';
    document.getElementById('u_phone').value = u ? u.phone || '' : '';
    document.getElementById('u_role').value = u ? u.role : 'user';
    userModal.classList.add('open');
  }

  document.getElementById('userSaveBtn').addEventListener('click', function () {
    const name = document.getElementById('u_name').value.trim();
    const email = document.getElementById('u_email').value.trim();
    if (!name || !email) return;
    if (editingId) {
      const u = customer.users.find(x => x.id === editingId);
      if (u) {
        u.name = name; u.email = email;
        u.phone = document.getElementById('u_phone').value.trim();
        u.role = document.getElementById('u_role').value;
      }
    } else {
      customer.users.push({
        id: 'usr-' + Date.now().toString().slice(-6),
        name, email,
        phone: document.getElementById('u_phone').value.trim(),
        role: document.getElementById('u_role').value,
        status: 'active', lastActivity: 'Never signed in'
      });
    }
    zpPersist();
    closeUserModal();
    renderUsers();
  });

  document.getElementById('userDeleteBtn').addEventListener('click', function () {
    if (!editingId) return;
    const u = customer.users.find(x => x.id === editingId);
    if (u) {
      u.status = u.status === 'disabled' ? 'active' : 'disabled';
      zpPersist();
      closeUserModal();
      renderUsers();
    }
  });

  /* --- sessions (mock: current session only) --- */
  document.getElementById('sessionBody').innerHTML =
    '<div class="kv-list" style="margin-top:0;">' +
    '<div class="kv"><div class="k">This device</div><div class="v">Current browser session · started at sign in</div></div>' +
    '</div>' +
    '<button type="button" class="btn btn-secondary btn-sm" id="revokeBtn">Revoke All Sessions</button> ' +
    '<span class="text-muted" style="font-size:0.82rem;">Server-side session inventory arrives with backend auth.</span>';
  document.getElementById('revokeBtn').addEventListener('click', function () {
    zpLogout();
    window.location.href = 'login.html?loggedout=1';
  });

  renderUsers();
});
