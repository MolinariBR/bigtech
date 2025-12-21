interface EventData {
    tenantId: string;
    userId?: string;
    type: string;
    payload: any;
    timestamp: Date;
}
type EventHandler = (event: EventData) => void | Promise<void>;
export declare class EventBus {
    private static instance;
    private emitter;
    private handlers;
    private constructor();
    static getInstance(): EventBus;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    publish(event: Omit<EventData, 'timestamp'>): Promise<void>;
    subscribe(eventType: string, handler: EventHandler): void;
    unsubscribe(eventType: string, handler: EventHandler): void;
    waitForEvent(eventType: string, tenantId?: string, timeout?: number): Promise<EventData>;
}
export declare const eventBus: EventBus;
export {};
//# sourceMappingURL=eventBus.d.ts.map