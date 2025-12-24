// Testes E2E para TASK-USER-005: Criar Testes E2E e Integração para Fluxo Completo de Cadastro
// Simular registro completo: navegar para /register, preencher formulário, submeter, verificar criação

describe('User Registration E2E', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should register a new user successfully', () => {
    // Preencher formulário
    cy.get('input[name="name"]').type('João Silva');
    cy.get('input[name="email"]').type('joao@exemplo.com');
    cy.get('input[name="password"]').type('Password123');
    cy.get('input[name="confirmPassword"]').type('Password123');
    cy.get('input[name="company"]').type('Empresa Exemplo');
    cy.get('input[name="acceptTerms"]').check();

    // Interceptar chamada da API
    cy.intercept('POST', '/api/auth/register', { success: true, tenantCreated: true }).as('register');

    // Submeter formulário
    cy.get('button[type="submit"]').click();

    // Aguardar resposta da API
    cy.wait('@register');

    // Verificar modal de sucesso
    cy.contains('Registro Realizado com Sucesso!').should('be.visible');

    // Clicar em "Ir para Login"
    cy.contains('Ir para Login').click();

    // Verificar redirecionamento para login
    cy.url().should('include', '/login');
  });

  it('should show validation errors for invalid data', () => {
    // Tentar submeter sem dados
    cy.get('button[type="submit"]').click();

    // Verificar mensagens de erro
    cy.contains('Nome é obrigatório').should('be.visible');
    cy.contains('Email é obrigatório').should('be.visible');
    cy.contains('Senha deve ter pelo menos 8 caracteres').should('be.visible');
    cy.contains('Aceite os termos de uso').should('be.visible');
  });

  it('should navigate to login page', () => {
    cy.contains('Já tem conta? Faça login').click();
    cy.url().should('include', '/login');
  });
});