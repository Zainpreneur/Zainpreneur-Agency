document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'services' });
  if (!session) return;

  const customer = session.record;
  const allServices = zpGetServicesForCustomer(customer.id);

  let activeCategory = 'all';
  let activeStatus = 'all';

  const grid = document.getElementById('serviceGrid');
  const catTabs = document.getElementById('categoryTabs');
  const statusFilter = document.getElementById('statusFilter');

  catTabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    catTabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.getAttribute('data-cat');
    render();
  });

  statusFilter.addEventListener('change', () => {
    activeStatus = statusFilter.value;
    render();
  });

  function render() {
    const filtered = allServices.filter(s =>
      (activeCategory === 'all' || s.category === activeCategory) &&
      (activeStatus === 'all' || s.status === activeStatus)
    );

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🧰</div>No services match these filters.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join('');
    grid.querySelectorAll('[data-svc]').forEach(el => {
      el.addEventListener('click', () => openDetail(el.getAttribute('data-svc')));
    });
  }

  function renderCard(s) {
    const priceLabel = s.billing.model === 'recurring'
      ? `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)}<span class="cycle">/${s.billing.cycle === 'monthly' ? 'mo' : s.billing.cycle}</span>`
      : `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)}<span class="cycle"> one-time</span>`;

    let progress = '';
    if (s.milestones) {
      const total = s.milestones.length;
      const done = s.milestones.filter(m => m.status === 'completed').length;
      const pct = Math.round((done / total) * 100);
      progress = `<div class="progress-mini"><div class="progress-bar"><span style="width:${pct}%"></span></div></div>`;
    }

    return `<button class="service-card" data-svc="${s.id}">
      <div class="row-top">
        <div>
          <div class="cat">${zpCategoryIcon(s.category)} ${zpCategoryLabel(s.category)}</div>
          <h3>${s.name}</h3>
        </div>
        ${zpBadge(s.status)}
      </div>
      <div class="meta">${s.provider ? s.provider + ' · ' + s.plan : (s.deployedDate ? 'Deployed ' + zpFormatDate(s.deployedDate) : 'Not yet deployed')}</div>
      <div class="chips">${s.stack.slice(0, 3).map(t => `<span class="chip">${t}</span>`).join('')}${s.stack.length > 3 ? `<span class="chip">+${s.stack.length - 3} more</span>` : ''}</div>
      <div class="price">${priceLabel}</div>
      ${progress}
    </button>`;
  }

  const modal = document.getElementById('detailModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  document.getElementById('modalClose').addEventListener('click', closeDetail);
  modal.addEventListener('click', e => { if (e.target === modal) closeDetail(); });

  function openDetail(svcId) {
    const s = zpGetService(svcId);
    if (!s) return;
    modalTitle.textContent = s.name;

    const billingRows = s.billing.model === 'recurring'
      ? `<div class="kv"><div class="k">Billing</div><div class="v">${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)} / ${s.billing.cycle}</div></div>
         <div class="kv"><div class="k">Next Renewal</div><div class="v">${zpFormatDate(s.billing.nextRenewal)}</div></div>`
      : `<div class="kv"><div class="k">Billing</div><div class="v">${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)} one-time</div></div>
         <div class="kv"><div class="k">Deployed</div><div class="v">${zpFormatDate(s.deployedDate)}</div></div>`;

    const providerRow = s.provider
      ? `<div class="kv"><div class="k">Provider / Plan</div><div class="v">${s.provider} — ${s.plan}</div></div>`
      : '';

    const milestonesHtml = s.milestones ? `
      <h3 style="margin:20px 0 12px;font-size:0.95rem;">Project Timeline</h3>
      <ul class="timeline">
        ${s.milestones.map(m => `<li class="${m.status === 'completed' ? 'done' : (m.status === 'in-progress' ? 'active' : '')}">
          <div class="t-name">${m.name}</div>
          <div class="t-date">${zpStatusLabel(m.status)}${m.date ? ' · ' + zpFormatDate(m.date) : ''}</div>
        </li>`).join('')}
      </ul>` : '';

    const invoices = zpGetInvoicesForService(s.id).sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
    const invoicesHtml = invoices.length ? `
      <h3 style="margin:20px 0 12px;font-size:0.95rem;">Billing History</h3>
      <div class="table-wrap"><table class="zp-table">
        <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${invoices.map(inv => `<tr><td>${inv.id}</td><td>${zpFormatDate(inv.issueDate)}</td><td>${zpFormatCurrency(zpInvoiceTotal(inv), inv.currency)}</td><td>${zpBadge(zpEffectiveInvoiceStatus(inv))}</td></tr>`).join('')}</tbody>
      </table></div>` : '';

    modalBody.innerHTML = `
      <div class="flex-between" style="margin-bottom:8px;">
        <span class="cat">${zpCategoryIcon(s.category)} ${zpCategoryLabel(s.category)}</span>
        ${zpBadge(s.status)}
      </div>
      <p class="text-muted" style="margin-top:0;">${s.description}</p>
      <div class="kv-list">
        ${providerRow}
        ${billingRows}
      </div>
      <h3 style="margin:20px 0 8px;font-size:0.95rem;">Technology Stack</h3>
      <div>${s.stack.map(t => `<span class="chip">${t}</span>`).join('')}</div>
      ${s.config ? `<h3 style="margin:20px 0 8px;font-size:0.95rem;">Delivery &amp; Configuration</h3>${zpRenderConfigDetail(s.config)}` : ''}
      ${milestonesHtml}
      ${invoicesHtml}
      ${renderAccountsSection(s)}
    `;
    modal.classList.add('open');
  }

  function renderAccountsSection(s) {
    const accounts = s.accounts || [];
    const items = accounts.length
      ? accounts.map(renderAccountItem).join('')
      : `<p class="text-muted" style="font-size:0.85rem;">No accounts on file for this service yet.</p>`;

    return `
      <h3 style="margin:20px 0 12px;font-size:0.95rem;">Account Access</h3>
      <div class="account-security-notice">
        <span class="ico">🔒</span>
        <span><strong>We never store passwords here.</strong> This list only tracks which accounts exist and whether access has been shared — send the actual password to your account manager through a secure channel (a password manager share link, encrypted email, or verbally), never by typing it into this form.</span>
      </div>
      <div>${items}</div>
      <button type="button" class="btn btn-secondary btn-sm" id="toggleAddAccount">+ Add Connected Account</button>
      <form id="addAccountForm" data-svc="${s.id}" style="display:none;margin-top:14px;">
        <div class="form-grid">
          <div class="field"><label for="na_provider">Provider</label><input type="text" id="na_provider" required placeholder="e.g. Hostinger"></div>
          <div class="field"><label for="na_purpose">Purpose</label><input type="text" id="na_purpose" required placeholder="e.g. VPS Control Panel"></div>
        </div>
        <div class="form-grid">
          <div class="field"><label for="na_url">Login URL</label><input type="url" id="na_url" placeholder="https://..."></div>
          <div class="field"><label for="na_username">Username / account email</label><input type="text" id="na_username" placeholder="you@company.com"></div>
        </div>
        <div class="field"><label for="na_notes">Notes (optional)</label><textarea id="na_notes" placeholder="Anything your account manager should know. Never include a password here."></textarea></div>
        <button type="submit" class="btn btn-primary btn-sm">Save Account Reference</button>
      </form>
    `;
  }

  function renderAccountItem(acc) {
    const needsAction = acc.status === 'requested' || acc.status === 'rotate-requested';
    let actions = '';
    if (acc.status === 'requested') {
      actions = `<button type="button" class="btn btn-secondary btn-sm" data-action="mark-shared" data-acc="${acc.id}">I've Shared This Securely</button>`;
    } else if (acc.status === 'rotate-requested') {
      actions = `<button type="button" class="btn btn-primary btn-sm" data-action="mark-rotated" data-acc="${acc.id}">I've Rotated It</button>`;
    }
    return `<div class="account-item ${needsAction ? 'needs-action' : ''}">
      <div class="acc-top">
        <div>
          <div class="acc-title">${acc.provider}</div>
          <div class="acc-purpose">${acc.purpose}</div>
        </div>
        ${zpBadge(acc.status)}
      </div>
      <div class="acc-meta">
        ${acc.loginUrl ? `<a href="${acc.loginUrl}" target="_blank" rel="noopener">${acc.loginUrl}</a><br>` : ''}
        ${acc.username ? `Username: ${acc.username}` : ''}
      </div>
      ${acc.notes ? `<div class="acc-notes">${acc.notes}</div>` : ''}
      ${actions ? `<div class="acc-actions">${actions}</div>` : ''}
    </div>`;
  }

  modalBody.addEventListener('click', function (e) {
    const shareBtn = e.target.closest('[data-action="mark-shared"]');
    if (shareBtn) {
      const found = zpFindAccountAndService(shareBtn.getAttribute('data-acc'));
      if (found) {
        const today = ZP_TODAY.toISOString().slice(0, 10);
        found.account.status = 'shared';
        found.account.sharedVia = (found.account.sharedVia ? found.account.sharedVia + ' · ' : '') + 'Customer confirmed sharing on ' + today;
        found.account.lastUpdated = today;
        zpPersist();
        openDetail(found.service.id);
      }
      return;
    }
    const rotateBtn = e.target.closest('[data-action="mark-rotated"]');
    if (rotateBtn) {
      const found = zpFindAccountAndService(rotateBtn.getAttribute('data-acc'));
      if (found) {
        const today = ZP_TODAY.toISOString().slice(0, 10);
        found.account.status = 'configured';
        found.account.lastUpdated = today;
        found.account.notes = 'Password rotated by customer on ' + today + '.';
        zpPersist();
        openDetail(found.service.id);
      }
      return;
    }
    if (e.target.closest('#toggleAddAccount')) {
      const form = document.getElementById('addAccountForm');
      if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
    }
  });

  modalBody.addEventListener('submit', function (e) {
    if (e.target.id !== 'addAccountForm') return;
    e.preventDefault();
    const svcId = e.target.getAttribute('data-svc');
    const s = zpGetService(svcId);
    if (!s) return;
    const provider = document.getElementById('na_provider').value.trim();
    const purpose = document.getElementById('na_purpose').value.trim();
    const loginUrl = document.getElementById('na_url').value.trim();
    const username = document.getElementById('na_username').value.trim();
    const notes = document.getElementById('na_notes').value.trim();
    if (!provider || !purpose) return;

    if (!s.accounts) s.accounts = [];
    s.accounts.push({
      id: 'acc-' + Date.now().toString().slice(-6),
      provider, purpose, loginUrl: loginUrl || null, username: username || null,
      status: 'requested', sharedVia: null, lastUpdated: ZP_TODAY.toISOString().slice(0, 10), notes
    });
    zpPersist();
    openDetail(svcId);
  });

  function closeDetail() { modal.classList.remove('open'); }

  render();

  // Deep link support: services.html?svc=svc-001
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('svc');
  if (preselect) openDetail(preselect);
});
