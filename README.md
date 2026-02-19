# New Smell

A perfume/fragrance web application built with React Router, Prisma, and PostgreSQL.

## Quick Start

```bash
npm install
cp .env.example .env   # edit .env with your DATABASE_URL
npm run db:generate
npm run db:push
npm run dev
```

The app runs at http://localhost:2112 (or the port shown in the terminal).

## Documentation

- **[How-To Guide](./HOW-TO.md)** — Step-by-step instructions for:
  - Syncing with external databases (pull production, push local to remote)
  - Backing up and restoring the database
  - Cleaning up perfume notes (dry-run, apply, AI extraction)
  - Importing data from CSV
  - Development and environment setup

- **[Documentation](./docs/README.md)** — Full docs: guides, error handling, roadmap, CSV import, and more.

## Key Commands

| Task | Command |
|------|---------|
| Run app | `npm run dev` |
| Backup DB | `npm run db:backup` |
| Pull production → local | `npm run db:pull:production` |
| Clean notes (preview) | `npm run clean:notes:complete` |
| Import CSV | `npm run import:csv <file.csv> [--dir=<dir>]` |
| DB UI | `npm run db:studio` |

See [HOW-TO.md](./HOW-TO.md) for details and safety steps (e.g. backup before apply).

## Tech Stack

- **Frontend:** React 19, React Router 7, Tailwind CSS
- **Backend:** Node, Express, Prisma
- **Database:** PostgreSQL

## License

Private project.
