document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'dashboard' });
  if (!session) return;

  const customer = session.record;
  document.getElementById('amName').textContent = customer.accountManager;

  const stats = zpCustomerStats(customer.id);
  const services = zpGetServicesForCustomer(customer.id);
  const invoices = zpGetInvoicesForCustomer(customer.id)
    .slice()
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  /* --- Renewal / overdue alert banner --- */
  const alertHost = document.getElementById('renewalAlert');
  const alerts = [];
  if (stats.overdueCount > 0) {
    alerts.push(`<div class="alert alert-danger">⚠️ You have ${stats.overdueCount} overdue invoice${stats.overdueCount > 1 ? 's' : ''} totaling ${zpFormatCurrency(invoices.filter(i => zpEffectiveInvoiceStatus(i) === 'overdue').reduce((s, i) => s + zpInvoiceTotal(i), 0))}. <a href="invoices.html" style="color:inherit;font-weight:700;">Review invoices →</a></div>`);
  }
  if (stats.upcomingRenewals.length > 0) {
    const next = stats.upcomingRenewals[0];
    alerts.push(`<div class="alert alert-info">🔔 <strong>${next.service.name}</strong> renews in ${next.daysAway} day${next.daysAway === 1 ? '' : 's'} (${zpFormatDate(next.service.billing.nextRenewal)}) at ${zpFormatCurrency(next.service.billing.customerPrice, next.service.billing.currency)}/mo.</div>`);
  }
  alertHost.innerHTML = alerts.join('');

  /* --- Stat tiles --- */
  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile">
      <div class="label">Active Services</div>
      <div class="value">${stats.activeServices}</div>
      <div class="foot">of ${stats.totalServices} total services</div>
    </div>
    <div class="stat-tile">
      <div class="label">Monthly Recurring</div>
      <div class="value">${zpFormatCurrency(stats.monthlyRecurring)}</div>
      <div class="foot">across active recurring services</div>
    </div>
    <div class="stat-tile">
      <div class="label">Outstanding Balance</div>
      <div class="value">${zpFormatCurrency(stats.outstandingBalance)}</div>
      <div class="foot ${stats.overdueCount > 0 ? 'danger' : ''}">${stats.overdueCount > 0 ? stats.overdueCount + ' overdue' : 'nothing overdue'}</div>
    </div>
    <div class="stat-tile">
      <div class="label">Lifetime Invested</div>
      <div class="value">${zpFormatCurrency(stats.lifetimeInvested)}</div>
      <div class="foot">since ${zpFormatDate(customer.since)}</div>
    </div>
  `;

  /* --- Service cards (top 4) --- */
  const grid = document.getElementById('serviceGrid');
  if (services.length === 0) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">🧰</div>No services yet. <a href="request-service.html">Request one →</a></div>`;
  } else {
    grid.innerHTML = services.slice(0, 4).map(renderServiceCard).join('');
    grid.querySelectorAll('[data-svc]').forEach(el => {
      el.addEventListener('click', () => { window.location.href = 'services.html?svc=' + el.getAttribute('data-svc'); });
    });
  }

  /* --- Recent invoices (top 5) --- */
  const tbody = document.querySelector('#invoiceTable tbody');
  if (invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No invoices yet.</td></tr>`;
  } else {
    tbody.innerHTML = invoices.slice(0, 5).map(inv => {
      const svc = zpGetService(inv.serviceId);
      const status = zpEffectiveInvoiceStatus(inv);
      return `<tr>
        <td>${inv.id}</td>
        <td>${svc ? svc.name : '—'}</td>
        <td>${zpFormatDate(inv.issueDate)}</td>
        <td>${zpFormatDate(inv.dueDate)}</td>
        <td>${zpFormatCurrency(zpInvoiceTotal(inv), inv.currency)}</td>
        <td>${zpBadge(status)}</td>
      </tr>`;
    }).join('');
  }

  /* --- In-progress projects --- */
  if (stats.inDevelopment.length > 0) {
    document.getElementById('progressPanel').style.display = '';
    document.getElementById('progressBody').innerHTML = stats.inDevelopment.map(s => {
      if (s.milestones) {
        const total = s.milestones.length;
        const done = s.milestones.filter(m => m.status === 'completed').length;
        const pct = Math.round((done / total) * 100);
        return `<div style="margin-bottom:18px;">
          <div class="flex-between" style="margin-bottom:6px;">
            <strong>${s.name}</strong>
            <span class="text-muted" style="font-size:0.82rem;">${done}/${total} milestones</span>
          </div>
          <div class="progress-bar"><span style="width:${pct}%"></span></div>
        </div>`;
      }
      return `<div style="margin-bottom:14px;"><strong>${s.name}</strong> <span class="text-muted">— ${zpStatusLabel(s.status)}</span></div>`;
    }).join('');
  }

  function renderServiceCard(s) {
    const priceLabel = s.billing.model === 'recurring'
      ? `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)}<span class="cycle">/${s.billing.cycle === 'monthly' ? 'mo' : s.billing.cycle}</span>`
      : `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)}<span class="cycle"> one-time</span>`;
    return `<button class="service-card" data-svc="${s.id}">
      <div class="row-top">
        <div>
          <div class="cat">${zpCategoryIcon(s.category)} ${zpCategoryLabel(s.category)}</div>
          <h3>${s.name}</h3>
        </div>
        ${zpBadge(s.status)}
      </div>
      <div class="meta">${s.provider ? s.provider + ' · ' + s.plan : ''}</div>
      <div class="price">${priceLabel}</div>
    </button>`;
  }
});
