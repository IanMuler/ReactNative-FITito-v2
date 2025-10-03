const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_SF4pCWsTEm9Z@ep-orange-breeze-ads4cf0o.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function test() {
  try {
    console.log('Testing connection...');
    const result = await pool.query('SELECT current_database(), current_user, version()');
    console.log('✓ Connection successful!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Version:', result.rows[0].version.substring(0, 60) + '...');
    
    console.log('\nListing tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('✓ Tables found:', tables.rows.length);
    tables.rows.forEach(row => console.log('  -', row.table_name));
    
    if (tables.rows.find(r => r.table_name === 'exercises')) {
      console.log('\nChecking exercises table...');
      const exercises = await pool.query('SELECT COUNT(*) as count FROM exercises');
      console.log('✓ Exercises count:', exercises.rows[0].count);
      
      const sample = await pool.query('SELECT id, name FROM exercises LIMIT 3');
      console.log('Sample exercises:');
      sample.rows.forEach(e => console.log('  -', e.id, e.name));
    }
    
    if (tables.rows.find(r => r.table_name === 'user_profiles')) {
      console.log('\nChecking user_profiles table...');
      const profiles = await pool.query('SELECT id, name FROM user_profiles LIMIT 5');
      console.log('✓ Profiles found:', profiles.rows.length);
      profiles.rows.forEach(p => console.log('  -', p.id, p.name));
    }
    
    await pool.end();
    console.log('\n✓ Test completed successfully!');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

test();
