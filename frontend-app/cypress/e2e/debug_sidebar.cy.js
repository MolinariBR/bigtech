/**
 * Teste E2E: Diagnóstico de Navegação
 * 
 * Este arquivo foca em diagnosticar por que os links da sidebar não estão funcionando.
 */

describe('Diagnóstico de Navegação Sidebar', () => {
    const TEST_USER_EMAIL = 'user@bigtech.com'
    const TEST_USER_PASSWORD = 'user1234'

    beforeEach(() => {
        cy.clearSession()
        cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        cy.visit('/dashboard')
        cy.get('aside', { timeout: 15000 }).should('be.visible')
    })

    it('deve navegar para Relatórios ao clicar', () => {
        cy.log('Tentando clicar em Relatórios')

        // Garantir que o link está visível e clicar
        cy.contains('Relatórios').should('be.visible').click({ force: true })

        // URL deve mudar
        cy.url({ timeout: 10000 }).should('include', '/relatorios/consultas')

        // Conteúdo deve mudar
        cy.contains('Relatório de Consultas', { timeout: 10000 }).should('be.visible')
    })

    it('deve navegar para Crédito dentro do dropdown', () => {
        cy.log('Abrindo dropdown e clicando em Crédito')

        // Dropdown Consultas deve estar aberto ou clicável
        cy.contains('Consultas').click({ force: true })
        cy.wait(500)

        cy.contains('Crédito').should('be.visible').click({ force: true })

        cy.url({ timeout: 10000 }).should('include', '/consulta/credito')
        cy.contains('Consulta de Crédito', { timeout: 10000 }).should('be.visible')
    })
})
