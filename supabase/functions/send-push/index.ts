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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { user_id, title, body, url } = await req.json();

  if (!user_id || !title) {
    return new Response('Missing user_id or title', { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', user_id)
    .single();

  if (error || !data) {
    return new Response('No subscription found', { status: 404 });
  }

  const subscription = JSON.parse(data.subscription);
  const payload = JSON.stringify({
    title,
    body: body ?? '',
    url: url ?? '/',
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return new Response('OK', { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(message, { status: 500 });
  }
});
