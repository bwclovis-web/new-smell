# Cursor Instruction: Importing New Perfume CSV Data

- Prefer dedicated import scripts (see `scripts/import-*.ts`) instead of `npx prisma db seed` when adding perfumes from CSVs.
- Follow the established pattern (`scripts/import-imaginary-authors.ts`) when creating a new importer:
  - Reuse `calculateDataCompleteness` to keep the richest record per house.
  - Reuse existing perfume notes; only create a note if `prisma.perfumeNotes.findUnique` returns `null`.
  - Append `- {House Name}` to perfume names that collide across different houses.
- After dropping a CSV in `csv/`, add a matching script (for example, `scripts/import-poesie-perfume-and-tea.ts`) and run it with `npx tsx scripts/<script-name>.ts`.
- Keep importers idempotent: re-running should update missing fields and notes without creating duplicates.
- Document new importer scripts and execution steps in PR descriptions so future agents know which command to run.

