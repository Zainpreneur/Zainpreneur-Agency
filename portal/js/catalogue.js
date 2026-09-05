/* =========================================================================
   Zainpreneur Agency — Software & Deployment Catalogue
   Static taxonomy (categories, device/OS/connectivity vocab, tech-stack
   layers, connector apps) lives here as constants. The actual sellable
   TOOLS — Hostinger, HubSpot, Odoo, n8n, Make, Zapier, etc., each with
   real plan tiers, pricing and features — are seeded into ZP.data.catalogueTools
   (see data.js) so pricing edits made through "Update Pricing" persist to
   localStorage like everything else, instead of living in this static file.
   ========================================================================= */

/**
 * The 7 categories customers/agency pick from when scoping a service. Each
 * maps to an internal `category` bucket (used for badges/filters/checklists
 * everywhere else in the portal) plus either a list of catalogue tool ids
 * to choose from, a hosting picker, or a full custom tech-stack picker.
 */
const ZP_SERVICE_CATEGORIES = [
  { id: 'website-development', label: 'Website Development', icon: '🌐', internalCategory: 'software-platform',
    description: 'A public-facing website or storefront — on an off-the-shelf builder, or fully custom.',
    tools: ['hostinger-website', 'hubspot-cms', 'odoo', 'wordpress-woocommerce'], allowCustom: true },
  { id: 'business-platform', label: 'Business Platform / ERP', icon: '🧩', internalCategory: 'software-platform',
    description: 'Off-the-shelf business software configured for the customer — ERP, CRM, or e-commerce backend.',
    tools: ['odoo', 'wordpress-woocommerce', 'shopify'], allowCustom: false },
  { id: 'mobile-app', label: 'Mobile App (No-Code)', icon: '📱', internalCategory: 'software-platform',
    description: 'A mobile app built on a no-code platform instead of native development.',
    tools: ['appsheet', 'glide'], allowCustom: false },
  { id: 'automation', label: 'Automation & Integrations', icon: '⚙️', internalCategory: 'automation',
    description: "Connecting the customer's existing tools together with automated workflows.",
    tools: ['n8n', 'make', 'zapier', 'ifttt'], allowCustom: false },
  { id: 'infrastructure', label: 'Infrastructure & Hosting', icon: '🖥️', internalCategory: 'infrastructure',
    description: 'Servers and VPS — the raw hosting a platform runs on.',
    tools: ['hostinger-vps', 'digitalocean', 'aws'], allowCustom: false },
  { id: 'custom-development', label: 'Custom Software Development', icon: '🛠️', internalCategory: 'custom-development',
    description: "Bespoke software built from scratch to the customer's spec.",
    tools: [], techStackPicker: true },
  { id: 'maintenance', label: 'Maintenance & Support', icon: '🔧', internalCategory: 'maintenance',
    description: 'Ongoing monitoring, patching and support for something already live.',
    tools: [] }
];

/** Pseudo-tool id used only inside the Website Development picker — routes to custom-development. */
const ZP_CUSTOM_WEBSITE_TOOL_ID = 'custom-website';

function zpServiceCategoryDef(id) { return ZP_SERVICE_CATEGORIES.find(c => c.id === id) || null; }

const ZP_DELIVERY_MODES = [
  { id: 'virtual', label: 'Virtual / Online', icon: '💻', description: 'Delivered entirely remotely — no site visit needed.' },
  { id: 'on-location', label: 'On-Location', icon: '📍', description: "Delivered at the customer's premises." },
  { id: 'hybrid', label: 'Both (Hybrid)', icon: '🔀', description: 'A mix — most work remote, with one or more site visits.' }
];
function zpDeliveryModeLabel(id) { const d = ZP_DELIVERY_MODES.find(x => x.id === id); return d ? d.label : id; }

const ZP_CATALOGUE = {
  hostingProviders: [ // kept for backward-compat lookups; VPS pricing itself now lives in catalogueTools
  ],

  deviceTypes: [
    { id: 'laptop', label: 'Laptop' },
    { id: 'desktop', label: 'Desktop / Computer' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'tablet', label: 'Tablet' }
  ],
  osTargets: [
    { id: 'android', label: 'Android' },
    { id: 'ios', label: 'iOS' },
    { id: 'cross-platform', label: 'Cross-platform / Web' },
    { id: 'windows', label: 'Windows' },
    { id: 'macos', label: 'macOS' },
    { id: 'linux', label: 'Linux' }
  ],
  connectivityModes: [
    { id: 'online', label: 'Online (cloud-connected)' },
    { id: 'offline', label: 'Offline-capable (local-first)' },
    { id: 'hybrid', label: 'Hybrid (offline capture, syncs online)' }
  ],

  // Layered tech stack for custom development — each item picked individually.
  techStack: {
    frontend: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Svelte', 'Flutter', 'React Native', 'Swift (iOS native)', 'Kotlin (Android native)'],
    backend: ['Node.js / Express', 'Python / Django', 'Python / FastAPI', 'PHP / Laravel', 'Ruby on Rails', 'Java / Spring Boot', '.NET / C#', 'Go'],
    database: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Firebase Firestore', 'Microsoft SQL Server'],
    infraAddons: ['Redis', 'Elasticsearch', 'RabbitMQ', 'Docker', 'Kubernetes', 'Nginx', 'GraphQL', 'WebSockets'],
    integrations: ['Stripe (Payments)', 'Twilio (SMS)', 'SendGrid (Email)', 'Google Maps API', 'Auth0 (Auth)', 'Firebase Auth']
  },

  // Common apps offered when building an automation workflow's trigger/actions.
  connectorApps: [
    'Gmail', 'Google Sheets', 'Google Calendar', 'Google Drive', 'Slack', 'Microsoft Teams', 'Outlook',
    'Shopify', 'WooCommerce', 'Stripe', 'QuickBooks', 'Odoo', 'HubSpot', 'Airtable', 'Notion', 'Trello',
    'Twilio (SMS)', 'Mailchimp', 'Typeform', 'Webhook (custom)'
  ]
};

const ZP_TECH_LAYER_LABEL = {
  frontend: 'Frontend', backend: 'Backend', database: 'Database',
  infraAddons: 'Infrastructure & Add-ons', integrations: 'Integrations'
};

/* ---------------------------------- Tool / pricing lookups ---------------------------------- */
/* Pricing data lives in ZP.data.catalogueTools (persisted) — see data.js. */

function zpGetTool(id) { return (ZP.data.catalogueTools || {})[id] || null; }
function zpGetToolPlan(toolId, planId) {
  const tool = zpGetTool(toolId);
  return tool ? (tool.plans.find(p => p.id === planId) || null) : null;
}
function zpToolsForCategoryDef(categoryDefId) {
  const def = zpServiceCategoryDef(categoryDefId);
  return def ? def.tools.map(zpGetTool).filter(Boolean) : [];
}

/** A tool's pricing is "stale" if unverified for longer than the agency's
    configured threshold (default 90 days — see agency Settings). */
function zpIsToolStale(tool) {
  if (!tool.lastVerified) return true;
  return zpDaysBetween(new Date(tool.lastVerified), ZP_TODAY) > zpSettings().catalogue.staleDays;
}

/** Persist an edited copy of a tool's plans (used by the "Update Pricing" form). Marks it manually verified today. */
function zpUpdateToolPricing(toolId, plans) {
  const tool = zpGetTool(toolId);
  if (!tool) return;
  tool.plans = plans;
  tool.lastVerified = ZP_TODAY.toISOString().slice(0, 10);
  tool.dataSource = 'manual (agency verified)';
  zpPersist();
}

function zpFormatToolPrice(plan) {
  if (plan.price === 0) return 'Free';
  const amount = zpFormatCurrency(plan.price, plan.currency || 'USD');
  const cycleLabel = { monthly: '/mo', 'monthly-per-seat': '/seat/mo', 'per-user-monthly': '/user/mo', annual: '/yr', free: '', 'one-time': ' one-time' }[plan.cycle] || '';
  return amount + cycleLabel;
}

/** Renders one tool's plan tiers as a grid of read-only info cards (used in the catalogue reference page). */
function zpRenderToolPlansReadonly(tool) {
  return `<div class="plan-grid">
    ${tool.plans.map(p => `
      <div class="plan-card">
        <div class="plan-card-head">
          <strong>${p.label}</strong>
          <span class="plan-price">${zpFormatToolPrice(p)}</span>
        </div>
        ${p.limits && Object.keys(p.limits).length ? `<div class="plan-limits">${Object.entries(p.limits).map(([k, v]) => `<span class="chip">${v}${isNaN(k) ? ' ' + k : ''}</span>`).join('')}</div>` : ''}
        <ul class="plan-feature-list">${p.features.map(f => `<li>✓ ${f}</li>`).join('')}${(p.limitations || []).map(l => `<li class="limitation">✕ ${l}</li>`).join('')}</ul>
      </div>
    `).join('')}
  </div>`;
}

/**
 * Renders a service/task's structured `config` object as grouped sections:
 * delivery mode + location, chosen tool/plan, device/OS/connectivity, and —
 * for custom development — one chip group per tech-stack layer, plus any
 * automation workflows to build. Returns '' for services with no config.
 */
function zpRenderConfigDetail(config) {
  if (!config) return '';
  let html = '';

  if (config.deliveryMode) {
    const dm = ZP_DELIVERY_MODES.find(d => d.id === config.deliveryMode);
    html += `<div class="kv-list" style="margin-top:0;">
      <div class="kv"><div class="k">Delivery</div><div class="v">${dm ? dm.icon + ' ' + dm.label : config.deliveryMode}</div></div>
      ${config.location ? `<div class="kv"><div class="k">Location</div><div class="v">${config.location.address || '—'}</div></div>` : ''}
    </div>`;
    if (config.location && config.location.lat && config.location.lng) {
      html += zpRenderMapEmbed(config.location.lat, config.location.lng, config.location.address);
    }
  }

  if (config.toolId) {
    const tool = zpGetTool(config.toolId);
    const plan = config.planId ? zpGetToolPlan(config.toolId, config.planId) : null;
    const toolLabel = tool ? tool.label : (config.toolId === ZP_CUSTOM_WEBSITE_TOOL_ID ? 'Custom Website Development (no vendor — see tech stack below)' : config.toolId);
    html += `<div class="kv-list">
      <div class="kv"><div class="k">Tool</div><div class="v">${toolLabel}</div></div>
      ${plan ? `<div class="kv"><div class="k">Plan</div><div class="v">${plan.label} — ${zpFormatToolPrice(plan)}</div></div>` : ''}
    </div>`;
  }

  html += chipGroupIf('Device Types', (config.deviceTypes || []).map(zpCatDeviceLabel));
  html += chipGroupIf('OS Targets', (config.osTargets || []).map(zpCatOsLabel));
  html += chipGroupIf('Connectivity', config.connectivity ? [zpCatConnectivityLabel(config.connectivity)] : []);

  if (config.techStack) {
    Object.keys(ZP_TECH_LAYER_LABEL).forEach(layer => {
      html += chipGroupIf(ZP_TECH_LAYER_LABEL[layer], config.techStack[layer] || []);
    });
  }

  if (config.automationBuilds && config.automationBuilds.length) {
    html += `<div style="margin-top:14px;">
      <div style="font-size:0.74rem;text-transform:uppercase;letter-spacing:0.03em;color:var(--muted);margin-bottom:6px;">Workflows to Build</div>
      <ul class="checklist">
        ${config.automationBuilds.map(w => `<li><span><strong>${w.name}</strong> — ${w.triggerApp} → ${w.actionApps.join(', ')}${w.description ? `<br><span class="text-muted" style="font-size:0.8rem;">${w.description}</span>` : ''}</span></li>`).join('')}
      </ul>
    </div>`;
  }

  return html;

  function chipGroupIf(label, items) {
    if (!items || !items.length) return '';
    return `<div style="margin-top:12px;">
      <div style="font-size:0.74rem;text-transform:uppercase;letter-spacing:0.03em;color:var(--muted);margin-bottom:6px;">${label}</div>
      <div>${items.map(t => `<span class="chip">${t}</span>`).join('')}</div>
    </div>`;
  }
}

/** An embedded OpenStreetMap iframe centered on lat/lng — no API key required. */
function zpRenderMapEmbed(lat, lng, label) {
  const d = 0.006;
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  return `<div class="map-embed">
    <iframe title="${label || 'Site location'}" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${lat},${lng}&layer=mapnik" loading="lazy"></iframe>
    <a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}" target="_blank" rel="noopener" class="map-embed-link">Open in OpenStreetMap ↗</a>
  </div>`;
}

/* ---------------------------------- Lookups (device/OS/connectivity labels) ---------------------------------- */

function zpCatDeviceLabel(id) { const d = ZP_CATALOGUE.deviceTypes.find(x => x.id === id); return d ? d.label : id; }
function zpCatOsLabel(id) { const o = ZP_CATALOGUE.osTargets.find(x => x.id === id); return o ? o.label : id; }
function zpCatConnectivityLabel(id) { const c = ZP_CATALOGUE.connectivityModes.find(x => x.id === id); return c ? c.label : id; }

/** Default checklist template for a newly created task, by internal category. */
function zpDefaultChecklist(category) {
  const templates = {
    'infrastructure': [
      'Provision hosting instance', 'Harden server (SSH, firewall, OS updates)',
      'Install & configure target platform', 'Configure domain, DNS & SSL',
      'Set up automated backups', 'Smoke-test the deployment',
      'Hand off admin credentials & documentation to customer'
    ],
    'software-platform': [
      'Create/confirm platform account', 'Connect data backend',
      'Configure views/screens for the requested device types',
      'Set access roles & permissions', 'User acceptance testing with customer',
      'Publish/deploy to production', 'Hand off admin access & training notes'
    ],
    'automation': [
      'Confirm plan tier & create/connect the workspace',
      'Connect all required app accounts (OAuth / API keys)',
      'Build each workflow listed in the configuration',
      'Add error handling & failure notifications',
      'Test each workflow end-to-end with real data',
      'Document each workflow for the customer',
      'Hand off admin access & training notes'
    ],
    'custom-development': [
      'Repository & environment setup', 'Implement backend / API',
      'Implement frontend / UI', 'Connect database', 'Write tests',
      'Deploy to staging for UAT', 'Address UAT feedback', 'Deploy to production & handover'
    ],
    'maintenance': [
      'Confirm monitoring coverage', 'Verify backup schedule',
      'Apply pending security patches', 'Send first monthly report'
    ]
  };
  return (templates[category] || ['Scope task', 'Complete work', 'Hand off to customer']).map(text => ({ text, done: false }));
}

/* =========================================================================
   Shared configurator component
   Mounts the full category -> tool -> plan -> device/OS/connectivity ->
   delivery/location -> tech-stack/automation picker into a container, used
   identically by the customer "Request a Service" form and the agency
   quote form. Everything is scoped under the container (no global ids),
   so it's safe even if a page mounts more than one instance.
   ========================================================================= */

function zpMountConfigurator(container, opts) {
  opts = opts || {};
  const state = { serviceCategoryId: null, toolId: null, planId: null, deliveryMode: 'virtual' };

  container.innerHTML = `
    <div class="category-picker" data-role="categoryPicker">
      ${ZP_SERVICE_CATEGORIES.map(def => `
        <button type="button" class="category-option" data-cat="${def.id}">
          <span class="icon">${def.icon}</span>
          <span class="title">${def.label}</span>
          <span class="desc">${def.description}</span>
        </button>`).join('')}
    </div>

    <div data-role="dynamicFields" style="display:none;">
      <div data-role="toolSection" style="display:none;margin-top:16px;">
        <h3 style="font-size:0.9rem;margin:0 0 8px;">Choose a tool</h3>
        <div data-role="toolList"></div>
        <div data-role="planSection" style="display:none;margin-top:10px;">
          <h3 style="font-size:0.9rem;margin:0 0 8px;">Choose a plan</h3>
          <div class="plan-grid" data-role="planList"></div>
        </div>
      </div>

      <div data-role="techStackSection" style="display:none;margin-top:16px;">
        <h3 style="font-size:0.9rem;margin:0 0 10px;">Tech Stack</h3>
        <div class="stack-layer"><div class="layer-label">Frontend</div><div class="check-grid" data-role="stack-frontend"></div></div>
        <div class="stack-layer"><div class="layer-label">Backend</div><div class="check-grid" data-role="stack-backend"></div></div>
        <div class="stack-layer"><div class="layer-label">Database</div><div class="check-grid" data-role="stack-database"></div></div>
        <div class="stack-layer"><div class="layer-label">Infrastructure &amp; Add-ons</div><div class="check-grid" data-role="stack-infraAddons"></div></div>
        <div class="stack-layer"><div class="layer-label">Integrations</div><div class="check-grid" data-role="stack-integrations"></div></div>
      </div>

      <div data-role="automationSection" style="display:none;margin-top:16px;">
        <h3 style="font-size:0.9rem;margin:0 0 8px;">Workflows to Build</h3>
        <div data-role="workflowList"></div>
        <button type="button" class="btn btn-secondary btn-sm" data-role="addWorkflow">+ Add Workflow</button>
      </div>

      <div data-role="deviceOsSection" style="margin-top:16px;">
        <div class="form-grid">
          <div class="field"><label>Device types</label><div class="check-grid" data-role="deviceTypes"></div></div>
          <div class="field"><label>OS targets</label><div class="check-grid" data-role="osTargets"></div></div>
        </div>
        <div class="field"><label>Connectivity</label><div class="check-grid" data-role="connectivity"></div></div>
      </div>

      <h3 style="font-size:0.9rem;margin:16px 0 8px;border-top:1px dashed var(--border);padding-top:16px;">Delivery</h3>
      <div class="category-picker" data-role="deliveryPicker" style="grid-template-columns:repeat(3,1fr);">
        ${ZP_DELIVERY_MODES.map(d => `<button type="button" class="category-option" data-mode="${d.id}"><span class="icon">${d.icon}</span><span class="title">${d.label}</span><span class="desc">${d.description}</span></button>`).join('')}
      </div>
      <div data-role="locationSection" style="display:none;margin-top:12px;">
        <div class="field"><label>Site address</label><input type="text" data-role="address" aria-label="Site address" placeholder="Street, city, state"></div>
        <div class="form-grid">
          <div class="field"><label>Latitude</label><input type="number" step="0.0001" data-role="lat" aria-label="Latitude" placeholder="e.g. 33.5091"></div>
          <div class="field"><label>Longitude</label><input type="number" step="0.0001" data-role="lng" aria-label="Longitude" placeholder="e.g. -111.9827"></div>
        </div>
        <p class="text-muted" style="font-size:0.76rem;">Tip: right-click the spot on <a href="https://www.openstreetmap.org" target="_blank" rel="noopener">OpenStreetMap</a> and copy the coordinates shown.</p>
        <div data-role="mapPreview"></div>
      </div>
    </div>
  `;

  const $ = sel => container.querySelector(`[data-role="${sel}"]`);
  const categoryPicker = $('categoryPicker');
  const dynamicFields = $('dynamicFields');
  const toolSection = $('toolSection');
  const toolList = $('toolList');
  const planSection = $('planSection');
  const planList = $('planList');
  const techStackSection = $('techStackSection');
  const automationSection = $('automationSection');
  const workflowList = $('workflowList');
  const deliveryPicker = $('deliveryPicker');
  const locationSection = $('locationSection');
  const mapPreview = $('mapPreview');

  function renderCheckGrid(role, items, type, groupName) {
    const el = $(role);
    el.innerHTML = items.map((item, i) => {
      const value = typeof item === 'string' ? item : item.id;
      const label = typeof item === 'string' ? item : item.label;
      const id = groupName + '_' + i + '_' + Math.random().toString(36).slice(2, 6);
      return `<div class="check-pill"><input type="${type}" name="${groupName}" id="${id}" value="${value}"><label for="${id}">${label}</label></div>`;
    }).join('');
  }
  function readChecked(groupName) {
    return Array.from(container.querySelectorAll(`input[name="${groupName}"]:checked`)).map(el => el.value);
  }
  function readRadio(groupName) {
    const el = container.querySelector(`input[name="${groupName}"]:checked`);
    return el ? el.value : null;
  }
  function clearGroup(groupName) {
    container.querySelectorAll(`input[name="${groupName}"]`).forEach(el => { el.checked = false; });
  }

  const deviceGroup = 'cfg_device_' + Math.random().toString(36).slice(2, 6);
  const osGroup = 'cfg_os_' + Math.random().toString(36).slice(2, 6);
  const connGroup = 'cfg_conn_' + Math.random().toString(36).slice(2, 6);
  renderCheckGrid('deviceTypes', ZP_CATALOGUE.deviceTypes, 'checkbox', deviceGroup);
  renderCheckGrid('osTargets', ZP_CATALOGUE.osTargets, 'checkbox', osGroup);
  renderCheckGrid('connectivity', ZP_CATALOGUE.connectivityModes, 'radio', connGroup);
  const stackGroups = {};
  Object.keys(ZP_TECH_LAYER_LABEL).forEach(layer => {
    stackGroups[layer] = 'cfg_stack_' + layer + '_' + Math.random().toString(36).slice(2, 6);
    renderCheckGrid('stack-' + layer, ZP_CATALOGUE.techStack[layer], 'checkbox', stackGroups[layer]);
  });

  function currentDef() { return zpServiceCategoryDef(state.serviceCategoryId); }
  function isCustomWebsite() { return state.toolId === ZP_CUSTOM_WEBSITE_TOOL_ID; }

  function refreshSections() {
    const def = currentDef();
    if (!def) { dynamicFields.style.display = 'none'; return; }
    dynamicFields.style.display = '';
    toolSection.style.display = def.tools.length ? '' : 'none';
    planSection.style.display = (state.toolId && !isCustomWebsite()) ? '' : 'none';
    techStackSection.style.display = (def.techStackPicker || isCustomWebsite()) ? '' : 'none';
    automationSection.style.display = def.id === 'automation' ? '' : 'none';
  }

  function renderToolList() {
    const def = currentDef();
    const tools = def.tools.map(zpGetTool).filter(Boolean);
    let html = tools.map(t => `<div class="tool-card ${state.toolId === t.id ? 'selected' : ''}" data-tool="${t.id}">
      <div class="tool-head"><strong>${t.label}</strong><span class="text-muted" style="font-size:0.76rem;">${t.vendor}</span></div>
      <div class="tool-specialty">${t.specialty}</div>
    </div>`).join('');
    if (def.allowCustom) {
      html += `<div class="tool-card ${isCustomWebsite() ? 'selected' : ''}" data-tool="${ZP_CUSTOM_WEBSITE_TOOL_ID}">
        <div class="tool-head"><strong>Custom Website Development</strong><span class="text-muted" style="font-size:0.76rem;">Built from scratch</span></div>
        <div class="tool-specialty">No off-the-shelf builder — a bespoke site built with a hand-picked tech stack.</div>
      </div>`;
    }
    toolList.innerHTML = html;
  }

  function renderPlanList() {
    if (!state.toolId || isCustomWebsite()) { planList.innerHTML = ''; return; }
    const tool = zpGetTool(state.toolId);
    if (!tool) { planList.innerHTML = ''; return; }
    planList.innerHTML = tool.plans.map(p => `<button type="button" class="plan-pick-card ${state.planId === p.id ? 'selected' : ''}" data-plan="${p.id}">
      <div class="plan-card-head"><strong>${p.label}</strong><span class="plan-price">${zpFormatToolPrice(p)}</span></div>
      <ul class="plan-feature-list">${p.features.slice(0, 3).map(f => `<li>✓ ${f}</li>`).join('')}</ul>
    </button>`).join('');
  }

  categoryPicker.addEventListener('click', e => {
    const btn = e.target.closest('.category-option');
    if (!btn) return;
    state.serviceCategoryId = btn.getAttribute('data-cat');
    state.toolId = null; state.planId = null;
    categoryPicker.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');
    renderToolList();
    renderPlanList();
    refreshSections();
    if (opts.onChange) opts.onChange();
  });

  toolList.addEventListener('click', e => {
    const card = e.target.closest('[data-tool]');
    if (!card) return;
    state.toolId = card.getAttribute('data-tool');
    state.planId = null;
    renderToolList();
    renderPlanList();
    refreshSections();
    if (opts.onChange) opts.onChange();
  });

  planList.addEventListener('click', e => {
    const card = e.target.closest('[data-plan]');
    if (!card) return;
    state.planId = card.getAttribute('data-plan');
    renderPlanList();
    if (opts.onChange) opts.onChange();
  });

  /* --- Delivery mode + location --- */
  function selectDeliveryMode(mode) {
    state.deliveryMode = mode;
    deliveryPicker.querySelectorAll('.category-option').forEach(el => el.classList.toggle('selected', el.getAttribute('data-mode') === mode));
    locationSection.style.display = mode !== 'virtual' ? '' : 'none';
    updateMapPreview();
  }
  deliveryPicker.addEventListener('click', e => {
    const btn = e.target.closest('.category-option');
    if (!btn) return;
    selectDeliveryMode(btn.getAttribute('data-mode'));
  });
  selectDeliveryMode('virtual');

  function updateMapPreview() {
    const lat = parseFloat($('lat').value), lng = parseFloat($('lng').value);
    mapPreview.innerHTML = (!isNaN(lat) && !isNaN(lng)) ? zpRenderMapEmbed(lat, lng, $('address').value) : '';
  }
  $('lat').addEventListener('change', updateMapPreview);
  $('lng').addEventListener('change', updateMapPreview);

  /* --- Automation workflow builder --- */
  let workflows = [];
  function renderWorkflows() {
    workflowList.innerHTML = workflows.map((w, i) => `<div class="workflow-row" data-wf="${i}">
      <div class="wf-grid">
        <div class="field" style="margin-bottom:0;"><label>Workflow name</label><input type="text" class="wf-name" aria-label="Workflow name" value="${w.name || ''}" placeholder="e.g. New Order → Sheet + Slack"></div>
        <div class="field" style="margin-bottom:0;"><label>Trigger app</label><select class="wf-trigger">${ZP_CATALOGUE.connectorApps.map(a => `<option ${w.triggerApp === a ? 'selected' : ''}>${a}</option>`).join('')}</select></div>
      </div>
      <div class="field" style="margin-bottom:6px;"><label>Action app(s) — hold Ctrl/Cmd to select more than one</label>
        <select class="wf-actions" multiple size="4">${ZP_CATALOGUE.connectorApps.map(a => `<option ${(w.actionApps || []).includes(a) ? 'selected' : ''}>${a}</option>`).join('')}</select>
      </div>
      <div class="field" style="margin-bottom:6px;"><label>Description</label><input type="text" class="wf-desc" aria-label="Workflow description" value="${w.description || ''}" placeholder="What this workflow does"></div>
      <button type="button" class="wf-remove" data-remove-wf="${i}">✕ Remove workflow</button>
    </div>`).join('') || `<p class="text-muted" style="font-size:0.84rem;">No workflows added yet.</p>`;
  }
  $('addWorkflow').addEventListener('click', () => { workflows.push({ name: '', triggerApp: ZP_CATALOGUE.connectorApps[0], actionApps: [], description: '' }); renderWorkflows(); });
  workflowList.addEventListener('click', e => {
    const btn = e.target.closest('[data-remove-wf]');
    if (btn) { workflows.splice(parseInt(btn.getAttribute('data-remove-wf'), 10), 1); syncWorkflowsFromDom(); renderWorkflows(); }
  });
  function syncWorkflowsFromDom() {
    workflows = Array.from(workflowList.querySelectorAll('[data-wf]')).map(row => ({
      name: row.querySelector('.wf-name').value.trim(),
      triggerApp: row.querySelector('.wf-trigger').value,
      actionApps: Array.from(row.querySelector('.wf-actions').selectedOptions).map(o => o.value),
      description: row.querySelector('.wf-desc').value.trim()
    }));
  }
  renderWorkflows();

  /* ---------------------------------- Public API ---------------------------------- */

  function reset() {
    state.serviceCategoryId = null; state.toolId = null; state.planId = null;
    categoryPicker.querySelectorAll('.category-option').forEach(el => el.classList.remove('selected'));
    dynamicFields.style.display = 'none';
    clearGroup(deviceGroup); clearGroup(osGroup); clearGroup(connGroup);
    Object.values(stackGroups).forEach(clearGroup);
    workflows = []; renderWorkflows();
    $('address').value = ''; $('lat').value = ''; $('lng').value = '';
    selectDeliveryMode('virtual');
  }

  /** Preload the picker from a saved config + serviceCategoryId (e.g. reviewing a customer request). */
  function setState(serviceCategoryId, config) {
    reset();
    if (!serviceCategoryId) return;
    state.serviceCategoryId = serviceCategoryId;
    categoryPicker.querySelectorAll('.category-option').forEach(el => el.classList.toggle('selected', el.getAttribute('data-cat') === serviceCategoryId));
    renderToolList();
    config = config || {};
    if (config.toolId) { state.toolId = config.toolId; renderToolList(); renderPlanList(); }
    if (config.planId) { state.planId = config.planId; renderPlanList(); }
    refreshSections();
    (config.deviceTypes || []).forEach(v => { const el = container.querySelector(`input[name="${deviceGroup}"][value="${v}"]`); if (el) el.checked = true; });
    (config.osTargets || []).forEach(v => { const el = container.querySelector(`input[name="${osGroup}"][value="${v}"]`); if (el) el.checked = true; });
    if (config.connectivity) { const el = container.querySelector(`input[name="${connGroup}"][value="${config.connectivity}"]`); if (el) el.checked = true; }
    if (config.techStack) {
      Object.keys(stackGroups).forEach(layer => {
        (config.techStack[layer] || []).forEach(v => { const el = container.querySelector(`input[name="${stackGroups[layer]}"][value="${v}"]`); if (el) el.checked = true; });
      });
    }
    if (config.automationBuilds && config.automationBuilds.length) { workflows = config.automationBuilds.map(w => ({ ...w })); renderWorkflows(); }
    selectDeliveryMode(config.deliveryMode || 'virtual');
    if (config.location) {
      $('address').value = config.location.address || '';
      $('lat').value = config.location.lat != null ? config.location.lat : '';
      $('lng').value = config.location.lng != null ? config.location.lng : '';
      updateMapPreview();
    }
  }

  function getInternalCategory() {
    const def = currentDef();
    if (!def) return null;
    return isCustomWebsite() ? 'custom-development' : def.internalCategory;
  }

  function getConfig() {
    const def = currentDef();
    syncWorkflowsFromDom();
    const useTechStack = def && (def.techStackPicker || isCustomWebsite());
    return {
      deliveryMode: state.deliveryMode,
      location: state.deliveryMode !== 'virtual' ? {
        address: $('address').value.trim(),
        lat: parseFloat($('lat').value) || null,
        lng: parseFloat($('lng').value) || null
      } : null,
      // toolId is kept even for the pseudo "custom-website" marker so a saved config still
      // remembers the customer's intent when it's redisplayed (e.g. the agency reopening a request).
      toolId: state.toolId || null,
      planId: (state.toolId && !isCustomWebsite()) ? state.planId : null,
      deviceTypes: readChecked(deviceGroup),
      osTargets: readChecked(osGroup),
      connectivity: readRadio(connGroup),
      techStack: useTechStack ? {
        frontend: readChecked(stackGroups.frontend), backend: readChecked(stackGroups.backend),
        database: readChecked(stackGroups.database), infraAddons: readChecked(stackGroups.infraAddons),
        integrations: readChecked(stackGroups.integrations)
      } : null,
      automationBuilds: def && def.id === 'automation' ? workflows.filter(w => w.name) : []
    };
  }

  function getSuggestedPrice() {
    if (!state.toolId || !state.planId) return null;
    const plan = zpGetToolPlan(state.toolId, state.planId);
    return plan ? plan.price : null;
  }

  return {
    getServiceCategoryId: () => state.serviceCategoryId,
    getInternalCategory, getConfig, getSuggestedPrice, reset, setState
  };
}

/* =========================================================================
   Savings advisor
   Compares a customer's self-reported software assets against the
   catalogue to flag likely savings — never a hard rule, always shown as a
   suggestion with the reasoning and an estimated dollar figure so a human
   makes the final call. A customer's own noted reason for a recurring
   charge (reasonForRecurringCharge) always suppresses the "unjustified
   fee" flag — the point is catching unexplained cost, not penalizing
   legitimate support/maintenance agreements.
   ========================================================================= */

/** The first tool in a category that has a $0 plan — used as a free-alternative suggestion. */
function zpCheapestFreeAlternative(categoryDefId) {
  const def = zpServiceCategoryDef(categoryDefId);
  if (!def) return null;
  for (const toolId of def.tools) {
    const tool = zpGetTool(toolId);
    if (!tool) continue;
    const freePlan = tool.plans.find(p => p.price === 0);
    if (freePlan) return { tool, plan: freePlan };
  }
  return null;
}

/** A free automation tool whose free-tier automation limit covers the customer's stated usage. */
function zpAutomationFreeAlternative(automationCount) {
  const candidates = [{ toolId: 'ifttt', planId: 'free', limit: 2 }, { toolId: 'make', planId: 'free', limit: 2 }];
  for (const c of candidates) {
    if (automationCount <= c.limit) {
      const tool = zpGetTool(c.toolId), plan = tool ? zpGetToolPlan(c.toolId, c.planId) : null;
      if (tool && plan) return { tool, plan, limit: c.limit };
    }
  }
  return null;
}

/** Runs every rule against one software asset. Returns a list of findings (often empty). */
function zpAnalyzeAsset(asset) {
  const findings = [];
  const annualCost = zpAssetAnnualCost(asset);

  if (asset.deploymentType === 'local' && asset.billing.cycle !== 'one-time' && asset.billing.amount > 0 && !asset.reasonForRecurringCharge) {
    const alt = zpCheapestFreeAlternative(asset.category);
    findings.push({
      assetId: asset.id, type: 'unjustified-recurring-fee', severity: 'high',
      message: `${asset.name} charges ${zpFormatCurrency(annualCost, asset.billing.currency)}/yr for software installed locally, with no maintenance or support reason on file.`,
      suggestion: alt ? `Consider ${alt.tool.label} (${alt.plan.label}) instead — ${zpFormatToolPrice(alt.plan).toLowerCase()}, and supports local/self-hosted deployment.` : 'Ask the vendor what the recurring fee actually covers, or look at a self-hosted alternative.',
      estimatedAnnualSavings: annualCost
    });
  }

  if (asset.category === 'automation' && asset.automationCount != null && asset.billing.amount > 0) {
    const alt = zpAutomationFreeAlternative(asset.automationCount);
    if (alt) {
      findings.push({
        assetId: asset.id, type: 'automation-downgrade', severity: 'medium',
        message: `${asset.name} costs ${zpFormatCurrency(annualCost, asset.billing.currency)}/yr for just ${asset.automationCount} automation${asset.automationCount === 1 ? '' : 's'}.`,
        suggestion: `${alt.tool.label}'s free plan covers up to ${alt.limit} automations at no cost — switching would need a small setup pass from our team to rebuild them there.`,
        estimatedAnnualSavings: annualCost
      });
    }
  }

  return findings;
}

/** All findings across every software asset a customer has on file, sorted highest-savings first. */
function zpAllSavingsForCustomer(customerId) {
  const findings = zpGetAssetsForCustomer(customerId).flatMap(zpAnalyzeAsset);
  return findings.sort((a, b) => b.estimatedAnnualSavings - a.estimatedAnnualSavings);
}
