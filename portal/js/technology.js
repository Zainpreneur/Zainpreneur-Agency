/* =========================================================================
   Zainpreneur Agency — Technology Inventory page (SRS v2 §9 technology)
   Owned systems (from software assets) with lifecycle statuses and a
   structured assessment workflow. Status/assessment fields are
   runtime-added and migration-safe; system create/edit stays in
   software.html to avoid duplication.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'technology' });
  if (!session) return;
  const customer = session.record;

  const STATUSES = ['active', 'needs-maintenance', 'legacy', 'at-risk',
    'unsupported', 'replacement-candidate', 'under-review', 'retired'];

  function techStatus(a) { return STATUSES.indexOf(a.techStatus) !== -1 ? a.techStatus : 'active'; }

  let activeStatus = 'all';
  let activeCategory = 'all';

  /* --- category filter --- */
  const catSelect = document.getElementById('categoryFilter');
  catSelect.innerHTML = '<option value="all">All categories</option>' +
    ZP_SERVICE_CATEGORIES.map(def => `<option value="${def.id}">${def.icon} ${def.label}</option>`).join('');
  catSelect.addEventListener('change', () => { activeCategory = catSelect.value; render(); });

  const tabs = document.getElementById('statusTabs');
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-status]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.getAttribute('data-status');
    render();
  });

  function filtered() {
    return zpGetAssetsForCustomer(customer.id).filter(a =>
      (activeStatus === 'all' || techStatus(a) === activeStatus) &&
      (activeCategory === 'all' || a.category === activeCategory)
    );
  }

  function renderStats() {
    const assets = zpGetAssetsForCustomer(customer.id);
    const attention = assets.filter(a => ['needs-maintenance', 'at-risk', 'unsupported'].indexOf(techStatus(a)) !== -1).length;
    const assessed = assets.filter(a => a.assessment && a.assessment.recommendation).length;
    const annual = assets.reduce((s, a) => s + zpAssetAnnualCost(a), 0);
    document.getElementById('statGrid').innerHTML = `
      <div class="stat-tile"><div class="label">Tracked Systems</div><div class="value">${assets.length}</div></div>
      <div class="stat-tile"><div class="label">Needs Attention</div><div class="value">${attention}</div><div class="foot ${attention ? 'danger' : ''}">${attention ? 'maintenance or risk flagged' : 'all healthy'}</div></div>
      <div class="stat-tile"><div class="label">Annual Cost</div><div class="value">${zpFormatCurrency(annual)}</div><div class="foot">paid by you to vendors</div></div>
      <div class="stat-tile"><div class="label">Assessed</div><div class="value">${assessed}</div><div class="foot">of ${assets.length} systems</div></div>
    `;
  }

  const grid = document.getElementById('assetGrid');

  function render() {
    const assets = filtered();
    if (!assets.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🖥️</div>No systems in this view. <a href="software.html">Add what you're already paying for →</a></div>`;
      return;
    }
    grid.innerHTML = assets.map(a => {
      const catDef = zpServiceCategoryDef(a.category);
      const cycleLabel = a.billing.cycle === 'one-time' ? 'one-time' : '/' + (a.billing.cycle === 'monthly' ? 'mo' : 'yr');
      return `<button class="service-card" data-asset="${a.id}">
        <div class="row-top">
          <div>
            <div class="cat">${catDef ? catDef.icon + ' ' + catDef.label : a.category}</div>
            <h3>${a.name}</h3>
          </div>
          ${zpBadge(techStatus(a))}
        </div>
        <div class="meta">${a.vendor}${a.billing.nextRenewalDate ? ' · Renews ' + zpFormatDate(a.billing.nextRenewalDate) : ''}</div>
        <div class="price">${zpFormatCurrency(a.billing.amount, a.billing.currency)}<span class="cycle">${cycleLabel}</span></div>
        ${a.assessment && a.assessment.recommendation ? `<div class="meta">Assessment: ${a.assessment.recommendation}</div>` : ''}
      </button>`;
    }).join('');
    grid.querySelectorAll('[data-asset]').forEach(el => {
      el.addEventListener('click', () => openDetail(el.getAttribute('data-asset')));
    });
  }

  /* --- detail modal --- */
  const modal = document.getElementById('techModal');
  document.getElementById('techModalClose').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  function openDetail(assetId) {
    const a = zpGetAsset(assetId);
    if (!a || a.customerId !== customer.id) return;
    const catDef = zpServiceCategoryDef(a.category);
    const services = zpGetServicesForAsset(a.id);
    const status = techStatus(a);
    const asm = a.assessment || {};

    document.getElementById('techModalTitle').textContent = a.name;
    document.getElementById('techModalBody').innerHTML = `
      <div class="flex-between" style="margin-bottom:10px;">
        <span class="cat">${catDef ? catDef.icon + ' ' + catDef.label : a.category}</span>
        ${zpBadge(status)}
      </div>
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Vendor</div><div class="v">${a.vendor}</div></div>
        <div class="kv"><div class="k">You Pay</div><div class="v">${zpFormatCurrency(a.billing.amount, a.billing.currency)} ${a.billing.cycle === 'one-time' ? '(one-time)' : '/ ' + a.billing.cycle}</div></div>
        <div class="kv"><div class="k">Next Renewal</div><div class="v">${a.billing.nextRenewalDate ? zpFormatDate(a.billing.nextRenewalDate) : '—'}</div></div>
        <div class="kv"><div class="k">Deployment</div><div class="v">${a.deploymentType}</div></div>
      </div>
      ${a.usageNotes ? `<p class="text-muted" style="font-size:0.85rem;">${a.usageNotes}</p>` : ''}
      ${services.length ? `<p class="text-muted" style="font-size:0.8rem;">Used by: ${services.map(s => `<a href="services.html?svc=${s.id}">${s.name}</a>`).join(', ')}</p>` : ''}

      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Lifecycle Status</h3>
      <div class="field">
        <select id="techStatusSelect" style="max-width:280px;">
          ${STATUSES.map(s => `<option value="${s}" ${s === status ? 'selected' : ''}>${zpStatusLabel(s)}</option>`).join('')}
        </select>
      </div>

      <h3 style="margin:18px 0 8px;font-size:0.95rem;">Assessment</h3>
      ${asm.recommendation ? `
        <div class="kv-list" style="margin-top:0;">
          <div class="kv"><div class="k">Recommendation</div><div class="v"><strong>${asm.recommendation}</strong>${asm.date ? ' · ' + zpFormatDate(asm.date) : ''}</div></div>
        </div>
        ${asm.problems ? `<p class="text-muted" style="font-size:0.85rem;"><strong>Problems:</strong> ${asm.problems}</p>` : ''}
        ${asm.alternatives ? `<p class="text-muted" style="font-size:0.85rem;"><strong>Alternatives:</strong> ${asm.alternatives}</p>` : ''}
      ` : `<p class="text-muted" style="font-size:0.85rem;">Not assessed yet — run an assessment when deciding what to keep, replace, or retire.</p>`}

      <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border);margin-top:16px;">
        <button type="button" class="btn btn-secondary" id="assessBtn" data-asset="${a.id}">Assess System</button>
      </div>
    `;
    document.getElementById('techStatusSelect').addEventListener('change', function () {
      a.techStatus = this.value;
      zpPersist();
      renderStats(); render();
      openDetail(assetId);
    });
    document.getElementById('assessBtn').addEventListener('click', () => {
      modal.classList.remove('open');
      openAssess(assetId);
    });
    modal.classList.add('open');
  }

  /* --- assessment modal --- */
  const assessModal = document.getElementById('assessModal');
  let assessingId = null;
  document.getElementById('assessClose').addEventListener('click', () => assessModal.classList.remove('open'));
  document.getElementById('assessCancelBtn').addEventListener('click', () => assessModal.classList.remove('open'));
  assessModal.addEventListener('click', e => { if (e.target === assessModal) assessModal.classList.remove('open'); });

  const REC_LABEL = { keep: 'Keep as-is', maintain: 'Maintain / upgrade', replace: 'Replace', retire: 'Retire', review: 'Needs deeper review' };

  function openAssess(assetId) {
    const a = zpGetAsset(assetId);
    if (!a) return;
    assessingId = assetId;
    const asm = a.assessment || {};
    document.getElementById('assessSub').textContent = 'Assessing ' + a.name + ' (' + a.vendor + ').';
    document.getElementById('as_requirements').value = asm.requirements || '';
    document.getElementById('as_capabilities').value = asm.capabilities || '';
    document.getElementById('as_problems').value = asm.problems || '';
    document.getElementById('as_cost').value = asm.cost || '';
    document.getElementById('as_alternatives').value = asm.alternatives || '';
    document.getElementById('as_recommendation').value = asm.recommendationKey || 'keep';
    assessModal.classList.add('open');
  }

  document.getElementById('assessSaveBtn').addEventListener('click', () => {
    const a = zpGetAsset(assessingId);
    if (!a) return;
    const key = document.getElementById('as_recommendation').value;
    a.assessment = {
      requirements: document.getElementById('as_requirements').value.trim(),
      capabilities: document.getElementById('as_capabilities').value.trim(),
      problems: document.getElementById('as_problems').value.trim(),
      cost: document.getElementById('as_cost').value.trim(),
      alternatives: document.getElementById('as_alternatives').value.trim(),
      recommendationKey: key,
      recommendation: REC_LABEL[key],
      date: ZP_TODAY.toISOString().slice(0, 10)
    };
    zpPersist();
    assessModal.classList.remove('open');
    renderStats(); render();
  });

  renderStats();
  render();
});
