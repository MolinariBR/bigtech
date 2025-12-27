// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Loader dinâmico de plugins conforme contratos padronizados

import * as fs from 'fs';
import * as path from 'path';
import { AppwriteService } from '../lib/appwrite';
import { auditLogger } from './audit';
import { billingEngine } from './billingEngine';
import { eventBus } from './eventBus';

export interface Plugin {
  id: string;
  type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;
  install(): Promise<void>;
  enable(): Promise<void>;
  disable(): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
  getAvailableServices?(context?: PluginContext): Promise<any[]> | any[];
}

export interface PluginContext {
  userId: string;
  input: any;
  config: any;
}

export interface PluginResult {
  success: boolean;
  data?: any;
  error?: string;
  cost?: number;
}

export class PluginLoader {
  private static instance: PluginLoader;
  private appwrite = AppwriteService.getInstance();
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set(); // Apenas plugins ativos (single-tenant)

  private constructor() {}

  public static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  async initialize(): Promise<void> {
    // Inicializar sistemas CORE necessários
    await auditLogger.initialize();
    await billingEngine.initialize();
    await eventBus.initialize();

    await this.loadPlugins();
    await this.loadActivePlugins();
    await this.loadGlobalPluginConfigs();

    // Para desenvolvimento: ativar plugins por padrão
    this.activePlugins = new Set(['infosimples', 'bigtech']);
    console.log('✅ Plugins infosimples e bigtech ativados por padrão');
  }

  async shutdown(): Promise<void> {
    // Cleanup plugins if needed
    this.plugins.clear();
    this.activePlugins.clear();
  }

  private async loadPlugins(): Promise<void> {
    const pluginsDir = path.join(__dirname, '../plugins');

    if (!fs.existsSync(pluginsDir)) {
      console.warn('Plugins directory not found - no plugins loaded');
      return;
    }

    const pluginTypes = fs.readdirSync(pluginsDir);
    console.log('🔍 Found plugin types:', pluginTypes);

    for (const type of pluginTypes) {
      const typeDir = path.join(pluginsDir, type);

      if (!fs.statSync(typeDir).isDirectory()) continue;

      const pluginNames = fs.readdirSync(typeDir);
      console.log(`🔍 Found plugins in ${type}:`, pluginNames);

      for (const name of pluginNames) {
        const pluginDir = path.join(typeDir, name);
        const pluginPath = path.join(pluginDir, 'index.ts');

        console.log(`🔍 Checking plugin path: ${pluginPath}`);
        if (fs.existsSync(pluginPath)) {
          try {
            console.log(`🔄 Importing plugin: ${type}-${name}`);
            const pluginModule = await import(pluginPath);
            let plugin: any = pluginModule.default || pluginModule;

            // If it's a class constructor, instantiate it
            if (typeof plugin === 'function' && plugin.prototype && plugin.prototype.constructor === plugin) {
              plugin = new (plugin as any)();
            }

            if (this.validatePlugin(plugin)) {
              this.plugins.set(`${type}-${name}`, plugin);
              console.log(`✅ Plugin loaded: ${type}-${name} v${plugin.version}`);
            } else {
              console.log(`❌ Plugin validation failed: ${type}-${name}`);
            }

            if (this.validatePlugin(plugin)) {
              this.plugins.set(`${type}-${name}`, plugin);
              console.log(`✅ Plugin loaded: ${type}-${name} v${plugin.version}`);
            } else {
              console.log(`❌ Plugin validation failed: ${type}-${name}`);
            }
          } catch (error) {
            console.error(`❌ Failed to load plugin ${type}-${name}:`, error);
          }
        } else {
          console.log(`❌ Plugin index.ts not found: ${pluginPath}`);
        }
      }
    }
  }

  private validatePlugin(plugin: any): plugin is Plugin {
    const checks = [
      { prop: 'id', valid: typeof plugin.id === 'string' },
      { prop: 'type', valid: typeof plugin.type === 'string' },
      { prop: 'version', valid: typeof plugin.version === 'string' },
      { prop: 'install', valid: typeof plugin.install === 'function' },
      { prop: 'enable', valid: typeof plugin.enable === 'function' },
      { prop: 'disable', valid: typeof plugin.disable === 'function' },
      { prop: 'execute', valid: typeof plugin.execute === 'function' },
    ];

    const failed = checks.filter(check => !check.valid);
    if (failed.length > 0) {
      console.log(`❌ Plugin validation failed for properties:`, failed.map(f => f.prop));
      return false;
    }

    console.log(`✅ Plugin validation passed for: ${plugin.id}`);
    return true;
  }

  private async loadActivePlugins(): Promise<void> {
    try {
      // TODO: Implementar carregamento de plugins ativos do Appwrite quando estiver configurado
      console.log('[DEV] Skipping active plugins load from database');
    } catch (error) {
      console.warn('Failed to load active plugins from database:', error);
    }
  }

  private async loadGlobalPluginConfigs(): Promise<void> {
    try {
      console.log('🔄 Loading global plugin configurations from Appwrite...');

      // Buscar todas as configurações globais de plugins
      const globalPlugins = await this.appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'global_plugins',
        [], // Sem filtros, buscar todos
        '100' // Limit
      );

      // Inicializar store global se não existir
      if (!(global as any).pluginConfigStore) {
        (global as any).pluginConfigStore = {};
      }

      const globalConfigStore = (global as any).pluginConfigStore;

      // Para configurações globais, usar tenant 'default'
      if (!globalConfigStore['default']) {
        globalConfigStore['default'] = {};
      }

      // Processar cada configuração global
      for (const pluginDoc of globalPlugins.documents) {
        try {
          const pluginId = pluginDoc.pluginId;
          const configStr = pluginDoc.config;

          // Parse da configuração (está armazenada como string JSON)
          let config = {};
          if (typeof configStr === 'string') {
            config = JSON.parse(configStr);
          } else if (configStr) {
            config = configStr;
          }

          // Parse dos preços de serviço se existir
          let servicePrices = {};
          if (pluginDoc.servicePrices) {
            if (typeof pluginDoc.servicePrices === 'string') {
              servicePrices = JSON.parse(pluginDoc.servicePrices);
            } else {
              servicePrices = pluginDoc.servicePrices;
            }
          }

          // Parse das configurações de fallback se existir
          let fallbackConfig = {};
          if (pluginDoc.fallbackConfig) {
            if (typeof pluginDoc.fallbackConfig === 'string') {
              fallbackConfig = JSON.parse(pluginDoc.fallbackConfig);
            } else {
              fallbackConfig = pluginDoc.fallbackConfig;
            }
          }

          // Parse das configurações de rate limit se existir
          let rateLimitConfig = {};
          if (pluginDoc.rateLimitConfig) {
            if (typeof pluginDoc.rateLimitConfig === 'string') {
              rateLimitConfig = JSON.parse(pluginDoc.rateLimitConfig);
            } else {
              rateLimitConfig = pluginDoc.rateLimitConfig;
            }
          }

          // Descriptografar API key se necessário
          if (config && typeof config === 'object' && 'apiKey' in config && config.apiKey && typeof config.apiKey === 'string') {
            try {
              config.apiKey = this.decryptIfNeeded(config.apiKey);
            } catch (error) {
              console.warn(`Failed to decrypt API key for plugin ${pluginId}:`, error);
            }
          }

          // Salvar no store global
          globalConfigStore['default'][pluginId] = {
            config,
            servicePrices,
            fallbackConfig,
            rateLimitConfig,
            updatedAt: pluginDoc.updatedAt || new Date().toISOString()
          };

          console.log(`✅ Loaded global config for plugin: ${pluginId}`);

        } catch (error) {
          console.error(`❌ Failed to process global config for plugin ${pluginDoc.pluginId}:`, error);
        }
      }

      console.log(`✅ Loaded ${globalPlugins.documents.length} global plugin configurations`);

    } catch (error) {
      console.warn('Failed to load global plugin configurations from Appwrite:', error);
      console.log('Continuing with empty global config store...');
    }
  }

  // Método auxiliar para descriptografar se necessário
  private decryptIfNeeded(value: string): string {
    // Se o valor parece estar criptografado (não é um token normal), tentar descriptografar
    if (value && value.length > 50 && !value.startsWith('sk_') && !value.startsWith('pk_')) {
      try {
        // Importar EncryptionUtils dinamicamente para evitar dependências circulares
        const { EncryptionUtils } = require('../utils/encryption');
        return EncryptionUtils.decrypt(value);
      } catch (error) {
        // Se falhar, retornar o valor original
        return value;
      }
    }
    return value;
  }

  async getActivePlugins(): Promise<Plugin[]> {
    const activePlugins: Plugin[] = [];

    for (const pluginId of Array.from(this.activePlugins)) {
      const plugin = Array.from(this.plugins.values()).find(p => p.id === pluginId);
      if (plugin) {
        activePlugins.push(plugin);
      }
    }

    return activePlugins;
  }

  async executePlugin(
    pluginId: string,
    context: PluginContext
  ): Promise<PluginResult> {
    const plugin = this.getPlugin(pluginId);

    if (!plugin) {
      return {
        success: false,
        error: `Plugin ${pluginId} not found`
      };
    }

    // Check if plugin is active
    if (!this.activePlugins.has(pluginId)) {
      return {
        success: false,
        error: `Plugin ${pluginId} not active`
      };
    }

    const startTime = Date.now();
    let result: PluginResult;

    try {
      result = await plugin.execute(context);

      // Auditoria automática para todas as operações
      await auditLogger.log({
        userId: context.userId,
        action: 'plugin_execute',
        resource: `plugin:${pluginId}`,
        details: {
          pluginId,
          input: this.sanitizeAuditData(context.input),
          success: result.success,
          cost: result.cost,
          duration: Date.now() - startTime,
          error: result.error
        },
        ipAddress: 'system' // TODO: capturar IP real quando disponível
      });

      // Publicar evento para billing se houver custo
      if (result.success && result.cost && result.cost > 0) {
        await eventBus.publish({
          userId: context.userId,
          type: 'plugin.executed',
          payload: {
            pluginId,
            cost: result.cost,
            consultaId: this.extractConsultaId(context.input),
            type: pluginId
          }
        });
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Auditoria para falhas também
      await auditLogger.log({
        userId: context.userId,
        action: 'plugin_execute_failed',
        resource: `plugin:${pluginId}`,
        details: {
          pluginId,
          input: this.sanitizeAuditData(context.input),
          error: err.message,
          duration: Date.now() - startTime
        },
        ipAddress: 'system'
      });

      result = {
        success: false,
        error: `Plugin execution failed: ${err.message}`
      };

      return result;
    }
  }

  getAvailablePlugins(): { id: string; type: string; version: string }[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      type: plugin.type,
      version: plugin.version
    }));
  }

  getActivePluginsForTenant(): Set<string> {
    return this.activePlugins;
  }

  getPlugin(pluginId: string): Plugin | undefined {
    // Primeiro tentar chave direta (ex: 'consulta-infosimples')
    const byKey = this.plugins.get(pluginId);
    if (byKey) return byKey;

    // Fallback: procurar pela propriedade `id` do plugin (ex: 'infosimples')
    return Array.from(this.plugins.values()).find(p => p.id === pluginId);
  }

  // Sanitizar dados para auditoria (remover dados sensíveis)
  private sanitizeAuditData(data: any): any {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    // Campos sensíveis que não devem ser logados
    const sensitiveFields = ['senha', 'password', 'token', 'apiKey', 'secret', 'cpf', 'cnpj'];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Extrair ID de consulta do input do plugin
  private extractConsultaId(input: any): string | undefined {
    // Para plugins de consulta, o input pode conter um consultaId
    return input?.consultaId || input?.id;
  }
}

export const pluginLoader = PluginLoader.getInstance();