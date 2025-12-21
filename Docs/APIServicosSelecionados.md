# API dos Serviços Selecionados - Infosimples

## Visão Geral
Este documento contém a documentação técnica dos 18 serviços selecionados para o MVP do mercado varejista, baseada na especificação OpenAPI v2.2.33 da Infosimples.

## Serviços Mapeados

### 1. CENPROT - Protestos SP
**Endpoint:** `/consultas/cenprot-sp/protestos`
**Método:** POST
**Parâmetros:**
- `cpf` (string, obrigatório): CPF da pessoa física
- `cnpj` (string, obrigatório): CNPJ da pessoa jurídica
**Descrição:** Retorna informações sobre protestos no estado de São Paulo
**Uso:** Verificação de crédito, KYC

### 2. Receita Federal - Pessoa Física
**Endpoint:** `/consultas/receita-federal/cpf`
**Método:** POST
**Parâmetros:**
- `cpf` (string, obrigatório): CPF a ser consultado
- `birthdate` (string, obrigatório): Data de nascimento no formato ISO 8601 (YYYY-MM-DD)
**Descrição:** Consulta situação cadastral na Receita Federal
**Uso:** Validação cadastral, KYC

### 3. Receita Federal - Pessoa Jurídica
**Endpoint:** `/consultas/receita-federal/cnpj`
**Método:** POST
**Parâmetros:**
- `cnpj` (string, obrigatório): CNPJ a ser consultado
**Descrição:** Consulta situação cadastral na Receita Federal
**Uso:** Due diligence de fornecedores, validação empresarial

### 4. Portal da Transparência - CEIS
**Endpoint:** `/consultas/portal-transparencia/ceis`
**Método:** POST
**Parâmetros:**
- `cpf` (string, obrigatório): CPF da pessoa física
- `cnpj` (string, obrigatório): CNPJ da pessoa jurídica
**Descrição:** Consulta no Cadastro de Entidades Impedidas de contratar com a Administração Pública
**Uso:** Compliance, verificação de sanções

### 5. Portal da Transparência - CEPIM
**Endpoint:** `/consultas/portal-transparencia/cepim`
**Método:** POST
**Parâmetros:**
- `cpf` (string, obrigatório): CPF da pessoa física
- `cnpj` (string, obrigatório): CNPJ da pessoa jurídica
**Descrição:** Consulta no Cadastro de Entidades Punidas na Administração Pública
**Uso:** Compliance, verificação de sanções

### 6. Portal da Transparência - CNEP
**Endpoint:** `/consultas/portal-transparencia/cnep`
**Método:** POST
**Parâmetros:**
- `cpf` (string, obrigatório): CPF da pessoa física
- `cnpj` (string, obrigatório): CNPJ da pessoa jurídica
**Descrição:** Consulta no Cadastro Nacional de Empresas Punidas
**Uso:** Compliance, verificação de sanções

### 7. TSE - Situação Eleitoral
**Endpoint:** `/consultas/tse/situacao-eleitoral`
**Método:** POST
**Parâmetros:**
- `name` (string, obrigatório): Nome da pessoa
- `cpf` (string, obrigatório): CPF da pessoa
- `titulo_eleitoral` (string, obrigatório): Título eleitoral
- `birthdate` (string, obrigatório): Data de nascimento no formato ISO 8601
**Descrição:** Consulta situação eleitoral do cidadão
**Uso:** Validação eleitoral, KYC

### 8. SERPRO - Radar Veículo
**Endpoint:** `/consultas/serpro/radar-veiculo`
**Método:** POST
**Parâmetros:**
- `placa` (string, obrigatório): Placa do veículo
**Descrição:** Consulta restrições veiculares em âmbito nacional
**Uso:** Verificação de veículos, financiamento

### 9. Correios - CEP
**Endpoint:** `/consultas/correios/cep`
**Método:** POST
**Parâmetros:**
- `cep` (string, obrigatório): CEP a ser consultado
**Descrição:** Validação e consulta de endereço por CEP
**Uso:** Validação de endereço, entrega

### 10. CNIS - Pré-Inscrição
**Endpoint:** `/consultas/cnis/pre-inscricao`
**Método:** POST
**Parâmetros:**
- `cpf` (string, obrigatório): CPF da pessoa
- `nis` (string, obrigatório): NIS/PIS da pessoa
- `name` (string, obrigatório): Nome da pessoa
- `birthdate` (string, obrigatório): Data de nascimento no formato ISO 8601
**Descrição:** Consulta dados previdenciários no CNIS
**Uso:** Verificação de benefícios, validação trabalhista

### 11. Dataprev - FAP
**Endpoint:** `/consultas/dataprev/fap`
**Método:** POST
**Parâmetros:**
- `cnpj_estabelecimento` (string, obrigatório): CNPJ do estabelecimento
- `ano_vigencia` (string, opcional): Ano de vigência (padrão: mais recente)
- `login_cpf` (string, opcional): CPF para login GOV.BR
- `login_senha` (string, opcional): Senha para login GOV.BR
- `pkcs12_cert` (string, opcional): Certificado digital A1
- `pkcs12_pass` (string, opcional): Senha do certificado
**Descrição:** Consulta Fator Acidentário de Prevenção (FAP)
**Uso:** Análise de risco empresarial, seguros

### 12. Dataprev - Qualificação Cadastral
**Endpoint:** `/consultas/dataprev/qualificacao`
**Método:** POST
**Parâmetros:**
- `nis` (string, obrigatório): NIS da pessoa
- `name` (string, obrigatório): Nome da pessoa
- `birthdate` (string, obrigatório): Data de nascimento no formato ISO 8601
- `cpf` (string, obrigatório): CPF da pessoa
**Descrição:** Validação de dados cadastrais contra CNIS
**Uso:** Prevenção de fraudes, gestão cadastral

### 13. Detran RJ - Veículo
**Endpoint:** `/consultas/detran/rj/veiculo`
**Método:** POST
**Parâmetros:**
- `placa` (string, obrigatório): Placa do veículo
**Descrição:** Consulta cadastro de veículo no Detran RJ
**Uso:** Verificação veicular, gestão de frota

### 14. Detran RS - Veículo
**Endpoint:** `/consultas/detran/rs/veiculo`
**Método:** POST
**Parâmetros:**
- `placa` (string, obrigatório): Placa do veículo
- `renavam` (string, obrigatório): RENAVAM do veículo
- `login_cpf` (string, opcional): CPF para login GOV.BR
- `login_senha` (string, opcional): Senha para login GOV.BR
- `pkcs12_cert` (string, opcional): Certificado digital A1
- `pkcs12_pass` (string, opcional): Senha do certificado
**Descrição:** Consulta cadastro de veículo no Detran RS
**Uso:** Verificação veicular, gestão de frota

### 15. DETRAN MG - Veículos Não Licenciados
**Endpoint:** `/consultas/detran/mg/veic-nao-licenciado`
**Método:** POST
**Parâmetros:**
- `placa` (string, obrigatório): Placa do veículo
- `chassi` (string, obrigatório): Chassi do veículo
- `renavam` (string, obrigatório): RENAVAM do veículo
- `login_cpf`, `login_senha`, `pkcs12_cert`, `pkcs12_pass` (opcionais): Autenticação GOV.BR
**Descrição:** Consulta situação de veículo não licenciado em MG
**Uso:** Verificação veicular, gestão de frota

### 16. ECRVSP - Base Estadual SP
**Endpoint:** `/consultas/ecrvsp/veiculos/base-sp`
**Método:** POST
**Parâmetros:**
- `a3` (string, obrigatório): Token do certificado digital A3
- `a3_pin` (string, obrigatório): PIN do certificado A3
- `login_cpf` (string, obrigatório): CPF para login ECRV
- `login_senha` (string, obrigatório): Senha ECRV/GOV.BR
- `chassi`, `placa`, `renavam` (pelo menos um obrigatório): Identificação do veículo
**Descrição:** Consulta cadastro de veículo na base estadual de SP
**Uso:** Verificação veicular, gestão de frota

### 17. DETRAN MG - TRLAV (Taxa de Licenciamento)
**Endpoint:** `/consultas/detran/mg/trlav`
**Método:** POST
**Parâmetros:**
- `renavam` (string, obrigatório): RENAVAM do veículo
- `ano` (string, obrigatório): Ano da TRLAV
**Descrição:** Emite guia de pagamento da taxa de licenciamento anual
**Uso:** Gestão fiscal de veículos

### 18. DETRAN MG - Multas (Extrato)
**Endpoint:** `/consultas/detran/mg/multas-extrato`
**Método:** POST
**Parâmetros:**
- `placa` (string, opcional): Placa do veículo
- `renavam` (string, obrigatório): RENAVAM do veículo
- `chassi` (string, obrigatório): Chassi do veículo
- `login_cpf`, `login_senha`, `pkcs12_cert`, `pkcs12_pass` (opcionais): Autenticação GOV.BR
**Descrição:** Retorna extrato de multas do veículo em MG
**Uso:** Gestão de infrações veiculares

## Serviços Pendentes de Mapeamento

### Serviços sem endpoint identificado na API:
- **Serasa/Boavista/Experian/SCPC**: Não disponíveis na API pública da Infosimples
  - **Status**: Serviços premium, provavelmente disponíveis apenas em planos específicos ou integrações diretas
  - **Alternativa**: Implementar integração direta com os bureaus ou usar outros provedores

### Serviços parcialmente mapeados:
- **Detran SP - Veículo**: Mapeado via ECRVSP (requer certificado digital A3)
- **Detran MG - Veículo**: Mapeado via endpoints específicos (veículos não licenciados, multas, TRLAV)

**Nota:** Os serviços de bureaus de crédito tradicionais não estão disponíveis na API pública da Infosimples v2.2.33, provavelmente por serem serviços premium.

## Estrutura de Resposta Padrão

Todos os endpoints retornam uma resposta padronizada:

```json
{
  "code": 200,
  "header": {
    "request_id": "string",
    "status": "success|error",
    "message": "string"
  },
  "data": {
    // Dados específicos do serviço
  },
  "errors": []
}
```

## Autenticação

Todos os endpoints requerem autenticação via Bearer token no header:
```
Authorization: Bearer YOUR_API_TOKEN
```

## Considerações Técnicas

1. **Rate Limiting:** Verificar limites de requisição na documentação
2. **Custos:** Cada consulta tem custo associado
3. **Cache:** Implementar cache para reduzir custos e melhorar performance
4. **Tratamento de Erros:** Implementar retry logic para falhas temporárias
5. **LGPD:** Garantir compliance com leis de proteção de dados

## Próximos Passos

1. Atualizar config.ts com os endpoints mapeados
2. Implementar lógica de chamada para cada serviço
3. Adicionar tratamento de erros específico
4. Implementar cache e rate limiting
5. Criar testes unitários e de integração