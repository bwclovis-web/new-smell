# Database Restore Guide

This guide explains how to restore your database on a **fresh PC** after a system wipe, when you have **no database structure** set up.

---

## Before Wiping Your PC

### 1. Create a Full Backup (Recommended)

Run the PostgreSQL backup to create a complete dump with schema and data:

```bash
npm run db:backup:pg
```

This creates:
- `backup_TIMESTAMP_full.sql` — Complete schema + data (includes `CREATE DATABASE`)
- `backup_TIMESTAMP_schema.sql` — Schema only
- `backup_TIMESTAMP_data.sql` — Data only
- `backup_TIMESTAMP_custom.dump` — Custom format (fastest restore)

### 2. Or Create a Prisma Backup (Fallback)

If you don't have PostgreSQL client tools installed:

```bash
npm run db:backup
```

Creates JSON + SQL files. **Note:** Schema must exist before restore — use Prisma migrations first.

### 3. Save Your Backups Off-Device

The `backups/` folder is gitignored. Copy it to:
- Cloud storage (Google Drive, OneDrive, Dropbox)
- USB drive
- Another computer

### 4. Save Your `.env` File

Or at minimum note your `DATABASE_URL` so you can recreate `.env` on the new machine.

---

## On the New PC — Prerequisites

1. **Node.js** — Install from [nodejs.org](https://nodejs.org)
2. **PostgreSQL** — Install server + client tools (`psql`, `pg_restore`)
3. **PostgreSQL running** — Ensure the service is started (default `postgres` database must exist)

---

## Restore Methods

### Option A: Full Restore from `db:backup:pg` (No Existing Structure)

Use this when you have a `*_full.sql` or `*_custom.dump` backup and no database exists.

**For `full.sql` (plain SQL):**

Connect to the default `postgres` database (not `new_scent` — the backup script creates it):

```powershell
# Windows (PowerShell or CMD)
set PGPASSWORD=Toaster69
psql -U postgres -h localhost -p 5432 -d postgres -f "C:\path\to\new-smell\backups\backup_TIMESTAMP_full.sql"
```

```bash
# Linux/Mac
PGPASSWORD=Toaster69 psql -U postgres -h localhost -p 5432 -d postgres -f backups/backup_TIMESTAMP_full.sql
```

**For `custom.dump` (faster):**

```powershell
# Windows
set PGPASSWORD=Toaster69
pg_restore -U postgres -h localhost -p 5432 -d postgres --create -C backups/backup_TIMESTAMP_custom.dump
```

```bash
# Linux/Mac
PGPASSWORD=Toaster69 pg_restore -U postgres -h localhost -p 5432 -d postgres --create -C backups/backup_TIMESTAMP_custom.dump
```

**Important:** Use `-d postgres` (the default database). The backup script drops `new_scent`, recreates it, and switches to it internally.

---

### Option B: Prisma Migrations + Prisma Restore

Use this if you only have Prisma backups (`*_manifest.json` + `*_data.json`).

1. Install PostgreSQL and ensure it is running.
2. Create the database:
   ```bash
   createdb -U postgres -h localhost new_scent
   ```
   Or in `psql`:
   ```sql
   CREATE DATABASE new_scent;
   ```
3. Restore your `.env` with `DATABASE_URL="postgresql://postgres:Toaster69@localhost:5432/new_scent"`.
4. Clone the repo and install:
   ```bash
   git clone <your-repo-url> new-smell
   cd new-smell
   npm install
   ```
5. Apply migrations and generate Prisma client:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```
6. Copy your `backups/` folder back into the project.
7. Restore data:
   ```bash
   npm run db:restore
   ```

---

## Checklist Summary

| Before Wipe | After Wipe |
|-------------|------------|
| Run `npm run db:backup:pg` | Install Node.js |
| Copy `backups/` to cloud/USB | Install PostgreSQL (with client tools) |
| Save your `.env` | Clone repo and restore `backups/` folder |
| | Restore DB (Option A or B above) |
| | Run `npx prisma generate` |
| | Run `npm run dev` |

---

## Quick Reference — Restore Commands

```bash
# List available backups
npm run db:restore:list
npm run db:restore:pg:list

# Restore latest (Prisma) — requires schema to exist
npm run db:restore

# Restore specific backup (Prisma)
npm run db:restore backup_2026-02-12T01-37-52

# Restore with clear (clears existing data first)
npm run db:restore --clear

# Restore using PostgreSQL tools (requires pg_restore/psql)
npm run db:restore:pg
```

---

## Troubleshooting

- **"Database does not exist"** — Connect to `postgres` when restoring a full backup that creates the database.
- **"relation does not exist"** — Schema is missing. Run `npx prisma migrate deploy` before Prisma restore.
- **Permission denied** — Ensure PostgreSQL user has rights to create databases when using `--create`.
