/* =========================================================================
   Zainpreneur Agency — notification center (SRS v2 §11 notifications)
   Derived feed: notifications are computed from live signals (access
   requests, overdue invoices, renewals, tickets, savings, tasks), never
   stored. Read/unread lives in sessionStorage. The account notification
   preference filters the feed (billing / critical subsets).
   ========================================================================= */

const ZP_NOTIF_KEY = 'zp_notif_read_v1';

function zpReadNotifs() {
  try { return JSON.parse(sessionStorage.getItem(ZP_NOTIF_KEY)) || {}; }
  catch (e) { return {}; }
}

function zpMarkNotifRead(id) {
  const read = zpReadNotifs();
  read[id] = true;
  try { sessionStorage.setItem(ZP_NOTIF_KEY, JSON.stringify(read)); } catch (e) { /* ignore */ }
}

/** Builds the derived feed for the session. Each item: {id, tone, title, sub, href}. */
function zpBuildFeed(session) {
  const feed = [];
  const push = (id, tone, title, sub, href) => feed.push({ id, tone, title, sub, href });

  if (session.type === 'customer') {
    const c = session.record;
    zpGetAllAccountsForCustomer(c.id)
      .filter(a => a.status === 'rotate-requested')
      .forEach(a => push('rot-' + a.id, 'danger', 'Rotate your ' + a.provider + ' password',
        a.serviceName + ' setup is complete', 'services.html?svc=' + a.serviceId));
    zpGetAllAccountsForCustomer(c.id)
      .filter(a => a.status === 'requested')
      .forEach(a => push('req-' + a.id, 'warning', 'Access needed: ' + a.provider,
        a.serviceName + ' setup is waiting', 'services.html?svc=' + a.serviceId));
    zpGetInvoicesForCustomer(c.id)
      .filter(i => zpEffectiveInvoiceStatus(i) === 'overdue')
      .forEach(i => push('ovd-' + i.id, 'danger', 'Invoice ' + i.id + ' overdue',
        zpFormatCurrency(zpInvoiceTotal(i), i.currency) + ' due ' + zpFormatDate(i.dueDate), 'invoices.html'));
    const stats = zpCustomerStats(c.id);
    stats.upcomingRenewals.slice(0, 3).forEach(n => push('ren-' + n.service.id, 'info',
      n.service.name + ' renews in ' + n.daysAway + ' day' + (n.daysAway === 1 ? '' : 's'),
      zpFormatDate(n.service.billing.nextRenewal), 'renewals.html'));
    zpGetTicketsForCustomer(c.id)
      .filter(t => t.status === 'in-progress')
      .forEach(t => push('tkt-' + t.id, 'info', t.id + ' in progress', t.subject, 'support.html?ticket=' + t.id));
    zpAllSavingsForCustomer(c.id).slice(0, 3).forEach(f => push('sav-' + f.assetId + '-' + f.type, 'success',
      'Save up to ' + zpFormatCurrency(f.estimatedAnnualSavings) + '/yr', f.message, 'software.html'));
  }

  if (session.type === 'agency') {
    ZP.data.requests
      .filter(r => r.status === 'submitted' || r.status === 'reviewing')
      .forEach(r => {
        const c = zpGetCustomer(r.customerId);
        push('areq-' + r.id, 'warning', 'Request awaiting quote: ' + r.title,
          (c ? c.company : '') + ' · ' + r.budgetRange, 'agency.html#requests');
      });
    ZP.data.tasks
      .filter(t => t.status === 'blocked')
      .forEach(t => {
        const c = zpGetCustomer(t.customerId);
        push('abk-' + t.id, 'danger', 'Blocked: ' + t.title,
          (c ? c.company : '') + ' · ' + (t.blockedReason || 'no reason logged'), 'agency.html#tasks');
      });
  }

  if (session.type === 'team') {
    const m = session.record;
    zpGetTasksForAssignee(m.id)
      .filter(t => t.status === 'blocked')
      .forEach(t => push('tbk-' + t.id, 'danger', 'Blocked: ' + t.title,
        t.blockedReason || 'no reason logged', 'team-dashboard.html'));
    zpUpcomingVisitsForAssignee(m.id).slice(0, 3).forEach(v => push('tvs-' + v.id, 'info',
      'Site visit: ' + v.title, zpFormatDate(v.scheduledDate) + (v.scheduledTime ? ' · ' + v.scheduledTime : ''),
      'team-dashboard.html'));
  }

  // Account preference filter (customer prefs; staff see everything).
  const pref = session.type === 'customer' && session.record.prefs
    ? session.record.prefs.notifications : 'all';
  if (pref === 'billing') {
    return feed.filter(n => ['ovd-', 'ren-'].some(p => n.id.indexOf(p) === 0));
  }
  if (pref === 'critical') {
    return feed.filter(n => n.tone === 'danger');
  }
  return feed;
}

function zpInitNotifications(session) {
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.getElementById('notifBtn')) return;

  const wrap = document.createElement('div');
  wrap.className = 'topbar-notif';
  wrap.innerHTML =
    '<button type="button" class="btn-icon" id="notifBtn" aria-label="Notifications">🔔<span class="notif-badge" id="notifBadge" style="display:none;"></span></button>' +
    '<div class="notif-panel" id="notifPanel" style="display:none;"></div>';
  topbar.appendChild(wrap);

  const btn = document.getElementById('notifBtn');
  const panel = document.getElementById('notifPanel');

  function unreadCount() {
    const read = zpReadNotifs();
    return zpBuildFeed(session).filter(n => !read[n.id]).length;
  }

  function paintBadge() {
    const badge = document.getElementById('notifBadge');
    const n = unreadCount();
    badge.style.display = n ? '' : 'none';
    badge.textContent = n > 9 ? '9+' : String(n);
  }

  function renderPanel() {
    const read = zpReadNotifs();
    const feed = zpBuildFeed(session);
    if (!feed.length) {
      panel.innerHTML = '<div class="sr-empty">All caught up. 🎉</div>';
      return;
    }
    panel.innerHTML =
      '<div class="notif-head"><strong>Notifications</strong>' +
      '<button type="button" class="btn-ghost" id="notifReadAll">Mark all read</button></div>' +
      feed.map(n =>
        '<a class="notif-item' + (read[n.id] ? ' read' : '') + '" href="' + n.href + '" data-notif="' + n.id + '">' +
        '<span class="notif-dot tone-' + n.tone + '"></span>' +
        '<span><span class="sr-label">' + n.title + '</span>' +
        '<span class="sr-sub">' + n.sub + '</span></span></a>'
      ).join('');
    const readAll = document.getElementById('notifReadAll');
    if (readAll) readAll.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      feed.forEach(n => zpMarkNotifRead(n.id));
      paintBadge();
      renderPanel();
    });
    panel.querySelectorAll('[data-notif]').forEach(a => a.addEventListener('click', function () {
      zpMarkNotifRead(a.getAttribute('data-notif'));
    }));
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (panel.style.display === 'none') { renderPanel(); panel.style.display = ''; }
    else { panel.style.display = 'none'; paintBadge(); }
  });
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target) && panel.style.display !== 'none') {
      panel.style.display = 'none';
      paintBadge();
    }
  });

  paintBadge();
}
