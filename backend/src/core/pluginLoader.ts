// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Loader dinâmico de plugins conforme contratos padronizados

import * as fs from 'fs';
import * as path from 'path';
import { AppwriteService } from '../lib/appwrite';

interface Plugin {
  id: string;
  type: 'consulta' | 'pagamento' | 'mercado' | 'funcional';
  version: string;
  install(): Promise<void>;
  enable(tenantId: string): Promise<void>;
  disable(tenantId: string): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
}

interface PluginContext {
  tenantId: string;
  userId: string;
  input: any;
  config: any;
}

interface PluginResult {
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

    for (const type of pluginTypes) {
      const typeDir = path.join(pluginsDir, type);

      if (!fs.statSync(typeDir).isDirectory()) continue;

      const pluginNames = fs.readdirSync(typeDir);

      for (const name of pluginNames) {
        const pluginDir = path.join(typeDir, name);
        const pluginPath = path.join(pluginDir, 'index.ts');

        if (fs.existsSync(pluginPath)) {
          try {
            const pluginModule = await import(pluginPath);
            const plugin: Plugin = pluginModule.default || pluginModule;

            if (this.validatePlugin(plugin)) {
              this.plugins.set(`${type}-${name}`, plugin);
              console.log(`✅ Plugin loaded: ${type}-${name} v${plugin.version}`);
            }
          } catch (error) {
            console.error(`❌ Failed to load plugin ${type}-${name}:`, error);
          }
        }
      }
    }
  }

  private validatePlugin(plugin: any): plugin is Plugin {
    return (
      plugin &&
      typeof plugin.id === 'string' &&
      typeof plugin.type === 'string' &&
      typeof plugin.version === 'string' &&
      typeof plugin.install === 'function' &&
      typeof plugin.enable === 'function' &&
      typeof plugin.disable === 'function' &&
      typeof plugin.execute === 'function'
    );
  }

  private async loadActivePlugins(): Promise<void> {
    try {
      const plugins = await this.appwrite.databases.listDocuments(
        process.env.APPWRITE_DATABASE_ID || 'bigtechdb',
        'plugins',
        ['status=enabled']
      );

      for (const plugin of plugins.documents) {
        if (!this.activePlugins.has(plugin.tenantId)) {
          this.activePlugins.set(plugin.tenantId, new Set());
        }
        this.activePlugins.get(plugin.tenantId)!.add(plugin.$id);
      }
    } catch (error) {
      console.warn('Failed to load active plugins from database:', error);
    }
  }

  async getActivePlugins(tenantId: string): Promise<Plugin[]> {
    const activePluginIds = this.activePlugins.get(tenantId) || new Set();
    const activePlugins: Plugin[] = [];

    for (const pluginId of activePluginIds) {
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
    const plugin = this.plugins.get(pluginId);

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
      return {
        success: false,
        error: `Plugin execution failed: ${error.message}`
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
}

export const pluginLoader = PluginLoader.getInstance();