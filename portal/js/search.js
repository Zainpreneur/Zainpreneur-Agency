/* =========================================================================
   Zainpreneur Agency — global search (SRS v2 §13)
   Injected into every shell topbar by zpInitShell. Searches the session's
   scope (customer / agency / team), groups hits by resource type, and
   deep-links where the target page supports it. Press `/` to focus.
   ========================================================================= */

function zpInitSearch(session) {
  var topbar = document.querySelector('.topbar');
  if (!topbar || document.getElementById('globalSearch')) return;

  var wrap = document.createElement('div');
  wrap.className = 'topbar-search';
  wrap.innerHTML =
    '<input type="search" id="globalSearch" placeholder="Search — press /" autocomplete="off" aria-label="Global search">' +
    '<div class="search-results" id="searchResults" role="listbox" style="display:none;"></div>';
  topbar.appendChild(wrap);

  var input = document.getElementById('globalSearch');
  var results = document.getElementById('searchResults');
  var flat = [];
  var activeIdx = -1;
  var timer = null;

  document.addEventListener('keydown', function (e) {
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
      input.focus();
    } else if (e.key === 'Escape' && document.activeElement === input) {
      close();
      input.blur();
    }
  });
  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) close();
  });

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () { run(input.value.trim()); }, 150);
  });
  input.addEventListener('keydown', function (e) {
    if (results.style.display === 'none' || flat.length === 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (e.key === 'ArrowDown') { activeIdx = (activeIdx + 1) % flat.length; }
      else { activeIdx = (activeIdx - 1 + flat.length) % flat.length; }
      paint();
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      window.location.href = flat[activeIdx].href;
    }
  });

  function close() { results.style.display = 'none'; flat = []; activeIdx = -1; }

  function match(haystack, q) {
    return String(haystack === undefined || haystack === null ? '' : haystack).toLowerCase().indexOf(q) !== -1;
  }

  function pushInto(idx, group, label, sub, href, keys) {
    idx.push({ group: group, label: label, sub: sub, href: href, keys: keys });
  }

  function buildIndex() {
    var idx = [];
    var role = session.type;
    var i, s, t, a, c, svc, m, tool, r, inv;

    if (role === 'customer') {
      c = session.record;
      var services = zpGetServicesForCustomer(c.id);
      for (i = 0; i < services.length; i++) {
        s = services[i];
        pushInto(idx, 'Services', s.name, zpCategoryLabel(s.category) + ' · ' + zpStatusLabel(s.status),
          'services.html?svc=' + s.id, [s.name, s.id, s.provider, s.plan]);
      }
      var projects = Api.projects.forCustomer(c.id);
      for (i = 0; i < projects.length; i++) {
        s = projects[i];
        pushInto(idx, 'Projects', s.name, zpStatusLabel(s.status), 'deployments.html', [s.name, s.id]);
      }
      var tasks = zpGetTasksForCustomer(c.id);
      for (i = 0; i < tasks.length; i++) {
        t = tasks[i];
        pushInto(idx, 'Tasks', t.title, zpStatusLabel(t.status), 'deployments.html', [t.title, t.id]);
      }
      var assets = zpGetAssetsForCustomer(c.id);
      for (i = 0; i < assets.length; i++) {
        a = assets[i];
        pushInto(idx, 'Software', a.name + ' — ' + a.vendor, 'Owned asset', 'software.html', [a.name, a.vendor, a.id]);
      }
      var invoices = zpGetInvoicesForCustomer(c.id);
      for (i = 0; i < invoices.length; i++) {
        inv = invoices[i];
        svc = zpGetService(inv.serviceId);
        pushInto(idx, 'Invoices', inv.id + ' — ' + zpFormatCurrency(zpInvoiceTotal(inv), inv.currency),
          (svc ? svc.name : '') + ' · ' + zpStatusLabel(zpEffectiveInvoiceStatus(inv)),
          'invoices.html', [inv.id, svc ? svc.name : '']);
      }
      var tickets = zpGetTicketsForCustomer(c.id);
      for (i = 0; i < tickets.length; i++) {
        t = tickets[i];
        pushInto(idx, 'Support', t.id + ' — ' + t.subject, zpStatusLabel(t.status),
          'support.html?ticket=' + t.id, [t.id, t.subject]);
      }
    }

    if (role === 'agency') {
      var customers = ZP.data.customers;
      for (i = 0; i < customers.length; i++) {
        c = customers[i];
        pushInto(idx, 'Customers', c.company, c.contact + ' · ' + c.email,
          'agency.html#customers', [c.company, c.contact, c.email, c.id]);
      }
      var allServices = ZP.data.services;
      for (i = 0; i < allServices.length; i++) {
        s = allServices[i];
        c = zpGetCustomer(s.customerId);
        pushInto(idx, 'Services', s.name, (c ? c.company : '') + ' · ' + zpStatusLabel(s.status),
          'agency.html#customers', [s.name, s.id]);
      }
      var members = ZP.data.teamUsers;
      for (i = 0; i < members.length; i++) {
        m = members[i];
        pushInto(idx, 'Team', m.name + ' — ' + m.role, m.email, 'agency.html#tasks', [m.name, m.email, m.role]);
      }
      var toolIds = Object.keys(ZP.data.catalogueTools || {});
      for (i = 0; i < toolIds.length; i++) {
        tool = ZP.data.catalogueTools[toolIds[i]];
        pushInto(idx, 'Catalogue', tool.label + ' — ' + tool.vendor, 'Priced tool',
          'catalogue.html', [tool.label, tool.vendor, tool.id]);
      }
      var requests = ZP.data.requests;
      for (i = 0; i < requests.length; i++) {
        r = requests[i];
        c = zpGetCustomer(r.customerId);
        pushInto(idx, 'Requests', r.title, (c ? c.company : '') + ' · ' + zpStatusLabel(r.status),
          'agency.html#requests', [r.title, r.id]);
      }
    }

    if (role === 'team') {
      m = session.record;
      var myTasks = zpGetTasksForAssignee(m.id);
      for (i = 0; i < myTasks.length; i++) {
        t = myTasks[i];
        pushInto(idx, 'My Tasks', t.title, zpStatusLabel(t.status), 'team-dashboard.html', [t.title, t.id]);
      }
      var ids = Object.keys(ZP.data.catalogueTools || {});
      for (i = 0; i < ids.length; i++) {
        tool = ZP.data.catalogueTools[ids[i]];
        pushInto(idx, 'Catalogue', tool.label + ' — ' + tool.vendor, 'Priced tool',
          'catalogue.html', [tool.label, tool.vendor, tool.id]);
      }
    }

    return idx;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function run(q) {
    if (q.length < 2) { close(); return; }
    var ql = q.toLowerCase();
    var index = buildIndex();
    var hits = [];
    var i, k, h, found;
    for (i = 0; i < index.length; i++) {
      h = index[i];
      found = false;
      for (k = 0; k < h.keys.length; k++) {
        if (match(h.keys[k], ql)) { found = true; break; }
      }
      if (found) hits.push(h);
    }
    if (!hits.length) {
      flat = []; activeIdx = -1;
      results.innerHTML = '<div class="sr-empty">No matches found.</div>';
      results.style.display = '';
      return;
    }
    var groups = {};
    var order = [];
    var n;
    for (n = 0; n < hits.length && n < 30; n++) {
      h = hits[n];
      if (!groups[h.group]) { groups[h.group] = []; order.push(h.group); }
      if (groups[h.group].length < 5) groups[h.group].push(h);
    }
    flat = [];
    var out = '';
    var g, j;
    for (g = 0; g < order.length; g++) {
      out += '<div class="sr-group">' + esc(order[g]) + '</div>';
      for (j = 0; j < groups[order[g]].length; j++) {
        h = groups[order[g]][j];
        flat.push(h);
        out += '<a class="sr-item" data-i="' + (flat.length - 1) + '" href="' + h.href + '">' +
          '<span class="sr-label">' + esc(h.label) + '</span>' +
          '<span class="sr-sub">' + esc(h.sub) + '</span></a>';
      }
    }
    results.innerHTML = out;
    activeIdx = -1;
    results.style.display = '';
  }

  function paint() {
    var items = results.querySelectorAll('.sr-item');
    var n;
    for (n = 0; n < items.length; n++) {
      if (Number(items[n].getAttribute('data-i')) === activeIdx) { items[n].classList.add('sr-active'); }
      else { items[n].classList.remove('sr-active'); }
    }
    var cur = null;
    for (n = 0; n < items.length; n++) {
      if (Number(items[n].getAttribute('data-i')) === activeIdx) { cur = items[n]; break; }
    }
    if (cur && cur.scrollIntoView) cur.scrollIntoView();
  }
}
