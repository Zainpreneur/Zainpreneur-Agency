/* =========================================================================
   Zainpreneur Agency — Client Portal data layer
   Pure client-side (no backend). Data lives in localStorage, seeded on
   first load from ZP_SEED below. Everything downstream (dashboard,
   services, invoices, requests, agency console) reads/writes through the
   helpers in this file so there is a single source of truth.
   ========================================================================= */

const ZP_STORAGE_KEY = 'zp_portal_data_v1';

/* Fixed "today" reference used across the demo so relative dates
   (overdue invoices, upcoming renewals, etc.) stay meaningful no matter
   when this is opened. Swap to `new Date()` to run against the real clock. */
const ZP_TODAY = new Date('2026-09-05T09:00:00');

const ZP_SEED = {
  customers: [
    {
      id: 'cust-a', company: 'Aegis Retail Co.', contact: 'Sarah Kim',
      email: 'sarah@aegisretail.com', password: 'demo1234',
      phone: '+1 (415) 555-0142', industry: 'Retail & E-commerce',
      since: '2024-03-01', accountManager: 'Zain Ahmed', initials: 'AR'
    },
    {
      id: 'cust-b', company: 'Bluewave Logistics', contact: 'Marcus Ortega',
      email: 'marcus@bluewavelog.com', password: 'demo1234',
      phone: '+1 (312) 555-0198', industry: 'Logistics & Freight',
      since: '2024-07-15', accountManager: 'Zain Ahmed', initials: 'BL'
    },
    {
      id: 'cust-c', company: 'Horizon Dental Group', contact: 'Dr. Amina Farouk',
      email: 'amina@horizondental.com', password: 'demo1234',
      phone: '+1 (602) 555-0175', industry: 'Healthcare',
      since: '2025-01-10', accountManager: 'Zain Ahmed', initials: 'HD'
    },
    {
      id: 'cust-d', company: 'Nimbus Foods Co.', contact: 'Devon Price',
      email: 'devon@nimbusfoods.com', password: 'demo1234',
      phone: '+1 (503) 555-0110', industry: 'Food & Beverage',
      since: '2026-08-01', accountManager: 'Zain Ahmed', initials: 'NF'
    }
  ],

  // Agency staff account(s) — separate from customer logins.
  agencyUsers: [
    { id: 'agency-1', name: 'Zain Ahmed', email: 'zainpreneur@gmail.com', password: 'agency123', role: 'Founder / Account Manager' }
  ],

  // Delivery team accounts — sign into the Team Portal to work assigned tasks.
  teamUsers: [
    { id: 'team-1', name: 'Imran Qureshi', email: 'imran@zainpreneur.agency', password: 'team1234', role: 'Infrastructure Engineer', skills: ['Linux', 'Docker', 'Odoo', 'Hostinger'] },
    { id: 'team-2', name: 'Layla Haddad', email: 'layla@zainpreneur.agency', password: 'team1234', role: 'Full-Stack Developer', skills: ['React', 'FastAPI', 'PostgreSQL', 'Node.js'] },
    { id: 'team-3', name: 'Marco Silva', email: 'marco@zainpreneur.agency', password: 'team1234', role: 'No-Code / App Specialist', skills: ['AppSheet', 'Glide', 'Google Workspace'] },
    { id: 'team-4', name: 'Priya Nadar', email: 'priya@zainpreneur.agency', password: 'team1234', role: 'Automation Engineer', skills: ['n8n', 'Make', 'Zapier', 'API integrations'] }
  ],

  // Sellable catalogue items — hosting providers, off-the-shelf platforms, and automation
  // tools — each with real plan tiers. Pricing/features here were gathered via web search
  // against third-party pricing trackers on the date shown (vendor sites were unreachable
  // from this environment) — treat as a strong starting point, not gospel; verify on the
  // vendor's own site before quoting a customer, or use "Update Pricing" once confirmed.
  catalogueTools: {
    'hostinger-website': {
      id: 'hostinger-website', label: 'Hostinger Website Builder', vendor: 'Hostinger',
      website: 'https://www.hostinger.com/website-builder', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Fastest, cheapest way to get a small business online with an AI-assisted drag-and-drop builder.',
      plans: [
        { id: 'premium', label: 'Premium', price: 10.99, currency: 'USD', cycle: 'monthly', limits: { storage: '50GB', websites: '100' }, features: ['AI website builder', 'Free domain (1st year)', 'Free SSL', 'Unlimited bandwidth'], limitations: ['No custom code / dev tools'] },
        { id: 'business', label: 'Business', price: 13.99, currency: 'USD', cycle: 'monthly', limits: { storage: '100GB', websites: '100' }, features: ['Everything in Premium', 'Online store (up to 100 products)', 'Abandoned cart recovery', 'Automated sales tax'], limitations: [] }
      ]
    },
    'hubspot-cms': {
      id: 'hubspot-cms', label: 'HubSpot CMS (Content Hub)', vendor: 'HubSpot',
      website: 'https://www.hubspot.com/pricing/cms', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best when the website needs to be tightly wired into a CRM/marketing stack the customer already runs.',
      plans: [
        { id: 'free', label: 'Free', price: 0, currency: 'USD', cycle: 'free', limits: { pages: '25' }, features: ['Basic drag-and-drop editor', 'SSL'], limitations: ['HubSpot branding shown', 'Very limited pages'] },
        { id: 'starter', label: 'Starter', price: 20, currency: 'USD', cycle: 'monthly-per-seat', limits: {}, features: ['No HubSpot branding', 'Multi-language content', 'Full CRM access'], limitations: ['No A/B testing or smart content'] },
        { id: 'professional', label: 'Professional', price: 500, currency: 'USD', cycle: 'monthly', limits: { seats: '3 included, +$50/seat' }, features: ['A/B testing', 'SEO recommendations', 'Smart/personalized content', 'Custom reporting', 'HubDB'], limitations: [] },
        { id: 'enterprise', label: 'Enterprise', price: 1500, currency: 'USD', cycle: 'monthly', limits: { seats: '5 included, +$75/seat' }, features: ['Adaptive testing', 'Memberships', 'Content partitioning', 'Additional root domains'], limitations: [] }
      ]
    },
    'odoo': {
      id: 'odoo', label: 'Odoo', vendor: 'Odoo',
      website: 'https://www.odoo.com/pricing', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'One platform for website + ERP + CRM + inventory + accounting — pick one app free, pay per user as you add more.',
      plans: [
        { id: 'one-app-free', label: 'One App Free', price: 0, currency: 'USD', cycle: 'free', limits: { apps: '1 app', users: 'Unlimited' }, features: ['1 app of your choice', 'Unlimited users', 'Odoo Online hosting'], limitations: ['Only 1 app'] },
        { id: 'standard', label: 'Standard', price: 31.10, currency: 'USD', cycle: 'per-user-monthly', limits: { apps: 'All apps' }, features: ['All Odoo apps', 'Standard support', 'Odoo Online or Odoo.sh hosting'], limitations: ['No Odoo Studio / external API'] },
        { id: 'custom', label: 'Custom', price: 61.00, currency: 'USD', cycle: 'per-user-monthly', limits: { apps: 'All apps' }, features: ['Everything in Standard', 'Odoo Studio (custom fields/views)', 'Multi-company', 'External API access', 'On-premise hosting option'], limitations: [] }
      ]
    },
    'wordpress-woocommerce': {
      id: 'wordpress-woocommerce', label: 'WordPress / WooCommerce', vendor: 'Automattic / Open Source',
      website: 'https://wordpress.org', lastVerified: '2026-09-05', dataSource: 'known (open source)',
      specialty: 'The most flexible option when the customer wants full ownership and a huge plugin ecosystem — cost is hosting + build time, not a license.',
      plans: [
        { id: 'self-hosted', label: 'Self-hosted (open source)', price: 0, currency: 'USD', cycle: 'free', limits: {}, features: ['Free core software', 'Thousands of free/paid plugins & themes', 'Full code-level control'], limitations: ['You manage hosting, updates & security', 'No vendor support line — pair with a hosting/maintenance plan'] }
      ]
    },
    'shopify': {
      id: 'shopify', label: 'Shopify', vendor: 'Shopify',
      website: 'https://www.shopify.com/pricing', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best for a dedicated online store where checkout, payments and shipping need to just work out of the box.',
      plans: [
        { id: 'basic', label: 'Basic', price: 39, currency: 'USD', cycle: 'monthly', limits: { staffAccounts: '2 staff accounts', transactionFee: '2% (non-Shopify Payments)' }, features: ['Unlimited products', 'Online store + basic reports'], limitations: [] },
        { id: 'grow', label: 'Shopify (Grow)', price: 105, currency: 'USD', cycle: 'monthly', limits: { staffAccounts: '5 staff accounts', transactionFee: '1% (non-Shopify Payments)' }, features: ['Professional reports', 'Lower transaction fees'], limitations: [] },
        { id: 'advanced', label: 'Advanced', price: 399, currency: 'USD', cycle: 'monthly', limits: { staffAccounts: '15 staff accounts', transactionFee: '0.6% (non-Shopify Payments)' }, features: ['Advanced report builder', 'Third-party calculated shipping rates'], limitations: [] }
      ]
    },
    'appsheet': {
      id: 'appsheet', label: 'AppSheet', vendor: 'Google',
      website: 'https://about.appsheet.com/pricing/', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best for turning an existing Google Sheet / Airtable base into a real mobile app fast, with offline support built in.',
      plans: [
        { id: 'starter', label: 'Starter', price: 5, currency: 'USD', cycle: 'per-user-monthly', limits: {}, features: ['Basic apps', 'Core automations'], limitations: ['No advanced workflows'] },
        { id: 'core', label: 'Core', price: 10, currency: 'USD', cycle: 'per-user-monthly', limits: {}, features: ['Advanced workflows', 'Offline sync', 'Custom branding'], limitations: [] },
        { id: 'enterprise-plus', label: 'Enterprise Plus', price: 20, currency: 'USD', cycle: 'per-user-monthly', limits: {}, features: ['Enterprise security & governance', 'Dedicated support'], limitations: [] }
      ]
    },
    'glide': {
      id: 'glide', label: 'Glide', vendor: 'Glide',
      website: 'https://www.glideapps.com/pricing', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best for a small, polished mobile app fronting a Google Sheet or Airtable base, with the cleanest builder UI of the no-code options.',
      plans: [
        { id: 'free', label: 'Free', price: 0, currency: 'USD', cycle: 'free', limits: { apps: '1 app', users: '10 users', rows: '500 rows' }, features: ['Prototyping & personal projects'], limitations: ['1,000 updates/mo cap'] },
        { id: 'maker', label: 'Maker', price: 49, currency: 'USD', cycle: 'monthly', limits: { apps: '3 apps' }, features: ['Small portfolio of published apps'], limitations: ['500 updates/mo cap'] },
        { id: 'business', label: 'Business', price: 199, currency: 'USD', cycle: 'monthly', limits: { users: '30 users, +$5/user' }, features: ['Airtable & Excel data sources', 'Glide API', 'Work email sign-in'], limitations: [] }
      ]
    },
    'n8n': {
      id: 'n8n', label: 'n8n', vendor: 'n8n',
      website: 'https://n8n.io/pricing/', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best for teams who want full workflow control and are comfortable self-hosting, or want to pay per execution rather than per task.',
      plans: [
        { id: 'self-hosted', label: 'Self-hosted (Community)', price: 0, currency: 'USD', cycle: 'free', limits: {}, features: ['Unlimited workflows & executions (self-managed)', '400+ integrations', 'Full workflow control'], limitations: ['You manage hosting, updates & uptime'] },
        { id: 'cloud-starter', label: 'Cloud Starter', price: 20, currency: 'EUR', cycle: 'monthly', limits: { executions: '2,500 executions/mo' }, features: ['Unlimited users, workflows & steps'], limitations: [] },
        { id: 'cloud-pro', label: 'Cloud Pro', price: 50, currency: 'EUR', cycle: 'monthly', limits: { executions: '10,000 executions/mo' }, features: ['Unlimited users, workflows & steps'], limitations: [] }
      ]
    },
    'make': {
      id: 'make', label: 'Make', vendor: 'Make (Celonis)',
      website: 'https://www.make.com/en/pricing', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best for complex, visual workflows with branching logic — a step up in power from Zapier at a lower per-operation cost.',
      plans: [
        { id: 'free', label: 'Free', price: 0, currency: 'USD', cycle: 'free', limits: { ops: '1,000 ops/mo', scenarios: '2 active scenarios' }, features: [], limitations: [] },
        { id: 'core', label: 'Core', price: 12, currency: 'USD', cycle: 'monthly', limits: { ops: '10,000 ops/mo' }, features: ['Unlimited active scenarios'], limitations: [] },
        { id: 'pro', label: 'Pro', price: 21, currency: 'USD', cycle: 'monthly', limits: { ops: '10,000 ops/mo' }, features: ['Custom variables', 'Full-text search'], limitations: [] },
        { id: 'teams', label: 'Teams', price: 38, currency: 'USD', cycle: 'monthly', limits: { ops: '10,000 ops/mo' }, features: ['Team collaboration', 'Shared scenario templates', 'Role management'], limitations: [] }
      ]
    },
    'zapier': {
      id: 'zapier', label: 'Zapier', vendor: 'Zapier',
      website: 'https://zapier.com/pricing', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best for simplicity and the largest app directory — the easiest to hand off to a non-technical customer, at a higher per-task cost.',
      plans: [
        { id: 'free', label: 'Free', price: 0, currency: 'USD', cycle: 'free', limits: { tasks: '100 tasks/mo', zaps: '5 Zaps' }, features: [], limitations: ['Single-step Zaps only'] },
        { id: 'starter', label: 'Starter', price: 19.99, currency: 'USD', cycle: 'monthly', limits: { tasks: '750 tasks/mo' }, features: ['Multi-step Zaps', 'Unlimited Zaps'], limitations: [] },
        { id: 'professional', label: 'Professional', price: 29.99, currency: 'USD', cycle: 'monthly', limits: { tasks: '750 tasks/mo' }, features: ['Premium apps', 'Custom logic (Paths)', 'Autoreplay'], limitations: [] },
        { id: 'team', label: 'Team', price: 103.50, currency: 'USD', cycle: 'monthly', limits: { tasks: '2,000 tasks/mo' }, features: ['Shared workspaces', 'Unlimited users'], limitations: [] }
      ]
    },
    'hostinger-vps': {
      id: 'hostinger-vps', label: 'Hostinger VPS', vendor: 'Hostinger',
      website: 'https://www.hostinger.com/vps-hosting', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best value dedicated VPS for a single platform deployment — NVMe storage and a 1 Gbps network on every tier.',
      plans: [
        { id: 'vps-kvm-1', label: 'VPS KVM 1', price: 11.99, currency: 'USD', cycle: 'monthly', limits: { vcpu: '1 vCPU', ram: '4GB RAM', storage: '50GB NVMe' }, features: [], limitations: [] },
        { id: 'vps-kvm-2', label: 'VPS KVM 2', price: 14.99, currency: 'USD', cycle: 'monthly', limits: { vcpu: '2 vCPU', ram: '8GB RAM', storage: '100GB NVMe' }, features: [], limitations: [] },
        { id: 'vps-kvm-4', label: 'VPS KVM 4', price: 28.99, currency: 'USD', cycle: 'monthly', limits: { vcpu: '4 vCPU', ram: '16GB RAM', storage: '200GB NVMe' }, features: [], limitations: [] },
        { id: 'vps-kvm-8', label: 'VPS KVM 8', price: 49.99, currency: 'USD', cycle: 'monthly', limits: { vcpu: '8 vCPU', ram: '32GB RAM', storage: '400GB NVMe' }, features: [], limitations: [] }
      ]
    },
    'digitalocean': {
      id: 'digitalocean', label: 'DigitalOcean', vendor: 'DigitalOcean',
      website: 'https://www.digitalocean.com/pricing/droplets', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best when the customer wants a well-documented, developer-friendly cloud with easy scaling beyond a single VPS.',
      plans: [
        { id: 'droplet-basic', label: 'Basic Droplet', price: 4, currency: 'USD', cycle: 'monthly', limits: { vcpu: '1 vCPU', ram: '512MB RAM', storage: '10GB SSD' }, features: ['Per-second billing'], limitations: [] },
        { id: 'droplet-general', label: 'General Purpose Droplet', price: 63, currency: 'USD', cycle: 'monthly', limits: { vcpu: '4 vCPU (dedicated)', ram: '16GB RAM', storage: '200GB SSD' }, features: ['Guaranteed dedicated CPU'], limitations: [] }
      ]
    },
    'aws': {
      id: 'aws', label: 'AWS (EC2)', vendor: 'Amazon Web Services',
      website: 'https://aws.amazon.com/ec2/pricing/on-demand/', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: "Best when the customer already runs on AWS or needs its specific managed services alongside the VM.",
      plans: [
        { id: 'ec2-t3-micro', label: 'EC2 t3.micro', price: 7.59, currency: 'USD', cycle: 'monthly', limits: { vcpu: '2 vCPU', ram: '1GB RAM' }, features: ['us-east-1 on-demand rate'], limitations: [] },
        { id: 'ec2-t3-large', label: 'EC2 t3.large', price: 60.74, currency: 'USD', cycle: 'monthly', limits: { vcpu: '2 vCPU', ram: '8GB RAM' }, features: ['us-east-1 on-demand rate'], limitations: [] }
      ]
    },
    'ifttt': {
      id: 'ifttt', label: 'IFTTT', vendor: 'IFTTT',
      website: 'https://ifttt.com/pricing', lastVerified: '2026-09-05', dataSource: 'web search (unverified against vendor site)',
      specialty: 'Best when a customer only needs one or two simple single-trigger automations — the free tier runs them unlimited times at no cost.',
      plans: [
        { id: 'free', label: 'Free', price: 0, currency: 'USD', cycle: 'free', limits: { applets: '2 active Applets (unlimited runs)' }, features: ['1 trigger + 1 action per Applet'], limitations: ['No multi-action Applets', 'No webhooks'] },
        { id: 'pro', label: 'Pro', price: 2.49, currency: 'USD', cycle: 'monthly', limits: { applets: '20 active Applets' }, features: ['Multi-action Applets', 'Webhooks', 'Faster execution'], limitations: [] },
        { id: 'pro-plus', label: 'Pro+', price: 8.49, currency: 'USD', cycle: 'monthly', limits: { applets: 'Unlimited Applets' }, features: ['Filter code (JavaScript)', 'AI services', 'Multiple account connections'], limitations: [] }
      ]
    }
  },

  services: [
    {
      id: 'svc-001', customerId: 'cust-a', name: 'Odoo ERP Platform',
      category: 'infrastructure', provider: 'Hostinger', plan: 'VPS KVM 2',
      stack: ['Ubuntu 22.04 LTS', 'Docker', 'Odoo 17 CE', 'PostgreSQL 15', 'Nginx + SSL'],
      status: 'active', deployedDate: '2024-03-10',
      description: 'Server setup and Odoo configuration (Website + Accounting modules) on Aegis’s own Hostinger VPS and Odoo subscription. We never bill for the VPS or Odoo license itself — Aegis pays Hostinger and Odoo directly; the charge below is our implementation work only. See "My Software" for what Aegis pays those vendors.',
      billing: { model: 'one-time', ourCost: 350.00, customerPrice: 1200.00, currency: 'USD' },
      assetIds: ['asset-001', 'asset-002'],
      milestones: null,
      config: {
        hostingProvider: 'hostinger', hostingPlan: 'vps-kvm-2', platform: 'odoo',
        deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], connectivity: 'online'
      },
      accounts: [
        { id: 'acc-001', provider: 'Hostinger', purpose: 'VPS Control Panel (hPanel)', loginUrl: 'https://hpanel.hostinger.com', username: 'sarah@aegisretail.com', status: 'configured', sharedVia: 'Shared via 1Password link on 2024-03-08', lastUpdated: '2024-03-10', notes: 'Root SSH key kept on file separately from this portal.' },
        { id: 'acc-002', provider: 'Odoo', purpose: 'ERP Admin Login', loginUrl: 'https://erp.aegisretail.com/web/login', username: 'admin@aegisretail.com', status: 'configured', sharedVia: 'Provided during onboarding call', lastUpdated: '2024-03-10', notes: '' }
      ]
    },
    {
      id: 'svc-002', customerId: 'cust-a', name: 'Inventory Sync Module',
      category: 'custom-development', provider: null, plan: null,
      stack: ['Python', 'FastAPI', 'PostgreSQL', 'React', 'Odoo XML-RPC API'],
      status: 'in-development', deployedDate: null,
      description: 'Custom two-way inventory sync between the Odoo ERP and the Shopify storefront, including automated low-stock alerts.',
      billing: { model: 'one-time', ourCost: 1800, customerPrice: 4200, currency: 'USD' },
      milestones: [
        { name: 'Discovery & Requirements', status: 'completed', date: '2026-06-01' },
        { name: 'Architecture & API Design', status: 'completed', date: '2026-06-18' },
        { name: 'Core Sync Engine (Sprint 1)', status: 'completed', date: '2026-07-20' },
        { name: 'Shopify Integration (Sprint 2)', status: 'in-progress', date: null },
        { name: 'QA & UAT', status: 'pending', date: null },
        { name: 'Go-Live & Handover', status: 'pending', date: null }
      ],
      config: {
        deviceTypes: ['laptop', 'desktop'], osTargets: ['cross-platform'], connectivity: 'online',
        techStack: { frontend: ['HTML', 'CSS', 'JavaScript', 'React'], backend: ['Python / FastAPI'], database: ['PostgreSQL'], infraAddons: ['Redis', 'Docker'], integrations: [] }
      },
      accounts: [
        { id: 'acc-003', provider: 'Shopify', purpose: 'Admin API access (private app)', loginUrl: 'https://aegisretail.myshopify.com/admin', username: 'sarah@aegisretail.com', status: 'requested', sharedVia: null, lastUpdated: '2026-08-20', notes: 'Needed to finish the Sprint 2 integration work.' }
      ]
    },
    {
      id: 'svc-003', customerId: 'cust-b', name: 'WooCommerce Storefront',
      category: 'infrastructure', provider: 'Hostinger', plan: 'VPS KVM 1',
      stack: ['Ubuntu 22.04 LTS', 'WordPress 6', 'WooCommerce', 'MySQL', 'Nginx + SSL'],
      status: 'active', deployedDate: '2024-08-01',
      description: 'Public storefront hosted on a dedicated VPS with weekly automated backups and a staging environment for safe releases.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 8.49, customerPrice: 35.00, currency: 'USD', nextRenewal: '2026-09-15' },
      milestones: null,
      config: {
        hostingProvider: 'hostinger', hostingPlan: 'vps-kvm-1', platform: 'wordpress-woocommerce',
        deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], connectivity: 'online'
      },
      accounts: [
        { id: 'acc-004', provider: 'Hostinger', purpose: 'VPS Control Panel (hPanel)', loginUrl: 'https://hpanel.hostinger.com', username: 'marcus@bluewavelog.com', status: 'rotate-requested', sharedVia: 'Shared via password manager link on 2024-07-28', lastUpdated: '2026-08-15', notes: 'Migration work is complete — please rotate this password now that we’re done using it.' }
      ]
    },
    {
      id: 'svc-004', customerId: 'cust-b', name: 'Priority Maintenance Retainer',
      category: 'maintenance', provider: null, plan: null,
      stack: ['Uptime Monitoring', 'Security Patching', 'Monthly Backup Audit'],
      status: 'active', deployedDate: '2024-08-01',
      description: 'Proactive server monitoring, security patching, and a 4-hour SLA response window for critical issues.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 40, customerPrice: 150.00, currency: 'USD', nextRenewal: '2026-09-08' },
      milestones: null
    },
    {
      id: 'svc-005', customerId: 'cust-c', name: 'Patient Booking Portal',
      category: 'custom-development', provider: null, plan: null,
      stack: ['Node.js', 'Express', 'React', 'MongoDB', 'Twilio SMS API'],
      status: 'completed', deployedDate: '2025-05-12',
      description: 'Custom patient self-scheduling portal with SMS reminders, integrated with the front-desk calendar.',
      billing: { model: 'one-time', ourCost: 3200, customerPrice: 7800, currency: 'USD' },
      milestones: [
        { name: 'Discovery & Requirements', status: 'completed', date: '2025-02-03' },
        { name: 'UI/UX Design', status: 'completed', date: '2025-02-20' },
        { name: 'Development', status: 'completed', date: '2025-04-10' },
        { name: 'QA & UAT', status: 'completed', date: '2025-04-28' },
        { name: 'Go-Live & Handover', status: 'completed', date: '2025-05-12' }
      ],
      config: {
        deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], connectivity: 'online',
        techStack: { frontend: ['HTML', 'CSS', 'JavaScript', 'React'], backend: ['Node.js / Express'], database: ['MongoDB'], infraAddons: [], integrations: ['Twilio (SMS)'] }
      }
    },
    {
      id: 'svc-006', customerId: 'cust-c', name: 'Standard Maintenance Retainer',
      category: 'maintenance', provider: null, plan: null,
      stack: ['Uptime Monitoring', 'Security Patching', 'Monthly Uptime Report'],
      status: 'active', deployedDate: '2025-05-12',
      description: 'Post-launch support retainer covering uptime monitoring, patching, and monthly reporting.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 25, customerPrice: 90.00, currency: 'USD', nextRenewal: '2026-10-01' },
      milestones: null
    },
    {
      id: 'svc-007', customerId: 'cust-d', name: 'Odoo Community Platform',
      category: 'infrastructure', provider: 'Hostinger', plan: 'VPS KVM 4',
      stack: ['Ubuntu 22.04 LTS', 'Docker', 'Odoo 17 CE', 'PostgreSQL 15'],
      status: 'provisioning', deployedDate: null,
      description: 'Server setup and Odoo Community configuration on Nimbus’s own Hostinger VPS — Odoo Community itself is free, self-hosted software. Nimbus pays Hostinger directly for the VPS; the charge below is our setup work only. Go-live is scheduled once data migration from the legacy system finishes.',
      billing: { model: 'one-time', ourCost: 220.00, customerPrice: 650.00, currency: 'USD' },
      assetIds: ['asset-007'],
      milestones: null,
      config: {
        hostingProvider: 'hostinger', hostingPlan: 'vps-kvm-4', platform: 'odoo',
        deviceTypes: ['laptop', 'desktop', 'mobile'], osTargets: ['cross-platform'], connectivity: 'online'
      },
      accounts: [
        { id: 'acc-005', provider: 'Hostinger', purpose: 'VPS Control Panel (hPanel)', loginUrl: 'https://hpanel.hostinger.com', username: 'devon@nimbusfoods.com', status: 'requested', sharedVia: null, lastUpdated: '2026-08-25', notes: 'Waiting on the customer to share access before we can begin provisioning.' }
      ]
    },
    {
      id: 'svc-008', customerId: 'cust-b', name: 'Driver Check-In Mobile App',
      category: 'software-platform', provider: 'AppSheet', plan: 'AppSheet Core (per user/mo)',
      stack: ['AppSheet', 'Google Sheets', 'Google Cloud Platform'],
      status: 'active', deployedDate: '2026-05-01',
      description: 'A no-code mobile app for drivers to log check-ins, delays, and delivery confirmations, backed by Google Sheets. Built to capture data offline in areas with no signal and sync automatically once reconnected.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 15.00, customerPrice: 60.00, currency: 'USD', nextRenewal: '2026-10-01' },
      milestones: null,
      config: {
        platform: 'appsheet', dataBackend: 'google-sheets',
        deviceTypes: ['mobile', 'tablet'], osTargets: ['android', 'ios'], connectivity: 'hybrid'
      },
      accounts: [
        { id: 'acc-006', provider: 'Google Workspace', purpose: 'AppSheet + Sheets admin access', loginUrl: 'https://appsheet.com', username: 'marcus@bluewavelog.com', status: 'configured', sharedVia: 'Shared via Google Workspace admin invite on 2026-04-20', lastUpdated: '2026-05-01', notes: '' }
      ]
    },
    {
      id: 'svc-009', customerId: 'cust-c', name: 'In-Clinic Network & POS Setup',
      category: 'infrastructure', provider: null, plan: null,
      stack: ['Network cabling', 'Wi-Fi access points', 'POS terminal configuration'],
      status: 'active', deployedDate: '2026-07-15',
      description: 'On-site installation and configuration of clinic Wi-Fi, network switches, and point-of-sale terminals across two treatment floors.',
      billing: { model: 'one-time', ourCost: 600, customerPrice: 1800, currency: 'USD' },
      milestones: null,
      config: {
        deliveryMode: 'on-location',
        location: { address: '4420 E Camelback Rd, Phoenix, AZ 85018', lat: 33.5091, lng: -111.9827 },
        deviceTypes: ['desktop'], osTargets: ['cross-platform'], connectivity: 'online'
      },
      accounts: []
    },
    {
      id: 'svc-010', customerId: 'cust-d', name: 'Order Intake Automation',
      category: 'automation', provider: 'n8n', plan: 'Cloud Starter',
      stack: ['n8n', 'Gmail', 'Google Sheets', 'Slack'],
      status: 'in-development', deployedDate: null,
      description: 'Building and maintaining automated workflows on Nimbus’s own n8n Cloud subscription — connecting incoming wholesale order emails to a Google Sheets order tracker and Slack notifications. Nimbus pays n8n directly for the workspace; the recurring charge below is our build + ongoing monitoring retainer, not the n8n subscription itself.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 10.00, customerPrice: 35.00, currency: 'USD', nextRenewal: '2026-10-05' },
      assetIds: ['asset-009'],
      milestones: null,
      config: {
        deliveryMode: 'virtual', toolId: 'n8n', planId: 'cloud-starter',
        automationBuilds: [
          { name: 'New Order → Sheet + Slack', triggerApp: 'Gmail', actionApps: ['Google Sheets', 'Slack'], description: 'Parses incoming wholesale order emails, logs them to the tracker, and pings #fulfillment.' },
          { name: 'Low Stock Alert', triggerApp: 'Google Sheets', actionApps: ['Slack', 'Gmail'], description: 'Checks the inventory sheet daily and alerts when any SKU drops below threshold.' }
        ]
      },
      accounts: []
    },
    {
      id: 'svc-011', customerId: 'cust-d', name: 'Ordering Website Revamp',
      category: 'custom-development', provider: null, plan: null,
      stack: ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js / Express'],
      status: 'in-development', deployedDate: null,
      description: "Modernizing Nimbus's existing ordering website — responsive redesign, updated checkout flow, and mobile optimization — building on the site they already own rather than starting from scratch.",
      billing: { model: 'one-time', ourCost: 900.00, customerPrice: 2800.00, currency: 'USD' },
      assetIds: ['asset-006'],
      milestones: [
        { name: 'Audit existing site & scope revamp', status: 'completed', date: '2026-08-20' },
        { name: 'Responsive redesign', status: 'in-progress', date: null },
        { name: 'Checkout flow rebuild', status: 'pending', date: null },
        { name: 'QA & launch', status: 'pending', date: null }
      ],
      config: {
        deliveryMode: 'virtual',
        techStack: { frontend: ['HTML', 'CSS', 'JavaScript', 'React'], backend: ['Node.js / Express'], database: [], infraAddons: [], integrations: [] }
      },
      accounts: []
    }
  ],

  invoices: [
    { id: 'INV-2024-1001', customerId: 'cust-a', serviceId: 'svc-001', issueDate: '2024-03-10', dueDate: '2024-03-17', status: 'paid', paidDate: '2024-03-11', currency: 'USD', items: [
      { desc: 'Server Setup — Hostinger VPS + Odoo Install', qty: 1, unitPrice: 300.00 },
      { desc: 'Website Module Configuration', qty: 1, unitPrice: 400.00 },
      { desc: 'Accounting Module Configuration', qty: 1, unitPrice: 500.00 }
    ] },
    { id: 'INV-2026-1004', customerId: 'cust-a', serviceId: 'svc-002', issueDate: '2026-06-01', dueDate: '2026-06-08', status: 'paid', paidDate: '2026-06-05', currency: 'USD', items: [{ desc: 'Inventory Sync Module — Deposit (30% of project)', qty: 1, unitPrice: 1260.00 }] },
    { id: 'INV-2026-1005', customerId: 'cust-a', serviceId: 'svc-002', issueDate: '2026-07-22', dueDate: '2026-07-29', status: 'paid', paidDate: '2026-07-24', currency: 'USD', items: [{ desc: 'Inventory Sync Module — Milestone: Sprint 1 complete (35%)', qty: 1, unitPrice: 1470.00 }] },

    { id: 'INV-2026-2001', customerId: 'cust-b', serviceId: 'svc-003', issueDate: '2026-08-01', dueDate: '2026-08-08', status: 'paid', paidDate: '2026-08-02', currency: 'USD', items: [{ desc: 'WooCommerce Storefront — Hosting (Aug 2026)', qty: 1, unitPrice: 35.00 }] },
    { id: 'INV-2026-2002', customerId: 'cust-b', serviceId: 'svc-003', issueDate: '2026-09-01', dueDate: '2026-09-08', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'WooCommerce Storefront — Hosting (Sep 2026)', qty: 1, unitPrice: 35.00 }] },
    { id: 'INV-2026-2003', customerId: 'cust-b', serviceId: 'svc-004', issueDate: '2026-07-01', dueDate: '2026-07-08', status: 'paid', paidDate: '2026-07-01', currency: 'USD', items: [{ desc: 'Priority Maintenance Retainer (Jul 2026)', qty: 1, unitPrice: 150.00 }] },
    { id: 'INV-2026-2004', customerId: 'cust-b', serviceId: 'svc-004', issueDate: '2026-08-01', dueDate: '2026-08-08', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Priority Maintenance Retainer (Aug 2026)', qty: 1, unitPrice: 150.00 }] },
    { id: 'INV-2026-2005', customerId: 'cust-b', serviceId: 'svc-008', issueDate: '2026-08-01', dueDate: '2026-08-08', status: 'paid', paidDate: '2026-08-01', currency: 'USD', items: [{ desc: 'Driver Check-In Mobile App — Subscription (Aug 2026)', qty: 1, unitPrice: 60.00 }] },
    { id: 'INV-2026-2006', customerId: 'cust-b', serviceId: 'svc-008', issueDate: '2026-09-01', dueDate: '2026-09-08', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Driver Check-In Mobile App — Subscription (Sep 2026)', qty: 1, unitPrice: 60.00 }] },

    { id: 'INV-2025-3001', customerId: 'cust-c', serviceId: 'svc-005', issueDate: '2025-02-05', dueDate: '2025-02-12', status: 'paid', paidDate: '2025-02-06', currency: 'USD', items: [{ desc: 'Patient Booking Portal — Deposit (30%)', qty: 1, unitPrice: 2340.00 }] },
    { id: 'INV-2025-3002', customerId: 'cust-c', serviceId: 'svc-005', issueDate: '2025-04-15', dueDate: '2025-04-22', status: 'paid', paidDate: '2025-04-16', currency: 'USD', items: [{ desc: 'Patient Booking Portal — Milestone: Development complete (35%)', qty: 1, unitPrice: 2730.00 }] },
    { id: 'INV-2025-3003', customerId: 'cust-c', serviceId: 'svc-005', issueDate: '2025-05-12', dueDate: '2025-05-19', status: 'paid', paidDate: '2025-05-13', currency: 'USD', items: [{ desc: 'Patient Booking Portal — Final payment: Go-live (35%)', qty: 1, unitPrice: 2730.00 }] },
    { id: 'INV-2026-3004', customerId: 'cust-c', serviceId: 'svc-006', issueDate: '2026-08-01', dueDate: '2026-08-08', status: 'paid', paidDate: '2026-08-01', currency: 'USD', items: [{ desc: 'Standard Maintenance Retainer (Aug 2026)', qty: 1, unitPrice: 90.00 }] },
    { id: 'INV-2026-3005', customerId: 'cust-c', serviceId: 'svc-006', issueDate: '2026-09-01', dueDate: '2026-09-08', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Standard Maintenance Retainer (Sep 2026)', qty: 1, unitPrice: 90.00 }] },

    { id: 'INV-2026-4001', customerId: 'cust-d', serviceId: 'svc-007', issueDate: '2026-08-25', dueDate: '2026-09-01', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Odoo Community Platform — Server & software setup', qty: 1, unitPrice: 650.00 }] },
    { id: 'INV-2026-4002', customerId: 'cust-d', serviceId: 'svc-010', issueDate: '2026-09-05', dueDate: '2026-09-12', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Order Intake Automation — Build & monitoring retainer (Sep 2026)', qty: 1, unitPrice: 35.00 }] },
    { id: 'INV-2026-4003', customerId: 'cust-d', serviceId: 'svc-011', issueDate: '2026-08-20', dueDate: '2026-08-27', status: 'paid', paidDate: '2026-08-21', currency: 'USD', items: [{ desc: 'Ordering Website Revamp — Deposit (30%)', qty: 1, unitPrice: 840.00 }] },

    { id: 'INV-2026-3006', customerId: 'cust-c', serviceId: 'svc-009', issueDate: '2026-07-15', dueDate: '2026-07-22', status: 'paid', paidDate: '2026-07-15', currency: 'USD', items: [{ desc: 'In-Clinic Network & POS Setup — On-site installation', qty: 1, unitPrice: 1800.00 }] }
  ],

  requests: [
    {
      id: 'REQ-9001', customerId: 'cust-d', title: 'Custom Recipe Costing Dashboard',
      category: 'custom-development', serviceCategoryId: 'custom-development',
      description: 'We need a dashboard that recalculates recipe costs as ingredient prices change, integrated with our Odoo inventory.',
      budgetRange: '$5,000 - $10,000', timeline: '2-3 months',
      config: {
        deliveryMode: 'virtual', location: null, toolId: null, planId: null,
        deviceTypes: ['laptop', 'desktop'], osTargets: ['cross-platform'], connectivity: 'online',
        techStack: { frontend: ['HTML', 'CSS', 'JavaScript'], backend: ['Python / FastAPI'], database: ['PostgreSQL'], infraAddons: [], integrations: [] },
        automationBuilds: []
      },
      status: 'submitted', submittedDate: '2026-09-02'
    }
  ],

  // Delivery tasks — the work items the Team Portal is built around. Each
  // links back to a service (which carries the precise catalogue `config`
  // for what's being built) and an assignee from teamUsers.
  tasks: [
    {
      id: 'task-001', serviceId: 'svc-007', customerId: 'cust-d',
      title: 'Provision & configure Odoo Community Platform',
      assigneeId: 'team-1', status: 'blocked', priority: 'high',
      createdDate: '2026-08-25', dueDate: '2026-09-15', completedDate: null,
      blockedReason: 'Waiting on the customer to share Hostinger VPS access before provisioning can begin.',
      checklist: [
        { text: 'Provision Hostinger VPS KVM 4 instance', done: false },
        { text: 'Harden server (SSH, firewall, OS updates)', done: false },
        { text: 'Install Docker & deploy Odoo 17 CE + PostgreSQL', done: false },
        { text: 'Configure domain, DNS & SSL', done: false },
        { text: 'Set up automated backups', done: false },
        { text: 'Smoke-test the deployment', done: false },
        { text: 'Hand off admin credentials & documentation to customer', done: false }
      ],
      notes: [
        { date: '2026-08-25', author: 'Imran Qureshi', text: 'Requested hPanel access from Nimbus Foods via the portal.' }
      ]
    },
    {
      id: 'task-002', serviceId: 'svc-002', customerId: 'cust-a',
      title: 'Build Inventory Sync Module (Odoo ↔ Shopify)',
      assigneeId: 'team-2', status: 'blocked', priority: 'normal',
      createdDate: '2026-06-01', dueDate: '2026-09-30', completedDate: null,
      blockedReason: 'Waiting on Shopify admin API access from Aegis Retail to finish and test the Sprint 2 integration.',
      checklist: [
        { text: 'Repository & environment setup', done: true },
        { text: 'Implement backend / sync engine API', done: true },
        { text: 'Implement frontend / React dashboard', done: true },
        { text: 'Connect database', done: true },
        { text: 'Integrate with Shopify Admin API', done: false },
        { text: 'Write tests', done: false },
        { text: 'Deploy to staging for UAT', done: false },
        { text: 'Deploy to production & handover', done: false }
      ],
      notes: [
        { date: '2026-08-20', author: 'Layla Haddad', text: 'Sprint 2 code is done against mock data — need live Shopify credentials to finish integration testing.' }
      ]
    },
    {
      id: 'task-003', serviceId: 'svc-008', customerId: 'cust-b',
      title: 'Build Driver Check-In App on AppSheet',
      assigneeId: 'team-3', status: 'done', priority: 'normal',
      createdDate: '2026-04-15', dueDate: '2026-05-01', completedDate: '2026-05-01',
      blockedReason: null,
      checklist: [
        { text: 'Create/confirm AppSheet + Google Sheets account', done: true },
        { text: 'Connect Google Sheets data backend', done: true },
        { text: 'Configure driver check-in & delay-logging screens', done: true },
        { text: 'Enable offline capture & background sync', done: true },
        { text: 'Set access roles & permissions', done: true },
        { text: 'User acceptance testing with drivers', done: true },
        { text: 'Publish app & hand off admin access', done: true }
      ],
      notes: [
        { date: '2026-05-01', author: 'Marco Silva', text: 'Live with 12 drivers. Offline sync tested across 3 low-signal routes.' }
      ]
    },
    {
      id: 'task-004', serviceId: 'svc-001', customerId: 'cust-a', assetId: 'asset-001',
      title: 'Server Setup — Hostinger VPS + Odoo Install',
      assigneeId: 'team-1', status: 'done', priority: 'normal',
      createdDate: '2024-02-20', dueDate: '2024-03-08', completedDate: '2024-03-08',
      blockedReason: null, charge: { amount: 300.00, currency: 'USD' },
      checklist: [
        { text: 'Provision Hostinger VPS KVM 2 instance', done: true },
        { text: 'Harden server (SSH, firewall, OS updates)', done: true },
        { text: 'Install Docker & deploy Odoo 17 CE + PostgreSQL', done: true },
        { text: 'Configure domain, DNS & SSL', done: true },
        { text: 'Set up automated backups', done: true },
        { text: 'Smoke-test the deployment', done: true }
      ],
      notes: []
    },
    {
      id: 'task-009', serviceId: 'svc-001', customerId: 'cust-a', assetId: 'asset-002',
      title: 'Configure Website Module',
      assigneeId: 'team-3', status: 'done', priority: 'normal',
      createdDate: '2024-03-08', dueDate: '2024-03-09', completedDate: '2024-03-09',
      blockedReason: null, charge: { amount: 400.00, currency: 'USD' },
      checklist: [
        { text: 'Set up Odoo Website builder & theme', done: true },
        { text: 'Build and publish the public pages', done: true },
        { text: 'Connect the aegisretail.com domain', done: true }
      ],
      notes: []
    },
    {
      id: 'task-010', serviceId: 'svc-001', customerId: 'cust-a', assetId: 'asset-002',
      title: 'Configure Accounting Module',
      assigneeId: 'team-1', status: 'done', priority: 'normal',
      createdDate: '2024-03-09', dueDate: '2024-03-10', completedDate: '2024-03-10',
      blockedReason: null, charge: { amount: 500.00, currency: 'USD' },
      checklist: [
        { text: 'Configure chart of accounts', done: true },
        { text: 'Connect bank feed', done: true },
        { text: 'Set up invoicing templates & tax rules', done: true },
        { text: 'Hand off admin credentials & documentation to customer', done: true }
      ],
      notes: []
    },
    {
      id: 'task-005', serviceId: 'svc-003', customerId: 'cust-b',
      title: 'Deploy WooCommerce Storefront on Hostinger VPS',
      assigneeId: 'team-1', status: 'done', priority: 'normal',
      createdDate: '2024-07-10', dueDate: '2024-08-01', completedDate: '2024-08-01',
      blockedReason: null,
      checklist: [
        { text: 'Provision Hostinger VPS KVM 1 instance', done: true },
        { text: 'Harden server (SSH, firewall, OS updates)', done: true },
        { text: 'Install WordPress + WooCommerce', done: true },
        { text: 'Configure domain, DNS & SSL', done: true },
        { text: 'Set up staging environment & weekly backups', done: true },
        { text: 'Smoke-test the storefront', done: true },
        { text: 'Hand off admin credentials & documentation to customer', done: true }
      ],
      notes: []
    },
    {
      id: 'task-006', serviceId: 'svc-005', customerId: 'cust-c',
      title: 'Build Patient Booking Portal',
      assigneeId: 'team-2', status: 'done', priority: 'normal',
      createdDate: '2025-01-20', dueDate: '2025-05-12', completedDate: '2025-05-12',
      blockedReason: null,
      checklist: [
        { text: 'Repository & environment setup', done: true },
        { text: 'Implement backend / Express API', done: true },
        { text: 'Implement frontend / React booking UI', done: true },
        { text: 'Connect MongoDB database', done: true },
        { text: 'Integrate Twilio SMS reminders', done: true },
        { text: 'Write tests', done: true },
        { text: 'Deploy to staging for UAT', done: true },
        { text: 'Deploy to production & handover', done: true }
      ],
      notes: []
    },
    {
      id: 'task-007', serviceId: 'svc-009', customerId: 'cust-c',
      title: 'Install In-Clinic Network & POS', assigneeId: 'team-1', status: 'done', priority: 'normal',
      createdDate: '2026-07-01', dueDate: '2026-07-15', completedDate: '2026-07-15',
      blockedReason: null,
      checklist: [
        { text: 'Provision hosting instance', done: true },
        { text: 'Harden server (SSH, firewall, OS updates)', done: true },
        { text: 'Install & configure target platform', done: true },
        { text: 'Configure domain, DNS & SSL', done: true },
        { text: 'Set up automated backups', done: true },
        { text: 'Smoke-test the deployment', done: true },
        { text: 'Hand off admin credentials & documentation to customer', done: true }
      ],
      notes: [{ date: '2026-07-15', author: 'Imran Qureshi', text: 'Both floors online, POS terminals tested with front desk staff on site.' }]
    },
    {
      id: 'task-008', serviceId: 'svc-010', customerId: 'cust-d',
      title: 'Build Order Intake Automation on n8n', assigneeId: 'team-4', status: 'in-progress', priority: 'normal',
      createdDate: '2026-09-01', dueDate: '2026-09-20', completedDate: null,
      blockedReason: null,
      checklist: [
        { text: 'Confirm plan tier & create/connect the workspace', done: true },
        { text: 'Connect all required app accounts (OAuth / API keys)', done: true },
        { text: 'Build each workflow listed in the configuration', done: false },
        { text: 'Add error handling & failure notifications', done: false },
        { text: 'Test each workflow end-to-end with real data', done: false },
        { text: 'Document each workflow for the customer', done: false },
        { text: 'Hand off admin access & training notes', done: false }
      ],
      notes: [{ date: '2026-09-03', author: 'Priya Nadar', text: 'Gmail and Google Sheets connected. Building the order-parsing logic next.' }]
    },
    {
      id: 'task-011', serviceId: 'svc-011', customerId: 'cust-d', assetId: 'asset-006',
      title: 'Revamp Ordering Website', assigneeId: 'team-2', status: 'in-progress', priority: 'normal',
      createdDate: '2026-08-20', dueDate: '2026-10-15', completedDate: null,
      blockedReason: null,
      checklist: [
        { text: 'Repository & environment setup', done: true },
        { text: 'Audit existing site & content', done: true },
        { text: 'Implement responsive redesign', done: false },
        { text: 'Rebuild checkout flow', done: false },
        { text: 'QA across devices', done: false },
        { text: 'Deploy & handover', done: false }
      ],
      notes: [{ date: '2026-08-20', author: 'Layla Haddad', text: 'Old site was hand-coded with no framework — rebuilding on React so future updates are easier.' }]
    }
  ],

  // Site visits — the physical-dispatch half of project management for on-location /
  // hybrid services: who's going, when, where, and what they need to do while there.
  visits: [
    {
      id: 'visit-001', serviceId: 'svc-009', customerId: 'cust-c', assigneeId: 'team-1',
      title: 'Install network & POS at Horizon Dental (Floors 1 & 2)',
      scheduledDate: '2026-07-15', scheduledTime: '09:00',
      address: '4420 E Camelback Rd, Phoenix, AZ 85018', lat: 33.5091, lng: -111.9827,
      checklist: [
        { text: 'Run & terminate network cabling on both floors', done: true },
        { text: 'Mount and configure Wi-Fi access points', done: true },
        { text: 'Configure and test POS terminals at front desk', done: true },
        { text: 'Walk staff through Wi-Fi guest network', done: true }
      ],
      status: 'completed',
      notes: [{ date: '2026-07-15', author: 'Imran Qureshi', text: 'Both floors online, POS terminals tested with front desk staff.' }]
    },
    {
      id: 'visit-002', serviceId: 'svc-008', customerId: 'cust-b', assigneeId: 'team-3',
      title: 'On-site driver training for Check-In App',
      scheduledDate: '2026-09-18', scheduledTime: '10:00',
      address: '2200 W Fulton Market, Chicago, IL 60612', lat: 41.8859, lng: -87.6688,
      checklist: [
        { text: 'Bring printed quick-start guides', done: false },
        { text: 'Walk each driver through the check-in flow', done: false },
        { text: 'Confirm offline mode works in the loading dock (no signal)', done: false },
        { text: 'Collect feedback for the next round of improvements', done: false }
      ],
      status: 'scheduled',
      notes: []
    }
  ],

  // Software the CUSTOMER owns and pays for directly — we never buy, resell, or mark up
  // any third-party software or hosting. This is self-reported by the customer (or logged
  // by the agency on their behalf) purely so the portal can track spend, forecast renewals,
  // and flag likely savings. Everything we charge for is implementation/dev work, tracked
  // on the linked service/task instead.
  softwareAssets: [
    {
      id: 'asset-001', customerId: 'cust-a', name: 'Hostinger VPS KVM 2', vendor: 'Hostinger',
      toolId: 'hostinger-vps', planId: 'vps-kvm-2', category: 'infrastructure',
      deploymentType: 'cloud',
      billing: { amount: 179.88, currency: 'USD', cycle: 'yearly', lastPaidDate: '2026-03-01', nextRenewalDate: '2027-03-01' },
      reasonForRecurringCharge: null, usageNotes: '', vendorContact: null,
      status: 'active', notes: 'Paid by Aegis directly to Hostinger — we only handle setup and maintenance.', addedDate: '2024-03-01'
    },
    {
      id: 'asset-002', customerId: 'cust-a', name: 'Odoo Standard (2 users)', vendor: 'Odoo',
      toolId: 'odoo', planId: 'standard', category: 'business-platform',
      deploymentType: 'cloud',
      billing: { amount: 746.40, currency: 'USD', cycle: 'yearly', lastPaidDate: '2026-01-15', nextRenewalDate: '2027-01-15' },
      reasonForRecurringCharge: null, usageNotes: '', vendorContact: null,
      status: 'active', notes: 'Paid by Aegis directly to Odoo.', addedDate: '2024-03-01'
    },
    {
      id: 'asset-003', customerId: 'cust-b', name: 'Hostinger VPS KVM 1', vendor: 'Hostinger',
      toolId: 'hostinger-vps', planId: 'vps-kvm-1', category: 'infrastructure',
      deploymentType: 'cloud',
      billing: { amount: 143.88, currency: 'USD', cycle: 'yearly', lastPaidDate: '2026-08-01', nextRenewalDate: '2027-08-01' },
      reasonForRecurringCharge: null, usageNotes: '', vendorContact: null,
      status: 'active', notes: 'Paid by Bluewave directly to Hostinger.', addedDate: '2024-08-01'
    },
    {
      id: 'asset-004', customerId: 'cust-b', name: 'RetailTrack POS', vendor: 'RetailTrack Systems',
      toolId: null, planId: null, category: 'business-platform',
      deploymentType: 'local',
      billing: { amount: 600.00, currency: 'USD', cycle: 'yearly', lastPaidDate: '2026-01-10', nextRenewalDate: '2027-01-10' },
      reasonForRecurringCharge: null, usageNotes: 'One in-store terminal at the depot office.', vendorContact: null,
      status: 'active', notes: 'Legacy point-of-sale software, installed locally on an in-store PC — added here for tracking, not something we set up.', addedDate: '2026-08-10'
    },
    {
      id: 'asset-005', customerId: 'cust-b', name: 'Zapier Starter', vendor: 'Zapier',
      toolId: 'zapier', planId: 'starter', category: 'automation',
      deploymentType: 'cloud',
      billing: { amount: 19.99, currency: 'USD', cycle: 'monthly', lastPaidDate: '2026-08-15', nextRenewalDate: '2026-09-15' },
      reasonForRecurringCharge: null, usageNotes: '2 active Zaps: (1) new Shopify order → Slack alert, (2) low-stock CSV export → email.', automationCount: 2, vendorContact: null,
      status: 'active', notes: '', addedDate: '2026-08-10'
    },
    {
      id: 'asset-006', customerId: 'cust-d', name: 'Legacy Ordering Website', vendor: 'Freelance developer',
      toolId: null, planId: null, category: 'website-development',
      deploymentType: 'cloud',
      billing: { amount: 3500.00, currency: 'USD', cycle: 'one-time', lastPaidDate: '2023-06-01', nextRenewalDate: null },
      reasonForRecurringCharge: null, usageNotes: '', vendorContact: { name: 'J. Kowalski', email: 'jkowalski.dev@example.com', phone: '' },
      status: 'active', notes: 'Original site built in 2023 — outdated design, not mobile-responsive. Now being revamped (see Ordering Website Revamp).', addedDate: '2026-08-18'
    },
    {
      id: 'asset-007', customerId: 'cust-d', name: 'Hostinger VPS KVM 4', vendor: 'Hostinger',
      toolId: 'hostinger-vps', planId: 'vps-kvm-4', category: 'infrastructure',
      deploymentType: 'cloud',
      billing: { amount: 347.88, currency: 'USD', cycle: 'yearly', lastPaidDate: '2026-08-20', nextRenewalDate: '2027-08-20' },
      reasonForRecurringCharge: null, usageNotes: '', vendorContact: null,
      status: 'active', notes: 'Paid by Nimbus Foods directly to Hostinger.', addedDate: '2026-08-20'
    },
    {
      id: 'asset-009', customerId: 'cust-d', name: 'n8n Cloud Starter', vendor: 'n8n',
      toolId: 'n8n', planId: 'cloud-starter', category: 'automation',
      deploymentType: 'cloud',
      billing: { amount: 20.00, currency: 'EUR', cycle: 'monthly', lastPaidDate: '2026-09-01', nextRenewalDate: '2026-10-01' },
      reasonForRecurringCharge: 'Workflows combine multiple actions per trigger (e.g. log + Slack ping) — needs a tool with multi-step logic, not just single trigger→action automation.',
      usageNotes: '', vendorContact: null,
      status: 'active', notes: 'Paid by Nimbus Foods directly to n8n.', addedDate: '2026-09-01'
    }
  ]
};

/* ---------------------------------------------------------------------- */

function zpClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function zpLoadData() {
  try {
    const raw = localStorage.getItem(ZP_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through to reseed */ }
  const fresh = zpClone(ZP_SEED);
  localStorage.setItem(ZP_STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function zpSaveData(data) {
  localStorage.setItem(ZP_STORAGE_KEY, JSON.stringify(data));
}

function zpResetData() {
  localStorage.removeItem(ZP_STORAGE_KEY);
  return zpLoadData();
}

const ZP = { data: zpLoadData() };

function zpPersist() { zpSaveData(ZP.data); }

/* ---------------------------------- Queries ---------------------------------- */

function zpGetCustomer(id) { return ZP.data.customers.find(c => c.id === id) || null; }
function zpFindCustomerByEmail(email) {
  return ZP.data.customers.find(c => c.email.toLowerCase() === String(email).toLowerCase()) || null;
}
function zpFindAgencyByEmail(email) {
  return ZP.data.agencyUsers.find(a => a.email.toLowerCase() === String(email).toLowerCase()) || null;
}
function zpGetTeamMember(id) { return ZP.data.teamUsers.find(t => t.id === id) || null; }
function zpFindTeamByEmail(email) {
  return ZP.data.teamUsers.find(t => t.email.toLowerCase() === String(email).toLowerCase()) || null;
}
function zpGetServicesForCustomer(customerId) {
  return ZP.data.services.filter(s => s.customerId === customerId);
}
function zpGetInvoicesForCustomer(customerId) {
  return ZP.data.invoices.filter(i => i.customerId === customerId);
}
function zpGetInvoicesForService(serviceId) {
  return ZP.data.invoices.filter(i => i.serviceId === serviceId);
}
function zpGetRequestsForCustomer(customerId) {
  return ZP.data.requests.filter(r => r.customerId === customerId);
}
function zpGetService(id) { return ZP.data.services.find(s => s.id === id) || null; }
function zpGetInvoice(id) { return ZP.data.invoices.find(i => i.id === id) || null; }

/* ---------------------------------- Connected accounts (references only — no passwords) ----------------------------------
   The portal never stores third-party passwords. Each entry tracks WHICH account exists
   (provider, purpose, login URL, username) and its access-sharing STATUS — never the secret
   itself. See the notice rendered above every accounts list in services.js / agency.js. */

function zpGetAccountsForService(serviceId) {
  const s = zpGetService(serviceId);
  return (s && s.accounts) || [];
}

function zpGetAllAccountsForCustomer(customerId) {
  const services = zpGetServicesForCustomer(customerId);
  const out = [];
  services.forEach(s => {
    (s.accounts || []).forEach(acc => out.push({ ...acc, serviceId: s.id, serviceName: s.name }));
  });
  return out;
}

function zpFindAccountAndService(accountId) {
  for (const s of ZP.data.services) {
    const acc = (s.accounts || []).find(a => a.id === accountId);
    if (acc) return { account: acc, service: s };
  }
  return null;
}

/* ---------------------------------- Tasks (Team Portal) ---------------------------------- */

function zpGetTask(id) { return ZP.data.tasks.find(t => t.id === id) || null; }
function zpGetTasksForAssignee(teamId) { return ZP.data.tasks.filter(t => t.assigneeId === teamId); }
function zpGetTasksForService(serviceId) { return ZP.data.tasks.filter(t => t.serviceId === serviceId); }
function zpGetTasksForCustomer(customerId) { return ZP.data.tasks.filter(t => t.customerId === customerId); }

function zpTaskProgress(task) {
  const total = task.checklist.length;
  const done = task.checklist.filter(c => c.done).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/* ---------------------------------- Site visits ---------------------------------- */

function zpGetVisit(id) { return ZP.data.visits.find(v => v.id === id) || null; }
function zpGetVisitsForAssignee(teamId) { return ZP.data.visits.filter(v => v.assigneeId === teamId); }
function zpGetVisitsForService(serviceId) { return ZP.data.visits.filter(v => v.serviceId === serviceId); }
function zpGetVisitsForCustomer(customerId) { return ZP.data.visits.filter(v => v.customerId === customerId); }
function zpUpcomingVisitsForAssignee(teamId) {
  return zpGetVisitsForAssignee(teamId)
    .filter(v => v.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
}

/* ---------------------------------- Software assets (customer-owned & paid) ---------------------------------- */

function zpGetAsset(id) { return ZP.data.softwareAssets.find(a => a.id === id) || null; }
function zpGetAssetsForCustomer(customerId) { return ZP.data.softwareAssets.filter(a => a.customerId === customerId); }

/** Normalizes any billing cycle to an annual figure, for spend totals & comparisons. */
function zpAssetAnnualCost(asset) {
  const b = asset.billing;
  if (b.cycle === 'monthly') return b.amount * 12;
  if (b.cycle === 'yearly') return b.amount;
  return 0; // one-time purchases don't recur
}

/** All tasks (work items) billed against a given software asset — e.g. every module setup done on one Odoo install. */
function zpGetTasksForAsset(assetId) { return ZP.data.tasks.filter(t => t.assetId === assetId); }

/** Total the agency has charged for work tied to one asset, from tasks that carry their own charge. */
function zpAssetChargedTotal(assetId) {
  return zpGetTasksForAsset(assetId).filter(t => t.charge).reduce((sum, t) => sum + t.charge.amount, 0);
}

/** Every service that references an asset (via assetIds) — e.g. the implementation project(s) built on top of it. */
function zpGetServicesForAsset(assetId) {
  return ZP.data.services.filter(s => (s.assetIds || []).includes(assetId));
}

function zpCustomerSoftwareSpend(customerId) {
  const assets = zpGetAssetsForCustomer(customerId);
  const annualTotal = assets.reduce((sum, a) => sum + zpAssetAnnualCost(a), 0);
  const upcomingRenewals = assets
    .filter(a => a.billing.nextRenewalDate)
    .map(a => ({ asset: a, daysAway: zpDaysBetween(ZP_TODAY, a.billing.nextRenewalDate) }))
    .filter(r => r.daysAway >= 0 && r.daysAway <= 60)
    .sort((a, b) => a.daysAway - b.daysAway);
  return { assets, annualTotal, upcomingRenewals };
}

function zpTeamStats(teamId) {
  const tasks = zpGetTasksForAssignee(teamId);
  const monthStart = new Date(ZP_TODAY.getFullYear(), ZP_TODAY.getMonth(), 1);
  const completedThisMonth = tasks.filter(t => t.status === 'done' && t.completedDate && new Date(t.completedDate) >= monthStart).length;
  return {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    inReview: tasks.filter(t => t.status === 'in-review').length,
    done: tasks.filter(t => t.status === 'done').length,
    completedThisMonth
  };
}

/* ---------------------------------- Derived / intelligence ---------------------------------- */

function zpInvoiceTotal(invoice) {
  return invoice.items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
}

function zpDaysBetween(dateA, dateB) {
  const MS = 24 * 60 * 60 * 1000;
  const a = new Date(dateA); a.setHours(0, 0, 0, 0);
  const b = new Date(dateB); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / MS);
}

/** Effective invoice status: an 'unpaid' invoice whose due date has passed becomes 'overdue'. */
function zpEffectiveInvoiceStatus(invoice) {
  if (invoice.status === 'unpaid' && zpDaysBetween(ZP_TODAY, invoice.dueDate) < 0) return 'overdue';
  return invoice.status;
}

function zpCustomerStats(customerId) {
  const services = zpGetServicesForCustomer(customerId);
  const invoices = zpGetInvoicesForCustomer(customerId);

  const activeServices = services.filter(s => s.status === 'active').length;

  const monthlyRecurring = services
    .filter(s => s.status !== 'cancelled' && s.billing.model === 'recurring' && s.billing.cycle === 'monthly')
    .reduce((sum, s) => sum + s.billing.customerPrice, 0);

  const outstandingBalance = invoices
    .filter(i => zpEffectiveInvoiceStatus(i) !== 'paid')
    .reduce((sum, i) => sum + zpInvoiceTotal(i), 0);

  const overdueCount = invoices.filter(i => zpEffectiveInvoiceStatus(i) === 'overdue').length;

  const lifetimeInvested = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + zpInvoiceTotal(i), 0);

  const upcomingRenewals = services
    .filter(s => s.billing.model === 'recurring' && s.billing.nextRenewal)
    .map(s => ({ service: s, daysAway: zpDaysBetween(ZP_TODAY, s.billing.nextRenewal) }))
    .filter(r => r.daysAway >= 0 && r.daysAway <= 30)
    .sort((a, b) => a.daysAway - b.daysAway);

  const inDevelopment = services.filter(s => s.status === 'in-development' || s.status === 'provisioning');

  return { activeServices, monthlyRecurring, outstandingBalance, overdueCount, lifetimeInvested, upcomingRenewals, inDevelopment, totalServices: services.length };
}

function zpAgencyStats() {
  const services = ZP.data.services;
  const invoices = ZP.data.invoices;

  const activeRecurring = services.filter(s => s.status !== 'cancelled' && s.billing.model === 'recurring' && s.billing.cycle === 'monthly');
  const mrr = activeRecurring.reduce((sum, s) => sum + s.billing.customerPrice, 0);
  const monthlyCost = activeRecurring.reduce((sum, s) => sum + s.billing.ourCost, 0);
  const monthlyMargin = mrr - monthlyCost;

  const outstandingAR = invoices
    .filter(i => zpEffectiveInvoiceStatus(i) !== 'paid')
    .reduce((sum, i) => sum + zpInvoiceTotal(i), 0);

  const overdueAR = invoices
    .filter(i => zpEffectiveInvoiceStatus(i) === 'overdue')
    .reduce((sum, i) => sum + zpInvoiceTotal(i), 0);

  const oneTimeRevenue = services
    .filter(s => s.billing.model === 'one-time')
    .reduce((sum, s) => sum + s.billing.customerPrice, 0);
  const oneTimeCost = services
    .filter(s => s.billing.model === 'one-time')
    .reduce((sum, s) => sum + s.billing.ourCost, 0);

  const pendingRequests = ZP.data.requests.filter(r => r.status === 'submitted' || r.status === 'reviewing').length;

  return {
    totalCustomers: ZP.data.customers.length,
    activeServices: services.filter(s => s.status === 'active').length,
    mrr, monthlyCost, monthlyMargin,
    outstandingAR, overdueAR,
    oneTimeRevenue, oneTimeMargin: oneTimeRevenue - oneTimeCost,
    pendingRequests
  };
}

/* ---------------------------------- Formatting ---------------------------------- */

function zpFormatCurrency(amount, currency) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function zpFormatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ZP_CATEGORY_LABEL = {
  'infrastructure': 'Infrastructure & Hosting',
  'custom-development': 'Custom Development',
  'maintenance': 'Maintenance & Support',
  'software-platform': 'Software Platform',
  'automation': 'Automation & Integrations'
};
const ZP_CATEGORY_ICON = {
  'infrastructure': '🖥️',
  'custom-development': '🛠️',
  'maintenance': '🔧',
  'software-platform': '🧩',
  'automation': '⚙️'
};

function zpCategoryLabel(cat) { return ZP_CATEGORY_LABEL[cat] || cat; }
function zpCategoryIcon(cat) { return ZP_CATEGORY_ICON[cat] || '📦'; }

const ZP_STATUS_LABEL = {
  active: 'Active', provisioning: 'Provisioning', 'in-development': 'In Development',
  completed: 'Completed', paused: 'Paused', cancelled: 'Cancelled',
  paid: 'Paid', unpaid: 'Unpaid', overdue: 'Overdue', draft: 'Draft',
  submitted: 'Submitted', reviewing: 'Under Review', quoted: 'Quoted',
  approved: 'Approved', converted: 'Converted', rejected: 'Declined',
  pending: 'Pending', 'in-progress': 'In Progress',
  requested: 'Access Requested', shared: 'Shared Securely', configured: 'Configured',
  'rotate-requested': 'Please Rotate Password', 'not-needed': 'Not Required',
  todo: 'To Do', blocked: 'Blocked', 'in-review': 'In Review', scheduled: 'Scheduled'
};
function zpStatusLabel(s) { return ZP_STATUS_LABEL[s] || s; }
