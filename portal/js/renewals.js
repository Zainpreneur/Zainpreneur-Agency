/* =========================================================================
   Zainpreneur Agency — Renewals page (SRS v2 §9 renewals, §50)
   Merges service renewals and owned-asset renewals into one dated list
   with 30/60/90-day and custom range filters. Dates are derived, never
   stored redundantly.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'renewals' });
  if (!session) return;

  const customer = session.record;
  const DAY = 24 * 60 * 60 * 1000;
  let rangeDays = 'all';

  function daysAway(dateStr) {
    return Math.ceil((new Date(dateStr) - ZP_TODAY) / DAY);
  }

  function collect() {
    const rows = [];
    zpGetServicesForCustomer(customer.id).forEach(s => {
      if (s.billing.model === 'recurring' && s.billing.nextRenewal) {
        rows.push({
          name: s.name, kind: 'Agency service',
          date: s.billing.nextRenewal,
          cost: `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)} / ${s.billing.cycle}`,
          href: `services.html?svc=${s.id}`
        });
      }
    });
    zpGetAssetsForCustomer(customer.id).forEach(a => {
      if (a.billing.nextRenewalDate) {
        rows.push({
          name: `${a.name} — ${a.vendor}`, kind: 'Vendor software',
          date: a.billing.nextRenewalDate,
          cost: a.billing.cycle === 'one-time'
            ? zpFormatCurrency(a.billing.amount, a.billing.currency)
            : `${zpFormatCurrency(a.billing.amount, a.billing.currency)} / ${a.billing.cycle}`,
          href: 'software.html'
        });
      }
    });
    return rows
      .map(r => ({ ...r, away: daysAway(r.date) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  function inRange(r) {
    if (rangeDays === 'all') return r.away >= 0;
    if (rangeDays === 'custom') {
      const from = document.getElementById('customFrom').value || null;
      const to = document.getElementById('customTo').value || null;
      if (from && r.date < from) return false;
      if (to && r.date > to) return false;
      return true;
    }
    return r.away >= 0 && r.away <= Number(rangeDays);
  }

  function renderStats(rows) {
    const upcoming = rows.filter(r => r.away >= 0);
    const next30 = upcoming.filter(r => r.away <= 30).length;
    const next = upcoming[0] || null;
    document.getElementById('statGrid').innerHTML = `
      <div class="stat-tile"><div class="label">Upcoming Renewals</div><div class="value">${upcoming.length}</div></div>
      <div class="stat-tile"><div class="label">Due in 30 Days</div><div class="value">${next30}</div><div class="foot ${next30 ? 'danger' : ''}">${next30 ? 'needs attention' : 'all clear'}</div></div>
      <div class="stat-tile"><div class="label">Next Renewal</div><div class="value" style="font-size:1.1rem;">${next ? next.name : '—'}</div><div class="foot">${next ? zpFormatDate(next.date) + ' · ' + next.cost : ''}</div></div>
    `;
  }

  const tbody = document.querySelector('#renewalTable tbody');

  function render() {
    const rows = collect();
    renderStats(rows);
    const shown = rows.filter(inRange);
    if (!shown.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No renewals in this range.</td></tr>`;
      return;
    }
    tbody.innerHTML = shown.map(r => {
      const tone = r.away < 0 ? 'muted' : r.away <= 14 ? 'danger' : r.away <= 30 ? 'warning' : 'info';
      const away = r.away < 0 ? 'overdue' : r.away === 0 ? 'today' : `in ${r.away} day${r.away === 1 ? '' : 's'}`;
      return `<tr>
        <td><strong>${r.name}</strong></td>
        <td>${r.kind}</td>
        <td>${zpFormatDate(r.date)}</td>
        <td><span class="badge badge--${tone}">${away}</span></td>
        <td>${r.cost}</td>
        <td><a href="${r.href}" class="link">View →</a></td>
      </tr>`;
    }).join('');
  }

  const tabs = document.getElementById('rangeTabs');
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-days]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rangeDays = btn.getAttribute('data-days');
    document.getElementById('customRange').style.display = rangeDays === 'custom' ? 'flex' : 'none';
    render();
  });
  document.getElementById('customFrom').addEventListener('change', render);
  document.getElementById('customTo').addEventListener('change', render);

  render();
});
