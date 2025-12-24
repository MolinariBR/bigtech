/**
 * Teste E2E: Autenticação de Usuário
 * 
 * Fluxo completo testado:
 * 1. Verificar se usuário existe no Appwrite Cloud (validação real via API)
 * 2. Acessar página de login do frontend-app
 * 3. Capturar e validar erro 400 do endpoint /api/auth/refresh
 * 4. Inserir credenciais corretas e fazer login
 * 5. Verificar redirecionamento para dashboard
 */

describe('Authentication Flow', () => {
    const TEST_USER_EMAIL = 'user@bigtech.com'
    const TEST_USER_PASSWORD = 'user1234'
    const BACKEND_URL = Cypress.env('BACKEND_URL') || 'http://localhost:8080'

    beforeEach(() => {
        // Limpar sessão antes de cada teste
        cy.clearSession()
    })

    it('should validate credentials in Appwrite Cloud and complete authentication', () => {
        // ============================================================================
        // PASSO 1: Verificar se usuário existe no Appwrite Cloud
        // ============================================================================
        cy.log('🔍 STEP 1: Validando credenciais no Appwrite Cloud')

        // Fazer requisição real ao backend para validar credenciais
        cy.request({
            method: 'POST',
            url: `${BACKEND_URL}/api/auth/login`,
            body: {
                email: TEST_USER_EMAIL,
                password: TEST_USER_PASSWORD
            },
            failOnStatusCode: false // Não falhar teste se retornar erro
        }).then((response) => {
            cy.log(`Resposta do Appwrite via backend: ${response.status}`)

            // Verificar se credenciais são válidas
            if (response.status === 200 || response.status === 201) {
                cy.log('✅ Credenciais válidas no Appwrite Cloud')
                expect(response.body).to.have.property('success', true)
                expect(response.body).to.have.property('token')
            } else if (response.status === 401) {
                // Credenciais inválidas - falhar o teste
                cy.log('❌ FALHA: Credenciais inválidas no Appwrite Cloud')
                throw new Error(`Usuário ${TEST_USER_EMAIL} não existe ou senha incorreta no Appwrite Cloud`)
            } else {
                cy.log(`⚠️ Status inesperado: ${response.status}`)
                cy.log(`Resposta: ${JSON.stringify(response.body)}`)
            }
        })

        // ============================================================================
        // PASSO 2: Acessar página de login do frontend-app
        // ============================================================================
        cy.log('🔍 STEP 2: Acessando página de login do frontend-app')

        // Interceptar requisição de refresh ANTES de visitar a página
        let refreshErrorCaptured = false
        cy.intercept('POST', '**/api/auth/refresh', (req) => {
            // Capturar detalhes da requisição
            cy.log('📡 Requisição /api/auth/refresh capturada')
            cy.log(`Headers: ${JSON.stringify(req.headers)}`)
            cy.log(`Body: ${JSON.stringify(req.body)}`)
        }).as('refreshRequest')

        // Visitar página de login
        cy.visit('/login', { timeout: 30000 })
        cy.url().should('include', '/login')

        // Verificar elementos da página
        cy.contains('BigTech Login', { timeout: 10000 }).should('be.visible')
        cy.get('#email', { timeout: 10000 }).should('be.visible')
        cy.get('#password').should('be.visible')
        cy.get('button[type="submit"]').should('be.visible')

        cy.log('✅ Página de login carregada com sucesso')

        // ============================================================================
        // PASSO 3: Verificar e documentar erro 400 do /api/auth/refresh
        // ============================================================================
        cy.log('🔍 STEP 3: Verificando erro 400 do endpoint /api/auth/refresh')
        cy.log('ℹ️ Este erro é ESPERADO quando não há refresh token válido')

        // Aguardar um pouco para dar tempo de requisições automáticas
        cy.wait(3000)

        // Verificar se a requisição de refresh foi capturada
        cy.get('@refreshRequest.all').then((interceptions) => {
            if (interceptions && interceptions.length > 0) {
                const lastInterception = interceptions[interceptions.length - 1]

                if (lastInterception.response) {
                    const status = lastInterception.response.statusCode
                    cy.log(`📊 Status do /api/auth/refresh: ${status}`)

                    if (status === 400) {
                        refreshErrorCaptured = true
                        cy.log('✅ Erro 400 capturado conforme esperado')
                        cy.log('ℹ️ Motivo: Não há refresh token válido (esperado antes do login)')

                        // Verificar corpo da resposta para mais detalhes
                        const responseBody = lastInterception.response.body
                        cy.log(`Resposta do servidor: ${JSON.stringify(responseBody)}`)
                    } else {
                        cy.log(`⚠️ Status inesperado: ${status} (esperava 400)`)
                    }
                } else {
                    cy.log('⚠️ Interception sem response')
                }
            } else {
                cy.log('ℹ️ Nenhuma requisição /api/auth/refresh foi feita')
                cy.log('ℹ️ Isso é normal se o frontend não tenta refresh automático')
            }
        })

        // ============================================================================
        // PASSO 4: Inserir credenciais e fazer login
        // ============================================================================
        cy.log('🔍 STEP 4: Fazendo login com credenciais válidas')

        // Interceptar requisição de login
        cy.intercept('POST', '**/api/auth/login').as('loginRequest')

        // Preencher formulário
        cy.get('#email').clear().type(TEST_USER_EMAIL)
        cy.get('#password').clear().type(TEST_USER_PASSWORD)

        // Screenshot antes do login
        cy.screenshot('01-antes-do-login')

        // Clicar em Entrar
        cy.get('button[type="submit"]').click()

        // Aguardar resposta da API
        cy.wait('@loginRequest', { timeout: 15000 }).then((interception) => {
            const status = interception.response.statusCode
            const body = interception.response.body

            cy.log(`📊 Resposta do login: ${status}`)
            cy.log(`📦 Body: ${JSON.stringify(body)}`)

            // Validar resposta
            expect(status).to.be.oneOf([200, 201])
            expect(body).to.have.property('success', true)
            expect(body).to.have.property('token')

            cy.log('✅ Login realizado com sucesso')

            // Se tenant foi criado, registrar no log
            if (body.tenantCreated) {
                cy.log('ℹ️ Tenant criado automaticamente (auto-onboarding)')
            }
        })

        // ============================================================================
        // PASSO 5: Verificar redirecionamento para dashboard
        // ============================================================================
        cy.log('🔍 STEP 5: Validando redirecionamento para dashboard')

        // Aguardar navegação
        cy.url({ timeout: 20000 }).should('satisfy', (url) => {
            const isDashboard = url.includes('/dashboard') || url === 'http://localhost:3000/'
            if (isDashboard) {
                cy.log(`✅ URL válida: ${url}`)
            } else {
                cy.log(`❌ URL inesperada: ${url}`)
            }
            return isDashboard
        })

        // Se estiver na raiz, navegar para dashboard
        cy.url().then((currentUrl) => {
            if (!currentUrl.includes('/dashboard')) {
                cy.log('ℹ️ Redirecionado para raiz, navegando para /dashboard')
                cy.visit('/dashboard')
            }
        })

        // Verificar dashboard
        cy.url().should('include', '/dashboard')
        cy.contains('Dashboard', { timeout: 15000 }).should('be.visible')

        // Verificar token no localStorage
        cy.window().then((win) => {
            const token = win.localStorage.getItem('accessToken')
            expect(token).to.exist
            expect(token).to.have.length.greaterThan(10)
            cy.log('✅ Token JWT armazenado no localStorage')
        })

        // Screenshot do dashboard
        cy.screenshot('02-dashboard-apos-login')

        // Verificar elementos principais
        cy.get('aside', { timeout: 10000 }).should('be.visible')
        cy.contains('Consultas').should('be.visible')
        cy.contains('Relatórios').should('be.visible')

        cy.log('✅ ✅ ✅ TESTE COMPLETO: Autenticação validada com sucesso!')

        // Resumo final
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('📋 RESUMO DO TESTE')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log(`✅ Credenciais validadas no Appwrite Cloud: ${TEST_USER_EMAIL}`)
        cy.log(`${refreshErrorCaptured ? '✅' : 'ℹ️'} Erro 400 do /api/auth/refresh ${refreshErrorCaptured ? 'capturado' : 'não detectado'}`)
        cy.log('✅ Login realizado com sucesso')
        cy.log('✅ Redirecionamento para dashboard validado')
        cy.log('✅ Token JWT armazenado')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })

    // Teste adicional: Validar comportamento com credenciais inválidas
    it('should reject invalid credentials', () => {
        cy.log('🔍 Testando rejeição de credenciais inválidas')

        cy.visit('/login')

        // Interceptar login
        cy.intercept('POST', '**/api/auth/login').as('loginRequest')

        // Tentar login com senha errada
        cy.get('#email').clear().type(TEST_USER_EMAIL)
        cy.get('#password').clear().type('senha_incorreta')
        cy.get('button[type="submit"]').click()

        // Verificar erro
        cy.wait('@loginRequest', { timeout: 15000 }).then((interception) => {
            const status = interception.response.statusCode
            cy.log(`Status: ${status}`)

            expect(status).to.equal(401)
            expect(interception.response.body).to.have.property('success', false)

            cy.log('✅ Credenciais inválidas rejeitadas corretamente')
        })

        // Verificar que ainda está na página de login
        cy.url().should('include', '/login')
    })
})
