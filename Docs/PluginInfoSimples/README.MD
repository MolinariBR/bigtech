# Documentação da API de Consultas (v2) INFORSIMPLES

**Versão da API:** 2.2.33  
**Data:** 17/12/2025  

Temos o compromisso de manter a documentação da API concisa. Leia este documento antes de iniciar sua integração.

---

## Índice

1. [Histórico de mudanças](#histórico-de-mudanças)
2. [Migrando da v1 para a v2](#migrando-da-v1-para-a-v2)
3. [Formato de requisição](#formato-de-requisição)
4. [Parâmetros de configuração](#parâmetros-de-configuração)
5. [Estrutura de resposta](#estrutura-de-resposta)
6. [Códigos de resposta da API](#códigos-de-resposta-da-api)
7. [Boas práticas](#boas-práticas)
8. [Integrações avançadas](#integrações-avançadas)
9. [Consultas em lote via painel web](#consultas-em-lote-via-painel-web)

---

## Histórico de mudanças

A API está em constante evolução, com novas consultas adicionadas frequentemente. As alterações são sempre incrementais, evitando quebra de integrações existentes.

Você será notificado por e-mail sempre que uma mudança ocorrer. O histórico completo pode ser consultado em:  
https://api.infosimples.com/mudancas

---

## Migrando da v1 para a v2

> Caso você não esteja migrando para a v2, esta seção pode ser ignorada.  
> A v1 continuará funcionando normalmente.

A versão 2 da API da Infosimples introduz melhorias estruturais que tornam a integração mais consistente, porém incompatível com a v1.

### Principais mudanças

- **Rota**
  - v1: `https://api.infosimples.com/api/v1/`
  - v2: `https://api.infosimples.com/api/v2/consultas/`

- **Header do JSON**
  - Estrutura alterada
  - Chaves removidas:
    - `client`, `token`, `credits`, `price_extra`, `has_limit`, `limit`, `used`,
      `limit_price`, `used_price`, `cache_hit`, `cached_at`
  - Novas chaves adicionadas (ver formato completo do `header` na v2)

- **Campo `data`**
  - Passa a ser **sempre um array**, mesmo com apenas um resultado

- **Códigos de resposta**
  - O código **201 não é mais utilizado**
  - Consultas com resultado retornam sempre **200**
  - Mensagem associada ao 200:
    > “A requisição foi processada com sucesso”

- **Campo `errors`**
  - Sempre um array (não pode mais ser `null`)

- **Arquivos de visualização**
  - Cada item de `data` possui sua própria chave `site_receipt`
  - O campo `receipt` foi removido
  - Novo campo `site_receipts` (array) agrupa todas as URLs

---

## Formato de requisição

| Item | Valor |
|----|----|
| **Método HTTP** | POST |
| **URL** | `https://api.infosimples.com/api/v2/consultas/{servico}` |
| **Formato de retorno** | JSON |

Substitua `{servico}` pelo serviço desejado (ex: `receita-federal/cnpj`).  
O nome do serviço está disponível na documentação específica de cada API.

---

## Parâmetros de configuração

Parâmetros comuns a todas as APIs. Serviços específicos podem exigir parâmetros adicionais.

| Parâmetro | Obrigatório | Descrição |
|----|----|----|
| `token` | Sim | Chave de acesso da API |
| `timeout` | Não | Tempo máximo de processamento (15 a 600 segundos) |
| `ignore_site_receipt` | Não | Se `1`, o campo `site_receipts` será retornado vazio |

> ⚠️ **Importante:** configure o timeout da sua biblioteca HTTP para não interromper a requisição antes do timeout informado à API.

---

## Estrutura de resposta

Uma resposta da API contém os seguintes campos:

| Campo | Tipo | Descrição |
|----|----|----|
| `code` | number | Código de resposta |
| `code_message` | string | Mensagem do código |
| `data` | array | Dados estruturados da consulta |
| `data_count` | number | Quantidade de registros retornados |
| `errors` | array | Lista de mensagens de erro |
| `site_receipts` | array | URLs de arquivos HTML ou PDF |
| `header` | object | Metadados da requisição |

### Observações sobre `site_receipts`

- Arquivos disponíveis por **7 dias**
- Recomenda-se download e armazenamento próprio
- Pode ser ignorado com `ignore_site_receipt=1`

### Campos do `header`

- `api_version`
- `product`
- `service`
- `parameters`
- `client_name`
- `token_name`
- `billable`
- `price`
- `requested_at`
- `elapsed_time_in_milliseconds`
- `remote_ip`
- `signature`

---

## Códigos de resposta da API

| Código | Descrição | Há cobrança |
|----|----|----|
| 200 | Requisição processada com sucesso | ✔ |
| 600 | Erro inesperado | ✖ |
| 601 | Falha de autenticação | ✖ |
| 602 | Serviço inválido | ✖ |
| 603 | Token sem autorização | ✖ |
| 604 | Consulta não validada | ✖ |
| 605 | Timeout excedido | ✖ |
| 606 | Parâmetros obrigatórios ausentes | ✔ |
| 607 | Parâmetros inválidos | ✔ |
| 608 | Parâmetros recusados pela origem | ✔ |
| 609 | Tentativas excedidas | ✖ |
| 610 | Falha em CAPTCHA | ✖ |
| 611 | Dados incompletos | ✔ |
| 612 | Consulta sem retorno | ✔ |
| 613 | Consulta bloqueada | ✖ |
| 614 | Erro inesperado na origem | ✖ |
| 615 | Origem indisponível | ✖ |
| 617 | Sobrecarga do serviço | ✖ |
| 618 | Origem sobrecarregada | ✖ |
| 619 | Parâmetro alterado na origem | ✔ |
| 620 | Erro persistente na origem | ✔ |
| 621 | Erro ao gerar visualização | ✖ |
| 622 | Consultas repetidas em excesso | ✖ |

---

## Boas práticas

### Retentativas de consulta

- Trate **todos os códigos de resposta**
- Alguns erros são transitórios (ex: `605`)
- Outros não devem ser repetidos em curto prazo (ex: `620`)
- Defina um **limite máximo de tentativas**
- Evite loops infinitos que gerem cobranças indevidas

### CORS

- **Nunca integre a API diretamente no frontend**
- Crie um backend intermediário
- Evite exposição do token
- A API bloqueia chamadas diretas via browser por segurança

### Timeout do cliente HTTP

- O `timeout` da API não é o mesmo que o timeout da biblioteca HTTP
- O timeout do cliente **deve ser maior** que o timeout enviado à API

---

## Integrações avançadas

### API assíncrona
https://api.infosimples.com/consultas/docs/assincrona

Indicada para:
- Processamento em lote
- Monitoramentos

### Criptografia
https://api.infosimples.com/consultas/docs/criptografia

### Certificados digitais (A1 / PKCS12)
https://api.infosimples.com/consultas/docs/certificados

### Informações da conta
https://api.infosimples.com/consultas/docs/conta

### Status de serviços
https://api.infosimples.com/consultas/docs/api-status

### OpenAPI, Swagger e Postman
https://api.infosimples.com/consultas/docs/openapi

---

## Consultas em lote via painel web

O painel web permite consultas em lote via arquivos CSV, sem necessidade de programação.

Documentação completa:  
https://api.infosimples.com/consultas/docs/lotes
