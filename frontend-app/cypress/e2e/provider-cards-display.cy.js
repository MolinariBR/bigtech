/**
 * Teste E2E: Validação de Exibição de Cards de Provedores por Plugin
 *
 * Objetivo: Validar que os cards de provedores aparecem/ocultam corretamente
 * baseado na ativação/desativação de plugins BigTech e InfoSimples
 *
 * Cenários testados:
 * - Plugin BigTech ativo/inativo
 * - Plugin InfoSimples ativo/inativo
 * - Plugins combinados
 * - Escopos por usuário e tenant
 *
 * Usuários de teste:
 * - user@bigtech.com / user1234 (usuário comum para validação)
 * - admin2@bigtech.com / admin123 (admin para configuração)
 */

describe('Provider Cards Display by Plugin Activation', () => {
    const TEST_USER_EMAIL = 'user@bigtech.com'
    const TEST_USER_PASSWORD = 'user1234'
    const ADMIN_EMAIL = 'admin2@bigtech.com'
    const ADMIN_PASSWORD = 'admin123'

    // Tenant do usuário de teste
    const TEST_TENANT_ID = 'default'

    before(() => {
        // Servidores já estão rodando, pular verificação de health para evitar rate limiting
        cy.log('🔧 Iniciando testes E2E - servidores já verificados')

        // Fazer login como admin uma vez e armazenar token
        cy.request('POST', 'http://localhost:8080/api/auth/admin/login', {
            email: 'user@bigtech.com',
            password: 'user1234'
        }).then((adminResponse) => {
            expect(adminResponse.status).to.eq(200)
            const adminToken = adminResponse.body.token

            // Armazenar token globalmente
            cy.window().then((win) => {
                win.localStorage.setItem('adminToken', adminToken)
            })

            cy.log('✅ Admin logado e token armazenado')
        })
    })

    describe('Plugin BigTech - User Level', () => {
        beforeEach(() => {
            // Limpar estado
            cy.clearSession()

            // Garantir que BigTech está ativo no tenant
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'bigtech', status: 'active' }])
        })

        it('should show BigTech cards when plugin is allowed for user', () => {
            cy.log('🧪 Testando: BigTech ativo para usuário')

            // Configurar permissões do usuário
            cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

            // Login no frontend-app
            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            // Verificar cards de crédito
            cy.visit('/consulta/credito')
            cy.contains('Consulta de Crédito').should('be.visible')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            // Verificar que são cards do BigTech (pelo conteúdo)
            cy.get('[data-testid="consulta-card"]').first().within(() => {
                cy.get('[data-testid="card-title"]').should('contain', 'BigTech')
            })

            cy.screenshot('bigtech-user-active-credito')
        })

        it('should hide BigTech cards when plugin is not allowed for user', () => {
            cy.log('🧪 Testando: BigTech inativo para usuário')

            // Remover permissões do usuário
            cy.configureUserPlugins(TEST_USER_EMAIL, [])

            // Login no frontend-app
            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            // Verificar que não há cards
            cy.visit('/consulta/credito')
            cy.contains('Consulta de Crédito').should('be.visible')
            cy.get('[data-testid="consulta-card"]').should('not.exist')
            cy.contains('Nenhum serviço de crédito disponível').should('be.visible')

            cy.screenshot('bigtech-user-inactive-credito')
        })
    })

    describe('Plugin InfoSimples - User Level', () => {
        beforeEach(() => {
            cy.clearSession()
            // Garantir que InfoSimples está ativo no tenant
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'infosimples', status: 'active' }])
        })

        it('should show InfoSimples cards when plugin is allowed for user', () => {
            cy.log('🧪 Testando: InfoSimples ativo para usuário')

            cy.configureUserPlugins(TEST_USER_EMAIL, ['infosimples'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.contains('Consulta de Crédito').should('be.visible')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            // Verificar que são cards do InfoSimples
            cy.get('[data-testid="consulta-card"]').first().within(() => {
                cy.get('[data-testid="card-title"]').should('contain', 'InfoSimples')
            })

            cy.screenshot('infosimples-user-active-credito')
        })

        it('should hide InfoSimples cards when plugin is not allowed for user', () => {
            cy.log('🧪 Testando: InfoSimples inativo para usuário')

            cy.configureUserPlugins(TEST_USER_EMAIL, [])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.contains('Consulta de Crédito').should('be.visible')
            cy.get('[data-testid="consulta-card"]').should('not.exist')
            cy.contains('Nenhum serviço de crédito disponível').should('be.visible')

            cy.screenshot('infosimples-user-inactive-credito')
        })
    })

    describe('Plugins Combined - User Level', () => {
        beforeEach(() => {
            cy.clearSession()
            // Ativar ambos os plugins no tenant
            cy.configureTenantPlugins(TEST_TENANT_ID, [
                { pluginId: 'bigtech', status: 'active' },
                { pluginId: 'infosimples', status: 'active' }
            ])
        })

        it('should show cards from both providers when both plugins are allowed', () => {
            cy.log('🧪 Testando: Ambos os plugins ativos para usuário')

            cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech', 'infosimples'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.contains('Consulta de Crédito').should('be.visible')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 1)

            // Verificar que há cards de ambos os provedores
            cy.get('[data-testid="consulta-card"]').then(($cards) => {
                const titles = $cards.map((index, card) => Cypress.$(card).find('[data-testid="card-title"]').text()).get()
                expect(titles.some(title => title.includes('BigTech'))).to.be.true
                expect(titles.some(title => title.includes('InfoSimples'))).to.be.true
            })

            cy.screenshot('both-plugins-user-active-credito')
        })

        it('should show only BigTech cards when only BigTech is allowed', () => {
            cy.log('🧪 Testando: Apenas BigTech permitido')

            cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.contains('Consulta de Crédito').should('be.visible')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            // Verificar que apenas BigTech aparece
            cy.get('[data-testid="consulta-card"]').each(($card) => {
                cy.wrap($card).find('[data-testid="card-title"]').should('contain', 'BigTech')
            })

            cy.screenshot('only-bigtech-user-active-credito')
        })
    })

    describe('Plugin BigTech - Tenant Level', () => {
        beforeEach(() => {
            cy.clearSession()
        })

        it('should show BigTech cards when plugin is active at tenant level', () => {
            cy.log('🧪 Testando: BigTech ativo no tenant')

            // Ativar BigTech no tenant
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'bigtech', status: 'active' }])

            // Permitir para usuário
            cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            cy.screenshot('bigtech-tenant-active-credito')
        })

        it('should hide BigTech cards when plugin is inactive at tenant level', () => {
            cy.log('🧪 Testando: BigTech inativo no tenant')

            // Desativar BigTech no tenant
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'bigtech', status: 'inactive' }])

            // Mesmo que usuário tenha permissão, não deve aparecer
            cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.get('[data-testid="consulta-card"]').should('not.exist')
            cy.contains('Nenhum serviço de crédito disponível').should('be.visible')

            cy.screenshot('bigtech-tenant-inactive-credito')
        })
    })

    describe('Plugin InfoSimples - Tenant Level', () => {
        beforeEach(() => {
            cy.clearSession()
        })

        it('should show InfoSimples cards when plugin is active at tenant level', () => {
            cy.log('🧪 Testando: InfoSimples ativo no tenant')

            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'infosimples', status: 'active' }])
            cy.configureUserPlugins(TEST_USER_EMAIL, ['infosimples'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            cy.get('[data-testid="consulta-card"]').first().within(() => {
                cy.get('[data-testid="card-title"]').should('contain', 'InfoSimples')
            })

            cy.screenshot('infosimples-tenant-active-credito')
        })

        it('should hide InfoSimples cards when plugin is inactive at tenant level', () => {
            cy.log('🧪 Testando: InfoSimples inativo no tenant')

            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'infosimples', status: 'inactive' }])
            cy.configureUserPlugins(TEST_USER_EMAIL, ['infosimples'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.isAuthenticated()

            cy.visit('/consulta/credito')
            cy.get('[data-testid="consulta-card"]').should('not.exist')

            cy.screenshot('infosimples-tenant-inactive-credito')
        })
    })

    describe('Dynamic Plugin Changes', () => {
        it('should reflect plugin changes immediately after configuration', () => {
            cy.log('🧪 Testando mudanças dinâmicas de plugins')

            // Setup inicial: BigTech ativo
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'bigtech', status: 'active' }])
            cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

            cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
            cy.visit('/consulta/credito')
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            // Desativar plugin no tenant via API
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'bigtech', status: 'inactive' }])

            // Recarregar página e verificar
            cy.reload()
            cy.get('[data-testid="consulta-card"]').should('not.exist')

            // Reativar
            cy.configureTenantPlugins(TEST_TENANT_ID, [{ pluginId: 'bigtech', status: 'active' }])
            cy.reload()
            cy.get('[data-testid="consulta-card"]').should('have.length.greaterThan', 0)

            cy.screenshot('dynamic-plugin-changes')
        })
    })
})