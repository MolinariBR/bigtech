import { test, expect } from '@playwright/test';

test.describe('Admin Login/Logout E2E Test', () => {
  test('should login, navigate pages, then logout', async ({ page }) => {
    // Acessar página de login do admin local
    await page.goto('http://localhost:3001/login');

    // Tirar screenshot para debug
    await page.screenshot({ path: 'login-page.png' });

    // Verificar se estamos na página de login
    await expect(page.locator('h3')).toContainText('Admin Login');

    // Preencher credenciais
    await page.fill('input[type="email"]', 'admin2@bigtech.com');
    await page.fill('input[type="password"]', 'admin123');

    // Clicar em login
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('**/');
    await expect(page.url()).toBe('http://localhost:3001/');

    // Verificar se estamos logados (presença de elementos do dashboard)
    await expect(page.locator('h1')).toContainText('Dashboard Administrativo');

    // Tirar screenshot do dashboard
    await page.screenshot({ path: 'dashboard.png' });

    // Navegar para Tenants
    await page.click('text=Gerenciar Tenants');
    await page.waitForURL('**/tenants');
    await expect(page.url()).toContain('/tenants');
    await expect(page.locator('h1')).toContainText('Gestão de Tenants');

    // Voltar ao dashboard
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);

    // Navegar para Plugins
    await page.click('text=Gerenciar Plugins');
    await page.waitForURL('**/plugins');
    await expect(page.url()).toContain('/plugins');
    await expect(page.locator('h1')).toContainText('Gestão de Plugins');

    // Voltar ao dashboard
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);

    // Navegar para Minha Conta
    // Nota: Não há link direto no dashboard, assumindo navegação manual ou menu
    await page.goto('http://localhost:3001/minha-conta');
    await expect(page.url()).toContain('/minha-conta');
    await expect(page.locator('h1')).toContainText('Minha Conta');

    // Voltar ao dashboard
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);

    // Navegar para Billing
    await page.click('text=Monitorar Billing');
    await page.waitForURL('**/billing');
    await expect(page.url()).toContain('/billing');
    await expect(page.locator('h1')).toContainText('Monitoramento de Billing');

    // Voltar ao dashboard
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);

    // Navegar para Audit
    await page.click('text=Ver Auditoria');
    await page.waitForURL('**/audit');
    await expect(page.url()).toContain('/audit');
    // Nota: Página de audit pode não carregar conteúdo devido a API

    // Voltar ao dashboard
    await page.goto('http://localhost:3001');
    await page.waitForTimeout(1000);

    // Fazer logout
    await page.click('button:has-text("Logout")');

    // Aguardar redirecionamento para login
    await page.waitForURL('**/login');
    await expect(page.url()).toContain('/login');

    // Verificar se token foi removido
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(tokenAfterLogout).toBeNull();

    // Verificar se estamos na página de login novamente
    await expect(page.locator('h3')).toContainText('Admin Login');
  });
});