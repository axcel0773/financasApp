import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const email = process.env.E2E_EMAIL,
  senha = process.env.E2E_PASSWORD;

async function entrar(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/e-?mail/i).fill(email!);
  await page.getByLabel(/senha/i).fill(senha!);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL('/');
}
// devolve true se não há rolagem horizontal; senão, lista os elementos que passam da largura (diagnóstico)
const semRolagemHorizontal = (page: Page) =>
  page.evaluate(() => {
    const largura = window.innerWidth;
    if (document.documentElement.scrollWidth <= largura) return true;
    const culpados = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > largura + 1)
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(el.getBoundingClientRect().right)}`);
    return `scrollWidth=${document.documentElement.scrollWidth} innerWidth=${largura}: ${culpados.join(' | ')}`;
  });

test('login é acessível e sem rolagem horizontal', async ({ page }) => {
  await page.goto('/login');
  expect(await semRolagemHorizontal(page)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('rota protegida redireciona ao login', async ({ page }) => {
  await page.goto('/gastos');
  await expect(page).toHaveURL(/\/login/);
});

test.describe('autenticado', () => {
  test.skip(!email || !senha, 'defina E2E_EMAIL e E2E_PASSWORD');
  for (const rota of [
    '/',
    '/gastos',
    '/renda',
    '/beneficios',
    '/orcamento',
    '/investimentos',
    '/mais',
  ]) {
    test(`${rota}: sem violações axe e sem rolagem horizontal`, async ({ page }) => {
      await entrar(page);
      await page.goto(rota);
      // espera o conteúdo real (o esqueleto de carregamento não é o que se audita)
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(await semRolagemHorizontal(page)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
  }
  test('registra um gasto', async ({ page }) => {
    await entrar(page);
    await page.goto('/gastos/novo');
    await page.getByLabel(/valor/i).first().fill('12,50');
    await page.getByRole('button', { name: /salvar|registrar/i }).click();
    await expect(page).toHaveURL(/\/gastos/);
  });
});
