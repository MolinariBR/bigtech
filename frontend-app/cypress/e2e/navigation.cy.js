describe('Navegação entre páginas - Frontend App', () => {
  beforeEach(() => {
    // Visitar página de login
    cy.visit('/login')
  })

  it('Deve fazer login e navegar por todas as páginas da sidebar', () => {
    // Fazer login
    cy.get('#email').type('user@bigtech.com')
    cy.get('#password').type('user1234')
    cy.get('button[type="submit"]').click()

    // Verificar se foi redirecionado para o dashboard
    cy.url().should('include', '/')

    // Verificar se a sidebar está visível
    cy.get('[data-cy="sidebar-principal"]').should('be.visible')

    // Navegar para Dashboard
    cy.get('[data-cy="sidebar-principal"]').click()
    cy.url().should('include', '/')
    cy.get('h1').should('contain', 'Dashboard') // ou outro elemento identificador

    // Abrir dropdown Consultas
    cy.get('[data-cy="sidebar-consultas-dropdown"]').click()

    // Navegar para Consultas de Crédito
    cy.get('[data-cy="sidebar-crédito"]').click()
    cy.url().should('include', '/consulta/credito')
    cy.get('h1').should('contain', 'Consultas de Crédito') // ajustar conforme o título real

    // Navegar para Consultas Cadastrais
    cy.get('[data-cy="sidebar-cadastral"]').click()
    cy.url().should('include', '/consulta/cadastral')
    cy.get('h1').should('contain', 'Consultas Cadastrais')

    // Navegar para Consultas Veiculares
    cy.get('[data-cy="sidebar-veicular"]').click()
    cy.url().should('include', '/consulta/veicular')
    cy.get('h1').should('contain', 'Consultas Veiculares')

    // Navegar para Diversos
    cy.get('[data-cy="sidebar-diversos"]').click()
    cy.url().should('include', '/consulta/outros')
    cy.get('h1').should('contain', 'Consultas Diversas')

    // Navegar para Relatórios
    cy.get('[data-cy="sidebar-relatórios"]').click()
    cy.url().should('include', '/relatorios/consultas')
    cy.get('h1').should('contain', 'Relatórios')

    // Abrir dropdown Financeiro
    cy.get('[data-cy="sidebar-financeiro-dropdown"]').click()

    // Navegar para Extrato
    cy.get('[data-cy="sidebar-extrato"]').click()
    cy.url().should('include', '/financeiro/extrato')
    cy.get('h1').should('contain', 'Extrato')

    // Navegar para Comprar Créditos
    cy.get('[data-cy="sidebar-comprar-créditos"]').click()
    cy.url().should('include', '/financeiro/comprar')
    cy.get('h1').should('contain', 'Comprar Créditos')

    // Navegar para Boletos
    cy.get('[data-cy="sidebar-boletos"]').click()
    cy.url().should('include', '/financeiro/boletos')
    cy.get('h1').should('contain', 'Boletos')

    // Navegar para LGPD
    cy.get('[data-cy="sidebar-lgpd"]').click()
    cy.url().should('include', '/lgpd')
    cy.get('h1').should('contain', 'LGPD')

    // Verificar se todas as navegações foram bem-sucedidas
    cy.log('✅ Todas as navegações foram concluídas com sucesso!')
  })

  it('Deve manter o usuário logado após navegação', () => {
    // Fazer login
    cy.get('#email').type('user@bigtech.com')
    cy.get('#password').type('user1234')
    cy.get('button[type="submit"]').click()

    // Navegar para uma página
    cy.get('[data-cy="sidebar-consultas-dropdown"]').click()
    cy.get('[data-cy="sidebar-crédito"]').click()

    // Recarregar a página
    cy.reload()

    // Verificar se ainda está logado (não redirecionou para login)
    cy.url().should('not.include', '/login')
    cy.url().should('include', '/consulta/credito')
  })

  it('Deve mostrar erro para credenciais inválidas', () => {
    // Tentar login com credenciais erradas
    cy.get('#email').type('usuario@invalido.com')
    cy.get('#password').type('senhaerrada')
    cy.get('button[type="submit"]').click()

    // Verificar se mostra erro
    cy.get('.text-destructive').should('be.visible')
    cy.get('.text-destructive').should('contain', 'Erro')
  })
})