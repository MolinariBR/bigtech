// Testes property-based para TASK-USER-001: Página de Registro no Frontend-App
// Propriedade 1: Formulário valida campos obrigatórios e formatos

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterPage from '../pages/register';

// Mock do Next.js router
const mockRouter = {
  replace: jest.fn(),
};
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock do fetch
global.fetch = jest.fn();

describe('RegisterPage - Property-based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it('should validate required fields', async () => {
    render(<RegisterPage />);

    // Preencher apenas alguns campos
    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@exemplo.com' },
    });
    // Não preencher senha

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    // Verificar que fetch não foi chamado
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // Verificar se erro aparece
    expect(screen.getByText(/senha deve ter pelo menos 8 caracteres/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByLabelText(/aceito os termos/i));

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
  });

  it('should validate password strength', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@exemplo.com' },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: 'weak' }, // Senha fraca
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: 'weak' },
    });
    fireEvent.click(screen.getByLabelText(/aceito os termos/i));

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // expect(screen.getByText(/senha deve conter maiúscula, minúscula e número/i)).toBeInTheDocument();
  });

  it('should validate password confirmation', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@exemplo.com' },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: 'Different123' }, // Senha diferente
    });
    fireEvent.click(screen.getByLabelText(/aceito os termos/i));

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      const errorMessages = screen.getAllByText(/senhas não coincidem/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

  it('should require terms acceptance', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@exemplo.com' },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: 'Password123' },
    });
    // Não marcar termos

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(screen.getByText(/aceite os termos de uso/i)).toBeInTheDocument();
    });
  });

  it('should submit successfully with valid data', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/nome completo/i), {
      target: { value: 'João Silva' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'joao@exemplo.com' },
    });
    fireEvent.change(screen.getByLabelText(/^senha$/i), {
      target: { value: 'Password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar senha/i), {
      target: { value: 'Password123' },
    });
    fireEvent.click(screen.getByLabelText(/aceito os termos/i));

    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.any(Object));
    });

    // Verificar se modal de sucesso aparece
    // await waitFor(() => {
    //   expect(screen.getByText(/registro realizado com sucesso/i)).toBeInTheDocument();
    // });
  });
});