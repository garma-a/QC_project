import { fetchEventSource } from '@microsoft/fetch-event-source';
import { API_BASE_URL } from '@/lib/api/clientFetch';
import { useAuthStore } from '@/store/useAuthStore';

type EventHandler = (event: { entity: string; type: string; data?: unknown }) => void;

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

class SSEClient {
  private controller: AbortController | null = null;
  private handler: EventHandler | null = null;
  private token: string | null = null;
  private backoff = INITIAL_BACKOFF_MS;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private visibilityHandler: (() => void) | null = null;

  connect(token: string, handler: EventHandler) {
    if (this.controller && this.token === token) return;

    this.disconnect();
    this.token = token;
    this.handler = handler;
    this.stopped = false;
    this.backoff = INITIAL_BACKOFF_MS;
    this.startConnection();
    this.attachVisibilityListener();
  }

  disconnect() {
    this.stopped = true;
    this.controller?.abort();
    this.controller = null;
    this.token = null;
    this.handler = null;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.detachVisibilityListener();
  }

  private startConnection() {
    if (this.stopped || !this.token || !this.handler) return;

    this.controller?.abort();
    this.controller = new AbortController();
    const currentToken = this.token;
    const handler = this.handler;

    fetchEventSource(`${API_BASE_URL}/api/v1/events/stream`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${currentToken}`,
        Accept: 'text/event-stream',
      },
      signal: this.controller.signal,
      openWhenHidden: false,
      onopen: async (response) => {
        if (response.ok) {
          this.backoff = INITIAL_BACKOFF_MS;
          return;
        }
        if (response.status === 401) {
          this.stopped = true;
          useAuthStore.getState().clearAuth();
          throw new Error('Unauthorized');
        }
        throw new Error(`SSE open failed: ${response.status}`);
      },
      onmessage: (msg) => {
        if (!msg.data || this.stopped) return;
        try {
          const parsed = JSON.parse(msg.data);
          if (parsed.type === 'heartbeat') return;
          handler(parsed);
        } catch {
          // Ignore malformed messages
        }
      },
      onerror: (err) => {
        if (this.stopped) throw err;
        if (err instanceof DOMException && err.name === 'AbortError') throw err;

        this.scheduleReconnect();
        throw err;
      },
      onclose: () => {
        if (!this.stopped) {
          this.scheduleReconnect();
        }
      },
    }).catch(() => {
      // Connection ended — reconnect is scheduled via onerror/onclose
    });
  }

  private scheduleReconnect() {
    if (this.stopped || this.retryTimer) return;

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.startConnection();
    }, this.backoff);

    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
  }

  private attachVisibilityListener() {
    if (typeof document === 'undefined') return;

    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden') {
        this.controller?.abort();
        this.controller = null;
        if (this.retryTimer) {
          clearTimeout(this.retryTimer);
          this.retryTimer = null;
        }
      } else if (!this.stopped && this.token) {
        this.backoff = INITIAL_BACKOFF_MS;
        this.startConnection();
      }
    };

    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private detachVisibilityListener() {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
  }
}

export const sseClient = new SSEClient();
