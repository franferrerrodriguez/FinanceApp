export const PROFILE_MIN_AGE = 18;
export const PROFILE_MAX_AGE = 99;

/** Calculates completed years from a YYYY-MM-DD birth date string. */
export function computeAgeFromBirthDate(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Returns YYYY-MM-DD string for the date N years ago from today. */
export function dateYearsAgo(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export function parseProfileAge(value) {
  const n = parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n < PROFILE_MIN_AGE || n > PROFILE_MAX_AGE) {
    return null;
  }
  return n;
}

export const PROFILE_AGE_ERROR_KEYS = {
  required: 'onboarding.welcome.ageErrorRequired',
  tooYoung: 'onboarding.welcome.ageErrorTooYoung',
  tooOld: 'onboarding.welcome.ageErrorTooOld',
  invalid: 'onboarding.welcome.ageErrorInvalid',
};

export function getProfileAgeErrorKey(ageValue) {
  const trimmed = String(ageValue ?? '').trim();
  if (!trimmed) return 'required';

  const n = parseInt(trimmed, 10);
  if (!Number.isFinite(n)) return 'invalid';
  if (n < PROFILE_MIN_AGE) return 'tooYoung';
  if (n > PROFILE_MAX_AGE) return 'tooOld';
  return null;
}

export function validateProfileForm({ name, age }) {
  const trimmedName = String(name ?? '').trim();
  const ageErrorKey = getProfileAgeErrorKey(age);
  const parsedAge = parseProfileAge(age);

  return {
    valid: trimmedName.length > 0 && parsedAge != null,
    name: trimmedName,
    age: parsedAge,
    nameMissing: trimmedName.length === 0,
    ageErrorKey,
  };
}
