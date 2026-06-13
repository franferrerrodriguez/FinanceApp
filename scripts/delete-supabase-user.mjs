/**
 * Delete a user by email (auth + public data via CASCADE).
 * Usage: SUPABASE_DB_PASSWORD='...' npm run db:delete-user -- user@example.com
 */
import {
  connectSupabasePg,
  formatConnectionLabel,
} from './lib/supabase-pg.mjs';

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error(
    'Usage: SUPABASE_DB_PASSWORD=... npm run db:delete-user -- <email>',
  );
  process.exit(1);
}
if (!process.env.SUPABASE_DB_PASSWORD) {
  console.error('Missing SUPABASE_DB_PASSWORD');
  process.exit(1);
}

async function main() {
  const client = await connectSupabasePg();
  console.log(`Connected → ${formatConnectionLabel(client)}`);

  const { rows } = await client.query(
    `SELECT id, email FROM auth.users WHERE lower(email) = $1`,
    [email],
  );

  if (!rows.length) {
    console.log(`No user found with email: ${email}`);
    await client.end();
    return;
  }

  const userId = rows[0].id;
  console.log(`Deleting user ${rows[0].email} (${userId})…`);

  await client.query('DELETE FROM auth.users WHERE id = $1', [userId]);

  console.log('User and associated data deleted.');
  await client.end();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
