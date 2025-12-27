import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PluginsPage from '../pages/plugins';

// Mock do Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {}
  })
}));

// Mock do fetch
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('PluginsPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render plugins list', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plugins: [
          {
            id: 'bigtech',
            type: 'consulta',
            version: '1.0.0',
            name: 'BigTech'
          }
        ] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plugins: [] })
      } as Response);

    render(<PluginsPage />);

    await waitFor(() => {
      expect(screen.getByText('BigTech')).toBeInTheDocument();
    });
  });

  it('should handle plugin toggle', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plugins: [
          {
            id: 'bigtech',
            type: 'consulta',
            version: '1.0.0',
            name: 'BigTech'
          }
        ] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plugins: [
          {
            pluginId: 'bigtech',
            type: 'consulta',
            version: '1.0.0',
            status: 'configured',
            config: '{}',
            installedBy: 'admin',
            installedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            $id: '1'
          }
        ] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

    render(<PluginsPage />);

    await waitFor(() => {
      const toggleButton = screen.getByRole('switch');
      fireEvent.click(toggleButton);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/plugins/global/bigtech/toggle'),
      expect.any(Object)
    );
  });

  it('should show configuration modal', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plugins: [
          {
            id: 'bigtech',
            type: 'consulta',
            version: '1.0.0',
            name: 'BigTech'
          }
        ] })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ plugins: [
          {
            pluginId: 'bigtech',
            type: 'consulta',
            version: '1.0.0',
            status: 'configured',
            config: '{}',
            installedBy: 'admin',
            installedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            $id: '1'
          }
        ] })
      } as Response);

    render(<PluginsPage />);

    await waitFor(() => {
      const configButton = screen.getByText('Configurar');
      fireEvent.click(configButton);
    });

    expect(screen.getByText('Configurar Plugin Global')).toBeInTheDocument();
  });
});