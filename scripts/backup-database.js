#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates comprehensive backups of the PostgreSQL database including schema and data
 */

import { execSync } from "child_process"
import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, "..")

// Load environment variables
import dotenv from "dotenv"
dotenv.config({ path: join(projectRoot, ".env") })

// Configuration
const BACKUP_DIR = join(projectRoot, "backups")
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
const BACKUP_PREFIX = `backup_${TIMESTAMP}`

// Ensure backup directory exists
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true })
}

// Parse database URL
function parseDatabaseUrl(url) {
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  const urlObj = new URL(url)
  return {
    host: urlObj.hostname,
    port: urlObj.port || "5432",
    database: urlObj.pathname.slice(1),
    username: urlObj.username,
    password: urlObj.password,
  }
}

// Create backup filename
function createBackupFilename(type, extension = "sql") {
  return join(BACKUP_DIR, `${BACKUP_PREFIX}_${type}.${extension}`)
}

// Execute pg_dump command
function executePgDump(dbConfig, options, outputFile) {
  const env = { ...process.env, PGPASSWORD: dbConfig.password }

  const command = [
    "pg_dump",
    `--host=${dbConfig.host}`,
    `--port=${dbConfig.port}`,
    `--username=${dbConfig.username}`,
    `--dbname=${dbConfig.database}`,
    ...options,
    "--no-password",
    "--verbose",
  ].join(" ")

  console.log(`Executing: ${command.replace(dbConfig.password, "***")}`)

  try {
    execSync(command, {
      env,
      stdio: "pipe",
      cwd: projectRoot,
    })

    // Write to file
    writeFileSync(outputFile, execSync(command, { env, stdio: "pipe" }))
    console.log(`✅ Backup created: ${outputFile}`)
  } catch (error) {
    console.error(`❌ Error creating backup: ${error.message}`)
    throw error
  }
}

// Main backup function
async function createBackup() {
  try {
    console.log("🚀 Starting database backup...")
    console.log(`📅 Timestamp: ${TIMESTAMP}`)
    console.log(`📁 Backup directory: ${BACKUP_DIR}`)

    const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL)
    console.log(
      `🗄️  Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`
    )

    // 1. Full backup (schema + data)
    console.log("\n📦 Creating full backup (schema + data)...")
    const fullBackupFile = createBackupFilename("full")
    executePgDump(
      dbConfig,
      [
        "--format=plain",
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists",
        "--create",
      ],
      fullBackupFile
    )

    // 2. Schema-only backup
    console.log("\n🏗️  Creating schema-only backup...")
    const schemaBackupFile = createBackupFilename("schema")
    executePgDump(
      dbConfig,
      [
        "--format=plain",
        "--schema-only",
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists",
        "--create",
      ],
      schemaBackupFile
    )

    // 3. Data-only backup
    console.log("\n📊 Creating data-only backup...")
    const dataBackupFile = createBackupFilename("data")
    executePgDump(
      dbConfig,
      ["--format=plain", "--data-only", "--no-owner", "--no-privileges"],
      dataBackupFile
    )

    // 4. Custom format backup (for faster restore)
    console.log("\n⚡ Creating custom format backup...")
    const customBackupFile = createBackupFilename("custom", "dump")
    executePgDump(
      dbConfig,
      [
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists",
        "--create",
      ],
      customBackupFile
    )

    // 5. Create backup manifest
    const manifest = {
      timestamp: TIMESTAMP,
      database: dbConfig.database,
      host: dbConfig.host,
      port: dbConfig.port,
      files: {
        full: `${BACKUP_PREFIX}_full.sql`,
        schema: `${BACKUP_PREFIX}_schema.sql`,
        data: `${BACKUP_PREFIX}_data.sql`,
        custom: `${BACKUP_PREFIX}_custom.dump`,
      },
      sizes: {},
    }

    // Calculate file sizes
    const fs = await import("fs")
    for (const [type, filename] of Object.entries(manifest.files)) {
      const filePath = join(BACKUP_DIR, filename)
      if (existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        manifest.sizes[type] = {
          bytes: stats.size,
          human: formatBytes(stats.size),
        }
      }
    }

    const manifestFile = join(BACKUP_DIR, `${BACKUP_PREFIX}_manifest.json`)
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2))
    console.log(`📋 Manifest created: ${manifestFile}`)

    console.log("\n✅ Database backup completed successfully!")
    console.log(`📁 All backups saved to: ${BACKUP_DIR}`)
    console.log("\n📊 Backup Summary:")
    for (const [type, size] of Object.entries(manifest.sizes)) {
      console.log(`  ${type}: ${size.human}`)
    }
  } catch (error) {
    console.error("\n❌ Backup failed:", error.message)
    process.exit(1)
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 Bytes"
  }
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createBackup()
}

export { createBackup, formatBytes, parseDatabaseUrl }
