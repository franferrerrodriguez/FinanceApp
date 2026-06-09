import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL')!;

webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC,
  VAPID_PRIVATE,
);

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const REMINDER = {
  title: '📅 Cierra tu mes en FinanciaApp',
  body: 'Actualiza tus saldos para ver cómo ha evolucionado tu patrimonio',
  url: '/balance?tab=patrimony',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { data: rows, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('user_id, subscription');

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const payload = JSON.stringify(REMINDER);
  let sent = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    try {
      const subscription = JSON.parse(row.subscription);
      await webpush.sendNotification(subscription, payload);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return Response.json({ sent, failed, total: rows?.length ?? 0 });
});
