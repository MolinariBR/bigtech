// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Loader dinâmico de plugins conforme contratos padronizados

import * as fs from 'fs';
import * as path from 'path';
import { AppwriteService } from '../lib/appwrite';

export interface Plugin {
  id: string;
  type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;
  install(): Promise<void>;
  enable(tenantId: string): Promise<void>;
  disable(tenantId: string): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
}

export interface PluginContext {
  tenantId: string;
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
  private activePlugins: Map<string, Set<string>> = new Map(); // tenantId -> Set<pluginIds>

  private constructor() {}

  public static getInstance(): PluginLoader {
    if (!PluginLoader.instance) {
      PluginLoader.instance = new PluginLoader();
    }
    return PluginLoader.instance;
  }

  async initialize(): Promise<void> {
    await this.loadPlugins();
    await this.loadActivePlugins();

    // Para desenvolvimento: ativar plugin infosimples por padrão
    this.activePlugins.set('default', new Set(['infosimples']));
    console.log('✅ Plugin infosimples ativado por padrão para tenant default');
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

  async getActivePlugins(tenantId: string): Promise<Plugin[]> {
    const activePluginIds = this.activePlugins.get(tenantId) || new Set();
    const activePlugins: Plugin[] = [];

    for (const pluginId of Array.from(activePluginIds)) {
      // Map plugin database ID to plugin instance
      // This is a simplified mapping - in reality you'd need proper mapping
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

    // Check if plugin is active for tenant
    const activePlugins = this.activePlugins.get(context.tenantId) || new Set();
    if (!activePlugins.has(pluginId)) {
      return {
        success: false,
        error: `Plugin ${pluginId} not active for tenant ${context.tenantId}`
      };
    }

    try {
      return await plugin.execute(context);
    } catch (error) {
      console.error(`Plugin ${pluginId} execution error:`, error);
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        success: false,
        error: `Plugin execution failed: ${err.message}`
      };
    }
  }

  getAvailablePlugins(): { id: string; type: string; version: string }[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      type: plugin.type,
      version: plugin.version
    }));
  }

  getActivePluginsForTenant(tenantId: string): Set<string> {
    return this.activePlugins.get(tenantId) || new Set();
  }

  getPlugin(pluginId: string): Plugin | undefined {
    // Primeiro tentar chave direta (ex: 'consulta-infosimples')
    const byKey = this.plugins.get(pluginId);
    if (byKey) return byKey;

    // Fallback: procurar pela propriedade `id` do plugin (ex: 'infosimples')
    return Array.from(this.plugins.values()).find(p => p.id === pluginId);
  }

  isPluginActiveForTenant(pluginId: string, tenantId: string): boolean {
    const activePlugins = this.activePlugins.get(tenantId) || new Set();
    return activePlugins.has(pluginId);
  }
}

export const pluginLoader = PluginLoader.getInstance();