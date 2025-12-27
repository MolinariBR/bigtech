// Teste para analisar estrutura de dados de retorno dos serviços BigTech
// Baseado em: 4.Entities.md v1.7, Docs/APIServicosSelecionados.md

import { BigTechPlugin } from '../src/plugins/consulta/bigtech/index';

async function analyzeResponseStructure() {
  console.log('🔍 Analisando estrutura de dados de retorno dos serviços BigTech...\n');

  const plugin = new BigTechPlugin();

  // Simular contextos de teste para diferentes serviços
  const testContexts = [
    {
      serviceCode: '1539-bvs-basica-pf',
      input: {
        cpfCnpj: '09469124677',
        solicitante: 'Sistema Teste'
      },
      tenantId: 'test-tenant'
    },
    {
      serviceCode: '11-bvs-basica-pj',
      input: {
        cpfCnpj: '51072961000142',
        solicitante: 'Sistema Teste'
      },
      tenantId: 'test-tenant'
    },
    {
      serviceCode: '1003-scr-premium-integracoes',
      input: {
        cpfCnpj: '09469124677',
        solicitante: 'Sistema Teste'
      },
      tenantId: 'test-tenant'
    },
    {
      serviceCode: '320-contatos-por-cep',
      input: {
        cep: '01310100',
        solicitante: 'Sistema Teste'
      },
      tenantId: 'test-tenant'
    },
    {
      serviceCode: '411-crlv-ro',
      input: {
        placa: 'ABC1234',
        solicitante: 'Sistema Teste'
      },
      tenantId: 'test-tenant'
    }
  ];

  console.log('📋 Estrutura esperada de resposta normalizada:\n');

  for (const context of testContexts) {
    console.log(`\n=== Serviço: ${context.serviceCode} ===`);

    try {
      // Simular uma resposta da API BigTech (mock)
      const mockApiResponse = generateMockApiResponse(context.serviceCode);

      console.log('🔹 Resposta bruta da API BigTech:');
      console.log(JSON.stringify(mockApiResponse, null, 2));

      // Simular normalização
      const normalizedResponse = simulateNormalization(context.serviceCode, mockApiResponse);

      console.log('\n🔹 Resposta normalizada para o frontend:');
      console.log(JSON.stringify(normalizedResponse, null, 2));

      console.log('\n✅ Estrutura de exibição sugerida:');
      suggestDisplayStructure(context.serviceCode, normalizedResponse);

    } catch (error) {
      console.error(`❌ Erro no serviço ${context.serviceCode}:`, error);
    }
  }
}

function generateMockApiResponse(serviceCode: string): any {
  // Mock responses baseadas na estrutura real da API BigTech
  const baseResponse: any = {
    HEADER: {
      INFORMACOES_RETORNO: {
        VERSAO: "1.0",
        STATUS_RETORNO: {
          CODIGO: "1",
          DESCRICAO: "Consulta realizada com sucesso"
        },
        CHAVE_CONSULTA: `bigtech-${serviceCode}-${Date.now()}`,
        PRODUTO: serviceCode,
        CLIENTE: "Teste",
        DATA_HORA_CONSULTA: new Date().toISOString(),
        SOLICITANTE: "Sistema Teste",
        TEMPO_RESPOSTA: {
          INICIO: new Date().toISOString(),
          FINAL: new Date().toISOString(),
          INTERVALO: "00:00:01"
        }
      },
      PARAMETROS: {},
      DADOS_RETORNADOS: {},
      CONTROLE: {
        QUANTIDADE_OCORRENCIAS: "1",
        OCORRENCIAS: [{
          CONTEUDO: "Dados encontrados",
          FONTE: "BigTech",
          STATUS: "OK"
        }]
      }
    }
  };

  // Adicionar dados específicos por serviço
  switch (serviceCode) {
    case '1539-bvs-basica-pf':
      baseResponse.HEADER.PARAMETROS = {
        TIPO_PESSOA: "F",
        CPFCNPJ: "09469124677"
      };
      baseResponse.HEADER.DADOS_RETORNADOS = {
        DADOS_RECEITA_FEDERAL: "1",
        INFORMACOES_ALERTAS_RESTRICOES: "1",
        DADOS_AGENCIA_BANCARIA: "1",
        PENDENCIAS_FINANCEIRAS: "1",
        PROTESTO_ANALITICO: "1",
        RECHEQUE: "1",
        CONTUMACIA: "1",
        ENDERECO_DO_CEP: "1"
      };
      baseResponse.CREDCADASTRAL = {
        PESSOA_FISICA: {
          NOME: "JOÃO DA SILVA",
          CPF: "09469124677",
          DATA_NASCIMENTO: "1980-01-15",
          SITUACAO_CADASTRAL: "REGULAR"
        },
        ENDERECOS: [{
          LOGRADOURO: "RUA DAS FLORES",
          NUMERO: "123",
          BAIRRO: "CENTRO",
          CIDADE: "SÃO PAULO",
          UF: "SP",
          CEP: "01310100"
        }],
        TELEFONES: [{
          DDD: "11",
          NUMERO: "999999999",
          TIPO: "CELULAR"
        }],
        EMAILS: ["joao.silva@email.com"],
        SCORE: 750,
        RENDA_PRESUMIDA: 3500.00
      };
      break;

    case '11-bvs-basica-pj':
      baseResponse.HEADER.PARAMETROS = {
        TIPO_PESSOA: "J",
        CPFCNPJ: "51072961000142"
      };
      baseResponse.HEADER.DADOS_RETORNADOS = {
        DADOS_RECEITA_FEDERAL: "1",
        INFORMACOES_ALERTAS_RESTRICOES: "1",
        DADOS_AGENCIA_BANCARIA: "1",
        PENDENCIAS_FINANCEIRAS: "1",
        PROTESTO_ANALITICO: "1",
        RECHEQUE: "1",
        CONTUMACIA: "1",
        ENDERECO_DO_CEP: "1"
      };
      baseResponse.CREDCADASTRAL = {
        PESSOA_JURIDICA: {
          RAZAO_SOCIAL: "EMPRESA EXEMPLO LTDA",
          NOME_FANTASIA: "EXEMPLO EMPRESA",
          CNPJ: "51072961000142",
          DATA_ABERTURA: "2010-05-20",
          SITUACAO_CADASTRAL: "ATIVA"
        },
        ENDERECOS: [{
          LOGRADOURO: "AVENIDA PAULISTA",
          NUMERO: "1000",
          BAIRRO: "BELA VISTA",
          CIDADE: "SÃO PAULO",
          UF: "SP",
          CEP: "01310100"
        }],
        TELEFONES: [{
          DDD: "11",
          NUMERO: "33333333",
          TIPO: "COMERCIAL"
        }],
        SOCIOS: [{
          NOME: "MARIA SOUSA",
          CPF: "12345678901",
          QUALIFICACAO: "SÓCIA ADMINISTRADORA"
        }],
        CAPITAL_SOCIAL: 100000.00,
        PORTE_EMPRESA: "MICROEMPRESA"
      };
      break;

    case '1003-scr-premium-integracoes':
      baseResponse.HEADER.PARAMETROS = {
        TIPO_PESSOA: "F",
        CPFCNPJ: "09469124677"
      };
      baseResponse.HEADER.DADOS_RETORNADOS = {
        DADOS_RECEITA_FEDERAL: "1",
        INFORMACOES_ALERTAS_RESTRICOES: "1",
        DADOS_AGENCIA_BANCARIA: "1",
        PENDENCIAS_FINANCEIRAS: "1",
        PROTESTO_ANALITICO: "1",
        RECHEQUE: "1",
        CONTUMACIA: "1",
        ENDERECO_DO_CEP: "1",
        SCORE: "1",
        RELATORIO_SCR: "1",
        RELATORIO_SCR_SINTETICO: "1",
        RELATORIO_SCR_ENCAPSULADO: "1"
      };
      baseResponse.CREDCADASTRAL = {
        PESSOA_FISICA: {
          NOME: "JOÃO DA SILVA",
          CPF: "09469124677",
          DATA_NASCIMENTO: "1980-01-15"
        },
        SCORE_CREDITO: 780,
        RELATORIO_SCR: {
          RESUMO: {
            VALOR_TOTAL_DIVIDA: 15000.00,
            QUANTIDADE_OPERACOES: 3,
            MODALIDADE_MAIS_RECENTE: "CARTÃO DE CRÉDITO"
          },
          OPERACOES: [{
            MODALIDADE: "CARTÃO DE CRÉDITO",
            VALOR_CONTRATADO: 5000.00,
            VALOR_PARCELA: 250.00,
            QUANTIDADE_PARCELAS: 24,
            INSTITUICAO: "BANCO EXEMPLO"
          }]
        }
      };
      break;

    case '320-contatos-por-cep':
      baseResponse.HEADER.PARAMETROS = {
        CEP: "01310100"
      };
      baseResponse.HEADER.DADOS_RETORNADOS = {
        ENDERECO_DO_CEP: "1",
        CONTATOS: "1",
        TELEFONE_FIXO: "1",
        TELEFONE_CELULAR: "1",
        TELEFONE_COMERCIAL: "1",
        EMAILS: "1",
        RESIDENTES: "1",
        VIZINHOS: "1"
      };
      baseResponse.CREDCADASTRAL = {
        ENDERECO: {
          LOGRADOURO: "AVENIDA PAULISTA",
          BAIRRO: "BELA VISTA",
          CIDADE: "SÃO PAULO",
          UF: "SP",
          CEP: "01310100"
        },
        CONTATOS: [{
          NOME: "JOÃO DA SILVA",
          TELEFONES: ["11999999999"],
          EMAILS: ["joao@email.com"]
        }],
        VIZINHOS: [{
          NOME: "MARIA SOUSA",
          TELEFONES: ["11888888888"]
        }]
      };
      break;

    case '411-crlv-ro':
      baseResponse.HEADER.PARAMETROS = {
        PLACA: "ABC1234"
      };
      baseResponse.HEADER.DADOS_RETORNADOS = {
        CRLV: "1",
        PROPRIETARIO_ATUAL_VEICULO: "1",
        HISTORICO_PROPRIETARIOS: "1",
        GRAVAME: "1",
        ROUBO_FURTO: "1",
        PERDA_TOTAL: "1",
        ALERTAS: "1",
        RECALL: "1",
        DPVAT: "1",
        DEBITOS_IPVA: "1",
        RESTRICOES_FINANCEIRAS: "1"
      };
      baseResponse.VEICULAR = {
        VEICULO: {
          PLACA: "ABC1234",
          MARCA: "VOLKSWAGEN",
          MODELO: "GOL",
          ANO_FABRICACAO: "2015",
          ANO_MODELO: "2016",
          COR: "BRANCA",
          CHASSI: "9BWZZZ377VT004251"
        },
        PROPRIETARIO_ATUAL: {
          NOME: "JOÃO DA SILVA",
          CPF_CNPJ: "09469124677",
          ENDERECO: "RUA DAS FLORES, 123 - CENTRO, SÃO PAULO/SP"
        },
        SITUACAO_VEICULAR: {
          STATUS: "REGULAR",
          DEBITOS_IPVA: 0.00,
          DEBITOS_DPVAT: 0.00,
          MULTAS_PENDENTES: 0,
          RESTRICOES: []
        }
      };
      break;
  }

  return baseResponse;
}

function simulateNormalization(serviceCode: string, apiResponse: any): any {
  // Simular a lógica de normalização do plugin
  const header = apiResponse.HEADER;
  const info = header.INFORMACOES_RETORNO;
  const params = header.PARAMETROS;
  const dadosRetornados = header.DADOS_RETORNADOS;

  const normalized = {
    success: true,
    service: serviceCode,
    chaveConsulta: info.CHAVE_CONSULTA,
    dataHora: info.DATA_HORA_CONSULTA,
    parametros: params,
    dados: {},
    rawResponse: apiResponse
  };

  // Adicionar dados específicos baseados no serviço
  switch (serviceCode) {
    case '1539-bvs-basica-pf':
    case '11-bvs-basica-pj':
      normalized.dados = {
        receitaFederal: dadosRetornados.DADOS_RECEITA_FEDERAL === "1",
        informacoesAlertasRestricoes: dadosRetornados.INFORMACOES_ALERTAS_RESTRICOES === "1",
        dadosAgenciaBancaria: dadosRetornados.DADOS_AGENCIA_BANCARIA === "1",
        pendenciasFinanceiras: dadosRetornados.PENDENCIAS_FINANCEIRAS === "1",
        protestos: dadosRetornados.PROTESTO_ANALITICO === "1",
        recheque: dadosRetornados.RECHEQUE === "1",
        contumacia: dadosRetornados.CONTUMACIA === "1",
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        credCadastral: apiResponse.CREDCADASTRAL || {}
      };
      break;

    case '1003-scr-premium-integracoes':
      normalized.dados = {
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
        credCadastral: apiResponse.CREDCADASTRAL || {}
      };
      break;

    case '320-contatos-por-cep':
      normalized.dados = {
        enderecoCep: dadosRetornados.ENDERECO_DO_CEP === "1",
        contatos: dadosRetornados.CONTATOS === "1",
        telefones: {
          fixo: dadosRetornados.TELEFONE_FIXO === "1",
          celular: dadosRetornados.TELEFONE_CELULAR === "1",
          comercial: dadosRetornados.TELEFONE_COMERCIAL === "1"
        },
        emails: dadosRetornados.EMAILS === "1",
        residentes: dadosRetornados.RESIDENTES === "1",
        vizinhos: dadosRetornados.VIZINHOS === "1",
        credCadastral: apiResponse.CREDCADASTRAL || {}
      };
      break;

    case '411-crlv-ro':
      normalized.dados = {
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
        veicular: apiResponse.VEICULAR || {}
      };
      break;
  }

  return normalized;
}

function suggestDisplayStructure(serviceCode: string, normalizedData: any) {
  const suggestions: Record<string, any> = {
    '1539-bvs-basica-pf': {
      title: "Relatório Básico BVS - Pessoa Física",
      sections: [
        {
          title: "Dados Pessoais",
          fields: [
            { label: "Nome", path: "dados.credCadastral.PESSOA_FISICA.NOME" },
            { label: "CPF", path: "dados.credCadastral.PESSOA_FISICA.CPF" },
            { label: "Data de Nascimento", path: "dados.credCadastral.PESSOA_FISICA.DATA_NASCIMENTO" },
            { label: "Situação Cadastral", path: "dados.credCadastral.PESSOA_FISICA.SITUACAO_CADASTRAL" }
          ]
        },
        {
          title: "Endereços",
          type: "list",
          path: "dados.credCadastral.ENDERECOS",
          fields: ["LOGRADOURO", "NUMERO", "BAIRRO", "CIDADE", "UF", "CEP"]
        },
        {
          title: "Contatos",
          fields: [
            { label: "Telefones", path: "dados.credCadastral.TELEFONES", type: "list" },
            { label: "Emails", path: "dados.credCadastral.EMAILS", type: "list" }
          ]
        },
        {
          title: "Informações Financeiras",
          fields: [
            { label: "Score", path: "dados.credCadastral.SCORE" },
            { label: "Renda Presumida", path: "dados.credCadastral.RENDA_PRESUMIDA", type: "currency" }
          ]
        }
      ]
    },

    '11-bvs-basica-pj': {
      title: "Relatório Básico BVS - Pessoa Jurídica",
      sections: [
        {
          title: "Dados Empresariais",
          fields: [
            { label: "Razão Social", path: "dados.credCadastral.PESSOA_JURIDICA.RAZAO_SOCIAL" },
            { label: "Nome Fantasia", path: "dados.credCadastral.PESSOA_JURIDICA.NOME_FANTASIA" },
            { label: "CNPJ", path: "dados.credCadastral.PESSOA_JURIDICA.CNPJ" },
            { label: "Data de Abertura", path: "dados.credCadastral.PESSOA_JURIDICA.DATA_ABERTURA" },
            { label: "Situação Cadastral", path: "dados.credCadastral.PESSOA_JURIDICA.SITUACAO_CADASTRAL" }
          ]
        },
        {
          title: "Endereços",
          type: "list",
          path: "dados.credCadastral.ENDERECOS",
          fields: ["LOGRADOURO", "NUMERO", "BAIRRO", "CIDADE", "UF", "CEP"]
        },
        {
          title: "Sócios",
          type: "list",
          path: "dados.credCadastral.SOCIOS",
          fields: ["NOME", "CPF", "QUALIFICACAO"]
        },
        {
          title: "Informações Financeiras",
          fields: [
            { label: "Capital Social", path: "dados.credCadastral.CAPITAL_SOCIAL", type: "currency" },
            { label: "Porte da Empresa", path: "dados.credCadastral.PORTE_EMPRESA" }
          ]
        }
      ]
    },

    '1003-scr-premium-integracoes': {
      title: "SCR Premium + Integrações",
      sections: [
        {
          title: "Dados Pessoais",
          fields: [
            { label: "Nome", path: "dados.credCadastral.PESSOA_FISICA.NOME" },
            { label: "CPF", path: "dados.credCadastral.PESSOA_FISICA.CPF" },
            { label: "Data de Nascimento", path: "dados.credCadastral.PESSOA_FISICA.DATA_NASCIMENTO" }
          ]
        },
        {
          title: "Score e Crédito",
          fields: [
            { label: "Score de Crédito", path: "dados.credCadastral.SCORE_CREDITO" },
            { label: "Valor Total da Dívida", path: "dados.credCadastral.RELATORIO_SCR.RESUMO.VALOR_TOTAL_DIVIDA", type: "currency" },
            { label: "Quantidade de Operações", path: "dados.credCadastral.RELATORIO_SCR.RESUMO.QUANTIDADE_OPERACOES" }
          ]
        },
        {
          title: "Operações de Crédito",
          type: "list",
          path: "dados.credCadastral.RELATORIO_SCR.OPERACOES",
          fields: ["MODALIDADE", "VALOR_CONTRATADO", "VALOR_PARCELA", "QUANTIDADE_PARCELAS", "INSTITUICAO"]
        }
      ]
    },

    '320-contatos-por-cep': {
      title: "Contatos por CEP",
      sections: [
        {
          title: "Endereço",
          fields: [
            { label: "Logradouro", path: "dados.credCadastral.ENDERECO.LOGRADOURO" },
            { label: "Bairro", path: "dados.credCadastral.ENDERECO.BAIRRO" },
            { label: "Cidade", path: "dados.credCadastral.ENDERECO.CIDADE" },
            { label: "UF", path: "dados.credCadastral.ENDERECO.UF" },
            { label: "CEP", path: "dados.credCadastral.ENDERECO.CEP" }
          ]
        },
        {
          title: "Contatos Encontrados",
          type: "list",
          path: "dados.credCadastral.CONTATOS",
          fields: ["NOME", "TELEFONES", "EMAILS"]
        },
        {
          title: "Vizinhos",
          type: "list",
          path: "dados.credCadastral.VIZINHOS",
          fields: ["NOME", "TELEFONES"]
        }
      ]
    },

    '411-crlv-ro': {
      title: "CRLV - Rondônia",
      sections: [
        {
          title: "Dados do Veículo",
          fields: [
            { label: "Placa", path: "dados.veicular.VEICULO.PLACA" },
            { label: "Marca", path: "dados.veicular.VEICULO.MARCA" },
            { label: "Modelo", path: "dados.veicular.VEICULO.MODELO" },
            { label: "Ano Fabricação", path: "dados.veicular.VEICULO.ANO_FABRICACAO" },
            { label: "Ano Modelo", path: "dados.veicular.VEICULO.ANO_MODELO" },
            { label: "Cor", path: "dados.veicular.VEICULO.COR" },
            { label: "Chassi", path: "dados.veicular.VEICULO.CHASSI" }
          ]
        },
        {
          title: "Proprietário Atual",
          fields: [
            { label: "Nome", path: "dados.veicular.PROPRIETARIO_ATUAL.NOME" },
            { label: "CPF/CNPJ", path: "dados.veicular.PROPRIETARIO_ATUAL.CPF_CNPJ" },
            { label: "Endereço", path: "dados.veicular.PROPRIETARIO_ATUAL.ENDERECO" }
          ]
        },
        {
          title: "Situação Veicular",
          fields: [
            { label: "Status", path: "dados.veicular.SITUACAO_VEICULAR.STATUS" },
            { label: "Débitos IPVA", path: "dados.veicular.SITUACAO_VEICULAR.DEBITOS_IPVA", type: "currency" },
            { label: "Débitos DPVAT", path: "dados.veicular.SITUACAO_VEICULAR.DEBITOS_DPVAT", type: "currency" },
            { label: "Multas Pendentes", path: "dados.veicular.SITUACAO_VEICULAR.MULTAS_PENDENTES" }
          ]
        }
      ]
    }
  };

  const suggestion = suggestions[serviceCode];
  if (suggestion) {
    console.log(`📊 **${suggestion.title}**`);
    console.log(`   📋 **Seções sugeridas para exibição:**`);

    suggestion.sections.forEach((section: any, index: number) => {
      console.log(`   ${index + 1}. **${section.title}**`);
      if (section.type === 'list') {
        console.log(`      - Tipo: Lista de ${section.path.split('.').pop()}`);
        console.log(`      - Campos: ${section.fields.join(', ')}`);
      } else {
        section.fields.forEach((field: any) => {
          const typeInfo = field.type ? ` (${field.type})` : '';
          console.log(`      - ${field.label}${typeInfo}: ${field.path}`);
        });
      }
    });
  } else {
    console.log(`📊 **${serviceCode}**`);
    console.log(`   📋 **Estrutura genérica:**`);
    console.log(`   - Chave da Consulta: chaveConsulta`);
    console.log(`   - Data/Hora: dataHora`);
    console.log(`   - Parâmetros: parametros`);
    console.log(`   - Dados: dados (objeto com informações específicas)`);
  }
}

// Executar análise
analyzeResponseStructure().catch(console.error);