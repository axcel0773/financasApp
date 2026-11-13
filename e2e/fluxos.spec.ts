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
    await page.waitForLoadState('networkidle'); // espera hidratar: enviar antes disso recarrega a página
    await page.getByText('Novo gasto fixo').click();
    const form = page.locator('form', { has: page.getByRole('button', { name: /cadastrar fixo/i }) });
    await form.getByLabel('Nome').fill(`Fixo ${info.project.name} ${Date.now()}`);
    await form.getByLabel('Valor').fill('179,32');
    await form.getByLabel('Dia do mês').fill('7');
    const posts: string[] = [];
    const erros: string[] = [];
    page.on('console', (m) => m.type() === 'error' && erros.push(m.text().slice(0, 200)));
    page.on('pageerror', (e) => erros.push(String(e).slice(0, 200)));
    page.on('response', (r) => {
      if (r.request().method() === 'POST') posts.push(`${r.status()} ${r.url()}`);
    });
    await form.getByRole('button', { name: /cadastrar fixo/i }).click();
    const toast = page.getByText(/fixo salvo/i);
    const alerta = form.getByRole('alert');
    try {
      await expect(toast.or(alerta)).toBeVisible({ timeout: 15_000 });
    } catch (e) {
      const estado = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('form button[type=submit]')].map((b) => (b as HTMLButtonElement).textContent);
        const alertas = [...document.querySelectorAll('[role=alert]')].map((a) => a.textContent);
        return { btns, alertas };
      });
      throw new Error(`sem retorno. POSTs: ${JSON.stringify(posts)}; console: ${JSON.stringify(erros)}; ${JSON.stringify(estado)}; url: ${page.url()}\n${String(e)}`);
    }
    // se veio erro, mostra o texto dele na falha
    expect(await alerta.count() ? await alerta.first().textContent() : null).toBeNull();
    await expect(toast).toBeVisible();
  });
  test('registra um gasto', async ({ page }) => {
    await entrar(page);
    await page.goto('/gastos/novo');
    await page.getByLabel(/valor/i).first().fill('12,50');
    await page.getByRole('button', { name: /salvar|registrar/i }).click();
    await expect(page).toHaveURL(/\/gastos/);
  });
});

// Varredura de formulários: preenche cada formulário de criação/edição com valores plausíveis, envia e
// confirma que a resposta nunca é um erro técnico (campo faltando no schema, exceção do banco etc.).
const ENVIAR = /^(criar|cadastrar|adicionar|salvar|registrar|lançar|transferir|aportar|resgatar|creditar|registrar|definir|atualizar)/i;
const TECNICO = /invalid input|expected (string|number|object)|received|undefined|\brequired\b|zod|\[object|nan\b|não foi possível concluir/i;

test.describe('formulários', () => {
  test.skip(!email || !senha, 'defina E2E_EMAIL e E2E_PASSWORD');
  const rotas = [
    '/fixos',
    '/mais/carteiras',
    '/mais/categorias',
    '/metas',
    '/investimentos',
    '/orcamento',
    '/renda',
    '/beneficios',
    '/gastos/transferir',
    '/cartao',
    '/mais/impostos',
    '/mais',
    '/mais/viagens/nova',
  ];
  for (const rota of rotas) {
    test(`${rota}: nenhum formulário devolve erro técnico`, async ({ page }, info) => {
      test.skip(info.project.name !== 'mobile-390', 'basta um tamanho de tela');
      test.setTimeout(120_000);
      await entrar(page);
      const seletor = 'form:has(button[type="submit"])';
      await page.goto(rota);
      const total = await page.locator(seletor).count();
      const problemas: string[] = [];
      for (let i = 0; i < total; i++) {
        await page.goto(rota);
        await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
        const form = page.locator(seletor).nth(i);
        const botao = form.locator('button[type="submit"]').first();
        const rotulo = ((await botao.textContent()) ?? '').trim();
        if (!ENVIAR.test(rotulo)) continue;
        // preenche cada campo visível conforme o tipo
        const campos = await form.locator('input, select, textarea').all();
        for (const c of campos) {
          const tipo = (await c.getAttribute('type')) ?? '';
          if (['hidden', 'checkbox', 'radio', 'file', 'password', 'color', 'date', 'submit'].includes(tipo)) continue;
          if (!(await c.isVisible()) || !(await c.isEnabled())) continue;
          const tag = await c.evaluate((el) => el.tagName.toLowerCase());
          if (tag === 'select') {
            const valores = await c.locator('option').evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
            if (valores[0]) await c.selectOption(valores[0]);
            continue;
          }
          const modo = (await c.getAttribute('inputmode')) ?? '';
          if ((await c.inputValue()) !== '') continue; // já tem valor padrão
          await c.fill(modo === 'numeric' ? '5' : modo === 'decimal' ? '10,00' : `Teste ${Date.now() % 100000}`);
        }
        await botao.click();
        await page.waitForTimeout(1500); // resposta da Server Action
        const alerta = form.getByRole('alert');
        if ((await alerta.count()) > 0) {
          const t = ((await alerta.first().textContent()) ?? '').trim();
          if (TECNICO.test(t)) problemas.push(`[${rotulo}] ${t}`);
        }
      }
      expect(problemas, `formulários com erro técnico em ${rota}`).toEqual([]);
    });
  }
});
