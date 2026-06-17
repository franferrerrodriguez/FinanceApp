/**
 * Maps Supabase Auth errors to i18n keys (auth.errors.*).
 * @param {{ code?: string, message?: string } | string | null | undefined} error
 */
export function mapAuthErrorToKey(error) {
  const code =
    typeof error === 'string' ? '' : String(error?.code ?? '').toLowerCase();
  const message =
    typeof error === 'string'
      ? error
      : String(error?.message ?? error?.code ?? '');
  const m = message.toLowerCase();

  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('fetch')) {
    return 'networkError';
  }

  if (
    code === 'over_email_send_rate_limit' ||
    m.includes('email rate limit exceeded')
  ) {
    return 'emailSendRateLimit';
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'alreadyRegistered';
  }
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'invalidCredentials';
  }
  if (m.includes('email not confirmed') || m.includes('email_not_confirmed')) {
    return 'emailNotConfirmed';
  }
  if (
    code.includes('weak') ||
    code === 'password_too_short' ||
    (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('at least')))
  ) {
    return 'weakPassword';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'rateLimit';
  }

  return 'generic';
}
