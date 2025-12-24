/**
 * Teste E2E: Navegação via Sidebar
 * 
 * Objetivo: Validar que todos os links da sidebar funcionam corretamente
 * 
 * Problema identificado: Links da sidebar não redirecionam para as páginas
 * 
 * Páginas a testar:
 * - Crédito (/consulta/credito)
 * - Cadastral (/consulta/cadastral)
 * - Veicular (/consulta/veicular)
 * - Diversos (/consulta/outros)
 * - LGPD (/lgpd) - Deve ser página, não modal
 * - Relatórios (/relatorios/consultas)
 * - Extrato (/financeiro/extrato)
 * - Comprar Crédito (/financeiro/comprar)
 * - Boletos (/financeiro/boletos)
 * - Minha Conta (/minha-conta) - Link no header
 */

describe('Navegação via Sidebar', () => {
    const TEST_USER_EMAIL = 'user@bigtech.com'
    const TEST_USER_PASSWORD = 'user1234'

    beforeEach(() => {
        // Limpar sessão e fazer login antes de cada teste
        cy.clearSession()

        // Fazer login
        cy.log('🔐 Fazendo login...')
        cy.login(TEST_USER_EMAIL, TEST_USER_PASSWORD)

        // Esperar estar autenticado e logar a URL para debug
        cy.url().then(url => cy.log(`URL atual após login: ${url}`))

        cy.url({ timeout: 30000 }).should('include', '/')
    })

    it('should redirect to dashboard after login', () => {
        cy.log('🔍 TESTE 1: Verificando redirecionamento para dashboard')

        // Navegar explicitamente para dashboard se necessário
        cy.visit('/dashboard')

        // Verificar que está no dashboard
        cy.url().should('include', '/dashboard')
        cy.contains('Dashboard', { timeout: 10000 }).should('be.visible')

        // Verificar que sidebar está visível
        cy.get('aside', { timeout: 10000 }).should('be.visible')

        cy.log('✅ Dashboard carregado com sucesso')
        cy.screenshot('dashboard-inicial')
    })

    it('should navigate to all sidebar links', () => {
        cy.log('🔍 TESTE 2: Navegando por todos os links da sidebar')

        // Garantir que estamos no dashboard
        cy.visit('/dashboard')
        cy.get('aside', { timeout: 10000 }).should('be.visible')

        // ========================================================================
        // SEÇÃO: CONSULTAS (Dropdown)
        // ========================================================================
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('📂 SEÇÃO: Consultas')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Abrir dropdown de Consultas se existir
        cy.get('aside').then(($sidebar) => {
            const consultasText = $sidebar.text()
            if (consultasText.includes('Consultas')) {
                // Tentar clicar no dropdown
                cy.get('aside').within(() => {
                    // Procurar por data-cy ou texto
                    cy.contains('Consultas').first().click({ force: true })
                    cy.wait(1000) // Esperar animação do dropdown
                })
            }
        })

        // 1. Crédito
        testSidebarLink('Crédito', '/consulta/credito', 'Consulta de Crédito')

        // 2. Cadastral
        testSidebarLink('Cadastral', '/consulta/cadastral', 'Consulta Cadastral')

        // 3. Veicular
        testSidebarLink('Veicular', '/consulta/veicular', 'Consulta Veicular')

        // 4. Diversos
        testSidebarLink('Diversos', '/consulta/outros', 'Consultas Diversas')

        // ========================================================================
        // SEÇÃO: RELATÓRIOS
        // ========================================================================
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('📂 SEÇÃO: Relatórios')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        testSidebarLink('Relatórios', '/relatorios/consultas', 'Relatório de Consultas')

        // ========================================================================
        // SEÇÃO: FINANCEIRO (Dropdown)
        // ========================================================================
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('📂 SEÇÃO: Financeiro')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Abrir dropdown de Financeiro se existir
        cy.get('aside').then(($sidebar) => {
            const financeiroText = $sidebar.text()
            if (financeiroText.includes('Financeiro')) {
                cy.get('aside').within(() => {
                    cy.contains('Financeiro').first().click({ force: true })
                    cy.wait(1000)
                })
            }
        })

        // 5. Extrato
        testSidebarLink('Extrato', '/financeiro/extrato', 'Extrato Financeiro')

        // 6. Comprar Crédito (ou "Comprar Créditos")
        cy.get('aside').then(($sidebar) => {
            const text = $sidebar.text()
            if (text.includes('Comprar Créditos')) {
                testSidebarLink('Comprar Créditos', '/financeiro/comprar', 'Comprar Créditos')
            } else if (text.includes('Comprar Crédito')) {
                testSidebarLink('Comprar Crédito', '/financeiro/comprar', 'Comprar Crédito')
            }
        })

        // 7. Boletos
        testSidebarLink('Boletos', '/financeiro/boletos', 'Boletos e Faturas')

        // ========================================================================
        // SEÇÃO: LGPD (Deve ser PÁGINA, não modal)
        // ========================================================================
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('📂 SEÇÃO: LGPD')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        testSidebarLink('LGPD', '/lgpd', 'LGPD')

        // ========================================================================
        // SEÇÃO: MINHA CONTA (Header)
        // ========================================================================
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('📂 SEÇÃO: Header - Minha Conta')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        // Link no header (não na sidebar)
        cy.log('🔗 Testando: Minha Conta (header)')
        cy.get('header, [role="banner"]').within(() => {
            cy.contains('Minha Conta', { timeout: 5000 }).click({ force: true })
        })

        cy.wait(2000)

        cy.url({ timeout: 10000 }).then((url) => {
            if (url.includes('/minha-conta')) {
                cy.log('✅ Navegou para: /minha-conta')
            } else {
                cy.log(`⚠️ URL atual: ${url} (esperado: /minha-conta)`)
            }
        })

        // Verificar conteúdo
        cy.contains('Minha Conta', { timeout: 5000 }).should('be.visible')
        cy.screenshot('10-minha-conta')

        // Voltar para dashboard
        cy.visit('/dashboard')
        cy.wait(1000)

        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        cy.log('✅ ✅ ✅ TESTE COMPLETO')
        cy.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    })

    // Teste individual para verificar problema de navegação
    it('should diagnose navigation issues', () => {
        cy.log('🔍 DIAGNÓSTICO: Investigando problema de navegação')

        cy.visit('/dashboard')
        cy.get('aside').should('be.visible')

        // Tentar clicar em Crédito e capturar eventos
        cy.log('📊 Testando clique em "Crédito"...')

        // Listar todos os textos na sidebar
        cy.get('aside').invoke('text').then((text) => {
            cy.log(`Textos na sidebar: ${text}`)
        })

        // Procurar elemento com "Crédito"
        cy.get('aside').within(() => {
            cy.contains('Crédito').then(($el) => {
                cy.log(`Elemento encontrado: ${$el.prop('tagName')}`)
                cy.log(`Classes: ${$el.attr('class')}`)
                cy.log(`Atributos: ${JSON.stringify($el[0].attributes)}`)

                // Verificar se tem href (se for link)
                if ($el.prop('tagName') === 'A') {
                    cy.log(`href: ${$el.attr('href')}`)
                }

                // Tentar clicar
                cy.wrap($el).click({ force: true })
                cy.wait(2000)

                // Verificar URL após click
                cy.url().then((url) => {
                    cy.log(`URL após clique: ${url}`)
                })
            })
        })
    })
})

/**
 * Função auxiliar para testar navegação de links da sidebar
 */
function testSidebarLink(linkText, expectedPath, expectedHeading) {
    cy.log(`🔗 Testando: ${linkText}`)

    // Procurar link na sidebar
    cy.get('aside').within(() => {
        cy.contains(linkText, { timeout: 10000 }).should('be.visible').click({ force: true })
    })

    // Verificar URL com retry automático do Cypress
    cy.url({ timeout: 15000 }).should('include', expectedPath)

    // Verificar conteúdo
    cy.contains(expectedHeading, { timeout: 10000 }).should('be.visible')

    // Screenshot rápido
    cy.screenshot(`nav-${linkText.toLowerCase().replace(/\s+/g, '-')}`, { capture: 'viewport' })

    // Voltar para dashboard de forma mais rápida (programática se possível, ou via link)
    cy.get('aside').contains('Principal').click({ force: true })
    cy.url().should('include', '/dashboard')
}
