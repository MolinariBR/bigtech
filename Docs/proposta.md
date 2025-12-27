```md
# Método de Geração Dinâmica de Consultas a partir de OpenAPI

## Objetivo

Definir um método escalável para integrar centenas de consultas externas (ex.: InfoSimples),
garantindo que o usuário visualize apenas os campos corretos para cada consulta,
com validação prévia e sem necessidade de conhecer manualmente cada tipo de consulta.

---

## Princípio Central

Não modelamos consultas individualmente.  
Modelamos **tipos de campos reutilizáveis**.

Consultas diferentes são apenas combinações distintas desses tipos.

---

## Arquitetura Geral

```

OpenAPI (.yaml)
↓
Parser Automático
↓
Normalização de Field Types
↓
ConsultaSchema (canônico)
↓
FormSchema
↓
Modal Dinâmico
↓
Validação Local
↓
Chamada Externa

````

---

## OpenAPI como Fonte de Verdade

O OpenAPI é utilizado apenas como insumo técnico.
Ele **não é usado diretamente para gerar a UI**.

Exemplo:

```yaml
paths:
  /consultas/receita-federal/cpf:
    post:
      requestBody:
        content:
          application/x-www-form-urlencoded:
            schema:
              type: object
              required:
                - cpf
                - birthdate
              properties:
                cpf:
                  type: string
                  pattern: "^[0-9]{11}$"
                birthdate:
                  type: string
                  format: date
                timeout:
                  type: integer
````

Campos de infraestrutura (ex.: `token`, `timeout`) não pertencem ao formulário do usuário.

---

## Classificação de Campos (Field Types)

Todos os parâmetros são convertidos para tipos lógicos canônicos.

| Tipo lógico     | Exemplos               |
| --------------- | ---------------------- |
| document.cpf    | cpf                    |
| document.cnpj   | cnpj                   |
| date.iso        | birthdate              |
| enum.uf         | uf                     |
| string.name     | nome                   |
| string.generic  | palavra_chave          |
| vehicle.plate   | placa                  |
| vehicle.renavam | renavam                |
| period.range    | data_inicio + data_fim |
| boolean.flag    | ignore_site_receipt    |
| hidden.infra    | token, timeout         |

Esses tipos se repetem em praticamente todas as consultas.

---

## Parser Automático (OpenAPI → ConsultaSchema)

O parser executa as seguintes etapas:

1. Percorre todos os `paths`
2. Extrai `requestBody.schema.properties`
3. Remove campos de infraestrutura
4. Infere automaticamente o tipo lógico de cada campo

Exemplo de inferência:

```ts
if (name === 'cpf') type = 'document.cpf'
else if (name === 'cnpj') type = 'document.cnpj'
else if (schema.format === 'date') type = 'date.iso'
else if (schema.enum) type = 'enum'
else type = 'string.generic'
```

O parser é baseado em regras fixas, não em consultas específicas.

---

## ConsultaSchema (Formato Canônico)

Schema interno, estável e independente do fornecedor.

```yaml
id: receita-federal-cpf
provider: infosimples
method: POST
endpoint: /consultas/receita-federal/cpf

form:
  title: Consulta CPF — Receita Federal
  submit_label: Consultar

  fields:
    - name: cpf
      type: document.cpf
      required: true

    - name: birthdate
      type: date.iso
      required: true

    - name: timeout
      type: hidden.infra
      default: 600
```

---

## Overrides Controlados

Ajustes pontuais de UX são feitos sem quebrar o parser.

```yaml
overrides:
  birthdate:
    label: Data de nascimento (como no CPF)
```

Overrides devem ser exceções, não regra.

---

## Geração do Modal Dinâmico

O frontend renderiza o formulário exclusivamente a partir do schema.

```ts
fields.map(field => {
  switch (field.type) {
    case 'document.cpf': return CpfInput
    case 'date.iso': return DatePicker
    case 'enum.uf': return Select
    case 'hidden.infra': return null
  }
})
```

O frontend não conhece endpoints nem fornecedores.

---

## Validação Local Obrigatória

Antes de qualquer chamada externa:

* Todos os campos são validados localmente
* A chamada é bloqueada em caso de erro
* Evita consumo indevido de crédito

Exemplos:

* CPF: `^\d{11}$`
* Data ISO: `^\d{4}-\d{2}-\d{2}$`

---

## Chamada Externa

A chamada externa ocorre somente após validação bem-sucedida.

* Método e endpoint definidos no `ConsultaSchema`
* Token aplicado no backend
* Payload gerado a partir dos campos válidos

---

## Escalabilidade do Método

* Novas consultas não exigem novo código
* Novos OpenAPI apenas regeneram schemas
* A UI se adapta automaticamente
* O sistema permanece desacoplado do fornecedor

---

## O que o Método Evita

* Hardcode por consulta
* Formulários manuais
* Erros de parâmetros
* Consumo indevido de crédito
* Acoplamento direto à API externa

---

## Conclusão

A escalabilidade do sistema vem do reconhecimento de padrões,
não do conhecimento prévio de cada consulta.

Este método permite integrar centenas de consultas externas
com controle, previsibilidade e evolução contínua.

```
```