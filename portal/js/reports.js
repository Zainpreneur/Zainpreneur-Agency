/* =========================================================================
   Zainpreneur Agency — Reports (SRS v2 §10 reports, §86 charts)
   Dependency-free SVG charts (offline-safe by design — no CDN). All
   figures derive from live store data via the existing stats helpers.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'agency', active: 'reports' });
  if (!session) return;

  const BAR = '#2563eb';

  function hbar(rows, valueFmt) {
    const max = Math.max(1, ...rows.map(r => r.value));
    return rows.map(r => `
      <div style="margin-bottom:12px;">
        <div class="flex-between" style="margin-bottom:4px;font-size:0.85rem;">
          <strong>${r.label}</strong><span>${valueFmt(r.value)}</span>
        </div>
        <div class="progress-bar"><span style="width:${Math.round((r.value / max) * 100)}%;background:${BAR};"></span></div>
      </div>`).join('') || `<div class="empty-state">Nothing to show yet.</div>`;
  }

  function vbar(rows, valueFmt) {
    const max = Math.max(1, ...rows.map(r => r.value));
    const W = 64, GAP = 18, H = 140, TOP = 24;
    const width = rows.length * (W + GAP) + GAP;
    const bars = rows.map((r, i) => {
      const h = Math.round((r.value / max) * (H - TOP));
      const x = GAP + i * (W + GAP);
      const y = H - h;
      return `<g>
        <text x="${x + W / 2}" y="14" text-anchor="middle" font-size="12" font-weight="700">${valueFmt(r.value)}</text>
        <rect x="${x}" y="${y}" width="${W}" height="${h}" rx="4" fill="${BAR}" opacity="${0.45 + 0.55 * (r.value / max)}"></rect>
        <text x="${x + W / 2}" y="${H + 16}" text-anchor="middle" font-size="11">${r.label}</text>
      </g>`;
    }).join('');
    return `<svg viewBox="0 0 ${width} ${H + 24}" style="width:100%;max-width:${width}px;" role="img">${bars}</svg>`;
  }

  /* --- tiles --- */
  const s = zpAgencyStats();
  const openTasks = ZP.data.tasks.filter(t => t.status !== 'done').length;
  const staleTools = Object.values(ZP.data.catalogueTools || {}).filter(zpIsToolStale).length;
  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile"><div class="label">MRR</div><div class="value">${zpFormatCurrency(s.mrr)}</div><div class="foot good">Margin ${zpFormatCurrency(s.monthlyMargin)}/mo</div></div>
    <div class="stat-tile"><div class="label">One-time Booked</div><div class="value">${zpFormatCurrency(s.oneTimeRevenue)}</div><div class="foot good">Margin ${zpFormatCurrency(s.oneTimeMargin)}</div></div>
    <div class="stat-tile"><div class="label">Outstanding AR</div><div class="value">${zpFormatCurrency(s.outstandingAR)}</div><div class="foot ${s.overdueAR > 0 ? 'danger' : ''}">${zpFormatCurrency(s.overdueAR)} overdue</div></div>
    <div class="stat-tile"><div class="label">Open Tasks</div><div class="value">${openTasks}</div><div class="foot">${s.pendingRequests} requests pending</div></div>
    <div class="stat-tile"><div class="label">Stale Catalogue Tools</div><div class="value">${staleTools}</div><div class="foot">>${zpSettings().catalogue.staleDays}d since verification</div></div>
  `;

  /* --- MRR by customer --- */
  const mrrRows = ZP.data.customers
    .map(c => ({ label: c.company, value: zpCustomerStats(c.id).monthlyRecurring }))
    .sort((a, b) => b.value - a.value);
  document.getElementById('mrrChart').innerHTML = hbar(mrrRows, v => zpFormatCurrency(v) + '/mo');

  /* --- services by status --- */
  const svcStatuses = ['provisioning', 'in-development', 'active', 'paused', 'completed', 'cancelled'];
  document.getElementById('serviceChart').innerHTML = vbar(
    svcStatuses.map(st => ({
      label: zpStatusLabel(st),
      value: ZP.data.services.filter(x => x.status === st).length
    })), v => String(v));

  /* --- tasks by status --- */
  const taskStatuses = ['todo', 'in-progress', 'blocked', 'in-review', 'done'];
  document.getElementById('taskChart').innerHTML = vbar(
    taskStatuses.map(st => ({
      label: zpStatusLabel(st),
      value: ZP.data.tasks.filter(t => t.status === st).length
    })), v => String(v));

  /* --- workload per member --- */
  document.getElementById('workloadChart').innerHTML = hbar(
    ZP.data.teamUsers.map(m => ({
      label: `${m.name} — ${m.role}`,
      value: zpGetTasksForAssignee(m.id).filter(t => t.status !== 'done').length
    })).sort((a, b) => b.value - a.value),
    v => `${v} open`);

  /* --- support & requests --- */
  const supRows = [
    { label: 'Open tickets', value: ZP.data.tickets.filter(t => t.status === 'open').length },
    { label: 'Tickets in progress', value: ZP.data.tickets.filter(t => t.status === 'in-progress').length },
    { label: 'Resolved tickets', value: ZP.data.tickets.filter(t => t.status === 'resolved').length },
    { label: 'Submitted requests', value: ZP.data.requests.filter(r => r.status === 'submitted').length },
    { label: 'Reviewing requests', value: ZP.data.requests.filter(r => r.status === 'reviewing').length },
    { label: 'Converted', value: ZP.data.requests.filter(r => r.status === 'converted').length }
  ];
  document.getElementById('supportChart').innerHTML = vbar(supRows, v => String(v));

  /* --- catalogue health --- */
  const tools = Object.values(ZP.data.catalogueTools || {});
  const stale = tools.filter(zpIsToolStale);
  document.getElementById('catalogueStats').innerHTML = `
    <div class="kv-list" style="margin-top:0;">
      <div class="kv"><div class="k">Tracked Tools</div><div class="v">${tools.length}</div></div>
      <div class="kv"><div class="k">Recently Verified</div><div class="v">${tools.length - stale.length}</div></div>
      <div class="kv"><div class="k">Needs Re-verification</div><div class="v">${stale.length ? stale.map(t => t.label).join(', ') : '—'}</div></div>
    </div>
    <div style="margin-top:12px;"><a href="catalogue.html" class="link">Open catalogue →</a></div>`;
});
