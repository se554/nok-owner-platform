#!/usr/bin/env node
/**
 * NOK Owner Platform — Migration Runner
 *
 * Executes all SQL migration files against the Supabase database.
 * Requires SUPABASE_DB_URL environment variable:
 *   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
 *
 * Usage:
 *   SUPABASE_DB_URL="postgresql://..." node scripts/run-migrations.mjs
 *
 * Or set it in .env.local and run:
 *   node -r dotenv/config scripts/run-migrations.mjs dotenv_config_path=.env.local
 */

import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Load .env.local manually ─────────────────────────────────
const envPath = join(ROOT, '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    if (key && !process.env[key]) {
      process.env[key] = rest.join('=')
    }
  }
} catch {}

// ─── Config ───────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DB_URL = process.env.SUPABASE_DB_URL  // optional: direct postgres URL

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ─── Read migration files ──────────────────────────────────────
const migrationsDir = join(ROOT, 'supabase', 'migrations')
const files = readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort()

console.log(`\n📦 NOK Owner Platform — Migrations\n`)
console.log(`Found ${files.length} migration files:\n`)
files.forEach(f => console.log(`  • ${f}`))

// ─── Execute via Supabase REST (needs exec_sql function) ───────
// Alternative: use direct DB connection with pg library
// To use pg: npm install pg && set SUPABASE_DB_URL

async function executeSqlViaRpc(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error)
  }
  return response.json()
}

// ─── Main ──────────────────────────────────────────────────────
console.log(`\n⚠️  MANUAL STEP REQUIRED\n`)
console.log(`The Supabase REST API doesn't support raw SQL execution.`)
console.log(`Please run each migration file in the Supabase SQL Editor:\n`)
console.log(`  🔗 https://supabase.com/dashboard/project/eamizgmbgdohdxooxbvy/editor\n`)
console.log(`Run in order:`)
files.forEach((f, i) => {
  const content = readFileSync(join(migrationsDir, f), 'utf8')
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`[${i + 1}/${files.length}] ${f}`)
  console.log(`${'─'.repeat(60)}`)
  // Show first line of each file as description
  const firstComment = content.match(/-- (.+)/)?.[1] || ''
  console.log(`    ${firstComment}`)
})

console.log(`\n${'─'.repeat(60)}`)
console.log(`\n✅ All migration files are in: supabase/migrations/\n`)
