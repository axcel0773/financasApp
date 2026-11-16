import { proximoFixo, restanteDoParcelamento } from '@/core/recurring/domain';
import {
  criarParcelamentoAction,
  gerarFixosAction,
  salvarRegraAction,
} from '@/app/_actions/planejamento';
import { excluirParcelamentoAction, excluirRegraFixaAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { centavosParaCampo, dataCurta, rotuloCompetencia } from '@/ui/format';
import { ActionForm } from '@/features/shared/action-form';
import { AmountDisplay } from '@/ui/patterns/amount-display';
import { Card, Hero, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Ring } from '@/ui/charts/ring';
import { CategoryIcon } from '@/ui/patterns/category-icon';
import { Recolhivel } from '@/ui/patterns/collapsible';
import { IconeRedondo } from '@/ui/patterns/round-icon';
import { Widget } from '@/ui/patterns/widget';
import { GradeWidgets } from '@/ui/patterns/widget-grid';
import { Field, Input, MoneyInput, Select, Switch } from '@/ui/primitives/fields';
import { EmptyState } from '@/ui/patterns/empty-state';

export const metadata = { title: 'Fixos e parcelas' };

export default async function FixosPage() {
  const { c, wallets, categories, hoje, mesAtual } = await carregarBase();
  const [regras, planos, todas, gerados] = await Promise.all([
    c.recurring.regras(),
    c.recurring.planos(),
    c.transactions.list({ apenasParcelas: true, limite: 1000 }),
    c.recurring.chavesGeradas(mesAtual),
  ]);
  const pagas = (id: string) =>
    todas.filter((t) => t.installmentPlanId === id && t.occurredOn <= hoje).length;
  const opcoesCarteira = wallets.map((w) => (
    <option key={w.id} value={w.id}>
      {w.name}
    </option>
  ));
  const opcoesCategoria = (
    <>
      <option value="">Sem categoria</option>
      {categories.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
        </option>
      ))}
    </>
  );
  const totalFixos = regras.filter((r) => r.active).reduce((s, r) => s + r.amountCents, 0);

  const ativos = regras.filter((r) => r.active);
  const prox = proximoFixo(regras, hoje);
  const proximo = prox?.regra;
  const restante = (p: (typeof planos)[number]) => restanteDoParcelamento(p.totalCents, p.installments, pagas(p.id));
  const emAberto = planos.reduce((t, p) => t + restante(p), 0);
  const cat = new Map(categories.map((x) => [x.id, x]));
  const formNovoFixo = (
    <ActionForm action={salvarRegraAction} submitLabel="Cadastrar fixo" className="space-y-3">
      <Field label="Nome">
        <Input name="name" required maxLength={80} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor">
          <MoneyInput name="amount" required />
        </Field>
        <Field label="Dia do mês">
          <Input name="dayOfMonth" inputMode="numeric" required />
        </Field>
      </div>
      <Field label="Carteira">
        <Select name="walletId">{opcoesCarteira}</Select>
      </Field>
      <Field label="Categoria">
        <Select name="categoryId">{opcoesCategoria}</Select>
      </Field>
      <Field label="Começa em">
        <Input type="date" name="startOn" defaultValue={hoje} required />
      </Field>
    </ActionForm>
  );

  return (
    <>
      <PageHeader
        voltar={{ href: '/mais' }}
        title="Fixos e parcelas"
        subtitle="Gastos que se repetem e compras parceladas"
      />
      <div className="space-y-3">
        <Hero>
          <p className="text-sm text-white/75">Fixos ativos por mês</p>
          <AmountDisplay cents={totalFixos} tom="onDark" size="xl" />
          <div className="mt-5 grid grid-cols-2 gap-2.5 text-sm">
            <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
              <p className="text-white/75">Gerados em {rotuloCompetencia(mesAtual).split(' ')[0]}</p>
              <p className="text-lg font-semibold">
                {Math.min(gerados.size, ativos.length)} de {ativos.length}
              </p>
            </div>
            <div className="rounded-[18px] bg-white/10 px-3.5 py-3">
              <p className="text-white/75">Parcelas a pagar</p>
              <AmountDisplay cents={emAberto} size="md" tom="onDark" />
            </div>
          </div>
        </Hero>
        <GradeWidgets>
          <Widget rotulo="Fixos ativos" valor={<span className="text-lg font-semibold">{ativos.length}</span>} contexto={`${regras.length - ativos.length} pausados`} visual={<IconeRedondo nome="repeat" />} />
          <Widget
            rotulo="Próximo fixo"
            valor={proximo ? <AmountDisplay cents={proximo.amountCents} size="md" /> : <span className="text-lg font-semibold">—</span>}
            contexto={prox ? `${prox.regra.name} · ${dataCurta(prox.date)}` : 'Nenhum ativo'}
            visual={<IconeRedondo nome="calendar" />}
          />
          <Widget rotulo="Parcelamentos" valor={<span className="text-lg font-semibold">{planos.length}</span>} contexto="em andamento" visual={<IconeRedondo nome="card" />} />
          <Widget rotulo="Parcelas a pagar" valor={<AmountDisplay cents={emAberto} size="md" />} contexto="soma das que faltam" visual={<IconeRedondo nome="list" />} />
        </GradeWidgets>
        <ActionForm action={gerarFixosAction} submitLabel={`Gerar fixos de ${rotuloCompetencia(mesAtual)}`} variante="secondary">
          <input type="hidden" name="competencia" value={mesAtual} />
        </ActionForm>
        <p className="text-xs text-muted">Pode clicar mais de uma vez: nada é duplicado.</p>
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div>
          <SectionTitle>Gastos fixos</SectionTitle>
          {regras.length === 0 ? (
            <EmptyState icone="repeat" title="Nenhum gasto fixo">Cadastre aluguel, internet ou assinaturas no formulário logo abaixo.</EmptyState>
          ) : (
            <Card className="py-1">
              {regras.map((r) => {
                const ct = r.categoryId ? cat.get(r.categoryId) : undefined;
                return (
                  <details key={r.id} className="border-b border-border last:border-0">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-2 [&::-webkit-details-marker]:hidden">
                      <CategoryIcon nome={ct?.name} cor={ct?.color} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{r.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {ct?.name ?? 'Sem categoria'}
                          {r.active ? '' : ' · pausado'}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <AmountDisplay cents={r.amountCents} size="sm" />
                        <span className="block text-xs text-muted">dia {r.dayOfMonth}</span>
                      </span>
                    </summary>
                    <ActionForm action={salvarRegraAction} submitLabel="Salvar fixo" className="space-y-3 pb-3">
                      <input type="hidden" name="id" value={r.id} />
                      <Field label="Nome">
                        <Input name="name" defaultValue={r.name} required maxLength={80} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Valor">
                          <MoneyInput name="amount" defaultValue={centavosParaCampo(r.amountCents)} required />
                        </Field>
                        <Field label="Dia do mês">
                          <Input name="dayOfMonth" inputMode="numeric" defaultValue={r.dayOfMonth} required />
                        </Field>
                      </div>
                      <Field label="Carteira">
                        <Select name="walletId" defaultValue={r.walletId}>
                          {opcoesCarteira}
                        </Select>
                      </Field>
                      <Field label="Categoria">
                        <Select name="categoryId" defaultValue={r.categoryId ?? ''}>
                          {opcoesCategoria}
                        </Select>
                      </Field>
                      <Field label="Começa em">
                        <Input type="date" name="startOn" defaultValue={r.startOn} required />
                      </Field>
                      <Switch name="active" defaultChecked={r.active} label="Ativo (desmarque para pausar)" />
                    </ActionForm>
                    <ExcluirConfirmado action={excluirRegraFixaAction} id={r.id} aviso="Encerra este fixo. Lançamentos já gerados continuam no histórico." />
                  </details>
                );
              })}
            </Card>
          )}
          <Recolhivel titulo="Novo gasto fixo" className="mt-3">
            {formNovoFixo}
          </Recolhivel>
        </div>
        <div>
          <SectionTitle>Compras parceladas</SectionTitle>
          {planos.length === 0 ? (
            <EmptyState icone="card" title="Nenhuma compra parcelada">Compras parceladas no cartão aparecem aqui com o que falta pagar.</EmptyState>
          ) : (
            <div className="space-y-3">
              {planos.map((p) => {
                const n = pagas(p.id);
                const ct = p.categoryId ? cat.get(p.categoryId) : undefined;
                return (
                  <Card key={p.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CategoryIcon nome={ct?.name ?? p.description} cor={ct?.color} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.description}</p>
                        <p className="text-xs text-muted">
                          {n} de {p.installments} parcelas · 1ª em {dataCurta(p.firstOn)}
                        </p>
                      </div>
                      <Ring
                        pct={(n / p.installments) * 100}
                        size={52}
                        rotulo={`${n}/${p.installments}`}
                        descricao={`${p.description}: ${n} de ${p.installments} parcelas pagas`}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">
                        Total <span className="amount">{centavosParaCampo(p.totalCents)}</span>
                      </span>
                      <span>
                        faltam <span className="amount font-semibold">{centavosParaCampo(restante(p))}</span>
                      </span>
                    </div>
                    <ExcluirConfirmado action={excluirParcelamentoAction} id={p.id} aviso="Remove o parcelamento e as parcelas futuras ainda não vencidas. As já pagas ficam no histórico." />
                  </Card>
                );
              })}
            </div>
          )}
          <Recolhivel titulo="Nova compra parcelada" className="mt-3">
            <ActionForm action={criarParcelamentoAction} submitLabel="Criar parcelas" className="space-y-3">
              <Field label="Descrição">
                <Input name="description" required maxLength={80} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor total">
                  <MoneyInput name="total" required />
                </Field>
                <Field label="Nº de parcelas">
                  <Input name="installments" inputMode="numeric" required placeholder="10" />
                </Field>
              </div>
              <Field label="Data da 1ª parcela">
                <Input type="date" name="firstOn" defaultValue={hoje} required />
              </Field>
              <Field label="Carteira">
                <Select name="walletId">{opcoesCarteira}</Select>
              </Field>
              <Field label="Categoria">
                <Select name="categoryId">{opcoesCategoria}</Select>
              </Field>
              <p className="text-xs text-muted">
                O total é dividido em centavos: o resto vai para a 1ª parcela, sem perder nem criar centavo.
              </p>
            </ActionForm>
          </Recolhivel>
        </div>
      </div>
    </>
  );
}
