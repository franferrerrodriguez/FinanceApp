import { ui } from '../../../lib/uiClasses';

export function ChartCard({ title, legend, children, className = '' }) {
  return (
    <section className={`${ui.chartCard} ${className}`.trim()}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h3 className={`text-base font-semibold tracking-tight ${ui.heading}`}>
          {title}
        </h3>
        {legend ? <div className="shrink-0">{legend}</div> : null}
      </div>
      {children}
    </section>
  );
}
