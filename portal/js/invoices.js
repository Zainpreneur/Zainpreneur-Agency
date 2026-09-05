document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'invoices' });
  if (!session) return;

  const customer = session.record;
  const allInvoices = zpGetInvoicesForCustomer(customer.id)
    .slice()
    .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));

  let activeStatus = 'all';

  /* --- Summary stat tiles --- */
  const totalPaid = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + zpInvoiceTotal(i), 0);
  const totalOutstanding = allInvoices.filter(i => zpEffectiveInvoiceStatus(i) !== 'paid').reduce((s, i) => s + zpInvoiceTotal(i), 0);
  const overdue = allInvoices.filter(i => zpEffectiveInvoiceStatus(i) === 'overdue');
  const totalOverdue = overdue.reduce((s, i) => s + zpInvoiceTotal(i), 0);

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile"><div class="label">Total Paid</div><div class="value">${zpFormatCurrency(totalPaid)}</div></div>
    <div class="stat-tile"><div class="label">Outstanding</div><div class="value">${zpFormatCurrency(totalOutstanding)}</div></div>
    <div class="stat-tile"><div class="label">Overdue</div><div class="value">${zpFormatCurrency(totalOverdue)}</div><div class="foot ${overdue.length ? 'danger' : ''}">${overdue.length} invoice${overdue.length === 1 ? '' : 's'}</div></div>
    <div class="stat-tile"><div class="label">Total Invoices</div><div class="value">${allInvoices.length}</div></div>
  `;

  const tabs = document.getElementById('statusTabs');
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.getAttribute('data-status');
    render();
  });

  const tbody = document.querySelector('#invoiceTable tbody');

  function render() {
    const filtered = allInvoices.filter(i => activeStatus === 'all' || zpEffectiveInvoiceStatus(i) === activeStatus);
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No invoices in this view.</td></tr>`;
      return;
    }
    tbody.innerHTML = filtered.map(inv => {
      const svc = zpGetService(inv.serviceId);
      const status = zpEffectiveInvoiceStatus(inv);
      return `<tr class="clickable" data-inv="${inv.id}">
        <td>${inv.id}</td>
        <td>${svc ? svc.name : '—'}</td>
        <td>${zpFormatDate(inv.issueDate)}</td>
        <td>${zpFormatDate(inv.dueDate)}</td>
        <td>${zpFormatCurrency(zpInvoiceTotal(inv), inv.currency)}</td>
        <td>${zpBadge(status)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-inv]').forEach(row => {
      row.addEventListener('click', () => openInvoice(row.getAttribute('data-inv')));
    });
  }

  const modal = document.getElementById('invoiceModal');
  document.getElementById('modalClose').addEventListener('click', closeInvoice);
  document.getElementById('modalCloseBtn').addEventListener('click', closeInvoice);
  modal.addEventListener('click', e => { if (e.target === modal) closeInvoice(); });
  document.getElementById('printBtn').addEventListener('click', () => window.print());

  function openInvoice(id) {
    const inv = zpGetInvoice(id);
    if (!inv) return;
    const svc = zpGetService(inv.serviceId);
    const status = zpEffectiveInvoiceStatus(inv);
    const total = zpInvoiceTotal(inv);

    document.getElementById('printArea').innerHTML = `
      <div class="invoice-doc">
        <div class="inv-head">
          <div>
            <div class="inv-brand">Zainpreneur Agency</div>
            <div class="text-muted" style="font-size:0.82rem;">Software deployment &amp; business automation</div>
          </div>
          <div class="inv-meta">
            <div class="num">${inv.id}</div>
            <div>Issued ${zpFormatDate(inv.issueDate)}</div>
            <div>Due ${zpFormatDate(inv.dueDate)}</div>
            <div style="margin-top:6px;">${zpBadge(status)}</div>
          </div>
        </div>
        <div class="inv-parties">
          <div>
            <h4>Billed To</h4>
            <div><strong>${customer.company}</strong></div>
            <div class="text-muted">${customer.contact}</div>
            <div class="text-muted">${customer.email}</div>
          </div>
          <div>
            <h4>Service</h4>
            <div><strong>${svc ? svc.name : '—'}</strong></div>
            <div class="text-muted">${svc ? zpCategoryLabel(svc.category) : ''}</div>
          </div>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            ${inv.items.map(it => `<tr><td>${it.desc}</td><td>${it.qty}</td><td>${zpFormatCurrency(it.unitPrice, inv.currency)}</td><td>${zpFormatCurrency(it.qty * it.unitPrice, inv.currency)}</td></tr>`).join('')}
          </tbody>
        </table>
        <div class="inv-totals">
          <table>
            <tr><td>Subtotal</td><td>${zpFormatCurrency(total, inv.currency)}</td></tr>
            <tr class="grand"><td>Total Due</td><td>${zpFormatCurrency(total, inv.currency)}</td></tr>
          </table>
        </div>
        ${inv.status === 'paid' ? `<p class="text-muted" style="margin-top:10px;">✅ Paid on ${zpFormatDate(inv.paidDate)}.</p>` : ''}
      </div>
    `;
    modal.classList.add('open');
  }

  function closeInvoice() { modal.classList.remove('open'); }

  render();
});
