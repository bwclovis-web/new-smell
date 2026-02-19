# How-To Guide

Step-by-step instructions for common tasks in the New Smell application. For project overview and setup, see [README.md](./README.md). For full documentation, see [docs/README.md](./docs/README.md).

---

## Table of Contents

1. [Syncing with External Databases](#1-syncing-with-external-databases)
2. [Backing Up and Restoring the Database](#2-backing-up-and-restoring-the-database)
3. [Cleaning Up Notes](#3-cleaning-up-notes)
4. [Importing Data from CSV](#4-importing-data-from-csv)
5. [Development and Running the App](#5-development-and-running-the-app)
6. [Environment and Prerequisites](#6-environment-and-prerequisites)

---

## 1. Syncing with External Databases

### Pull production data to your local database

Use this when you want your local database to match production (e.g. for testing with real data). **This clears and replaces** the same tables in your local DB.

**Prerequisites:** In `.env`:

- `REMOTE_DATABASE_URL` — production database URL (e.g. Prisma Accelerate or direct Postgres)
- `LOCAL_DATABASE_URL` or `DATABASE_URL` — your local database URL

**Steps:**

1. **(Recommended)** Create a local backup first:
   ```bash
   npm run db:backup
   ```

2. Pull production into local:
   ```bash
   npm run db:pull:production
   ```

Tables copied: User, PerfumeHouse, Perfume, UserPerfume, UserPerfumeRating, UserPerfumeReview, UserPerfumeWishlist, UserPerfumeComment, PerfumeNotes, WishlistNotification, SecurityAuditLog.

---

### Push local database to a remote database

Use this to push your local schema and data to a remote database (e.g. staging or a new environment).

**Steps:**

1. Run the CLI script with the remote database URL:
   ```bash
   npm run db:push:remote:cli "postgresql://user:password@host:5432/database_name"
   ```

2. Optional: keep the app configured to use the remote DB after the push:
   ```bash
   npm run db:push:remote:cli "postgresql://user:password@host:5432/database_name" --keep-remote
   ```

The script will back up your local DB, switch to the remote URL, push schema and data, then (unless `--keep-remote`) restore your local `.env` and Prisma config.

---

## 2. Backing Up and Restoring the Database

### Create a backup (Prisma-based, recommended)

No PostgreSQL client tools required. Backups are written to the `backups/` directory.

```bash
npm run db:backup
```

This creates timestamped files in `backups/`, including:

- `backup_<timestamp>_data.json` — full data export
- `backup_<timestamp>_data.sql` — SQL INSERT statements
- `backup_<timestamp>_manifest.json` — metadata

A recent backup manifest in `backups/` is **required** before running note-cleaning apply commands (see [Cleaning Up Notes](#3-cleaning-up-notes)).

### List available backups

```bash
npm run db:restore:list
```

### Restore from a backup

```bash
# Restore the latest backup
npm run db:restore

# Restore a specific backup (use the timestamp prefix from the backup filename)
npm run db:restore backup_2024-01-15T10-30-00

# Restore and clear existing data first
npm run db:restore --clear
```

More details: [backups/README.md](./backups/README.md).

---

## 3. Cleaning Up Notes

The app can clean perfume notes with rule-based logic and optional AI extraction. **Always run a dry-run and review reports before applying changes.** Apply commands require a recent backup in `backups/`.

### Quick reference

| Command | What it does | Writes to DB? |
|--------|----------------|---------------|
| `npm run clean:notes:complete` | Dry-run: JS rules + AI analysis + report | No |
| `npm run clean:notes:complete:apply` | Apply JS rules only; AI recommendations in report | Yes (JS only) |
| `npm run clean:notes:complete:full` | Apply JS rules + AI recommendations + re-check duplicates | Yes (all) |

Full command details: [scripts/COMMANDS-REFERENCE.md](./scripts/COMMANDS-REFERENCE.md).

### Recommended workflow: full cleanup (dry-run then apply)

1. **Preview all changes (dry-run):**
   ```bash
   npm run clean:notes:complete
   ```

2. **Review the report:**
   - Open `reports/complete-note-cleaning-<timestamp>.md`
   - Optionally check `reports/clean-notes-dry-run-<timestamp>.md` and `reports/ai-note-extraction-<timestamp>.md` if generated

3. **Back up the database:**
   ```bash
   npm run db:backup
   ```

4. **Apply everything (JS rules + AI + duplicate re-check):**
   ```bash
   npm run clean:notes:complete:full
   ```

### AI extraction setup (for full or AI-based cleanup)

If you use the full workflow or AI extraction, set up the Python environment once:

```bash
npm run clean:notes:ai:setup
```

Then in `.env`:

- `OPENAI_API_KEY=your_key`
- Optional: `OPENAI_MODEL=gpt-4o-mini` (or `gpt-4o` for higher quality)

Details: [scripts/README-AI-EXTRACTION.md](./scripts/README-AI-EXTRACTION.md).

### Apply only JavaScript rules (no AI)

If you want to apply rule-based cleaning only and handle AI recommendations manually:

```bash
npm run clean:notes:complete:apply
```

Then review `reports/ai-note-extraction-<timestamp>.md` and, if desired, apply AI recommendations with:

```bash
node scripts/apply-ai-recommendations.js reports/ai-note-extraction-<timestamp>.json --dry-run   # preview
node scripts/apply-ai-recommendations.js reports/ai-note-extraction-<timestamp>.json            # apply (after backup)
```

---

## 4. Importing Data from CSV

### Generic CSV import

Import perfumes from a CSV file. The script matches existing notes (case-insensitive), creates new notes when needed, and merges duplicates by house.

```bash
npm run import:csv <filename.csv> [--dir=<directory>]
```

**Examples:**

```bash
npm run import:csv perfumes_aromakaz.csv --dir=csv
npm run import:csv perfumes_kyse.csv --dir=csv_noir
npm run import:csv perfumes_custom.csv --dir=../data/csv
```

`--dir` defaults to `../csv` if omitted.

### CSV Noir import

For the `csv_noir` directory and format:

```bash
npm run import:csv-noir <filename.csv>
# e.g. npm run import:csv-noir perfumes_kyse.csv
```

CSV format and options: [docs/CSV_IMPORT_GUIDE.md](./docs/CSV_IMPORT_GUIDE.md). Noir-specific notes: [csv_noir/README.md](./csv_noir/README.md).

---

## 5. Development and Running the App

### Install dependencies

```bash
npm install
```

### Environment

Copy `.env.example` to `.env` and set at least `DATABASE_URL`. For sync and backups you may also set `REMOTE_DATABASE_URL`, `LOCAL_DATABASE_URL`, and `OPENAI_API_KEY` (see above).

### Generate Prisma client

```bash
npm run db:generate
```

### Push schema to the database

```bash
npm run db:push
```

### Run the app

```bash
npm run dev
```

Runs the server and can open the app in the browser (e.g. http://localhost:2112).

### Other useful commands

- **Prisma Studio (DB UI):** `npm run db:studio`
- **Lint:** `npm run lint`
- **Type check:** `npm run typecheck`
- **Tests:** `npm run test` or `npm run test:run`
- **Build:** `npm run build`

---

## 6. Environment and Prerequisites

- **Node.js** — see `package.json` engines if specified
- **PostgreSQL** — for the database (local or remote URLs in `.env`)
- **Python 3.10+** — only if you use AI note extraction (e.g. `clean:notes:complete` with AI or `clean:notes:complete:full`)

Optional:

- **OpenAI API key** — for AI note extraction (`OPENAI_API_KEY` in `.env`)
- **PostgreSQL client tools** (`pg_dump`, `pg_restore`) — only for `npm run db:backup:pg` and `npm run db:restore:pg`; Prisma-based backup/restore does not require them

---

## See Also

- [README.md](./README.md) — project overview and quick start
- [docs/README.md](./docs/README.md) — full documentation index
- [scripts/COMMANDS-REFERENCE.md](./scripts/COMMANDS-REFERENCE.md) — note-cleaning command reference
- [scripts/README-AI-EXTRACTION.md](./scripts/README-AI-EXTRACTION.md) — AI note extraction workflow
- [backups/README.md](./backups/README.md) — backup and restore details
- [docs/CSV_IMPORT_GUIDE.md](./docs/CSV_IMPORT_GUIDE.md) — CSV import format and behavior
