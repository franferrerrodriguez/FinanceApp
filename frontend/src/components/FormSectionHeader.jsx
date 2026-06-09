import { ui } from '../lib/uiClasses';

/** Section title + optional hint — same rhythm as FormFieldFrame (stacked). */
export function FormSectionHeader({ title, hint, accent, className = '' }) {
  return (
    <div className={className}>
      <p className={`${ui.formFieldLabel} ${ui.textLabel}`}>{title}</p>
      {accent ? (
        <p className={`${ui.formFieldHint} ${ui.textMuted} ${ui.formFieldHintGap} italic`}>
          {accent}
        </p>
      ) : null}
      {hint ? (
        <p
          className={`${ui.formFieldHint} ${ui.textMuted} ${ui.formFieldHintGap} ${ui.formFieldHintAfter}`}
        >
          {hint}
        </p>
      ) : (
        <div className={ui.formFieldHintAfter} aria-hidden />
      )}
    </div>
  );
}
