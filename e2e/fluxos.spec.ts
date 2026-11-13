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
// violações da CSP aparecem no console do navegador; o teste falha se houver alguma
function observarCsp(page: Page): string[] {
  const violacoes: string[] = [];
  page.on('console', (m) => {
    if (/content security policy/i.test(m.text())) violacoes.push(m.text().slice(0, 200));
  });
  return violacoes;
}
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
  const csp = observarCsp(page);
  await page.goto('/login');
  expect(await semRolagemHorizontal(page)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(csp).toEqual([]);
});

test('esqueci a senha: tela acessível e resposta que não revela se o e-mail existe', async ({ page }, info) => {
  const csp = observarCsp(page);
  await page.goto('/login');
  await page.getByRole('link', { name: /esqueci a senha/i }).click();
  await expect(page).toHaveURL(/\/login\/esqueci/);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel(/e-?mail/i).fill(`ninguem-${info.project.name}@teste.local`);
  await page.getByRole('button', { name: /enviar link/i }).click();
  await expect(page.getByRole('status')).toContainText(/se o e-mail tiver conta/i);
  expect(csp).toEqual([]);
});

test('login bloqueia depois de várias senhas erradas', async ({ page }, info) => {
  // roda num só tamanho de tela: o limite por IP (20 erros) é compartilhado por todos os testes
  test.skip(info.project.name !== 'mobile-390', 'basta um tamanho de tela');
  const alvo = `bloqueio-${info.project.name}@teste.local`;
  await page.goto('/login');
  const tentar = async () => {
    await page.getByLabel(/e-?mail/i).fill(alvo);
    await page.getByLabel(/senha/i).fill('senha-errada-123');
    await page.getByRole('button', { name: /entrar/i }).click();
    // o React limpa o formulário quando a resposta chega: é o sinal de que a tentativa terminou
    await expect(page.getByLabel(/senha/i)).toHaveValue('');
  };
  for (let i = 0; i < 5; i++) {
    await tentar();
    await expect(page.locator('form').getByRole('alert')).toContainText(/incorretos|muitas tentativas/i);
  }
  await tentar();
  await expect(page.locator('form').getByRole('alert')).toContainText(/muitas tentativas/i);
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
      const csp = observarCsp(page);
      await entrar(page);
      await page.goto(rota);
      // espera o conteúdo real (o esqueleto de carregamento não é o que se audita)
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(await semRolagemHorizontal(page)).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(csp).toEqual([]);
    });
  }
  test('viagem sem volta e sem orçamento é aceita; erro de formulário não apaga o que foi digitado', async ({ page }, info) => {
    await entrar(page);
    await page.goto('/mais/viagens/nova');
    const nome = `Teste ${info.project.name} ${Date.now()}`;
    await page.getByLabel(/nome da viagem/i).fill(nome);
    await page.getByLabel(/pessoas que dividem/i).fill('0'); // inválido: força o erro
    await page.getByRole('button', { name: /criar viagem/i }).click();
    await expect(page.locator('form').getByRole('alert')).toBeVisible();
    await expect(page.getByLabel(/nome da viagem/i)).toHaveValue(nome);
    await page.getByLabel(/pessoas que dividem/i).fill('2');
    await page.getByRole('button', { name: /criar viagem/i }).click(); // volta e orçamento em branco
    await expect(page.getByText(/viagem salva/i)).toBeVisible();
  });
  test('cadastra um gasto fixo (formulário de criação sem id)', async ({ page }, info) => {
    await entrar(page);
    await page.goto('/fixos');
    await page.getByText('Novo gasto fixo').click();
    const form = page.locator('form', { has: page.getByRole('button', { name: /cadastrar fixo/i }) });
    await form.getByLabel('Nome').fill(`Fixo ${info.project.name} ${Date.now()}`);
    await form.getByLabel('Valor').fill('179,32');
    await form.getByLabel('Dia do mês').fill('7');
    await form.getByRole('button', { name: /cadastrar fixo/i }).click();
    await expect(page.getByText(/fixo salvo/i)).toBeVisible();
  });
  test('registra um gasto', async ({ page }) => {
    await entrar(page);
    await page.goto('/gastos/novo');
    await page.getByLabel(/valor/i).first().fill('12,50');
    await page.getByRole('button', { name: /salvar|registrar/i }).click();
    await expect(page).toHaveURL(/\/gastos/);
  });
});
