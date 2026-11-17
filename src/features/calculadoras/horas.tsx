'use client';

import { useMemo, useState } from 'react';
import { descreverTempo, precoEmTempo, valorDaHora } from '@/core/calculadoras/horas';
import { formatBRL } from '@/core/shared/money';
import { Card } from '@/ui/primitives/card';
import { Field, Input, MoneyInput } from '@/ui/primitives/fields';
import { Destaque, LayoutCalculadora } from './blocos';
import { br1, campo, cents, num } from './campos';

export function CalculadoraHoras({ liquidoMensalCents }: { liquidoMensalCents: number }) {
  const [preco, setPreco] = useState('');
  const [liquido, setLiquido] = useState(campo(liquidoMensalCents));
  const [horas, setHoras] = useState('40');
  const h = Math.min(80, Math.max(1, num(horas, 40)));
  const hora = valorDaHora(cents(liquido), h);
  const t = useMemo(() => precoEmTempo(cents(preco), cents(liquido), h), [preco, liquido, h]);
  return (
    <LayoutCalculadora
      campos={
        <>
          <Field label="Preço da compra">
            <MoneyInput autoFocus value={preco} onChange={(e) => setPreco(e.target.value)} />
          </Field>
          <Field label="Salário líquido por mês" hint="Vem da estimativa do seu holerite.">
            <MoneyInput value={liquido} onChange={(e) => setLiquido(e.target.value)} />
          </Field>
          <Field label="Horas de trabalho por semana">
            <Input inputMode="numeric" value={horas} onChange={(e) => setHoras(e.target.value)} />
          </Field>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo={cents(preco) > 0 ? `${formatBRL(cents(preco))} custam` : 'Digite um preço'}
            texto={t && cents(preco) > 0 ? descreverTempo(t) : '—'}
            apoio={
              t && cents(preco) > 0
                ? [
                    { rotulo: 'Em horas', texto: `${br1(t.horas)} h` },
                    { rotulo: 'Do mês de trabalho', texto: `${br1(t.meses * 100)}%` },
                  ]
                : []
            }
          />
          <Card>
            <p className="text-sm">
              Uma hora do seu trabalho vale <span className="amount font-semibold">{formatBRL(hora)}</span> líquidos
              ({h * 5} h por mês).
            </p>
          </Card>
        </>
      }
      aviso="Conta com o salário líquido e a jornada contratada. Não inclui tempo de deslocamento."
    />
  );
}
