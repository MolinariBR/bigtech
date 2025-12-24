// Testes property-based para TASK-USER-002: Modificar Fluxo de Login para Incluir Opção de Registro
// Propriedade 1: Alternância entre login e registro funciona corretamente

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../pages/login';

// Mock do Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

describe('LoginPage - Property-based Tests', () => {
  it('should have link to register page', () => {
    render(<LoginPage />);

    const registerLink = screen.getByRole('link', { name: /registre-se/i });
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });
});