import type { Faixa } from './holerite';

/** Valida faixas digitadas: limites crescentes, alíquota entre 0 e 100% e a última faixa sem teto. */
export function validarFaixas(faixas: Faixa[], opcoes: { ultimaSemTeto: boolean }): string | null {
  if (faixas.length === 0) return 'Informe ao menos uma faixa.';
  let anterior = 0;
  for (let i = 0; i < faixas.length; i++) {
    const f = faixas[i]!;
    if (!(f.rate >= 0 && f.rate <= 1)) return `Faixa ${i + 1}: a alíquota deve ficar entre 0% e 100%.`;
    if (f.deductionCents < 0) return `Faixa ${i + 1}: a parcela a deduzir não pode ser negativa.`;
    const ultima = i === faixas.length - 1;
    if (f.upToCents === null) {
      if (!ultima) return `Faixa ${i + 1}: só a última faixa pode ficar sem teto.`;
    } else {
      if (f.upToCents <= anterior) return `Faixa ${i + 1}: o limite deve ser maior que o da faixa anterior.`;
      anterior = f.upToCents;
    }
  }
  const ultimaSemTeto = faixas[faixas.length - 1]!.upToCents === null;
  if (opcoes.ultimaSemTeto && !ultimaSemTeto) return 'A última faixa do IRRF deve ficar sem limite (acima de tudo).';
  return null;
}

/** Tabela vencida: vigência de um ano anterior ao atual pede conferência. */
export const tabelaDesatualizada = (validaDesde: string, hoje: string): boolean =>
  Number(validaDesde.slice(0, 4)) < Number(hoje.slice(0, 4));
