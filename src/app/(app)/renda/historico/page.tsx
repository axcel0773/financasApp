import { totalRecebido } from '@/core/income/domain';
import { addMeses } from '@/core/shared/competencia';
import { carregarBase } from '@/features/base';
import { ReceiptRow } from '@/features/renda/receipt-row';
import { rotuloCompetencia } from '@/ui/format';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { ButtonLink } from '@/ui/primitives/button';
import { Card, PageHeader } from '@/ui/primitives/card';
import { Icon } from '@/ui/primitives/icon';
import { EmptyState } from '@/ui/primitives/progress';

export const metadata = { title: 'Histórico do salário' };

export default async function HistoricoPage() {
  const { c, hoje, mesAtual } = await carregarBase();
  const todos = await c.income.recebimentos(addMeses(mesAtual, -11), addMeses(mesAtual, 1));
  const porMes = new Map<string, typeof todos>();
  for (const r of todos) porMes.set(r.competencia, [...(porMes.get(r.competencia) ?? []), r]);
  return (
    <>
      <PageHeader
        title="Histórico do salário"
        subtitle="Últimos 12 meses"
        back={
          <ButtonLink href="/renda" variant="ghost" className="-ml-4">
            <Icon name="back" size={18} />
            Renda
          </ButtonLink>
        }
      />
      {porMes.size === 0 ? (
        <EmptyState title="Ainda não há recebimentos registrados" />
      ) : (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {[...porMes.entries()].map(([mes, rs]) => (
            <Card key={mes}>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold capitalize">
                  {rotuloCompetencia(mes)}
                </h2>
                <AmountDisplay cents={totalRecebido(rs)} tom="income" />
              </div>
              {rs.map((r) => (
                <ReceiptRow key={r.id} r={r} hoje={hoje} carteiras={[]} comConfirmar={false} />
              ))}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
