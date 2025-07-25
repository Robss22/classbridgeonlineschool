#!/usr/bin/env node
/**
 * cleanup-users.js
 *
 * Safely delete users from both Supabase Auth and the 'users' table.
 *
 * Usage:
 *   1. Set environment variables in .env or your shell:
 *      SUPABASE_URL=... (project URL)
 *      SUPABASE_SERVICE_ROLE_KEY=... (Service Role key)
 *   2. Prepare a file with emails to delete, one per line (e.g., emails.txt)
 *   3. Run:
 *      node scripts/cleanup-users.js emails.txt [--force] [--no-dry-run]
 *
 * Options:
 *   --force       Skip confirmation prompts
 *   --no-dry-run  Actually perform deletions (default is dry-run)
 *
 * This script will:
 *   - For each email, find the user in Supabase Auth and the 'users' table
 *   - Show what would be deleted (dry-run)
 *   - Prompt for confirmation (unless --force)
 *   - Delete from Auth, then from the 'users' table
 */

const fs = require('fs');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

async function main() {
  const [,, emailFile, ...args] = process.argv;
  if (!emailFile) {
    console.error('Usage: node scripts/cleanup-users.js emails.txt [--force] [--no-dry-run]');
    process.exit(1);
  }
  const force = args.includes('--force');
  const dryRun = !args.includes('--no-dry-run');

  const emails = fs.readFileSync(emailFile, 'utf-8').split(/\r?\n/).map(e => e.trim()).filter(Boolean);
  if (emails.length === 0) {
    console.error('No emails found in file.');
    process.exit(1);
  }

  console.log(`Loaded ${emails.length} emails. Dry run: ${dryRun ? 'ON' : 'OFF'}`);

  for (const email of emails) {
    console.log(`\n---\nProcessing: ${email}`);
    // Find user in Auth
    const { data: usersList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      continue;
    }
    const authUser = usersList.users.find(u => u.email === email);
    if (!authUser) {
      console.warn('Not found in Supabase Auth.');
    } else {
      console.log(`Found in Auth: id=${authUser.id}`);
    }
    // Find user in users table
    const { data: dbUser, error: dbError } = await supabase.from('users').select('*').eq('email', email).single();
    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Error querying users table:', dbError);
      continue;
    }
    if (!dbUser) {
      console.warn('Not found in users table.');
    } else {
      console.log(`Found in users table: id=${dbUser.id}`);
    }
    if (!authUser && !dbUser) {
      console.log('Nothing to delete.');
      continue;
    }
    if (dryRun) {
      console.log('[Dry run] Would delete:', email);
      continue;
    }
    if (!force) {
      const ans = await prompt(`Delete ${email}? (y/N): `);
      if (ans.toLowerCase() !== 'y') {
        console.log('Skipped.');
        continue;
      }
    }
    // Delete from Auth
    if (authUser) {
      const { error: delAuthErr } = await supabase.auth.admin.deleteUser(authUser.id);
      if (delAuthErr) {
        console.error('Error deleting from Auth:', delAuthErr);
      } else {
        console.log('Deleted from Auth.');
      }
    }
    // Delete from users table
    if (dbUser) {
      const { error: delDbErr } = await supabase.from('users').delete().eq('id', dbUser.id);
      if (delDbErr) {
        console.error('Error deleting from users table:', delDbErr);
      } else {
        console.log('Deleted from users table.');
      }
    }
  }
  console.log('\nDone.');
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); }); 