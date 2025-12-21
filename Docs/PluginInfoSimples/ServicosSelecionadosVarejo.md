# Serviços Infosimples Selecionados para Mercado Varejista

Baseado na análise dos 800+ serviços disponíveis da Infosimples, selecionamos 18 serviços prioritários para o MVP focado no mercado varejista brasileiro. A seleção foi organizada pelas categorias definidas no projeto: **Crédito**, **Cadastral** e **Veículo**.

## 🎯 Critérios de Seleção

- **Relevância para varejo**: Foco em verificações pré-venda e avaliação de risco
- **Cobertura nacional**: Prioridade para serviços com abrangência nacional ou nos principais estados (SP, RJ, MG)
- **Custo-benefício**: Serviços acessíveis com maior retorno para o negócio
- **Frequência de uso**: Consultas que um varejista faria regularmente

---

## 💰 Crédito (2 serviços)

Serviços relacionados à avaliação de risco de crédito, protestos e capacidade de pagamento.

### CENPROT SP / Protestos
- **Código**: cenprot-sp/protestos
- **Descrição**: Consulta de protestos no estado de São Paulo
- **Uso Varejista**: Avaliação de risco de crédito de clientes/fornecedores

### Portal da Transparência / CPF
- **Código**: portal-transparencia/cpf
- **Descrição**: Consulta de benefícios sociais do governo federal
- **Uso Varejista**: Indicação de capacidade de pagamento e situação socioeconômica

---

## 📋 Cadastral (13 serviços)

Serviços de verificação cadastral, situação fiscal, antecedentes criminais e regularidade.

### Receita Federal / CPF
- **Código**: receita-federal/cpf
- **Descrição**: Verificação completa da situação cadastral de pessoa física
- **Uso Varejista**: Validação de identidade e situação fiscal de clientes

### Receita Federal / CNPJ
- **Código**: receita-federal/cnpj
- **Descrição**: Consulta completa de dados cadastrais de pessoa jurídica
- **Uso Varejista**: Due diligence de fornecedores e clientes empresariais

### SINTEGRA / SP
- **Código**: sintegra/sp
- **Descrição**: Situação cadastral estadual em São Paulo
- **Uso Varejista**: Verificação de regularidade fiscal estadual

### Receita Federal / PGFN (CND Federal)
- **Código**: receita-federal/pgfn
- **Descrição**: Certidão Negativa de Débitos Federais
- **Uso Varejista**: Comprovação de regularidade fiscal federal

### SEFAZ / SP / Certidão Negativa de Débitos
- **Código**: sefaz/sp/certidao-debitos
- **Descrição**: Certidão Negativa de Débitos Estaduais de SP
- **Uso Varejista**: Regularidade fiscal estadual para fornecedores

### Antecedentes Criminais / SP
- **Código**: antecedentes-criminais/sp
- **Descrição**: Consulta de antecedentes criminais no estado de SP
- **Uso Varejista**: Avaliação de risco comportamental de clientes

### Tribunal / TSE / Situação Eleitoral
- **Código**: tribunal/tse/situacao
- **Descrição**: Verificação de regularidade eleitoral
- **Uso Varejista**: Validação de documento eleitoral

### Tribunal / TSE / Título Eleitoral
- **Código**: tribunal/tse/titulo
- **Descrição**: Confirmação de dados do título eleitoral
- **Uso Varejista**: Verificação de documento eleitoral

### MTE / Certidão de Débitos Trabalhistas
- **Código**: mte/certidao-debitos
- **Descrição**: Certidão de regularidade trabalhista
- **Uso Varejista**: Verificação de compliance trabalhista

### FGTS / Emissão de Guia Rápida
- **Código**: fgts/guia-rapida
- **Descrição**: Consulta de situação do FGTS
- **Uso Varejista**: Verificação de regularidade previdenciária

### Tribunal / TRT2 / Certidão Eletrônica de Ações Trabalhistas (CEAT)
- **Código**: tribunal/trt2/ceat
- **Descrição**: Certidão de ações trabalhistas na região de SP
- **Uso Varejista**: Avaliação de passivos trabalhistas

### Correios / CEP
- **Código**: correios/cep
- **Descrição**: Validação e complemento de endereços
- **Uso Varejista**: Verificação de endereços para entrega

### Correios / Completa CEP
- **Código**: correios/completa-cep
- **Descrição**: Dados completos de localização geográfica
- **Uso Varejista**: Informações detalhadas para logística

### IBGE / Área territorial brasileira
- **Código**: ibge/area-territorial
- **Descrição**: Dados demográficos e territoriais
- **Uso Varejista**: Análise de mercado por região

---

## 🚗 Veículo (3 serviços)

Serviços relacionados à consulta de dados veiculares para financiamentos e frotas.

### DETRAN / SP / Veículo
- **Código**: detran/sp/veiculo
- **Descrição**: Consulta veicular completa no estado de SP
- **Uso Varejista**: Verificação de veículos para financiamentos

### SENATRAN / Veículo
- **Código**: senatran/veiculo
- **Descrição**: Base nacional de dados veiculares
- **Uso Varejista**: Consulta abrangente de veículos

### SERPRO / RADAR / Veículo
- **Código**: serpro/radar/veiculo
- **Descrição**: Dados detalhados do veículo via sistema federal
- **Uso Varejista**: Informações técnicas completas do veículo

---

## 📊 Resumo por Categoria

| Categoria | Quantidade | Principais Usos |
|-----------|------------|-----------------|
| **Crédito** | 2 serviços | Avaliação de risco financeiro |
| **Cadastral** | 13 serviços | Verificação de identidade e regularidade |
| **Veículo** | 3 serviços | Consulta de dados automotivos |

## 🔄 Próximos Passos

1. **Implementação**: Integrar estes 18 serviços no plugin Infosimples
2. **Testes**: Validar funcionamento e performance
3. **Expansão**: Adicionar serviços de outros estados conforme demanda
4. **Pacotes**: Criar agrupamentos temáticos (ex: "Pacote Cliente PF", "Pacote Fornecedor PJ")

## 📝 Notas Técnicas

- Todos os códigos de serviço estão no formato da API Infosimples
- Prioridade para serviços com cobertura nacional ou no estado de SP (maior mercado varejista)
- Serviços selecionados considerando custo x benefício para operações varejistas
- Foco em consultas que agregam valor real para tomada de decisão comercial