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
      className="h-2.5 w-full overflow-hidden rounded-full bg-border"
    >
      <div
        className={cx('h-full rounded-full', tom === 'alert' ? 'bg-expense' : 'bg-primary')}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden className={cx('skeleton', className)} />
);

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
    </div>
  );
}
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
