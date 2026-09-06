export interface MarketTick {
  symbol: string;
  price: number;
  prevPrice?: number;
  priceDelta: number;
  timestamp?: string;
  [key: string]: any;
}

export type TickListener = (tick: MarketTick) => void;

/**
 * SSE MarketStreamClient managing real-time tick streaming with exponential backoff
 * reconnection and leak-free disconnect/unmount cleanup.
 */
export class MarketStreamClient {
  private endpoint: string;
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private previousPrices: Map<string, number> = new Map();
  private listeners: Set<TickListener> = new Set();
  public isConnected = false;

  constructor(endpoint = "/api/v1/stream/ticks") {
    this.endpoint = endpoint;
  }

  connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    try {
      this.eventSource = new EventSource(this.endpoint);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
      };

      this.eventSource.addEventListener("tick", (e: MessageEvent) => {
        try {
          const tick = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          this.handleTick(tick);
        } catch {
          // Ignore tick JSON parsing errors
        }
      });

      this.eventSource.addEventListener("ping", () => {
        // Keep-alive ping
      });

      this.eventSource.onerror = () => {
        this.isConnected = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        const delay = Math.min(
          1000 * Math.pow(1.5, this.reconnectAttempts),
          this.maxReconnectDelay
        );
        this.reconnectAttempts++;

        this.reconnectTimer = setTimeout(() => {
          this.connect();
        }, delay);
      };
    } catch {
      // EventSource instantiation error
    }
  }

  handleTick(tick: any): void {
    if (!tick || !tick.symbol || typeof tick.price !== "number") return;
    const sym = tick.symbol;
    const prevPrice = this.previousPrices.get(sym);
    this.previousPrices.set(sym, tick.price);

    const priceDelta = prevPrice !== undefined ? tick.price - prevPrice : 0;
    const enrichedTick: MarketTick = {
      ...tick,
      prevPrice,
      priceDelta,
    };

    for (const listener of this.listeners) {
      listener(enrichedTick);
    }
  }

  subscribe(listener: TickListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }
}

export const marketStream = new MarketStreamClient();
