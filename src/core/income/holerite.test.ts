import { describe, expect, it } from 'vitest';
import {
  calcularInss,
  calcularIrrf,
  dividirSalario,
  estimarHolerite,
  type Faixa,
  type ParamsIrrf,
} from './holerite';

const inss: Faixa[] = [
  { upToCents: 162100, rate: 0.075, deductionCents: 0 },
  { upToCents: 290284, rate: 0.09, deductionCents: 0 },
  { upToCents: 435427, rate: 0.12, deductionCents: 0 },
  { upToCents: 847555, rate: 0.14, deductionCents: 0 },
];
const irrf: Faixa[] = [
  { upToCents: 242880, rate: 0, deductionCents: 0 },
  { upToCents: 282665, rate: 0.075, deductionCents: 18216 },
  { upToCents: 375105, rate: 0.15, deductionCents: 39416 },
  { upToCents: 466468, rate: 0.225, deductionCents: 67549 },
  { upToCents: null, rate: 0.275, deductionCents: 90873 },
];
const params: ParamsIrrf = {
  dependentCents: 18959,
  simplifiedCents: 60720,
  reducer: { exemptUntilCents: 500000, phaseUntilCents: 735000, aCents: 97862, b: 0.133145 },
};

describe('INSS', () => {
  it('bruto R$ 10.000 paga o teto (R$ 988,10)', () =>
    expect(calcularInss(1_000_000, inss)).toBe(98_810));
  it('salário dentro da 1ª faixa', () => expect(calcularInss(100_000, inss)).toBe(7_500));
  it('zero para salário zero', () => expect(calcularInss(0, inss)).toBe(0));
});
describe('IRRF', () => {
  it('bruto R$ 10.000: sem redutor', () => {
    const h = estimarHolerite({ grossCents: 1_000_000, inss, irrf, paramsIrrf: params });
    expect(h.inssCents).toBe(98_810);
    expect(h.irrfCents).toBe(156_954);
    expect(h.netCents).toBe(744_236);
  });
  it('isento até R$ 5.000 pelo redutor', () => {
    expect(estimarHolerite({ grossCents: 500_000, inss, irrf, paramsIrrf: params }).irrfCents).toBe(
      0,
    );
  });
  it('redutor da faixa de transição reduz o imposto', () => {
    const inssC = calcularInss(600_000, inss);
    const sem = calcularIrrf({
      grossCents: 600_000,
      inssCents: inssC,
      dependentes: 0,
      faixas: irrf,
      params: { ...params, reducer: undefined },
    });
    const com = calcularIrrf({
      grossCents: 600_000,
      inssCents: inssC,
      dependentes: 0,
      faixas: irrf,
      params,
    });
    expect(sem - com).toBe(17_975);
  });
  it('dependentes reduzem a base', () => {
    const inssC = calcularInss(1_000_000, inss);
    const zero = calcularIrrf({
      grossCents: 1_000_000,
      inssCents: inssC,
      dependentes: 0,
      faixas: irrf,
      params,
    });
    const dois = calcularIrrf({
      grossCents: 1_000_000,
      inssCents: inssC,
      dependentes: 2,
      faixas: irrf,
      params,
    });
    expect(dois).toBeLessThan(zero);
  });
});
describe('adiantamento', () => {
  it('40% do bruto no adiantamento; o resto do líquido no final', () => {
    const h = estimarHolerite({ grossCents: 1_000_000, inss, irrf, paramsIrrf: params });
    const d = dividirSalario(h, 40);
    expect(d.adiantamentoCents).toBe(400_000);
    expect(d.adiantamentoCents + d.finalCents).toBe(h.netCents);
  });
});

import { estimar13o, estimarFerias } from './holerite';
describe('13º, férias e pensão', () => {
  const inss = [
    { upToCents: 162100, rate: 0.075, deductionCents: 0 },
    { upToCents: 290284, rate: 0.09, deductionCents: 0 },
    { upToCents: 435427, rate: 0.12, deductionCents: 0 },
    { upToCents: 847555, rate: 0.14, deductionCents: 0 },
  ];
  const irrf = [
    { upToCents: 242880, rate: 0, deductionCents: 0 },
    { upToCents: 282665, rate: 0.075, deductionCents: 18216 },
    { upToCents: 375105, rate: 0.15, deductionCents: 39416 },
    { upToCents: 466468, rate: 0.225, deductionCents: 67549 },
    { upToCents: null, rate: 0.275, deductionCents: 90873 },
  ];
  const paramsIrrf = { dependentCents: 18959, simplifiedCents: 60720, reducer: { exemptUntilCents: 500000, phaseUntilCents: 735000, aCents: 97862, b: 0.133145 } };
  const base = { inss, irrf, paramsIrrf };

  it('1ª parcela do 13º é metade do bruto, sem descontos', () => {
    const r = estimar13o({ ...base, grossCents: 1_000_000 });
    expect(r.primeiraCents).toBe(500_000);
    expect(r.primeiraCents + r.segundaCents).toBe(r.holerite.netCents);
  });
  it('13º sem o redutor paga mais IRRF que o mensal', () => {
    const mensal = estimarHolerite({ ...base, grossCents: 1_000_000 });
    expect(estimar13o({ ...base, grossCents: 1_000_000 }).holerite.irrfCents).toBeGreaterThanOrEqual(mensal.irrfCents);
  });
  it('férias somam 1/3 sobre os dias gozados', () => {
    const h = estimarFerias({ ...base, grossMensalCents: 900_000, dias: 30 });
    expect(h.grossCents).toBe(1_200_000);
    expect(estimarFerias({ ...base, grossMensalCents: 900_000, dias: 15 }).grossCents).toBe(600_000);
  });
  it('pensão alimentícia reduz o IRRF', () => {
    const sem = estimarHolerite({ ...base, grossCents: 800_000 });
    const com = estimarHolerite({ ...base, grossCents: 800_000, pensaoCents: 150_000 });
    expect(com.irrfCents).toBeLessThan(sem.irrfCents);
    expect(com.inssCents).toBe(sem.inssCents);
  });
  it('dependentes reduzem o IRRF', () => {
    const sem = estimarHolerite({ ...base, grossCents: 800_000 });
    expect(estimarHolerite({ ...base, grossCents: 800_000, dependentes: 2 }).irrfCents).toBeLessThanOrEqual(sem.irrfCents);
  });
});
