// ***********************************************
// Custom commands for Cypress tests
// ***********************************************

/**
 * Comando customizado para limpar sessão (localStorage + cookies)
 */
Cypress.Commands.add('clearSession', () => {
    cy.clearLocalStorage()
    cy.clearCookies()
})

/**
 * Comando customizado para login
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 */
Cypress.Commands.add('login', (email, password) => {
    cy.intercept('POST', '**/api/auth/login').as('loginRequest')
    cy.visit('/login')
    cy.get('#email').type(email)
    cy.get('#password').type(password)
    cy.get('button[type="submit"]').click()
    cy.wait('@loginRequest', { timeout: 15000 })
})

/**
 * Comando customizado para verificar se está autenticado
 */
Cypress.Commands.add('isAuthenticated', () => {
    cy.window().then((win) => {
        const token = win.localStorage.getItem('accessToken')
        expect(token).to.exist
        expect(token).to.have.length.greaterThan(10)
    })
})
