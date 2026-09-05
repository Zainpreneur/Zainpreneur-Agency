document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'software' });
  if (!session) return;
  const customer = session.record;

  const categorySelect = document.getElementById('a_category');
  categorySelect.innerHTML = ZP_SERVICE_CATEGORIES.map(def => `<option value="${def.id}">${def.icon} ${def.label}</option>`).join('');
  categorySelect.addEventListener('change', toggleAutomationField);
  function toggleAutomationField() {
    document.getElementById('a_automationWrap').style.display = categorySelect.value === 'automation' ? '' : 'none';
  }

  const DEPLOY_LABEL = { cloud: 'Cloud-hosted', local: 'Local / on-premise', hybrid: 'Hybrid' };
  const DEPLOY_TONE = { cloud: 'info', local: 'muted', hybrid: 'success' };

  function renderStats() {
    const { annualTotal, upcomingRenewals } = zpCustomerSoftwareSpend(customer.id);
    const findings = zpAllSavingsForCustomer(customer.id).filter(notDismissed);
    const potentialSavings = findings.reduce((s, f) => s + f.estimatedAnnualSavings, 0);
    document.getElementById('statGrid').innerHTML = `
      <div class="stat-tile"><div class="label">Annual Software Spend</div><div class="value">${zpFormatCurrency(annualTotal)}</div><div class="foot">across ${zpGetAssetsForCustomer(customer.id).length} subscriptions</div></div>
      <div class="stat-tile"><div class="label">Renewing Soon</div><div class="value">${upcomingRenewals.length}</div><div class="foot">within 60 days</div></div>
      <div class="stat-tile"><div class="label">Savings Opportunities</div><div class="value">${findings.length}</div><div class="foot ${findings.length ? 'good' : ''}">${findings.length ? 'up to ' + zpFormatCurrency(potentialSavings) + '/yr' : 'nothing flagged'}</div></div>
    `;
  }

  function notDismissed(finding) {
    const asset = zpGetAsset(finding.assetId);
    return !(asset.dismissedFindings || []).includes(finding.type);
  }

  function renderSavings() {
    const findings = zpAllSavingsForCustomer(customer.id).filter(notDismissed);
    const panel = document.getElementById('savingsPanel');
    if (findings.length === 0) { panel.innerHTML = ''; return; }
    panel.innerHTML = `<div class="panel">
      <div class="panel-header"><h2>💡 Savings Opportunities</h2></div>
      <div class="panel-body">
        ${findings.map(f => `
          <div class="account-item needs-action" style="background:var(--warning-bg);border-color:var(--warning);">
            <div class="acc-top">
              <div class="acc-title">${f.message}</div>
              <span class="badge badge--success">Save up to ${zpFormatCurrency(f.estimatedAnnualSavings)}/yr</span>
            </div>
            <div class="acc-meta" style="margin-top:4px;">${f.suggestion}</div>
            <div class="acc-actions">
              <a href="request-service.html" class="btn btn-primary btn-sm">Request This Switch</a>
              <button type="button" class="btn btn-secondary btn-sm" data-dismiss="${f.assetId}|${f.type}">Not applicable</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  document.getElementById('savingsPanel').addEventListener('click', e => {
    const btn = e.target.closest('[data-dismiss]');
    if (!btn) return;
    const [assetId, type] = btn.getAttribute('data-dismiss').split('|');
    const asset = zpGetAsset(assetId);
    asset.dismissedFindings = asset.dismissedFindings || [];
    asset.dismissedFindings.push(type);
    zpPersist();
    renderStats(); renderSavings();
  });

  function renderAssets() {
    const assets = zpGetAssetsForCustomer(customer.id);
    const grid = document.getElementById('assetGrid');
    if (assets.length === 0) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">💳</div>No software on file yet. Add what you're already paying for so we can track renewals and help you save.</div>`;
      return;
    }
    grid.innerHTML = `<div class="service-grid">${assets.map(renderAssetCard).join('')}</div>`;
    grid.querySelectorAll('[data-asset]').forEach(el => {
      el.addEventListener('click', () => openAssetDetail(el.getAttribute('data-asset')));
    });
  }

  function renderAssetCard(a) {
    const catDef = zpServiceCategoryDef(a.category);
    const chargedTotal = zpAssetChargedTotal(a.id);
    const cycleLabel = a.billing.cycle === 'one-time' ? 'one-time' : '/' + (a.billing.cycle === 'monthly' ? 'mo' : 'yr');
    return `<button class="service-card" data-asset="${a.id}">
      <div class="row-top">
        <div>
          <div class="cat">${catDef ? catDef.icon + ' ' + catDef.label : a.category}</div>
          <h3>${a.name}</h3>
        </div>
        <span class="badge badge--${DEPLOY_TONE[a.deploymentType]}">${DEPLOY_LABEL[a.deploymentType]}</span>
      </div>
      <div class="meta">${a.vendor}${a.billing.nextRenewalDate ? ' · Renews ' + zpFormatDate(a.billing.nextRenewalDate) : ''}</div>
      <div class="price">${zpFormatCurrency(a.billing.amount, a.billing.currency)}<span class="cycle">${cycleLabel}</span></div>
      ${chargedTotal > 0 ? `<div class="meta">We've charged ${zpFormatCurrency(chargedTotal)} for setup/dev work on this</div>` : ''}
    </button>`;
  }

  /* ---------------------------------- Detail modal ---------------------------------- */

  const detailModal = document.getElementById('assetDetailModal');
  document.getElementById('assetDetailClose').addEventListener('click', () => detailModal.classList.remove('open'));
  detailModal.addEventListener('click', e => { if (e.target === detailModal) detailModal.classList.remove('open'); });

  function openAssetDetail(assetId) {
    const a = zpGetAsset(assetId);
    if (!a) return;
    const catDef = zpServiceCategoryDef(a.category);
    const tasks = zpGetTasksForAsset(a.id);
    const services = zpGetServicesForAsset(a.id);
    const findings = zpAnalyzeAsset(a).filter(notDismissed);

    document.getElementById('assetDetailTitle').textContent = a.name;
    document.getElementById('assetDetailBody').innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <span class="cat">${catDef ? catDef.icon + ' ' + catDef.label : a.category}</span>
        <span class="badge badge--${DEPLOY_TONE[a.deploymentType]}">${DEPLOY_LABEL[a.deploymentType]}</span>
      </div>
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Vendor</div><div class="v">${a.vendor}</div></div>
        <div class="kv"><div class="k">You Pay</div><div class="v">${zpFormatCurrency(a.billing.amount, a.billing.currency)} ${a.billing.cycle === 'one-time' ? '(one-time)' : '/ ' + a.billing.cycle}</div></div>
        <div class="kv"><div class="k">Last Paid</div><div class="v">${zpFormatDate(a.billing.lastPaidDate)}</div></div>
        <div class="kv"><div class="k">Next Renewal</div><div class="v">${a.billing.nextRenewalDate ? zpFormatDate(a.billing.nextRenewalDate) : '—'}</div></div>
      </div>
      ${a.reasonForRecurringCharge ? `<p class="text-muted" style="font-size:0.85rem;"><strong>Reason on file for this charge:</strong> ${a.reasonForRecurringCharge}</p>` : ''}
      ${a.usageNotes ? `<p class="text-muted" style="font-size:0.85rem;">${a.usageNotes}</p>` : ''}
      ${a.vendorContact && a.vendorContact.name ? `<div class="kv-list"><div class="kv"><div class="k">Vendor Contact</div><div class="v">${a.vendorContact.name}${a.vendorContact.email ? ' · ' + a.vendorContact.email : ''}</div></div></div>` : ''}
      ${a.notes ? `<p class="text-muted" style="font-size:0.85rem;">${a.notes}</p>` : ''}

      ${findings.length ? `<div class="alert alert-warning" style="margin-top:14px;">💡 ${findings.map(f => f.suggestion).join('<br>')}</div>` : ''}

      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Work We've Done On This</h3>
      ${tasks.length ? `<div class="table-wrap"><table class="zp-table">
        <thead><tr><th>Work</th><th>By</th><th>Charge</th><th>Status</th></tr></thead>
        <tbody>${tasks.map(t => {
          const member = zpGetTeamMember(t.assigneeId);
          return `<tr><td>${t.title}</td><td>${member ? member.name : '—'}</td><td>${t.charge ? zpFormatCurrency(t.charge.amount, t.charge.currency) : '—'}</td><td>${zpBadge(t.status)}</td></tr>`;
        }).join('')}</tbody>
      </table></div>` : `<p class="text-muted" style="font-size:0.85rem;">No implementation work logged against this yet.</p>`}
      ${services.length ? `<p class="text-muted" style="font-size:0.8rem;margin-top:10px;">Related project${services.length > 1 ? 's' : ''}: ${services.map(s => `<a href="services.html?svc=${s.id}">${s.name}</a>`).join(', ')}</p>` : ''}

      <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border);margin-top:16px;">
        <button type="button" class="btn btn-secondary" id="editAssetFromDetail" data-asset="${a.id}">Edit</button>
      </div>
    `;
    document.getElementById('editAssetFromDetail').addEventListener('click', () => {
      detailModal.classList.remove('open');
      openAssetModal(a.id);
    });
    detailModal.classList.add('open');
  }

  /* ---------------------------------- Add/edit form ---------------------------------- */

  const assetModal = document.getElementById('assetModal');
  let editingAssetId = null;

  document.getElementById('addAssetBtn').addEventListener('click', () => openAssetModal(null));
  document.getElementById('assetModalClose').addEventListener('click', () => assetModal.classList.remove('open'));
  document.getElementById('assetCancelBtn').addEventListener('click', () => assetModal.classList.remove('open'));
  assetModal.addEventListener('click', e => { if (e.target === assetModal) assetModal.classList.remove('open'); });

  function openAssetModal(assetId) {
    editingAssetId = assetId;
    const a = assetId ? zpGetAsset(assetId) : null;
    document.getElementById('assetModalTitle').textContent = a ? 'Edit Software' : 'Add Software';
    document.getElementById('assetDeleteBtn').style.display = a ? '' : 'none';

    document.getElementById('a_name').value = a ? a.name : '';
    document.getElementById('a_vendor').value = a ? a.vendor : '';
    categorySelect.value = a ? a.category : ZP_SERVICE_CATEGORIES[0].id;
    document.getElementById('a_deployment').value = a ? a.deploymentType : 'cloud';
    document.getElementById('a_amount').value = a ? a.billing.amount : '';
    document.getElementById('a_cycle').value = a ? a.billing.cycle : 'yearly';
    document.getElementById('a_lastPaid').value = a ? a.billing.lastPaidDate || '' : '';
    document.getElementById('a_automationCount').value = a && a.automationCount != null ? a.automationCount : '';
    document.getElementById('a_reason').value = a ? a.reasonForRecurringCharge || '' : '';
    document.getElementById('a_usage').value = a ? a.usageNotes || '' : '';
    document.getElementById('a_vendorName').value = a && a.vendorContact ? a.vendorContact.name || '' : '';
    document.getElementById('a_vendorEmail').value = a && a.vendorContact ? a.vendorContact.email || '' : '';
    document.getElementById('a_notes').value = a ? a.notes || '' : '';
    toggleAutomationField();

    assetModal.classList.add('open');
  }

  document.getElementById('assetSaveBtn').addEventListener('click', () => {
    const name = document.getElementById('a_name').value.trim();
    const vendor = document.getElementById('a_vendor').value.trim();
    const amount = parseFloat(document.getElementById('a_amount').value);
    if (!name || !vendor || isNaN(amount)) return;

    const cycle = document.getElementById('a_cycle').value;
    const lastPaid = document.getElementById('a_lastPaid').value || null;
    let nextRenewal = null;
    if (lastPaid && cycle !== 'one-time') {
      const d = new Date(lastPaid);
      d.setFullYear(d.getFullYear() + (cycle === 'yearly' ? 1 : 0));
      if (cycle === 'monthly') d.setMonth(d.getMonth() + 1);
      nextRenewal = d.toISOString().slice(0, 10);
    }

    const vendorName = document.getElementById('a_vendorName').value.trim();
    const vendorEmail = document.getElementById('a_vendorEmail').value.trim();

    const assetData = {
      name, vendor,
      category: categorySelect.value,
      deploymentType: document.getElementById('a_deployment').value,
      billing: { amount, currency: 'USD', cycle, lastPaidDate: lastPaid, nextRenewalDate: nextRenewal },
      reasonForRecurringCharge: document.getElementById('a_reason').value.trim() || null,
      usageNotes: document.getElementById('a_usage').value.trim(),
      automationCount: document.getElementById('a_automationWrap').style.display !== 'none' && document.getElementById('a_automationCount').value !== ''
        ? parseInt(document.getElementById('a_automationCount').value, 10) : null,
      vendorContact: (vendorName || vendorEmail) ? { name: vendorName, email: vendorEmail, phone: '' } : null,
      notes: document.getElementById('a_notes').value.trim(),
      status: 'active'
    };

    if (editingAssetId) {
      Object.assign(zpGetAsset(editingAssetId), assetData);
    } else {
      ZP.data.softwareAssets.push({
        id: 'asset-' + Date.now().toString().slice(-6), customerId: customer.id,
        toolId: null, planId: null, dismissedFindings: [], addedDate: ZP_TODAY.toISOString().slice(0, 10),
        ...assetData
      });
    }
    zpPersist();
    assetModal.classList.remove('open');
    renderStats(); renderSavings(); renderAssets();
  });

  document.getElementById('assetDeleteBtn').addEventListener('click', () => {
    if (!editingAssetId) return;
    ZP.data.softwareAssets = ZP.data.softwareAssets.filter(a => a.id !== editingAssetId);
    zpPersist();
    assetModal.classList.remove('open');
    renderStats(); renderSavings(); renderAssets();
  });

  renderStats();
  renderSavings();
  renderAssets();
});
