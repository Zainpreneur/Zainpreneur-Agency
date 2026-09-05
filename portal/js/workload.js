/* =========================================================================
   Zainpreneur Agency — Team Workload (SRS v2 §10 team)
   Agency oversight of member load: open/blocked/due-soon counts, capacity
   bars, and the full open-work table. Read-only; assignment happens in the
   quote flow and Users admin.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'agency', active: 'workload' });
  if (!session) return;

  const DAY = 24 * 60 * 60 * 1000;
  const members = ZP.data.teamUsers.filter(m => m.active !== false);
  const openTasks = ZP.data.tasks.filter(t => t.status !== 'done');
  const blocked = openTasks.filter(t => t.status === 'blocked');
  const dueSoon = openTasks.filter(t => {
    if (!t.dueDate) return false;
    const away = Math.ceil((new Date(t.dueDate) - ZP_TODAY) / DAY);
    return away >= 0 && away <= 7;
  });
  const unassigned = openTasks.filter(t => !t.assigneeId);

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile"><div class="label">Open Tasks</div><div class="value">${openTasks.length}</div></div>
    <div class="stat-tile"><div class="label">Blocked</div><div class="value">${blocked.length}</div><div class="foot ${blocked.length ? 'danger' : ''}">${blocked.length ? 'needs customer nudge' : 'nothing blocked'}</div></div>
    <div class="stat-tile"><div class="label">Due This Week</div><div class="value">${dueSoon.length}</div></div>
    <div class="stat-tile"><div class="label">Unassigned</div><div class="value">${unassigned.length}</div><div class="foot ${unassigned.length ? 'danger' : ''}">${unassigned.length ? 'assign in quote flow' : 'all covered'}</div></div>
  `;

  /* --- per-member load --- */
  const loads = members.map(m => {
    const mine = openTasks.filter(t => t.assigneeId === m.id);
    return {
      member: m,
      open: mine.length,
      blocked: mine.filter(t => t.status === 'blocked').length,
      week: mine.filter(t => {
        if (!t.dueDate) return false;
        const away = Math.ceil((new Date(t.dueDate) - ZP_TODAY) / DAY);
        return away >= 0 && away <= 7;
      }).length
    };
  }).sort((a, b) => b.open - a.open);
  const max = Math.max(1, ...loads.map(l => l.open));

  document.getElementById('loadBody').innerHTML = loads.map(l => `
    <div style="margin-bottom:16px;">
      <div class="flex-between" style="margin-bottom:4px;font-size:0.88rem;">
        <div><strong>${l.member.name}</strong> <span class="text-muted">· ${l.member.role}</span></div>
        <span>${l.open} open${l.blocked ? ` · <span style="color:var(--danger);font-weight:600;">${l.blocked} blocked</span>` : ''}${l.week ? ` · ${l.week} due this week` : ''}</span>
      </div>
      <div class="progress-bar"><span style="width:${Math.round((l.open / max) * 100)}%;${l.blocked ? 'background:var(--danger);' : ''}"></span></div>
    </div>`).join('') || `<div class="empty-state">No active team members.</div>`;

  /* --- open work table --- */
  const tbody = document.querySelector('#workTable tbody');
  const rows = openTasks.slice().sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
  tbody.innerHTML = rows.map(t => {
    const c = zpGetCustomer(t.customerId);
    const a = zpGetTeamMember(t.assigneeId);
    return `<tr>
      <td>${t.title}</td>
      <td>${c ? c.company : '—'}</td>
      <td>${a ? a.name : '<span class="text-muted">Unassigned</span>'}</td>
      <td><span class="priority-pill ${t.priority}">${t.priority}</span></td>
      <td>${zpFormatDate(t.dueDate)}</td>
      <td>${zpBadge(t.status)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" class="table-empty">No open work. 🎉</td></tr>`;
});
