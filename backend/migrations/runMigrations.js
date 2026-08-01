const fs = require("fs");
const path = require("path");
const db = require("../config/db");
require("dotenv").config();

const migrationsDir = path.join(__dirname, ".");
const appliedMigrationsTable = "applied_migrations";

/**
 * Ensures the applied_migrations tracking table exists
 */
async function ensureMigrationsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS ${appliedMigrationsTable} (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log(`✓ Migrations table '${appliedMigrationsTable}' is ready.`);
  } catch (error) {
    console.error("Error creating migrations table:", error);
    throw error;
  }
}

/**
 * Retrieves all already-applied migration names
 */
async function getAppliedMigrations() {
  try {
    const { rows } = await db.query(
      `SELECT migration_name FROM ${appliedMigrationsTable} ORDER BY applied_at ASC;`,
    );
    return rows.map((row) => row.migration_name);
  } catch (error) {
    console.error("Error fetching applied migrations:", error);
    throw error;
  }
}

/**
 * Runs all pending migrations in lexicographic order
 */
async function runMigrations() {
  try {
    console.log("🔄 Starting migration process...\n");

    // Step 1: Ensure migrations tracking table
    await ensureMigrationsTable();

    // Step 2: Get list of applied migrations
    const applied = await getAppliedMigrations();
    console.log(`Already applied: ${applied.length} migration(s)\n`);

    // Step 3: Find all .sql files in migrations directory
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("ℹ No migration files found.");
      return;
    }

    // Step 4: Run pending migrations in order
    let appliedCount = 0;
    for (const file of files) {
      if (applied.includes(file)) {
        console.log(`⏭  Skipping (already applied): ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        console.log(`🚀 Running: ${file}`);
        await db.query(sql);
        await db.query(
          `INSERT INTO ${appliedMigrationsTable} (migration_name) VALUES ($1);`,
          [file],
        );
        console.log(`✓ Completed: ${file}\n`);
        appliedCount++;
      } catch (error) {
        console.error(`✗ Failed: ${file}`);
        console.error(`Error: ${error.message}\n`);
        // Continue or stop? For safety, continue and report at end
      }
    }

    console.log(
      `✅ Migration run complete. Applied: ${appliedCount} new migration(s).`,
    );
  } catch (error) {
    console.error("Fatal migration error:", error);
    process.exit(1);
  }
}

// Run if invoked directly
if (require.main === module) {
  runMigrations().then(() => {
    console.log("\n🎉 Migrations finished. Exiting.");
    process.exit(0);
  });
}

module.exports = { runMigrations };
