// WhatsAppConnectionManager.ts
// Advanced connection management for WhatsApp
// Created: 2025-01-11

import { EventEmitter } from 'events';
import pino from 'pino';

export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'qr_ready' 
  | 'connected' 
  | 'reconnecting'
  | 'error';

export interface ConnectionEvent {
  state: ConnectionState;
  timestamp: number;
  error?: string;
  qrCode?: string;
  phoneNumber?: string;
}

export interface ReconnectOptions {
  maxAttempts: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export class WhatsAppConnectionManager extends EventEmitter {
  private currentState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private logger: pino.Logger;
  private reconnectOptions: ReconnectOptions = {
    maxAttempts: 5,
    initialDelay: 3000,
    maxDelay: 60000,
    backoffMultiplier: 2
  };
  private connectionHistory: ConnectionEvent[] = [];
  private maxHistorySize = 50;

  constructor(logger: pino.Logger, reconnectOptions?: Partial<ReconnectOptions>) {
    super();
    this.logger = logger;
    if (reconnectOptions) {
      this.reconnectOptions = { ...this.reconnectOptions, ...reconnectOptions };
    }
  }

  // ==================== State Management ====================

  setState(state: ConnectionState, data?: Partial<ConnectionEvent>): void {
    const previousState = this.currentState;
    this.currentState = state;

    const event: ConnectionEvent = {
      state,
      timestamp: Date.now(),
      ...data
    };

    // Add to history
    this.addToHistory(event);

    // Log state change
    this.logger.info({ from: previousState, to: state }, 'Connection state changed');

    // Emit event
    this.emit('stateChange', event);

    // Handle state-specific logic
    this.handleStateChange(state, previousState);
  }

  getState(): ConnectionState {
    return this.currentState;
  }

  isConnected(): boolean {
    return this.currentState === 'connected';
  }

  isConnecting(): boolean {
    return this.currentState === 'connecting' || this.currentState === 'reconnecting';
  }

  // ==================== Reconnection Logic ====================

  async scheduleReconnect(connectFn: () => Promise<void>): Promise<void> {
    // Clear any existing timer
    this.cancelReconnect();

    if (this.reconnectAttempts >= this.reconnectOptions.maxAttempts) {
      this.logger.error('Max reconnection attempts reached');
      this.setState('error', { 
        error: `Failed to reconnect after ${this.reconnectOptions.maxAttempts} attempts` 
      });
      this.reconnectAttempts = 0;
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectOptions.initialDelay * Math.pow(
        this.reconnectOptions.backoffMultiplier, 
        this.reconnectAttempts
      ),
      this.reconnectOptions.maxDelay
    );

    this.reconnectAttempts++;
    this.logger.info({ 
      attempt: this.reconnectAttempts, 
      delay, 
      maxAttempts: this.reconnectOptions.maxAttempts 
    }, 'Scheduling reconnection');

    this.setState('reconnecting');

    this.reconnectTimer = setTimeout(async () => {
      try {
        this.logger.info('Attempting to reconnect...');
        await connectFn();
        // Reset attempts on successful connection
        this.reconnectAttempts = 0;
      } catch (error) {
        this.logger.error({ error }, 'Reconnection attempt failed');
        // Schedule another attempt
        await this.scheduleReconnect(connectFn);
      }
    }, delay);
  }

  cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  resetReconnectAttempts(): void {
    this.reconnectAttempts = 0;
    this.cancelReconnect();
  }

  // ==================== Connection History ====================

  private addToHistory(event: ConnectionEvent): void {
    this.connectionHistory.push(event);
    
    // Keep only the last N events
    if (this.connectionHistory.length > this.maxHistorySize) {
      this.connectionHistory.shift();
    }
  }

  getConnectionHistory(): ConnectionEvent[] {
    return [...this.connectionHistory];
  }

  getLastConnectionEvent(): ConnectionEvent | null {
    return this.connectionHistory.length > 0 
      ? this.connectionHistory[this.connectionHistory.length - 1] 
      : null;
  }

  // ==================== Statistics ====================

  getConnectionStats(): {
    currentState: ConnectionState;
    reconnectAttempts: number;
    totalEvents: number;
    uptime: number | null;
    lastConnectedAt: number | null;
    lastDisconnectedAt: number | null;
  } {
    const connectedEvent = this.connectionHistory
      .slice()
      .reverse()
      .find(e => e.state === 'connected');
    
    const disconnectedEvent = this.connectionHistory
      .slice()
      .reverse()
      .find(e => e.state === 'disconnected');

    const uptime = connectedEvent && this.currentState === 'connected'
      ? Date.now() - connectedEvent.timestamp
      : null;

    return {
      currentState: this.currentState,
      reconnectAttempts: this.reconnectAttempts,
      totalEvents: this.connectionHistory.length,
      uptime,
      lastConnectedAt: connectedEvent?.timestamp || null,
      lastDisconnectedAt: disconnectedEvent?.timestamp || null
    };
  }

  // ==================== Event Handlers ====================

  private handleStateChange(newState: ConnectionState, oldState: ConnectionState): void {
    // Reset reconnect attempts on successful connection
    if (newState === 'connected') {
      this.resetReconnectAttempts();
    }

    // Cancel reconnect timer if manually disconnected
    if (newState === 'disconnected' && oldState !== 'reconnecting') {
      this.cancelReconnect();
    }
  }

  // ==================== Cleanup ====================

  destroy(): void {
    this.cancelReconnect();
    this.removeAllListeners();
    this.connectionHistory = [];
  }
}