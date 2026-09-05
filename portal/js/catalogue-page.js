document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: ['team', 'agency'], active: 'catalogue' });
  if (!session) return;

  const backLink = document.getElementById('backNavLink');
  if (session.type === 'agency') {
    backLink.href = 'agency.html#overview';
    backLink.innerHTML = '<span class="icon">←</span>Back to Console';
  } else {
    backLink.innerHTML = '<span class="icon">←</span>Back to My Tasks';
  }

  /* --- Hosting providers --- */
  document.getElementById('hostingSection').innerHTML = ZP_CATALOGUE.hostingProviders.map(p => `
    <div class="provider-card">
      <h3>${p.label}</h3>
      ${p.plans.map(pl => `<div class="plan-row"><span>${pl.label}</span><span class="specs">${pl.specs}</span></div>`).join('')}
    </div>
  `).join('');

  /* --- Platforms --- */
  document.getElementById('platformSection').innerHTML = `
    <div class="table-wrap"><table class="zp-table">
      <thead><tr><th>Platform</th><th>Deploys On</th><th>Device Types</th><th>OS Targets</th><th>Connectivity</th></tr></thead>
      <tbody>
        ${ZP_CATALOGUE.platforms.map(p => `<tr>
          <td><strong>${p.label}</strong>${p.dataBackends ? `<br><span class="text-muted" style="font-size:0.76rem;">Data: ${p.dataBackends.map(d => zpCatDataBackend(d).label).join(', ')}</span>` : ''}</td>
          <td>${p.deployedOn.length ? p.deployedOn.map(id => zpCatProvider(id).label).join(', ') : '<span class="text-muted">Hosted by vendor</span>'}</td>
          <td>${p.deviceTypes.map(zpCatDeviceLabel).join(', ')}</td>
          <td>${p.osTargets.map(zpCatOsLabel).join(', ')}</td>
          <td>${p.modes.map(zpCatConnectivityLabel).join(', ')}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  `;

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
});
