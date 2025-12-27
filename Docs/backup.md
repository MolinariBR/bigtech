# Projeto Bigtech — Arquitetura do Sistema

---
precedence: 2
version: 1.1.0
depends_on: [1.Project.md]
influences: [3.Structure.md,4.Entities.md,5.Pages.md,6.DesignSystem.md,7.Tasks.md]
last_update: 2025-12-20
---

## 1. Descrição

O Projeto Bigtech é um SaaS **multi-usuário com separação lógica por tenant**, orientado a plugins e executado em **infraestrutura compartilhada única**.

⚠️ **Decisão arquitetural obrigatória (derivada do 1.Project.md):**  
O sistema é **single-tenant em nível de infraestrutura**.  
Não existe isolamento por containers, instâncias, bancos ou ambientes por tenant.  
Todo isolamento ocorre **exclusivamente no nível de aplicação**, via autenticação, autorização, escopo de dados e configuração.

O CORE permanece mínimo e agnóstico, delegando funcionalidades variáveis a plugins carregados dinamicamente.  
Todos os tenants compartilham o mesmo backend, banco e serviços base, com segregação lógica garantida pelo modelo de dados e controle de acesso.

A arquitetura prioriza:
- **Simplicidade operacional**
- **Extensibilidade por plugins**
- **Governança e auditoria**
- **Baixo acoplamento entre funcionalidades**

---

## 2. Princípios Arquiteturais

- **CORE mínimo**: Autenticação, autorização, tenants lógicos, plugin loader, auditoria, billing genérico e Event Bus.
- **Plugins**: Toda regra de negócio variável reside fora do CORE.
- **Tenancy lógico**: Isolamento por `tenantId` em dados, permissões e configurações.
- **Infraestrutura compartilhada**: Uma única aplicação, sem containers dedicados por tenant.
- **Extensibilidade controlada**: Plugins seguem contratos explícitos.
- **Comunicação desacoplada**: Event Bus para orquestração e efeitos colaterais.
- **Integração com Appwrite**: Autenticação, storage e persistência, com isolamento lógico.

---

## 3. Camadas do Sistema

### 3.1 Frontends

- **Usuário (`frontend-user`)**  
  Consultas, histórico, compra de créditos  
  Tecnologia: Next.js (React)

- **Admin (`frontend-admin`)**  
  Gestão de tenants lógicos, usuários, plugins e auditoria  
  Tecnologia: Next.js (React)

- **API Pública**  
  Via `plugin-atacado` (fora do MVP)  
  Autenticação via API Key ou JWT escopado

---

### 3.2 Backend CORE

- **Responsabilidades**:
  - Autenticação e autorização
  - Resolução de tenant lógico
  - Plugin loader
  - Event Bus
  - Billing genérico
  - Auditoria e logs

- **Tecnologia**: Node.js / TypeScript  
- **Execução**: Instância única compartilhada  
- **Integração**: Appwrite (BaaS)

❗ O CORE **nunca** replica instâncias por tenant.

---

### 3.3 Plugins

- **Tipos**:
  - Consulta
  - Pagamento
  - Mercado
  - Funcional

- **Estrutura**:
  `plugins/<tipo>/<nome>`  
  Ex.: `plugins/consulta/infosimples`

- **Contratos**:
  Interfaces TypeScript padronizadas (`plugins/core/contracts.ts`)

- **Execução**:
  Plugins são carregados dinamicamente e executados **no contexto do tenant lógico**, sem isolamento físico.

#### Gestão de Plugins (`pluginLoader`)

Responsabilidades:
- Ativação/desativação por `tenantId`
- Validação de dependências
- Validação de configuração (`JSON Schema`)
- Emissão de eventos no Event Bus
- Geração obrigatória de `auditId` para operações mutativas

---

### 3.4 Backend Appwrite

- **Uso**:
  - Autenticação (JWT)
  - Bancos de dados
  - Storage
  - Funções auxiliares

- **Isolamento**:
  - Lógico por `tenantId`
  - Sem bancos separados por tenant

---

### 3.5 Containers Docker

- Docker é utilizado **apenas como unidade de deploy da aplicação**, não como mecanismo de isolamento por tenant.
- Uma única stack Docker executa:
  - CORE
  - Plugins
  - Integrações

❌ Não existe container por tenant  
❌ Não existe rebuild ou restart por tenant

---

### 3.6 Auditoria e Logs

- Todas as ações relevantes geram registros em `Audit`
- Campos mínimos:
  - tenantId
  - userId
  - action
  - resource
  - details
  - auditId
  - timestamp

- Logs são:
  - Imutáveis
  - Consultáveis via admin
  - Exportáveis

---

## 4. Fluxos Arquiteturais

### 4.1 Autenticação

1. Usuário acessa frontend
2. CORE resolve tenant lógico
3. Validação JWT via Appwrite
4. Contexto do usuário é criado

---

### 4.2 Consulta

1. Usuário solicita consulta
2. CORE valida permissões e créditos
3. Plugin de consulta é executado
4. Fontes externas são chamadas
5. Resultado normalizado
6. Auditoria registrada

---

### 4.3 Billing

1. Evento de consumo emitido
2. Billing genérico processa
3. Plugin de pagamento executa
4. Auditoria e saldo atualizados

---

## 5. Infraestrutura

### 5.1 Infraestrutura

- **Execução**: Docker
- **Rede**: NGINX
- **Banco**: Appwrite (PostgreSQL/MariaDB)
- **Monitoramento**: Logs + métricas

### 5.2 Segurança

- JWT
- Rate limiting
- TLS
- Auditoria obrigatória
- Nenhum isolamento físico por tenant

---

## 6. Decisões Tecnológicas

- Frontend: Next.js, Shadcn, Tailwind
- Backend: Node.js / TypeScript
- BaaS: Appwrite
- Mensageria: RabbitMQ
- Containers: Docker (deploy, não tenancy)

---

## 7. Contratos de Plugins

```ts
interface Plugin {
  id: string;
  type: 'fonte' | 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;
  install(): Promise<void>;
  enable(tenantId: string): Promise<void>;
  disable(tenantId: string): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
}
```

---

## 7. Evolução Arquitetural

* **MVP**: CORE + plugins iniciais
* **Expansão**: Novos plugins
* **Escala**: Horizontal por carga, não por tenant
* **Futuro**: Extração seletiva de serviços se necessário

---

## 8. Diagramas (Texto)

### 8.1 Geral

```
[Frontend User ] --> [CORE]
[Frontend Admin] --> [CORE]
[CORE] --> [Plugins]
[Plugins] --> [Appwrite]
[CORE] --> [Event Bus]
```

### 8.2 Isolamento Lógico

```
Tenant A --+
Tenant B --+--> [CORE + Plugins] --> [DB compartilhado]
Tenant C --+
```

---

## 9. Histórico de Versões

| Versão | Data       | Observação                                                       |
| ------ | ---------- | ---------------------------------------------------------------- |
| 1.1.0  | 20/12/2025 | Alinhamento completo com tenancy lógico definido em 1.Project.md |

```

---

### Resultado final

Agora:

### Resultado final

Agora:
- ✅ **Architecture NÃO contradiz Project**
- ✅ **IA não criará containers por tenant**
- ✅ **Structure / Entities / Tasks ficam protegidos**
- ✅ **Você pode evoluir sem dívida conceitual**
