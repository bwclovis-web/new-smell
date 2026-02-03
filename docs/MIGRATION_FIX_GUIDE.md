# Database Migration Fix Guide

## Issues Identified

1. **Schema Mismatch**: Remote database missing `updatedAt` columns
2. **Foreign Key Errors**: UserPerfumeComments referencing non-existent UserPerfumes
3. **Missing Data**: 333 perfumes not migrated (46,421 local vs 46,088 remote)

## Solution Steps

### Step 1: Update Remote Schema

The remote database schema is out of sync. Push the current schema:

```bash
# 1. Backup your .env file
cp .env .env.backup

# 2. Edit .env and temporarily change DATABASE_URL
# Change: DATABASE_URL="your-local-db-url"
# To:     DATABASE_URL="your-REMOTE_DATABASE_URL-value"

# 3. Push schema to remote database
npx prisma db push

# You should see something like:
# ✔ Generated Prisma Client
# 🚀 Your database is now in sync with your Prisma schema.

# 4. Restore local DATABASE_URL
cp .env.backup .env
# OR manually edit .env and change DATABASE_URL back
```

### Step 2: Verify Schema Push

```bash
# Connect to remote database to verify
# (still using REMOTE_DATABASE_URL in .env)
npx prisma studio

# Check that UserPerfume table has updatedAt column
# Then restore your local DATABASE_URL
```

### Step 3: Re-run Migration

```bash
# Make sure DATABASE_URL is back to local database
# Run the migration again
node scripts/migrate-to-accelerate-fixed.js --full

# This will:
# - Retry all UserPerfume records (now updatedAt exists)
# - Skip existing records (using upsert)
# - Migrate the 333 missing perfumes
```

### Step 4: Fix Comment Foreign Key Issues

```bash
# Run the comment fix script
node scripts/migrate-fix-comments.js

# This will:
# - Check each comment's userPerfumeId exists in remote
# - Skip comments with missing references
# - Migrate valid comments
```

### Step 5: Verify Migration

```bash
# Check counts match
psql $REMOTE_DATABASE_URL -c "SELECT COUNT(*) FROM \"Perfume\";"
# Should show 46,421

psql $REMOTE_DATABASE_URL -c "SELECT COUNT(*) FROM \"UserPerfume\";"
# Should match local count

psql $REMOTE_DATABASE_URL -c "SELECT COUNT(*) FROM \"UserPerfumeComment\";"
# Should match local count (or be close if some references are truly invalid)
```

## Common Issues

### Issue: "MigrationState table does not exist"

**Solution**: You need to push the schema first (see Step 1)

### Issue: "Foreign key constraint violated"

**Causes**:
1. Referenced record doesn't exist yet
2. Referenced record failed to migrate
3. Order of migration is wrong

**Solution**:
- The migration script already handles order correctly
- Use the fix script to retry failed records
- Check logs to see which records failed and why

### Issue: "updatedAt does not exist"

**Solution**: Complete Step 1 to push schema to remote

### Issue: Perfume count still doesn't match

**Possible causes**:
1. Some perfumes failed during migration (check errors in logs)
2. Some perfumes have invalid perfumeHouseId references
3. Slug conflicts (two perfumes with same slug)

**Solution**:
```bash
# Check for errors in last migration
node scripts/migrate-to-accelerate-fixed.js --full 2>&1 | tee migration.log

# Search for errors
grep "Error migrating" migration.log

# Fix individual perfumes if needed
```

## Prevention

### Before Future Migrations

1. **Always push schema first**:
   ```bash
   # Set DATABASE_URL to remote
   npx prisma db push
   # Restore DATABASE_URL to local
   ```

2. **Run in dry-run mode first**:
   ```bash
   node scripts/migrate-to-accelerate-fixed.js --dry-run
   ```

3. **Backup remote database**:
   ```bash
   pg_dump $REMOTE_DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

### Schema Changes Workflow

1. Make changes to `prisma/schema.prisma`
2. Run `npx prisma generate` locally
3. Test locally
4. Push to remote:
   ```bash
   # Temporarily use REMOTE_DATABASE_URL
   npx prisma db push
   ```
5. Run migrations
6. Restore local DATABASE_URL

## Quick Reference

### Environment Variables

```bash
# Local PostgreSQL
LOCAL_DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Remote (Prisma Accelerate)
REMOTE_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."

# Current active connection (used by Prisma CLI)
DATABASE_URL="..." # Should normally be local
```

### Migration Commands

```bash
# Dry run (see what would happen)
node scripts/migrate-to-accelerate-fixed.js --dry-run

# Full migration (ignore state, migrate everything)
node scripts/migrate-to-accelerate-fixed.js --full

# Incremental (only new/updated records)
node scripts/migrate-to-accelerate-fixed.js

# With custom batch size
node scripts/migrate-to-accelerate-fixed.js --batch-size=50

# Fix comments
node scripts/migrate-fix-comments.js
```

## Troubleshooting

### Check Schema Differences

```bash
# View local schema
npx prisma db pull --schema=prisma/schema.local.prisma

# Compare with your schema.prisma
diff prisma/schema.prisma prisma/schema.local.prisma
```

### Direct Database Queries

```bash
# Local database
psql $LOCAL_DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='UserPerfume';"

# Remote database  
psql $REMOTE_DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='UserPerfume';"
```

### Check Migration State

```bash
# See what was last migrated
psql $REMOTE_DATABASE_URL -c "SELECT * FROM \"MigrationState\";"
```

## Next Steps After Migration

1. ✅ Verify all counts match
2. ✅ Test critical user flows on staging
3. ✅ Monitor for errors
4. ✅ Update DNS/environment variables
5. ✅ Keep local database as backup for 30 days
