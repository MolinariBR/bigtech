import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PluginPricingPage from '../pages/plugins/pricing';

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

describe('PluginPricingPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should render plugin selector', () => {
    render(<PluginPricingPage />);

    expect(screen.getByText('Preços de Serviços')).toBeInTheDocument();
    expect(screen.getByText('Selecione um plugin')).toBeInTheDocument();
  });

  it('should load services when plugin is selected', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          code: '11-serasa-consumidor',
          name: 'Serasa Consumidor',
          price: 5.50,
          defaultPrice: 5.00
        },
        {
          code: '1003-serasa-empresarial',
          name: 'Serasa Empresarial',
          price: 8.75,
          defaultPrice: 8.00
        }
      ])
    } as Response);

    render(<PluginPricingPage />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'bigtech' } });

    await waitFor(() => {
      expect(screen.getByText('Serasa Consumidor')).toBeInTheDocument();
      expect(screen.getByText('Serasa Empresarial')).toBeInTheDocument();
    });
  });

  it('should update service price', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            code: '11-serasa-consumidor',
            name: 'Serasa Consumidor',
            price: 5.50,
            defaultPrice: 5.00
          }
        ])
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      } as Response);

    render(<PluginPricingPage />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'bigtech' } });

    await waitFor(() => {
      const priceInput = screen.getByDisplayValue('5.50');
      fireEvent.change(priceInput, { target: { value: '6.00' } });

      const saveButton = screen.getByText('Salvar Preços');
      fireEvent.click(saveButton);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/plugins/bigtech/config'),
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"11-serasa-consumidor":6')
      })
    );
  });

  it('should validate price input', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([
        {
          code: '11-serasa-consumidor',
          name: 'Serasa Consumidor',
          price: 5.50,
          defaultPrice: 5.00
        }
      ])
    } as Response);

    render(<PluginPricingPage />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'bigtech' } });

    await waitFor(() => {
      const priceInput = screen.getByDisplayValue('5.50');
      fireEvent.change(priceInput, { target: { value: '-1' } });
    });

    expect(screen.getByText('O preço deve ser maior que zero')).toBeInTheDocument();
  });
});