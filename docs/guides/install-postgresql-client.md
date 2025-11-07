# Installing PostgreSQL Client Tools on Windows

This guide will help you install PostgreSQL client tools (`pg_dump`, `psql`, etc.) on Windows, which are required for the `npm run db:backup:pg` command.

## Option 1: Install Full PostgreSQL (Recommended)

1. **Download PostgreSQL**:
   - Visit: https://www.postgresql.org/download/windows/
   - Download the PostgreSQL installer (usually 15.x or 16.x)

2. **Run the Installer**:
   - Select installation directory (default: `C:\Program Files\PostgreSQL\16`)
   - Choose components: Make sure "Command Line Tools" is selected
   - Set a password for the `postgres` superuser (remember this!)
   - Port: 5432 (default)

3. **Add to PATH**:
   - After installation, add PostgreSQL `bin` directory to your PATH:
     - `C:\Program Files\PostgreSQL\16\bin`
   - Or restart your terminal after installation

4. **Verify Installation**:
   ```bash
   pg_dump --version
   psql --version
   ```

## Option 2: Install Only Client Tools (Lightweight)

1. **Download PostgreSQL Binaries**:
   - Visit: https://www.enterprisedb.com/download-postgresql-binaries
   - Download the Windows x86-64 binaries ZIP

2. **Extract and Setup**:
   - Extract to a folder (e.g., `C:\PostgreSQL\bin`)
   - Add to PATH: `C:\PostgreSQL\bin`

3. **Verify Installation**:
   ```bash
   pg_dump --version
   ```

## Option 3: Use Chocolatey (Package Manager)

If you have Chocolatey installed:

```bash
choco install postgresql --params '/Password:YourPasswordHere'
```

Or for client tools only:

```bash
choco install postgresql-tools
```

## Option 4: Use WSL (Windows Subsystem for Linux)

If you're using WSL:

```bash
sudo apt update
sudo apt install postgresql-client
```

Then use from WSL terminal.

## Verification

After installation, test the backup command:

```bash
npm run db:backup:pg
```

## Troubleshooting

**Issue**: `pg_dump: command not found`
- **Solution**: Make sure PostgreSQL `bin` directory is in your PATH
- Restart your terminal after adding to PATH

**Issue**: Authentication failed
- **Solution**: Check your `.env` file `DATABASE_URL` matches your PostgreSQL credentials
- Format: `postgresql://username:password@localhost:5432/database_name`

**Issue**: Connection refused
- **Solution**: Make sure PostgreSQL service is running
- Windows: Check Services app for "postgresql-x64-16" service

## Alternative: Use Prisma Backup

If you don't want to install PostgreSQL tools, you can use the Prisma-based backup instead:

```bash
npm run db:backup
```

This doesn't require `pg_dump` but uses Prisma to export data.



