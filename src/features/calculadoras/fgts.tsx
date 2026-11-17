'use client';

import { useMemo, useState } from 'react';
import { compararSaqueFgts, saqueAniversario } from '@/core/calculadoras/fgts';
import { formatBRL } from '@/core/shared/money';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Destaque, LayoutCalculadora } from './blocos';
import { campo, cents, num } from './campos';

export function CalculadoraFgts({ brutoCents }: { brutoCents: number }) {
  const [saldo, setSaldo] = useState('');
  const [bruto, setBruto] = useState(campo(brutoCents));
  const [anos, setAnos] = useState('3');
  const [rend, setRend] = useState('3');
  const linhas = useMemo(
    () =>
      compararSaqueFgts({
        saldoCents: cents(saldo),
        brutoCents: cents(bruto),
        anos: Math.min(40, Math.max(1, Math.round(num(anos, 3)))),
        rendimentoAnualPct: Math.max(0, num(rend, 3)),
      }),
    [saldo, bruto, anos, rend],
  );
  const fim = linhas[linhas.length - 1]!;
  const perde = fim.demitidoRescisaoCents - fim.demitidoAniversarioCents;
  return (
    <LayoutCalculadora
      campos={
        <>
          <Field label="Saldo atual do FGTS" hint="Veja no app FGTS. Use o saldo deste emprego.">
            <MoneyInput autoFocus value={saldo} onChange={(e) => setSaldo(e.target.value)} />
          </Field>
          <Field label="Salário bruto">
            <MoneyInput value={bruto} onChange={(e) => setBruto(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Por quantos anos">
              <Input inputMode="numeric" value={anos} onChange={(e) => setAnos(e.target.value)} />
            </Field>
            <Field label="Rendimento do FGTS (% a.a.)" hint="3% + TR.">
              <Input inputMode="decimal" value={rend} onChange={(e) => setRend(e.target.value)} />
            </Field>
          </div>
          <p className="text-sm text-muted">
            Saque-aniversário deste ano com esse saldo: <span className="amount font-semibold text-ink">{formatBRL(saqueAniversario(cents(saldo)))}</span>
          </p>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo={`Se for demitido em ${fim.ano} ${fim.ano === 1 ? 'ano' : 'anos'}, o saque-aniversário deixa de fora`}
            cents={Math.max(0, perde)}
            apoio={[
              { rotulo: 'Aniversário: já sacado', cents: fim.sacadoAcumuladoCents },
              { rotulo: 'Fica preso na conta', cents: fim.saldoAniversarioCents },
            ]}
            rodape="No saque-rescisão você recebe o saldo inteiro mais a multa de 40%. No aniversário, só a multa; o saldo continua preso."
          />
          <SectionTitle>Ano a ano</SectionTitle>
          <Card className="overflow-x-auto py-1" tabIndex={0} role="region" aria-label="Tabela ano a ano">
            <table className="w-full min-w-[420px] text-sm">
              <caption className="sr-only">Saque-aniversário e saque-rescisão por ano</caption>
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th scope="col" className="py-2 font-medium">Ano</th>
                  <th scope="col" className="py-2 text-right font-medium">Saque no ano</th>
                  <th scope="col" className="py-2 text-right font-medium">Demitido: aniversário</th>
                  <th scope="col" className="py-2 text-right font-medium">Demitido: rescisão</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.ano} className="border-t border-border">
                    <th scope="row" className="py-2 text-left font-normal">{l.ano}º</th>
                    <td className="amount py-2 text-right">{formatBRL(l.sacadoNoAnoCents)}</td>
                    <td className="amount py-2 text-right">{formatBRL(l.demitidoAniversarioCents)}</td>
                    <td className="amount py-2 text-right font-semibold">{formatBRL(l.demitidoRescisaoCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <p className="text-sm">
              Voltar do saque-aniversário para o saque-rescisão leva 2 anos: a troca só vale no 25º mês depois do pedido.
            </p>
          </Card>
        </>
      }
      aviso="Estimativa pela regra geral da Lei 8.036/1990. Considera o saldo atual como depósitos deste contrato e um saque por ano. Não inclui antecipação do saque-aniversário (empréstimo), que bloqueia parte do saldo."
    />
  );
}
