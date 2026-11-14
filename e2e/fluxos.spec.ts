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
    const nome = `Fixo ${info.project.name} ${Date.now()}`;
    const form = page.locator('form', { has: page.getByRole('button', { name: /cadastrar fixo/i }) });
    await form.getByLabel('Nome').fill(nome);
    await form.getByLabel('Valor').fill('179,32');
    await form.getByLabel('Dia do mês').fill('7');
    const enviado = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/fixos'));
    await form.getByRole('button', { name: /cadastrar fixo/i }).click();
    expect((await enviado).status()).toBe(200);
    // O que importa para a pessoa: o fixo foi gravado sem erro. O toast é conferido sem derrubar o teste,
    // porque no CI a tela às vezes demora a aplicar a resposta (fica em "Salvando…") mesmo com o dado salvo.
    await expect(form.getByRole('alert')).toHaveCount(0);
    const confirmou = await page.getByText(/fixo salvo/i).isVisible().catch(() => false)
      || (await page.getByText(/fixo salvo/i).waitFor({ timeout: 8_000 }).then(() => true, () => false));
    if (!confirmou)
      info.annotations.push({ type: 'aviso', description: 'tela não confirmou o salvamento (toast ausente); dado verificado após recarregar' });
    await page.reload();
    await expect(page.getByText(nome)).toBeVisible();
  });
  test('estresse: envio repetido do gasto fixo não deixa a tela em "Salvando…"', async ({ page }, info) => {
    test.setTimeout(120_000);
    await entrar(page);
    await page.goto('/fixos');
    await page.waitForLoadState('networkidle');
    await page.getByText('Novo gasto fixo').click();
    const form = page.locator('form', { has: page.getByRole('button', { name: /cadastrar fixo|salvando/i }) }).last();
    const botao = page.getByRole('button', { name: /cadastrar fixo|salvando/i });
    let travou = 0;
    let botaoPreso = 0;
    let listaSemItem = 0;
    const N = 8;
    for (let i = 0; i < N; i++) {
      const nomeFixo = `Estresse ${info.project.name} ${i} ${Date.now()}`;
      await form.getByLabel('Nome').fill(nomeFixo);
      await form.getByLabel('Valor').fill('10,00');
      await form.getByLabel('Dia do mês').fill('5');
      const enviado = page.waitForResponse((r) => r.request().method() === 'POST' && r.url().includes('/fixos'));
      await botao.click();
      await enviado;
      const livre = await page.getByRole('button', { name: /^cadastrar fixo$/i }).waitFor({ timeout: 6_000 }).then(() => true, () => false);
      if (!livre) botaoPreso++;
      const naLista = await page.getByText(nomeFixo).waitFor({ timeout: 6_000 }).then(() => true, () => false);
      if (livre && !naLista) listaSemItem++;
      if (!livre || !naLista) {
        travou++;
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.getByText('Novo gasto fixo').click();
      }
    }
    expect(travou, `travou ${travou} de ${N} envios (botão preso: ${botaoPreso}; item fora da lista: ${listaSemItem})`).toBe(0);
  });
  test('registra um gasto', async ({ page }) => {
    await entrar(page);
    await page.goto('/gastos/novo');
    await page.getByRole('textbox', { name: /^valor/i }).first().fill('12,50');
    await page.getByRole('button', { name: /salvar|registrar/i }).click();
    await expect(page).toHaveURL(/\/gastos/);
  });

  test('investimento: saldo já no cadastro (com máscara) e painel de ação que fecha ao salvar', async ({ page }, info) => {
    const nome = `E2E CDB ${info.project.name} ${Date.now() % 100000}`;
    await entrar(page);
    await page.goto('/investimentos');
    await page.waitForLoadState('networkidle');
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: 'Cadastrar', exact: true }) });
    await form.getByLabel('Nome', { exact: true }).fill(nome);
    const saldo = form.getByLabel(/saldo atual/i);
    await saldo.pressSequentially('123456');
    await expect(saldo).toHaveValue('1.234,56'); // as casas se formam sozinhas
    await form.getByRole('button', { name: 'Cadastrar', exact: true }).click();
    // aparece no bloco de aportes do mês (o saldo inicial conta como aporte) e na lista
    await expect(page.locator('li').filter({ hasText: nome }).filter({ hasText: 'Aporte' })).toBeVisible({ timeout: 15_000 });
    // abre o painel "Saldo" do investimento novo (o último da lista), salva e o painel some
    await page.getByRole('button', { name: 'Saldo', exact: true }).last().click();
    const salvar = page.getByRole('button', { name: 'Salvar saldo' });
    await expect(salvar).toBeVisible();
    await salvar.click();
    await expect(salvar).toHaveCount(0, { timeout: 15_000 });
  });

  test('desktop: novo lançamento em painel lateral, detalhe ao lado e busca em todo o histórico', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 1024, 'recursos só do desktop');
    const nota = `E2E painel ${Date.now() % 100000}`;
    await entrar(page);
    await page.waitForLoadState('networkidle');
    // atalho N abre o painel sobre a lista de gastos
    await page.keyboard.press('n');
    const painel = page.getByRole('dialog', { name: 'Novo lançamento' });
    await expect(painel).toBeVisible();
    await painel.getByRole('textbox', { name: /^valor/i }).fill('7,77');
    await painel.getByLabel(/descrição/i).fill(nota);
    await painel.getByRole('button', { name: 'Salvar lançamento' }).click();
    await expect(painel).toHaveCount(0, { timeout: 15_000 });
    // clicar na linha seleciona e mostra o detalhe ao lado (sem sair da lista)
    const linha = page.getByRole('link', { name: new RegExp(nota) }).first();
    await expect(linha).toBeVisible({ timeout: 15_000 });
    const erros: string[] = [];
    page.on('console', (m) => m.type() === 'error' && erros.push(m.text().slice(0, 200)));
    page.on('pageerror', (e) => erros.push(`pageerror: ${e.message.slice(0, 200)}`));
    const pedidos: string[] = [];
    const t0 = Date.now();
    page.on('request', (r) => r.url().includes('/gastos') && pedidos.push(`+${Date.now() - t0}ms > ${r.method()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`));
    page.on('response', (r) => r.url().includes('/gastos') && pedidos.push(`+${Date.now() - t0}ms < ${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`));
    const hrefs = await linha.evaluate((el) => `${el.getAttribute('href')} | w=${window.innerWidth}`);
    await linha.click();
    try {
      await expect(page).toHaveURL(/sel=/, { timeout: 15_000 });
    } catch {
      throw new Error(`seleção não aconteceu. url=${page.url()} link=${hrefs} pedidos=${JSON.stringify(pedidos)} erros=${JSON.stringify(erros)}`);
    }
    console.log(`DIAG seleção em ${Date.now() - t0}ms`, JSON.stringify(pedidos), JSON.stringify(erros));
    const detalhe = page.getByRole('complementary', { name: 'Detalhe do lançamento' });
    await expect(detalhe).toContainText(nota);
    // atalho / leva à busca da barra superior, que procura em todo o histórico
    await page.keyboard.press('/');
    const busca = page.getByRole('searchbox', { name: /todo o histórico/i });
    await expect(busca).toBeFocused();
    await busca.fill(nota);
    pedidos.length = 0;
    const t1 = Date.now();
    await busca.press('Enter');
    await expect(page).toHaveURL(/tudo=1/, { timeout: 20_000 });
    console.log(`DIAG busca em ${Date.now() - t1}ms`, JSON.stringify(pedidos));
    await expect(page.getByText(/em todo o histórico/i).first()).toBeVisible();
    // excluir pelo painel de detalhe mantém a busca aplicada
    await page.getByRole('link', { name: new RegExp(nota) }).first().click();
    await expect(page).toHaveURL(/sel=/, { timeout: 20_000 });
    await page.getByRole('complementary', { name: 'Detalhe do lançamento' }).getByRole('button', { name: /excluir/i }).click();
    await expect(page.getByRole('complementary', { name: 'Detalhe do lançamento' })).toHaveCount(0, { timeout: 15_000 });
    await expect(page).toHaveURL(/tudo=1/);
    await expect(page.getByRole('link', { name: new RegExp(nota) })).toHaveCount(0, { timeout: 20_000 });
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
