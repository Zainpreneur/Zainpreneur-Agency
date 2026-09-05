/* =========================================================================
   Zainpreneur Agency — Client Portal shared shell logic
   Handles auth guard, active-nav highlighting, user-chip population, and
   logout wiring for every portal page that includes the sidebar/topbar
   markup + this script.
   ========================================================================= */

/**
 * @param {Object} opts
 * @param {'customer'|'agency'} opts.role
 * @param {string} opts.active - value matching a [data-nav] attribute on the sidebar link for this page
 * @returns {{type:string,id:string,record:Object}|null} the auth session, or null if redirected to login
 */
function zpInitShell(opts) {
  const session = zpRequireAuth(opts.role);
  if (!session) return null;

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
    const a = session.record;
    if (chipName) chipName.textContent = a.name;
    if (chipSub) chipSub.textContent = a.role;
    if (chipInitials) chipInitials.textContent = a.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      zpLogout();
      window.location.href = 'login.html';
    });
  }

  const todayEl = document.getElementById('topbarDate');
  if (todayEl) {
    todayEl.textContent = ZP_TODAY.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  return session;
}

/** Small helper: builds a <span class="badge badge--X"> for any status string. */
function zpBadge(status, extraClass) {
  const map = {
    active: 'success', paid: 'success', completed: 'success', approved: 'success', converted: 'success',
    provisioning: 'info', submitted: 'info', quoted: 'info', 'in-progress': 'info',
    'in-development': 'warning', unpaid: 'warning', reviewing: 'warning', pending: 'muted',
    overdue: 'danger', rejected: 'danger', cancelled: 'danger',
    paused: 'muted', draft: 'muted'
  };
  const tone = map[status] || 'muted';
  return `<span class="badge badge--${tone}${extraClass ? ' ' + extraClass : ''}">${zpStatusLabel(status)}</span>`;
}
