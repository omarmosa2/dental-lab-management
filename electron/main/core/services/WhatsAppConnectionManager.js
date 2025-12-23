"use strict";
// WhatsAppConnectionManager.ts
// Advanced connection management for WhatsApp
// Created: 2025-01-11
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppConnectionManager = void 0;
const events_1 = require("events");
class WhatsAppConnectionManager extends events_1.EventEmitter {
    constructor(logger, reconnectOptions) {
        super();
        this.currentState = 'disconnected';
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.reconnectOptions = {
            maxAttempts: 5,
            initialDelay: 3000,
            maxDelay: 60000,
            backoffMultiplier: 2
        };
        this.connectionHistory = [];
        this.maxHistorySize = 50;
        this.logger = logger;
        if (reconnectOptions) {
            this.reconnectOptions = { ...this.reconnectOptions, ...reconnectOptions };
        }
    }
    // ==================== State Management ====================
    setState(state, data) {
        const previousState = this.currentState;
        this.currentState = state;
        const event = {
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
    getState() {
        return this.currentState;
    }
    isConnected() {
        return this.currentState === 'connected';
    }
    isConnecting() {
        return this.currentState === 'connecting' || this.currentState === 'reconnecting';
    }
    // ==================== Reconnection Logic ====================
    async scheduleReconnect(connectFn) {
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
        const delay = Math.min(this.reconnectOptions.initialDelay * Math.pow(this.reconnectOptions.backoffMultiplier, this.reconnectAttempts), this.reconnectOptions.maxDelay);
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
            }
            catch (error) {
                this.logger.error({ error }, 'Reconnection attempt failed');
                // Schedule another attempt
                await this.scheduleReconnect(connectFn);
            }
        }, delay);
    }
    cancelReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    resetReconnectAttempts() {
        this.reconnectAttempts = 0;
        this.cancelReconnect();
    }
    // ==================== Connection History ====================
    addToHistory(event) {
        this.connectionHistory.push(event);
        // Keep only the last N events
        if (this.connectionHistory.length > this.maxHistorySize) {
            this.connectionHistory.shift();
        }
    }
    getConnectionHistory() {
        return [...this.connectionHistory];
    }
    getLastConnectionEvent() {
        return this.connectionHistory.length > 0
            ? this.connectionHistory[this.connectionHistory.length - 1]
            : null;
    }
    // ==================== Statistics ====================
    getConnectionStats() {
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
    handleStateChange(newState, oldState) {
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
    destroy() {
        this.cancelReconnect();
        this.removeAllListeners();
        this.connectionHistory = [];
    }
}
exports.WhatsAppConnectionManager = WhatsAppConnectionManager;
