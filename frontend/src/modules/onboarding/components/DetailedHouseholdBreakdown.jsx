import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';
import { MoneyField } from './MoneyField';

export function DetailedHouseholdBreakdown({ settings, setSettings }) {
  const { t } = useTranslation();

  return (
    <div
      className={`grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 ${ui.block}`}
    >
      <p className={`sm:col-span-2 text-xs leading-snug ${ui.textMuted}`}>
        {t('onboarding.expenses.detailedIntro')}
      </p>
      <MoneyField
        compact
        id="utilities"
        label={t('onboarding.expenses.utilities')}
        value={settings.utilities}
        onChange={(v) => setSettings({ utilities: v })}
      />
      <MoneyField
        compact
        id="insurance"
        label={t('onboarding.expenses.insurance')}
        value={settings.insurance}
        onChange={(v) => setSettings({ insurance: v })}
      />
      <MoneyField
        compact
        id="subscriptions"
        label={t('onboarding.expenses.subscriptions')}
        value={settings.subscriptions}
        onChange={(v) => setSettings({ subscriptions: v })}
      />
      <MoneyField
        compact
        id="other-fixed"
        label={t('onboarding.expenses.otherFixed')}
        value={settings.otherFixedExpenses}
        onChange={(v) => setSettings({ otherFixedExpenses: v })}
      />
    </div>
  );
}
