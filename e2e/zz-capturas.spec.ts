import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { semearDadosDeExemplo } from './dados-capturas';

// Capturas das telas principais para conferência visual (artefato "capturas" do CI). Não valida nada além de carregar.
const email = process.env.E2E_EMAIL,
  senha = process.env.E2E_PASSWORD;

test.describe('capturas', () => {
  test.skip(!email || !senha, 'defina E2E_EMAIL e E2E_PASSWORD');
  test('telas principais', async ({ page }, info) => {
    test.skip(!['mobile-390', 'desktop-1280'].includes(info.project.name), 'só em dois tamanhos');
    test.setTimeout(600_000);
    const salvar = async (nome: string) => {
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `capturas/${info.project.name}-${nome}.png`, fullPage: true });
    };
    await page.goto('/login');
    await salvar('00-login');
    await page.goto('/login/esqueci');
    await salvar('00-esqueci');
    await page.goto('/login');
    await page.getByLabel(/e-?mail/i).fill(email!);
    await page.getByLabel(/senha/i).fill(senha!);
    await page.getByRole('button', { name: /entrar/i }).click();
    await page.waitForURL('/');
    await semearDadosDeExemplo(email!, senha!); // depois do 1º login: as carteiras e categorias padrão já existem
    // alguns lançamentos em dias diferentes para o mapa de calor e os widgets terem o que mostrar
    for (const [valor, nota, categoria] of [
      ['182,40', 'Mercado', 'Mercado'],
      ['64,90', 'Restaurante', 'Restaurantes'],
      ['23,00', 'Transporte', 'Transporte'],
    ] as const) {
      await page.goto('/gastos/novo');
      await page.getByRole('textbox', { name: /^valor/i }).first().fill(valor);
      await page.getByLabel(/descrição/i).fill(nota);
      await page.getByRole('button', { name: categoria, exact: true }).click();
      await page.getByRole('button', { name: /salvar lançamento/i }).click();
      await page.waitForURL(/\/gastos(\?|$)/, { timeout: 15_000 });
    }
    const telas = [
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
      ['/investimentos/simulador', '17-simulador'],
      ['/renda/simulador', '17b-holerite'],
      ['/mais/impostos', '18-impostos'],
      ['/gastos/importar', '19-importar'],
      ['/gastos/transferir', '20-transferir'],
      ['/gastos/lixeira', '21-lixeira'],
      ['/renda/historico', '22-renda-historico'],
      ['/pagina-que-nao-existe', '23-nao-encontrada'],
    ] as const;
    for (const [rota, nome] of telas) {
      await page.goto(rota);
      await salvar(nome);
    }
    // detalhe de um lançamento e de uma viagem (o primeiro de cada lista)
    await page.goto('/gastos');
    const primeiro = await page.locator('a[href^="/gastos/"][href*="-"]').first().getAttribute('href');
    if (primeiro) {
      await page.goto(primeiro);
      await salvar('24-lancamento');
    }
    await page.goto('/mais/viagens');
    const viagem = await page.locator('a[href^="/mais/viagens/"]').first().getAttribute('href');
    if (viagem) {
      await page.goto(viagem);
      await salvar('25-viagem');
    }
    // tema claro (opção): as três telas principais, com o tema forçado só nesta página
    // tema claro (opção): todas as telas, com o tema forçado só na página
    for (const [rota, nome] of telas.map(([r, n]) => [r, `claro-${n}`] as const)) {
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
