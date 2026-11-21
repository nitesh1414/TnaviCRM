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

Open http://localhost:5173. Vite proxies `/api` and `/uploads` to the API on port 5000.

Demo accounts: `admin@tnavicrm.com` / `admin123`, `manager@tnavicrm.com` / `manager123`, and `employee@tnavicrm.com` / `employee123`. The seed command leaves existing data unchanged. Local data is stored in `backend/data/db.json` and uploaded files in `backend/uploads/` (both excluded from Git).

## Scope and limitations

This is a **prototype, not production-ready software**. The API currently uses a local JSON file, not MySQL. `backend/schema.sql` is a starting schema only; there is no MySQL adapter or migration. Do not set `DB_DRIVER=mysql` expecting persistence to MySQL. Role enforcement is limited (user administration is admin-only; other modules do not yet enforce full role-based permissions). Files are served publicly by URL, so do not upload sensitive documents. The default secret and demo credentials are insecure. Before deployment, implement proper access controls, protected file storage, validation, secure authentication, backups, concurrency-safe persistence and security testing.

Matching is a simple heuristic; recording interest creates an enquiry and does not send anything externally. Smart reminders are calculated when viewed, not scheduled or delivered automatically. Email and WhatsApp integrations, full document and proposal workflows, complete history/audit, and daily/weekly calendar views are not implemented. The monthly calendar currently shows only the current page of meeting results. CSV exports and CRUD operations are available as a starting point.
