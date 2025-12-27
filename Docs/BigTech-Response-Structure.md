# Estrutura de Dados de Retorno - Plugin BigTech

## Visão Geral

Este documento descreve a estrutura de dados retornados pelos serviços do plugin BigTech, baseada na análise das respostas normalizadas da API. Os dados são organizados de forma consistente para facilitar a exibição visual no frontend.

## Estrutura Geral de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "service": "codigo-servico",
  "chaveConsulta": "string",
  "dataHora": "ISO8601",
  "parametros": {
    // Parâmetros da consulta
  },
  "dados": {
    // Dados específicos do serviço
  },
  "rawResponse": {
    // Resposta completa da API
  }
}
```

## Serviços por Categoria

### 📊 **Serviços de Crédito**

#### 1539 - BVS Básica PF
**Estrutura de exibição sugerida:**

1. **Dados Pessoais**
   - Nome: `dados.credCadastral.PESSOA_FISICA.NOME`
   - CPF: `dados.credCadastral.PESSOA_FISICA.CPF`
   - Data de Nascimento: `dados.credCadastral.PESSOA_FISICA.DATA_NASCIMENTO`
   - Situação Cadastral: `dados.credCadastral.PESSOA_FISICA.SITUACAO_CADASTRAL`

2. **Endereços** (Lista)
   - Campos: `LOGRADOURO`, `NUMERO`, `BAIRRO`, `CIDADE`, `UF`, `CEP`
   - Caminho: `dados.credCadastral.ENDERECOS[]`

3. **Contatos**
   - Telefones: `dados.credCadastral.TELEFONES[]` (com DDD, NUMERO, TIPO)
   - Emails: `dados.credCadastral.EMAILS[]`

4. **Informações Financeiras**
   - Score: `dados.credCadastral.SCORE` (number)
   - Renda Presumida: `dados.credCadastral.RENDA_PRESUMIDA` (currency)

#### 11 - BVS Básica PJ
**Estrutura de exibição sugerida:**

1. **Dados Empresariais**
   - Razão Social: `dados.credCadastral.PESSOA_JURIDICA.RAZAO_SOCIAL`
   - Nome Fantasia: `dados.credCadastral.PESSOA_JURIDICA.NOME_FANTASIA`
   - CNPJ: `dados.credCadastral.PESSOA_JURIDICA.CNPJ`
   - Data de Abertura: `dados.credCadastral.PESSOA_JURIDICA.DATA_ABERTURA`
   - Situação Cadastral: `dados.credCadastral.PESSOA_JURIDICA.SITUACAO_CADASTRAL`

2. **Endereços** (Lista)
   - Campos: `LOGRADOURO`, `NUMERO`, `BAIRRO`, `CIDADE`, `UF`, `CEP`

3. **Sócios** (Lista)
   - Campos: `NOME`, `CPF`, `QUALIFICACAO`

4. **Informações Financeiras**
   - Capital Social: `dados.credCadastral.CAPITAL_SOCIAL` (currency)
   - Porte da Empresa: `dados.credCadastral.PORTE_EMPRESA`

#### 1003 - SCR Premium + Integrações
**Estrutura de exibição sugerida:**

1. **Dados Pessoais**
   - Nome: `dados.credCadastral.PESSOA_FISICA.NOME`
   - CPF: `dados.credCadastral.PESSOA_FISICA.CPF`
   - Data de Nascimento: `dados.credCadastral.PESSOA_FISICA.DATA_NASCIMENTO`

2. **Score e Crédito**
   - Score de Crédito: `dados.credCadastral.SCORE_CREDITO` (number)
   - Valor Total da Dívida: `dados.credCadastral.RELATORIO_SCR.RESUMO.VALOR_TOTAL_DIVIDA` (currency)
   - Quantidade de Operações: `dados.credCadastral.RELATORIO_SCR.RESUMO.QUANTIDADE_OPERACOES`
   - Modalidade Mais Recente: `dados.credCadastral.RELATORIO_SCR.RESUMO.MODALIDADE_MAIS_RECENTE`

3. **Operações de Crédito** (Lista)
   - Campos: `MODALIDADE`, `VALOR_CONTRATADO`, `VALOR_PARCELA`, `QUANTIDADE_PARCELAS`, `INSTITUICAO`
   - Caminho: `dados.credCadastral.RELATORIO_SCR.OPERACOES[]`

### 🏠 **Serviços Cadastrais**

#### 320 - Contatos por CEP
**Estrutura de exibição sugerida:**

1. **Endereço**
   - Logradouro: `dados.credCadastral.ENDERECO.LOGRADOURO`
   - Bairro: `dados.credCadastral.ENDERECO.BAIRRO`
   - Cidade: `dados.credCadastral.ENDERECO.CIDADE`
   - UF: `dados.credCadastral.ENDERECO.UF`
   - CEP: `dados.credCadastral.ENDERECO.CEP`

2. **Contatos Encontrados** (Lista)
   - Campos: `NOME`, `TELEFONES[]`, `EMAILS[]`
   - Caminho: `dados.credCadastral.CONTATOS[]`

3. **Vizinhos** (Lista)
   - Campos: `NOME`, `TELEFONES[]`
   - Caminho: `dados.credCadastral.VIZINHOS[]`

### 🚗 **Serviços Veiculares**

#### 411 - CRLV RO (Rondônia)
**Estrutura de exibição sugerida:**

1. **Dados do Veículo**
   - Placa: `dados.veicular.VEICULO.PLACA`
   - Marca: `dados.veicular.VEICULO.MARCA`
   - Modelo: `dados.veicular.VEICULO.MODELO`
   - Ano Fabricação: `dados.veicular.VEICULO.ANO_FABRICACAO`
   - Ano Modelo: `dados.veicular.VEICULO.ANO_MODELO`
   - Cor: `dados.veicular.VEICULO.COR`
   - Chassi: `dados.veicular.VEICULO.CHASSI`

2. **Proprietário Atual**
   - Nome: `dados.veicular.PROPRIETARIO_ATUAL.NOME`
   - CPF/CNPJ: `dados.veicular.PROPRIETARIO_ATUAL.CPF_CNPJ`
   - Endereço: `dados.veicular.PROPRIETARIO_ATUAL.ENDERECO`

3. **Situação Veicular**
   - Status: `dados.veicular.SITUACAO_VEICULAR.STATUS`
   - Débitos IPVA: `dados.veicular.SITUACAO_VEICULAR.DEBITOS_IPVA` (currency)
   - Débitos DPVAT: `dados.veicular.SITUACAO_VEICULAR.DEBITOS_DPVAT` (currency)
   - Multas Pendentes: `dados.veicular.SITUACAO_VEICULAR.MULTAS_PENDENTES`
   - Restrições: `dados.veicular.SITUACAO_VEICULAR.RESTRICOES[]` (array)

## Campos Comuns a Todos os Serviços

### Header da Resposta
- `success`: boolean - Indica se a consulta foi bem-sucedida
- `service`: string - Código do serviço consultado
- `chaveConsulta`: string - Identificador único da consulta
- `dataHora`: string - Data/hora da consulta em ISO8601
- `parametros`: object - Parâmetros utilizados na consulta

### Indicadores de Disponibilidade
Para serviços de crédito, campos booleanos indicam disponibilidade:
- `receitaFederal`: Dados da Receita Federal
- `informacoesAlertasRestricoes`: Alertas e restrições
- `dadosAgenciaBancaria`: Dados bancários
- `pendenciasFinanceiras`: Pendências financeiras
- `protestos`: Protestos
- `recheque`: Cheques sem fundo
- `contumacia`: Ações judiciais

## Tipos de Dados Especiais

### Currency
Campos monetários são retornados como números e devem ser formatados:
```javascript
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
```

### Listas
Campos marcados como "Lista" são arrays de objetos. Exemplo:
```javascript
// Exibindo lista de endereços
dados.credCadastral.ENDERECOS.forEach(endereco => {
  console.log(`${endereco.LOGRADOURO}, ${endereco.NUMERO} - ${endereco.BAIRRO}`);
});
```

### Booleanos
Campos booleanos indicam disponibilidade de dados:
- `true`: Dados disponíveis
- `false`: Dados não disponíveis

## Implementação no Frontend

### Estrutura de Componente Genérica

```typescript
interface ServiceDisplayProps {
  data: any;
  serviceCode: string;
}

const ServiceDisplay: React.FC<ServiceDisplayProps> = ({ data, serviceCode }) => {
  const renderSection = (section: any) => {
    if (section.type === 'list') {
      return (
        <div className="section">
          <h3>{section.title}</h3>
          {data.dados.credCadastral[section.path.split('.').pop()]?.map((item, index) => (
            <div key={index} className="list-item">
              {section.fields.map(field => (
                <span key={field}>{item[field]} </span>
              ))}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="section">
        <h3>{section.title}</h3>
        {section.fields.map(field => (
          <div key={field.name} className="field">
            <label>{field.label}:</label>
            <span>{getNestedValue(data, field.path)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="service-display">
      <h2>{getServiceTitle(serviceCode)}</h2>
      {getServiceSections(serviceCode).map(renderSection)}
    </div>
  );
};
```

### Função Helper para Valores Aninhados

```typescript
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};
```

## Próximos Passos

1. **Criar componentes específicos** para cada tipo de serviço
2. **Implementar formatação** de moeda, datas e outros tipos especiais
3. **Adicionar tratamento de erro** para campos não disponíveis
4. **Implementar paginação** para listas grandes
5. **Adicionar filtros e busca** para facilitar navegação nos dados

## Considerações Técnicas

- **Performance**: Dados grandes podem impactar o frontend
- **Privacidade**: Dados sensíveis devem ser protegidos
- **LGPD**: Implementar controles de consentimento
- **Cache**: Considerar cache no frontend para evitar recarregamentos
- **Responsividade**: Layout deve funcionar em diferentes dispositivos

---

*Este documento foi gerado automaticamente baseado na análise das estruturas de resposta dos serviços BigTech.*</content>
<parameter name="filePath">/home/mau/projeto/consulta/Docs/BigTech-Response-Structure.md