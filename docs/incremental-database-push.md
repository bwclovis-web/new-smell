# Incremental Database Push

This document describes how to push data from your local PostgreSQL database to a remote database (Prisma Accelerate) using the incremental migration script. After the first full push, subsequent runs migrate only records that have been created or updated since the last migration.

---

## Overview

- **Script**: `scripts/migrate-to-accelerate-fixed.js`
- **Source**: Local PostgreSQL (e.g. `localhost:5432/new_scent`)
- **Destination**: Remote Prisma Accelerate database
- **Behavior**: First run migrates all data; later runs migrate only new or updated records.

---

## Prerequisites

1. **Environment variables** in a `.env` file at the project root:
   - `LOCAL_DATABASE_URL` – local PostgreSQL connection string
   - `REMOTE_DATABASE_URL` – Prisma Accelerate (or remote) connection string
   - `DATABASE_URL` – used by the app (usually local for development)

   Copy from `scripts/env.example` and fill in your values.

2. **Schema in sync**  
   The remote database must have the same schema as your Prisma schema, including:
   - `updatedAt` on tables that are migrated
   - The `MigrationState` model (used to track last migration time per table)

3. **Dependencies**  
   Ensure `dotenv` is installed (used by the script to load `.env`).

---

## Usage

### Basic (incremental)

```bash
node scripts/migrate-to-accelerate-fixed.js
```

Uses migration state in the remote DB to migrate only records created or updated since the last run.

### Dry run (no writes)

```bash
node scripts/migrate-to-accelerate-fixed.js --dry-run
```

Shows what would be migrated without writing to the remote database.

### Full migration (ignore state)

```bash
node scripts/migrate-to-accelerate-fixed.js --full
```

Migrates all records for all tables, then updates migration state. Use for a full re-sync or after fixing state.

### Custom batch size

```bash
node scripts/migrate-to-accelerate-fixed.js --batch-size=50
```

Processes records in batches of 50 (default is 100). Useful if you hit timeouts or memory limits.

### Help

```bash
node scripts/migrate-to-accelerate-fixed.js --help
```

---

## Setup (first time)

1. **Add `updatedAt` and `MigrationState` to schema**  
   Already done in `prisma/schema.prisma`:
   - `updatedAt` on: `UserPerfume`, `UserPerfumeWishlist`, `PerfumeNotes`, `PerfumeNoteRelation`, `WishlistNotification`
   - Model: `MigrationState` (tableName, lastMigratedAt, recordCount, etc.)

2. **Apply schema to local DB**
   ```bash
   npx prisma migrate dev --name add-updated-at-and-migration-state
   ```

3. **Apply schema to remote DB**
   - Point `DATABASE_URL` at the remote DB (e.g. in `.env` or a one-off env var).
   - Run:
   ```bash
   npx prisma db push
   ```
   - Restore `DATABASE_URL` to local if needed.

4. **Create `.env`**  
   Ensure `LOCAL_DATABASE_URL` and `REMOTE_DATABASE_URL` are set (see `scripts/env.example`).

5. **Test with dry run**
   ```bash
   node scripts/migrate-to-accelerate-fixed.js --dry-run
   ```

6. **Run first full migration**
   ```bash
   node scripts/migrate-to-accelerate-fixed.js
   ```
   Or explicitly: `node scripts/migrate-to-accelerate-fixed.js --full`.

---

## How incremental migration works

1. **Migration state**  
   The remote database has a `MigrationState` table. For each migrated table it stores:
   - `tableName`
   - `lastMigratedAt` – timestamp used as the “since” cutoff
   - `recordCount` (optional, for reporting)

2. **Per-table logic**  
   For each table the script:
   - Reads `lastMigratedAt` for that table from `MigrationState`.
   - Queries local DB for rows where `createdAt > lastMigratedAt` OR `updatedAt > lastMigratedAt`.
   - Upserts those rows into the remote DB (create or update by id).
   - Updates `MigrationState` for that table with the current run’s timestamp and count.

3. **Order of tables**  
   Tables are migrated in dependency order (e.g. Users → PerfumeHouses → Perfumes → …) so foreign keys are satisfied.

4. **First run**  
   If there is no row in `MigrationState` for a table, the script treats it as “no previous migration” and migrates all rows for that table, then writes state.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Migration fails mid-way | State is updated only after a table finishes; re-run to continue. |
| Schema out of sync | Run `npx prisma db push` (or migrations) against remote before migrating. |
| Large datasets / timeouts | Use `--batch-size=50` (or smaller). |
| Credentials in code | Use `.env` only; script reads `LOCAL_DATABASE_URL` and `REMOTE_DATABASE_URL`. |
| Testing without changing remote | Use `--dry-run` first. |

---

## Files involved

- **Script**: `scripts/migrate-to-accelerate-fixed.js` – migration and CLI (dry-run, batch-size, full).
- **Schema**: `prisma/schema.prisma` – `updatedAt` fields and `MigrationState` model.
- **Env template**: `scripts/env.example` – example `LOCAL_DATABASE_URL`, `REMOTE_DATABASE_URL`, `DATABASE_URL`.

---

## Troubleshooting

- **"MigrationState table does not exist"**  
  Run `npx prisma db push` against the remote DB so the schema (including `MigrationState`) exists.

- **"LOCAL_DATABASE_URL / REMOTE_DATABASE_URL not set"**  
  Create a `.env` in the project root with those variables (see `scripts/env.example`).

- **Duplicate or constraint errors**  
  The script uses upsert by id; if you still see conflicts, check that ids match between local and remote and that schema (unique constraints, FKs) matches.

- **Missing parent rows (e.g. perfume house)**  
  Run a full sync once: `node scripts/migrate-to-accelerate-fixed.js --full`, then use incremental runs.

For more detail on the migration flow and table order, see the comments and function names in `scripts/migrate-to-accelerate-fixed.js`.
