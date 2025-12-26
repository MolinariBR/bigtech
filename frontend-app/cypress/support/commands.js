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
    // Preferir token em Cypress.env para evitar múltiplos logins
    const envToken = Cypress.env('ADMIN_TOKEN')
    if (envToken) {
        cy.log('🔄 Usando token de admin em Cypress.env')
        // garantir também em localStorage
        cy.window().then((win) => win.localStorage.setItem('adminToken', envToken))
        configurePluginsWithToken(envToken, userEmail, allowedPlugins)
        return
    }

    // Verificar se já temos um token de admin no localStorage do app
    cy.window().then((win) => win.localStorage.getItem('adminToken')).then((storedAdminToken) => {
        if (storedAdminToken) {
            cy.log('🔄 Usando token de admin armazenado')
            Cypress.env('ADMIN_TOKEN', storedAdminToken)
            configurePluginsWithToken(storedAdminToken, userEmail, allowedPlugins)
            return
        }

        // Fazer login como admin com retry simples para 429
        const doLogin = (attempt = 1) => {
            cy.request({
                method: 'POST',
                url: 'http://localhost:8080/api/auth/login',
                failOnStatusCode: false,
                body: {
                    email: Cypress.env('ADMIN_EMAIL') || 'test@bigtech.com',
                    password: Cypress.env('ADMIN_PASSWORD') || 'test12345'
                }
            }).then((adminResponse) => {
                if (adminResponse.status === 200 && adminResponse.body && adminResponse.body.token) {
                    const adminToken = adminResponse.body.token
                    Cypress.env('ADMIN_TOKEN', adminToken)
                    cy.window().then((win) => win.localStorage.setItem('adminToken', adminToken))
                    configurePluginsWithToken(adminToken, userEmail, allowedPlugins)
                } else if (adminResponse.status === 429 && attempt < 3) {
                    cy.log(`[login] 429 received, retrying attempt ${attempt + 1}`)
                    cy.wait(1000)
                    doLogin(attempt + 1)
                } else {
                    // Falha definitiva: falhar o teste com mensagem clara
                    throw new Error(`Falha ao obter token admin: status=${adminResponse.status}`)
                }
            })
        }

        doLogin()
    })
})

/**
 * Comando customizado para configurar plugins ativos no tenant
 * @param {string} tenantId - ID do tenant
 * @param {Array} plugins - Array de {pluginId: string, status: 'active'|'inactive'}
 */
Cypress.Commands.add('configureTenantPlugins', (tenantId, plugins) => {
    cy.log(`🔧 Configurando plugins do tenant ${tenantId}: ${plugins.map(p => `${p.pluginId}:${p.status}`).join(', ')}`)
    // Mesma lógica de cache do token admin usada em configureUserPlugins
    const envToken = Cypress.env('ADMIN_TOKEN')
    if (envToken) {
        cy.log('🔄 Usando token de admin em Cypress.env')
        cy.window().then((win) => win.localStorage.setItem('adminToken', envToken))
        configureTenantPluginsWithToken(envToken, tenantId, plugins)
        return
    }

    cy.window().then((win) => win.localStorage.getItem('adminToken')).then((storedAdminToken) => {
        if (storedAdminToken) {
            Cypress.env('ADMIN_TOKEN', storedAdminToken)
            configureTenantPluginsWithToken(storedAdminToken, tenantId, plugins)
            return
        }

        const doLogin = (attempt = 1) => {
            cy.request({
                method: 'POST',
                url: 'http://localhost:8080/api/auth/login',
                failOnStatusCode: false,
                body: {
                    email: Cypress.env('ADMIN_EMAIL') || 'user@bigtech.com',
                    password: Cypress.env('ADMIN_PASSWORD') || 'user1234',
                    tenantId: 'default'
                }
            }).then((adminResponse) => {
                if (adminResponse.status === 200 && adminResponse.body && adminResponse.body.token) {
                    const adminToken = adminResponse.body.token
                    Cypress.env('ADMIN_TOKEN', adminToken)
                    cy.window().then((win) => win.localStorage.setItem('adminToken', adminToken))
                    configureTenantPluginsWithToken(adminToken, tenantId, plugins)
                } else if (adminResponse.status === 429 && attempt < 3) {
                    cy.log(`[login] 429 received, retrying attempt ${attempt + 1}`)
                    cy.wait(1000)
                    doLogin(attempt + 1)
                } else {
                    throw new Error(`Falha ao obter token admin: status=${adminResponse.status}`)
                }
            })
        }

        doLogin()
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

/**
 * Função auxiliar para configurar plugins permitidos do usuário com token já obtido
 */
function configurePluginsWithToken(adminToken, userEmail, allowedPlugins) {
    // Buscar usuários via API admin e localizar pelo email
    cy.request({
        method: 'GET',
        url: 'http://localhost:8080/api/admin/users',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    }).then((listResp) => {
        expect(listResp.status).to.eq(200)
        const users = listResp.body.users || []
        const user = users.find(u => u.email === userEmail)
        expect(user, `User with email ${userEmail} should exist`).to.exist

        const userId = user.id

        // Atualizar allowedPlugins do usuário
        cy.request({
            method: 'PUT',
            url: `http://localhost:8080/api/admin/plugin-access/users/${userId}/plugins`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json',
                'x-tenant-id': user.tenantId || 'default'
            },
            body: { allowedPlugins }
        }).then((updateResp) => {
            expect(updateResp.status).to.eq(200)
            cy.log(`✅ allowedPlugins atualizado para ${userEmail}`)
        })
    })
}
