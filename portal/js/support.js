/* =========================================================================
   Zainpreneur Agency — Support & Requests page (SRS v2 §9 support)
   Dual-mode: mock store by default; live `/api/tickets` when Api.mode is
   rest (rows normalized to the mock shape; UUID ids work with ?ticket=
   links transparently).
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'support' });
  if (!session) return;

  const customer = session.record;
  const services = zpGetServicesForCustomer(customer.id);
  let activeStatus = 'all';
  let rows = [];
  let live = false;

  /* --- service picker --- */
  const serviceSelect = document.getElementById('t_service');
  serviceSelect.innerHTML = services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')
    + `<option value="">Other / general</option>`;

  function normalizeRest(t) {
    return {
      id: t.id, customerId: customer.id,
      serviceId: t.serviceRef || null,
      subject: t.subject, priority: t.priority || 'normal', status: t.status || 'open',
      createdDate: (t.createdAt || '').slice(0, 10), updatedDate: (t.updatedAt || '').slice(0, 10),
      messages: t.messages || []
    };
  }

  async function loadRows() {
    rows = zpGetTicketsForCustomer(customer.id);
    live = false;
    if (Api.mode === 'rest') {
      try {
        const items = await Api.rest.tickets.list('?customerRef=' + encodeURIComponent(customer.id));
        rows = items.map(normalizeRest);
        live = true;
      } catch (e) { /* fall through to mock */ }
    }
  }

  /* --- create --- */
  const alertBox = document.getElementById('formAlert');
  document.getElementById('ticketForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const subject = document.getElementById('t_subject').value.trim();
    const details = document.getElementById('t_details').value.trim();
    if (!subject || !details) return;

    const serviceId = serviceSelect.value || null;
    const priority = document.getElementById('t_priority').value;
    const today = ZP_TODAY.toISOString().slice(0, 10);

    if (live) {
      try {
        await Api.rest.tickets.create({
          customerRef: customer.id, serviceRef: serviceId, subject, priority,
          messages: [{ author: customer.contact, date: today, text: details }]
        });
      } catch (err) {
        alertBox.innerHTML = `<div class="alert alert-danger">Submit failed: ${err.message}</div>`;
        return;
      }
      await loadRows();
    } else {
      const maxId = ZP.data.tickets.reduce((m, t) => {
        const n = parseInt((t.id || '').slice(4), 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 3182);
      ZP.data.tickets.unshift({
        id: 'SUP-' + (maxId + 1),
        customerId: customer.id, serviceId,
        subject, priority, status: 'open',
        createdDate: today, updatedDate: today,
        messages: [{ author: customer.contact, date: today, text: details }]
      });
      zpPersist();
      await loadRows();
    }

    alertBox.innerHTML = `<div class="alert alert-success">✅ Request received! Your account manager, ${customer.accountManager}, will pick it up shortly.</div>`;
    document.getElementById('ticketForm').reset();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* --- filters --- */
  const tabs = document.getElementById('statusTabs');
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.getAttribute('data-status');
    render();
  });

  /* --- table --- */
  const tbody = document.querySelector('#ticketTable tbody');
  function render() {
    const tickets = rows
      .filter(t => activeStatus === 'all' || t.status === activeStatus)
      .slice()
      .sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
    if (tickets.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No requests in this view.</td></tr>`;
      return;
    }
    tbody.innerHTML = tickets.map(t => {
      const svc = t.serviceId ? zpGetService(t.serviceId) : null;
      return `<tr class="clickable" data-ticket="${t.id}">
        <td>${t.id}</td>
        <td>${t.subject}</td>
        <td>${svc ? svc.name : 'General'}</td>
        <td><span class="priority-pill ${t.priority}">${t.priority}</span></td>
        <td>${zpFormatDate(t.updatedDate)}</td>
        <td>${zpBadge(t.status)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-ticket]').forEach(row => {
      row.addEventListener('click', () => openTicket(row.getAttribute('data-ticket')));
    });
  }

  /* --- detail + reply --- */
  const modal = document.getElementById('ticketModal');
  document.getElementById('ticketModalClose').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  function findRow(id) { return rows.find(t => String(t.id) === String(id)) || null; }

  function openTicket(ticketId) {
    const t = findRow(ticketId);
    if (!t) return;
    const svc = t.serviceId ? zpGetService(t.serviceId) : null;

    document.getElementById('ticketModalTitle').textContent = t.id + ' — ' + t.subject;
    document.getElementById('ticketModalBody').innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <span class="text-muted" style="font-size:0.82rem;">${svc ? svc.name : 'General'} · Opened ${zpFormatDate(t.createdDate)}</span>
        ${zpBadge(t.status)}
      </div>
      <div class="note-list">
        ${t.messages.map(m => `<div class="note-item"><div class="n-meta">${m.author} · ${zpFormatDate(m.date)}</div>${m.text}</div>`).join('')}
      </div>
      ${t.status === 'resolved'
        ? `<p class="text-muted" style="font-size:0.85rem;">✅ Marked resolved. Reply below and we'll reopen it.</p>`
        : ''}
      <div class="field"><textarea id="replyText" placeholder="Write a reply…" style="min-height:60px;"></textarea></div>
      <button type="button" class="btn btn-primary btn-sm" id="replyBtn">Send Reply</button>
    `;
    document.getElementById('replyBtn').addEventListener('click', async () => {
      const text = document.getElementById('replyText').value.trim();
      if (!text) return;
      const today = ZP_TODAY.toISOString().slice(0, 10);
      const messages = t.messages.concat([{ author: customer.contact, date: today, text }]);
      const status = t.status === 'resolved' ? 'open' : t.status;
      if (live) {
        try {
          const updated = await Api.rest.tickets.update(t.id, { messages, status });
          Object.assign(t, normalizeRest(updated));
        } catch (err) {
          alertBox.innerHTML = `<div class="alert alert-danger">Reply failed: ${err.message}</div>`;
          return;
        }
      } else {
        const stored = zpGetTicket(t.id);
        if (stored) {
          stored.messages = messages;
          stored.status = status;
          stored.updatedDate = today;
          zpPersist();
        }
        t.messages = messages;
        t.status = status;
        t.updatedDate = today;
      }
      openTicket(t.id);
      render();
    });
    modal.classList.add('open');
  }

  loadRows().then(() => {
    render();
    // Deep link support: support.html?ticket=SUP-3182 (or live UUID)
    const preselect = new URLSearchParams(window.location.search).get('ticket');
    if (preselect) openTicket(preselect);
  });
});
