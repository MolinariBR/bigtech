"use strict";
// Baseado em: 2.Architecture.md v1.0.1, 4.Entities.md v1.1
// Precedência: 1.Project → 2.Architecture → 4.Entities
// Decisão: Loader dinâmico de plugins conforme contratos padronizados
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.pluginLoader = exports.PluginLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const appwrite_1 = require("../lib/appwrite");
class PluginLoader {
    constructor() {
        this.appwrite = appwrite_1.AppwriteService.getInstance();
        this.plugins = new Map();
        this.activePlugins = new Map(); // tenantId -> Set<pluginIds>
    }
    static getInstance() {
        if (!PluginLoader.instance) {
            PluginLoader.instance = new PluginLoader();
        }
        return PluginLoader.instance;
    }
    async initialize() {
        await this.loadPlugins();
        await this.loadActivePlugins();
    }
    async shutdown() {
        // Cleanup plugins if needed
        this.plugins.clear();
        this.activePlugins.clear();
    }
    async loadPlugins() {
        const pluginsDir = path.join(__dirname, '../plugins');
        if (!fs.existsSync(pluginsDir)) {
            console.warn('Plugins directory not found - no plugins loaded');
            return;
        }
        const pluginTypes = fs.readdirSync(pluginsDir);
        for (const type of pluginTypes) {
            const typeDir = path.join(pluginsDir, type);
            if (!fs.statSync(typeDir).isDirectory())
                continue;
            const pluginNames = fs.readdirSync(typeDir);
            for (const name of pluginNames) {
                const pluginDir = path.join(typeDir, name);
                const pluginPath = path.join(pluginDir, 'index.ts');
                if (fs.existsSync(pluginPath)) {
                    try {
                        const pluginModule = await Promise.resolve(`${pluginPath}`).then(s => __importStar(require(s)));
                        const plugin = pluginModule.default || pluginModule;
                        if (this.validatePlugin(plugin)) {
                            this.plugins.set(`${type}-${name}`, plugin);
                            console.log(`✅ Plugin loaded: ${type}-${name} v${plugin.version}`);
                        }
                    }
                    catch (error) {
                        console.error(`❌ Failed to load plugin ${type}-${name}:`, error);
                    }
                }
            }
        }
    }
    validatePlugin(plugin) {
        return (plugin &&
            typeof plugin.id === 'string' &&
            typeof plugin.type === 'string' &&
            typeof plugin.version === 'string' &&
            typeof plugin.install === 'function' &&
            typeof plugin.enable === 'function' &&
            typeof plugin.disable === 'function' &&
            typeof plugin.execute === 'function');
    }
    async loadActivePlugins() {
        try {
            const plugins = await this.appwrite.databases.listDocuments(process.env.APPWRITE_DATABASE_ID || 'bigtechdb', 'plugins', ['status=enabled']);
            for (const plugin of plugins.documents) {
                if (!this.activePlugins.has(plugin.tenantId)) {
                    this.activePlugins.set(plugin.tenantId, new Set());
                }
                this.activePlugins.get(plugin.tenantId).add(plugin.$id);
            }
        }
        catch (error) {
            console.warn('Failed to load active plugins from database:', error);
        }
    }
    async getActivePlugins(tenantId) {
        const activePluginIds = this.activePlugins.get(tenantId) || new Set();
        const activePlugins = [];
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
    async executePlugin(pluginId, context) {
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
        }
        catch (error) {
            console.error(`Plugin ${pluginId} execution error:`, error);
            return {
                success: false,
                error: `Plugin execution failed: ${error.message}`
            };
        }
    }
    getAvailablePlugins() {
        return Array.from(this.plugins.values()).map(plugin => ({
            id: plugin.id,
            type: plugin.type,
            version: plugin.version
        }));
    }
}
exports.PluginLoader = PluginLoader;
exports.pluginLoader = PluginLoader.getInstance();
//# sourceMappingURL=pluginLoader.js.map