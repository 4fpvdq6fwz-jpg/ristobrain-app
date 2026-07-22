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

    // Verifica email e reset password
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`);
    console.log('✅ Email verification & password reset columns ready');

    // Motore Creatività Menu — campi ristorante per la generazione (additivi, non disruptivi)
    await client.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS formato TEXT`);
    await client.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS regione TEXT`);
    await client.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS ticket_target NUMERIC`);
    await client.query(`ALTER TABLE locations ADD COLUMN IF NOT EXISTS vincoli TEXT`);

    // Regole della casa (logica proprietaria del Chef)
    await client.query(`CREATE TABLE IF NOT EXISTS house_rules (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      contenuto TEXT NOT NULL,
      priorita INTEGER NOT NULL DEFAULT 1,
      attiva BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES users(id)
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_house_rules_ws ON house_rules (workspace_id)`);

    // Menu di riferimento (esempi reali per few-shot)
    await client.query(`CREATE TABLE IF NOT EXISTS reference_menus (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      cliente TEXT,
      formato TEXT,
      contenuto TEXT NOT NULL,
      attiva BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES users(id)
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reference_menus_ws ON reference_menus (workspace_id)`);

    // Log generazioni menu
    await client.query(`CREATE TABLE IF NOT EXISTS menu_generations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      restaurant_id UUID REFERENCES locations(id) ON DELETE SET NULL,
      brief_input JSONB,
      output JSONB,
      usato_web BOOLEAN NOT NULL DEFAULT FALSE,
      model TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by UUID REFERENCES users(id)
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_menu_generations_ws ON menu_generations (workspace_id)`);
    console.log('✅ Creative menu engine tables ready');

    // Referral / provvigioni segnalatori
    await client.query(`CREATE TABLE IF NOT EXISTS referral_codes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT UNIQUE NOT NULL,
      referrer_name TEXT NOT NULL,
      note TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 200,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await client.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS referral_code TEXT`);
    await client.query(`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS referral_at TIMESTAMPTZ`);
    await client.query(`CREATE TABLE IF NOT EXISTS referral_earnings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT NOT NULL,
      workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      amount_cents INTEGER NOT NULL DEFAULT 200,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (workspace_id, period)
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_referral_earnings_code ON referral_earnings (code)`);
    console.log('✅ Referral tables ready');

    // Allinea accanto@accantosas.com al piano Business (come il demo)
    await client.query(`UPDATE workspaces SET plan = 'business' WHERE id IN (
      SELECT wu.workspace_id FROM workspace_users wu JOIN users u ON u.id = wu.user_id
      WHERE LOWER(u.email) = 'accanto@accantosas.com'
    )`);
    console.log('✅ accanto@accantosas.com allineato a Business');

    // Referral v2: proprietario del codice + richieste codice
    await client.query(`ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL`);
    await client.query(`CREATE TABLE IF NOT EXISTS referral_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      email TEXT,
      full_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_referral_codes_owner ON referral_codes (owner_user_id)`);
    console.log('✅ Referral v2 (owner + requests) ready');

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
