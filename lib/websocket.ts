// Since Vercel doesn't support WebSockets directly, we need to use:
// Option 1: Pusher Channels
// Option 2: Ably
// Option 3: Direct connection to Cloud Run WebSocket endpoint

export class WorkspaceConnection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  constructor(
    private workspaceUrl: string,
    private sessionToken: string,
    private callbacks: {
      onOpen?: () => void;
      onMessage?: (data: any) => void;
      onError?: (error: Event) => void;
      onClose?: () => void;
    }
  ) {}
  
  connect() {
    // Connect directly to Cloud Run WebSocket endpoint
    // This bypasses Vercel and connects directly to your workspace
    const wsUrl = `${this.workspaceUrl}/ws?token=${this.sessionToken}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('Connected to workspace');
      this.reconnectAttempts = 0;
      this.callbacks.onOpen?.();
    };
    
    this.ws.onmessage = (event) => {
      this.callbacks.onMessage?.(event.data);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError?.(error);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from workspace');
      this.callbacks.onClose?.();
      this.attemptReconnect();
    };
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
    }
  }
  
  send(data: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }
  
  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}