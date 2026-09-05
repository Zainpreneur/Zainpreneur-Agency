document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'request' });
  if (!session) return;

  const customer = session.record;
  const commonFields = document.getElementById('commonFields');
  const alertBox = document.getElementById('formAlert');

  const configurator = zpMountConfigurator(document.getElementById('configuratorMount'), {
    onChange: () => { commonFields.style.display = configurator.getServiceCategoryId() ? '' : 'none'; }
  });

  document.getElementById('requestForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const serviceCategoryId = configurator.getServiceCategoryId();
    if (!serviceCategoryId) return;

    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const priority = document.getElementById('priority').value;
    const budgetRange = document.getElementById('budgetRange').value;
    const timeline = document.getElementById('timeline').value;
    if (!title || !description) return;

    const newReq = {
      id: 'REQ-' + Date.now().toString().slice(-6),
      customerId: customer.id,
      title, category: configurator.getInternalCategory(), serviceCategoryId,
      description, priority, budgetRange, timeline,
      config: configurator.getConfig(),
      status: 'submitted',
      submittedDate: ZP_TODAY.toISOString().slice(0, 10)
    };

    ZP.data.requests.unshift(newReq);
    zpPersist();

    alertBox.innerHTML = `<div class="alert alert-success">✅ Request submitted! Your account manager, ${customer.accountManager}, will review it and follow up with a scoped quote.</div>`;
    document.getElementById('requestForm').reset();
    configurator.reset();
    commonFields.style.display = 'none';

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
    tbody.innerHTML = requests.map(r => {
      const catDef = zpServiceCategoryDef(r.serviceCategoryId);
      return `<tr>
        <td>${r.title}</td>
        <td>${catDef ? catDef.icon + ' ' + catDef.label : zpCategoryIcon(r.category) + ' ' + zpCategoryLabel(r.category)}</td>
        <td>${zpFormatDate(r.submittedDate)}</td>
        <td>${r.budgetRange}</td>
        <td>${zpBadge(r.status)}</td>
      </tr>`;
    }).join('');
  }

  renderRequests();
});
