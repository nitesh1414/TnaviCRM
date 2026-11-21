# TnaviCRM

A starter/demo for commercial property leasing and brand relationship management. It includes a React/Vite interface and Express API with seeded examples for properties, brands, enquiries, meetings, communications, proposals, leases, documents, tasks, reports and reminders.

## Run locally

Requires Node.js 20 or later. From the repository root, in separate terminals:

```sh
cd backend
npm install
npm run seed
npm start
```

```sh
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the API on port 5000. Documents must be downloaded through the authenticated API.

Demo accounts: `admin@tnavicrm.com` / `admin123`, `manager@tnavicrm.com` / `manager123`, and `employee@tnavicrm.com` / `employee123`. The seed command leaves existing data unchanged. Local data is stored in `backend/data/db.json` and uploaded files in `backend/uploads/` (both excluded from Git).

## Scope and limitations

This is a **prototype, not production-ready software**. The API can use a local JSON file or the MySQL JSON-record store described below. Admins and managers have organization-wide access. Employees can access records assigned to them or created by them; documents and leases are also visible when linked to their assigned property or brand. Viewers have organization-wide read-only access to core records. Only managers/admins can delete; settings and user administration are admin-only. This is a single-company policy, not tenant isolation or configurable per-user ACLs. The default JWT secret and demo credentials are insecure. Before deployment, use secure credentials, backups and independent security testing.

Matching is a simple heuristic; recording interest creates an enquiry and does not send anything externally. In-app smart reminders are calculated when viewed. Property and brand records include linked activity timelines, and the calendar has day, week and month views. Documents support upload, metadata editing, authenticated download and deletion. Proposals support counter-offers, revision snapshots, approval requests, manager/admin decisions with notes, and print-to-PDF. Generic record changes are written to an activity log with before/after details; this log is not tamper-proof and is not a substitute for an external immutable audit system. CSV exports and CRUD operations are available as a starting point.

## Company settings and outbound messaging

An admin can edit company details, the shared SMTP sender, the Meta WhatsApp Cloud API phone number ID and access token, and reusable email templates under **Settings**. Blank password/token fields retain the existing values; check the clear box to remove one. Settings are shared by all staff and secrets are not returned by the API. New credentials are encrypted with AES-256-GCM before storage. Set `SETTINGS_ENCRYPTION_KEY` to a stable 64-character hex key in `backend/.env` before saving credentials (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Keep the key separately from data and back it up securely: changing or losing it makes existing credentials unreadable. Legacy plaintext credentials remain readable until settings are saved with a key; back up and then securely remove old plaintext backups. The business number shown in settings is informational; the configured Meta phone number ID determines the actual sender.

Use **Send to Client** to select a client, property and optionally a meeting, apply an email template, edit the subject/body, and attach uploaded documents/photos linked to that property. Include video links in the message text. Email is sent through the configured SMTP server. WhatsApp uses Meta's Cloud API: free-form text is subject to the 24-hour customer service window, while business-initiated messages generally require an approved Meta template and customer opt-in. Template mode supports text body parameters, not media headers or buttons. A provider's acceptance is not a delivery confirmation. Successful sends are recorded in Communications.

From Send to Client, staff can schedule an email or approved-template WhatsApp reminder after confirming recipient consent. The server checks the queue every minute; it must be running. Linked reminders are cancelled when their meeting is cancelled, completed, deleted, its date has passed, or its title/date/time/venue changes after scheduling. Date-past checks use UTC. The worker records provider acceptance, not delivery confirmation. To avoid duplicate messages after timeouts or crashes, failed/uncertain attempts are marked Needs review and are **not retried**; check the provider before rescheduling. Run only one API/worker process against the JSON store; multi-process locking, retry queues, delivery status webhooks, and provider setup are not implemented. Real delivery requires working provider credentials and connectivity; no real provider delivery was tested here.

Run the integration tests with `cd backend && node --test test/*.test.js`. The local JSON store is intended for one server process only; atomic writes do not provide multi-process concurrency or replace backups.

## MySQL persistence

The default remains JSON. For MySQL 8, create the database first, then set `DB_DRIVER=mysql`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD` and `MYSQL_DATABASE` in `backend/.env`. From `backend`, run `npm run setup:mysql` to create the required tables without deleting existing data. Your MySQL user needs `CREATE TABLE` privileges. The script uses `backend/mysql-store.sql`; the older `schema.sql` is illustrative and does not create these tables. For local development, `docker compose up -d mysql` initializes them on a new volume.

After setup, **choose one**: run `npm run seed` for a new demo database, or import existing JSON data as described below. Do not seed before importing: the importer refuses a non-empty destination. Both the seed and server load `backend/.env` when run from `backend`. Earlier versions of the seed command did not load `.env` and may have seeded `backend/data/db.json` instead of MySQL. The server fails at startup if it cannot query the MySQL tables.

To migrate a JSON store: stop the API and worker, back up the JSON file and uploads, initialize an **empty** MySQL store, configure the connection and run `cd backend && npm run import:mysql -- --confirm-empty`. The import runs in a transaction and refuses a non-empty destination. Uploaded files stay on the filesystem and must be copied/backed up separately. Preserve `SETTINGS_ENCRYPTION_KEY` when migrating encrypted SMTP/WhatsApp secrets. Do not run the import concurrently with another importer or API.

The adapter uses MySQL JSON records, not the illustrative relational tables, and does not enforce relational foreign keys. It currently bridges the existing synchronous repository through a worker thread: requests block while queries complete and a single query result is limited to 16 MB. This is a functional migration path, not a high-throughput production architecture. Run only one API process and one reminder worker: approval/history updates are not yet safe against concurrent writers across processes. For an isolated MySQL database initialized with `mysql-store.sql`, run `MYSQL_TEST=1 npm test` from `backend` with the connection environment variables set. MySQL integration was not exercised in this sandbox because no MySQL server is available.
