document.addEventListener('DOMContentLoaded', function () {
  const tabCustomer = document.getElementById('tabCustomer');
  const tabAgency = document.getElementById('tabAgency');
  const formTitle = document.getElementById('formTitle');
  const formSub = document.getElementById('formSub');
  const demoLabel = document.getElementById('demoLabel');
  const demoList = document.getElementById('demoList');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const alertBox = document.getElementById('alertBox');

  let mode = 'customer';

  // Deep-link support: login.html?as=agency (used by zpRequireAuth redirects)
  const params = new URLSearchParams(window.location.search);
  if (params.get('as') === 'agency') mode = 'agency';

  function renderDemoAccounts() {
    demoList.innerHTML = '';
    const items = mode === 'customer' ? ZP.data.customers : ZP.data.agencyUsers;
    items.forEach(item => {
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
    tabCustomer.classList.toggle('active', mode === 'customer');
    tabCustomer.setAttribute('aria-selected', mode === 'customer');
    tabAgency.classList.toggle('active', mode === 'agency');
    tabAgency.setAttribute('aria-selected', mode === 'agency');
    formTitle.textContent = mode === 'customer' ? 'Sign in to your account' : 'Agency console sign in';
    formSub.textContent = mode === 'customer'
      ? 'Track your deployed services, billing, and support requests.'
      : 'Internal access — manage customers, services, and billing.';
    demoLabel.textContent = mode === 'customer' ? 'Demo customer accounts — click to sign in' : 'Demo agency account — click to sign in';
    alertBox.innerHTML = '';
    renderDemoAccounts();
  }

  tabCustomer.addEventListener('click', () => setMode('customer'));
  tabAgency.addEventListener('click', () => setMode('agency'));

  function doLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    alertBox.innerHTML = '';

    if (mode === 'customer') {
      const c = zpFindCustomerByEmail(email);
      if (!c || c.password !== password) {
        alertBox.innerHTML = '<div class="alert alert-danger">We couldn\'t find an account with those credentials. Try one of the demo accounts below.</div>';
        return;
      }
      zpLogin('customer', c.id);
      window.location.href = 'dashboard.html';
    } else {
      const a = zpFindAgencyByEmail(email);
      if (!a || a.password !== password) {
        alertBox.innerHTML = '<div class="alert alert-danger">Invalid agency credentials.</div>';
        return;
      }
      zpLogin('agency', a.id);
      window.location.href = 'agency.html';
    }
  }

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    doLogin();
  });

  setMode(mode);
});
