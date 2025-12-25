# Plugin BigTech

## Visão Geral

O plugin BigTech integra 13 serviços de consulta externa da provedora BigTech, organizados em três categorias principais: Cadastral, Crédito e Veicular.

## Baseado em

- **1.Project.md v1.0** - Objetivos estratégicos do sistema
- **2.Architecture.md v1.0** - Arquitetura de plugins
- **4.Entities.md v1.7** - Modelos de dados e entidades
- **Docs/APIServicosSelecionados.md** - Especificação dos serviços

## Serviços Disponíveis

### Cadastral (R$ 1,00 cada)

| Código | Nome | Descrição |
|--------|------|-----------|
| 320 | Contatos por CEP | Consulta de contatos por código postal |
| 327 | Quod Cadastral PF | Consulta cadastral pessoa física Quod |
| 424 | Valid ID Localização | Validação de localização |
| 431 | Dados CNH | Consulta de dados da Carteira Nacional de Habilitação |

### Crédito (R$ 1,80 cada)

| Código | Nome | Descrição |
|--------|------|-----------|
| 36 | Busca Nome UF | Busca por nome e unidade federativa |
| 39 | Teleconfirma | Confirmação telefônica |
| 41 | Protesto Sintético Nacional | Protesto sintético nacional |
| 304 | Positivo Define Risco CNPJ | Análise de risco para CNPJ |
| 1453 | Positivo Acerta Essencial PF | Positivo essencial pessoa física |
| 1539 | BVS Básica PF | Consulta BVS Básica para Pessoa Física |
| 11 | BVS Básica PJ | Consulta BVS Básica para Pessoa Jurídica |
| 1003 | SCR Premium + Integrações | Consulta que retorna pontuação de crédito e análise de risco com SCR |

### Veicular (R$ 3,00 cada)

| Código | Nome | Descrição |
|--------|------|-----------|
| 411 | CRLV Rondônia | Certificado de Registro e Licenciamento de Veículo - RO |
| 412 | CRLV Roraima | Certificado de Registro e Licenciamento de Veículo - RR |
| 415 | CRLV Sergipe | Certificado de Registro e Licenciamento de Veículo - SE |
| 416 | CRLV São Paulo | Certificado de Registro e Licenciamento de Veículo - SP |

## Estrutura do Plugin

```
bigtech/
├── index.ts          # Ponto de entrada principal
├── types.ts          # Definições TypeScript
├── config.ts         # Configurações e constantes
├── bigtech.yaml      # Configuração YAML
└── README.md         # Esta documentação
```

## Configuração

O plugin é configurado através do arquivo `bigtech.yaml` e pode ser personalizado com:

- **baseUrl**: URL base da API BigTech para produção
- **homologationUrl**: URL base da API BigTech para homologação
- **useHomologation**: Define se deve usar homologação (true) ou produção (false)
- **timeout**: Timeout das requisições (padrão: 30s)
- **retries**: Número de tentativas de retry (padrão: 3)
- **rateLimitPerMinute**: Limite de requisições por minuto (padrão: 10)
- **minRequestInterval**: Intervalo mínimo entre requisições (padrão: 6s)

### Configuração via Frontend-Admin

No frontend-admin, o usuário pode configurar:
- **URL de Produção**: `baseUrl`
- **URL de Homologação**: `homologationUrl`
- **Ambiente**: Toggle para `useHomologation`

## Uso

```typescript
import { createBigTechPlugin } from './plugins/consulta/bigtech';

// Criar instância do plugin
const bigTechPlugin = createBigTechPlugin(pluginLoader, {
  baseUrl: 'https://api.bigtech.com.br/v1',
  apiKey: 'your-api-key-here'
});

// Inicializar
await bigTechPlugin.initialize();

// Listar serviços disponíveis
const services = bigTechPlugin.getAvailableServices();
console.log('Serviços BigTech:', services);
```

## Rate Limiting

O plugin implementa controle de taxa para evitar sobrecarga da API:

- Máximo 10 requisições por minuto
- Mínimo 6 segundos entre requisições
- Retry com backoff exponencial

## Tratamento de Erros

- **Timeout**: Requisições abortadas após 30 segundos
- **Rate Limit**: Aguarda intervalo mínimo entre requisições
- **Retry Logic**: Até 3 tentativas com backoff exponencial
- **Fallback**: Suporte a fontes alternativas de dados

## Logs e Monitoramento

- Logs estruturados com níveis configuráveis
- Métricas de duração e sucesso/falha
- Tracing de requisições para debug

## Segurança

- Validação de entrada de dados
- Sanitização de saída
- Controle de rate limiting
- Logs sem dados sensíveis (configurável)

## Desenvolvimento

### Pré-requisitos

- Node.js 18+
- TypeScript 5+
- PluginLoader compatível

### Testes

```bash
# Executar testes do plugin
npm test -- --testPathPattern=bigtech
```

### Debugging

Para debug, habilite logs detalhados no `bigtech.yaml`:

```yaml
logging:
  level: "debug"
  includeRequestBody: true
  includeResponseBody: true
```

## Próximos Passos

- [ ] Implementar cache Redis para respostas
- [ ] Adicionar métricas Prometheus
- [ ] Suporte a webhooks para callbacks
- [ ] Implementar circuit breaker
- [ ] Adicionar testes de integração
- [ ] Documentação da API OpenAPI

## Suporte

Para questões sobre o plugin BigTech, consulte:

- **Documentação Técnica**: `Docs/APIServicosSelecionados.md`
- **Arquitetura**: `2.Architecture.md`
- **Entidades**: `4.Entities.md`