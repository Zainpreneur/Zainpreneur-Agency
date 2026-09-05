/* =========================================================================
   Zainpreneur Agency — login + auth screens (SRS v2 §6)
   Views: signin | forgot | reset | mfa. Password reset is a frontend mock:
   tokens live in sessionStorage, no email is sent. MFA accepts the demo
   code shown on screen; wire to a real second factor when auth moves
   server-side.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  if (typeof zpApplyLocale === 'function') zpApplyLocale();
  const tabs = { customer: document.getElementById('tabCustomer'), agency: document.getElementById('tabAgency'), team: document.getElementById('tabTeam') };
  const formTitle = document.getElementById('formTitle');
  const formSub = document.getElementById('formSub');
  const demoLabel = document.getElementById('demoLabel');
  const demoList = document.getElementById('demoList');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('alertBox');

  const MODES = {
    customer: {
      titleKey: 'login.customerTitle', subKey: 'login.customerSub',
      demoKey: 'login.customerDemo', errorKey: 'login.badCredentials',
      items: () => ZP.data.customers, redirect: 'dashboard.html',
      find: zpFindCustomerByEmail
    },
    agency: {
      titleKey: 'login.agencyTitle', subKey: 'login.agencySub',
      demoKey: 'login.agencyDemo', errorKey: 'login.badAgency',
      items: () => ZP.data.agencyUsers, redirect: 'agency.html',
      find: zpFindAgencyByEmail
    },
    team: {
      titleKey: 'login.teamTitle', subKey: 'login.teamSub',
      demoKey: 'login.teamDemo', errorKey: 'login.badTeam',
      items: () => ZP.data.teamUsers, redirect: 'team-dashboard.html',
      find: zpFindTeamByEmail
    }
  };

  let mode = 'customer';
  let pendingMfa = null; // { mode, record } awaiting code verification

  /* ---------------- view router ---------------- */
  const VIEWS = ['signin', 'forgot', 'reset', 'mfa'];
  function showView(name) {
    VIEWS.forEach(v => {
      document.getElementById('view-' + v).style.display = v === name ? '' : 'none';
    });
    if (name === 'forgot') {
      document.querySelector('#view-forgot h1').textContent = t('login.forgotTitle');
      document.querySelector('#view-forgot .sub').textContent = t('login.forgotSub');
    }
    if (name === 'reset') {
      document.querySelector('#view-reset h1').textContent = t('login.resetTitle');
      document.querySelector('#view-reset .sub').textContent = t('login.resetSub');
      const tok = new URLSearchParams(window.location.search).get('token');
      if (tok) document.getElementById('resetToken').value = tok;
    }
    if (name === 'mfa') {
      document.querySelector('#view-mfa h1').textContent = t('login.mfaTitle');
    }
  }

  /* ---------------- banners (?expired=1 / ?loggedout=1) ---------------- */
  const params = new URLSearchParams(window.location.search);
  if (params.get('expired') === '1') {
    document.getElementById('authBanner').innerHTML =
      `<div class="alert alert-warning">${t('login.expired')}</div>`;
  } else if (params.get('loggedout') === '1') {
    document.getElementById('authBanner').innerHTML =
      `<div class="alert alert-info">${t('login.signedOut')}</div>`;
  }
  if (MODES[params.get('as')]) mode = params.get('as');
  if (params.get('view') === 'reset') showView('reset');

  function findAccountAnywhere(email) {
    const e = String(email).toLowerCase();
    const c = ZP.data.customers.find(x => x.email.toLowerCase() === e);
    if (c) return { mode: 'customer', record: c };
    const a = ZP.data.agencyUsers.find(x => x.email.toLowerCase() === e);
    if (a) return { mode: 'agency', record: a };
    const t = ZP.data.teamUsers.find(x => x.email.toLowerCase() === e);
    if (t) return { mode: 'team', record: t };
    return null;
  }

  /* ---------------- demo accounts ---------------- */
  function renderDemoAccounts() {
    demoList.innerHTML = '';
    MODES[mode].items().forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-account-btn';
      const initials = mode === 'customer' ? item.initials : item.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
      const title = mode === 'customer' ? item.company : item.name;
      const sub = mode === 'customer' ? item.contact + ' · ' + item.email : item.role + ' · ' + item.email;
      btn.innerHTML = `<span class="avatar">${initials}</span><span><span class="name" style="display:block">${title}</span><span class="role">${sub}</span></span>`;
      btn.addEventListener('click', () => {
        emailInput.value = item.email;
        passwordInput.value = item.password;
        doLogin();
      });
      demoList.appendChild(btn);
    });
  }

  function setMode(next) {
    mode = next;
    Object.keys(tabs).forEach(key => {
      tabs[key].classList.toggle('active', key === mode);
      tabs[key].setAttribute('aria-selected', key === mode);
    });
    formTitle.textContent = t(MODES[mode].titleKey);
    formSub.textContent = t(MODES[mode].subKey);
    demoLabel.textContent = t(MODES[mode].demoKey);
    alertBox.innerHTML = '';
    renderDemoAccounts();
  }

  Object.keys(tabs).forEach(key => tabs[key].addEventListener('click', () => setMode(key)));

  /* ---------------- sign in (+ disabled + MFA) ---------------- */
  const DEMO_MFA_CODE = '123456';

  function completeLogin(loginMode, record) {
    zpLogin(loginMode, record.id);
    window.location.href = MODES[loginMode].redirect;
  }

  function doLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    alertBox.innerHTML = '';

    const cfg = MODES[mode];
    const record = cfg.find(email);
    if (!record || record.password !== password) {
      alertBox.innerHTML = `<div class="alert alert-danger">${t(cfg.errorKey)}</div>`;
      return;
    }
    if (record.status === 'disabled' || record.active === false) {
      alertBox.innerHTML = `<div class="alert alert-danger">${t('login.disabled')}</div>`;
      return;
    }
    if (record.mfaEnabled) {
      pendingMfa = { mode, record };
      document.getElementById('mfaSub').textContent = t('login.mfaCodeHint');
      document.getElementById('mfaAlert').innerHTML = '';
      document.getElementById('mfaCode').value = '';
      showView('mfa');
      return;
    }
    completeLogin(mode, record);
  }

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    doLogin();
  });

  document.getElementById('mfaForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!pendingMfa) { showView('signin'); return; }
    const code = document.getElementById('mfaCode').value.trim();
    if (code !== DEMO_MFA_CODE) {
      document.getElementById('mfaAlert').innerHTML =
        `<div class="alert alert-danger">${t('login.mfaBad')}</div>`;
      return;
    }
    const { mode: m, record } = pendingMfa;
    pendingMfa = null;
    completeLogin(m, record);
  });

  /* ---------------- forgot / reset (mock) ---------------- */
  const RESET_KEY = 'zp_reset_tokens_v1';
  function readTokens() {
    try { return JSON.parse(sessionStorage.getItem(RESET_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeTokens(t) { sessionStorage.setItem(RESET_KEY, JSON.stringify(t)); }

  document.getElementById('forgotLink').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('forgotAlert').innerHTML = '';
    document.getElementById('forgotDone').innerHTML = '';
    showView('forgot');
  });

  document.querySelectorAll('[data-back]').forEach(a => a.addEventListener('click', function (e) {
    e.preventDefault();
    pendingMfa = null;
    showView('signin');
  }));

  document.getElementById('forgotForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value.trim();
    const found = findAccountAnywhere(email);
    const box = document.getElementById('forgotAlert');
    const done = document.getElementById('forgotDone');
    // Respond identically whether or not the account exists (no enumeration).
    if (!found) {
      done.innerHTML = `<div class="alert alert-success">${t('login.forgotSent')}</div>`;
      return;
    }
    const tokens = readTokens();
    const token = 'rst-' + Math.random().toString(36).slice(2, 10);
    tokens[token] = { mode: found.mode, id: found.record.id, exp: Date.now() + 15 * 60 * 1000 };
    writeTokens(tokens);
    box.innerHTML = '';
    done.innerHTML = `<div class="alert alert-success">${t('login.forgotIssued')}<br>
      <a href="login.html?view=reset&token=${token}">login.html?view=reset&token=${token}</a></div>`;
  });

  document.getElementById('resetForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const token = document.getElementById('resetToken').value.trim();
    const next = document.getElementById('resetPassword').value;
    const box = document.getElementById('resetAlert');
    const tokens = readTokens();
    const entry = tokens[token];
    if (!entry || entry.exp < Date.now()) {
      box.innerHTML = `<div class="alert alert-danger">${t('login.resetBad')}</div>`;
      return;
    }
    const store = entry.mode === 'customer' ? ZP.data.customers
      : entry.mode === 'agency' ? ZP.data.agencyUsers : ZP.data.teamUsers;
    const record = store.find(r => r.id === entry.id);
    if (!record) {
      box.innerHTML = `<div class="alert alert-danger">${t('login.noAccount')}</div>`;
      return;
    }
    record.password = next;
    delete tokens[token];
    writeTokens(tokens);
    zpPersist();
    document.getElementById('resetForm').reset();
    setMode(entry.mode);
    alertBox.innerHTML = `<div class="alert alert-success">${t('login.resetOk')}</div>`;
    showView('signin');
  });

  setMode(mode);
});
