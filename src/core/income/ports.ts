import type { Competencia, IsoDate } from '../shared/competencia';
import type { Cents } from '../shared/money';
import type { FonteRenda, NovoPrevisto, Recebimento } from './domain';
import type { Faixa, ParamsIrrf } from './holerite';

export interface TabelasImposto {
  inss: Faixa[];
  irrf: Faixa[];
  paramsIrrf: ParamsIrrf;
  validaDesde: { inss: IsoDate; irrf: IsoDate };
}
export interface IncomeRepository {
  fontes(): Promise<FonteRenda[]>;
  salvarFonte(f: Omit<FonteRenda, 'id'> & { id?: string }): Promise<void>;
  recebimentos(de: Competencia, ate: Competencia): Promise<Recebimento[]>;
  inserirPrevistos(p: NovoPrevisto[]): Promise<void>; // idempotente (source, competencia, kind)
  confirmar(
    id: string,
    d: {
      receivedOn: IsoDate;
      grossCents: Cents;
      deductionsCents: Cents;
      netCents: Cents;
      walletId: string | null;
    },
  ): Promise<void>;
  inserirExtra(d: {
    sourceId: string;
    competencia: Competencia;
    receivedOn: IsoDate;
    netCents: Cents;
    note: string | null;
    walletId: string | null;
  }): Promise<void>;
  tabelas(): Promise<TabelasImposto | null>;
}
