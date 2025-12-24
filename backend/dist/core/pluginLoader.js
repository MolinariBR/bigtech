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
const audit_1 = require("./audit");
const billingEngine_1 = require("./billingEngine");
const eventBus_1 = require("./eventBus");
class PluginLoader {
    static instance;
    appwrite = appwrite_1.AppwriteService.getInstance();
    plugins = new Map();
    activePlugins = new Map(); // tenantId -> Set<pluginIds>
    constructor() { }
    static getInstance() {
        if (!PluginLoader.instance) {
            PluginLoader.instance = new PluginLoader();
        }
        return PluginLoader.instance;
    }
    async initialize() {
        // Inicializar sistemas CORE necessários
        await audit_1.auditLogger.initialize();
        await billingEngine_1.billingEngine.initialize();
        await eventBus_1.eventBus.initialize();
        await this.loadPlugins();
        await this.loadActivePlugins();
        // Para desenvolvimento: ativar plugin infosimples por padrão
        this.activePlugins.set('default', new Set(['infosimples', 'bigtech']));
        console.log('✅ Plugins infosimples e bigtech ativados por padrão para tenant default');
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
        console.log('🔍 Found plugin types:', pluginTypes);
        for (const type of pluginTypes) {
            const typeDir = path.join(pluginsDir, type);
            if (!fs.statSync(typeDir).isDirectory())
                continue;
            const pluginNames = fs.readdirSync(typeDir);
            console.log(`🔍 Found plugins in ${type}:`, pluginNames);
            for (const name of pluginNames) {
                const pluginDir = path.join(typeDir, name);
                const pluginPath = path.join(pluginDir, 'index.ts');
                console.log(`🔍 Checking plugin path: ${pluginPath}`);
                if (fs.existsSync(pluginPath)) {
                    try {
                        console.log(`🔄 Importing plugin: ${type}-${name}`);
                        const pluginModule = await Promise.resolve(`${pluginPath}`).then(s => __importStar(require(s)));
                        let plugin = pluginModule.default || pluginModule;
                        // If it's a class constructor, instantiate it
                        if (typeof plugin === 'function' && plugin.prototype && plugin.prototype.constructor === plugin) {
                            plugin = new plugin();
                        }
                        if (this.validatePlugin(plugin)) {
                            this.plugins.set(`${type}-${name}`, plugin);
                            console.log(`✅ Plugin loaded: ${type}-${name} v${plugin.version}`);
                        }
                        else {
                            console.log(`❌ Plugin validation failed: ${type}-${name}`);
                        }
                        if (this.validatePlugin(plugin)) {
                            this.plugins.set(`${type}-${name}`, plugin);
                            console.log(`✅ Plugin loaded: ${type}-${name} v${plugin.version}`);
                        }
                        else {
                            console.log(`❌ Plugin validation failed: ${type}-${name}`);
                        }
                    }
                    catch (error) {
                        console.error(`❌ Failed to load plugin ${type}-${name}:`, error);
                    }
                }
                else {
                    console.log(`❌ Plugin index.ts not found: ${pluginPath}`);
                }
            }
        }
    }
    validatePlugin(plugin) {
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
    async loadActivePlugins() {
        try {
            // TODO: Implementar carregamento de plugins ativos do Appwrite quando estiver configurado
            console.log('[DEV] Skipping active plugins load from database');
        }
        catch (error) {
            console.warn('Failed to load active plugins from database:', error);
        }
    }
    async getActivePlugins(tenantId) {
        const activePluginIds = this.activePlugins.get(tenantId) || new Set();
        const activePlugins = [];
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
    async executePlugin(pluginId, context) {
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
        const startTime = Date.now();
        let result;
        try {
            result = await plugin.execute(context);
            // Auditoria automática para todas as operações
            await audit_1.auditLogger.log({
                tenantId: context.tenantId,
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
                await eventBus_1.eventBus.publish({
                    tenantId: context.tenantId,
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
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            // Auditoria para falhas também
            await audit_1.auditLogger.log({
                tenantId: context.tenantId,
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
    getAvailablePlugins() {
        return Array.from(this.plugins.values()).map(plugin => ({
            id: plugin.id,
            type: plugin.type,
            version: plugin.version
        }));
    }
    getActivePluginsForTenant(tenantId) {
        return this.activePlugins.get(tenantId) || new Set();
    }
    getPlugin(pluginId) {
        // Primeiro tentar chave direta (ex: 'consulta-infosimples')
        const byKey = this.plugins.get(pluginId);
        if (byKey)
            return byKey;
        // Fallback: procurar pela propriedade `id` do plugin (ex: 'infosimples')
        return Array.from(this.plugins.values()).find(p => p.id === pluginId);
    }
    // Sanitizar dados para auditoria (remover dados sensíveis)
    sanitizeAuditData(data) {
        if (!data || typeof data !== 'object')
            return data;
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
    extractConsultaId(input) {
        // Para plugins de consulta, o input pode conter um consultaId
        return input?.consultaId || input?.id;
    }
}
exports.PluginLoader = PluginLoader;
exports.pluginLoader = PluginLoader.getInstance();
//# sourceMappingURL=pluginLoader.js.map