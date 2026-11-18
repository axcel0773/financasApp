import { cx } from '../cx';

/**
 * Grade dos cartões-widget. As colunas dependem da LARGURA DISPONÍVEL (container query), não da tela:
 * a mesma grade fica com 2 colunas numa coluna estreita do desktop e com 4 quando há espaço.
 * Cada widget precisa de ~150 px para o valor caber sem cortar.
 */
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
    <div className={cx('grade-widgets', className)}>
      <div data-colunas={colunas}>{children}</div>
    </div>
  );
}
