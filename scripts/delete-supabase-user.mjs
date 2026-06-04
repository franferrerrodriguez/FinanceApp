/**
 * Delete a user by email (auth + public data).
 * Usage: SUPABASE_DB_PASSWORD='...' node scripts/delete-supabase-user.mjs user@example.com
 */
import pg from 'pg';

const email = process.argv[2]?.trim().toLowerCase();
const password = process.env.SUPABASE_DB_PASSWORD;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'ceduxgxizgkyiexkdyqp';

if (!email) {
  console.error('Usage: SUPABASE_DB_PASSWORD=... node scripts/delete-supabase-user.mjs <email>');
  process.exit(1);
}
if (!password) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const { rows } = await client.query(
    `SELECT id, email FROM auth.users WHERE lower(email) = $1`,
    [email],
  );

  if (!rows.length) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  const userId = rows[0].id;
  console.log(`Deleting user ${rows[0].email} (${userId})…`);

  await client.query('DELETE FROM monthly_snapshots WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM assets WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM liabilities WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM profiles WHERE id = $1', [userId]);
  await client.query('DELETE FROM auth.users WHERE id = $1', [userId]);

  console.log('User and associated data deleted.');
}

main()
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  })
  .finally(() => client.end());
