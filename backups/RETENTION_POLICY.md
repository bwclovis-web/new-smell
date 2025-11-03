# Backup Retention Policy

**Last Updated**: 2025-11-03

## Current Status

After migration cleanup (Phase 9.3), backups have been archived as follows:

### Retained Backups (Active)
- **Production Backup**: `backup_2025-11-03T12-52-12`
  - Created: November 3, 2025 (Phase 8.1)
  - Purpose: Production deployment backup
  - Status: Active (retained in backups/)
  
- **Key Migration Backup**: `backup_2025-11-03T12-26-05`
  - Created: November 3, 2025
  - Purpose: Contains full dataset (56,532 records)
  - Status: Active (retained in backups/)

### Archived Backups
All pre-migration and redundant migration day backups have been moved to:
`backups/archived/`

**Archive Contents:**
- Pre-migration backups (October 4, October 13, November 2)
- Redundant migration day backups (November 3, except key backups)

## Retention Policy

### Active Backups
- **Production backups**: Retain last 30 days
- **Migration day backups**: Retain key backups indefinitely
- **Daily backups**: Retain last 7 days

### Archive Policy
- Pre-migration backups: Archived but retained for historical reference
- Old backups: Archive after 30 days, delete after 1 year

### Restoration
To restore from archived backup:
```bash
# Move backup from archive to active directory
mv backups/archived/backup_TIMESTAMP_* backups/

# Restore using standard restore command
npm run db:restore backup_TIMESTAMP
```

## Disk Space

**Total backup size**: ~376 MB
**Archived**: ~276.81 MB
**Active**: ~99.19 MB

## Maintenance

Review and clean archived backups quarterly:
- Check archive size
- Delete backups older than 1 year
- Verify retention policy is still appropriate
