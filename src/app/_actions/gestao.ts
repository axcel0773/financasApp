'use server';

import { z } from 'zod';
import { getContainer } from '@/composition/container';
import { validarCategoria } from '@/core/budgets/domain';
import { validarFaixas } from '@/core/income/tabelas';
import type { Faixa, ParamsIrrf } from '@/core/income/holerite';
import { err, ok } from '@/core/shared/result';
import { validarTransferencia } from '@/core/transfers/domain';
import { validarCarteira } from '@/core/wallets/domain';
import { parseBRL } from '@/core/shared/money';
import { executar } from '../_lib/action';
import type { ActionState } from '../_lib/action-state';
import {
  data,
  dinheiro,
  dinheiroOpcional,
  dinheiroPositivo,
  inteiroOpcional,
  lerForm,
  texto,
  textoOpcional,
  uuid,
  uuidOpcional,
} from '../_lib/schemas';

const cor = z
  .string()
  .trim()
  .transform((s) => (s === '' ? null : s));

/* ---------- Carteiras ---------- */
const tiposCarteira = ['checking', 'cash', 'credit_card', 'meal_voucher', 'food_voucher'] as const;
export async function criarCarteiraAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        name: texto(60),
        kind: z.enum(tiposCarteira),
        opening: dinheiroOpcional,
        closingDay: inteiroOpcional(1, 31),
        dueDay: inteiroOpcional(1, 31),
        limit: dinheiroOpcional,
      }),
      fd,
    );
    if (!p.ok) return p;
    const v = validarCarteira({
      name: p.value.name,
      kind: p.value.kind,
      closingDay: p.value.closingDay,
      dueDay: p.value.dueDay,
    });
    if (v) return err(v);
    const c = await getContainer();
    const cartao = p.value.kind === 'credit_card';
    await c.wallets.create({
      kind: p.value.kind,
      name: p.value.name,
      closingDay: cartao ? p.value.closingDay : null,
      dueDay: cartao ? p.value.dueDay : null,
      limitCents: cartao ? p.value.limit : null,
      openingCents: p.value.opening ?? 0,
    });
    return ok(undefined);
  }, 'Carteira criada.');
}
export async function renomearCarteiraAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid, name: texto(60), opening: dinheiroOpcional }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.wallets.update(p.value.id, {
      name: p.value.name,
      ...(p.value.opening !== null ? { openingCents: p.value.opening } : {}),
    });
    return ok(undefined);
  }, 'Carteira atualizada.');
}
export async function arquivarCarteiraAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid, arquivar: z.enum(['1', '0']) }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.wallets.setArchived(p.value.id, p.value.arquivar === '1');
    return ok(undefined);
  }, 'Carteira atualizada.');
}

/* ---------- Categorias e regras ---------- */
export async function salvarCategoriaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuidOpcional, name: texto(40), color: cor }), fd);
    if (!p.ok) return p;
    const v = validarCategoria({ name: p.value.name, color: p.value.color });
    if (v) return err(v);
    const c = await getContainer();
    if (p.value.id) await c.categories.update(p.value.id, { name: p.value.name, color: p.value.color });
    else await c.categories.create({ name: p.value.name, color: p.value.color });
    return ok(undefined);
  }, 'Categoria salva.');
}
export async function excluirCategoriaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.categories.remove(p.value.id);
    return ok(undefined);
  }, 'Categoria excluída. Os lançamentos ficaram sem categoria.');
}
export async function salvarRegraCategoriaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ keyword: texto(60, 2), categoryId: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.categories.adicionarRegra(p.value.keyword, p.value.categoryId);
    return ok(undefined);
  }, 'Regra salva.');
}
export async function removerRegraCategoriaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.categories.removerRegra(p.value.id);
    return ok(undefined);
  }, 'Regra removida.');
}

/* ---------- Tabelas de INSS e IRRF ---------- */
const LINHAS = 8;
function lerFaixas(fd: FormData, prefixo: 'inss' | 'irrf'): Faixa[] | string {
  const faixas: Faixa[] = [];
  for (let i = 0; i < LINHAS; i++) {
    const teto = String(fd.get(`${prefixo}_up_${i}`) ?? '').trim();
    const aliq = String(fd.get(`${prefixo}_rate_${i}`) ?? '').trim();
    const ded = String(fd.get(`${prefixo}_ded_${i}`) ?? '').trim();
    if (teto === '' && aliq === '' && ded === '') continue;
    const t = teto === '' ? null : parseBRL(teto);
    if (t !== null && !t.ok) return `${prefixo.toUpperCase()} faixa ${i + 1}: limite inválido.`;
    const a = Number(aliq.replace(',', '.').replace('%', ''));
    if (aliq === '' || !Number.isFinite(a)) return `${prefixo.toUpperCase()} faixa ${i + 1}: informe a alíquota em %.`;
    const d = ded === '' ? { ok: true as const, value: 0 } : parseBRL(ded);
    if (!d.ok) return `${prefixo.toUpperCase()} faixa ${i + 1}: parcela a deduzir inválida.`;
    faixas.push({ upToCents: t === null ? null : (t as { value: number }).value, rate: a / 100, deductionCents: d.value });
  }
  return faixas;
}
export async function salvarTabelasAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        validFrom: data,
        dependent: dinheiro,
        simplified: dinheiro,
        reducer: z.string().optional(),
        exempt: dinheiroOpcional,
        phase: dinheiroOpcional,
        a: dinheiroOpcional,
        b: z.string().trim(),
      }),
      fd,
    );
    if (!p.ok) return p;
    const inss = lerFaixas(fd, 'inss');
    if (typeof inss === 'string') return err(inss);
    const irrf = lerFaixas(fd, 'irrf');
    if (typeof irrf === 'string') return err(irrf);
    const e1 = validarFaixas(inss, { ultimaSemTeto: false });
    if (e1) return err(`INSS: ${e1}`);
    const e2 = validarFaixas(irrf, { ultimaSemTeto: true });
    if (e2) return err(`IRRF: ${e2}`);
    const usaRedutor = p.value.reducer === 'on';
    const b = Number(p.value.b.replace(',', '.'));
    if (usaRedutor && (!Number.isFinite(b) || p.value.exempt === null || p.value.phase === null || p.value.a === null))
      return err('Preencha todos os campos do redutor ou desmarque-o.');
    const params: ParamsIrrf = {
      dependentCents: p.value.dependent,
      simplifiedCents: p.value.simplified,
      reducer: usaRedutor
        ? { exemptUntilCents: p.value.exempt ?? 0, phaseUntilCents: p.value.phase ?? 0, aCents: p.value.a ?? 0, b }
        : undefined,
    };
    const c = await getContainer();
    await c.income.salvarTabela({ kind: 'inss', validFrom: p.value.validFrom, faixas: inss });
    await c.income.salvarTabela({ kind: 'irrf', validFrom: p.value.validFrom, faixas: irrf, params });
    return ok(undefined);
  }, 'Tabelas salvas.');
}

/* ---------- Transferências ---------- */
export async function criarTransferenciaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        clientId: uuid,
        from: uuid,
        to: uuid,
        amount: dinheiroPositivo,
        occurredOn: data,
        note: textoOpcional(200),
      }),
      fd,
    );
    if (!p.ok) return p;
    const v = validarTransferencia({
      clientId: p.value.clientId,
      fromWalletId: p.value.from,
      toWalletId: p.value.to,
      amountCents: p.value.amount,
      occurredOn: p.value.occurredOn,
      note: p.value.note,
    });
    if (!v.ok) return v;
    const c = await getContainer();
    await c.transfers.insert(v.value);
    return ok(undefined);
  }, 'Transferência registrada.');
}
export async function excluirTransferenciaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.transfers.setDeletedAt(p.value.id, c.clock.agora().toISOString());
    return ok(undefined);
  }, 'Transferência excluída.');
}

/* ---------- Editar e excluir o que só dava para criar ---------- */
export async function excluirRegraFixaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.recurring.excluirRegra(p.value.id);
    return ok(undefined);
  }, 'Fixo excluído. Os lançamentos já gerados continuam.');
}
export async function excluirParcelamentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.recurring.excluirPlano(p.value.id, c.clock.hoje(), c.clock.agora().toISOString());
    return ok(undefined);
  }, 'Parcelamento cancelado. As parcelas futuras foram para a lixeira.');
}
export async function desativarFonteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid, ativar: z.enum(['1', '0']) }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.income.setFonteAtiva(p.value.id, p.value.ativar === '1');
    return ok(undefined);
  }, 'Fonte de renda atualizada.');
}
export async function excluirMetaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.goals.remove(p.value.id);
    return ok(undefined);
  }, 'Meta excluída.');
}
const TIPOS_INV = ['fixed_income', 'treasury', 'stocks', 'funds', 'crypto', 'other'] as const;
export async function editarInvestimentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(
      z.object({
        id: uuid,
        kind: z.enum(TIPOS_INV),
        name: texto(80),
        institution: textoOpcional(80),
        rate: z.string().trim(),
        maturityOn: z.string().transform((s) => (s === '' ? null : s)),
      }),
      fd,
    );
    if (!p.ok) return p;
    const taxa = p.value.rate === '' ? null : Number(p.value.rate.replace(',', '.'));
    if (taxa !== null && (!Number.isFinite(taxa) || taxa < 0 || taxa > 1000)) return err('Taxa inválida.');
    const c = await getContainer();
    await c.investments.update(p.value.id, {
      kind: p.value.kind,
      name: p.value.name,
      institution: p.value.institution,
      annualRatePercent: taxa,
      maturityOn: p.value.maturityOn,
    });
    return ok(undefined);
  }, 'Investimento atualizado.');
}
export async function arquivarInvestimentoAction(_: ActionState, fd: FormData): Promise<ActionState> {
  return executar(async () => {
    const p = lerForm(z.object({ id: uuid }), fd);
    if (!p.ok) return p;
    const c = await getContainer();
    await c.investments.setArchived(p.value.id, true);
    return ok(undefined);
  }, 'Investimento arquivado.');
}
