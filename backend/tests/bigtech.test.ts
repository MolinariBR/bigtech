// Testes para plugin BigTech
// Baseado em: 8.Tests.md v1.0

import { createBigTechPlugin } from '../src/plugins/consulta/bigtech';
import { PluginContext } from '../src/core/pluginLoader';

describe('BigTech Plugin', () => {
  let plugin: any;

  beforeEach(() => {
    plugin = createBigTechPlugin({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com'
    });
  });

  describe('Serviços Disponíveis', () => {
    it('deve incluir o serviço BVS BASICA PF', () => {
      const services = plugin.getAvailableServices();
      const serviceIds = services.map((s: any) => s.id);
      expect(serviceIds).toContain('1539-bvs-basica-pf');
    });

    it('deve ter todos os serviços esperados', () => {
      const services = plugin.getAvailableServices();
      const serviceIds = services.map((s: any) => s.id);
      expect(serviceIds).toContain('320-contatos-por-cep');
      expect(serviceIds).toContain('36-busca-nome-uf');
      expect(serviceIds).toContain('411-crlv-ro');
      expect(serviceIds).toContain('1539-bvs-basica-pf');
    });
  });

  describe('Configuração', () => {
    it('deve ter configuração padrão quando não especificada', () => {
      const defaultPlugin = createBigTechPlugin();
      const config = defaultPlugin.getConfig();
      expect(config.baseUrl).toBe('https://api.consultasbigtech.com.br/json/service.aspx');
      expect(config.homologationUrl).toBe('https://api.consultasbigtech.com.br/json/homologa.aspx');
      expect(config.useHomologation).toBe(false);
      expect(config.timeout).toBe(30000);
    });

    it('deve permitir configuração customizada', () => {
      const config = plugin.getConfig();
      expect(config.baseUrl).toBe('https://api.test.com');
      expect(config.homologationUrl).toBe('https://api.consultasbigtech.com.br/json/homologa.aspx');
      expect(config.useHomologation).toBe(false);
      expect(config.timeout).toBe(30000);
    });

    it('deve permitir ativar homologação', () => {
      const homologPlugin = createBigTechPlugin({
        baseUrl: 'https://api.test.com',
        useHomologation: true
      });
      const config = homologPlugin.getConfig();
      expect(config.useHomologation).toBe(true);
    });
  });

  describe('Validação de Payload', () => {
    it('deve preparar payload correto para BVS BASICA PF', () => {
      const input = {
        cpfCnpj: '12345678901',
        solicitante: 'test-solicitante'
      };

      // Mock do validador
      const mockValidator = {
        validateCpf: jest.fn().mockReturnValue('12345678901')
      };
      plugin.validator = mockValidator;

      const payload = plugin.prepareRequestPayload('1539-bvs-basica-pf', input);

      expect(payload.CodigoProduto).toBe('1539');
      expect(payload.Versao).toBe('20180521');
      expect(payload.Parametros.TipoPessoa).toBe('F');
      expect(payload.Parametros.CPFCNPJ).toBe('12345678901');
    });

    it('deve falhar se CPF não for fornecido para BVS BASICA PF', () => {
      const input = {};

      expect(() => {
        plugin.prepareRequestPayload('1539-bvs-basica-pf', input);
      }).toThrow('CPFCNPJ é obrigatório para o serviço 1539-BVS BASICA PF');
    });
  });
});