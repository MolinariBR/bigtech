# Análise do Sistema de Plugins - BigTech

## Visão Geral

Este documento analisa o sistema de plugins da plataforma BigTech, focando nas funcionalidades de instalação, configuração e gerenciamento de plugins, especialmente o plugin BigTech para consultas de crédito.

## Arquitetura do Sistema de Plugins

### 1. PluginLoader (Core)

**Localização:** `backend/src/core/pluginLoader.ts`

**Funcionalidades Principais:**
- Carregamento dinâmico de plugins a partir do diretório `src/plugins/`
- Validação de contratos de plugin (interface Plugin)
- Gerenciamento de estado ativo/inativo dos plugins
- Execução de plugins com contexto de usuário
- Sistema de auditoria integrado
- Rate limiting e circuit breaker (não implementado no BigTech)

**Interface Plugin:**
```typescript
interface Plugin {
  id: string;
  type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;
  install(): Promise<void>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
}
```

### 2. Plugin BigTech

**Localização:** `backend/src/plugins/consulta/bigtech/`

**Estrutura:**
```
bigtech/
├── index.ts          # Implementação principal do plugin
├── config.ts         # Configurações e mapeamentos
├── types.ts          # Definições TypeScript
├── validator.ts      # Validação e sanitização de dados
└── novosprodutos.md  # Documentação da API BigTech
```

**Configuração Atual:**
```typescript
export const defaultConfig: BigTechConfig = {
  baseUrl: 'https://api.consultasbigtech.com.br/json/service.aspx',
  homologationUrl: 'https://api.consultasbigtech.com.br/json/homologa.aspx',
  useHomologation: true, // ATUALMENTE USANDO HOMOLOGAÇÃO
  apiKey: 'ZzM67lS3CL7SSW6680p9fEcNPcD5wE88aSQa/D3EnDeL6cnwsrkpmrCsSt4dssftiiooSega',
  timeout: 30000,
  retries: 3,
  // ... outros parâmetros
};
```

## Funcionalidades de Instalação e Configuração

### 1. Backend - Admin Plugins

**Localização:** `backend/src/controllers/admin/plugins.ts`

**Rotas Disponíveis:**
- `GET /api/admin/plugins` - Listar plugins do tenant
- `POST /api/admin/plugins` - Instalar plugin
- `POST /api/admin/plugins/:pluginId/toggle` - Habilitar/desabilitar plugin
- `PUT /api/admin/plugins/:pluginId/config` - Configurar plugin
- `DELETE /api/admin/plugins/:pluginId` - Remover plugin

**Estado Atual:**
- ✅ Plugin BigTech é carregado automaticamente pelo PluginLoader
- ✅ Plugins são ativados por padrão em desenvolvimento (`['infosimples', 'bigtech']`)
- ❌ Sistema de instalação/configuração não está totalmente integrado
- ❌ Configurações são armazenadas em memória (global stores) para desenvolvimento

### 2. Backend - Plugin Access

**Localização:** `backend/src/controllers/admin/pluginAccess.ts`

**Funcionalidades:**
- Controle de acesso a plugins por usuário
- Listagem de plugins disponíveis
- Gerenciamento de permissões por usuário

**Rotas:**
- `GET /api/admin/plugin-access/plugins/available` - Plugins disponíveis
- `GET /api/admin/plugin-access/users/:userId/plugins` - Plugins do usuário
- `PUT /api/admin/plugin-access/users/:userId/plugins` - Atualizar permissões

### 3. Frontend - Gestão de Plugins

**Localização:** `frontend-admin/src/pages/plugins.tsx`

**Estado Atual:**
- ✅ Página existe para visualização de plugins
- ❌ **FALTA:** Funcionalidades de instalação/configuração
- ❌ **REMOVIDO:** Botões de instalar/configurar plugins (conforme mencionado pelo usuário)

**Problema Identificado:**
A página `plugins.tsx` atualmente só **lista** os plugins disponíveis, mas não oferece funcionalidades para:
- Instalar novos plugins
- Configurar chaves de API
- Alterar URLs (produção/homologação)
- Gerenciar status dos plugins

## Análise de Problemas

### 1. Funcionalidades Faltantes no Frontend

**Instalação de Plugins:**
- Não há botão/interface para instalar plugins
- Não há formulário de configuração inicial
- Não há validação de pré-requisitos

**Configuração de Plugins:**
- Não há interface para configurar API keys
- Não há opção para alternar entre produção/homologação
- Não há gerenciamento de timeouts e retries

### 2. Backend - Configuração Limitada

**Persistência:**
- Configurações são armazenadas em `global` stores (desenvolvimento)
- Não há integração completa com Appwrite
- Falta migração para persistência real

**Validação:**
- Não há validação de API keys na configuração
- Não há testes de conectividade na instalação

### 3. Fluxo de Instalação Incompleto

**Sequência Ideal:**
1. **Descoberta** → Plugin aparece na lista disponível
2. **Instalação** → Usuário clica "Instalar" e configura parâmetros
3. **Validação** → Sistema testa a configuração
4. **Ativação** → Plugin fica disponível para uso

**Estado Atual:**
1. ✅ **Descoberta** → Plugin é carregado automaticamente
2. ❌ **Instalação** → Não há interface de instalação
3. ❌ **Validação** → Configuração hardcoded no código
4. ✅ **Ativação** → Plugin ativo por padrão

## Recomendações de Implementação

### 1. Frontend - Página de Plugins

**Adicionar Funcionalidades:**
```typescript
// Botões de ação na tabela
- Instalar Plugin
- Configurar Plugin
- Habilitar/Desabilitar
- Remover Plugin

// Modal de configuração
- Campo para API Key
- Toggle Produção/Homologação
- Configurações avançadas (timeout, retries)
- Teste de conectividade
```

### 2. Backend - Melhorar Instalação

**Implementar:**
```typescript
// Validação de configuração na instalação
async validateConfig(config: BigTechConfig): Promise<boolean> {
  // Testar conectividade com API
  // Validar formato da API key
  // Verificar permissões
}

// Persistência de configurações
interface PluginInstallation {
  pluginId: string;
  tenantId: string;
  config: BigTechConfig;
  status: 'installed' | 'configured' | 'active';
  installedAt: Date;
  updatedAt: Date;
}
```

### 3. Fluxo Completo de Instalação

**Passos Recomendados:**
1. **Listagem** → Mostrar plugins disponíveis para instalação
2. **Instalação** → Formulário de configuração inicial
3. **Validação** → Teste de conectividade com API externa
4. **Ativação** → Plugin fica disponível para usuários
5. **Monitoramento** → Logs de uso e health checks

## Estado Atual do Plugin BigTech

### ✅ Funcionando
- Carregamento automático pelo PluginLoader
- Execução de consultas via API
- Validação de entrada/saída
- Sistema de auditoria
- Suporte a homologação/produção
- Rate limiting básico

### ❌ Problemas Identificados
- Falta interface de instalação no frontend
- Configuração hardcoded (não editável via UI)
- Persistência limitada (global stores)
- Não há testes de conectividade na configuração
- Falta documentação de instalação para usuários

## Conclusão

O sistema de plugins tem uma base sólida, mas falta implementar as funcionalidades de **instalação** e **configuração** no frontend. O plugin BigTech está funcional, mas os administradores não conseguem configurar API keys ou alterar URLs através da interface web.

**Prioridade:** Implementar interface de configuração de plugins no frontend-admin para permitir instalação e configuração adequadas do plugin BigTech.</content>
<parameter name="filePath">/home/mau/projeto/consulta/analise-sistema-plugins.md