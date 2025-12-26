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

    // Verificar se já temos um token de admin armazenado
    cy.window().then((win) => {
        const storedAdminToken = win.localStorage.getItem('adminToken')

        if (storedAdminToken) {
            // Usar token armazenado
            cy.log('🔄 Usando token de admin armazenado')
            configurePluginsWithToken(storedAdminToken, userEmail, allowedPlugins)
        } else {
            // Fazer login como admin e armazenar token
            cy.request('POST', 'http://localhost:8080/api/auth/login', {
                email: Cypress.env('ADMIN_EMAIL') || 'test@bigtech.com',
                password: Cypress.env('ADMIN_PASSWORD') || 'test12345'
            }).then((adminResponse) => {
                expect(adminResponse.status).to.eq(200)
                const adminToken = adminResponse.body.token

                // Armazenar token no localStorage para reutilização
                cy.window().then((win) => {
                    win.localStorage.setItem('adminToken', adminToken)
                })

                configurePluginsWithToken(adminToken, userEmail, allowedPlugins)
            })
        }
    })
})

/**
 * Comando customizado para configurar plugins ativos no tenant
 * @param {string} tenantId - ID do tenant
 * @param {Array} plugins - Array de {pluginId: string, status: 'active'|'inactive'}
 */
Cypress.Commands.add('configureTenantPlugins', (tenantId, plugins) => {
    cy.log(`🔧 Configurando plugins do tenant ${tenantId}: ${plugins.map(p => `${p.pluginId}:${p.status}`).join(', ')}`)

    // Verificar se já temos um token de admin armazenado
    cy.window().then((win) => {
        const storedAdminToken = win.localStorage.getItem('adminToken')

        if (storedAdminToken) {
            configureTenantPluginsWithToken(storedAdminToken, tenantId, plugins)
        } else {
            // Fazer login como usuário normal (já que SKIP_APPWRITE_AUTH=true)
            cy.request('POST', 'http://localhost:8080/api/auth/login', {
                email: Cypress.env('ADMIN_EMAIL') || 'user@bigtech.com',
                password: Cypress.env('ADMIN_PASSWORD') || 'user1234',
                tenantId: 'default'
            }).then((adminResponse) => {
                expect(adminResponse.status).to.eq(200)
                const adminToken = adminResponse.body.token

                // Armazenar token
                cy.window().then((win) => {
                    win.localStorage.setItem('adminToken', adminToken)
                })

                configureTenantPluginsWithToken(adminToken, tenantId, plugins)
            })
        }
    })
})

/**
 * Função auxiliar para configurar plugins do tenant com token já obtido
 */
function configureTenantPluginsWithToken(adminToken, tenantId, plugins) {
    cy.request({
        method: 'PUT',
        url: `http://localhost:8080/api/admin/plugin-access/tenants/${tenantId}/plugins`,
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            'x-tenant-id': 'default'
        },
        body: { plugins }
    }).then((response) => {
        expect(response.status).to.eq(200)
        cy.log(`✅ Plugins do tenant ${tenantId} atualizados`)
    })
}
