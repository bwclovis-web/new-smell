# How to Push Schema to Remote Database

## ⚠️ CRITICAL: Do This BEFORE Running Migration

Your migration is failing because the remote database schema doesn't have the `updatedAt` column yet.

## Step-by-Step Instructions

### 1. Check Your Current .env

Open `.env` file and look for these lines:

```env
# Local database (for development)
LOCAL_DATABASE_URL="postgresql://..."

# Remote database (Prisma Accelerate)
REMOTE_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."

# Current active connection (what Prisma uses)
DATABASE_URL="postgresql://..."  # Should be your local database
```

### 2. Backup Your .env

```bash
# Windows
copy .env .env.backup

# OR create a backup manually
```

### 3. Update DATABASE_URL Temporarily

Edit `.env` and **temporarily** change the `DATABASE_URL`:

**BEFORE:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
REMOTE_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."
```

**AFTER:**
```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."
REMOTE_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."
```

**Copy the REMOTE_DATABASE_URL value into DATABASE_URL**

### 4. Push the Schema

```bash
npx prisma db push
```

**Expected output:**
```
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "..."

🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

**If you see errors:**
- Check that REMOTE_DATABASE_URL is correct
- Check that you have internet connection
- Check that the database is accessible

### 5. Restore Your .env

**IMPORTANT:** Change `DATABASE_URL` back to your local database!

Edit `.env` and restore:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"
REMOTE_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."
```

**OR use your backup:**
```bash
copy .env.backup .env
```

### 6. Verify Schema Was Pushed

Run the check script:

```bash
node scripts/check-migration-status.js
```

Look for:
```
🔍 Checking Remote Schema...
   ✅ Remote schema has updatedAt column
```

If you see ❌ instead, the schema push failed. Repeat steps 3-5.

### 7. Now Run Migration

```bash
# Full migration (all records)
node scripts/migrate-to-accelerate-fixed.js --full

# OR incremental (only new/changed records)
node scripts/migrate-to-accelerate-fixed.js
```

## Common Mistakes

### ❌ Mistake 1: Forgot to Change DATABASE_URL

```env
# WRONG - DATABASE_URL still pointing to local
DATABASE_URL="postgresql://localhost:5432/mydb"
REMOTE_DATABASE_URL="prisma+postgres://accelerate..."
```

When you run `npx prisma db push`, it pushes to **DATABASE_URL**, not REMOTE_DATABASE_URL.

**Fix:** Copy REMOTE_DATABASE_URL value into DATABASE_URL temporarily.

### ❌ Mistake 2: Forgot to Restore DATABASE_URL

```env
# WRONG - DATABASE_URL now pointing to remote permanently
DATABASE_URL="prisma+postgres://accelerate..."  # Should be local!
```

This will make your local development use the remote database, which you don't want.

**Fix:** Change DATABASE_URL back to your local PostgreSQL URL.

### ❌ Mistake 3: Using Wrong URL Format

```env
# WRONG - Missing prisma+ prefix for Accelerate
DATABASE_URL="postgres://accelerate.prisma-data.net/..."

# RIGHT - Must have prisma+ prefix
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."
```

**Fix:** Make sure REMOTE_DATABASE_URL starts with `prisma+postgres://`

## Verification Checklist

Before running migration again:

- [ ] ✅ Ran `npx prisma db push` with DATABASE_URL pointing to remote
- [ ] ✅ Saw "Your database is now in sync" message
- [ ] ✅ Restored DATABASE_URL to local database
- [ ] ✅ Ran `node scripts/check-migration-status.js`
- [ ] ✅ Saw "Remote schema has updatedAt column"
- [ ] ✅ Now ready to run migration!

## Quick Commands

```bash
# 1. Check current status
node scripts/check-migration-status.js

# 2. If updatedAt missing:
#    - Edit .env (DATABASE_URL = REMOTE_DATABASE_URL)
#    - Run: npx prisma db push
#    - Edit .env (DATABASE_URL = local database)

# 3. Run migration
node scripts/migrate-to-accelerate-fixed.js --full

# 4. Verify
node scripts/check-migration-status.js
```

## Still Having Issues?

If you're still seeing "updatedAt does not exist" errors:

1. Double-check `.env` file - is DATABASE_URL back to local?
2. Run `node scripts/check-migration-status.js` again
3. Look for "Remote schema has updatedAt column"
4. If still missing, repeat schema push (steps 3-5)

## Need Help?

Run this diagnostic:

```bash
# See what DATABASE_URL is currently set to
cat .env | grep DATABASE_URL

# Check if schema push worked
node scripts/check-migration-status.js
```
