import { excluirCategoriaAction, removerRegraCategoriaAction, salvarCategoriaAction, salvarRegraCategoriaAction } from '@/app/_actions/gestao';
import { carregarBase } from '@/features/base';
import { ExcluirConfirmado } from '@/features/shared/excluir-confirmado';
import { ActionForm } from '@/ui/patterns/action-form';
import { Card, PageHeader, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, Select } from '@/ui/primitives/fields';

export const metadata = { title: 'Categorias' };
const COR_PADRAO = '#0b7a5a';

function CampoCor({ valor }: { valor: string | null }) {
  return (
    <Field label="Cor">
      <input type="color" name="color" defaultValue={valor ?? COR_PADRAO} className="h-12 w-full cursor-pointer rounded-md border border-border bg-surface p-1" />
    </Field>
  );
}

export default async function CategoriasPage() {
  const { c, categories } = await carregarBase();
  const regras = await c.categories.regras();
  const nome = new Map(categories.map((x) => [x.id, x.name]));
  return (
    <>
      <PageHeader voltar={{ href: '/mais' }} title="Categorias" subtitle="Organize seus gastos" />
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {categories.map((x) => (
          <Card key={x.id}>
            <p className="flex items-center gap-2 font-semibold"><span aria-hidden className="h-3.5 w-3.5 rounded-full" style={{ background: x.color ?? '#667085' }} />{x.name}</p>
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary">Editar</summary>
              <ActionForm action={salvarCategoriaAction} submitLabel="Salvar" className="space-y-3 pb-1">
                <input type="hidden" name="id" value={x.id} />
                <Field label="Nome"><Input name="name" defaultValue={x.name} required maxLength={40} /></Field>
                <CampoCor valor={x.color} />
              </ActionForm>
            </details>
            <ExcluirConfirmado action={excluirCategoriaAction} id={x.id} aviso="Os lançamentos desta categoria ficam sem categoria. O limite de orçamento é apagado." />
          </Card>
        ))}
      </div>

      <SectionTitle>Nova categoria</SectionTitle>
      <Card>
        <ActionForm action={salvarCategoriaAction} submitLabel="Criar categoria">
          <input type="hidden" name="id" value="" />
          <Field label="Nome"><Input name="name" required maxLength={40} /></Field>
          <CampoCor valor={null} />
        </ActionForm>
      </Card>

      <SectionTitle>Categorização automática</SectionTitle>
      <p className="mb-2 text-sm text-muted">Na importação de extrato, descrições que contêm a palavra recebem a categoria sugerida.</p>
      <Card className="space-y-3">
        {regras.length === 0 && <p className="text-sm text-muted">Nenhuma regra ainda.</p>}
        {regras.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0">
            <p className="min-w-0 truncate text-sm"><span className="font-semibold">“{r.keyword}”</span> → {nome.get(r.categoryId) ?? '—'}</p>
            <ExcluirConfirmado action={removerRegraCategoriaAction} id={r.id} rotulo="Remover" aviso="A regra deixa de sugerir esta categoria." />
          </div>
        ))}
        <ActionForm action={salvarRegraCategoriaAction} submitLabel="Adicionar regra">
          <Field label="Palavra na descrição"><Input name="keyword" required minLength={2} maxLength={60} placeholder="uber, mercado, netflix…" /></Field>
          <Field label="Categoria"><Select name="categoryId">{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        </ActionForm>
      </Card>
    </>
  );
}
