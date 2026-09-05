document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'team', active: 'tasks' });
  if (!session) return;

  const member = session.record;
  const COLUMNS = [
    { status: 'todo', label: 'To Do' },
    { status: 'in-progress', label: 'In Progress' },
    { status: 'blocked', label: 'Blocked' },
    { status: 'in-review', label: 'In Review' },
    { status: 'done', label: 'Done' }
  ];

  function renderStats() {
    const s = zpTeamStats(member.id);
    document.getElementById('statGrid').innerHTML = `
      <div class="stat-tile"><div class="label">Assigned to Me</div><div class="value">${s.total}</div></div>
      <div class="stat-tile"><div class="label">In Progress</div><div class="value">${s.inProgress}</div></div>
      <div class="stat-tile"><div class="label">Blocked</div><div class="value">${s.blocked}</div><div class="foot ${s.blocked > 0 ? 'danger' : ''}">${s.blocked > 0 ? 'needs a customer nudge' : 'nothing blocked'}</div></div>
      <div class="stat-tile"><div class="label">Completed This Month</div><div class="value">${s.completedThisMonth}</div></div>
    `;
  }

  function renderBoard() {
    const tasks = zpGetTasksForAssignee(member.id);
    const board = document.getElementById('kanban');
    board.innerHTML = COLUMNS.map(col => {
      const colTasks = tasks.filter(t => t.status === col.status)
        .sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));
      const cards = colTasks.map(renderCard).join('') || `<div class="kanban-empty">Nothing here.</div>`;
      return `<div class="kanban-col">
        <div class="kanban-col-head"><h3>${col.label}</h3><span class="count">${colTasks.length}</span></div>
        ${cards}
      </div>`;
    }).join('');
    board.querySelectorAll('[data-task]').forEach(el => {
      el.addEventListener('click', () => openTask(el.getAttribute('data-task')));
    });
  }

  function renderCard(t) {
    const svc = zpGetService(t.serviceId);
    const cust = zpGetCustomer(t.customerId);
    const progress = zpTaskProgress(t);
    return `<button class="task-card priority-${t.priority}" data-task="${t.id}">
      <div class="tc-title">${t.title}</div>
      <div class="tc-meta">${cust ? cust.company : '—'} ${svc ? '· ' + zpCategoryIcon(svc.category) : ''}</div>
      <span class="priority-pill ${t.priority}">${t.priority}</span>
      <div class="tc-progress-label"><span>${progress.done}/${progress.total} steps</span><span>${t.dueDate ? 'Due ' + zpFormatDate(t.dueDate) : ''}</span></div>
      <div class="progress-bar" style="margin-top:4px;"><span style="width:${progress.pct}%"></span></div>
    </button>`;
  }

  /* ---------------------------------- Task detail ---------------------------------- */

  const modal = document.getElementById('taskModal');
  const modalTitle = document.getElementById('taskModalTitle');
  const modalBody = document.getElementById('taskModalBody');
  document.getElementById('taskModalClose').addEventListener('click', closeTask);
  modal.addEventListener('click', e => { if (e.target === modal) closeTask(); });

  let activeTaskId = null;

  function openTask(taskId) {
    const t = zpGetTask(taskId);
    if (!t) return;
    activeTaskId = taskId;
    const svc = zpGetService(t.serviceId);
    const cust = zpGetCustomer(t.customerId);
    const progress = zpTaskProgress(t);

    modalTitle.textContent = t.title;

    const blockedAlert = t.status === 'blocked'
      ? `<div class="alert alert-danger">🚧 <strong>Blocked:</strong> ${t.blockedReason || 'No reason logged.'}</div>` : '';

    const pendingAccounts = (svc && svc.accounts || []).filter(a => a.status === 'requested' || a.status === 'rotate-requested');
    const accountAlert = pendingAccounts.length
      ? `<div class="alert alert-warning">🔑 ${pendingAccounts.map(a => `${a.provider} (${a.purpose}) — ${zpStatusLabel(a.status)}`).join(' · ')}</div>` : '';

    const checklistHtml = `<ul class="checklist" id="checklistEl">
      ${t.checklist.map((c, i) => `<li class="${c.done ? 'done' : ''}">
        <input type="checkbox" data-idx="${i}" ${c.done ? 'checked' : ''}>
        <span>${c.text}</span>
      </li>`).join('')}
    </ul>`;

    const notesHtml = `<div class="note-list">
      ${t.notes.map(n => `<div class="note-item"><div class="n-meta">${n.author} · ${zpFormatDate(n.date)}</div>${n.text}</div>`).join('') || '<p class="text-muted" style="font-size:0.85rem;">No notes yet.</p>'}
    </div>
    <div class="field">
      <textarea id="newNoteText" placeholder="Add a note for the team…" style="min-height:60px;"></textarea>
    </div>
    <button type="button" class="btn btn-secondary btn-sm" id="addNoteBtn">Add Note</button>`;

    const statusActions = renderStatusActions(t.status);

    modalBody.innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <div>
          <div class="text-muted" style="font-size:0.82rem;">${cust ? cust.company : '—'}${svc ? ' · ' + svc.name : ''}</div>
        </div>
        ${zpBadge(t.status)}
      </div>
      ${blockedAlert}
      ${accountAlert}
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Priority</div><div class="v"><span class="priority-pill ${t.priority}">${t.priority}</span></div></div>
        <div class="kv"><div class="k">Due</div><div class="v">${zpFormatDate(t.dueDate)}</div></div>
        <div class="kv"><div class="k">Created</div><div class="v">${zpFormatDate(t.createdDate)}</div></div>
        <div class="kv"><div class="k">Completed</div><div class="v">${t.completedDate ? zpFormatDate(t.completedDate) : '—'}</div></div>
      </div>

      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Configuration</h3>
      ${svc && svc.config ? zpRenderConfigDetail(svc.config) : '<p class="text-muted" style="font-size:0.85rem;">No structured configuration on file for this service.</p>'}

      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Checklist — ${progress.done}/${progress.total} complete</h3>
      <div class="progress-bar" style="margin-bottom:12px;"><span style="width:${progress.pct}%"></span></div>
      ${checklistHtml}

      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Notes</h3>
      ${notesHtml}

      ${statusActions}
    `;
    modal.classList.add('open');
  }

  function renderStatusActions(status) {
    let actions = '';
    if (status === 'todo') {
      actions = `<button type="button" class="btn btn-primary btn-sm" data-status-action="start">Start Task</button>`;
    } else if (status === 'in-progress') {
      actions = `<button type="button" class="btn btn-secondary btn-sm" data-status-action="block">Mark Blocked</button>
                 <button type="button" class="btn btn-primary btn-sm" data-status-action="review">Submit for Review</button>`;
    } else if (status === 'blocked') {
      actions = `<button type="button" class="btn btn-primary btn-sm" data-status-action="resume">Resume Task</button>`;
    } else if (status === 'in-review') {
      actions = `<button type="button" class="btn btn-secondary btn-sm" data-status-action="back">Send Back to In Progress</button>
                 <button type="button" class="btn btn-primary btn-sm" data-status-action="done">Mark Done</button>`;
    } else {
      actions = `<button type="button" class="btn btn-secondary btn-sm" data-status-action="reopen">Reopen Task</button>`;
    }
    return `<div class="status-actions">${actions}</div>`;
  }

  modalBody.addEventListener('click', function (e) {
    const addNoteBtn = e.target.closest('#addNoteBtn');
    if (addNoteBtn) {
      const text = document.getElementById('newNoteText').value.trim();
      if (!text) return;
      const t = zpGetTask(activeTaskId);
      t.notes.push({ date: ZP_TODAY.toISOString().slice(0, 10), author: member.name, text });
      zpPersist();
      openTask(activeTaskId);
      return;
    }

    const statusBtn = e.target.closest('[data-status-action]');
    if (statusBtn) {
      const t = zpGetTask(activeTaskId);
      const action = statusBtn.getAttribute('data-status-action');
      const today = ZP_TODAY.toISOString().slice(0, 10);

      if (action === 'start') { t.status = 'in-progress'; }
      else if (action === 'block') {
        const reason = window.prompt('What is this task blocked on?', t.blockedReason || '');
        if (reason === null) return;
        t.status = 'blocked'; t.blockedReason = reason;
      }
      else if (action === 'resume') { t.status = 'in-progress'; t.blockedReason = null; }
      else if (action === 'review') { t.status = 'in-review'; }
      else if (action === 'back') { t.status = 'in-progress'; }
      else if (action === 'done') {
        t.status = 'done'; t.completedDate = today;
        t.checklist.forEach(c => c.done = true);
        applyCompletionToService(t);
      }
      else if (action === 'reopen') { t.status = 'in-progress'; t.completedDate = null; }

      zpPersist();
      openTask(activeTaskId);
      renderStats();
      renderBoard();
      return;
    }
  });

  modalBody.addEventListener('change', function (e) {
    if (e.target.matches('#checklistEl input[type="checkbox"]')) {
      const t = zpGetTask(activeTaskId);
      const idx = parseInt(e.target.getAttribute('data-idx'), 10);
      t.checklist[idx].done = e.target.checked;
      zpPersist();
      openTask(activeTaskId);
      renderBoard();
    }
  });

  /** When a task completes, reflect it on the linked service so the customer portal stays in sync. */
  function applyCompletionToService(task) {
    const svc = zpGetService(task.serviceId);
    if (!svc) return;
    const today = ZP_TODAY.toISOString().slice(0, 10);
    if ((svc.category === 'infrastructure' || svc.category === 'software-platform') && (svc.status === 'provisioning' || svc.status === 'in-development')) {
      svc.status = 'active';
      svc.deployedDate = svc.deployedDate || today;
    } else if (svc.category === 'custom-development' && svc.status === 'in-development') {
      svc.status = 'completed';
      svc.deployedDate = svc.deployedDate || today;
      if (svc.milestones) svc.milestones.forEach(m => { m.status = 'completed'; m.date = m.date || today; });
    }
  }

  function closeTask() { modal.classList.remove('open'); }

  /* ---------------------------------- Site visits ---------------------------------- */

  const visitModal = document.getElementById('visitModal');
  const visitModalTitle = document.getElementById('visitModalTitle');
  const visitModalBody = document.getElementById('visitModalBody');
  document.getElementById('visitModalClose').addEventListener('click', () => visitModal.classList.remove('open'));
  visitModal.addEventListener('click', e => { if (e.target === visitModal) visitModal.classList.remove('open'); });

  let activeVisitId = null;

  function renderVisits() {
    const upcoming = zpUpcomingVisitsForAssignee(member.id);
    const panel = document.getElementById('visitsPanel');
    if (upcoming.length === 0) { panel.style.display = 'none'; return; }
    panel.style.display = '';
    document.getElementById('visitsBody').innerHTML = upcoming.map(v => {
      const d = new Date(v.scheduledDate);
      const cust = zpGetCustomer(v.customerId);
      return `<button class="visit-card" data-visit="${v.id}">
        <div class="vc-date"><div class="day">${d.getDate()}</div><div class="mon">${d.toLocaleDateString('en-US', { month: 'short' })}</div></div>
        <div class="vc-main">
          <div class="vc-title">${v.title}</div>
          <div class="vc-meta">${cust ? cust.company : '—'} · ${v.address} · ${v.scheduledTime || ''}</div>
        </div>
        ${zpBadge(v.status)}
      </button>`;
    }).join('');
    document.querySelectorAll('[data-visit]').forEach(el => {
      el.addEventListener('click', () => openVisit(el.getAttribute('data-visit')));
    });
  }

  function openVisit(visitId) {
    const v = zpGetVisit(visitId);
    if (!v) return;
    activeVisitId = visitId;
    const cust = zpGetCustomer(v.customerId);
    const svc = zpGetService(v.serviceId);

    visitModalTitle.textContent = v.title;
    visitModalBody.innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <div class="text-muted" style="font-size:0.82rem;">${cust ? cust.company : '—'}${svc ? ' · ' + svc.name : ''}</div>
        ${zpBadge(v.status)}
      </div>
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Date</div><div class="v">${zpFormatDate(v.scheduledDate)}${v.scheduledTime ? ' · ' + v.scheduledTime : ''}</div></div>
        <div class="kv"><div class="k">Address</div><div class="v">${v.address}</div></div>
      </div>
      ${zpRenderMapEmbed(v.lat, v.lng, v.address)}
      <h3 style="margin:18px 0 8px;font-size:0.95rem;">On-Site Checklist</h3>
      <ul class="checklist" id="visitChecklist">
        ${v.checklist.map((c, i) => `<li class="${c.done ? 'done' : ''}"><input type="checkbox" data-vidx="${i}" ${c.done ? 'checked' : ''}><span>${c.text}</span></li>`).join('')}
      </ul>
      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Notes</h3>
      <div class="note-list">
        ${v.notes.map(n => `<div class="note-item"><div class="n-meta">${n.author} · ${zpFormatDate(n.date)}</div>${n.text}</div>`).join('') || '<p class="text-muted" style="font-size:0.85rem;">No notes yet.</p>'}
      </div>
      <div class="field"><textarea id="newVisitNoteText" placeholder="Add a note from the visit…" style="min-height:60px;"></textarea></div>
      <button type="button" class="btn btn-secondary btn-sm" id="addVisitNoteBtn">Add Note</button>
      <div class="status-actions">
        ${v.status === 'scheduled' ? '<button type="button" class="btn btn-primary btn-sm" id="markVisitDoneBtn">Mark Visit Completed</button>' : ''}
      </div>
    `;
    visitModal.classList.add('open');
  }

  visitModalBody.addEventListener('change', e => {
    if (e.target.matches('#visitChecklist input[type="checkbox"]')) {
      const v = zpGetVisit(activeVisitId);
      v.checklist[parseInt(e.target.getAttribute('data-vidx'), 10)].done = e.target.checked;
      zpPersist();
      openVisit(activeVisitId);
    }
  });

  visitModalBody.addEventListener('click', e => {
    if (e.target.closest('#addVisitNoteBtn')) {
      const text = document.getElementById('newVisitNoteText').value.trim();
      if (!text) return;
      const v = zpGetVisit(activeVisitId);
      v.notes.push({ date: ZP_TODAY.toISOString().slice(0, 10), author: member.name, text });
      zpPersist();
      openVisit(activeVisitId);
      return;
    }
    if (e.target.closest('#markVisitDoneBtn')) {
      const v = zpGetVisit(activeVisitId);
      v.status = 'completed';
      v.checklist.forEach(c => c.done = true);
      zpPersist();
      visitModal.classList.remove('open');
      renderVisits();
    }
  });

  renderStats();
  renderBoard();
  renderVisits();
});
