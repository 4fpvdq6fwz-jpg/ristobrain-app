import { pool } from './db';
import fs from 'fs';
import path from 'path';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');

    // Check if tables exist already
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

      // Load seed data
      console.log('🌱 Loading demo data...');
      const seedPath = path.join(__dirname, 'db', 'seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedSql);
        console.log('✅ Demo data loaded');
        console.log('   📧 Login: chef@demo.it / demo1234');
      }
    } else {
      console.log('✅ Database already initialized, skipping migrations');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
