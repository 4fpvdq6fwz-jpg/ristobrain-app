import { pool } from './db';
import fs from 'fs';
import path from 'path';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');

    const res = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'users'
    `);

    const tablesExist = parseInt(res.rows[0].count) > 0;

    if (!tablesExist) {
      console.log('📦 Creating database schema...');
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schemaSql);
      console.log('✅ Schema created successfully');
    } else {
      console.log('✅ Database already initialized, running incremental migrations...');
    }

    // Incremental migrations — always run (idempotent)
    await client.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`);
    await client.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`);
    await client.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT`);
    await client.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_sub ON workspaces (stripe_subscription_id)`);
    console.log('✅ Stripe billing columns ready');

    await client.query(`CREATE TABLE IF NOT EXISTS ai_knowledge_base (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'manual',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES users(id)
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ai_kb_workspace ON ai_knowledge_base (workspace_id)`);
    console.log('✅ AI knowledge base table ready');

    // Anti-sharing: versione sessione per invalidare i token a ogni nuovo login
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0`);
    console.log('✅ Session version column ready');

    // Allergeni (Allergeni & HACCP) e scorte di magazzino
    await client.query(`ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}'`);
    await client.query(`ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS stock_qty NUMERIC DEFAULT 0`);
    await client.query(`ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 0`);
    console.log('✅ Allergens & stock columns ready');

    // Numero di cellulare in registrazione
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`);
    console.log('✅ User phone column ready');

    // Always ensure demo account exists (ON CONFLICT DO NOTHING = safe to re-run)
    const seedPath = path.join(__dirname, 'db', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      await client.query(seedSql);
      console.log('✅ Demo data ensured (chef@demo.it / demo1234)');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
