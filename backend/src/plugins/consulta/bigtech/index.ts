// Baseado em: 2.Architecture.md v1.0, 4.Entities.md v1.7
// Plugin BigTech - Implementação principal

import { Plugin, PluginContext, PluginResult } from '../../../core/pluginLoader';
import { BigTechConfig, BigTechRequest, BigTechResponse, BigTechRateLimitEntry, BigTechFallbackConfig, BigTechCircuitBreakerState } from './types';
import { defaultConfig, bigTechServices, serviceCategories, servicePrices } from './config';
import { Validator, ValidationError } from './validator';
import { auditLogger } from '../../../core/audit';
import { billingEngine } from '../../../core/billingEngine';
import { eventBus } from '../../../core/eventBus';

export class BigTechPlugin implements Plugin {
  id = 'bigtech';
  type: 'consulta' = 'consulta';
  version = '1.0.0';

  private config: BigTechConfig;
  private validator: Validator;

  // Rate limiting state
  private rateLimitMap: Map<string, BigTechRateLimitEntry> = new Map();

  // Circuit breaker state
  private circuitBreakerMap: Map<string, BigTechCircuitBreakerState> = new Map();

  // Fallback configuration
  private fallbackConfig: BigTechFallbackConfig = {
    // Vehicle services can fallback to each other
    '411-crlv-ro': ['412-crlv-rr', '415-crlv-se', '416-crlv-sp'],
    '412-crlv-rr': ['411-crlv-ro', '415-crlv-se', '416-crlv-sp'],
    '415-crlv-se': ['411-crlv-ro', '412-crlv-rr', '416-crlv-sp'],
    '416-crlv-sp': ['411-crlv-ro', '412-crlv-rr', '415-crlv-se'],
    // Credit services can fallback to similar services
    '304-positivo-define-risco-cnpj': ['370-positivo-acerta-essencial-pf'],
    '370-positivo-acerta-essencial-pf': ['304-positivo-define-risco-cnpj'],
  };

  constructor(config?: Partial<BigTechConfig>) {
    this.config = { ...defaultConfig, ...config };
    this.validator = new Validator();
  }

  /**
   * Instala o plugin BigTech
   */
  async install(): Promise<void> {
    console.log('🔧 Instalando plugin BigTech...');

    // Validar configuração
    await this.validateConfig();

    console.log('✅ Plugin BigTech instalado com sucesso');
  }

  /**
   * Habilita o plugin
   */
  async enable(): Promise<void> {
    console.log(`🔧 Habilitando plugin BigTech`);
    // Implementar lógica específica se necessário
  }

  /**
   * Desabilita o plugin
   */
  async disable(): Promise<void> {
    console.log(`🔧 Desabilitando plugin BigTech`);
    // Implementar lógica específica se necessário
  }

  /**
   * Executa uma consulta BigTech
   */
  async execute(context: PluginContext): Promise<PluginResult> {
    const startTime = Date.now();

    try {
      const { input, config } = context;
      const serviceCode = input.serviceCode || input.service;

      if (!serviceCode) {
        throw new Error('serviceCode é obrigatório');
      }

      // Validar entrada usando o validador centralizado
      this.validator.validateInput(serviceCode, input);

      // Aplicar rate limiting avançado
      await this.enforceAdvancedRateLimit(serviceCode);

      // Tentar executar com fallbacks
      const result = await this.executeWithFallbacks(context, serviceCode);

      // Normalizar saída usando o validador
      const normalizedData = this.validator.normalizeOutput(serviceCode, result.data);

      // Calcular custo
      const category = serviceCategories[serviceCode as keyof typeof serviceCategories];
      const cost = servicePrices[category as keyof typeof servicePrices];

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          ...normalizedData,
          consultaId: input.consultaId || `bigtech-${serviceCode}-${Date.now()}`
        },
        cost,
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`❌ Erro na execução BigTech:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        cost: 0,
      };
    }
  }

  /**
   * Valida a configuração do plugin
   */
  private async validateConfig(): Promise<void> {
    if (!this.config.baseUrl) {
      throw new Error('BigTech: baseUrl é obrigatório na configuração');
    }

    if (this.config.timeout < 1000) {
      throw new Error('BigTech: timeout deve ser pelo menos 1000ms');
    }

    if (this.config.retries < 0) {
      throw new Error('BigTech: retries deve ser >= 0');
    }
  }

  /**
   * Prepara o payload da requisição baseado no serviço
   */
  private prepareRequestPayload(serviceCode: string, input: any): any {
    // Lógica específica para cada serviço baseada na documentação
    switch (serviceCode) {
      // Serviços Cadastrais
      case '320-contatos-por-cep':
        return this.prepareContatosPorCepPayload(input);

      case '327-quod-cadastral-pf':
        return this.prepareQuodCadastralPfPayload(input);

      case '424-validacao-localizacao':
        return this.prepareValidacaoLocalizacaoPayload(input);

      case '431-dados-cnh':
        return this.prepareDadosCnhPayload(input);

      // Serviços de Crédito
      case '36-busca-nome-uf':
        return this.prepareBuscaNomeUfPayload(input);

      case '39-teleconfirma':
        return this.prepareTeleConfirmaPayload(input);

      case '41-protesto-sintetico-nacional':
        return this.prepareProtestoSinteticoPayload(input);

      case '304-positivo-define-risco-cnpj':
        return this.preparePositivoDefineRiscoCnpjPayload(input);

      case '370-positivo-acerta-essencial-pf':
        return this.preparePositivoAcertaEssencialPfPayload(input);

      case '1539-bvs-basica-pf':
        return this.prepareBvsBasicaPfPayload(input);

      case 'BVSBasicaPF':
        return this.prepareBvsBasicaPfPayload(input);

      case '11-bvs-basica-pj':
        return this.prepareBvsBasicaPjPayload(input);

      case '1003-scr-premium-integracoes':
        return this.prepareScrPremiumIntegracoesPayload(input);

      case '411-crlv-ro':
        return this.prepareCrlvRoPayload(input);

      case '412-crlv-rr':
        return this.prepareCrlvRrPayload(input);

      case '415-crlv-se':
        return this.prepareCrlvSePayload(input);

      case '416-crlv-sp':
        return this.prepareCrlvSpPayload(input);

      default:
        return input;
    }
  }

  /**
   * Prepara payload para serviço 320 - Contatos Por CEP
   */
  private prepareContatosPorCepPayload(input: any): any {
    if (!input.cep) {
      throw new Error('CEP é obrigatório para o serviço 320-Contatos Por CEP');
    }

    // Usar validador centralizado para CEP
    const cepValidado = this.validator.validateCep(input.cep);

    return {
      CodigoProduto: "1465",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        Cep: cepValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 327 - QUOD CADASTRAL PF
   */
  private prepareQuodCadastralPfPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPF/CNPJ é obrigatório para o serviço 327-QUOD CADASTRAL PF');
    }

    if (!input.tipoPessoa || !['F', 'J'].includes(input.tipoPessoa)) {
      throw new Error('TipoPessoa deve ser "F" (física) ou "J" (jurídica)');
    }

    // Usar validador centralizado para CPF/CNPJ
    const documentoValidado = input.tipoPessoa === 'F'
      ? this.validator.validateCpf(input.cpfCnpj)
      : this.validator.validateCnpj(input.cpfCnpj);

    return {
      CodigoProduto: "1468",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: input.tipoPessoa,
        CPFCNPJ: documentoValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 424 - ValidaID - Localizacao
   */
  private prepareValidacaoLocalizacaoPayload(input: any): any {
    if (!input.cpf) {
      throw new Error('CPF é obrigatório para o serviço 424-ValidaID - Localizacao');
    }

    // Usar validador centralizado para CPF
    const cpfValidado = this.validator.validateCpf(input.cpf);

    return {
      CodigoProduto: "1475",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "F",
        CPFCNPJ: cpfValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 431 - Dados de CNH
   */
  private prepareDadosCnhPayload(input: any): any {
    if (!input.cpf) {
      throw new Error('CPF é obrigatório para o serviço 431-Dados de CNH');
    }

    // Usar validador centralizado para CPF
    const cpfValidado = this.validator.validateCpf(input.cpf);

    return {
      CodigoProduto: "1476",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "F",
        CPFCNPJ: cpfValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 36 - Busca por Nome+UF
   */
  private prepareBuscaNomeUfPayload(input: any): any {
    if (!input.uf) {
      throw new Error('UF é obrigatório para o serviço 36-Busca por Nome+UF');
    }

    if (!input.nomeCompleto) {
      throw new Error('NomeCompleto é obrigatório para o serviço 36-Busca por Nome+UF');
    }

    // Validar UF (2 letras maiúsculas)
    const ufUpper = input.uf.toUpperCase();
    if (!/^[A-Z]{2}$/.test(ufUpper)) {
      throw new Error('UF deve ter exatamente 2 letras maiúsculas');
    }

    return {
      CodigoProduto: "1449",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        UF: ufUpper,
        NomeCompleto: input.nomeCompleto
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 39 - TeleConfirma
   */
  private prepareTeleConfirmaPayload(input: any): any {
    if (!input.ddd) {
      throw new Error('DDD é obrigatório para o serviço 39-TeleConfirma');
    }

    if (!input.telefone) {
      throw new Error('Telefone é obrigatório para o serviço 39-TeleConfirma');
    }

    // Usar validador centralizado para telefone
    const telefoneValidado = this.validator.validatePhone(`${input.ddd}${input.telefone}`);

    return {
      CodigoProduto: "1450",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        DDD: telefoneValidado.ddd,
        Telefone: telefoneValidado.numero
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 41 - PROTESTO SINTÉTICO NACIONAL
   */
  private prepareProtestoSinteticoPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPFCNPJ é obrigatório para o serviço 41-PROTESTO SINTÉTICO NACIONAL');
    }

    if (!input.tipoPessoa || !['F', 'J'].includes(input.tipoPessoa)) {
      throw new Error('TipoPessoa deve ser "F" (física) ou "J" (jurídica)');
    }

    // Usar validador centralizado para CPF/CNPJ
    const documentoValidado = input.tipoPessoa === 'F'
      ? this.validator.validateCpf(input.cpfCnpj)
      : this.validator.validateCnpj(input.cpfCnpj);

    return {
      CodigoProduto: "1451",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: input.tipoPessoa,
        CPFCNPJ: documentoValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 304 - POSITIVO DEFINE RISCO CNPJ
   */
  private preparePositivoDefineRiscoCnpjPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPFCNPJ é obrigatório para o serviço 304-POSITIVO DEFINE RISCO CNPJ');
    }

    // Usar validador centralizado para CNPJ
    const cnpjValidado = this.validator.validateCnpj(input.cpfCnpj);

    return {
      CodigoProduto: "1464",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "J",
        CPFCNPJ: cnpjValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 370 - POSITIVO ACERTA ESSENCIAL PF
   */
  private preparePositivoAcertaEssencialPfPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPFCNPJ é obrigatório para o serviço 370-POSITIVO ACERTA ESSENCIAL PF');
    }

    // Usar validador centralizado para CPF
    const cpfValidado = this.validator.validateCpf(input.cpfCnpj);

    return {
      CodigoProduto: "1471",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "F",
        CPFCNPJ: cpfValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 1539 - BVS BASICA PF
   */
  private prepareBvsBasicaPfPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPFCNPJ é obrigatório para o serviço 1539-BVS BASICA PF');
    }

    // Usar validador centralizado para CPF
    const cpfValidado = this.validator.validateCpf(input.cpfCnpj);

    return {
      CodigoProduto: "1539",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "F",
        CPFCNPJ: cpfValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 11 - BVS BASICA PJ
   */
  private prepareBvsBasicaPjPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPFCNPJ é obrigatório para o serviço 11-BVS BASICA PJ');
    }

    // Usar validador centralizado para CNPJ
    const cnpjValidado = this.validator.validateCnpj(input.cpfCnpj);

    return {
      CodigoProduto: "11",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: "J",
        CPFCNPJ: cnpjValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 1003 - SCR Premium + Integrações
   */
  private prepareScrPremiumIntegracoesPayload(input: any): any {
    if (!input.cpfCnpj) {
      throw new Error('CPFCNPJ é obrigatório para o serviço 1003-SCR Premium + Integrações');
    }

    const documento = input.cpfCnpj.replace(/\D/g, '');
    let tipoPessoa: string;
    let documentoValidado: string;

    if (documento.length === 11) {
      tipoPessoa = "F";
      documentoValidado = this.validator.validateCpf(input.cpfCnpj);
    } else if (documento.length === 14) {
      tipoPessoa = "J";
      documentoValidado = this.validator.validateCnpj(input.cpfCnpj);
    } else {
      throw new Error('CPFCNPJ deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)');
    }

    return {
      CodigoProduto: "1003",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        TipoPessoa: tipoPessoa,
        CPFCNPJ: documentoValidado
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 411 - CRLV RO
   */
  private prepareCrlvRoPayload(input: any): any {
    if (!input.placa) {
      throw new Error('Placa é obrigatória para o serviço 411-CRLV RO');
    }

    // Usar validador centralizado para placa
    const placaValidada = this.validator.validatePlaca(input.placa);

    return {
      CodigoProduto: "1527",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        Placa: placaValidada
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 412 - CRLV RR
   */
  private prepareCrlvRrPayload(input: any): any {
    if (!input.placa) {
      throw new Error('Placa é obrigatória para o serviço 412-CRLV RR');
    }

    // Usar validador centralizado para placa
    const placaValidada = this.validator.validatePlaca(input.placa);

    return {
      CodigoProduto: "1528",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        Placa: placaValidada
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 415 - CRLV SE
   */
  private prepareCrlvSePayload(input: any): any {
    if (!input.placa) {
      throw new Error('Placa é obrigatória para o serviço 415-CRLV SE');
    }

    // Usar validador centralizado para placa
    const placaValidada = this.validator.validatePlaca(input.placa);

    return {
      CodigoProduto: "1531",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        Placa: placaValidada
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Prepara payload para serviço 416 - CRLV SP
   */
  private prepareCrlvSpPayload(input: any): any {
    if (!input.placa) {
      throw new Error('Placa é obrigatória para o serviço 416-CRLV SP');
    }

    // Usar validador centralizado para placa
    const placaValidada = this.validator.validatePlaca(input.placa);

    return {
      CodigoProduto: "1532",
      Versao: "20180521",
      ChaveAcesso: this.config.apiKey || '',
      Info: {
        Solicitante: input.solicitante || ''
      },
      Parametros: {
        Placa: placaValidada
      },
      WebHook: {
        UrlCallBack: input.webhookUrl || ''
      }
    };
  }

  /**
   * Faz requisição HTTP com lógica de retry para a API BigTech
   */
  private async makeRequestWithRetry(payload: any, serviceCode?: string): Promise<any> {
    let lastError: Error | null = null;

    // Obter timeout baseado na categoria do serviço
    const timeout = this.getTimeoutForService(serviceCode);

    // Escolher URL baseada na configuração
    const url = this.config.useHomologation ? this.config.homologationUrl : this.config.baseUrl;

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'BigTech-Plugin/1.0.0',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeout),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.config.retries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt); // Exponential backoff
          console.warn(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Falha após todas as tentativas de retry');
  }

  /**
   * Obtém timeout baseado na categoria do serviço
   */
  private getTimeoutForService(serviceCode?: string): number {
    if (!serviceCode) return this.config.timeout;

    const category = serviceCategories[serviceCode as keyof typeof serviceCategories];
    const timeouts: Record<string, number> = {
      'cadastral': 15000,  // 15 segundos para serviços cadastrais
      'credito': 20000,    // 20 segundos para serviços de crédito
      'veicular': 10000,   // 10 segundos para serviços veiculares
    };

    return timeouts[category] || this.config.timeout;
  }

  /**
   * Normaliza a resposta da API BigTech
   */
  private normalizeResponse(serviceCode: string, response: any): any {
    // Verificar se houve erro na resposta
    if (!response.HEADER?.INFORMACOES_RETORNO?.STATUS_RETORNO) {
      throw new Error('Resposta inválida da API BigTech');
    }

    const status = response.HEADER.INFORMACOES_RETORNO.STATUS_RETORNO;

    if (status.CODIGO !== "1") {
      throw new Error(`Consulta falhou: ${status.DESCRICAO}`);
    }

    // Normalizar baseado no serviço
    switch (serviceCode) {
      case '320-contatos-por-cep':
        return this.normalizeContatosPorCepResponse(response);

      case '327-quod-cadastral-pf':
        return this.normalizeQuodCadastralPfResponse(response);

      case '424-validacao-localizacao':
        return this.normalizeValidacaoLocalizacaoResponse(response);

      case '431-dados-cnh':
        return this.normalizeDadosCnhResponse(response);

      // Serviços de Crédito
      case '36-busca-nome-uf':
        return this.normalizeBuscaNomeUfResponse(response);

      case '39-teleconfirma':
        return this.normalizeTeleConfirmaResponse(response);

      case '41-protesto-sintetico-nacional':
        return this.normalizeProtestoSinteticoResponse(response);

      case '304-positivo-define-risco-cnpj':
        return this.normalizePositivoDefineRiscoCnpjResponse(response);

      case '370-positivo-acerta-essencial-pf':
        return this.normalizePositivoAcertaEssencialPfResponse(response);

      case '1539-bvs-basica-pf':
        return this.normalizeBvsBasicaPfResponse(response);

      case 'BVSBasicaPF':
        return this.normalizeBvsBasicaPfResponse(response);

      case '11-bvs-basica-pj':
        return this.normalizeBvsBasicaPjResponse(response);

      case '1003-scr-premium-integracoes':
        return this.normalizeScrPremiumIntegracoesResponse(response);

      // Serviços Veiculares
      case '411-crlv-ro':
        return this.normalizeCrlvRoResponse(response);

      case '412-crlv-rr':
        return this.normalizeCrlvRrResponse(response);

      case '415-crlv-se':
        return this.normalizeCrlvSeResponse(response);

      case '416-crlv-sp':
        return this.normalizeCrlvSpResponse(response);
    }
  }

  /**
   * Normaliza resposta do serviço 320 - Contatos Por CEP
   */
  private normalizeContatosPorCepResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    const normalized = {
      success: true,
      service: '320-contatos-por-cep',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        cep: params.CEP
      },
      dados: {
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        contatos: dadosRetornados.CONTATOS === "1",
        telefones: {
          fixo: dadosRetornados.TELEFONE_FIXO === "1",
          celular: dadosRetornados.TELEFONE_CELULAR === "1",
          comercial: dadosRetornados.TELEFONE_COMERCIAL === "1"
        },
        emails: dadosRetornados.EMAILS === "1",
        residentes: dadosRetornados.RESIDENTES === "1",
        vizinhos: dadosRetornados.VIZINHOS === "1"
      },
      rawResponse: response
    };

    // Aplicar sanitização usando o validador
    return this.validator.sanitizeOutput('320-contatos-por-cep', normalized);
  }

  /**
   * Normaliza resposta do serviço 327 - QUOD CADASTRAL PF
   */
  private normalizeQuodCadastralPfResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    const normalized = {
      success: true,
      service: '327-quod-cadastral-pf',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        receitaFederal: dadosRetornados.DADOS_RECEITA_FEDERAL === "1",
        enderecos: dadosRetornados.ENDERECOS === "1",
        telefones: {
          fixo: dadosRetornados.TELEFONE_FIXO === "1",
          celular: dadosRetornados.TELEFONE_CELULAR === "1",
          comercial: dadosRetornados.TELEFONE_COMERCIAL === "1"
        },
        emails: dadosRetornados.EMAILS === "1",
        dadosGerais: dadosRetornados.DADOS_GERAIS === "1",
        ocupacao: dadosRetornados.OCUPACAO_PESSOA_FISICA === "1",
        parentes: dadosRetornados.PARENTES === "1",
        locaisTrabalho: dadosRetornados.LOCAIS_TRABALHO === "1",
        beneficios: dadosRetornados.BENEFICIO === "1",
        infoBusca: dadosRetornados.INFOBUSCA === "1",
        cnh: dadosRetornados.CNH === "1",
        veiculos: dadosRetornados.VEICULOS_POR_DOCUMENTO === "1"
      },
      rawResponse: response
    };

    // Aplicar sanitização usando o validador
    return this.validator.sanitizeOutput('327-quod-cadastral-pf', normalized);
  }

  /**
   * Normaliza resposta do serviço 424 - ValidaID - Localizacao
   */
  private normalizeValidacaoLocalizacaoResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '424-validacao-localizacao',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpf: params.CPFCNPJ
      },
      dados: {
        validacaoPessoaFisica: dadosRetornados.VALIDACAO_PESSOA_FISICA === "1",
        validacaoPfBasica: dadosRetornados.VALIDACAO_PF_BASICA === "1",
        validacaoPfBiometriaFace: dadosRetornados.VALIDACAO_PF_BIOMETRIA_FACE === "1",
        validacaoPfCnh: dadosRetornados.VALIDACAO_PF_CNH === "1",
        validacaoPfDocumento: dadosRetornados.VALIDACAO_PF_DOCUMENTO === "1",
        validacaoPfEndereco: dadosRetornados.VALIDACAO_PF_ENDERECO === "1",
        validacaoPfFiliacao: dadosRetornados.VALIDACAO_PF_FILIACAO === "1"
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 431 - Dados de CNH
   */
  private normalizeDadosCnhResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '431-dados-cnh',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpf: params.CPFCNPJ
      },
      dados: {
        cnh: dadosRetornados.CNH === "1",
        validacaoPfCnh: dadosRetornados.VALIDACAO_PF_CNH === "1",
        renach: dadosRetornados.RENACH === "1"
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 36 - Busca por Nome+UF
   */
  private normalizeBuscaNomeUfResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '36-busca-nome-uf',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        uf: params.UF,
        nomeCompleto: params.NomeCompleto
      },
      dados: {
        credCadastral: response.CREDCADASTRAL || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 39 - TeleConfirma
   */
  private normalizeTeleConfirmaResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '39-teleconfirma',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        ddd: params.DDD,
        telefone: params.TELEFONE
      },
      dados: {
        titularTelefone: dadosRetornados.TITULAR_DO_TELEFONE === "1",
        telefones: response.CREDCADASTRAL?.TITULAR_DO_TELEFONE?.TELEFONES || []
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 41 - PROTESTO SINTÉTICO NACIONAL
   */
  private normalizeProtestoSinteticoResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '41-protesto-sintetico-nacional',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        protestoSintetico: dadosRetornados.PROTESTO_SINTETICO === "1",
        protesto: response.CREDCADASTRAL?.PROTESTO_SINTETICO || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 304 - POSITIVO DEFINE RISCO CNPJ
   */
  private normalizePositivoDefineRiscoCnpjResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;

    return {
      success: true,
      service: '304-positivo-define-risco-cnpj',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        // Este serviço retorna apenas análise de risco, sem dados específicos
        analiseRisco: true
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 370 - POSITIVO ACERTA ESSENCIAL PF
   */
  private normalizePositivoAcertaEssencialPfResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;

    return {
      success: true,
      service: '370-positivo-acerta-essencial-pf',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        // Este serviço retorna apenas análise de risco, sem dados específicos
        analiseRisco: true
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 1539 - BVS BASICA PF
   */
  private normalizeBvsBasicaPfResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '1539-bvs-basica-pf',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        receitaFederal: dadosRetornados.DADOS_RECEITA_FEDERAL === "1",
        informacoesAlertasRestricoes: dadosRetornados.INFORMACOES_ALERTAS_RESTRICOES === "1",
        dadosAgenciaBancaria: dadosRetornados.DADOS_AGENCIA_BANCARIA === "1",
        pendenciasFinanceiras: dadosRetornados.PENDENCIAS_FINANCEIRAS === "1",
        protestos: dadosRetornados.PROTESTO_ANALITICO === "1",
        recheque: dadosRetornados.RECHEQUE === "1",
        contumacia: dadosRetornados.CONTUMACIA === "1",
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        credCadastral: response.CREDCADASTRAL || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 11 - BVS BASICA PJ
   */
  private normalizeBvsBasicaPjResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '11-bvs-basica-pj',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        receitaFederal: dadosRetornados.DADOS_RECEITA_FEDERAL === "1",
        informacoesAlertasRestricoes: dadosRetornados.INFORMACOES_ALERTAS_RESTRICOES === "1",
        dadosAgenciaBancaria: dadosRetornados.DADOS_AGENCIA_BANCARIA === "1",
        pendenciasFinanceiras: dadosRetornados.PENDENCIAS_FINANCEIRAS === "1",
        protestos: dadosRetornados.PROTESTO_ANALITICO === "1",
        recheque: dadosRetornados.RECHEQUE === "1",
        contumacia: dadosRetornados.CONTUMACIA === "1",
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        credCadastral: response.CREDCADASTRAL || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 1003 - SCR Premium + Integrações
   */
  private normalizeScrPremiumIntegracoesResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '1003-scr-premium-integracoes',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        tipoPessoa: params.TIPO_PESSOA,
        cpfCnpj: params.CPFCNPJ
      },
      dados: {
        // SCR Premium inclui dados completos de crédito
        receitaFederal: dadosRetornados.DADOS_RECEITA_FEDERAL === "1",
        informacoesAlertasRestricoes: dadosRetornados.INFORMACOES_ALERTAS_RESTRICOES === "1",
        dadosAgenciaBancaria: dadosRetornados.DADOS_AGENCIA_BANCARIA === "1",
        pendenciasFinanceiras: dadosRetornados.PENDENCIAS_FINANCEIRAS === "1",
        protestos: dadosRetornados.PROTESTO_ANALITICO === "1",
        recheque: dadosRetornados.RECHEQUE === "1",
        contumacia: dadosRetornados.CONTUMACIA === "1",
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        score: dadosRetornados.SCORE === "1",
        relatorioScr: dadosRetornados.RELATORIO_SCR === "1",
        relatorioScrSintetico: dadosRetornados.RELATORIO_SCR_SINTETICO === "1",
        relatorioScrEncapsulado: dadosRetornados.RELATORIO_SCR_ENCAPSULADO === "1",
        credCadastral: response.CREDCADASTRAL || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 411 - CRLV RO
   */
  private normalizeCrlvRoResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '411-crlv-ro',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        placa: params.PLACA
      },
      dados: {
        // Dados específicos do veículo em Rondônia
        crlv: dadosRetornados.CRLV === "1",
        proprietarioAtual: dadosRetornados.PROPRIETARIO_ATUAL_VEICULO === "1",
        historicoProprietarios: dadosRetornados.HISTORICO_PROPRIETARIOS === "1",
        gravame: dadosRetornados.GRAVAME === "1",
        rouboFurto: dadosRetornados.ROUBO_FURTO === "1",
        perdaTotal: dadosRetornados.PERDA_TOTAL === "1",
        alertas: dadosRetornados.ALERTAS === "1",
        recall: dadosRetornados.RECALL === "1",
        dpvat: dadosRetornados.DPVAT === "1",
        debitosIpva: dadosRetornados.DEBITOS_IPVA === "1",
        restricoesFinanceiras: dadosRetornados.RESTRICOES_FINANCEIRAS === "1",
        veicular: response.VEICULAR || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 412 - CRLV RR
   */
  private normalizeCrlvRrResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '412-crlv-rr',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        placa: params.PLACA
      },
      dados: {
        // Dados específicos do veículo em Roraima
        crlv: dadosRetornados.CRLV === "1",
        proprietarioAtual: dadosRetornados.PROPRIETARIO_ATUAL_VEICULO === "1",
        historicoProprietarios: dadosRetornados.HISTORICO_PROPRIETARIOS === "1",
        gravame: dadosRetornados.GRAVAME === "1",
        rouboFurto: dadosRetornados.ROUBO_FURTO === "1",
        perdaTotal: dadosRetornados.PERDA_TOTAL === "1",
        alertas: dadosRetornados.ALERTAS === "1",
        recall: dadosRetornados.RECALL === "1",
        dpvat: dadosRetornados.DPVAT === "1",
        debitosIpva: dadosRetornados.DEBITOS_IPVA === "1",
        restricoesFinanceiras: dadosRetornados.RESTRICOES_FINANCEIRAS === "1",
        veicular: response.VEICULAR || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 415 - CRLV SE
   */
  private normalizeCrlvSeResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '415-crlv-se',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        placa: params.PLACA
      },
      dados: {
        // Dados específicos do veículo em Sergipe
        crlv: dadosRetornados.CRLV === "1",
        proprietarioAtual: dadosRetornados.PROPRIETARIO_ATUAL_VEICULO === "1",
        historicoProprietarios: dadosRetornados.HISTORICO_PROPRIETARIOS === "1",
        gravame: dadosRetornados.GRAVAME === "1",
        rouboFurto: dadosRetornados.ROUBO_FURTO === "1",
        perdaTotal: dadosRetornados.PERDA_TOTAL === "1",
        alertas: dadosRetornados.ALERTAS === "1",
        recall: dadosRetornados.RECALL === "1",
        dpvat: dadosRetornados.DPVAT === "1",
        debitosIpva: dadosRetornados.DEBITOS_IPVA === "1",
        restricoesFinanceiras: dadosRetornados.RESTRICOES_FINANCEIRAS === "1",
        veicular: response.VEICULAR || {}
      },
      rawResponse: response
    };
  }

  /**
   * Normaliza resposta do serviço 416 - CRLV SP
   */
  private normalizeCrlvSpResponse(response: any): any {
    const header = response.HEADER;
    const info = header.INFORMACOES_RETORNO;
    const params = header.PARAMETROS;
    const dadosRetornados = header.DADOS_RETORNADOS;

    return {
      success: true,
      service: '416-crlv-sp',
      chaveConsulta: info.CHAVE_CONSULTA,
      dataHora: info.DATA_HORA_CONSULTA,
      parametros: {
        placa: params.PLACA
      },
      dados: {
        // Dados específicos do veículo em São Paulo
        crlv: dadosRetornados.CRLV === "1",
        proprietarioAtual: dadosRetornados.PROPRIETARIO_ATUAL_VEICULO === "1",
        historicoProprietarios: dadosRetornados.HISTORICO_PROPRIETARIOS === "1",
        gravame: dadosRetornados.GRAVAME === "1",
        rouboFurto: dadosRetornados.ROUBO_FURTO === "1",
        perdaTotal: dadosRetornados.PERDA_TOTAL === "1",
        alertas: dadosRetornados.ALERTAS === "1",
        recall: dadosRetornados.RECALL === "1",
        dpvat: dadosRetornados.DPVAT === "1",
        debitosIpva: dadosRetornados.DEBITOS_IPVA === "1",
        restricoesFinanceiras: dadosRetornados.RESTRICOES_FINANCEIRAS === "1",
        veicular: response.VEICULAR || {}
      },
      rawResponse: response
    };
  }

  /**
   * Aplica rate limiting avançado com controle por tenant/serviço
   */
  private async enforceAdvancedRateLimit(serviceCode: string): Promise<void> {
    const now = Date.now();
    const key = serviceCode;

    // Obter ou criar entrada de rate limiting
    let entry = this.rateLimitMap.get(key);
    if (!entry) {
      entry = {
        serviceCode,
        requests: 0,
        windowStart: now,
        windowSize: this.config.rateLimitWindowMs || 60000, // 1 minuto padrão
      };
      this.rateLimitMap.set(key, entry);
    }

    // Verificar se a janela expirou
    if (now - entry.windowStart >= entry.windowSize) {
      entry.requests = 0;
      entry.windowStart = now;
    }

    // Obter limite baseado na categoria do serviço
    const category = serviceCategories[serviceCode as keyof typeof serviceCategories];
    const limit = this.getRateLimitForCategory(category);

    // Verificar se excedeu o limite
    if (entry.requests >= limit) {
      const resetTime = entry.windowStart + entry.windowSize;
      const waitTime = resetTime - now;
      throw new Error(`Rate limit excedido para ${serviceCode}. Aguarde ${Math.ceil(waitTime / 1000)} segundos.`);
    }

    // Incrementar contador
    entry.requests++;

    // Aplicar delay mínimo se configurado
    if (this.config.minRequestInterval > 0) {
      await new Promise(resolve => setTimeout(resolve, this.config.minRequestInterval));
    }
  }

  /**
   * Obtém limite de rate limiting baseado na categoria
   */
  private getRateLimitForCategory(category: string): number {
    const limits: Record<string, number> = {
      'cadastral': 10,  // 10 requests por minuto
      'credito': 5,     // 5 requests por minuto
      'veicular': 8,    // 8 requests por minuto
    };

    return limits[category] || 5; // Default: 5 requests por minuto
  }

  /**
   * Executa consulta com sistema de fallbacks
   */
  private async executeWithFallbacks(context: PluginContext, primaryServiceCode: string): Promise<{ data: any; serviceUsed: string }> {
    const triedServices = new Set<string>();
    let lastError: Error | null = null;

    // Lista de serviços a tentar (primário + fallbacks)
    const servicesToTry = [primaryServiceCode, ...(this.fallbackConfig[primaryServiceCode] || [])];

    for (const serviceCode of servicesToTry) {
      if (triedServices.has(serviceCode)) continue;
      triedServices.add(serviceCode);

      try {
        // Verificar circuit breaker
        if (this.isCircuitBreakerOpen(serviceCode)) {
          console.warn(`⏰ Circuit breaker aberto para ${serviceCode}, pulando...`);
          continue;
        }

        // Preparar payload da requisição
        const payload = this.prepareRequestPayload(serviceCode, context.input);

        // Executar requisição com retry logic
        const response = await this.makeRequestWithRetry(payload, serviceCode);

        // Normalizar resposta
        const normalizedResponse = this.normalizeResponse(serviceCode, response);

        // Reset circuit breaker em caso de sucesso
        this.resetCircuitBreaker(serviceCode);

        return {
          data: normalizedResponse,
          serviceUsed: serviceCode
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Registrar falha no circuit breaker
        this.recordCircuitBreakerFailure(serviceCode);

        console.warn(`⚠️ Falha no serviço ${serviceCode}: ${lastError.message}`);

        // Se não é o serviço primário, continuar tentando fallbacks
        if (serviceCode !== primaryServiceCode) {
          continue;
        }
      }
    }

    // Se chegou aqui, todos os serviços falharam
    throw lastError || new Error(`Todos os serviços falharam para ${primaryServiceCode}`);
  }

  /**
   * Verifica se o circuit breaker está aberto
   */
  private isCircuitBreakerOpen(serviceCode: string): boolean {
    const state = this.circuitBreakerMap.get(serviceCode);
    if (!state) return false;

    const now = Date.now();

    switch (state.state) {
      case 'open':
        if (now >= state.nextAttemptTime) {
          // Tempo de tentar novamente
          state.state = 'half-open';
          return false;
        }
        return true;

      case 'half-open':
        return false;

      case 'closed':
      default:
        return false;
    }
  }

  /**
   * Registra falha no circuit breaker
   */
  private recordCircuitBreakerFailure(serviceCode: string): void {
    const now = Date.now();
    let state = this.circuitBreakerMap.get(serviceCode);

    if (!state) {
      state = {
        serviceCode,
        failures: 0,
        lastFailureTime: now,
        state: 'closed',
        nextAttemptTime: 0,
      };
      this.circuitBreakerMap.set(serviceCode, state);
    }

    state.failures++;
    state.lastFailureTime = now;

    // Abrir circuit breaker após 5 falhas consecutivas
    if (state.failures >= 5 && state.state === 'closed') {
      state.state = 'open';
      state.nextAttemptTime = now + 60000; // 1 minuto
      console.warn(`🔴 Circuit breaker aberto para ${serviceCode} após ${state.failures} falhas`);
    }
  }

  /**
   * Reseta circuit breaker em caso de sucesso
   */
  private resetCircuitBreaker(serviceCode: string): void {
    const state = this.circuitBreakerMap.get(serviceCode);
    if (state) {
      state.failures = 0;
      state.state = 'closed';
      state.nextAttemptTime = 0;
    }
  }

  /**
   * Lista todos os serviços disponíveis
   */
  getAvailableServices(): any[] {
    const services = Object.keys(bigTechServices);
    return services.map(serviceCode => {
      const category = serviceCategories[serviceCode as keyof typeof serviceCategories];
      const price = servicePrices[category as keyof typeof servicePrices];

      // Mapeamento de nomes e descrições dos serviços
      const serviceNames: Record<string, string> = {
        '320-contatos-por-cep': 'Contatos por CEP',
        '327-quod-cadastral-pf': 'QUOD Cadastral PF',
        '424-validid-localizacao': 'ValidaID - Localização',
        '431-dados-cnh': 'Dados de CNH',
        '36-busca-nome-uf': 'Busca por Nome+UF',
        '39-teleconfirma': 'TeleConfirma',
        '41-protesto-sintetico-nacional': 'Protesto Sintético Nacional',
        '304-positivo-define-risco-cnpj': 'Positivo Define Risco CNPJ',
        'positivo-acerta-essencial-pf': 'Positivo Acerta Essencial PF',
        '1539-bvs-basica-pf': 'BVS Básica PF',
        'BVSBasicaPF': 'BVS Básica PF',
        '11-bvs-basica-pj': 'BVS Básica PJ',
        '1003-scr-premium-integracoes': 'SCR Premium + Integrações',
        '411-crlv-ro': 'CRLV RO',
        '412-crlv-rr': 'CRLV RR',
        '415-crlv-se': 'CRLV SE',
        '416-crlv-sp': 'CRLV SP'
      };

      const serviceDescriptions: Record<string, string> = {
        '320-contatos-por-cep': 'Consulta informações de contatos associados a um CEP específico',
        '327-quod-cadastral-pf': 'Consulta completa de dados cadastrais de pessoa física',
        '424-validid-localizacao': 'Validação de identidade com localização geográfica',
        '431-dados-cnh': 'Consulta dados da Carteira Nacional de Habilitação',
        '36-busca-nome-uf': 'Busca de informações de crédito por nome e estado',
        '39-teleconfirma': 'Confirmação de titularidade de telefone',
        '41-protesto-sintetico-nacional': 'Consulta de protestos em todo território nacional',
        '304-positivo-define-risco-cnpj': 'Análise de risco para pessoa jurídica',
        'positivo-acerta-essencial-pf': 'Relatório essencial de crédito pessoa física',
        '1539-bvs-basica-pf': 'Relatório básico BVS para pessoa física',
        'BVSBasicaPF': 'Relatório básico BVS para pessoa física',
        '11-bvs-basica-pj': 'Relatório básico BVS para pessoa jurídica',
        '1003-scr-premium-integracoes': 'Relatório premium SCR com integrações completas',
        '411-crlv-ro': 'Consulta de CRLV para Rondônia',
        '412-crlv-rr': 'Consulta de CRLV para Roraima',
        '415-crlv-se': 'Consulta de CRLV para Sergipe',
        '416-crlv-sp': 'Consulta de CRLV para São Paulo'
      };

      return {
        id: serviceCode,
        name: serviceNames[serviceCode] || serviceCode,
        description: serviceDescriptions[serviceCode] || `Serviço ${serviceCode}`,
        category: category,
        price: price,
        active: true // Todos os serviços estão ativos por padrão
      };
    });
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): BigTechConfig {
    return { ...this.config };
  }

  /**
   * Obtém estatísticas de rate limiting
   */
  getRateLimitStats(): Record<string, BigTechRateLimitEntry> {
    const stats: Record<string, BigTechRateLimitEntry> = {};
    for (const [key, entry] of this.rateLimitMap.entries()) {
      stats[key] = { ...entry };
    }
    return stats;
  }

  /**
   * Obtém estatísticas do circuit breaker
   */
  getCircuitBreakerStats(): Record<string, BigTechCircuitBreakerState> {
    const stats: Record<string, BigTechCircuitBreakerState> = {};
    for (const [key, state] of this.circuitBreakerMap.entries()) {
      stats[key] = { ...state };
    }
    return stats;
  }
}

// Exportar função de factory para o PluginLoader
export function createBigTechPlugin(config?: Partial<BigTechConfig>) {
  return new BigTechPlugin(config);
}

// Exportar instância padrão para compatibilidade com PluginLoader
export default new BigTechPlugin();