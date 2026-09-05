# Software Requirements Specification — Zainpreneur Agency Portal

Version 1.0 · Generated 2026-09-05 from code analysis of this repo.

## 1. Purpose and scope

Zainpreneur Agency is a **static, offline-first, no-backend web app** (HTML + CSS + vanilla JS)
that serves as the agency's client-facing portal and internal operations console.

Core business rule (stated across the UI): **customers own their software and pay vendors
directly; the agency bills implementation, setup, and development work only** — never
software resale.

In scope:

- Public landing page (`index.html`) linking into the portal.
- Role-based portal: Customer, Agency Console (staff), Delivery Team.
- Service catalogue with vendor tools, plan tiers, and pricing (manually maintained).
- Service requests → quotes → services → delivery tasks → invoices lifecycle.
- Customer-owned software/subscription tracking with savings analysis.
- Credential-status tracking for connected accounts (references only, never passwords).

Out of scope (not implemented): real authentication, payments, email, backend persistence,
multi-user concurrency, automated vendor pricing.

## 2. User roles

| Role | Entry | Capabilities |
|---|---|---|
| Customer | `portal/login.html` (Customer tab) | Dashboard, My Services, My Software, Invoices & Billing, Request a Service |
| Agency staff | `portal/login.html` (Agency Console tab) | Overview/MRR, Customers, Service Requests (review/quote/decline), Delivery Tasks oversight, Catalogue pricing edits |
| Delivery team | `portal/login.html` (Delivery Team tab) | Kanban task board, task detail (checklist/notes/status), site visits, catalogue (read-only) |

Demo credentials live in `portal/js/data.js` (`ZP_SEED`): 4 customers (`demo1234`),
1 agency user (`agency123`), 4 team members (`team1234`). Passwords are plaintext —
acceptable for a demo only (see §7).

## 3. Functional requirements

### 3.1 Landing (root)

- FR-1: `index.html` presents the agency and links to `portal/login.html`.
- FR-2 (fixed 2026-09-05): dead root `app.js` (upload/camera/HTR code referencing removed
  Inktogrid elements) deleted; `index.html` no longer loads it.
- FR-3 (fixed 2026-09-05): orphaned non-functional root `login.html` deleted; root
  `style.css` trimmed to landing-only rules.

### 3.2 Authentication & shell

- FR-4: Single login page with three role tabs; `?as=agency|team` deep links select the tab
  (used by auth-guard redirects).
- FR-5: Click-to-sign-in demo account list per role.
- FR-6: Session stored in `sessionStorage` (`zp_session_v1`); `zpRequireAuth()` guards every
  portal page and redirects to login on missing/mismatched/unknown sessions.
- FR-7: Shared shell (`nav.js` `zpInitShell`) sets active nav, user chip, topbar date, logout.

### 3.3 Customer portal

- FR-8 Dashboard: alert banner (pending/rotate account access, overdue invoices, upcoming
  renewals, savings), stat tiles (active services, MRR, outstanding, lifetime), top-4
  services, software spend summary, 5 recent invoices, in-progress project milestones.
- FR-9 My Services: category/status filters, service cards, detail modal (billing, provider,
  work breakdown from charged tasks, linked software assets, tech stack, structured config,
  milestones timeline, billing history, account-access section with add/mark-shared/
  mark-rotated flows).
- FR-10 My Software: add/edit/delete owned software assets (name, vendor, category,
  deployment, amount/cycle, last paid → computed next renewal, automation count,
  recurring-charge reason, usage notes, vendor contact); savings panel with
  dismissible findings (`Request This Switch` deep-links to request flow).
- FR-11 Invoices & Billing: paid/outstanding/overdue stat tiles, status tabs, printable
  invoice modal (line items, subtotal/total, paid stamp).
- FR-12 Request a Service: catalogue-driven configurator (category → tool/plan, devices,  OS, connectivity, tech stack, automation builds, delivery mode + site location), then
  title/description/priority/budget/timeline; request list; simulated agency pickup
  (   `submitted` → `reviewing` after 4 s).
- FR-12a Deployments & Projects (added 2026-09-05): customer-facing project cards
  derived from services with milestones or delivery statuses
  (`provisioning|in-development|paused`); progress from milestones or linked-task
  completion; per-project open-task tables; deep-links to `services.html?svc=`.
  Uses only existing `portal.css` classes (no new CSS).
- FR-12b Support & Requests (added 2026-09-05): ticket table with status tabs
  (`open|in-progress|resolved`), create form (subject/service/priority/details),
  detail modal with message thread + customer replies (replying reopens resolved
  tickets). `zpLoadData` forward-migrates older stored data by backfilling new
  seed collections.

### 3.4 Agency console

- FR-13 Overview: customer/active-service counts, MRR + margin, booked one-time revenue +
  margin, AR/outstanding/overdue, pending requests, per-customer MRR bar breakdown.
- FR-14 Customers: table (company, industry, since, active/total, MRR, outstanding) with
  detail modal (contact, services cost-vs-charged with margin, recent invoices, account
  access actions, customer's own software + savings flags).
- FR-15 Requests: review queue with pending badge; quote modal (service name, suggested
  price from configurator, billing model/cycle, cost vs. charged price, assignee,
  priority, due date, optional first-invoice generation with 30%-deposit rule for
  one-time work); decline path. Converting creates service + delivery task (+ site
  visit for on-location/hybrid) and marks request `converted`.
- FR-16 Tasks oversight: status tabs, read-only task detail (checklist, config).
- FR-17 Catalogue pricing maintenance: edit/add/remove plans per tool, stamps
  `lastVerified` = today.

### 3.5 Team workspace

- FR-18 Kanban (To Do → In Progress → Blocked → In Review → Done) with priority pills,
  step progress, due-date sorting.
- FR-19 Task detail: blocked-reason prompt, account-access alerts, linked service config,
  interactive checklist, notes, status-transition actions; completing a task flips the
  linked service to `active`/`completed` with milestones closed.
- FR-20 Site visits: upcoming-visit cards, map embed, on-site checklist, notes,
  mark-completed.

### 3.6 Catalogue (shared reference)

- FR-21 Read-only catalogue for team; agency-editable pricing; per-category tools with
  plan tiers, features/limitations, vendor pricing links, staleness badges; device/OS/
  connectivity and tech-stack reference sections; free-alternative hints used by the
  savings engine (`zpCheapestFreeAlternative`, `zpAutomationFreeAlternative`).

## 4. Data model (client-side; `localStorage` key `zp_portal_data_v1`, seeded from `ZP_SEED`)

Entities: `customers`, `agencyUsers`, `teamUsers`, `catalogueTools{}`,
`services[]` (incl. embedded `billing{}`, `config{}`, `accounts[]`, `milestones[]`),
`invoices[]` (embedded `items[]`), `requests[]`, `tickets[]` (embedded `messages[]`),
`tasks[]` (embedded `checklist[]`,
`notes[]`), `visits[]`, `softwareAssets[]`.

Key relationships: service → customer; invoice → service; task → service + assignee;
visit → service + assignee; asset → customer (+ optional `toolId`/`planId`,
`assetIds[]` back-link from services); request → customer (+ `serviceCategoryId`).

Statuses: services (`active|provisioning|in-development|completed|paused`);
invoices (`paid|unpaid`, effective `overdue` derived from due date vs `ZP_TODAY`);
requests (`submitted|reviewing|converted|rejected`); tasks
(`todo|in-progress|blocked|in-review|done`); accounts
(`requested|shared|configured|rotate-requested`).

## 5. Non-functional requirements

- NFR-1: 100% static — runs from any file server; no build step, no dependencies.
- NFR-2: Offline-first; all state in `localStorage`, survives reloads.
- NFR-3: Deterministic demo clock: `ZP_TODAY` is fixed (`2026-09-05`); swap to `new Date()`
  for production-like behavior.
- NFR-4: Responsive layout (single-column collapse ≤768 px); print path exists for
  invoices via `window.print()` but has no print stylesheet.
- NFR-5 (not met): no real security — plaintext demo passwords, client-side role checks
  only, no input sanitization (stored XSS possible via any text field rendered with
  `innerHTML`).

## 6. Normalization & consolidation recommendations

Ranked by value/effort. (Details in chat summary.)

1. Delete dead root layer: root `login.html` + dead `app.js` upload/camera/HTR code +
   ~250 lines of unused CSS in root `style.css` (leftover from Inktogrid removal).
2. Generate the sidebar/topbar from `nav.js` instead of copy-pasting the shell into
   7 portal pages (customer sidebar is byte-identical ×5); single `SHELL` config per role.
3. Centralize modal open/close/overlay wiring (today re-implemented per page).
4. Single status-presentation source: merge `ZP_STATUS_LABEL` (data.js) with the
   `zpBadge` tone map (nav.js); single `STATUSES` registry with label + tone.
5. Single taxonomy: requests/services carry both `category` and `serviceCategoryId`;
   derive one from the other via `ZP_SERVICE_CATEGORIES`.
6. Extract shared renderers: `priceLabel`, invoice-row, service-card, stat-tile, kv-list
   (duplicated between dashboard/services/invoices/software/agency).
7. Central `newId(prefix)` helper (today: `Date.now().toString().slice(-6)` scattered
   across request/agency/services/software — collision-prone, mixed prefixes).
8. Central `money`/`date` formatting already exists — extend to the quote modal and
   catalogue editor, which hand-roll currency strings; single `CURRENCY='USD'` constant.
9. Split `data.js` seed from logic (`seed.js` vs `store.js`); catalogue tools JSON could
   live in its own file; remove `hostingProviders` backward-compat shim in
   `catalogue.js` once callers migrate.
10. Harden data access: guard `s.stack` (services.js assumes array), `t.checklist`
    (team.js assumes array), `inv.items` (invoices.js assumes array) — one malformed
    record breaks a whole page.
11. Security path to production: move auth + storage server-side; at minimum escape all
    interpolated strings (or adopt a tiny `esc()` helper) to close stored-XSS; add
    `print.css` so invoice printing outputs only the invoice.
12. Fix small inconsistencies: catalogue sidebar hardcodes "Team Workspace" for agency
    users (JS patches it — render server-side/right-first-time instead); agency
    catalogue nav link misses active-highlight; `q_suggestedPrice` is informational only
    (document that price must be re-typed).
