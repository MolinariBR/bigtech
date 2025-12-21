"use strict";
// Baseado em: 2.Architecture.md v1.0.1
// Precedência: 1.Project → 2.Architecture
// Decisão: Event Bus para comunicação desacoplada entre plugins e CORE
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const events_1 = require("events");
class EventBus {
    constructor() {
        this.handlers = new Map();
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(50); // Aumentar limite de listeners
    }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    async initialize() {
        // Configurações iniciais se necessário
        console.log('📡 Event Bus initialized');
    }
    async shutdown() {
        this.emitter.removeAllListeners();
        this.handlers.clear();
    }
    // Publicar evento
    async publish(event) {
        const fullEvent = {
            ...event,
            timestamp: new Date()
        };
        console.log(`📡 Event published: ${event.type} for tenant ${event.tenantId}`);
        // Emitir para todos os listeners registrados
        this.emitter.emit(event.type, fullEvent);
        // Também emitir para handlers específicos registrados
        const eventHandlers = this.handlers.get(event.type) || [];
        for (const handler of eventHandlers) {
            try {
                await handler(fullEvent);
            }
            catch (error) {
                console.error(`Event handler error for ${event.type}:`, error);
            }
        }
    }
    // Inscrever-se em eventos
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
        console.log(`👂 Handler subscribed to event: ${eventType}`);
    }
    // Cancelar inscrição
    unsubscribe(eventType, handler) {
        const eventHandlers = this.handlers.get(eventType);
        if (eventHandlers) {
            const index = eventHandlers.indexOf(handler);
            if (index > -1) {
                eventHandlers.splice(index, 1);
            }
        }
    }
    // Aguardar por um evento específico (útil para testes)
    async waitForEvent(eventType, tenantId, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout waiting for event ${eventType}`));
            }, timeout);
            const handler = (event) => {
                if (!tenantId || event.tenantId === tenantId) {
                    clearTimeout(timeoutId);
                    this.emitter.off(eventType, handler);
                    resolve(event);
                }
            };
            this.emitter.on(eventType, handler);
        });
    }
}
exports.EventBus = EventBus;
exports.eventBus = EventBus.getInstance();
//# sourceMappingURL=eventBus.js.map