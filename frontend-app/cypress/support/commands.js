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

/**
 * Comando customizado para configurar permissões de plugin do usuário
 * @param {string} userEmail - Email do usuário
 * @param {string[]} allowedPlugins - Array de plugins permitidos
 */
Cypress.Commands.add('configureUserPlugins', (userEmail, allowedPlugins) => {
    cy.log(`🔧 Configurando plugins permitidos para ${userEmail}: ${allowedPlugins.join(', ')}`)

    // Primeiro, fazer login como admin para obter token
    cy.request('POST', 'http://localhost:8080/api/auth/admin/login', {
        email: Cypress.env('ADMIN_EMAIL') || 'admin@bigtech.com',
        password: Cypress.env('ADMIN_PASSWORD') || 'admin123'
    }).then((adminResponse) => {
        expect(adminResponse.status).to.eq(200)
        const adminToken = adminResponse.body.token

        // Buscar todos os usuários e filtrar por email
        cy.request({
            method: 'GET',
            url: 'http://localhost:8080/api/admin/users',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'x-tenant-id': 'default'
            }
        }).then((usersResponse) => {
            expect(usersResponse.status).to.eq(200)
            expect(usersResponse.body.users).to.have.length.greaterThan(0)

            // Encontrar usuário pelo email
            const user = usersResponse.body.users.find(u => u.email === userEmail || u.identifier === userEmail)
            expect(user).to.exist

            const userId = user.id

            // Atualizar permissões do usuário
            cy.request({
                method: 'PUT',
                url: `http://localhost:8080/api/admin/plugin-access/users/${userId}/plugins`,
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'default'
                },
                body: {
                    allowedPlugins: allowedPlugins
                }
            }).then((updateResponse) => {
                expect(updateResponse.status).to.eq(200)
                cy.log(`✅ Permissões atualizadas para usuário ${userEmail}`)
            })
        })
    })
})
