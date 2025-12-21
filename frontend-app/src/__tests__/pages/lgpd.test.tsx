// Baseado em: 8.Tests.md v1.0
// Cobertura: TASK-010.4 "Implementar Aviso LGPD" (7.Tasks.md)
// Estratégia: Testes de isolamento e renderização

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LGPDPage from '../../pages/lgpd'

// Mock dos componentes compartilhados
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>
  }
})

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    return (
      <aside data-testid="sidebar" data-open={isOpen}>
        Sidebar
        <button onClick={onClose}>Close</button>
      </aside>
    )
  }
})

jest.mock('@/components/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>
  }
})

jest.mock('@/components/Card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h2 data-testid="card-title">{children}</h2>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p data-testid="card-description">{children}</p>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}))

jest.mock('@/components/Button', () => ({
  Button: ({ children, onClick, disabled, variant }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: string;
  }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}))

describe('Página LGPD', () => {
  beforeEach(() => {
    // Mock window.open para evitar erros nos testes
    global.window.open = jest.fn()
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Estrutura da Página', () => {
    it('deve renderizar todos os componentes principais', () => {
      render(<LGPDPage />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('deve exibir o título da página corretamente', () => {
      render(<LGPDPage />)

      expect(screen.getByText('Aviso LGPD')).toBeInTheDocument()
      expect(screen.getByText('Lei Geral de Proteção de Dados Pessoais')).toBeInTheDocument()
    })
  })

  describe('Conteúdo LGPD', () => {
    it('deve exibir informações sobre proteção de dados', () => {
      render(<LGPDPage />)

      expect(screen.getByText('Sobre a Proteção de Dados')).toBeInTheDocument()
      expect(screen.getByText(/Recupera Big Tech - Consultas/)).toBeInTheDocument()
      expect(screen.getByText(/Lei nº 13.709\/2018/)).toBeInTheDocument()
    })

    it('deve listar tipos de dados coletados', () => {
      render(<LGPDPage />)

      expect(screen.getByText(/Dados de identificação/)).toBeInTheDocument()
      expect(screen.getByText(/Informações de contato/)).toBeInTheDocument()
      expect(screen.getByText(/Dados de uso da plataforma/)).toBeInTheDocument()
      expect(screen.getByText(/Informações de pagamento/)).toBeInTheDocument()
    })

    it('deve explicar como os dados são utilizados', () => {
      render(<LGPDPage />)

      expect(screen.getByText(/Como utilizamos seus dados/)).toBeInTheDocument()
      expect(screen.getByText(/Para fornecer os serviços de consulta/)).toBeInTheDocument()
      expect(screen.getByText(/Para processar pagamentos/)).toBeInTheDocument()
    })

    it('deve listar os direitos do usuário', () => {
      render(<LGPDPage />)

      expect(screen.getByText('Seus direitos')).toBeInTheDocument()
      expect(screen.getByText(/Confirmar a existência de tratamento/)).toBeInTheDocument()
      expect(screen.getByText(/Acessar seus dados pessoais/)).toBeInTheDocument()
      expect(screen.getByText(/Corrigir dados incompletos/)).toBeInTheDocument()
    })

    it('deve fornecer informações de contato', () => {
      render(<LGPDPage />)

      expect(screen.getByText(/privacidade@recuperabigtech.com.br/)).toBeInTheDocument()
    })
  })

  describe('Consentimento', () => {
    it('deve permitir marcar/desmarcar consentimento', () => {
      render(<LGPDPage />)

      const checkbox = screen.getByRole('checkbox', { name: /Concordo com o tratamento/ })
      expect(checkbox).not.toBeChecked()

      fireEvent.click(checkbox)
      expect(checkbox).toBeChecked()

      fireEvent.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })

    it('deve habilitar botão de confirmação apenas com consentimento', () => {
      render(<LGPDPage />)

      const confirmButton = screen.getByRole('button', { name: /Confirmar Consentimento/ })
      expect(confirmButton).toBeDisabled()

      const checkbox = screen.getByRole('checkbox', { name: /Concordo com o tratamento/ })
      fireEvent.click(checkbox)

      expect(confirmButton).not.toBeDisabled()
    })

    it('deve exibir alerta ao confirmar consentimento', () => {
      render(<LGPDPage />)

      const checkbox = screen.getByRole('checkbox', { name: /Concordo com o tratamento/ })
      fireEvent.click(checkbox)

      const confirmButton = screen.getByRole('button', { name: /Confirmar Consentimento/ })
      fireEvent.click(confirmButton)

      expect(global.alert).toHaveBeenCalledWith('Consentimento registrado com sucesso!')
    })
  })

  describe('Links e Recursos', () => {
    it('deve abrir política completa em nova aba', () => {
      render(<LGPDPage />)

      const policyButton = screen.getByRole('button', { name: /Ver Política Completa/ })
      fireEvent.click(policyButton)

      expect(global.window.open).toHaveBeenCalledWith('/politica-privacidade', '_blank')
    })

    it('deve fornecer links para recursos externos', () => {
      render(<LGPDPage />)

      expect(screen.getByRole('button', { name: /Site da ANPD/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Lei LGPD Completa/ })).toBeInTheDocument()
    })

    it('deve abrir links externos em nova aba', () => {
      render(<LGPDPage />)

      const anpdButton = screen.getByRole('button', { name: /Site da ANPD/ })
      fireEvent.click(anpdButton)
      expect(global.window.open).toHaveBeenCalledWith('https://www.gov.br/anpd/pt-br', '_blank')

      const lgpdButton = screen.getByRole('button', { name: /Lei LGPD Completa/ })
      fireEvent.click(lgpdButton)
      expect(global.window.open).toHaveBeenCalledWith('https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm', '_blank')
    })
  })

  describe('Acessibilidade', () => {
    it('deve ter labels apropriadas para elementos interativos', () => {
      render(<LGPDPage />)

      expect(screen.getByRole('checkbox', { name: /Concordo com o tratamento/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Confirmar Consentimento/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Ver Política Completa/ })).toBeInTheDocument()
    })

    it('deve ter link de email acessível', () => {
      render(<LGPDPage />)

      const emailLink = screen.getByRole('link', { name: /privacidade@recuperabigtech.com.br/ })
      expect(emailLink).toHaveAttribute('href', 'mailto:privacidade@recuperabigtech.com.br')
    })
  })
})