import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Capturas das telas principais para conferência visual (artefato "capturas" do CI). Não valida nada além de carregar.
const email = process.env.E2E_EMAIL,
  senha = process.env.E2E_PASSWORD;

test.describe('capturas', () => {
  test.skip(!email || !senha, 'defina E2E_EMAIL e E2E_PASSWORD');
  test('telas principais', async ({ page }, info) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(info.project.name), 'só em dois tamanhos');
    test.setTimeout(240_000);
    const salvar = async (nome: string) => {
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `capturas/${info.project.name}-${nome}.png`, fullPage: true });
    };
    await page.goto('/login');
    await salvar('00-login');
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(senha!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/');
    // alguns lançamentos em dias diferentes para o mapa de calor e os widgets terem o que mostrar
    for (const [valor, nota] of [
      ['182,40', 'Mercado'],
      ['64,90', 'Restaurante'],
      ['23,00', 'Transporte'],
    ] as const) {
      await page.goto('/gastos/novo');
      await page.getByRole('textbox', { name: /^valor/i }).first().fill(valor);
      await page.getByLabel(/descrição/i).fill(nota);
      await page.getByRole('button', { name: /salvar lançamento/i }).click();
      await page.waitForURL(/\/gastos(\?|$)/, { timeout: 15_000 });
    }
    for (const [rota, nome] of [
      ['/', '01-inicio'],
      ['/gastos', '02-gastos'],
      ['/investimentos', '03-investimentos'],
      ['/orcamento', '04-orcamento'],
      ['/mais', '05-mais'],
      ['/renda', '06-renda'],
      ['/beneficios', '07-vrva'],
      ['/fluxo-de-caixa', '08-fluxo'],
      ['/relatorios', '09-relatorios'],
      ['/cartao', '10-cartao'],
      ['/fixos', '11-fixos'],
      ['/mais/viagens', '12-viagens'],
      ['/mais/carteiras', '13-carteiras'],
      ['/mais/categorias', '14-categorias'],
      ['/metas', '15-metas'],
      ['/gastos/novo', '16-novo'],
    ] as const) {
      await page.goto(rota);
      await salvar(nome);
    }
    // tema claro (opção): as três telas principais, com o tema forçado só nesta página
    for (const [rota, nome] of [
      ['/', 'claro-01-inicio'],
      ['/gastos', 'claro-02-gastos'],
      ['/investimentos', 'claro-03-investimentos'],
    ] as const) {
      await page.goto(rota);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      await page.waitForTimeout(600); // deixa as transições de cor terminarem antes da captura
      await salvar(nome);
      // contraste e demais regras de acessibilidade também no claro
      const violacoes = (await new AxeBuilder({ page }).analyze()).violations;
      expect(violacoes.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`), `axe no tema claro em ${rota}`).toEqual([]);
    }
  });
});
