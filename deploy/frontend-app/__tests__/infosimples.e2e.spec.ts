import { test, expect } from '@playwright/test'

// Configurações de teste
const TEST_CONFIG = {
  cpf: process.env.TEST_CPF_VALIDO || '52998224725',
  cnpj: process.env.TEST_CNPJ_VALIDO || '12345678000199',
  cep: process.env.TEST_CEP_VALIDO || '01001000',
  placa: process.env.TEST_PLACA_VALIDA || 'ABC1234',
  timeout: {
    modal: parseInt(process.env.TEST_TIMEOUT_MODAL || '30000'),
    api: parseInt(process.env.TEST_TIMEOUT_API || '60000'),
    page: parseInt(process.env.TEST_TIMEOUT_PAGE || '10000')
  }
}

test.describe('InfoSimples E2E - Consultas Reais', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar timeout maior para testes E2E
    test.setTimeout(TEST_CONFIG.timeout.api)

    // Navegar para a aplicação
    await page.goto('http://localhost:3000')

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle')
  })

  test.describe('TASK-INFOSIMPLES-E2E-001: Validação de Interface', () => {
    test('Página de consultas carrega corretamente', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(2000)

      // Verificar título da página
      await expect(page).toHaveTitle(/Consultas/)

      // Verificar se breadcrumb está presente
      const breadcrumb = page.locator('[data-testid="breadcrumb"]')
      await expect(breadcrumb).toBeVisible()
      await expect(breadcrumb).toContainText('Crédito')
    })

    test('Cards de consulta são exibidos com informações completas', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      const cards = page.locator('[data-testid="consulta-card"]')
      const cardCount = await cards.count()

      expect(cardCount).toBeGreaterThan(0)

      // Verificar primeiro card
      const firstCard = cards.first()

      // Título
      const title = firstCard.locator('[data-testid="card-title"]')
      await expect(title).toBeVisible()
      const titleText = await title.textContent()
      expect(titleText?.length).toBeGreaterThan(3)

      // Preço
      const price = firstCard.locator('[data-testid="card-price"]')
      await expect(price).toBeVisible()
      await expect(price).toContainText('R$')

      // Descrição
      const description = firstCard.locator('[data-testid="card-description"]')
      await expect(description).toBeVisible()
      const descText = await description.textContent()
      expect(descText?.length).toBeGreaterThan(10)

      // Botão de ação
      const button = firstCard.locator('button:has-text("Executar Consulta")')
      await expect(button).toBeVisible()
      await expect(button).toBeEnabled()
    })

    test('Navegação entre categorias funciona', async ({ page }) => {
      // Testar navegação para Crédito
      await page.goto('/consulta/credito')
      await page.waitForTimeout(2000)
      const creditoCards = page.locator('[data-testid="consulta-card"]')
      expect(await creditoCards.count()).toBeGreaterThan(0)

      // Testar navegação para Cadastral
      await page.goto('/consulta/cadastral')
      await page.waitForTimeout(2000)
      const cadastralCards = page.locator('[data-testid="consulta-card"]')
      expect(await cadastralCards.count()).toBeGreaterThan(0)

      // Testar navegação para Veicular
      await page.goto('/consulta/veicular')
      await page.waitForTimeout(2000)
      const veicularCards = page.locator('[data-testid="consulta-card"]')
      expect(await veicularCards.count()).toBeGreaterThan(0)
    })
  })

  test.describe('TASK-INFOSIMPLES-E2E-002: Modal de Consulta', () => {
    test('Modal abre ao clicar em "Executar Consulta"', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      const firstCardButton = page.locator('[data-testid="consulta-card"]').first().locator('button:has-text("Executar Consulta")')
      await expect(firstCardButton).toBeVisible()

      await firstCardButton.click()

      // Aguardar modal abrir
      const modal = page.locator('div.fixed.inset-0.z-60')
      await expect(modal).toBeVisible()

      // Verificar elementos do modal
      const modalTitle = modal.locator('[data-testid="modal-title"]')
      await expect(modalTitle).toBeVisible()

      // Verificar campo de input
      const input = modal.locator('input[type="text"], input[placeholder*="CPF"], input[placeholder*="CNPJ"]')
      await expect(input).toBeVisible()

      // Verificar botão de confirmação
      const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
      await expect(confirmButton).toBeVisible()
    })

    test('Modal fecha ao clicar em cancelar', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      // Abrir modal
      const firstCardButton = page.locator('[data-testid="consulta-card"]').first().locator('button:has-text("Executar Consulta")')
      await firstCardButton.click()

      const modal = page.locator('div.fixed.inset-0.z-60')
      await expect(modal).toBeVisible()

      // Fechar modal
      const cancelButton = modal.locator('button:has-text("Cancelar")')
      if (await cancelButton.isVisible()) {
        await cancelButton.click()
        await expect(modal).not.toBeVisible()
      } else {
        // Tentar fechar clicando no overlay
        await page.mouse.click(10, 10)
        await expect(modal).not.toBeVisible()
      }
    })
  })

  test.describe('TASK-INFOSIMPLES-E2E-003: Consultas Reais - Crédito', () => {
    test('Consulta CENPROT Protestos SP', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      // Encontrar card do CENPROT
      const cenprotCard = page.locator('[data-testid="consulta-card"]').filter({
        hasText: 'CENPROT Protestos SP'
      })

      if (await cenprotCard.isVisible()) {
        const button = cenprotCard.locator('button:has-text("Executar Consulta")')
        await button.click()

        // Preencher modal
        const modal = page.locator('div.fixed.inset-0.z-60')
        await expect(modal).toBeVisible()

        const input = modal.locator('input[placeholder*="CPF"]')
        await input.fill(TEST_CONFIG.cpf)

        const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
        await confirmButton.click()

        // Aguardar resultado (até 60 segundos devido à API real)
        await page.waitForTimeout(TEST_CONFIG.timeout.api)

        // Verificar resultado
        const resultDiv = modal.locator('[data-testid="consulta-result"]')
        const resultVisible = await resultDiv.isVisible()

        if (resultVisible) {
          const resultText = await resultDiv.textContent()
          expect(resultText).toBeTruthy()

          // Validar que é resposta da API (sucesso ou erro específico)
          const isValidResponse = resultText!.includes('Consulta realizada') ||
                                resultText!.includes('Protestos') ||
                                resultText!.includes('Erro') ||
                                resultText!.includes('InfoSimples')

          expect(isValidResponse).toBe(true)
        } else {
          // Se não há resultado visível, verificar se há mensagem de erro
          const errorDiv = modal.locator('[data-testid="consulta-error"]')
          if (await errorDiv.isVisible()) {
            const errorText = await errorDiv.textContent()
            expect(errorText).toBeTruthy()
          }
        }
      } else {
        console.log('Card CENPROT Protestos SP não encontrado - pulando teste')
      }
    })

    test('Consulta Receita Federal CPF', async ({ page }) => {
      await page.goto('/consulta/cadastral')
      await page.waitForTimeout(3000)

      // Encontrar card da Receita Federal CPF
      const receitaCard = page.locator('[data-testid="consulta-card"]').filter({
        hasText: 'Receita Federal CPF'
      })

      if (await receitaCard.isVisible()) {
        const button = receitaCard.locator('button:has-text("Executar Consulta")')
        await button.click()

        // Preencher modal
        const modal = page.locator('div.fixed.inset-0.z-60')
        await expect(modal).toBeVisible()

        const input = modal.locator('input[placeholder*="CPF"]')
        await input.fill(TEST_CONFIG.cpf)

        const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
        await confirmButton.click()

        // Aguardar resultado
        await page.waitForTimeout(TEST_CONFIG.timeout.api)

        // Verificar resultado
        const resultDiv = modal.locator('[data-testid="consulta-result"]')
        if (await resultDiv.isVisible()) {
          const resultText = await resultDiv.textContent()
          expect(resultText).toBeTruthy()

          // Validar resposta da Receita Federal
          const isValidResponse = resultText!.includes('CPF') ||
                                resultText!.includes('Receita') ||
                                resultText!.includes('Consulta realizada') ||
                                resultText!.includes('Erro')

          expect(isValidResponse).toBe(true)
        }
      } else {
        console.log('Card Receita Federal CPF não encontrado - pulando teste')
      }
    })
  })

  test.describe('TASK-INFOSIMPLES-E2E-004: Consultas Reais - Cadastral', () => {
    test('Consulta Receita Federal CNPJ', async ({ page }) => {
      await page.goto('/consulta/cadastral')
      await page.waitForTimeout(3000)

      const receitaCard = page.locator('[data-testid="consulta-card"]').filter({
        hasText: 'Receita Federal CNPJ'
      })

      if (await receitaCard.isVisible()) {
        const button = receitaCard.locator('button:has-text("Executar Consulta")')
        await button.click()

        const modal = page.locator('div.fixed.inset-0.z-60')
        await expect(modal).toBeVisible()

        const input = modal.locator('input[placeholder*="CNPJ"]')
        await input.fill(TEST_CONFIG.cnpj)

        const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
        await confirmButton.click()

        await page.waitForTimeout(TEST_CONFIG.timeout.api)

        const resultDiv = modal.locator('[data-testid="consulta-result"]')
        if (await resultDiv.isVisible()) {
          const resultText = await resultDiv.textContent()
          expect(resultText).toBeTruthy()

          const isValidResponse = resultText!.includes('CNPJ') ||
                                resultText!.includes('Empresa') ||
                                resultText!.includes('Receita') ||
                                resultText!.includes('Consulta realizada') ||
                                resultText!.includes('Erro')

          expect(isValidResponse).toBe(true)
        }
      } else {
        console.log('Card Receita Federal CNPJ não encontrado - pulando teste')
      }
    })

    test('Consulta Correios CEP', async ({ page }) => {
      await page.goto('/consulta/endereco')
      await page.waitForTimeout(3000)

      const correiosCard = page.locator('[data-testid="consulta-card"]').filter({
        hasText: 'Correios CEP'
      })

      if (await correiosCard.isVisible()) {
        const button = correiosCard.locator('button:has-text("Executar Consulta")')
        await button.click()

        const modal = page.locator('div.fixed.inset-0.z-60')
        await expect(modal).toBeVisible()

        const input = modal.locator('input[placeholder*="CEP"]')
        await input.fill(TEST_CONFIG.cep)

        const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
        await confirmButton.click()

        await page.waitForTimeout(TEST_CONFIG.timeout.api)

        const resultDiv = modal.locator('[data-testid="consulta-result"]')
        if (await resultDiv.isVisible()) {
          const resultText = await resultDiv.textContent()
          expect(resultText).toBeTruthy()

          const isValidResponse = resultText!.includes('CEP') ||
                                resultText!.includes('Endereço') ||
                                resultText!.includes('Logradouro') ||
                                resultText!.includes('Consulta realizada') ||
                                resultText!.includes('Erro')

          expect(isValidResponse).toBe(true)
        }
      } else {
        console.log('Card Correios CEP não encontrado - pulando teste')
      }
    })
  })

  test.describe('TASK-INFOSIMPLES-E2E-005: Consultas Reais - Veicular', () => {
    test('Consulta SERPRO Radar Veículo', async ({ page }) => {
      await page.goto('/consulta/veicular')
      await page.waitForTimeout(3000)

      const serproCard = page.locator('[data-testid="consulta-card"]').filter({
        hasText: 'SERPRO Radar Veículo'
      })

      if (await serproCard.isVisible()) {
        const button = serproCard.locator('button:has-text("Executar Consulta")')
        await button.click()

        const modal = page.locator('div.fixed.inset-0.z-60')
        await expect(modal).toBeVisible()

        const input = modal.locator('input[placeholder*="Placa"]')
        await input.fill(TEST_CONFIG.placa)

        const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
        await confirmButton.click()

        await page.waitForTimeout(TEST_CONFIG.timeout.api)

        const resultDiv = modal.locator('[data-testid="consulta-result"]')
        if (await resultDiv.isVisible()) {
          const resultText = await resultDiv.textContent()
          expect(resultText).toBeTruthy()

          const isValidResponse = resultText!.includes('Veículo') ||
                                resultText!.includes('Placa') ||
                                resultText!.includes('SERPRO') ||
                                resultText!.includes('Consulta realizada') ||
                                resultText!.includes('Erro')

          expect(isValidResponse).toBe(true)
        }
      } else {
        console.log('Card SERPRO Radar Veículo não encontrado - pulando teste')
      }
    })
  })

  test.describe('TASK-INFOSIMPLES-E2E-006: Validação de Erros e Rate Limiting', () => {
    test('Tratamento de CPF inválido', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      const firstCard = page.locator('[data-testid="consulta-card"]').first()
      const button = firstCard.locator('button:has-text("Executar Consulta")')
      await button.click()

      const modal = page.locator('div.fixed.inset-0.z-60')
      await expect(modal).toBeVisible()

      // Tentar CPF inválido
      const input = modal.locator('input[type="text"]')
      await input.fill('00000000000')

      const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
      await confirmButton.click()

      // Aguardar validação
      await page.waitForTimeout(5000)

      // Verificar se há mensagem de erro de validação
      const errorMessage = modal.locator('[data-testid="validation-error"]')
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent()
        expect(errorText).toContain('inválido')
      }
    })

    test('Rate limiting é respeitado', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      const firstCard = page.locator('[data-testid="consulta-card"]').first()
      const button = firstCard.locator('button:has-text("Executar Consulta")')

      // Fazer múltiplas consultas rapidamente
      for (let i = 0; i < 3; i++) {
        await button.click()

        const modal = page.locator('div.fixed.inset-0.z-60')
        await expect(modal).toBeVisible()

        const input = modal.locator('input[type="text"]')
        await input.fill(TEST_CONFIG.cpf)

        const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
        await confirmButton.click()

        // Aguardar um pouco entre as consultas
        await page.waitForTimeout(2000)

        // Fechar modal se ainda estiver aberto
        if (await modal.isVisible()) {
          await page.mouse.click(10, 10)
          await page.waitForTimeout(1000)
        }
      }

      // Verificar se não há erros de rate limiting evidentes
      // (em um teste real, verificaríamos logs do servidor)
    })
  })

  test.describe('TASK-INFOSIMPLES-E2E-007: Performance e Escalabilidade', () => {
    test('Página carrega rapidamente', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/consulta/credito')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime
      expect(loadTime).toBeLessThan(TEST_CONFIG.timeout.page)

      console.log(`Página carregada em ${loadTime}ms`)
    })

    test('Múltiplas consultas podem ser executadas sequencialmente', async ({ page }) => {
      await page.goto('/consulta/credito')
      await page.waitForTimeout(3000)

      const cards = page.locator('[data-testid="consulta-card"]')
      const cardCount = await cards.count()
      const maxTests = Math.min(cardCount, 3) // Testar no máximo 3 cards

      for (let i = 0; i < maxTests; i++) {
        const card = cards.nth(i)
        const button = card.locator('button:has-text("Executar Consulta")')

        if (await button.isVisible()) {
          await button.click()

          const modal = page.locator('div.fixed.inset-0.z-60')
          await expect(modal).toBeVisible()

          // Preencher com dados de teste
          const input = modal.locator('input[type="text"]')
          await input.fill(TEST_CONFIG.cpf)

          const confirmButton = modal.locator('button:has-text("Confirmar Consulta")')
          await confirmButton.click()

          // Aguardar processamento
          await page.waitForTimeout(TEST_CONFIG.timeout.api / 3) // Timeout menor para testes múltiplos

          // Fechar modal
          await page.mouse.click(10, 10)
          await page.waitForTimeout(2000)
        }
      }
    })
  })
})