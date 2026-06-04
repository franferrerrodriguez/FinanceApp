/** Initials for avatar (1–2 letters). */
export function getInitials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Display name: onboarding profile → email → i18n fallback. */
export function getDisplayName({ profile, user, fallback }) {
  const fromProfile = profile?.name?.trim();
  if (fromProfile) return fromProfile;
  const email = user?.email?.trim();
  if (email) {
    const local = email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return fallback;
}
