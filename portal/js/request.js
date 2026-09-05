document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'request' });
  if (!session) return;

  const customer = session.record;
  let selectedCategory = null;

  const picker = document.getElementById('categoryPicker');
  const commonFields = document.getElementById('commonFields');
  const specificFields = document.getElementById('categorySpecificFields');
  const alertBox = document.getElementById('formAlert');

  const CATEGORY_FIELDS = {
    'infrastructure': () => `
      <div class="form-grid">
        <div class="field">
          <label for="cf_provider">Preferred hosting provider</label>
          <select id="cf_provider">
            <option>No preference — recommend one</option>
            <option>Hostinger</option>
            <option>DigitalOcean</option>
            <option>AWS</option>
            <option>Other (mention in description)</option>
          </select>
        </div>
        <div class="field">
          <label for="cf_traffic">Expected traffic / load</label>
          <select id="cf_traffic">
            <option>Low (a few hundred visits/mo)</option>
            <option selected>Moderate (a few thousand visits/mo)</option>
            <option>High (10k+ visits/mo)</option>
          </select>
        </div>
      </div>`,
    'software-platform': () => `
      <div class="form-grid">
        <div class="field">
          <label for="cf_platform">Platform</label>
          <select id="cf_platform">
            <option>Odoo</option>
            <option>WordPress / WooCommerce</option>
            <option>Shopify</option>
            <option>Other (mention in description)</option>
          </select>
        </div>
        <div class="field">
          <label for="cf_modules">Key modules / features needed</label>
          <input type="text" id="cf_modules" placeholder="e.g. Inventory, Accounting, CRM">
        </div>
      </div>`,
    'custom-development': () => `
      <div class="form-grid">
        <div class="field">
          <label for="cf_stack">Preferred tech stack (optional)</label>
          <input type="text" id="cf_stack" placeholder="e.g. React + Node.js, or 'you choose'">
        </div>
        <div class="field">
          <label for="cf_integration">Systems this needs to integrate with</label>
          <input type="text" id="cf_integration" placeholder="e.g. our Odoo ERP, Shopify store">
        </div>
      </div>`,
    'maintenance': () => `
      <div class="form-grid">
        <div class="field">
          <label for="cf_currentstack">What's currently deployed</label>
          <input type="text" id="cf_currentstack" placeholder="e.g. Odoo on a Hostinger VPS">
        </div>
        <div class="field">
          <label for="cf_level">Support level</label>
          <select id="cf_level">
            <option>Basic — monitoring only</option>
            <option selected>Standard — monitoring + patching</option>
            <option>Premium — 4hr SLA, priority response</option>
          </select>
        </div>
      </div>`
  };

  picker.addEventListener('click', e => {
    const btn = e.target.closest('.category-option');
    if (!btn) return;
    selectedCategory = btn.getAttribute('data-cat');
    picker.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    specificFields.innerHTML = CATEGORY_FIELDS[selectedCategory] ? CATEGORY_FIELDS[selectedCategory]() : '';
    commonFields.style.display = '';
    commonFields.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  document.getElementById('requestForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!selectedCategory) return;

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const budgetRange = document.getElementById('budgetRange').value;
    const timeline = document.getElementById('timeline').value;

    if (!title || !description) return;

    // Collect category-specific fields generically and fold them into the description
    // so nothing the customer entered is lost, without needing a bespoke schema per category.
    const extras = [];
    specificFields.querySelectorAll('input, select').forEach(el => {
      if (el.value) extras.push(`${el.previousElementSibling ? el.previousElementSibling.textContent : el.id}: ${el.value}`);
    });

    const newReq = {
      id: 'REQ-' + Date.now().toString().slice(-6),
      customerId: customer.id,
      title, category: selectedCategory, description,
      priority, budgetRange, timeline,
      extras,
      status: 'submitted',
      submittedDate: new Date().toISOString().slice(0, 10)
    };

    ZP.data.requests.unshift(newReq);
    zpPersist();

    alertBox.innerHTML = `<div class="alert alert-success">✅ Request submitted! Your account manager, ${customer.accountManager}, will review it and follow up with a scoped quote.</div>`;
    document.getElementById('requestForm').reset();
    picker.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
    commonFields.style.display = 'none';
    selectedCategory = null;

    renderRequests();

    // Simulate the agency picking it up shortly after submission.
    setTimeout(() => {
      const r = ZP.data.requests.find(r => r.id === newReq.id);
      if (r && r.status === 'submitted') {
        r.status = 'reviewing';
        zpPersist();
        renderRequests();
      }
    }, 4000);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  function renderRequests() {
    const tbody = document.querySelector('#requestTable tbody');
    const requests = zpGetRequestsForCustomer(customer.id).slice().sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">You haven't submitted any requests yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = requests.map(r => `<tr>
      <td>${r.title}</td>
      <td>${zpCategoryIcon(r.category)} ${zpCategoryLabel(r.category)}</td>
      <td>${zpFormatDate(r.submittedDate)}</td>
      <td>${r.budgetRange}</td>
      <td>${zpBadge(r.status)}</td>
    </tr>`).join('');
  }

  renderRequests();
});
