import { cx } from '../cx';

export function ProgressBar({
  pct,
  tom = 'ok',
  label,
}: {
  pct: number;
  tom?: 'ok' | 'alert';
  label: string;
}) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className="h-2.5 w-full overflow-hidden rounded-full bg-soft"
    >
      <div
        className={cx('h-full rounded-full', tom === 'alert' ? 'bg-expense' : 'bg-chart')}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cx('skeleton', className)} />
);

export function ErrorState({
  message = 'Não foi possível carregar. Tente novamente.',
}: {
  message?: string;
}) {
  return (
    <div role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-expense-text">
      {message}
    </div>
  );
}
