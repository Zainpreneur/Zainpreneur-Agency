/* =========================================================================
   Zainpreneur Agency — Costs page (SRS v2 §9 costs, §49 separation)
   Three buckets, always separated: vendor software (paid by the customer
   to vendors), agency implementation (one-time), agency recurring.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'costs' });
  if (!session) return;

  const customer = session.record;
  const services = zpGetServicesForCustomer(customer.id);
  const assets = zpGetAssetsForCustomer(customer.id);

  function monthlyEquivalent(s) {
    if (s.billing.model !== 'recurring') return 0;
    return s.billing.cycle === 'yearly' ? s.billing.customerPrice / 12 : s.billing.customerPrice;
  }

  const vendorAnnual = assets.reduce((sum, a) => sum + zpAssetAnnualCost(a), 0);
  const oneTime = services
    .filter(s => s.billing.model !== 'recurring')
    .reduce((sum, s) => sum + s.billing.customerPrice, 0);
  const recurringMonthly = services.reduce((sum, s) => sum + monthlyEquivalent(s), 0);
  const runRate = vendorAnnual / 12 + recurringMonthly;

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-tile"><div class="label">Vendor Software /yr</div><div class="value">${zpFormatCurrency(vendorAnnual)}</div><div class="foot">paid by you to vendors</div></div>
    <div class="stat-tile"><div class="label">Agency One-time</div><div class="value">${zpFormatCurrency(oneTime)}</div><div class="foot">implementation work to date</div></div>
    <div class="stat-tile"><div class="label">Agency Recurring /mo</div><div class="value">${zpFormatCurrency(recurringMonthly)}</div><div class="foot">maintenance &amp; management</div></div>
    <div class="stat-tile"><div class="label">Monthly Run Rate</div><div class="value">${zpFormatCurrency(runRate)}</div><div class="foot">vendor + agency recurring</div></div>
  `;

  /* --- vendor table --- */
  const vtbody = document.querySelector('#vendorTable tbody');
  if (!assets.length) {
    vtbody.innerHTML = `<tr><td colspan="4" class="table-empty">No vendor software on file. <a href="software.html">Add it →</a></td></tr>`;
  } else {
    vtbody.innerHTML = assets.map(a => {
      const billing = a.billing.cycle === 'one-time' ? 'One-time purchase'
        : `${zpFormatCurrency(a.billing.amount, a.billing.currency)} / ${a.billing.cycle}`;
      return `<tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.vendor}</td>
        <td>${billing}</td>
        <td>${zpFormatCurrency(zpAssetAnnualCost(a), a.billing.currency)}</td>
      </tr>`;
    }).join('') + `<tr><td colspan="3"><strong>Total annual vendor cost</strong></td><td><strong>${zpFormatCurrency(vendorAnnual)}</strong></td></tr>`;
  }

  /* --- agency table --- */
  const atbody = document.querySelector('#agencyTable tbody');
  if (!services.length) {
    atbody.innerHTML = `<tr><td colspan="4" class="table-empty">No agency services yet. <a href="request-service.html">Request one →</a></td></tr>`;
  } else {
    atbody.innerHTML = services.map(s => {
      const type = s.billing.model === 'recurring' ? `Recurring / ${s.billing.cycle}` : 'One-time';
      const charged = s.billing.model === 'recurring'
        ? `${zpFormatCurrency(s.billing.customerPrice, s.billing.currency)} / ${s.billing.cycle}`
        : zpFormatCurrency(s.billing.customerPrice, s.billing.currency);
      return `<tr>
        <td><a href="services.html?svc=${s.id}"><strong>${s.name}</strong></a></td>
        <td>${type}</td>
        <td>${zpBadge(s.status)}</td>
        <td>${charged}</td>
      </tr>`;
    }).join('');
  }
});
