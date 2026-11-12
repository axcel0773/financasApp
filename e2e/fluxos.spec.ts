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
const semRolagemHorizontal = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

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
