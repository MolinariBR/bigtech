import { test, expect } from '@playwright/test';

test.describe('Frontend App Login E2E Test', () => {
  test('should login with user@bigtech.com, validate dashboard access, and logout', async ({ page }) => {
    // Acessar página de login diretamente
    await page.goto('http://localhost:3000/login');

    // Aguardar carregamento
    await page.waitForLoadState('networkidle');

    // Verificar se estamos na página de login
    await expect(page.locator('h3')).toContainText('BigTech Login');

    // Preencher credenciais
    await page.fill('input[type="email"]', 'user@bigtech.com');
    await page.fill('input[type="password"]', 'user1234');

    // Clicar em login
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento para a página inicial (/) primeiro
    await page.waitForURL('**/');
    await expect(page.url()).toBe('http://localhost:3000/');

    // Verificar se o token foi armazenado no localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    // Navegar manualmente para o dashboard (simulando o redirecionamento automático)
    await page.goto('http://localhost:3000/dashboard');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');

    // Verificar se estamos no dashboard
    await expect(page.url()).toBe('http://localhost:3000/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Agora fazer logout clicando no botão "Sair" na sidebar
    await page.click('button:has-text("Sair")');

    // Aguardar redirecionamento para login
    await page.waitForURL('**/login');
    await expect(page.url()).toBe('http://localhost:3000/login');

    // Verificar se estamos na página de login novamente
    await expect(page.locator('h3')).toContainText('BigTech Login');
  });
});