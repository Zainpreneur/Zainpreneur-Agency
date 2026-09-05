/* =========================================================================
   Zainpreneur Agency — Software & Deployment Catalogue
   The single source of truth for "what can be built/deployed" — hosting
   providers & plans, off-the-shelf platforms (with the device/OS/connectivity
   combinations each one actually supports), and the layered tech stack
   catalogue for custom development. Both the Agency quoting flow and the
   Team execution portal read from this file so a task's configuration is
   always built from the same option set.
   ========================================================================= */

const ZP_CATALOGUE = {

  categories: [
    { id: 'infrastructure', label: 'Infrastructure & Hosting', icon: '🖥️' },
    { id: 'software-platform', label: 'Software Platform', icon: '🧩' },
    { id: 'custom-development', label: 'Custom Development', icon: '🛠️' },
    { id: 'maintenance', label: 'Maintenance & Support', icon: '🔧' }
  ],

  hostingProviders: [
    { id: 'hostinger', label: 'Hostinger', plans: [
      { id: 'vps-kvm-1', label: 'VPS KVM 1', specs: '1 vCPU · 4GB RAM · 50GB NVMe' },
      { id: 'vps-kvm-2', label: 'VPS KVM 2', specs: '2 vCPU · 8GB RAM · 100GB NVMe' },
      { id: 'vps-kvm-4', label: 'VPS KVM 4', specs: '4 vCPU · 16GB RAM · 200GB NVMe' },
      { id: 'vps-kvm-8', label: 'VPS KVM 8', specs: '8 vCPU · 32GB RAM · 400GB NVMe' }
    ]},
    { id: 'digitalocean', label: 'DigitalOcean', plans: [
      { id: 'droplet-basic', label: 'Basic Droplet', specs: '1 vCPU · 2GB RAM · 50GB SSD' },
      { id: 'droplet-general', label: 'General Purpose Droplet', specs: '4 vCPU · 16GB RAM · 200GB SSD' }
    ]},
    { id: 'aws', label: 'AWS', plans: [
      { id: 'ec2-t3-micro', label: 'EC2 t3.micro', specs: '2 vCPU · 1GB RAM' },
      { id: 'ec2-t3-large', label: 'EC2 t3.large', specs: '2 vCPU · 8GB RAM' }
    ]}
  ],

  // Off-the-shelf software platforms. deviceTypes/osTargets/modes describe
  // what that platform can actually be configured to support — the picker
  // uses these to only offer combinations that make sense.
  platforms: [
    { id: 'odoo', label: 'Odoo (ERP)', deployedOn: ['hostinger', 'digitalocean', 'aws'],
      deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], modes: ['online'] },
    { id: 'wordpress-woocommerce', label: 'WordPress / WooCommerce', deployedOn: ['hostinger', 'digitalocean'],
      deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], modes: ['online'] },
    { id: 'shopify', label: 'Shopify', deployedOn: [],
      deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], modes: ['online'] },
    { id: 'appsheet', label: 'AppSheet', deployedOn: [], dataBackends: ['google-sheets', 'google-cloud-sql', 'airtable'],
      deviceTypes: ['laptop', 'desktop', 'mobile', 'tablet'], osTargets: ['android', 'ios', 'cross-platform'], modes: ['online', 'offline', 'hybrid'] },
    { id: 'glide', label: 'Glide', deployedOn: [], dataBackends: ['google-sheets', 'airtable'],
      deviceTypes: ['mobile', 'tablet'], osTargets: ['android', 'ios', 'cross-platform'], modes: ['online', 'hybrid'] }
  ],

  dataBackends: [
    { id: 'google-sheets', label: 'Google Sheets' },
    { id: 'airtable', label: 'Airtable' },
    { id: 'google-cloud-sql', label: 'Google Cloud SQL' },
    { id: 'firebase-firestore', label: 'Firebase Firestore' }
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

  // Layered tech stack for custom development — each item is picked
  // individually ("one by one") rather than as a single stack preset.
  techStack: {
    frontend: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Svelte', 'Flutter', 'React Native', 'Swift (iOS native)', 'Kotlin (Android native)'],
    backend: ['Node.js / Express', 'Python / Django', 'Python / FastAPI', 'PHP / Laravel', 'Ruby on Rails', 'Java / Spring Boot', '.NET / C#', 'Go'],
    database: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Firebase Firestore', 'Microsoft SQL Server'],
    infraAddons: ['Redis', 'Elasticsearch', 'RabbitMQ', 'Docker', 'Kubernetes', 'Nginx', 'GraphQL', 'WebSockets'],
    integrations: ['Stripe (Payments)', 'Twilio (SMS)', 'SendGrid (Email)', 'Google Maps API', 'Auth0 (Auth)', 'Firebase Auth']
  }
};

const ZP_TECH_LAYER_LABEL = {
  frontend: 'Frontend', backend: 'Backend', database: 'Database',
  infraAddons: 'Infrastructure & Add-ons', integrations: 'Integrations'
};

/* ---------------------------------- Lookups ---------------------------------- */

function zpCatProvider(id) { return ZP_CATALOGUE.hostingProviders.find(p => p.id === id) || null; }
function zpCatPlan(providerId, planId) {
  const p = zpCatProvider(providerId);
  return p ? (p.plans.find(pl => pl.id === planId) || null) : null;
}
function zpCatPlatform(id) { return ZP_CATALOGUE.platforms.find(p => p.id === id) || null; }
function zpCatDataBackend(id) { return ZP_CATALOGUE.dataBackends.find(d => d.id === id) || null; }
function zpCatDeviceLabel(id) { const d = ZP_CATALOGUE.deviceTypes.find(x => x.id === id); return d ? d.label : id; }
function zpCatOsLabel(id) { const o = ZP_CATALOGUE.osTargets.find(x => x.id === id); return o ? o.label : id; }
function zpCatConnectivityLabel(id) { const c = ZP_CATALOGUE.connectivityModes.find(x => x.id === id); return c ? c.label : id; }

/**
 * Renders a service/task's structured `config` object as grouped chip
 * sections (Platform, Device Types, OS Targets, Connectivity, and — for
 * custom development — one chip group per tech-stack layer). Returns ''
 * for services with no config (older/simple catalogue entries).
 */
function zpRenderConfigDetail(config) {
  if (!config) return '';
  const blocks = [];

  if (config.hostingProvider) {
    const provider = zpCatProvider(config.hostingProvider);
    const plan = zpCatPlan(config.hostingProvider, config.hostingPlan);
    blocks.push(kv('Hosting', `${provider ? provider.label : config.hostingProvider}${plan ? ' — ' + plan.label : ''}`, plan ? plan.specs : ''));
  }
  if (config.platform) {
    const platform = zpCatPlatform(config.platform);
    blocks.push(kv('Platform', platform ? platform.label : config.platform));
  }
  if (config.dataBackend) {
    const backend = zpCatDataBackend(config.dataBackend);
    blocks.push(kv('Data Backend', backend ? backend.label : config.dataBackend));
  }

  let html = blocks.length ? `<div class="kv-list" style="margin-top:0;">${blocks.join('')}</div>` : '';

  if (config.deviceTypes && config.deviceTypes.length) {
    html += chipGroup('Device Types', config.deviceTypes.map(zpCatDeviceLabel));
  }
  if (config.osTargets && config.osTargets.length) {
    html += chipGroup('OS Targets', config.osTargets.map(zpCatOsLabel));
  }
  if (config.connectivity) {
    html += chipGroup('Connectivity', [zpCatConnectivityLabel(config.connectivity)]);
  }
  if (config.techStack) {
    Object.keys(ZP_TECH_LAYER_LABEL).forEach(layer => {
      const items = config.techStack[layer];
      if (items && items.length) html += chipGroup(ZP_TECH_LAYER_LABEL[layer], items);
    });
  }
  return html;

  function kv(k, v, sub) {
    return `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div>${sub ? `<div class="text-muted" style="font-size:0.72rem;">${sub}</div>` : ''}</div>`;
  }
  function chipGroup(label, items) {
    return `<div style="margin-top:12px;">
      <div style="font-size:0.74rem;text-transform:uppercase;letter-spacing:0.03em;color:var(--muted);margin-bottom:6px;">${label}</div>
      <div>${items.map(t => `<span class="chip">${t}</span>`).join('')}</div>
    </div>`;
  }
}

/** Default checklist template for a newly created task, by category. */
function zpDefaultChecklist(category) {
  const templates = {
    'infrastructure': [
      'Provision hosting instance',
      'Harden server (SSH, firewall, OS updates)',
      'Install & configure target platform',
      'Configure domain, DNS & SSL',
      'Set up automated backups',
      'Smoke-test the deployment',
      'Hand off admin credentials & documentation to customer'
    ],
    'software-platform': [
      'Create/confirm platform account',
      'Connect data backend',
      'Configure views/screens for the requested device types',
      'Set access roles & permissions',
      'User acceptance testing with customer',
      'Publish/deploy to production',
      'Hand off admin access & training notes'
    ],
    'custom-development': [
      'Repository & environment setup',
      'Implement backend / API',
      'Implement frontend / UI',
      'Connect database',
      'Write tests',
      'Deploy to staging for UAT',
      'Address UAT feedback',
      'Deploy to production & handover'
    ],
    'maintenance': [
      'Confirm monitoring coverage',
      'Verify backup schedule',
      'Apply pending security patches',
      'Send first monthly report'
    ]
  };
  return (templates[category] || ['Scope task', 'Complete work', 'Hand off to customer']).map(text => ({ text, done: false }));
}
