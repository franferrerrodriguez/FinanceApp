import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { UnderlineTabNav } from '../../../components/UnderlineTabNav';
import { ui } from '../../../lib/uiClasses';
import { parseBankStatementCsv } from '../../../lib/bankStatementParser';
import { categorizeMovement } from '../../../lib/bankStatementAnalysis';
import { analyzeTransactions, buildGeminiUserContext } from '../../../lib/geminiAnalysis';
import { mapGeminiAnalysisToView } from '../../../lib/geminiAnalysisView';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney } from '../../../utils/formatters';
import { formatSnapshotDateLabel } from '../../../utils/monthLabel';
import { usePreferences } from '../../../store/hooks';
import { notifyAfterSave, useToast } from '../../../context/ToastContext';
import { usePatrimonySave } from '../../../hooks/usePatrimonySave';

const RESULT_TABS = ['subscriptions', 'categories', 'alerts', 'movements'];
const COLORS = ['#34d399', '#60a5fa', '#a78bfa', '#fbbf24', '#f472b6', '#94a3b8'];

export function StatementAnalysisPanel() {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const { settings, setSettings } = useFinanceData();
  const toast = useToast();
  const { saveToCloud } = usePatrimonySave();

  const [parseResult, setParseResult] = useState(null);
  const [csvText, setCsvText] = useState('');
  const [manualMapping, setManualMapping] = useState(null);
  const [resultTab, setResultTab] = useState('subscriptions');
  const [ignoredSubs, setIgnoredSubs] = useState(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [filters, setFilters] = useState({ category: '', dateFrom: '', dateTo: '', minAmount: '' });
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  const movements = useMemo(() => {
    if (!parseResult?.ok) return [];
    return parseResult.movements.map((m) => ({
      ...m,
      category: m.category ?? categorizeMovement(m.description),
    }));
  }, [parseResult]);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? '');
        setCsvText(text);
        const result = parseBankStatementCsv(text, manualMapping);
        setParseResult(result);
        setAnalysis(null);
        setAnalysisError(null);
        if (result.ok) setResultTab('subscriptions');
      };
      reader.readAsText(file);
    },
    [manualMapping],
  );

  const runAnalysis = async () => {
    if (!movements.length) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const raw = await analyzeTransactions(movements, buildGeminiUserContext(settings));
      setAnalysis(mapGeminiAnalysisToView(raw));
      setResultTab('subscriptions');
    } catch (error) {
      setAnalysisError(error?.message ?? 'API_ERROR');
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const addSubscriptionToBudget = async (sub) => {
    const next = {
      ...settings,
      subscriptions: (settings.subscriptions ?? 0) + sub.amount,
      useDetailedExpenses: true,
    };
    setSettings(next);
    await notifyAfterSave({
      toast,
      t,
      actionKey: 'statementAnalysis.addedToBudget',
      saveFn: saveToCloud,
    });
  };

  const resultTabs = RESULT_TABS.map((id) => ({
    id,
    label: t(`statementAnalysis.tabs.${id}`),
  }));

  const filteredMovements = useMemo(
    () =>
      movements.filter((m) => {
        if (filters.category && m.category !== filters.category) return false;
        if (filters.dateFrom && m.dateIso < filters.dateFrom) return false;
        if (filters.dateTo && m.dateIso > filters.dateTo) return false;
        if (filters.minAmount && Math.abs(m.amount) < Number(filters.minAmount)) return false;
        return true;
      }),
    [movements, filters],
  );

  const visibleSubscriptions = useMemo(
    () => (analysis?.subscriptions ?? []).filter((s) => !ignoredSubs.has(s.id)),
    [analysis, ignoredSubs],
  );

  return (
    <div className={ui.stackPage}>
      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('statementAnalysis.title')}
        </h3>
        <p className={`text-sm ${ui.textMuted}`}>{t('statementAnalysis.subtitle')}</p>

        <div
          className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition ${
            dragOver
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : `${ui.cardDashed}`
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p className={`text-sm ${ui.text}`}>{t('statementAnalysis.dropHint')}</p>
          <label className={`mt-3 cursor-pointer ${ui.btnSecondary}`}>
            {t('statementAnalysis.selectFile')}
            <input
              type="file"
              accept=".csv,.txt"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        {parseResult && !parseResult.ok && parseResult.error === 'unknown_format' ? (
          <ManualMappingForm
            headers={parseResult.headers}
            preview={parseResult.preview}
            mapping={manualMapping}
            onChange={setManualMapping}
            onApply={() => {
              if (!csvText || !manualMapping) return;
              const result = parseBankStatementCsv(csvText, manualMapping);
              setParseResult(result);
              setAnalysis(null);
              if (result.ok) setResultTab('subscriptions');
            }}
          />
        ) : null}
      </div>

      {parseResult?.ok ? (
        <>
          <p className={`text-sm ${ui.text}`}>
            {t('statementAnalysis.summary', {
              count: parseResult.count,
              from: formatSnapshotDateLabel(parseResult.dateFrom.toISOString().slice(0, 10), locale),
              to: formatSnapshotDateLabel(parseResult.dateTo.toISOString().slice(0, 10), locale),
              bank: parseResult.bank,
            })}
          </p>
          <p className={`text-xs ${ui.textMuted}`}>{t('statementAnalysis.tempWarning')}</p>

          <div className={`${ui.cardMuted} p-4 ${ui.stackBlocks}`}>
            <p className={`text-sm ${ui.text}`}>{t('statementAnalysis.privacyNote')}</p>
            <button
              type="button"
              className={ui.btnPrimary}
              disabled={analyzing}
              onClick={runAnalysis}
            >
              {analyzing ? t('statementAnalysis.analyzing') : t('statementAnalysis.analyze')}
            </button>
            {analysisError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {t(`statementAnalysis.errors.${analysisError}`)}
              </p>
            ) : null}
          </div>

          {analysis ? (
            <>
              {analysis.summary ? (
                <div className={`${ui.chartCard} grid gap-3 sm:grid-cols-3 text-sm`}>
                  <div>
                    <p className={ui.textMuted}>{t('statementAnalysis.reportSummary.expenses')}</p>
                    <p className={`font-semibold tabular-nums ${ui.heading}`}>
                      {formatMoney(analysis.summary.totalExpenses)}
                    </p>
                  </div>
                  <div>
                    <p className={ui.textMuted}>{t('statementAnalysis.reportSummary.income')}</p>
                    <p className={`font-semibold tabular-nums ${ui.heading}`}>
                      {formatMoney(analysis.summary.totalIncome)}
                    </p>
                  </div>
                  <div>
                    <p className={ui.textMuted}>{t('statementAnalysis.reportSummary.monthlyAvg')}</p>
                    <p className={`font-semibold tabular-nums ${ui.heading}`}>
                      {formatMoney(analysis.summary.monthlyAverageExpense)}
                    </p>
                  </div>
                </div>
              ) : null}

              {analysis.insights?.length ? (
                <ul className={`${ui.chartCard} space-y-3`}>
                  {analysis.insights.map((insight, index) => (
                    <li key={`${insight.title}-${index}`} className={`text-sm ${ui.text}`}>
                      <p className={`font-semibold ${ui.heading}`}>{insight.title}</p>
                      <p className="mt-1">{insight.description}</p>
                      {insight.impactEuros != null ? (
                        <p className={`mt-1 text-xs ${ui.accentSoft}`}>
                          {t('statementAnalysis.insightImpact', {
                            amount: formatMoney(insight.impactEuros),
                          })}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              <UnderlineTabNav
                tabs={resultTabs}
                activeId={resultTab}
                onChange={setResultTab}
                ariaLabel={t('statementAnalysis.tabsLabel')}
              />

              {resultTab === 'subscriptions' ? (
                <SubscriptionsTab
                  subscriptions={visibleSubscriptions}
                  subTotals={analysis.subTotals}
                  onIgnore={(id) => setIgnoredSubs((prev) => new Set([...prev, id]))}
                  onAdd={addSubscriptionToBudget}
                />
              ) : null}

              {resultTab === 'categories' ? (
                <CategoriesTab comparison={analysis.categoryComparison} />
              ) : null}

              {resultTab === 'alerts' ? (
                <AlertsTab alerts={analysis.alerts} />
              ) : null}

              {resultTab === 'movements' ? (
                <MovementsTab
                  movements={filteredMovements}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ManualMappingForm({ headers, preview, mapping, onChange, onApply }) {
  const { t } = useTranslation();
  const cols = headers?.length ?? 0;

  return (
    <div className={`mt-4 ${ui.cardMuted} p-4 ${ui.stackBlocks}`}>
      <p className={`text-sm font-medium ${ui.heading}`}>{t('statementAnalysis.manualMap.title')}</p>
      <p className={`text-xs ${ui.textMuted}`}>{t('statementAnalysis.manualMap.hint')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {['dateCol', 'descCol', 'amountCol'].map((key) => (
          <label key={key} className="block text-sm">
            <span className={ui.formFieldLabel}>{t(`statementAnalysis.manualMap.${key}`)}</span>
            <select
              className={`mt-1 ${ui.selectField}`}
              value={mapping?.[key] ?? 0}
              onChange={(e) => onChange({ ...mapping, [key]: Number(e.target.value) })}
            >
              {Array.from({ length: cols }, (_, i) => (
                <option key={i} value={i}>
                  {headers[i] ?? i}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      {preview?.length ? (
        <pre className={`overflow-x-auto text-xs ${ui.textMuted}`}>
          {JSON.stringify(preview, null, 2)}
        </pre>
      ) : null}
      <button type="button" className={ui.btnPrimary} onClick={onApply}>
        {t('statementAnalysis.manualMap.apply')}
      </button>
    </div>
  );
}

function SubscriptionsTab({ subscriptions, subTotals, onIgnore, onAdd }) {
  const { t } = useTranslation();

  if (!subscriptions.length) {
    return (
      <div className={ui.chartCard}>
        <p className={`text-sm ${ui.textMuted}`}>{t('statementAnalysis.subscriptions.empty')}</p>
      </div>
    );
  }

  return (
    <div className={`${ui.chartCard} ${ui.stackSection}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className={`border-b ${ui.divider}`}>
              {['name', 'amount', 'frequency', 'last', 'yearTotal', 'action'].map((col) => (
                <th key={col} className={`px-2 py-2 text-left text-xs font-semibold ${ui.textLabel}`}>
                  {t(`statementAnalysis.subscriptions.${col}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className={`border-b last:border-0 ${ui.divider}`}>
                <td className={`px-2 py-2 ${ui.heading}`}>{sub.name}</td>
                <td className="px-2 py-2 tabular-nums">{formatMoney(sub.amount)}</td>
                <td className={`px-2 py-2 ${ui.text}`}>
                  {t(`statementAnalysis.frequency.${sub.frequency}`)}
                </td>
                <td className={`px-2 py-2 ${ui.textMuted}`}>
                  {sub.lastDate.toLocaleDateString()}
                </td>
                <td className="px-2 py-2 tabular-nums">{formatMoney(sub.totalYear)}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-col gap-1">
                    <button type="button" className={ui.actionLink} onClick={() => onAdd(sub)}>
                      {t('statementAnalysis.subscriptions.addToBudget')}
                    </button>
                    <button type="button" className={ui.textMuted} onClick={() => onIgnore(sub.id)}>
                      {t('statementAnalysis.subscriptions.ignore')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`text-sm ${ui.text}`}>
        {t('statementAnalysis.subscriptions.footer', {
          count: subTotals.count,
          monthly: formatMoney(subTotals.monthly),
          yearly: formatMoney(subTotals.yearly),
        })}
      </p>
    </div>
  );
}

function CategoriesTab({ comparison }) {
  const { t } = useTranslation();
  const data = comparison
    .filter((c) => c.actual > 0)
    .map((c) => ({
      name: c.name ?? t(`statementAnalysis.categories.${c.id}`, { defaultValue: c.id }),
      value: c.actual,
      id: c.id,
    }));

  return (
    <div className={`grid gap-6 lg:grid-cols-2 ${ui.chartCard}`}>
      {data.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatMoney(v)} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className={`text-sm ${ui.textMuted}`}>{t('statementAnalysis.categories.empty')}</p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className={`border-b ${ui.divider}`}>
            {['category', 'actual', 'budgeted', 'diff'].map((col) => (
              <th key={col} className={`px-2 py-2 text-left text-xs font-semibold ${ui.textLabel}`}>
                {t(`statementAnalysis.categories.${col}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.map((row) => (
            <tr key={row.id} className={`border-b last:border-0 ${ui.divider}`}>
              <td className={`px-2 py-2 ${ui.heading}`}>
                {row.name ?? t(`statementAnalysis.categories.${row.id}`, { defaultValue: row.id })}
              </td>
              <td className="px-2 py-2 tabular-nums">{formatMoney(row.actual)}</td>
              <td className={`px-2 py-2 tabular-nums ${ui.textMuted}`}>
                {formatMoney(row.budgeted)}
              </td>
              <td
                className={`px-2 py-2 tabular-nums ${
                  row.diff > 0 ? 'text-red-600 dark:text-red-400' : ui.text
                }`}
              >
                {row.diff > 0
                  ? t('statementAnalysis.categories.over', { amount: formatMoney(row.diff) })
                  : formatMoney(row.diff)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsTab({ alerts }) {
  const { t } = useTranslation();
  if (!alerts.length) {
    return (
      <div className={ui.chartCard}>
        <p className={`text-sm ${ui.text}`}>{t('statementAnalysis.alerts.empty')}</p>
      </div>
    );
  }
  return (
    <ul className={`${ui.chartCard} space-y-3`}>
      {alerts.map((alert) => (
        <li key={alert.id} className={`flex gap-3 text-sm ${ui.text}`}>
          <span aria-hidden>⚠️</span>
          <span>
            {t(`statementAnalysis.alerts.${alert.type}`, {
              description: alert.params.description,
              amount: alert.params.amount != null ? formatMoney(alert.params.amount) : undefined,
              date: alert.params.date,
              defaultValue: alert.params.description,
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

function MovementsTab({ movements, filters, onFiltersChange }) {
  const { t } = useTranslation();

  return (
    <div className={`${ui.chartCard} ${ui.stackSection}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="date"
          className={ui.input}
          value={filters.dateFrom}
          onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
        />
        <input
          type="date"
          className={ui.input}
          value={filters.dateTo}
          onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
        />
        <input
          type="number"
          className={ui.input}
          placeholder={t('statementAnalysis.movements.minAmount')}
          value={filters.minAmount}
          onChange={(e) => onFiltersChange({ ...filters, minAmount: e.target.value })}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className={`border-b ${ui.divider}`}>
              {['date', 'description', 'category', 'amount'].map((col) => (
                <th key={col} className={`px-2 py-2 text-left text-xs font-semibold ${ui.textLabel}`}>
                  {t(`statementAnalysis.movements.${col}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className={`border-b last:border-0 ${ui.divider}`}>
                <td className={`px-2 py-2 whitespace-nowrap ${ui.textMuted}`}>{m.dateIso}</td>
                <td className={`px-2 py-2 ${ui.text}`}>{m.description}</td>
                <td className={`px-2 py-2 ${ui.textLabel}`}>
                  {t(`statementAnalysis.categories.${m.category}`, { defaultValue: m.category })}
                </td>
                <td
                  className={`px-2 py-2 tabular-nums ${
                    m.amount < 0 ? 'text-red-600 dark:text-red-400' : ui.accent
                  }`}
                >
                  {formatMoney(m.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
