/* =========================================================================
   Zainpreneur Agency — Recommendations pipeline (SRS v2 §10)
   Savings findings across customers: flagged → proposed → accepted (or
   dismissed). Stage lives in ZP.data.recStages keyed `assetId|type`;
   legacy per-asset dismissals read as dismissed. Dismissing here syncs
   the asset record so the customer view stays consistent.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'agency', active: 'recommendations' });
  if (!session) return;

  if (!ZP.data.recStages) ZP.data.recStages = {};
  let activeStage = 'all';

  const STAGE_TONE = { flagged: 'warning', proposed: 'info', accepted: 'success', dismissed: 'muted' };
  const STAGE_LABEL = { flagged: 'Flagged', proposed: 'Proposed', accepted: 'Accepted', dismissed: 'Dismissed' };

  function stageOf(f) {
    const key = f.assetId + '|' + f.type;
    if (ZP.data.recStages[key]) return ZP.data.recStages[key];
    const asset = zpGetAsset(f.assetId);
    if (asset && (asset.dismissedFindings || []).includes(f.type)) return 'dismissed';
    return 'flagged';
  }

  function allFindings() {
    const out = [];
    ZP.data.customers.forEach(c => {
      zpAllSavingsForCustomer(c.id).forEach(f => out.push({ customer: c, finding: f, stage: stageOf(f) }));
    });
    return out.sort((a, b) => b.finding.estimatedAnnualSavings - a.finding.estimatedAnnualSavings);
  }

  function setStage(f, stage) {
    const key = f.assetId + '|' + f.type;
    ZP.data.recStages[key] = stage;
    // Keep the per-asset dismissal list in sync for the customer view.
    const asset = zpGetAsset(f.assetId);
    if (asset) {
      asset.dismissedFindings = asset.dismissedFindings || [];
      if (stage === 'dismissed' && asset.dismissedFindings.indexOf(f.type) === -1) {
        asset.dismissedFindings.push(f.type);
      }
      if (stage !== 'dismissed') {
        asset.dismissedFindings = asset.dismissedFindings.filter(t => t !== f.type);
      }
    }
    zpPersist();
  }

  function renderStats(rows) {
    const total = rows.filter(r => r.stage !== 'dismissed')
      .reduce((s, r) => s + r.finding.estimatedAnnualSavings, 0);
    const count = st => rows.filter(r => r.stage === st).length;
    document.getElementById('statGrid').innerHTML = `
      <div class="stat-tile"><div class="label">Potential /yr</div><div class="value">${zpFormatCurrency(total)}</div><div class="foot">excluding dismissed</div></div>
      <div class="stat-tile"><div class="label">Flagged</div><div class="value">${count('flagged')}</div></div>
      <div class="stat-tile"><div class="label">Proposed</div><div class="value">${count('proposed')}</div></div>
      <div class="stat-tile"><div class="label">Accepted</div><div class="value">${count('accepted')}</div><div class="foot good">booked savings</div></div>
    `;
  }

  const tabs = document.getElementById('stageTabs');
  tabs.addEventListener('click', e => {
    const btn = e.target.closest('button[data-stage]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeStage = btn.getAttribute('data-stage');
    render();
  });

  const tbody = document.querySelector('#recTable tbody');

  function actionsFor(r) {
    const id = r.finding.assetId + '|' + r.finding.type;
    const btn = (to, label, primary) =>
      `<button type="button" class="btn btn-${primary ? 'primary' : 'secondary'} btn-sm" data-to="${to}" data-f="${id}">${label}</button>`;
    if (r.stage === 'flagged') return btn('proposed', 'Propose', true) + ' ' + btn('dismissed', 'Dismiss', false);
    if (r.stage === 'proposed') return btn('accepted', 'Accept', true) + ' ' + btn('dismissed', 'Dismiss', false);
    if (r.stage === 'accepted') return `<span class="text-muted" style="font-size:0.8rem;">Booked</span>`;
    return btn('flagged', 'Reopen', false);
  }

  function render() {
    const rows = allFindings();
    renderStats(rows);
    const shown = rows.filter(r => activeStage === 'all' || r.stage === activeStage);
    if (!shown.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No recommendations in this stage.</td></tr>`;
      return;
    }
    tbody.innerHTML = shown.map(r => {
      const asset = zpGetAsset(r.finding.assetId);
      return `<tr>
        <td><strong>${r.customer.company}</strong><br><span class="text-muted" style="font-size:0.78rem;">${asset ? asset.name : ''}</span></td>
        <td>${r.finding.message}<br><span class="text-muted" style="font-size:0.78rem;">${r.finding.suggestion}</span></td>
        <td>${zpFormatCurrency(r.finding.estimatedAnnualSavings)}</td>
        <td><span class="badge badge--${STAGE_TONE[r.stage]}">${STAGE_LABEL[r.stage]}</span></td>
        <td style="white-space:nowrap;">${actionsFor(r)}</td>
      </tr>`;
    }).join('');
    tbody.querySelectorAll('[data-to]').forEach(btn => btn.addEventListener('click', () => {
      const [assetId, type] = btn.getAttribute('data-f').split('|');
      const target = allFindings().find(r => r.finding.assetId === assetId && r.finding.type === type);
      if (!target) return;
      setStage(target.finding, btn.getAttribute('data-to'));
      render();
    }));
  }

  render();
});
