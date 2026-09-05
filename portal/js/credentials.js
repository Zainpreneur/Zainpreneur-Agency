/* =========================================================================
   Zainpreneur Agency — Credentials Vault page (SRS v2 §9 credentials)
   Reference-only vault: tracks WHICH accounts exist and their access
   status — never secrets. Mirrors the backend vault-metadata concept;
   actual reveal/decrypt lives server-side (`credentials:reveal`).
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'vault' });
  if (!session) return;

  const customer = session.record;
  let activeStatus = 'all';

  const NEEDS_ACTION = ['requested', 'rotate-requested'];

  function allAccounts() {
    return Api.credentials.forCustomer(customer.id)
      .slice()
      .sort((a, b) => new Date(b.lastUpdated || '1970-01-01') - new Date(a.lastUpdated || '1970-01-01'));
  }

  function renderStats() {
    const accs = allAccounts();
    const need = accs.filter(a => NEEDS_ACTION.indexOf(a.status) !== -1).length;
    const configured = accs.filter(a => a.status === 'configured' || a.status === 'shared').length;
    document.getElementById('statGrid').innerHTML =
      '<div class="stat-tile"><div class="label">Tracked Accounts</div><div class="value">' + accs.length + '</div></div>' +
      '<div class="stat-tile"><div class="label">Needs Action</div><div class="value">' + need + '</div>' +
      '<div class="foot' + (need ? ' danger' : '') + '">' + (need ? 'sharing or rotation pending' : 'all clear') + '</div></div>' +
      '<div class="stat-tile"><div class="label">Configured / Shared</div><div class="value">' + configured + '</div></div>';
  }

  const tabs = document.getElementById('statusTabs');
  tabs.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.getAttribute('data-status');
    render();
  });

  const tbody = document.querySelector('#vaultTable tbody');

  function render() {
    let accs = allAccounts();
    if (activeStatus === 'needs-action') accs = accs.filter(a => NEEDS_ACTION.indexOf(a.status) !== -1);
    else if (activeStatus !== 'all') accs = accs.filter(a => a.status === activeStatus);
    if (!accs.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No accounts in this view.</td></tr>';
      return;
    }
    tbody.innerHTML = accs.map(function (a) {
      let action = '';
      if (a.status === 'requested') {
        action = '<button type="button" class="btn btn-secondary btn-sm" data-action="shared" data-acc="' + a.id + '">I Shared This Securely</button>';
      } else if (a.status === 'rotate-requested') {
        action = '<button type="button" class="btn btn-primary btn-sm" data-action="rotated" data-acc="' + a.id + '">I Rotated It</button>';
      }
      return '<tr>' +
        '<td><strong>' + a.provider + '</strong><br><span class="text-muted" style="font-size:0.78rem;">' + a.purpose + '</span></td>' +
        '<td>' + a.serviceName + '</td>' +
        '<td>' + (a.username || '—') + '</td>' +
        '<td>' + zpBadge(a.status) + '</td>' +
        '<td>' + zpFormatDate(a.lastUpdated) + '</td>' +
        '<td><button type="button" class="btn btn-secondary btn-sm" data-action="trail" data-acc="' + a.id + '">Trail</button> ' + action + '</td>' +
        '</tr>';
    }).join('');
  }

  tbody.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const found = Api.credentials.find(btn.getAttribute('data-acc'));
    if (!found || found.service.customerId !== customer.id) return;
    const action = btn.getAttribute('data-action');
    const today = ZP_TODAY.toISOString().slice(0, 10);
    if (action === 'shared') {
      found.account.status = 'shared';
      found.account.sharedVia = (found.account.sharedVia ? found.account.sharedVia + ' · ' : '') + 'Customer confirmed sharing on ' + today;
      found.account.lastUpdated = today;
      zpPersist(); renderStats(); render();
    } else if (action === 'rotated') {
      found.account.status = 'configured';
      found.account.lastUpdated = today;
      found.account.notes = 'Password rotated by customer on ' + today + '.';
      zpPersist(); renderStats(); render();
    } else if (action === 'trail') {
      openTrail(found.account);
    }
  });

  /* --- access trail (metadata only — never secrets) --- */
  const auditModal = document.getElementById('auditModal');
  document.getElementById('auditClose').addEventListener('click', function () {
    auditModal.classList.remove('open');
  });
  auditModal.addEventListener('click', function (e) {
    if (e.target === auditModal) auditModal.classList.remove('open');
  });

  function openTrail(acc) {
    document.getElementById('auditTitle').textContent = acc.provider + ' — Access Trail';
    document.getElementById('auditBody').innerHTML =
      '<div class="kv-list" style="margin-top:0;">' +
      '<div class="kv"><div class="k">Purpose</div><div class="v">' + acc.purpose + '</div></div>' +
      '<div class="kv"><div class="k">Status</div><div class="v">' + zpBadge(acc.status) + '</div></div>' +
      '<div class="kv"><div class="k">Last Updated</div><div class="v">' + zpFormatDate(acc.lastUpdated) + '</div></div>' +
      '</div>' +
      (acc.loginUrl ? '<p class="text-muted" style="font-size:0.85rem;">Login: <a href="' + acc.loginUrl + '" target="_blank" rel="noopener">' + acc.loginUrl + '</a></p>' : '') +
      (acc.sharedVia ? '<p class="text-muted" style="font-size:0.85rem;"><strong>Sharing record:</strong> ' + acc.sharedVia + '</p>' : '') +
      (acc.notes ? '<p class="text-muted" style="font-size:0.85rem;">' + acc.notes + '</p>' : '') +
      '<div class="alert alert-info" style="margin-top:14px;">Passwords are never shown here. ' +
      'Privileged reveal lives server-side behind <span class="chip">credentials:reveal</span> with step-up verification and audit logging.</div>';
    auditModal.classList.add('open');
  }

  /* --- add reference --- */
  const services = zpGetServicesForCustomer(customer.id);
  document.getElementById('r_service').innerHTML =
    services.map(s => '<option value="' + s.id + '">' + s.name + '</option>').join('');

  const refModal = document.getElementById('refModal');
  document.getElementById('addRefBtn').addEventListener('click', function () {
    refModal.classList.add('open');
  });
  function closeRef() { refModal.classList.remove('open'); }
  document.getElementById('refModalClose').addEventListener('click', closeRef);
  document.getElementById('refCancelBtn').addEventListener('click', closeRef);
  refModal.addEventListener('click', function (e) {
    if (e.target === refModal) closeRef();
  });

  document.getElementById('refSaveBtn').addEventListener('click', function () {
    const svc = zpGetService(document.getElementById('r_service').value);
    const provider = document.getElementById('r_provider').value.trim();
    const purpose = document.getElementById('r_purpose').value.trim();
    if (!svc || !provider || !purpose) return;
    if (!svc.accounts) svc.accounts = [];
    svc.accounts.push({
      id: 'acc-' + Date.now().toString().slice(-6),
      provider, purpose,
      loginUrl: document.getElementById('r_url').value.trim() || null,
      username: document.getElementById('r_username').value.trim() || null,
      status: 'requested', sharedVia: null,
      lastUpdated: ZP_TODAY.toISOString().slice(0, 10),
      notes: document.getElementById('r_notes').value.trim()
    });
    zpPersist();
    document.getElementById('refForm').reset();
    closeRef();
    renderStats(); render();
  });

  renderStats();
  render();
});
