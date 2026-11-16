import { cx } from '../cx';

/** Grade de cartões-widget: 2 colunas no celular, até 4 no desktop. */
export function GradeWidgets({
  children,
  colunas = 4,
  className,
}: {
  children: React.ReactNode;
  colunas?: 2 | 3 | 4;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'grid grid-cols-2 gap-3',
        colunas === 4 && 'lg:grid-cols-4',
        colunas === 3 && 'lg:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
