// ***********************************************************
// This support file is processed and loaded automatically before your test files.
// You can read more here: https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Desabilitar exceptions não capturadas para testes mais estáveis
Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from failing the test
    // Ignorar erros específicos do Next.js Fast Refresh em desenvolvimento
    if (err.message.includes('Abort fetching component for route')) {
        return false
    }
    if (err.message.includes('Failed to load resource')) {
        return false
    }
    // Permitir que outros erros falhem o teste
    return true
})
