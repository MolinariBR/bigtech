import { test, expect } from '@playwright/test';

test.describe('Frontend App Login E2E Test', () => {
  test('should login with user@bigtech.com, validate dashboard access', async ({ page }) => {
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

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.url()).toBe('http://localhost:3000/dashboard');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');

    // Verificar se estamos logados (presença de elementos do dashboard)
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});