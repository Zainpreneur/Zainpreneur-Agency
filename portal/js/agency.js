document.addEventListener('DOMContentLoaded', function () {
  const initialView = (window.location.hash || '#overview').slice(1);
  const session = zpInitShell({ role: 'agency', active: initialView });
  if (!session) return;

  const VIEWS = ['overview', 'customers', 'requests', 'tasks'];
  const HEADINGS = { overview: 'Overview', customers: 'Customers', requests: 'Service Requests', tasks: 'Delivery Tasks' };

  function showView(view) {
    if (!VIEWS.includes(view)) view = 'overview';
    VIEWS.forEach(v => {
      document.getElementById('view-' + v).style.display = v === view ? '' : 'none';
    });
    document.querySelectorAll('[data-view]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('data-view') === view);
    });
    document.getElementById('pageHeading').textContent = HEADINGS[view];
    window.location.hash = view;
    if (view === 'overview') renderOverview();
    if (view === 'customers') renderCustomers();
    if (view === 'requests') renderRequests();
    if (view === 'tasks') renderTasks();
  }

  document.querySelectorAll('[data-view]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); showView(a.getAttribute('data-view')); });
  });

  function refreshPendingBadge() {
    const count = ZP.data.requests.filter(r => r.status === 'submitted' || r.status === 'reviewing').length;
    const badge = document.getElementById('pendingBadge');
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }

  /* ---------------------------------- Overview ---------------------------------- */

  function renderOverview() {
    const s = zpAgencyStats();
    document.getElementById('agencyStatGrid').innerHTML = `
      <div class="stat-tile"><div class="label">Customers</div><div class="value">${s.totalCustomers}</div></div>
      <div class="stat-tile"><div class="label">Active Services</div><div class="value">${s.activeServices}</div></div>
      <div class="stat-tile"><div class="label">Monthly Recurring Revenue</div><div class="value">${zpFormatCurrency(s.mrr)}</div><div class="foot good">Margin: ${zpFormatCurrency(s.monthlyMargin)}/mo</div></div>
      <div class="stat-tile"><div class="label">One-time Revenue (booked)</div><div class="value">${zpFormatCurrency(s.oneTimeRevenue)}</div><div class="foot good">Margin: ${zpFormatCurrency(s.oneTimeMargin)}</div></div>
      <div class="stat-tile"><div class="label">Outstanding AR</div><div class="value">${zpFormatCurrency(s.outstandingAR)}</div><div class="foot ${s.overdueAR > 0 ? 'danger' : ''}">${zpFormatCurrency(s.overdueAR)} overdue</div></div>
      <div class="stat-tile"><div class="label">Pending Requests</div><div class="value">${s.pendingRequests}</div><div class="foot">awaiting quote</div></div>
    `;

    const rows = ZP.data.customers.map(c => {
      const cs = zpCustomerStats(c.id);
      return { customer: c, mrr: cs.monthlyRecurring };
    }).sort((a, b) => b.mrr - a.mrr);
    const max = Math.max(1, ...rows.map(r => r.mrr));

    document.getElementById('mrrBreakdown').innerHTML = rows.map(r => `
      <div style="margin-bottom:14px;">
        <div class="flex-between" style="margin-bottom:4px;font-size:0.85rem;">
          <strong>${r.customer.company}</strong>
          <span>${zpFormatCurrency(r.mrr)}/mo</span>
        </div>
        <div class="progress-bar"><span style="width:${Math.round((r.mrr / max) * 100)}%"></span></div>
      </div>
    `).join('') || `<div class="empty-state">No recurring revenue yet.</div>`;
  }

  /* ---------------------------------- Customers ---------------------------------- */

  function renderCustomers() {
    const tbody = document.querySelector('#customerTable tbody');
    tbody.innerHTML = ZP.data.customers.map(c => {
      const cs = zpCustomerStats(c.id);
      return `<tr class="clickable" data-cust="${c.id}">
        <td><strong>${c.company}</strong><br><span class="text-muted" style="font-size:0.78rem;">${c.contact}</span></td>
        <td>${c.industry}</td>
        <td>${zpFormatDate(c.since)}</td>
        <td>${cs.activeServices} / ${cs.totalServices}</td>
        <td>${zpFormatCurrency(cs.monthlyRecurring)}</td>
        <td>${cs.outstandingBalance > 0 ? `<span style="color:${cs.overdueCount > 0 ? 'var(--danger)' : 'var(--warning)'};font-weight:600;">${zpFormatCurrency(cs.outstandingBalance)}</span>` : zpFormatCurrency(0)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-cust]').forEach(row => {
      row.addEventListener('click', () => openCustomerModal(row.getAttribute('data-cust')));
    });
  }

  document.getElementById('customerModalBody').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="mark-configured"], [data-action="mark-configured-rotate"]');
    if (!btn) return;
    const found = zpFindAccountAndService(btn.getAttribute('data-acc'));
    if (!found) return;
    const today = ZP_TODAY.toISOString().slice(0, 10);
    const rotate = btn.getAttribute('data-action') === 'mark-configured-rotate';
    found.account.status = rotate ? 'rotate-requested' : 'configured';
    found.account.lastUpdated = today;
    found.account.notes = rotate
      ? 'Setup complete — customer asked to rotate this password.'
      : 'Configured by the agency on ' + today + '.';
    zpPersist();
    openCustomerModal(found.service.customerId);
    renderCustomers();
  });

  function openCustomerModal(custId) {
    const c = zpGetCustomer(custId);
    const services = zpGetServicesForCustomer(custId);
    const invoices = zpGetInvoicesForCustomer(custId).slice().sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

    document.getElementById('customerModalTitle').textContent = c.company;

    const serviceRows = services.map(s => {
      const margin = s.billing.customerPrice - s.billing.ourCost;
      const cycle = s.billing.model === 'recurring' ? `/${s.billing.cycle === 'monthly' ? 'mo' : s.billing.cycle}` : ' one-time';
      return `<tr>
        <td>${zpCategoryIcon(s.category)} ${s.name}</td>
        <td>${zpBadge(s.status)}</td>
        <td>${zpFormatCurrency(s.billing.ourCost)}${cycle}</td>
        <td>${zpFormatCurrency(s.billing.customerPrice)}${cycle}</td>
        <td style="color:var(--success);font-weight:600;">${zpFormatCurrency(margin)}${cycle}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="5" class="table-empty">No services yet.</td></tr>`;

    const invoiceRows = invoices.slice(0, 6).map(inv => `<tr>
      <td>${inv.id}</td><td>${zpFormatDate(inv.issueDate)}</td><td>${zpFormatCurrency(zpInvoiceTotal(inv), inv.currency)}</td><td>${zpBadge(zpEffectiveInvoiceStatus(inv))}</td>
    </tr>`).join('') || `<tr><td colspan="4" class="table-empty">No invoices yet.</td></tr>`;

    document.getElementById('customerModalBody').innerHTML = `
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Contact</div><div class="v">${c.contact}</div></div>
        <div class="kv"><div class="k">Email</div><div class="v">${c.email}</div></div>
        <div class="kv"><div class="k">Industry</div><div class="v">${c.industry}</div></div>
        <div class="kv"><div class="k">Customer Since</div><div class="v">${zpFormatDate(c.since)}</div></div>
      </div>
      <h3 style="font-size:0.95rem;margin:18px 0 10px;">Services — Cost vs. Charged</h3>
      <div class="table-wrap"><table class="zp-table">
        <thead><tr><th>Service</th><th>Status</th><th>Our Cost</th><th>Charged</th><th>Margin</th></tr></thead>
        <tbody>${serviceRows}</tbody>
      </table></div>
      <h3 style="font-size:0.95rem;margin:18px 0 10px;">Recent Invoices</h3>
      <div class="table-wrap"><table class="zp-table">
        <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${invoiceRows}</tbody>
      </table></div>
      ${renderAgencyAccountsSection(custId)}
    `;
    document.getElementById('customerModal').classList.add('open');
  }

  function renderAgencyAccountsSection(custId) {
    const accounts = zpGetAllAccountsForCustomer(custId);
    const rows = accounts.map(acc => {
      let actions = '';
      if (acc.status === 'shared') {
        actions = `<button type="button" class="btn btn-secondary btn-sm" data-action="mark-configured" data-acc="${acc.id}">Mark Configured</button>
                   <button type="button" class="btn btn-primary btn-sm" data-action="mark-configured-rotate" data-acc="${acc.id}">Configured — Ask to Rotate</button>`;
      } else if (acc.status === 'requested') {
        actions = `<span class="text-muted" style="font-size:0.78rem;">Waiting on customer</span>`;
      } else if (acc.status === 'rotate-requested') {
        actions = `<span class="text-muted" style="font-size:0.78rem;">Waiting on customer to rotate</span>`;
      }
      return `<tr>
        <td>${acc.provider}<br><span class="text-muted" style="font-size:0.78rem;">${acc.purpose}</span></td>
        <td>${acc.serviceName}</td>
        <td>${acc.username || '—'}</td>
        <td>${zpBadge(acc.status)}</td>
        <td>${zpFormatDate(acc.lastUpdated)}</td>
        <td>${actions}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="6" class="table-empty">No connected accounts on file.</td></tr>`;

    return `
      <h3 style="font-size:0.95rem;margin:18px 0 10px;">Account Access</h3>
      <div class="account-security-notice">
        <span class="ico">🔒</span>
        <span>Passwords are never stored in this portal — customers share them out-of-band. This table only tracks status. After using a shared credential, mark it configured and ask the customer to rotate it.</span>
      </div>
      <div class="table-wrap"><table class="zp-table">
        <thead><tr><th>Account</th><th>Service</th><th>Username</th><th>Status</th><th>Updated</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    `;
  }

  /* ---------------------------------- Tasks (oversight) ---------------------------------- */

  let activeTaskStatus = 'all';

  document.getElementById('taskStatusTabs').addEventListener('click', e => {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    document.querySelectorAll('#taskStatusTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTaskStatus = btn.getAttribute('data-status');
    renderTasks();
  });

  function renderTasks() {
    const tbody = document.querySelector('#taskTable tbody');
    const tasks = ZP.data.tasks
      .filter(t => activeTaskStatus === 'all' || t.status === activeTaskStatus)
      .slice()
      .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));

    if (tasks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No tasks in this view.</td></tr>`;
      return;
    }
    tbody.innerHTML = tasks.map(t => {
      const c = zpGetCustomer(t.customerId);
      const assignee = zpGetTeamMember(t.assigneeId);
      const progress = zpTaskProgress(t);
      return `<tr class="clickable" data-task="${t.id}">
        <td>${t.title}</td>
        <td>${c ? c.company : '—'}</td>
        <td>${assignee ? assignee.name : '<span class="text-muted">Unassigned</span>'}</td>
        <td><span class="priority-pill ${t.priority}">${t.priority}</span></td>
        <td>${progress.done}/${progress.total}</td>
        <td>${zpFormatDate(t.dueDate)}</td>
        <td>${zpBadge(t.status)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-task]').forEach(row => {
      row.addEventListener('click', () => openAgencyTaskModal(row.getAttribute('data-task')));
    });
  }

  function openAgencyTaskModal(taskId) {
    const t = zpGetTask(taskId);
    if (!t) return;
    const c = zpGetCustomer(t.customerId);
    const svc = zpGetService(t.serviceId);
    const assignee = zpGetTeamMember(t.assigneeId);
    const progress = zpTaskProgress(t);

    document.getElementById('agencyTaskModalTitle').textContent = t.title;
    document.getElementById('agencyTaskModalBody').innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <div class="text-muted" style="font-size:0.82rem;">${c ? c.company : '—'}${svc ? ' · ' + svc.name : ''}</div>
        ${zpBadge(t.status)}
      </div>
      ${t.status === 'blocked' ? `<div class="alert alert-danger">🚧 <strong>Blocked:</strong> ${t.blockedReason || 'No reason logged.'}</div>` : ''}
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Assignee</div><div class="v">${assignee ? assignee.name : 'Unassigned'}</div></div>
        <div class="kv"><div class="k">Priority</div><div class="v"><span class="priority-pill ${t.priority}">${t.priority}</span></div></div>
        <div class="kv"><div class="k">Due</div><div class="v">${zpFormatDate(t.dueDate)}</div></div>
        <div class="kv"><div class="k">Completed</div><div class="v">${t.completedDate ? zpFormatDate(t.completedDate) : '—'}</div></div>
      </div>
      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Configuration</h3>
      ${svc && svc.config ? zpRenderConfigDetail(svc.config) : '<p class="text-muted" style="font-size:0.85rem;">No structured configuration on file.</p>'}
      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Checklist — ${progress.done}/${progress.total} complete</h3>
      <div class="progress-bar" style="margin-bottom:12px;"><span style="width:${progress.pct}%"></span></div>
      <ul class="checklist">${t.checklist.map(item => `<li class="${item.done ? 'done' : ''}"><input type="checkbox" disabled ${item.done ? 'checked' : ''}><span>${item.text}</span></li>`).join('')}</ul>
    `;
    document.getElementById('agencyTaskModal').classList.add('open');
  }

  /* ---------------------------------- Requests ---------------------------------- */

  function renderRequests() {
    const tbody = document.querySelector('#requestTable tbody');
    const requests = ZP.data.requests.slice().sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">No requests yet.</td></tr>`;
    } else {
      tbody.innerHTML = requests.map(r => {
        const c = zpGetCustomer(r.customerId);
        const actionable = r.status === 'submitted' || r.status === 'reviewing';
        return `<tr>
          <td>${c ? c.company : '—'}</td>
          <td>${r.title}</td>
          <td>${zpCategoryIcon(r.category)} ${zpCategoryLabel(r.category)}</td>
          <td>${zpFormatDate(r.submittedDate)}</td>
          <td>${r.budgetRange}</td>
          <td>${zpBadge(r.status)}</td>
          <td>${actionable ? `<button class="btn btn-secondary btn-sm" data-review="${r.id}">Review</button>` : ''}</td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('[data-review]').forEach(btn => {
        btn.addEventListener('click', () => openQuoteModal(btn.getAttribute('data-review')));
      });
    }
    refreshPendingBadge();
  }

  let activeRequestId = null;

  /* ---------------------------------- Catalogue-driven quote form ---------------------------------- */

  function renderCheckGrid(containerId, items, type, groupName) {
    const container = document.getElementById(containerId);
    container.innerHTML = items.map((item, i) => {
      const value = typeof item === 'string' ? item : item.id;
      const label = typeof item === 'string' ? item : item.label;
      const id = groupName + '_' + i;
      return `<div class="check-pill">
        <input type="${type}" name="${groupName}" id="${id}" value="${value}">
        <label for="${id}">${label}</label>
      </div>`;
    }).join('');
  }
  function getCheckedValues(groupName) {
    return Array.from(document.querySelectorAll(`input[name="${groupName}"]:checked`)).map(el => el.value);
  }
  function getRadioValue(groupName) {
    const el = document.querySelector(`input[name="${groupName}"]:checked`);
    return el ? el.value : null;
  }
  function clearCheckGroup(groupName) {
    document.querySelectorAll(`input[name="${groupName}"]`).forEach(el => { el.checked = false; });
  }

  function updateHostingPlans() {
    const provider = zpCatProvider(document.getElementById('q_hostingProvider').value);
    const sel = document.getElementById('q_hostingPlan');
    sel.innerHTML = provider
      ? provider.plans.map(p => `<option value="${p.id}">${p.label} — ${p.specs}</option>`).join('')
      : '<option value="">— Select a provider first —</option>';
  }

  function updatePlatformDependent() {
    const platform = zpCatPlatform(document.getElementById('q_platform').value);
    const wrap = document.getElementById('dataBackendFieldWrap');
    const sel = document.getElementById('q_dataBackend');
    if (platform && platform.dataBackends) {
      wrap.style.display = '';
      sel.innerHTML = '<option value="">— None —</option>' + platform.dataBackends.map(id => `<option value="${id}">${zpCatDataBackend(id).label}</option>`).join('');
    } else {
      wrap.style.display = 'none';
      sel.innerHTML = '<option value="">— None —</option>';
    }
  }

  function toggleCategorySections() {
    const cat = document.getElementById('q_category').value;
    document.getElementById('hostingFieldsRow').style.display = cat === 'infrastructure' ? '' : 'none';
    document.getElementById('platformFieldRow').style.display = (cat === 'infrastructure' || cat === 'software-platform') ? '' : 'none';
    document.getElementById('techStackSection').style.display = cat === 'custom-development' ? '' : 'none';
  }

  function initCatalogueFields() {
    document.getElementById('q_hostingProvider').innerHTML = '<option value="">— None —</option>' + ZP_CATALOGUE.hostingProviders.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
    document.getElementById('q_hostingProvider').addEventListener('change', updateHostingPlans);

    document.getElementById('q_platform').innerHTML = '<option value="">— None / fully custom —</option>' + ZP_CATALOGUE.platforms.map(p => `<option value="${p.id}">${p.label}</option>`).join('');
    document.getElementById('q_platform').addEventListener('change', updatePlatformDependent);

    renderCheckGrid('q_deviceTypes', ZP_CATALOGUE.deviceTypes, 'checkbox', 'q_deviceTypes');
    renderCheckGrid('q_osTargets', ZP_CATALOGUE.osTargets, 'checkbox', 'q_osTargets');
    renderCheckGrid('q_connectivity', ZP_CATALOGUE.connectivityModes, 'radio', 'q_connectivity');
    Object.keys(ZP_TECH_LAYER_LABEL).forEach(layer => renderCheckGrid('q_stack_' + layer, ZP_CATALOGUE.techStack[layer], 'checkbox', 'q_stack_' + layer));

    document.getElementById('q_category').addEventListener('change', toggleCategorySections);
    document.getElementById('q_assignee').innerHTML = '<option value="">— Unassigned —</option>' + ZP.data.teamUsers.map(t => `<option value="${t.id}">${t.name} — ${t.role}</option>`).join('');
  }
  initCatalogueFields();

  function openQuoteModal(reqId) {
    const r = ZP.data.requests.find(r => r.id === reqId);
    if (!r) return;
    activeRequestId = reqId;
    const c = zpGetCustomer(r.customerId);

    document.getElementById('quoteRequestSummary').innerHTML = `
      <div class="alert alert-info" style="margin-bottom:20px;">
        <div>
          <strong>${c.company}</strong> — ${r.title}<br>
          <span style="font-size:0.85rem;">${r.description}</span><br>
          <span style="font-size:0.8rem;opacity:0.85;">Budget: ${r.budgetRange} · Timeline: ${r.timeline} · Priority: ${r.priority || 'normal'}${r.extras && r.extras.length ? '<br>' + r.extras.join(' · ') : ''}</span>
        </div>
      </div>
    `;

    document.getElementById('q_name').value = r.title;
    document.getElementById('q_category').value = r.category;
    document.getElementById('q_hostingProvider').value = '';
    updateHostingPlans();
    document.getElementById('q_platform').value = '';
    updatePlatformDependent();
    clearCheckGroup('q_deviceTypes');
    clearCheckGroup('q_osTargets');
    clearCheckGroup('q_connectivity');
    Object.keys(ZP_TECH_LAYER_LABEL).forEach(layer => clearCheckGroup('q_stack_' + layer));
    toggleCategorySections();

    document.getElementById('q_model').value = r.category === 'custom-development' ? 'one-time' : 'recurring';
    document.getElementById('q_cycle').value = 'monthly';
    document.getElementById('q_cost').value = '';
    document.getElementById('q_price').value = '';
    document.getElementById('q_createInvoice').checked = true;
    toggleCycleField();

    document.getElementById('q_assignee').value = '';
    document.getElementById('q_priority').value = r.priority || 'normal';
    const due = new Date(ZP_TODAY);
    due.setDate(due.getDate() + 21);
    document.getElementById('q_dueDate').value = due.toISOString().slice(0, 10);

    document.getElementById('quoteModal').classList.add('open');
  }

  function toggleCycleField() {
    document.getElementById('q_cycleField').style.display = document.getElementById('q_model').value === 'recurring' ? '' : 'none';
  }
  document.getElementById('q_model').addEventListener('change', toggleCycleField);

  document.getElementById('quoteSubmitBtn').addEventListener('click', () => {
    const r = ZP.data.requests.find(r => r.id === activeRequestId);
    if (!r) return;

    const name = document.getElementById('q_name').value.trim();
    const category = document.getElementById('q_category').value;
    const hostingProvider = document.getElementById('q_hostingProvider').value || null;
    const hostingPlan = hostingProvider ? (document.getElementById('q_hostingPlan').value || null) : null;
    const platform = document.getElementById('q_platform').value || null;
    const dataBackend = document.getElementById('q_dataBackend').value || null;
    const deviceTypes = getCheckedValues('q_deviceTypes');
    const osTargets = getCheckedValues('q_osTargets');
    const connectivity = getRadioValue('q_connectivity');
    const model = document.getElementById('q_model').value;
    const cycle = model === 'recurring' ? document.getElementById('q_cycle').value : null;
    const ourCost = parseFloat(document.getElementById('q_cost').value);
    const customerPrice = parseFloat(document.getElementById('q_price').value);
    const createInvoice = document.getElementById('q_createInvoice').checked;
    const assigneeId = document.getElementById('q_assignee').value || null;
    const priority = document.getElementById('q_priority').value;
    const dueDate = document.getElementById('q_dueDate').value || null;

    if (!name || isNaN(ourCost) || isNaN(customerPrice)) return;

    const techStack = category === 'custom-development' ? {
      frontend: getCheckedValues('q_stack_frontend'),
      backend: getCheckedValues('q_stack_backend'),
      database: getCheckedValues('q_stack_database'),
      infraAddons: getCheckedValues('q_stack_infraAddons'),
      integrations: getCheckedValues('q_stack_integrations')
    } : null;

    const config = { hostingProvider, hostingPlan, platform, dataBackend, deviceTypes, osTargets, connectivity, techStack };

    // Build the customer-facing "stack" chip list from whichever parts of the config are populated.
    const stack = [];
    if (hostingProvider) stack.push(zpCatProvider(hostingProvider).label);
    if (platform) stack.push(zpCatPlatform(platform).label);
    if (dataBackend) stack.push(zpCatDataBackend(dataBackend).label);
    if (techStack) Object.values(techStack).forEach(items => stack.push(...items));

    const providerLabel = hostingProvider ? zpCatProvider(hostingProvider).label : (platform ? zpCatPlatform(platform).label : null);
    const planLabel = hostingPlan ? zpCatPlan(hostingProvider, hostingPlan).label : null;

    const svcId = 'svc-' + Date.now().toString().slice(-6);
    const today = ZP_TODAY.toISOString().slice(0, 10);
    const nextRenewal = new Date(ZP_TODAY);
    nextRenewal.setMonth(nextRenewal.getMonth() + (cycle === 'yearly' ? 12 : 1));

    const newService = {
      id: svcId, customerId: r.customerId, name, category,
      provider: providerLabel, plan: planLabel,
      stack: stack.length ? stack : ['To be scoped'],
      status: category === 'custom-development' ? 'in-development' : 'provisioning',
      deployedDate: null,
      description: r.description,
      billing: model === 'recurring'
        ? { model: 'recurring', cycle, ourCost, customerPrice, currency: 'USD', nextRenewal: nextRenewal.toISOString().slice(0, 10) }
        : { model: 'one-time', ourCost, customerPrice, currency: 'USD' },
      milestones: category === 'custom-development' ? [
        { name: 'Discovery & Requirements', status: 'completed', date: today },
        { name: 'Development', status: 'in-progress', date: null },
        { name: 'QA & UAT', status: 'pending', date: null },
        { name: 'Go-Live & Handover', status: 'pending', date: null }
      ] : null,
      config,
      accounts: []
    };
    ZP.data.services.push(newService);

    ZP.data.tasks.push({
      id: 'task-' + Date.now().toString().slice(-6), serviceId: svcId, customerId: r.customerId,
      title: name, assigneeId, status: 'todo', priority,
      createdDate: today, dueDate, completedDate: null, blockedReason: null,
      checklist: zpDefaultChecklist(category), notes: []
    });

    if (createInvoice) {
      const amount = model === 'recurring' ? customerPrice : Math.round(customerPrice * 0.3 * 100) / 100;
      const due = new Date(ZP_TODAY);
      due.setDate(due.getDate() + 7);
      const invId = 'INV-' + ZP_TODAY.getFullYear() + '-' + Date.now().toString().slice(-4);
      ZP.data.invoices.push({
        id: invId, customerId: r.customerId, serviceId: svcId,
        issueDate: today, dueDate: due.toISOString().slice(0, 10),
        status: 'unpaid', paidDate: null, currency: 'USD',
        items: [{ desc: model === 'recurring' ? `${name} — First cycle (${cycle})` : `${name} — Deposit (30%)`, qty: 1, unitPrice: amount }]
      });
    }

    r.status = 'converted';
    zpPersist();

    document.getElementById('quoteModal').classList.remove('open');
    renderRequests();
    renderCustomers();
    renderOverview();
    renderTasks();
  });

  document.getElementById('declineBtn').addEventListener('click', () => {
    const r = ZP.data.requests.find(r => r.id === activeRequestId);
    if (!r) return;
    r.status = 'rejected';
    zpPersist();
    document.getElementById('quoteModal').classList.remove('open');
    renderRequests();
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById(btn.getAttribute('data-close')).classList.remove('open'));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });
  });

  refreshPendingBadge();
  showView(initialView);
});
