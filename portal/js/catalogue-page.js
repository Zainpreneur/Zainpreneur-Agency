document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: ['team', 'agency'], active: 'catalogue' });
  if (!session) return;
  const canEdit = session.type === 'agency';

  const backLink = document.getElementById('backNavLink');
  if (session.type === 'agency') {
    backLink.href = 'agency.html#overview';
    backLink.innerHTML = '<span class="icon">←</span>Back to Console';
  } else {
    backLink.innerHTML = '<span class="icon">←</span>Back to My Tasks';
  }

  function slugify(text) {
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'plan';
  }

  function renderCategories() {
    document.getElementById('categoriesContainer').innerHTML = ZP_SERVICE_CATEGORIES.map(def => {
      let body;
      if (def.tools.length) {
        body = def.tools.map(zpGetTool).filter(Boolean).map(renderToolBlock).join('');
      } else if (def.techStackPicker) {
        body = `<p class="text-muted" style="font-size:0.85rem;">No fixed vendor — priced per engagement from the full tech stack below (see "Custom Development Tech Stack").</p>`;
      } else {
        body = `<p class="text-muted" style="font-size:0.85rem;">No fixed tool — scoped per engagement based on what's already deployed.</p>`;
      }
      return `<div class="catalogue-section">
        <div class="panel">
          <div class="panel-header">
            <h2>${def.icon} ${def.label}</h2>
          </div>
          <div class="panel-body">
            <p class="text-muted" style="margin-top:0;font-size:0.85rem;">${def.description}</p>
            ${body}
          </div>
        </div>
      </div>`;
    }).join('');

    document.querySelectorAll('[data-edit-tool]').forEach(btn => {
      btn.addEventListener('click', () => openPricingModal(btn.getAttribute('data-edit-tool')));
    });
  }

  function renderToolBlock(tool) {
    const stale = zpIsToolStale(tool);
    return `<div class="tool-card" style="cursor:default;">
      <div class="tool-head">
        <div>
          <strong>${tool.label}</strong> <span class="text-muted" style="font-size:0.78rem;">— ${tool.vendor}</span>
          <div class="tool-specialty">${tool.specialty}</div>
        </div>
        <div style="text-align:right;">
          ${stale ? '<span class="stale-badge">Needs re-verification</span>' : '<span class="verified-badge">Recently verified</span>'}
        </div>
      </div>
      <div class="source-note">
        Last verified ${zpFormatDate(tool.lastVerified)} · ${tool.dataSource || 'unknown source'} ·
        <a href="${tool.website}" target="_blank" rel="noopener">Open vendor pricing page ↗</a>
        ${canEdit ? ` · <button type="button" class="btn-ghost" data-edit-tool="${tool.id}" style="font-size:0.78rem;">Update Pricing</button>` : ''}
      </div>
      <div style="margin-top:10px;">${zpRenderToolPlansReadonly(tool)}</div>
    </div>`;
  }

  /* --- Device / OS / connectivity reference --- */
  document.getElementById('deviceSection').innerHTML = `
    <div style="margin-bottom:16px;">
      <div class="layer-label" style="margin-bottom:8px;">Device Types</div>
      <div>${ZP_CATALOGUE.deviceTypes.map(d => `<span class="chip">${d.label}</span>`).join('')}</div>
    </div>
    <div style="margin-bottom:16px;">
      <div class="layer-label" style="margin-bottom:8px;">OS Targets</div>
      <div>${ZP_CATALOGUE.osTargets.map(o => `<span class="chip">${o.label}</span>`).join('')}</div>
    </div>
    <div>
      <div class="layer-label" style="margin-bottom:8px;">Connectivity Modes</div>
      <div>${ZP_CATALOGUE.connectivityModes.map(c => `<span class="chip">${c.label}</span>`).join('')}</div>
    </div>
  `;

  /* --- Tech stack layers --- */
  document.getElementById('stackSection').innerHTML = Object.keys(ZP_TECH_LAYER_LABEL).map(layer => `
    <div class="stack-layer">
      <div class="layer-label">${ZP_TECH_LAYER_LABEL[layer]}</div>
      <div>${ZP_CATALOGUE.techStack[layer].map(item => `<span class="chip">${item}</span>`).join('')}</div>
    </div>
  `).join('');

  /* ---------------------------------- Update Pricing modal (agency only) ---------------------------------- */

  const pricingModal = document.getElementById('pricingModal');
  let editingToolId = null;

  function openPricingModal(toolId) {
    if (!canEdit) return;
    editingToolId = toolId;
    const tool = zpGetTool(toolId);
    if (!tool) return;
    document.getElementById('pricingModalTitle').textContent = 'Update Pricing — ' + tool.label;
    document.getElementById('pricingEditList').innerHTML = tool.plans.map((p, i) => renderPlanEditRow(p, i)).join('');
    pricingModal.classList.add('open');
  }

  function renderPlanEditRow(plan, i) {
    return `<div class="workflow-row" data-plan-row="${i}">
      <div class="wf-grid">
        <div class="field" style="margin-bottom:0;"><label>Plan name</label><input type="text" class="pe-label" value="${plan.label || ''}"></div>
        <div class="field" style="margin-bottom:0;"><label>Price</label><input type="number" step="0.01" min="0" class="pe-price" value="${plan.price != null ? plan.price : ''}"></div>
      </div>
      <div class="wf-grid">
        <div class="field" style="margin-bottom:0;">
          <label>Currency</label>
          <select class="pe-currency">
            <option value="USD" ${plan.currency === 'USD' ? 'selected' : ''}>USD</option>
            <option value="EUR" ${plan.currency === 'EUR' ? 'selected' : ''}>EUR</option>
            <option value="GBP" ${plan.currency === 'GBP' ? 'selected' : ''}>GBP</option>
          </select>
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>Billing</label>
          <select class="pe-cycle">
            ${['free', 'monthly', 'monthly-per-seat', 'per-user-monthly', 'annual', 'one-time'].map(c => `<option value="${c}" ${plan.cycle === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="field" style="margin-bottom:6px;"><label>Features (one per line)</label><textarea class="pe-features" style="min-height:60px;">${(plan.features || []).join('\n')}</textarea></div>
      <div class="field" style="margin-bottom:6px;"><label>Limitations (one per line)</label><textarea class="pe-limitations" style="min-height:44px;">${(plan.limitations || []).join('\n')}</textarea></div>
      <button type="button" class="wf-remove" data-remove-plan="${i}">✕ Remove plan</button>
    </div>`;
  }

  document.getElementById('pricingEditList').addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-plan]');
    if (btn) btn.closest('[data-plan-row]').remove();
  });

  document.getElementById('addPlanBtn').addEventListener('click', () => {
    const list = document.getElementById('pricingEditList');
    const idx = list.querySelectorAll('[data-plan-row]').length;
    list.insertAdjacentHTML('beforeend', renderPlanEditRow({ label: '', price: 0, currency: 'USD', cycle: 'monthly', features: [], limitations: [] }, idx));
  });

  document.getElementById('pricingSaveBtn').addEventListener('click', () => {
    if (!editingToolId) return;
    const rows = document.querySelectorAll('#pricingEditList [data-plan-row]');
    const plans = Array.from(rows).map(row => {
      const label = row.querySelector('.pe-label').value.trim() || 'Plan';
      return {
        id: slugify(label),
        label,
        price: parseFloat(row.querySelector('.pe-price').value) || 0,
        currency: row.querySelector('.pe-currency').value,
        cycle: row.querySelector('.pe-cycle').value,
        limits: {},
        features: row.querySelector('.pe-features').value.split('\n').map(s => s.trim()).filter(Boolean),
        limitations: row.querySelector('.pe-limitations').value.split('\n').map(s => s.trim()).filter(Boolean)
      };
    });
    zpUpdateToolPricing(editingToolId, plans);
    pricingModal.classList.remove('open');
    renderCategories();
  });

  document.getElementById('pricingModalClose').addEventListener('click', () => pricingModal.classList.remove('open'));
  document.getElementById('pricingCancelBtn').addEventListener('click', () => pricingModal.classList.remove('open'));
  pricingModal.addEventListener('click', e => { if (e.target === pricingModal) pricingModal.classList.remove('open'); });

  renderCategories();
});
