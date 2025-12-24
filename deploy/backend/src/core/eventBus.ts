// Baseado em: 2.Architecture.md v1.0.1
// Precedência: 1.Project → 2.Architecture
// Decisão: Event Bus para comunicação desacoplada entre plugins e CORE

import { EventEmitter } from 'events';

interface EventData {
  tenantId: string;
  userId?: string;
  type: string;
  payload: any;
  timestamp: Date;
}

type EventHandler = (event: EventData) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;
  private handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50); // Aumentar limite de listeners
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async initialize(): Promise<void> {
    // Configurações iniciais se necessário
    console.log('📡 Event Bus initialized');
  }

  async shutdown(): Promise<void> {
    this.emitter.removeAllListeners();
    this.handlers.clear();
  }

  // Publicar evento
  async publish(event: Omit<EventData, 'timestamp'>): Promise<void> {
    const fullEvent: EventData = {
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
      } catch (error) {
        console.error(`Event handler error for ${event.type}:`, error);
      }
    }
  }

  // Inscrever-se em eventos
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);

    console.log(`👂 Handler subscribed to event: ${eventType}`);
  }

  // Cancelar inscrição
  unsubscribe(eventType: string, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      const index = eventHandlers.indexOf(handler);
      if (index > -1) {
        eventHandlers.splice(index, 1);
      }
    }
  }

  // Aguardar por um evento específico (útil para testes)
  async waitForEvent(
    eventType: string,
    tenantId?: string,
    timeout = 5000
  ): Promise<EventData> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for event ${eventType}`));
      }, timeout);

      const handler = (event: EventData) => {
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

export const eventBus = EventBus.getInstance();