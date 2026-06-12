import { HelpTooltip } from '../../../components/HelpTooltip';
import { ui } from '../../../lib/uiClasses';

export function ChartCard({
  title,
  help,
  helpAriaLabel,
  legend,
  children,
  className = '',
}) {
  return (
    <section className={`${ui.chartCard} ${className}`.trim()}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3
          className={`flex items-center gap-1.5 text-base font-semibold tracking-tight ${ui.heading}`}
        >
          <span>{title}</span>
          {help ? (
            <HelpTooltip
              ariaLabel={helpAriaLabel ?? help}
              size="md"
            >
              <span className="whitespace-pre-line">{help}</span>
            </HelpTooltip>
          ) : null}
        </h3>
        {legend ? <div className="shrink-0">{legend}</div> : null}
      </div>
      {children}
    </section>
  );
}
