import type { TabelasFiscais } from './pacote';

/** Tabelas de 2026 usadas nos testes (as mesmas da migração inicial). */
export const T2026: TabelasFiscais = {
  inss: [
    { upToCents: 162100, rate: 0.075, deductionCents: 0 },
    { upToCents: 290284, rate: 0.09, deductionCents: 0 },
    { upToCents: 435427, rate: 0.12, deductionCents: 0 },
    { upToCents: 847555, rate: 0.14, deductionCents: 0 },
  ],
  irrf: [
    { upToCents: 242880, rate: 0, deductionCents: 0 },
    { upToCents: 282665, rate: 0.075, deductionCents: 18216 },
    { upToCents: 375105, rate: 0.15, deductionCents: 39416 },
    { upToCents: 466468, rate: 0.225, deductionCents: 67549 },
    { upToCents: null, rate: 0.275, deductionCents: 90873 },
  ],
  paramsIrrf: {
    dependentCents: 18959,
    simplifiedCents: 60720,
    reducer: { exemptUntilCents: 500000, phaseUntilCents: 735000, aCents: 97862, b: 0.133145 },
  },
};
