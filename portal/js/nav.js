/* =========================================================================
   Zainpreneur Agency — Client Portal shared shell logic
   Handles auth guard, active-nav highlighting, user-chip population, and
   logout wiring for every portal page that includes the sidebar/topbar
   markup + this script.
   ========================================================================= */

/**
 * Central navigation model (SRS v2 §8). Sidebars are generated from here —
 * pages keep an empty `<nav class="sidebar-nav"></nav>` shell.
 * `view` marks agency hash-views; `badge` injects a counter span by id.
 */
const ZP_NAVS = {
  customer: [
    { href: 'dashboard.html', nav: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { href: 'technology.html', nav: 'technology', icon: '🖥️', label: 'Technology' },
    { href: 'services.html', nav: 'services', icon: '🧰', label: 'My Services' },
    { href: 'deployments.html', nav: 'deployments', icon: '🚀', label: 'Deployments' },
    { href: 'software.html', nav: 'software', icon: '💳', label: 'My Software' },
    { href: 'invoices.html', nav: 'invoices', icon: '🧾', label: 'Invoices & Billing' },
    { href: 'costs.html', nav: 'costs', icon: '💰', label: 'Costs' },
    { href: 'renewals.html', nav: 'renewals', icon: '🔔', label: 'Renewals' },
    { href: 'request-service.html', nav: 'request', icon: '➕', label: 'Request a Service' },
    { href: 'support.html', nav: 'support', icon: '💬', label: 'Support' },
    { href: 'documents.html', nav: 'documents', icon: '📄', label: 'Documents' },
    { href: 'credentials.html', nav: 'vault', icon: '🔑', label: 'Credentials Vault' },
    { href: 'account.html', nav: 'account', icon: '⚙️', label: 'Account' }
  ],
  agency: [
    { href: '#overview', nav: 'overview', view: 'overview', icon: '📊', label: 'Overview' },
    { href: '#customers', nav: 'customers', view: 'customers', icon: '🏢', label: 'Customers' },
    { href: '#requests', nav: 'requests', view: 'requests', icon: '📥', label: 'Service Requests', badge: 'pendingBadge' },
    { href: '#services', nav: 'services', view: 'services', icon: '🧰', label: 'Services' },
    { href: '#tasks', nav: 'tasks', view: 'tasks', icon: '📋', label: 'Delivery Tasks' },
    { href: 'catalogue.html', icon: '📚', label: 'Software Catalogue' },
    { href: 'users.html', nav: 'users', icon: '👥', label: 'Users' },
    { href: 'workload.html', nav: 'workload', icon: '⚖️', label: 'Workload' },
    { href: 'roles.html', nav: 'roles', icon: '🔐', label: 'Roles' },
    { href: 'reports.html', nav: 'reports', icon: '📈', label: 'Reports' },
    { href: 'recommendations.html', nav: 'recommendations', icon: '💡', label: 'Recommendations' },
    { href: 'settings.html', nav: 'settings', icon: '⚙️', label: 'Settings' }
  ],
  team: [
    { href: 'team-dashboard.html', nav: 'tasks', icon: '📋', label: 'My Tasks' },
    { href: 'catalogue.html', nav: 'catalogue', icon: '📚', label: 'Software Catalogue' }
  ]
};

/** Catalogue reference page nav: back link adapts to the session role. */
function zpCatalogueNav(role) {
  const back = role === 'agency'
    ? { href: 'agency.html#overview', nav: 'tasks', icon: '←', label: 'Back to Console', id: 'backNavLink' }
    : { href: 'team-dashboard.html', nav: 'tasks', icon: '←', label: 'Back to My Tasks', id: 'backNavLink' };
  return [back, { href: 'catalogue.html', nav: 'catalogue', icon: '📚', label: 'Software Catalogue' }];
}

/** Maps static nav labels to i18n keys; renderer translates at render time. */
const ZP_NAV_KEYS = {
  'Dashboard': 'nav.dashboard', 'Technology': 'nav.technology', 'My Services': 'nav.services',
  'Deployments': 'nav.deployments', 'My Software': 'nav.software',   'Invoices & Billing': 'nav.invoices', 'Costs': 'nav.costs', 'Renewals': 'nav.renewals',
  'Request a Service': 'nav.request', 'Support': 'nav.support', 'Documents': 'nav.documents',
  'Credentials Vault': 'nav.vault', 'Account': 'nav.account', 'Overview': 'nav.overview',
  'Customers': 'nav.customers', 'Service Requests': 'nav.requests', 'Services': 'nav.agencyServices',
  'Delivery Tasks': 'nav.tasks', 'Software Catalogue': 'nav.catalogue', 'Users': 'nav.users',
  'Workload': 'nav.workload', 'Roles': 'nav.roles', 'Reports': 'nav.reports',
  'Settings': 'nav.settings', 'Recommendations': 'nav.recommendations', 'My Tasks': 'nav.myTasks',
  'Back to Console': 'nav.backConsole', 'Back to My Tasks': 'nav.backTasks'
};

function zpRenderNav(items) {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  const labelOf = (item) => (typeof t === 'function' && ZP_NAV_KEYS[item.label] ? t(ZP_NAV_KEYS[item.label]) : item.label);
  nav.innerHTML = items.map(item => {
    const attrs = [`href="${item.href}"`];
    if (item.nav) attrs.push(`data-nav="${item.nav}"`);
    if (item.view) attrs.push(`data-view="${item.view}"`);
    if (item.id) attrs.push(`id="${item.id}"`);
    const badge = item.badge ? ` <span class="badge badge--info" id="${item.badge}" style="margin-left:auto;"></span>` : '';
    return `<a ${attrs.join(' ')}><span class="icon">${item.icon}</span>${labelOf(item)}${badge}</a>`;
  }).join('');
}

/**
 * @param {Object} opts
 * @param {'customer'|'agency'} opts.role
 * @param {string} opts.active - value matching a [data-nav] attribute on the sidebar link for this page
 * @param {Array|Function} [opts.navItems] - override nav items, or fn(session) returning them
 * @returns {{type:string,id:string,record:Object}|null} the auth session, or null if redirected to login
 */
function zpInitShell(opts) {
  const session = zpRequireAuth(opts.role);
  if (!session) return null;

  // Locale: customer preference wins, otherwise stored default.
  if (typeof ZP_LANG_KEY !== 'undefined' && session.type === 'customer' && session.record.prefs && session.record.prefs.lang) {
    try { localStorage.setItem(ZP_LANG_KEY, session.record.prefs.lang); } catch (e) { /* ignore */ }
  }
  if (typeof zpApplyLocale === 'function') zpApplyLocale();

  const items = typeof opts.navItems === 'function'
    ? opts.navItems(session)
    : (opts.navItems || ZP_NAVS[session.type] || []);
  zpRenderNav(items);

  if (typeof zpApplyPermissions === 'function') zpApplyPermissions(document);

  document.querySelectorAll('[data-nav]').forEach(el => {
    if (el.getAttribute('data-nav') === opts.active) {
      el.classList.add('active');
      el.setAttribute('aria-current', 'page');
    }
  });

  const chipName = document.getElementById('userChipName');
  const chipSub = document.getElementById('userChipSub');
  const chipInitials = document.getElementById('userChipInitials');

  if (session.type === 'customer') {
    const c = session.record;
    if (chipName) chipName.textContent = c.company;
    if (chipSub) chipSub.textContent = c.contact;
    if (chipInitials) chipInitials.textContent = c.initials;
  } else {
    // agency and team sessions both carry { name, role }
    const a = session.record;
    if (chipName) chipName.textContent = a.name;
    if (chipSub) chipSub.textContent = a.role;
    if (chipInitials) chipInitials.textContent = a.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      zpLogout();
      window.location.href = 'login.html?loggedout=1';
    });
  }

  const todayEl = document.getElementById('topbarDate');
  if (todayEl) {
    todayEl.textContent = ZP_TODAY.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (typeof zpInitSearch === 'function') zpInitSearch(session);
  if (typeof zpInitNotifications === 'function') zpInitNotifications(session);

  // Skip link (keyboard users jump straight to content).
  if (!document.getElementById('skipLink')) {
    const main = document.querySelector('.main');
    if (main) {
      main.id = 'mainContent';
      const skip = document.createElement('a');
      skip.id = 'skipLink';
      skip.className = 'skip-link';
      skip.href = '#mainContent';
      skip.textContent = 'Skip to content';
      document.body.insertBefore(skip, document.body.firstChild);
    }
  }

  // Escape closes any open modal.
  if (!zpInitShell._escBound) {
    zpInitShell._escBound = true;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });
  }

  return session;
}

/** Small helper: builds a <span class="badge badge--X"> for any status string. */
function zpBadge(status, extraClass) {
  const map = {
    active: 'success', paid: 'success', completed: 'success', approved: 'success', converted: 'success', configured: 'success', resolved: 'success', done: 'success',
    provisioning: 'info', submitted: 'info', quoted: 'info', 'in-progress': 'info', shared: 'info', scheduled: 'info', 'under-review': 'info',
    'in-development': 'warning', unpaid: 'warning', reviewing: 'warning', pending: 'muted', requested: 'warning', 'in-review': 'warning',
    'needs-maintenance': 'warning', 'replacement-candidate': 'warning',
    overdue: 'danger', rejected: 'danger', cancelled: 'danger', 'rotate-requested': 'danger', blocked: 'danger',
    'at-risk': 'danger', unsupported: 'danger',
    paused: 'muted', draft: 'muted', 'not-needed': 'muted', todo: 'muted'
  };
  const tone = map[status] || 'muted';
  return `<span class="badge badge--${tone}${extraClass ? ' ' + extraClass : ''}">${zpStatusLabel(status)}</span>`;
}
