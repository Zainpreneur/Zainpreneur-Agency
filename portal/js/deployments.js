/* =========================================================================
   Zainpreneur Agency — Client Portal Deployments & Projects page
   Project cards are derived from real service + task data: services that
   carry milestones (custom development) or sit in a delivery status
   (provisioning / in-development / paused) count as projects.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'deployments' });
  if (!session) return;

  const customer = session.record;
  const services = zpGetServicesForCustomer(customer.id);
  const tasks = ZP.data.tasks.filter(t => t.customerId === customer.id);

  const DELIVERY_STATUSES = ['provisioning', 'in-development', 'paused'];

  function isProject(s) {
    return (s.milestones && s.milestones.length > 0) || DELIVERY_STATUSES.indexOf(s.status) !== -1;
  }

  function projectProgress(s) {
    if (s.milestones && s.milestones.length > 0) {
      const done = s.milestones.filter(m => m.status === 'completed').length;
      return { done, total: s.milestones.length, pct: Math.round((done / s.milestones.length) * 100) };
    }
    const linked = tasks.filter(t => t.serviceId === s.id);
    const done = linked.filter(t => t.status === 'done').length;
    return { done, total: linked.length, pct: linked.length ? Math.round((done / linked.length) * 100) : 0 };
  }

  function isDone(s) {
    if (s.status === 'completed') return true;
    const p = projectProgress(s);
    return p.total > 0 && p.done === p.total;
  }

  const projects = services.filter(isProject);
  const active = projects.filter(s => !isDone(s));
  const done = projects.filter(isDone);
  const openTasks = tasks.filter(t => t.status !== 'done');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  /* --- Stat tiles --- */
  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile"><div class="label">Projects In Progress</div><div class="value">${active.length}</div></div>
    <div class="stat-tile"><div class="label">Open Tasks</div><div class="value">${openTasks.length}</div><div class="foot ${blockedTasks.length ? 'danger' : ''}">${blockedTasks.length ? blockedTasks.length + ' blocked' : 'nothing blocked'}</div></div>
    <div class="stat-tile"><div class="label">Completed Projects</div><div class="value">${done.length}</div></div>
    <div class="stat-tile"><div class="label">Account Manager</div><div class="value" style="font-size:1.1rem;">${customer.accountManager}</div></div>
  `;

  function renderCard(s) {
    const p = projectProgress(s);
    const linked = tasks.filter(t => t.serviceId === s.id && t.status !== 'done');
    const priceLabel = s.billing.model === 'recurring'
      ? `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)}<span class="cycle">/${s.billing.cycle === 'monthly' ? 'mo' : s.billing.cycle}</span>`
      : `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)}<span class="cycle"> one-time</span>`;

    const milestonesHtml = s.milestones ? `
      <ul class="timeline" style="margin-top:14px;">
        ${s.milestones.map(m => `<li class="${m.status === 'completed' ? 'done' : (m.status === 'in-progress' ? 'active' : '')}">
          <div class="t-name">${m.name}</div>
          <div class="t-date">${zpStatusLabel(m.status)}${m.date ? ' · ' + zpFormatDate(m.date) : ''}</div>
        </li>`).join('')}
      </ul>` : '';

    const tasksHtml = linked.length ? `
      <h3 style="margin:16px 0 8px;font-size:0.9rem;">Open Tasks (${linked.length})</h3>
      <div class="table-wrap"><table class="zp-table">
        <thead><tr><th>Task</th><th>Assignee</th><th>Due</th><th>Status</th></tr></thead>
        <tbody>${linked.map(t => {
          const member = zpGetTeamMember(t.assigneeId);
          return `<tr><td>${t.title}</td><td>${member ? member.name : '—'}</td><td>${zpFormatDate(t.dueDate)}</td><td>${zpBadge(t.status)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>` : '';

    return `<div class="panel" style="margin-bottom:18px;">
      <div class="panel-header">
        <h2>${zpCategoryIcon(s.category)} ${s.name}</h2>
        ${zpBadge(s.status)}
      </div>
      <div class="panel-body">
        <div class="flex-between" style="margin-bottom:6px;font-size:0.85rem;">
          <span class="text-muted">${p.done}/${p.total} ${s.milestones ? 'milestones' : 'tasks'} complete</span>
          <span><strong>${priceLabel}</strong></span>
        </div>
        <div class="progress-bar"><span style="width:${p.pct}%"></span></div>
        ${s.stack && s.stack.length ? `<div style="margin-top:12px;">${s.stack.map(t => `<span class="chip">${t}</span>`).join('')}</div>` : ''}
        ${milestonesHtml}
        ${tasksHtml}
        <div style="margin-top:14px;"><a href="services.html?svc=${s.id}" class="link">View service details →</a></div>
      </div>
    </div>`;
  }

  const emptyHtml = `<div class="empty-state"><div class="icon">🚀</div>Nothing here yet. <a href="request-service.html">Request a service →</a></div>`;
  document.getElementById('activeProjects').innerHTML = active.length ? active.map(renderCard).join('') : emptyHtml;
  document.getElementById('doneProjects').innerHTML = done.length ? done.map(renderCard).join('') : `<div class="empty-state"><div class="icon">✅</div>No completed projects yet.</div>`;
});
