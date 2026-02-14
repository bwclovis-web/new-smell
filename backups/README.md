# Database Backup System

This directory contains automated database backups for the New Smell application.

## Overview

The backup system creates comprehensive PostgreSQL database backups using two methods:

### Prisma-based Backups (Recommended)

- **JSON backup**: Complete data export in JSON format
- **SQL backup**: Data export as SQL INSERT statements
- **Works without PostgreSQL client tools**

### PostgreSQL Client Backups (Advanced)

- **Full backup**: Complete schema and data
- **Schema-only backup**: Database structure only
- **Data-only backup**: Data without schema
- **Custom format backup**: Optimized for fast restore
- **Requires PostgreSQL client tools installed**

## Usage

### Creating a Backup

```bash
# Create a backup using Prisma (recommended)
npm run db:backup

# Create a backup using PostgreSQL tools (requires pg_dump)
npm run db:backup:pg

# Or run directly
node scripts/backup-database-prisma.js
node scripts/backup-database.js
```

### Pull production to local

Copy production data into your local database in one step (no manual backup/restore):

```bash
# Requires in .env: REMOTE_DATABASE_URL (production), LOCAL_DATABASE_URL (or DATABASE_URL)
npm run db:pull:production
```

This **clears and replaces** the same tables in your local DB. Backup locally first if needed: `npm run db:backup`.

### Restoring from Backup

```bash
# List available backups
npm run db:restore:list

# Restore latest backup using Prisma (recommended)
npm run db:restore

# Restore specific backup using Prisma
npm run db:restore backup_2024-01-15T10-30-00

# Restore with clean option (clears existing data)
npm run db:restore --clear

# Restore using PostgreSQL tools (requires pg_restore)
npm run db:restore:pg
npm run db:restore:pg:list
```

## Backup Files

### Prisma-based Backups

- `backup_TIMESTAMP_data.json` - Complete data in JSON format
- `backup_TIMESTAMP_data.sql` - Data as SQL INSERT statements
- `backup_TIMESTAMP_manifest.json` - Backup metadata

### PostgreSQL Client Backups

- `backup_TIMESTAMP_full.sql` - Complete database dump
- `backup_TIMESTAMP_schema.sql` - Schema only
- `backup_TIMESTAMP_data.sql` - Data only
- `backup_TIMESTAMP_custom.dump` - Custom format (fastest restore)
- `backup_TIMESTAMP_manifest.json` - Backup metadata

## File Structure

```
backups/
├── .gitkeep                    # Keeps directory in git
├── README.md                   # This file
├── backup_2024-01-15T10-30-00_full.sql
├── backup_2024-01-15T10-30-00_schema.sql
├── backup_2024-01-15T10-30-00_data.sql
├── backup_2024-01-15T10-30-00_custom.dump
└── backup_2024-01-15T10-30-00_manifest.json
```

## Requirements

- PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`)
- Node.js environment with access to `DATABASE_URL`
- Sufficient disk space for backup files

## Security Notes

- Backup files contain sensitive data and are excluded from git
- Ensure proper file permissions on backup directory
- Consider encrypting backups for production use
- Store backups in secure, off-site locations

## Troubleshooting

### Common Issues

1. **Permission denied**: Ensure PostgreSQL user has necessary privileges
2. **Connection failed**: Verify `DATABASE_URL` is correct
3. **Disk space**: Monitor available space for large databases
4. **Lock conflicts**: Stop application during restore to avoid conflicts

### Manual Restore

If the restore script fails, you can restore manually:

```bash
# For SQL files
psql -h localhost -U username -d database_name < backup_file.sql

# For custom dump files
pg_restore -h localhost -U username -d database_name backup_file.dump
```

## Automation

Consider setting up automated backups:

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * cd /path/to/project && npm run db:backup
```

## Backup Retention

The system doesn't automatically clean old backups. Implement your own retention policy:

```bash
# Keep only last 7 days of backups
find backups/ -name "backup_*.sql" -mtime +7 -delete
```
