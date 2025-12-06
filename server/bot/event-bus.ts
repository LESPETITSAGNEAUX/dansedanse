
import { EventEmitter } from "events";
// Redis import commenté pour mode dégradé
// import Redis from "ioredis";

export type EventType =
  | "vision.state_detected"
  | "vision.ocr_completed"
  | "gto.request"
  | "gto.response"
  | "action.queued"
  | "action.executed"
  | "ui.update"
  | "platform.window_detected"
  | "platform.connection_change"
  | "session.state_change";

export interface BusEvent {
  id: string;
  type: EventType;
  timestamp: number;
  payload: any;
  metadata?: {
    tableId?: string;
    windowHandle?: number;
    accountId?: string;
    priority?: number;
  };
}

export class EventBus extends EventEmitter {
  private eventHandlers: Map<EventType, Array<(event: BusEvent) => Promise<void>>> = new Map();
  private isConsuming = false;
  private consumerId: string;

  constructor(redisUrl?: string) {
    super();
    this.consumerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[EventBus] Mode dégradé activé (sans Redis)`);
  }

  async initialize(): Promise<void> {
    console.log(`[EventBus] Initialisé en mode local`);
  }

  async publish(type: EventType, payload: any, metadata?: BusEvent["metadata"]): Promise<string> {
    const event: BusEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      payload,
      metadata,
    };

    // En mode local, traiter immédiatement
    const handlers = this.eventHandlers.get(type) || [];
    await Promise.all(
      handlers.map(handler => 
        handler(event).catch(err => 
          console.error(`[EventBus] Handler error for ${type}:`, err)
        )
      )
    );

    this.emit("published", event);
    return event.id;
  }

  on(type: EventType, handler: (event: BusEvent) => Promise<void>): this {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type)!.push(handler);
    return this;
  }

  async startConsuming(): Promise<void> {
    this.isConsuming = true;
    console.log(`[EventBus] Mode local - pas de consumer Redis`);
  }

  async stopConsuming(): Promise<void> {
    this.isConsuming = false;
    console.log(`[EventBus] Consumer stopped: ${this.consumerId}`);
  }

  async getStreamInfo(): Promise<any> {
    return { mode: "local", handlers: this.eventHandlers.size };
  }

  async getPendingCount(): Promise<number> {
    return 0;
  }

  async trimStream(maxLength: number = 10000): Promise<void> {
    // No-op en mode local
  }

  async disconnect(): Promise<void> {
    await this.stopConsuming();
  }
}

let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export async function initializeEventBus(): Promise<EventBus> {
  const bus = getEventBus();
  await bus.initialize();
  return bus;
}
