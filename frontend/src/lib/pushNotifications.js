import { supabase, supabaseConfigured } from './supabase';
import { isPushSupported } from './platform';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushConfigured() {
  return Boolean(VAPID_PUBLIC_KEY);
}

export function getPushPermissionState() {
  if (!isPushSupported() || !isPushConfigured()) return 'unsupported';
  return Notification.permission;
}

export async function hasActivePushSubscription() {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}

export async function subscribeToPush(userId) {
  if (!isPushSupported() || !isPushConfigured() || !supabaseConfigured || !supabase) {
    console.warn('Push no disponible');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      subscription: JSON.stringify(subscription.toJSON()),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('Error guardando subscription:', error);
    return null;
  }

  return subscription;
}

export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch {
    // ignore
  }

  if (supabaseConfigured && supabase && userId) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);
    if (error) console.error('Error eliminando subscription:', error);
  }
}
