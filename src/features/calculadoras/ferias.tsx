'use client';

import { useMemo, useState } from 'react';
import { feriadosNacionais, melhoresJanelas } from '@/core/calculadoras/ferias';
import { dataCurta, diaDaSemana } from '@/ui/format';
import { Chip } from '@/ui/primitives/chip';
import { Card, SectionTitle } from '@/ui/primitives/card';
import { Destaque, LayoutCalculadora, Segmentos } from './blocos';

export function CalculadoraFerias({ hoje }: { hoje: string }) {
  const anoAtual = Number(hoje.slice(0, 4));
  const [ano, setAno] = useState(String(anoAtual + 1));
  const [dias, setDias] = useState('10');
  const [facultativos, setFacultativos] = useState<'sim' | 'nao'>('sim');
  const feriados = useMemo(() => feriadosNacionais(Number(ano)), [ano]);
  const janelas = useMemo(
    () =>
      melhoresJanelas({
        ano: Number(ano),
        dias: Number(dias),
        feriados,
        comFacultativos: facultativos === 'sim',
        aPartirDe: Number(ano) === anoAtual ? hoje : undefined,
      }),
    [ano, dias, feriados, facultativos, anoAtual, hoje],
  );
  const melhor = janelas[0];
  return (
    <LayoutCalculadora
      campos={
        <>
          <p className="text-sm font-medium">Ano</p>
          <Segmentos
            rotulo="Ano"
            valor={ano}
            aoMudar={setAno}
            opcoes={[anoAtual, anoAtual + 1].map((a) => ({ valor: String(a), rotulo: String(a) }))}
          />
          <p className="text-sm font-medium">Dias de férias</p>
          <Segmentos
            rotulo="Dias de férias"
            valor={dias}
            aoMudar={setDias}
            opcoes={['5', '10', '14', '15', '20', '30'].map((d) => ({ valor: d, rotulo: `${d} dias` }))}
          />
          <p className="text-sm font-medium">Carnaval e Corpus Christi são folga na sua empresa?</p>
          <Segmentos
            rotulo="Pontos facultativos"
            valor={facultativos}
            aoMudar={setFacultativos}
            opcoes={[
              { valor: 'sim', rotulo: 'Sim' },
              { valor: 'nao', rotulo: 'Não' },
            ]}
          />
          <p className="text-xs text-muted">
            A CLT permite dividir em até 3 períodos: um com pelo menos 14 dias e os outros com pelo menos 5.
          </p>
          <SectionTitle>Feriados nacionais de {ano}</SectionTitle>
          <ul className="space-y-1 text-sm">
            {feriados
              .filter((f) => facultativos === 'sim' || !f.facultativo)
              .map((f) => (
                <li key={f.data} className="flex justify-between gap-3">
                  <span>{f.nome}</span>
                  <span className="text-muted">{diaDaSemana(f.data)}</span>
                </li>
              ))}
          </ul>
        </>
      }
      resultado={
        <>
          <Destaque
            rotulo={melhor ? `Melhor saída com ${dias} dias de férias` : 'Nenhuma data possível'}
            texto={melhor ? `${melhor.diasDeFolga} dias de folga` : '—'}
            apoio={
              melhor
                ? [
                    { rotulo: 'Férias começam', texto: dataCurta(melhor.inicio) },
                    { rotulo: 'Dias a mais', texto: `+${melhor.ganho}` },
                  ]
                : []
            }
          />
          <SectionTitle>Melhores datas</SectionTitle>
          <Card className="py-1">
            {janelas.map((j, i) => (
              <div key={j.inicio} className="border-b border-border py-3 last:border-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {i + 1}. Férias de {dataCurta(j.inicio)} a {dataCurta(j.fim)}
                  <Chip tom="ok">{j.diasDeFolga} dias de folga</Chip>
                </p>
                <p className="text-xs text-muted">
                  Folga de {diaDaSemana(j.folgaInicio)} a {diaDaSemana(j.folgaFim)}
                  {j.feriados.length > 0 && ` · ${j.feriados.join(', ')}`}
                </p>
              </div>
            ))}
          </Card>
        </>
      }
      aviso="Só feriados nacionais; inclua à mão os estaduais e municipais da sua cidade. Considera jornada de segunda a sexta. As férias não podem começar nos dois dias antes de feriado ou do domingo (CLT, art. 134, §3º), por isso o início fica entre segunda e quinta."
    />
  );
}
