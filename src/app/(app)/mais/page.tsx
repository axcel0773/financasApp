import Link from 'next/link';
import { salvarAjustesAction } from '@/app/_actions/ajustes';
import { getContainer } from '@/composition/container';
import { createSupabaseServer } from '@/infra/supabase/client.server';
import { LogoutForm } from '@/features/shell/logout-form';
import { MfaCard } from '@/features/shell/mfa-card';
import { NAV_INVESTIR, NAV_PLANEJAMENTO } from '@/ui/shell/nav-items';
import { centavosParaCampo } from '@/ui/format';
import { ActionForm } from '@/ui/patterns/action-form';
import { Button } from '@/ui/primitives/button';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput, RadioChips, Switch } from '@/ui/primitives/fields';
import { Icon } from '@/ui/primitives/icon';

export const metadata = { title: 'Mais' };

function Links({
  itens,
}: {
  itens: { href: string; label: string; icon: Parameters<typeof Icon>[0]['name'] }[];
}) {
  return (
    <Card className="py-1">
      {itens.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className="flex min-h-14 items-center gap-3 border-b border-border last:border-0"
        >
          <Icon name={i.icon} className="text-primary" />
          <span className="flex-1 font-semibold">{i.label}</span>
          <Icon name="chevron" size={18} className="text-muted" />
        </Link>
      ))}
    </Card>
  );
}

export default async function MaisPage() {
  const db = await createSupabaseServer();
  const {
    data: { user },
  } = await db.auth.getUser();
  const a = await (await getContainer()).settings.get();
  return (
    <>
      <PageHeader title="Mais" subtitle={user?.email ?? ''} />
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <SectionTitle>Planejamento</SectionTitle>
          <Links itens={NAV_PLANEJAMENTO} />
          <SectionTitle>Investir</SectionTitle>
          <Links itens={NAV_INVESTIR} />
          <SectionTitle>Dados</SectionTitle>
          <Links
            itens={[
              { href: '/mais/viagens', label: 'Viagens', icon: 'list' },
              { href: '/mais/carteiras', label: 'Carteiras', icon: 'wallet' },
              { href: '/mais/categorias', label: 'Categorias e regras', icon: 'list' },
              { href: '/mais/impostos', label: 'Tabelas de INSS e IRRF', icon: 'list' },
              { href: '/gastos/transferir', label: 'Transferir entre carteiras', icon: 'list' },
              { href: '/gastos/importar', label: 'Importar extrato (CSV)', icon: 'list' },
              { href: '/renda/simulador', label: 'Simular holerite, 13º e férias', icon: 'list' },
              { href: '/gastos/lixeira', label: 'Lixeira (30 dias)', icon: 'trash' },
              { href: '/renda/historico', label: 'Histórico de renda', icon: 'list' },
            ]}
          />
          <Card className="mt-3">
            <form action="/mais/exportar" method="post" className="space-y-3">
              <p className="font-semibold">Exportar lançamentos (CSV)</p>
              <Field label="Confirme sua senha">
                <Input type="password" name="senha" autoComplete="current-password" required />
              </Field>
              <Button type="submit" variant="secondary" block>
                Baixar CSV
              </Button>
            </form>
          </Card>
        </div>
        <div>
          <SectionTitle>Ajustes</SectionTitle>
          <Card>
            <ActionForm action={salvarAjustesAction} submitLabel="Salvar ajustes">
              <Field label="Tema">
                <RadioChips
                  name="theme"
                  defaultValue={a.theme}
                  options={[
                    { value: 'system', label: 'Sistema' },
                    { value: 'light', label: 'Claro' },
                    { value: 'dark', label: 'Escuro' },
                  ]}
                />
              </Field>
              <Field label="IPCA esperado % a.a.">
                <Input
                  name="ipca"
                  inputMode="decimal"
                  defaultValue={String(a.ipcaPercent).replace('.', ',')}
                />
              </Field>
              <Field label="CDI esperado % a.a.">
                <Input
                  name="cdi"
                  inputMode="decimal"
                  defaultValue={String(a.cdiPercent).replace('.', ',')}
                />
              </Field>
              <Field
                label="Saldo mínimo de alerta"
                hint="O fluxo de caixa avisa se a projeção ficar abaixo disso."
              >
                <MoneyInput name="minBalance" defaultValue={centavosParaCampo(a.minBalanceCents)} />
              </Field>
              <Switch
                name="hideValues"
                defaultChecked={a.hideValues}
                label="Ocultar valores ao abrir o app"
              />
            </ActionForm>
          </Card>
          <SectionTitle>Segurança</SectionTitle>
          <MfaCard />
          <p className="mt-3 text-xs text-muted">
            As tabelas de INSS e IRRF (2026) são editáveis e devem ser conferidas com a legislação
            vigente.
          </p>
          <div className="mt-6">
            <LogoutForm />
          </div>
        </div>
      </div>
    </>
  );
}
