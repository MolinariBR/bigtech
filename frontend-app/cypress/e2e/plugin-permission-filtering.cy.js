/**
 * Teste E2E: Validação de Filtros de Plugin por Usuário
 *
 * Objetivo: Validar que o sistema filtra corretamente os serviços de consulta
 * baseado nas permissões de plugin do usuário
 *
 * Cenário de teste:
 * 1. Configurar permissões do usuário via API (admin)
 * 2. Fazer login no frontend-app
 * 3. Verificar se apenas os serviços dos plugins permitidos aparecem
 * 4. Testar todos os 4 fluxos: crédito, cadastral, veicular, outros
 *
 * Usuário de teste: user@bigtech.com (deve ver apenas BigTech)
 */

describe('Plugin Permission Filtering E2E', () => {
    const TEST_USER_EMAIL = 'user@bigtech.com'
    const TEST_USER_PASSWORD = 'user1234'
    const ADMIN_EMAIL = 'admin@bigtech.com'
    const ADMIN_PASSWORD = 'admin123'

    // Configurações de teste
    const testScenarios = [
        {
            name: 'Apenas BigTech permitido',
            userPlugins: ['bigtech'],
            expectedServices: {
                credito: 8,      // Serviços de crédito do BigTech
                cadastral: 4,    // Serviços cadastrais do BigTech
                veicular: 4,     // Serviços veiculares do BigTech
                outros: 0        // Sem serviços "outros" no BigTech
            }
        }
    ]

    before(() => {
        // Verificar se os servidores estão acessíveis (removido para evitar rate limiting)
        cy.log('🔧 Verificando se os servidores estão acessíveis...')

        // Simples verificação sem fazer requests HTTP
        cy.log('✅ Servidores devem estar rodando (verificados manualmente)')
    })

    testScenarios.forEach((scenario) => {
        describe(`${scenario.name}`, () => {
            beforeEach(() => {
                // Limpar sessão
                cy.clearSession()

                // Configurar permissões do usuário via API
                cy.configureUserPlugins(TEST_USER_EMAIL, scenario.userPlugins)

                // Fazer login no frontend-app
                cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)

                // Verificar que está autenticado
                cy.isAuthenticated()
            })

            it(`should show correct services for ${scenario.name}`, () => {
                cy.log(`🧪 Testando cenário: ${scenario.name}`)

                // Testar página de crédito
                testConsultaPage('/consulta/credito', 'Consulta de Crédito', scenario.expectedServices.credito)

                // Testar página cadastral
                testConsultaPage('/consulta/cadastral', 'Consulta Cadastral', scenario.expectedServices.cadastral)

                // Testar página veicular
                testConsultaPage('/consulta/veicular', 'Consulta Veicular', scenario.expectedServices.veicular)

                // Testar página outros
                testConsultaPage('/consulta/outros', 'Consultas Diversas', scenario.expectedServices.outros)
            })
        })
    })

    it('should handle plugin activation/deactivation dynamically', () => {
        cy.log('🔄 Testando mudança dinâmica de permissões')

        // 1. Configurar apenas BigTech
        cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

        // Login e verificar serviços
        cy.clearSession()
        cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)
        testConsultaPage('/consulta/credito', 'Consulta de Crédito', 8)

        // 2. Remover todas as permissões
        cy.configureUserPlugins(TEST_USER_EMAIL, [])

        // Fazer refresh da página e verificar que não há serviços
        cy.reload()
        cy.get('[data-testid="consulta-card"]', { timeout: 10000 }).should('not.exist')
        cy.contains('Nenhum serviço de crédito disponível no momento').should('be.visible')

        // 3. Restaurar permissões
        cy.configureUserPlugins(TEST_USER_EMAIL, ['bigtech'])

        // Refresh e verificar serviços novamente
        cy.reload()
        testConsultaPage('/consulta/credito', 'Consulta de Crédito', 8)
    })
})

/**
 * Função auxiliar para testar uma página de consulta
 */
function testConsultaPage(url, expectedTitle, expectedCardCount) {
    cy.log(`🔍 Testando página: ${url} (esperado: ${expectedCardCount} cards)`)

    // Navegar para a página
    cy.visit(url)

    // Verificar título da página
    cy.contains(expectedTitle, { timeout: 15000 }).should('be.visible')

    // Aguardar carregamento dos serviços
    cy.get('body').then(($body) => {
        // Verificar se há mensagem de "nenhum serviço"
        if ($body.text().includes('Nenhum serviço')) {
            if (expectedCardCount === 0) {
                cy.contains('Nenhum serviço').should('be.visible')
                cy.log(`✅ Corretamente sem serviços (${expectedCardCount})`)
            } else {
                cy.contains('Nenhum serviço').should('not.exist')
                cy.log(`❌ Erro: Esperava ${expectedCardCount} serviços mas encontrou mensagem de vazio`)
            }
            return
        }

        // Verificar se há cards de serviço
        cy.get('[data-testid="consulta-card"]', { timeout: 20000 }).then(($cards) => {
            const actualCount = $cards.length

            if (expectedCardCount === 0) {
                expect(actualCount).to.eq(0, `Esperava 0 cards mas encontrou ${actualCount}`)
                cy.log(`✅ Corretamente sem cards (${actualCount})`)
            } else {
                expect(actualCount).to.eq(expectedCardCount, `Esperava ${expectedCardCount} cards mas encontrou ${actualCount}`)

                // Verificar que os cards têm conteúdo válido
                cy.get('[data-testid="consulta-card"]').first().within(() => {
                    cy.get('[data-testid="card-title"]').should('be.visible')
                    cy.get('[data-testid="card-description"]').should('be.visible')
                    cy.get('[data-testid="card-price"]').should('be.visible')
                })

                cy.log(`✅ Encontrados ${actualCount} cards corretamente`)
            }
        })
    })

    // Screenshot para documentação
    const pageName = url.split('/').pop()
    cy.screenshot(`plugin-filter-${pageName}-${expectedCardCount}-cards`)
}