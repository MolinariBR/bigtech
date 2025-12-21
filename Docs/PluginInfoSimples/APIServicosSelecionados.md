# API Infosimples - Serviços Selecionados para Varejo

Baseado na documentação da API Infosimples e nos 18 serviços selecionados para o mercado varejista, este documento descreve os endpoints específicos que serão implementados no plugin.

## 🔗 Base URL
```
https://api.infosimples.com/v1/consultas/{codigo-servico}
```

## 🔐 Autenticação
```
Authorization: Bearer {api-key}
Content-Type: application/json
```

## 📝 Formato da Requisição

```json
{
  "code": "codigo-do-servico",
  "data": {
    "cpf": "12345678900",
    "cnpj": "12345678000123",
    "placa": "ABC1234",
    "cep": "01234567"
  }
}
```

## 📋 Formato da Resposta

```json
{
  "success": true,
  "data": {
    // Dados específicos do serviço
  }
}
```

---

## 💰 CRÉDITO (2 serviços)

### 1. CENPROT SP / Protestos
**Código:** `cenprot-sp/protestos`  
**Endpoint:** `POST /v1/consultas/cenprot-sp/protestos`

**Requisição:**
```json
{
  "code": "cenprot-sp/protestos",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "protestos": [
      {
        "valor": 1500.00,
        "data": "2024-01-15",
        "cartorio": "1º Cartório de Protestos de SP",
        "cedente": "Empresa XYZ Ltda"
      }
    ],
    "total_protestos": 1,
    "valor_total": 1500.00
  }
}
```

### 2. Portal da Transparência / CPF
**Código:** `portal-transparencia/cpf`  
**Endpoint:** `POST /v1/consultas/portal-transparencia/cpf`

**Requisição:**
```json
{
  "code": "portal-transparencia/cpf",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "beneficios": [
      {
        "tipo": "Bolsa Família",
        "valor": 600.00,
        "data_inicio": "2023-01-01"
      }
    ],
    "situacao": "ativo"
  }
}
```

---

## 📋 CADASTRAL (13 serviços)

### 3. Receita Federal / CPF
**Código:** `receita-federal/cpf`  
**Endpoint:** `POST /v1/consultas/receita-federal/cpf`

**Requisição:**
```json
{
  "code": "receita-federal/cpf",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "nome": "JOÃO DA SILVA",
    "data_nascimento": "1980-01-15",
    "situacao_cadastral": "REGULAR",
    "data_inscricao": "2000-03-20"
  }
}
```

### 4. Receita Federal / CNPJ
**Código:** `receita-federal/cnpj`  
**Endpoint:** `POST /v1/consultas/receita-federal/cnpj`

**Requisição:**
```json
{
  "code": "receita-federal/cnpj",
  "data": {
    "cnpj": "12345678000123"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "razao_social": "EMPRESA XYZ LTDA",
    "nome_fantasia": "XYZ Comércio",
    "situacao_cadastral": "ATIVA",
    "data_inicio_atividade": "2010-05-10",
    "cnae_principal": "47.11-1-01"
  }
}
```

### 5. SINTEGRA / SP
**Código:** `sintegra/sp`  
**Endpoint:** `POST /v1/consultas/sintegra/sp`

**Requisição:**
```json
{
  "code": "sintegra/sp",
  "data": {
    "cnpj": "12345678000123"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "situacao": "ATIVA",
    "data_situacao": "2020-01-01",
    "regime_estadual": "NORMAL",
    "ie": "123456789012"
  }
}
```

### 6. Receita Federal / PGFN (CND Federal)
**Código:** `receita-federal/pgfn`  
**Endpoint:** `POST /v1/consultas/receita-federal/pgfn`

**Requisição:**
```json
{
  "code": "receita-federal/pgfn",
  "data": {
    "cnpj": "12345678000123"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "certidao": "POSITIVA",
    "data_emissao": "2024-12-01",
    "validade": "2025-12-01",
    "debitos": []
  }
}
```

### 7. SEFAZ / SP / Certidão Negativa de Débitos
**Código:** `sefaz/sp/certidao-debitos`  
**Endpoint:** `POST /v1/consultas/sefaz/sp/certidao-debitos`

**Requisição:**
```json
{
  "code": "sefaz/sp/certidao-debitos",
  "data": {
    "cnpj": "12345678000123"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "certidao": "NEGATIVA",
    "data_emissao": "2024-12-01",
    "validade": "2025-12-01"
  }
}
```

### 8. Antecedentes Criminais / SP
**Código:** `antecedentes-criminais/sp`  
**Endpoint:** `POST /v1/consultas/antecedentes-criminais/sp`

**Requisição:**
```json
{
  "code": "antecedentes-criminais/sp",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "antecedentes": [],
    "situacao": "NADA CONSTA",
    "data_consulta": "2024-12-01"
  }
}
```

### 9. Tribunal / TSE / Situação Eleitoral
**Código:** `tribunal/tse/situacao`  
**Endpoint:** `POST /v1/consultas/tribunal/tse/situacao`

**Requisição:**
```json
{
  "code": "tribunal/tse/situacao",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "situacao": "REGULAR",
    "titulo_eleitoral": "123456789012",
    "zona": "123",
    "secao": "456"
  }
}
```

### 10. Tribunal / TSE / Título Eleitoral
**Código:** `tribunal/tse/titulo`  
**Endpoint:** `POST /v1/consultas/tribunal/tse/titulo`

**Requisição:**
```json
{
  "code": "tribunal/tse/titulo",
  "data": {
    "titulo": "123456789012"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "nome": "JOÃO DA SILVA",
    "cpf": "12345678900",
    "data_nascimento": "1980-01-15",
    "situacao": "REGULAR"
  }
}
```

### 11. MTE / Certidão de Débitos Trabalhistas
**Código:** `mte/certidao-debitos`  
**Endpoint:** `POST /v1/consultas/mte/certidao-debitos`

**Requisição:**
```json
{
  "code": "mte/certidao-debitos",
  "data": {
    "cnpj": "12345678000123"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "certidao": "NEGATIVA",
    "data_emissao": "2024-12-01",
    "validade": "2025-12-01"
  }
}
```

### 12. FGTS / Emissão de Guia Rápida
**Código:** `fgts/guia-rapida`  
**Endpoint:** `POST /v1/consultas/fgts/guia-rapida`

**Requisição:**
```json
{
  "code": "fgts/guia-rapida",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "situacao_fgts": "REGULAR",
    "saldo_atual": 15000.00,
    "contas": [
      {
        "numero": "123456789",
        "saldo": 15000.00,
        "situacao": "ATIVA"
      }
    ]
  }
}
```

### 13. Tribunal / TRT2 / Certidão Eletrônica de Ações Trabalhistas (CEAT)
**Código:** `tribunal/trt2/ceat`  
**Endpoint:** `POST /v1/consultas/tribunal/trt2/ceat`

**Requisição:**
```json
{
  "code": "tribunal/trt2/ceat",
  "data": {
    "cpf": "12345678900"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "processos": [],
    "situacao": "NADA CONSTA",
    "data_consulta": "2024-12-01"
  }
}
```

### 14. Correios / CEP
**Código:** `correios/cep`  
**Endpoint:** `POST /v1/consultas/correios/cep`

**Requisição:**
```json
{
  "code": "correios/cep",
  "data": {
    "cep": "01234567"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "logradouro": "Rua das Flores",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01234567"
  }
}
```

### 15. Correios / Completa CEP
**Código:** `correios/completa-cep`  
**Endpoint:** `POST /v1/consultas/correios/completa-cep`

**Requisição:**
```json
{
  "code": "correios/completa-cep",
  "data": {
    "cep": "01234567"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "logradouro": "Rua das Flores, 123",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "uf": "SP",
    "cep": "01234567",
    "latitude": "-23.550520",
    "longitude": "-46.633308",
    "area_territorial": "São Paulo/SP"
  }
}
```

### 16. IBGE / Área territorial brasileira
**Código:** `ibge/area-territorial`  
**Endpoint:** `POST /v1/consultas/ibge/area-territorial`

**Requisição:**
```json
{
  "code": "ibge/area-territorial",
  "data": {
    "codigo_municipio": "3550308"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "municipio": "São Paulo",
    "uf": "SP",
    "regiao": "Sudeste",
    "populacao": 12325232,
    "area_km2": 1521.11,
    "densidade_demografica": 8102.5
  }
}
```

---

## 🚗 VEÍCULO (3 serviços)

### 17. DETRAN / SP / Veículo
**Código:** `detran/sp/veiculo`  
**Endpoint:** `POST /v1/consultas/detran/sp/veiculo`

**Requisição:**
```json
{
  "code": "detran/sp/veiculo",
  "data": {
    "placa": "ABC1234"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "placa": "ABC1234",
    "chassi": "9BWZZZ377VT004251",
    "modelo": "GOL 1.0",
    "ano_fabricacao": 2020,
    "ano_modelo": 2021,
    "cor": "BRANCA",
    "situacao": "NORMAL"
  }
}
```

### 18. SENATRAN / Veículo
**Código:** `senatran/veiculo`  
**Endpoint:** `POST /v1/consultas/senatran/veiculo`

**Requisição:**
```json
{
  "code": "senatran/veiculo",
  "data": {
    "placa": "ABC1234"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "placa": "ABC1234",
    "renavam": "12345678901",
    "proprietario": "JOÃO DA SILVA",
    "cpf_cnpj_proprietario": "12345678900",
    "municipio": "SÃO PAULO",
    "uf": "SP"
  }
}
```

### 19. SERPRO / RADAR / Veículo
**Código:** `serpro/radar/veiculo`  
**Endpoint:** `POST /v1/consultas/serpro/radar/veiculo`

**Requisição:**
```json
{
  "code": "serpro/radar/veiculo",
  "data": {
    "placa": "ABC1234"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "placa": "ABC1234",
    "situacao_veiculo": "NORMAL",
    "restricoes": [],
    "multas_pendentes": 0,
    "licenciamento_atual": true,
    "seguro_obrigatorio": "VIGENTE"
  }
}
```

---

## ⚠️ Tratamento de Erros

```json
{
  "success": false,
  "error": "Descrição do erro",
  "code": "CODIGO_ERRO"
}
```

**Códigos de Erro Comuns:**
- `INVALID_INPUT`: Dados de entrada inválidos
- `SERVICE_UNAVAILABLE`: Serviço temporariamente indisponível
- `QUOTA_EXCEEDED`: Limite de consultas excedido
- `AUTHENTICATION_FAILED`: Falha na autenticação

## ⏱️ Timeouts e Rate Limits

- **Timeout padrão:** 30 segundos
- **Rate limit:** Depende do plano contratado
- **Retry policy:** Implementar exponential backoff

## 💰 Custos por Consulta

| Categoria | Custo Médio (R$) |
|-----------|------------------|
| Crédito | 1,80 |
| Cadastral | 1,00 |
| Veículo | 3,00 |

## 🔧 Implementação no Plugin

Baseado neste documento, o plugin Infosimples será atualizado para:

1. **Mapear códigos:** Atualizar `config.ts` com os códigos específicos
2. **Normalizar respostas:** Implementar parsers específicos para cada serviço
3. **Validar inputs:** Adicionar validações CPF/CNPJ/Placa/CEP
4. **Calcular custos:** Aplicar preços corretos por categoria
5. **Tratar erros:** Implementar fallbacks e retries

Este documento serve como referência técnica para a implementação dos 18 serviços selecionados para o mercado varejista.