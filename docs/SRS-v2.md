# SRS v2 — Zainpreneur Agency Production-Style Frontend

Version 2.0 · Generated 2026-09-06 from the product spec (sections 1–14).
Supersedes direction of `SRS.md` (v1 remains the as-built record of the current app).

## 1. Purpose and scope

Zainpreneur Agency is a software implementation, development, automation, hosting,
ERP, POS, website, maintenance, and technology-management platform with two
connected experiences: **Customer Portal** and **Agency Portal** (§3).

The frontend shall be a complete production-style application. Until backend
integration, it runs on mock/local data behind a **frontend service abstraction**.
Conformance rule: every feature must be buildable against the service interface
first, so swapping mock services for REST services changes no UI code.

> Backend note (reconciliation with spec §2.2): a working API/DB stack already
> exists and is verified (26/26 CRUD). The §2.2 exclusion list is therefore read
> as "not built by the frontend track". The service abstraction (§12) binds to
> mock data by default and to the live API where entities already exist
> (catalogue, team, services, assets, credentials, invoices, users).

## 2. Product architecture

Four concepts must stay distinct and be reflected consistently throughout the
UI: **Software** (catalogue product) → **Technology Asset** (customer's actual
system/subscription) → **Zainpreneur Service** (agency work) → **Project/Work**
(structured implementation package). Money follows the same separation:
vendor costs + agency charges + maintenance + implementation charges are shown
as separate lines everywhere, so customers never confuse vendor payments with
agency invoices.

General delivery workflow (stages optional per service): Discovery →
Assessment → Recommendation → Proposal → Approval → Planning → Access →
Implementation → Testing → UAT → Handover → Maintenance → Support.

```
ZAINPRENEUR AGENCY
├── Customer Portal: Dashboard, Technology, Software, Services, Projects,
│   Tasks, Costs, Renewals, Invoices, Support, Documents, Credentials, Account
└── Agency Portal: Dashboard, Customers, Users, Software Catalogue, Services,
    Projects, Tasks, Team, Technology, Recommendations, Invoices, Support,
    Documents, Roles, Permissions, Activity, Reports, Settings
```

## 3. Technology and frontend architecture

HTML5 + CSS3 + JS/TS. Recommended: React + Vite. Permitted: Chart.js, Lucide.
No unnecessary dependencies. Layered structure (`app`, `layouts`, `pages`,
`features`, `components`, `forms`, `tables`, `modals`, `wizards`, `state`,
`permissions`, `services`, `mock`, `utils`, `styles`, `assets`).

Stack decision is deferred (§13, Phase 0): either rebuild on React+Vite per this
structure, or evolve the current vanilla multi-page app toward it module by
module. All requirements below are stack-neutral.

## 4. Design principles

Simple, professional, consistent, information-dense but uncluttered, responsive,
accessible, role-aware, permission-aware, reusable, scalable, mobile-friendly,
business-oriented — a modern B2B SaaS/ERP feel.

## 5. Application shell

Desktop: brand + global search + notifications + user menu topbar; sidebar nav;
main content. Mobile: top bar with menu + notifications; content; bottom tab bar
(Home, Services, Projects). Sidebar and tabs render from the permission-aware
navigation model (§8) — never hardcode role menus in pages.

## 6. Authentication experience

Login (email, password, remember-me, show/hide, forgot-password link) plus
screens/flows for: forgot password, password reset, email verification, MFA
verification, account disabled, session expired, and logout confirmation where
appropriate. All driven by frontend state/mock auth service until real auth is
connected (then: HTTP-only session cookie, same flows, server-verified).

## 7. Roles and permission model

Roles: Super Admin, Admin, Manager, Implementer, Customer Admin, Customer User;
custom roles supported later (name + permission set + assignment).

Granular permissions (examples): `customers.*`, `users.*` (+`disable`),
`catalog.*`, `services.*`, `projects.*`, `tasks.*`, `team.*`, `assets.*`,
`credentials.*` (+`reveal`), `invoices.*` (+`create/update`), `support.*`,
`roles.*`, `permissions.read`, `audit.read`, `reports.read`.

Hard rule: frontend permissions control **UI visibility and behavior only** and
are never treated as security authorization — the backend enforces everything
(verified: 403s on `catalog:create` etc.). `credentials.read` vs
`credentials.reveal` stay separate; reveal requires step-up/MFA + audit in
production. Backend role mapping: super_admin→Super Admin, admin→Admin,
manager→Manager, implementer→Implementer, customer_admin→Customer Admin,
customer_user→Customer User.

## 8. Navigation access

Navigation adapts automatically to role + permissions; users never see items
they cannot use. Customer nav: Dashboard, Technology, Software, Services,
Projects, Tasks, Invoices, Renewals, Support, Documents, Credentials, Account.
Agency nav: Dashboard, Customers, Users, Technology, Software Catalogue,
Services, Projects, Tasks, Team, Recommendations, Invoices, Support, Documents,
Roles, Permissions, Reports, Activity, Settings.

## 9. Customer portal modules

- **Dashboard**: active services/projects, open tasks, upcoming renewals,
  technology spending vs agency charges, outstanding invoices, support requests,
  recent activity, recommendations, upcoming appointments.
- **Technology**: customer technology inventory — systems already owned/used
  (Hostinger VPS, Odoo, legacy POS, custom website, Zapier, Google Workspace,
  domain, email, custom apps). Fields: name, type, vendor, developer/provider,
  status, customer cost, currency, billing period, renewal date, website,
  deployment, device, OS, connectivity, notes, configuration. Asset states:
  Active, Needs Maintenance, Legacy, At Risk, Unsupported, Replacement
  Candidate, Under Review, Retired. Assessment workflow per system: existing
  system → business requirements → current capabilities → problems → current
  cost → alternative options → recommendation.
- **Software**: customer-owned software/subscription inventory (this is the
  owned-vs-billed separation: agency never resells; see current `software.html`
  + savings engine — keep and extend).
- **Services**: agency work catalogued as Software Development, Website
  Development, Automation, ERP, POS, Hosting, Infrastructure, Migration,
  Integration, Maintenance, Consulting, Training, Support. Service fields:
  name, category, service type, status, delivery mode, billing model, customer
  software cost, implementation cost, recurring cost, start/renewal dates,
  configuration, assigned team, related software. Delivery modes: Online,
  Virtual, On-site, Hybrid; on-site adds location/address/map, date/time,
  assigned staff, equipment, travel status, check-in/out, evidence, customer
  confirmation. Cost structure shows customer-facing charges only.
- **Projects**: project cards with progress, milestones, linked tasks, target
  dates (extends current `deployments.html`).
- **Tasks**: customer-visible task tracking (read-mostly; status, assignee, due).
- **Costs**: technology spend vs agency charges breakdown, one-time vs recurring,
  cost outlook.
- **Renewals**: upcoming-renewals table (technology, date, cost) with 7/30/60/
  90-day and custom filters, per-item owners, renewal alerts.
- **Invoices**: list (number, customer, date, due, amount, status: Draft,
  Issued, Partially Paid, Paid, Overdue, Cancelled), filters, printable/PDF
  invoice, payment state, statements. Detail: line items (service,
  description, amount, billing model), subtotal, total, due date, payment
  status. Cost separation is always explicit: customer vendor costs vs agency
  implementation costs vs agency recurring costs (e.g. vendor SAR 180/mo +
  services SAR 100/mo = SAR 280/mo total).
- **Support**: ticket list with status tabs, create form, message threads,
  replies (current `support.html` is the baseline; add priorities/SLA display).
  Ticket fields: subject, category, priority, service, description,
  attachments. Statuses: Open, Assigned, In Progress, Waiting Customer,
  Resolved, Closed.
- **Documents**: evidence/documents per service/project (upload, list, link to
  milestones; storage backend later).
- **Credentials**: vault UI — table (provider, masked username/password),
  actions (view, copy username, reveal password, copy password, edit, delete);
  secrets masked by default. Reveal shows a sensitive-information confirmation
  and reserves a future MFA/step-up slot (+ audit). Covers hosting, ERP,
  automation, domain, API, and other customer-system credentials; encryption
  and storage are backend responsibilities (AES-256-GCM verified live).
- **Account**: business profile, currency, billing contact, notification
  preferences; organization user management for Customer Admins (fields: name,
  email, phone, role, status, last activity; actions: add, edit, enable,
  disable, reset password, view access, revoke sessions).
- **Onboarding**: first-time customer wizard (Welcome → Business Information →
  Add Existing Technology → Add Software → Review Services → Invite Users →
  Start Project) with progress indicator.

## 10. Agency portal modules

- **Dashboard**: customers, active implementations/projects, overdue tasks, team
  workload, revenue, recurring services, upcoming renewals, support workload,
  catalogue alerts, recommendations, recent activity (extends current console
  overview).
- **Customers**: list (business, primary contact, users, services, projects,
  status,
  created, actions: view/edit/disable/manage-users) + profile (overview, users,
  technology, software, services, projects, tasks, invoices, renewals, support,
  documents, credentials, activity, settings).
- **Users**: admin table (name, email, organization, role, status) + add;
  profile (details, permission matrix view, sessions with revoke, change
  password, reset MFA, disable, revoke all sessions). User detail tree:
  profile, organization, role, permissions (each shown as inherited, direct,
  or denied), sessions, activity, security.
- **Roles / Permissions**: role list + matrix editor (later: custom-role
  builder with per-resource Read/Create/Update/Delete grants), permission
  catalogue view (mirrors `/api/rbac/roles`). Session management UI: current
  session, active devices (device/browser, last activity), revoke one/all,
  expiration display. User security screen: password, MFA, active sessions,
  login history, security events; actions change password, enable/disable
  MFA, revoke sessions.
- **Software Catalogue**: the central technology discovery interface.
  Entry fields: name, vendor, category, description, website, pricing info,
  plans, features, capabilities, restrictions, technical requirements, device/
  OS/connectivity compatibility, deployment model, integrations,
  implementation services, last-verified info. Categories: ERP, POS, CRM,
  Automation, Website, Hosting, Accounting, Communication, Storage, Security,
  Productivity, Custom Software, Other. Admin actions: add, edit, duplicate,
  archive, delete (where permitted), refresh, change review; editor sections:
  Basic Information, Plans, Features, Capabilities, Requirements,
  Compatibility, Deployment, Integrations, Implementation, Pricing, Sources.
  Plan comparison + staleness alerts (current `catalogue.html` + pricing
  editor is the baseline; bind to `/api/catalog`).
- **Software Plans**: multiple plans per product (name, price, currency,
  billing period, user/usage limits, features, restrictions, availability,
  deployment type). UI must distinguish Free, Paid, Custom Pricing, Included,
  One-time, Recurring.
- **Software Capabilities**: stored separately from marketing features so
  comparisons and recommendations are meaningful (CRM, ERP, POS, Accounting,
  Inventory, Manufacturing, Website, E-commerce, Automation, API, Webhooks,
  Offline, Self-hosting, Cloud, Mobile, Desktop).
- **Catalogue Refresh**: staged workflow (Refresh → Checking pricing/plans/
  features/capabilities → Changes Found → Review → Approve/Reject) showing
  last-verified date, source, changed fields with previous vs new values, and
  approval status. Vendor retrieval itself is outside frontend scope
  (backend `adapter_pending` pattern stands).
- **Services**: catalogue of service offerings + templates, configurator
  (category → tool/plan → devices/OS/connectivity → stack → delivery mode),
  per-service edit/delete (missing in current UI — add). Creation uses a
  reusable 10-step wizard (Service → Software → Existing/New → Requirements →
  Configuration → Implementation Scope → Delivery → Team & Schedule → Cost →
  Review) with conditional fields driven by template field definitions
  (name, label, type, required, options, default, help, validation, visibility
  condition — e.g. Delivery Mode = On-site reveals location/date/time/staff/
  equipment). Domain configs: software stack (frontend/backend/database/infra/
  auth/integrations pickers), website (platform: Hostinger/HubSpot/Odoo/
  WordPress/Custom; domain, hosting, SSL, pages, CMS, forms, SEO, analytics,
  maintenance), automation (platform; trigger → condition → actions →
  notification; frequency, usage, error handling, monitoring), ERP (edition,
  modules, users, roles, branches, warehouses, products, customers, vendors,
  accounting, POS, inventory, manufacturing, website, HR, migration,
  training), POS (platform, terminals, devices, printers, scanners, drawers,
  inventory, offline, payments, branches, users), hosting/infra (provider,
  server, plan, CPU/RAM/storage, OS, region, domain, SSL, backup, monitoring,
  Docker, database, DNS, firewall). Admin-authored reusable templates (ERP,
  POS, Website, Software Dev, Automation, Hosting, Migration, Integration,
  Maintenance) define required fields plus suggested work checklists.
- **Projects**: CRUD (name, customer, service, project manager, status,
  progress, planned/actual start/end, location, description), lifecycle Draft
  → Planning → Scheduled → Access Required → Implementation → Testing → UAT →
  Handover → Completed (plus Paused, Cancelled). Detail sections: overview,
  timeline, tasks, team, software, configuration, documents, evidence, costs,
  communication, support, activity.
- **Tasks**: CRUD (title, description, project, assignee, priority, status,
  due date, estimated/actual time, dependencies, evidence, notes, completion
  date) with List, Board, Calendar, Timeline views; status flow todo →
  in-progress → blocked → in-review → done.
- **Team**: member CRUD + activate/deactivate, operational roles (Project
  Manager, Implementer, Senior Implementer, Technical Lead, Developer,
  Designer, Support, Consultant — separate from application access roles),
  skills, assignments, workload view (bind to `/api/team`). Team portal
  prioritizes assigned work: dashboard, projects, tasks, schedule, customers,
  services, appointments, credentials, activity. Project work ledger (date,
  member, work, duration, status) with customer-safe visibility.
- **Technology**: cross-customer technology landscape (what vendors/stacks are
  deployed where).
- **Recommendations**: findings pipeline (flagged → proposed →
  accepted/dismissed, per customer; extends current savings engine) comparing
  alternatives on requirements, capabilities, features, cost, recurring +
  implementation + migration cost, offline/device/OS fit, integrations,
  scalability, maintenance, deployment model. Results show current vs
  alternative cost, estimated saving, compatibility %, advantages,
  considerations, and explicit assumptions/limitations. Rule: never equate
  "free" with "better". Multi-product comparison matrix on price, plans,
  features, capabilities, limits, offline, devices, OS, deployment,
  integrations, implementation, maintenance, estimated total cost.
- **Invoices**: read + billing workflow hooks (backend adds payment integration
  later); agency sees margin (cost vs charged).
- **Support**: all-org ticket queue, assignment, status management, SLA view.
- **Documents**: all-org evidence library linked to services/projects.
- **Activity**: audit/activity timeline across customers, services, tickets
  (feed derived from entity events).
- **Reports**: customer reports (technology costs, software inventory,
  renewals, services, project progress, support, invoices) and agency reports
  (customers, services, revenue, projects, team utilization, recurring
  services, catalogue, recommendations) with charts (Chart.js): spending,
  progress, renewal costs, growth, revenue, distribution, status, workload,
  categories, recurring revenue.
- **Settings**: agency sections General, Users, Roles, Permissions, Team,
  Software Catalogue, Service Templates, Notifications, Billing, Appearance,
  Security.
- **Change requests & approvals**: customer/staff change requests (requester,
  description, reason, impact, additional cost/time; Draft → Submitted → Under
  Review → Approved/Rejected → Implemented) with a generic approval UI
  (proposals, recommendations, scope, change requests, completion, handover:
  review text + agree-to-scope checkbox + Reject/Approve). Proposal/scope view:
  project, scope, software, implementation, timeline, deliverables, cost,
  recurring cost, assumptions, terms, approval.

## 11. Cross-cutting requirements

- **Global search** (§13): customers, users, software, services, projects,
  tasks, assets, invoices, tickets, documents — grouped by type, with
  contextual filters (e.g. projects by customer/status/manager/date; software
  by category/vendor/pricing/deployment/offline; technology by vendor/status/
  renewal/cost).
- **Empty/loading/error states**: every module has meaningful empty states
  (message + what-appears-here + action); every data interface handles
  loading/loaded/empty/error/retry with skeletons where appropriate; errors
  show a friendly retry panel, never stack traces; destructive actions require
  confirmation dialogs, sensitive ones (credential reveal) stronger
  confirmation.
- **Notifications**: in-app center (project updates, task assignments,
  invoices, renewal reminders, support responses, catalogue updates,
  recommendation alerts, system) with read/unread, priority, timestamp,
  related resource, deep navigation + preferences; delivery channels later.
- **Documents/evidence**: typed library (reports, screenshots, config docs,
  migration files, deployment evidence, approvals, handover docs) with
  upload, preview, rename, download, delete, share (where permitted);
  object storage later.
- **Calendar**: unified Day/Week/Month/Agenda view over on-site visits,
  meetings, project/task deadlines, renewals, support appointments, team
  schedules.
- **On-site workflow**: mobile-friendly flow Scheduled → Traveling → Arrived →
  Checked In → Work → Evidence → Customer Confirmation → Checked Out →
  Completed, with camera/evidence upload where available.
- **Activity timeline**: uniform event feed (Created, Updated, Assigned,
  Completed, Approved, Rejected, Viewed, Revealed, Uploaded, Deleted) grouped
  Today/Yesterday with actor + action + resource, reused on dashboards,
  projects, customers. Audit views cover user/role/project/service/catalogue
  changes, credential access, approvals, customer actions (actor, action,
  resource, time).
- **Status system**: standardized badges (Draft, Active, Pending, Scheduled,
  In Progress, Completed, Paused, Cancelled, Overdue, Archived) using text +
  visual indicators — never color-only (current `zpBadge` is the baseline;
  extend tone map to all ten).
- **Detail page standard**: header (title, status, primary/secondary actions),
  summary, tabs (Overview, Configuration, Related, Documents, Activity).
- **CRUD standard**: full interfaces for customers, users, software (+plans),
  services (+templates), projects, tasks, team members, technology assets,
  credentials, tickets, documents, roles, permissions. Where deletion is
  inappropriate use Archive, Disable, Deactivate, Cancel, or Retire instead.
- **Responsive/mobile**: supported layouts Mobile 320–767, Tablet 768–1023,
  Laptop 1024–1439, Desktop 1440px+; tables become scrollable, condensed, or
  card-based per resource; bottom-tab mobile shell. Essential mobile
  operations: dashboard, projects, task updates, schedules, on-site
  check-in/out, evidence upload, customers, services, support requests,
  notifications, invoices, account.
- **Accessibility**: target WCAG 2.2 AA — keyboard navigation, focus states,
  semantic HTML, screen-reader labels, accessible forms/dialogs/error
  messages, adequate contrast, non-color-only status, touch-friendly controls.
- **i18n/RTL readiness**: no hardcoded layout direction; strings externalized
  from day one. Initial language English; architecture allows English, Arabic,
  Urdu. RTL across navigation, forms, tables, cards, modals, dashboards,
  charts, timelines, mobile layouts.
- **Currency/dates/theme**: multi-currency (SAR, USD, PKR, EUR, GBP) with
  centralized formatting; centralized date/time formatting with local,
  customer, and agency timezones and 12/24-hour formats; Light/Dark/System
  theme applied consistently.
- **Command interface** (optional): `/` palette for search + commands (create
  customer/project/service/software, find customer, view renewals, open
  project).
- **Table system**: every major table supports search, sorting, filtering,
  pagination, column visibility, row actions, bulk selection + bulk actions,
  and loading/empty/error states.
- **Form system**: reusable inputs (text, number, currency, date, datetime,
  select, multi-select, checkbox, radio, textarea, file, search, tags, rich
  text) with required indicators, help text, validation + inline errors,
  save/cancel/reset, unsaved-change warning. Configuration-driven dynamic
  forms (name, label, type, required, options, default, validation, help,
  visibility condition) so service categories get different screens without
  separate UI systems.
- **Component library**: Button, Input, Select, Checkbox, Radio, Textarea,
  Date Picker, Search, Badge, Avatar, Card, Table, Tabs, Modal, Drawer,
  Dropdown, Tooltip, Toast, Alert, Progress, Timeline, Calendar, Chart,
  Wizard, File Upload, Empty/Error/Skeleton states.

## 12. Data and service abstraction

Frontend entities: organizations, users (+roles/permissions/sessions),
customers, software/tools (+plans/features/capabilities), services (+config),
projects (+milestones), tasks (+checklist/notes/assignments), team members,
assets, credentials (metadata vs secrets), invoices (+lines), tickets
(+messages), documents, notifications, activity events, renewals (derived),
recommendations (derived). Backend coverage today: organizations, users,
software, services, service_software, credentials, projects, tasks,
task_assignments, team_members, invoices, invoice_lines, customer_assets.
Frontend-only until bound: documents, notifications, roles/permissions admin
(read exists), tickets/support (backend has none yet — propose `tickets` table
mirroring the current frontend shape), visits/site-work, recommendations
workflow state.

State is separated by domain: authentication, current user, organization,
permissions, customers, users, software, services, technology, projects,
tasks, team, invoices, renewals, support, documents, credentials,
notifications, recommendations, UI.

Pages depend only on service interfaces — `authService`, `customerService`,
`userService`, `catalogService`, `technologyService`, `serviceService`,
`projectService`, `taskService`, `teamService`, `invoiceService`,
`renewalService`, `supportService`, `documentService`, `credentialService`,
`recommendationService`, `notificationService`, `roleService`,
`permissionService` — implemented by `mock*` services today and API services
later with no UI changes.

Mock data covers multiple businesses, customer users, internal staff,
software + plans, technology assets, services, projects, tasks, team members,
invoices, renewals, recommendations, tickets, notifications, documents,
credentials. Demo role switching (Super Admin, Admin, Manager, Implementer,
Customer Admin, Customer User) changes navigation, dashboard, visible pages,
available actions, and permission indicators; demo-only mechanism.

Security UX: mask credentials by default, never put secrets in URLs, no
hardcoded production credentials, permission-aware controls,
sensitive-action confirmation, MFA/step-up readiness, session-management and
security/activity views. Frontend controls are never a substitute for backend
security.

## 13. Phased build plan (priority order)
- **Phase 0 — Direction**: confirm React+Vite rebuild vs incremental vanilla
  evolution (default if undecided: incremental — zero migration risk, ships).
- **Phase 1 — Foundation**: service abstraction + mock store, permission-aware
  shell/nav, auth screens, global search, activity feed primitives, i18n/RTL
  scaffolding, print styles.
- **Phase 2 — Customer parity+**: account/users page, technology inventory page,
  costs page, renewals page, documents, notifications, credentials vault UI
  (bound to `/api/credentials` + reveal flow).
- **Phase 3 — Agency depth**: users admin, roles/permissions UI, team workload,
  recommendations pipeline, reports, settings, service edit/delete.
- **Phase 4 — Cutover**: bind services to live API per entity, keep mock
  fallback; stored-XSS hardening (`esc()` everywhere); mass-assignment
  hardening is backend-side (whitelist PATCH fields).

## 14. Acceptance criteria

Functionally complete when: auth screens (login, logout, recovery, session
states, role demo) work; roles/permissions exist with permission-aware
navigation and actions plus user-access UI and representable custom roles;
catalogue supports add/edit/archive, plan/feature/capability config, compare,
recommendations, refresh review; technology displays inventory, assessments,
costs, renewals, statuses; services support creation, categories, dynamic
config, templates, delivery modes, stack config; projects/tasks support
creation, assignment, status workflow, timelines, team info; financials show
invoices with vendor/agency charge separation and renewals; team shows
members, assignments, work ledger, on-site workflow; security shows masked
credentials, reveal flow, access UI, roles/permissions UI, activity, sessions;
UX is responsive with mobile workflows, loading/empty/error states,
confirmations, a11y addressed, RTL-ready.

## 15. Final structure

Customer Portal (Technology, Projects, Invoices, Renewals, Assets, Account;
Services, Projects, Support, Documents, Credentials) and Agency Portal
(Customers, Users, Projects, Tasks, Technology, Roles, Permissions; Catalogue,
Services, Team, Billing, Reports, Activity, Settings) share: components
(forms, tables, modals, wizards, charts, navigation), state (user, catalogue,
services, projects, notifications), permissions (roles, permissions, access
UI), and frontend services over mock data/state today, the API later.

Normalized modules (24): Authentication, Dashboard, Customers, Users & Access,
Software Catalogue, Technology Inventory, Recommendations, Services, Service
Templates, Projects, Tasks, Team, On-site Work, Invoices, Costs & Renewals,
Support, Documents & Evidence, Credentials, Notifications, Activity, Roles,
Permissions, Reports, Settings, Shared Design System.

Boundary rule: no backend/database assumptions leak into component design.
Pages use service interfaces; mock services implement them today; API services
replace them later with zero UI changes. The app is fully demonstrable on
mock data while structurally ready for backend connection.

## Appendix A — Current-state coverage map (vanilla app, 2026-09-06)

Done: auth guard + login (signin/forgot/reset/MFA views, disabled/expired/
signed-out states), customer dashboard/technology/services/deployments/
software/
invoices/request/support, agency console (overview/customers/requests/tasks/
quoting), team kanban + visits, catalogue browser + pricing editor, tickets
entity + migration, Api service abstraction + permission registry + generated
nav model, auth screens (signin/forgot/reset/MFA/disabled/signed-out),
global search (grouped, deep-linked, keyboard-navigable), credentials vault
(reference-only tracking + access trail + share/rotate actions), account page
(profile, preferences, org users, sessions), technology inventory (lifecycle
states + assessments), costs (3-bucket separation) + renewals (merged
service/asset list, range filters), documents (metadata library + upload/
preview/rename/delete), notifications (derived feed, read/unread, preference
filtering), SRS v1. Agency console now has a Services view (edit + delete
with task cascade, invoices preserved), users admin (team CRUD + customer
user oversight, inactive login guard), roles page (permission matrix +
custom role builder + team assignment, enforced by zpCan), reports (SVG
charts: MRR/services/tasks/workload/support/catalogue) + settings (general,
billing defaults feeding quotes, notifications, catalogue threshold feeding
staleness, security policy), workload view (load bars + open-work table),
recommendations pipeline (flagged → proposed → accepted/dismissed with
dismissal sync), i18n scaffolding (en/ar registry, translated nav + login,
RTL stylesheet, language pref), a11y pass (skip link, Esc-to-close,
focus-visible styles, full label/aria audit), REST transport (fetch +
Api.rest bindings for auth/catalog/team/assets/credentials/invoices/
services/projects/tasks/admin/rbac, verified live; mock default, mode
toggle + connection test in Settings), catalogue cutover (REST reads with
DB↔mock shape normalization + hybrid merge, pricing PATCH with mock
fallback; required backend `software.slug` — schema, seed, create endpoint,
refresh-by-id fallback), team admin CRUD binding (whitelisted writes, mock
fallback, custom roles stay mock-side), tickets end-to-end (new backend
table + endpoints + RBAC tickets:* + frontend support page binding via
customerRef mapping, UUID-safe deep links).
Missing vs this spec:
(none open — remaining work is backend cutover per Phase 4.)
