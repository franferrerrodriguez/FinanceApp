/**
 * Disable email confirmation on the hosted Supabase project.
 *
 * Create a token: https://supabase.com/dashboard/account/tokens
 *
 *   SUPABASE_ACCESS_TOKEN='sbp_...' npm run auth:no-email-confirm
 */

import { resolveSupabaseProjectRef } from './lib/resolve-supabase-project.mjs';

const PROJECT_REF = resolveSupabaseProjectRef();
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token?.trim()) {
  console.error(
    'Missing SUPABASE_ACCESS_TOKEN.\n' +
      '1. https://supabase.com/dashboard/account/tokens → Generate new token\n' +
      '2. SUPABASE_ACCESS_TOKEN="sbp_..." npm run auth:no-email-confirm\n\n' +
      'Or in the dashboard: Authentication → Providers → Email → disable "Confirm email".\n' +
      `   https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers`,
  );
  process.exit(1);
}

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;

const res = await fetch(url, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token.trim()}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    mailer_autoconfirm: true,
  }),
});

const text = await res.text();
let body;
try {
  body = text ? JSON.parse(text) : null;
} catch {
  body = text;
}

if (!res.ok) {
  console.error(`Error ${res.status}:`, body ?? text);
  process.exit(1);
}

console.log('Done: email confirmation disabled (mailer_autoconfirm=true).');
console.log('After sign-up you should be able to sign in without checking email.');
console.log(
  `Verify in dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/providers`,
);
