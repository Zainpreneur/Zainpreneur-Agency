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
    { id: 'team-3', name: 'Marco Silva', email: 'marco@zainpreneur.agency', password: 'team1234', role: 'No-Code / App Specialist', skills: ['AppSheet', 'Glide', 'Google Workspace'] }
  ],

  services: [
    {
      id: 'svc-001', customerId: 'cust-a', name: 'Odoo ERP Platform',
      category: 'infrastructure', provider: 'Hostinger', plan: 'VPS KVM 2',
      stack: ['Ubuntu 22.04 LTS', 'Docker', 'Odoo 17 CE', 'PostgreSQL 15', 'Nginx + SSL'],
      status: 'active', deployedDate: '2024-03-10',
      description: 'Fully managed Odoo ERP deployment (Sales, Inventory, Accounting) hosted on a dedicated Hostinger VPS KVM 2 instance with automated daily backups.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 12.99, customerPrice: 49.00, currency: 'USD', nextRenewal: '2026-10-10' },
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
      description: 'ERP environment currently being provisioned; go-live is scheduled once data migration from the legacy system finishes.',
      billing: { model: 'recurring', cycle: 'monthly', ourCost: 24.99, customerPrice: 89.00, currency: 'USD', nextRenewal: '2026-10-01' },
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
    }
  ],

  invoices: [
    { id: 'INV-2026-1001', customerId: 'cust-a', serviceId: 'svc-001', issueDate: '2026-07-10', dueDate: '2026-07-17', status: 'paid', paidDate: '2026-07-12', currency: 'USD', items: [{ desc: 'Odoo ERP Platform — Hosting (Jul 2026)', qty: 1, unitPrice: 49.00 }] },
    { id: 'INV-2026-1002', customerId: 'cust-a', serviceId: 'svc-001', issueDate: '2026-08-10', dueDate: '2026-08-17', status: 'paid', paidDate: '2026-08-11', currency: 'USD', items: [{ desc: 'Odoo ERP Platform — Hosting (Aug 2026)', qty: 1, unitPrice: 49.00 }] },
    { id: 'INV-2026-1003', customerId: 'cust-a', serviceId: 'svc-001', issueDate: '2026-09-01', dueDate: '2026-09-08', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Odoo ERP Platform — Hosting (Sep 2026)', qty: 1, unitPrice: 49.00 }] },
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

    { id: 'INV-2026-4001', customerId: 'cust-d', serviceId: 'svc-007', issueDate: '2026-08-25', dueDate: '2026-09-01', status: 'unpaid', paidDate: null, currency: 'USD', items: [{ desc: 'Odoo Community Platform — Setup fee + first month (Sep 2026)', qty: 1, unitPrice: 89.00 }] }
  ],

  requests: [
    {
      id: 'REQ-9001', customerId: 'cust-d', title: 'Custom Recipe Costing Dashboard',
      category: 'custom-development',
      description: 'We need a dashboard that recalculates recipe costs as ingredient prices change, integrated with our Odoo inventory.',
      budgetRange: '$5,000 - $10,000', timeline: '2-3 months',
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
      id: 'task-004', serviceId: 'svc-001', customerId: 'cust-a',
      title: 'Deploy Odoo ERP Platform on Hostinger VPS',
      assigneeId: 'team-1', status: 'done', priority: 'normal',
      createdDate: '2024-02-20', dueDate: '2024-03-10', completedDate: '2024-03-10',
      blockedReason: null,
      checklist: [
        { text: 'Provision Hostinger VPS KVM 2 instance', done: true },
        { text: 'Harden server (SSH, firewall, OS updates)', done: true },
        { text: 'Install Docker & deploy Odoo 17 CE + PostgreSQL', done: true },
        { text: 'Configure domain, DNS & SSL', done: true },
        { text: 'Set up automated backups', done: true },
        { text: 'Smoke-test the deployment', done: true },
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
  'software-platform': 'Software Platform'
};
const ZP_CATEGORY_ICON = {
  'infrastructure': '🖥️',
  'custom-development': '🛠️',
  'maintenance': '🔧',
  'software-platform': '🧩'
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
  todo: 'To Do', blocked: 'Blocked', 'in-review': 'In Review'
};
function zpStatusLabel(s) { return ZP_STATUS_LABEL[s] || s; }
