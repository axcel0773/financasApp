import { expect, test } from '@playwright/test';

// Capturas das telas principais para conferência visual (artefato "capturas" do CI). Não valida nada além de carregar.
const email = process.env.E2E_EMAIL,
  senha = process.env.E2E_PASSWORD;

test.describe('capturas', () => {
  test.skip(!email || !senha, 'defina E2E_EMAIL e E2E_PASSWORD');
  test('telas principais', async ({ page }, info) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(info.project.name), 'só em dois tamanhos');
    test.setTimeout(120_000);
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
    ] as const) {
      await page.goto(rota);
      await salvar(nome);
    }
  });
});
