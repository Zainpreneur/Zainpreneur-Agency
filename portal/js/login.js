document.addEventListener('DOMContentLoaded', function () {
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
      title: 'Sign in to your account', sub: 'Track your deployed services, billing, and support requests.',
      demoLabel: 'Demo customer accounts — click to sign in',
      items: () => ZP.data.customers, redirect: 'dashboard.html',
      find: zpFindCustomerByEmail, errorMsg: 'We couldn\'t find an account with those credentials. Try one of the demo accounts below.'
    },
    agency: {
      title: 'Agency console sign in', sub: 'Internal access — manage customers, services, and billing.',
      demoLabel: 'Demo agency account — click to sign in',
      items: () => ZP.data.agencyUsers, redirect: 'agency.html',
      find: zpFindAgencyByEmail, errorMsg: 'Invalid agency credentials.'
    },
    team: {
      title: 'Delivery team sign in', sub: 'View your assigned tasks and work the deployment catalogue.',
      demoLabel: 'Demo team accounts — click to sign in',
      items: () => ZP.data.teamUsers, redirect: 'team-dashboard.html',
      find: zpFindTeamByEmail, errorMsg: 'Invalid team credentials.'
    }
  };

  let mode = 'customer';

  // Deep-link support: login.html?as=agency / ?as=team (used by zpRequireAuth redirects)
  const params = new URLSearchParams(window.location.search);
  if (MODES[params.get('as')]) mode = params.get('as');

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
    formTitle.textContent = MODES[mode].title;
    formSub.textContent = MODES[mode].sub;
    demoLabel.textContent = MODES[mode].demoLabel;
    alertBox.innerHTML = '';
    renderDemoAccounts();
  }

  Object.keys(tabs).forEach(key => tabs[key].addEventListener('click', () => setMode(key)));

  function doLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    alertBox.innerHTML = '';

    const cfg = MODES[mode];
    const record = cfg.find(email);
    if (!record || record.password !== password) {
      alertBox.innerHTML = `<div class="alert alert-danger">${cfg.errorMsg}</div>`;
      return;
    }
    zpLogin(mode, record.id);
    window.location.href = cfg.redirect;
  }

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    doLogin();
  });

  setMode(mode);
});
