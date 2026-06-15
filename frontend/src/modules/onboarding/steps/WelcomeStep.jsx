import { Compass, TrendingUp, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND_NAME } from '../../../lib/brand';
import {
  PROFILE_AGE_ERROR_KEYS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  computeAgeFromBirthDate,
  dateYearsAgo,
  validateProfileForm,
} from '../../../lib/profileValidation';
import { useProfile } from '../../../store/hooks';

const FEATURES = [
  { Icon: Zap,        label: 'Controla' },
  { Icon: TrendingUp, label: 'Acumula' },
  { Icon: Compass,    label: 'Proyecta' },
];

const CURRENT_YEAR = new Date().getFullYear();

// Date input bounds derived from profile age limits
const MAX_BIRTH_DATE = dateYearsAgo(PROFILE_MIN_AGE); // must be at least 18
const MIN_BIRTH_DATE = dateYearsAgo(PROFILE_MAX_AGE); // at most 99

function ChartIllustration() {
  return (
    <svg
      viewBox="0 0 340 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="wbar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1D9E75" stopOpacity="0.10" />
        </linearGradient>
        <linearGradient id="warea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1="12" y1="78"  x2="328" y2="78"  stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <line x1="12" y1="100" x2="328" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <line x1="12" y1="122" x2="328" y2="122" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Area under trend */}
      <polygon
        points="34,92 102,75 170,58 238,41 306,24 306,132 34,132"
        fill="url(#warea)"
      />

      {/* Bars */}
      <rect x="16"  y="92"  width="36" height="40"  rx="5" fill="url(#wbar)" />
      <rect x="84"  y="75"  width="36" height="57"  rx="5" fill="url(#wbar)" />
      <rect x="152" y="58"  width="36" height="74"  rx="5" fill="url(#wbar)" />
      <rect x="220" y="41"  width="36" height="91"  rx="5" fill="url(#wbar)" />
      <rect x="288" y="24"  width="36" height="108" rx="5" fill="url(#wbar)" />

      {/* Trend line */}
      <polyline
        points="34,92 102,75 170,58 238,41 306,24"
        stroke="#5DCAA5"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      <circle cx="34"  cy="92" r="3"   fill="#5DCAA5" stroke="#0A0F16" strokeWidth="1.5" />
      <circle cx="102" cy="75" r="3"   fill="#5DCAA5" stroke="#0A0F16" strokeWidth="1.5" />
      <circle cx="170" cy="58" r="3"   fill="#5DCAA5" stroke="#0A0F16" strokeWidth="1.5" />
      <circle cx="238" cy="41" r="3"   fill="#5DCAA5" stroke="#0A0F16" strokeWidth="1.5" />
      <circle cx="306" cy="24" r="5.5" fill="#1D9E75" stroke="#0A0F16" strokeWidth="2"   />

      {/* Year labels */}
      {[0, 1, 2, 3, 4].map((offset, i) => (
        <text
          key={offset}
          x={[34, 102, 170, 238, 306][i]}
          y="148"
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.30)"
          fontFamily="-apple-system,system-ui,sans-serif"
        >
          {CURRENT_YEAR + offset}
        </text>
      ))}

      {/* Badge: growth % */}
      <rect x="246" y="6"  width="58" height="18" rx="9"   fill="rgba(29,158,117,0.22)" stroke="rgba(29,158,117,0.45)" strokeWidth="0.5" />
      <text x="275" y="18.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1D9E75" fontFamily="-apple-system,system-ui,sans-serif">+38,4%</text>

      {/* Badge: value */}
      <rect x="148" y="38" width="78" height="17" rx="8.5" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
      <text x="187" y="50"   textAnchor="middle" fontSize="8.5" fontWeight="600" fill="rgba(255,255,255,0.75)" fontFamily="-apple-system,system-ui,sans-serif">572.847 €</text>
    </svg>
  );
}

export function WelcomeStep({ onNext }) {
  const { t } = useTranslation();
  const { profile, setProfile } = useProfile();

  const [name,      setName]      = useState(profile?.name      ?? '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? '');

  const [showErrors, setShowErrors] = useState(false);

  // Compute age from the chosen birth date for validation
  const computedAge = computeAgeFromBirthDate(birthDate);
  const ageStr      = computedAge != null ? String(computedAge) : '';

  const validation     = validateProfileForm({ name, age: ageStr });
  const showNameError  = showErrors && validation.nameMissing;
  const showBirthError =
    (showErrors && validation.ageErrorKey === 'required') ||
    (birthDate.trim().length > 0 && validation.ageErrorKey != null);

  const canContinue = validation.valid;

  const handleNext = () => {
    if (!canContinue) { setShowErrors(true); return; }
    setProfile({ ...profile, name: validation.name, age: validation.age, birthDate });
    onNext();
  };

  const inputBase =
    'w-full rounded-xl bg-[rgba(255,255,255,0.06)] px-4 py-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors';
  const borderNormal = '[border:0.5px_solid_rgba(255,255,255,0.10)]';
  const borderFocus  = 'focus:[border-color:var(--accent)]';
  const borderError  = '[border-color:var(--color-negative)]';

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="-mx-4 sm:-mx-6 bg-[#0A0F16] px-6 sm:px-9 pt-5 pb-8">
        <div className="mb-5 overflow-hidden rounded-2xl [border:0.5px_solid_rgba(255,255,255,0.08)]">
          <ChartIllustration />
        </div>

        <h2 className="mb-3 text-[1.875rem] font-bold leading-[1.2] tracking-tight text-white">
          {t('onboarding.welcome.title')}
        </h2>

        <p className="mb-6 leading-snug text-[rgba(197,208,220,0.80)]">
          {t('onboarding.welcome.subtitle')}
        </p>

        <div className="flex flex-wrap gap-2">
          {FEATURES.map(({ Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full bg-[rgba(29,158,117,0.14)] px-3 py-1.5 text-xs font-medium text-[#5DCAA5]"
            >
              <Icon size={12} aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────── */}
      <div
        className="-mx-4 sm:-mx-6 px-6 sm:px-9 pt-7 pb-8"
        style={{
          background:   'var(--bg-secondary)',
          borderRadius: '24px 24px 0 0',
          borderTop:    '0.5px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Name */}
        <div className="mb-5">
          <label
            htmlFor="onboarding-name"
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {t('onboarding.welcome.name')}
          </label>
          <input
            id="onboarding-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('onboarding.welcome.namePlaceholder')}
            autoComplete="given-name"
            className={`${inputBase} ${showNameError ? borderError : borderNormal} ${borderFocus}`}
          />
          {showNameError && (
            <p className="mt-1.5 text-xs text-[var(--color-negative)]">
              {t('onboarding.welcome.nameErrorRequired')}
            </p>
          )}
        </div>

        {/* Birth date */}
        <div className="mb-7">
          <label
            htmlFor="onboarding-birth-date"
            className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]"
          >
            {t('onboarding.welcome.birthDate')}
          </label>
          <input
            id="onboarding-birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            min={MIN_BIRTH_DATE}
            max={MAX_BIRTH_DATE}
            className={`${inputBase} ${showBirthError ? borderError : borderNormal} ${borderFocus}`}
          />
          {showBirthError && (
            <p className="mt-1.5 text-xs text-[var(--color-negative)]">
              {validation.ageErrorKey === 'required'
                ? t('onboarding.welcome.birthDateErrorRequired')
                : t(PROFILE_AGE_ERROR_KEYS[validation.ageErrorKey], {
                    min: PROFILE_MIN_AGE,
                    max: PROFILE_MAX_AGE,
                  })}
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!name.trim()}
          className="mb-7 w-full rounded-2xl bg-[var(--accent)] py-3.5 text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('common.start')} →
        </button>

        {/* Step dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-1.5 w-5 rounded-full bg-[var(--accent)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.18)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.18)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-[rgba(255,255,255,0.18)]" />
        </div>

        {/* Brand */}
        <p className="text-center text-xs text-[var(--text-muted)] opacity-50">
          By {BRAND_NAME}
        </p>
      </div>

    </div>
  );
}
