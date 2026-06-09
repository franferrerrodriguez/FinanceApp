import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';

export function PasswordField({
  id: idProp,
  label,
  value,
  onChange,
  disabled = false,
  autoComplete = 'current-password',
  minLength,
  required = false,
}) {
  const { t } = useTranslation();
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label ? (
        <label htmlFor={id} className={`${ui.formFieldLabel} ${ui.textLabel} ${ui.formFieldHintAfter}`}>
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={`${ui.input} pr-12`}
          disabled={disabled}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2M6.2 6.2C4.2 7.8 2.8 10 2 12s3.5 7 10 7c1.8 0 3.4-.4 4.8-1.2M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a16.2 16.2 0 0 1-2.1 3.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
