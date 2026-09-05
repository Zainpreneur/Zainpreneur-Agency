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
      ${milestonesHtml}
      ${invoicesHtml}
    `;
    modal.classList.add('open');
  }

  function closeDetail() { modal.classList.remove('open'); }

  render();

  // Deep link support: services.html?svc=svc-001
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('svc');
  if (preselect) openDetail(preselect);
});
