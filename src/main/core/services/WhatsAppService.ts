// WhatsAppService.ts
// Core service for WhatsApp integration using Baileys
// Created: 2025-01-11

import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore - qrcode types not available
import * as QRCode from 'qrcode';
/* eslint-enable @typescript-eslint/ban-ts-comment */
import pino from 'pino';
import { join } from 'path';
import { app } from 'electron';
import { WhatsAppRepository } from '../repositories/WhatsAppRepository';
import { WhatsAppConnectionManager, type ConnectionEvent } from './WhatsAppConnectionManager';
import { PhoneValidator } from '../utils/phoneValidator';
import { RateLimiter } from '../utils/rateLimiter';
import type { 
  WhatsAppConnectionStatus, 
  SendMessageRequest, 
  SendMessageResponse 
} from '../../../shared/types/whatsapp.types';

export class WhatsAppService {
  private sock: WASocket | null = null;
  private repository: WhatsAppRepository;
  private authFolder: string;
  private logger: pino.Logger;
  private connectionManager: WhatsAppConnectionManager;
  private connectionStatus: WhatsAppConnectionStatus = {
    isConnected: false,
    phoneNumber: null,
    qrCode: null,
    status: 'disconnected',
    error: null
  };
  private qrCodeListeners: Set<(qr: string) => void> = new Set();
  private statusListeners: Set<(status: WhatsAppConnectionStatus) => void> = new Set();
  private isManualDisconnect = false;
  private rateLimiter: RateLimiter;

  constructor() {
    this.repository = new WhatsAppRepository();
    // Delay authFolder initialization until app is ready
    this.authFolder = '';
    this.logger = pino({ level: 'silent' }); // Silent in production, change to 'info' for debugging
    this.connectionManager = new WhatsAppConnectionManager(this.logger, {
      maxAttempts: 5,
      initialDelay: 3000,
      maxDelay: 60000,
      backoffMultiplier: 2
    });

    // Initialize rate limiter (20 messages per minute to avoid WhatsApp blocking)
    this.rateLimiter = new RateLimiter({
      maxRequests: 20,
      windowMs: 60000, // 1 minute
      blockDurationMs: 300000 // 5 minutes block if exceeded
    });

    // Listen to connection manager events
    this.connectionManager.on('stateChange', (event: ConnectionEvent) => {
      this.handleConnectionManagerStateChange(event);
    });
  }

  // ==================== Connection Management ====================

  /**
   * Initialize auth folder path (must be called after app is ready)
   */
  private initAuthFolder(): void {
    if (!this.authFolder) {
      this.authFolder = join(app.getPath('userData'), 'whatsapp-auth');
    }
  }

  /**
   * Initialize WhatsApp connection on app startup
   * This will automatically restore the session if auth files exist
   */
  async initialize(): Promise<void> {
    this.initAuthFolder();
    console.log('WhatsApp: Initializing...');
    
    try {
      // Check if we have saved auth state
      const settings = await this.repository.getSettings();
      
      // Only auto-connect if explicitly enabled AND was previously connected
      if (settings && settings.is_enabled && settings.is_connected && settings.phone_number) {
        console.log('WhatsApp: Found previous active session, attempting to restore...');
        try {
          await this.connect();
        } catch (error) {
          console.error('WhatsApp: Auto-restore failed, user needs to reconnect manually', error);
          // Clear the connection status but keep auth for manual retry
          await this.repository.setConnectionStatus(false, null);
          this.updateStatus({
            status: 'disconnected',
            isConnected: false,
            phoneNumber: null,
            qrCode: null,
            error: 'فشلت استعادة الجلسة. يرجى الاتصال يدوياً من الإعدادات.'
          });
        }
      } else {
        console.log('WhatsApp: No active session or not enabled, waiting for manual connection');
        this.updateStatus({
          status: 'disconnected',
          isConnected: false,
          phoneNumber: null,
          qrCode: null,
          error: null
        });
      }
    } catch (error) {
      console.error('WhatsApp: Failed to initialize', error);
      this.logger.error({ error }, 'Failed to initialize WhatsApp');
      // Don't throw - initialization failure shouldn't crash the app
    }
  }

  async connect(): Promise<void> {
    console.log('WhatsApp: Starting connection...');
    if (this.sock) {
      console.log('WhatsApp: Already connected or connecting');
      throw new Error('WhatsApp already connected or connecting');
    }

    this.isManualDisconnect = false;
    this.connectionManager.setState('connecting');

    try {
      await this.performConnection();
    } catch (error) {
      console.error('WhatsApp: Failed to connect', error);
      this.logger.error({ error }, 'Failed to connect to WhatsApp');
      this.connectionManager.setState('error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  private async performConnection(): Promise<void> {
    try {
      console.log('WhatsApp: Performing connection...');
      this.updateStatus({ status: 'connecting', error: null });

      console.log('WhatsApp: Auth folder:', this.authFolder);
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      // Use a stable WhatsApp version to avoid 405 errors
      // This version is known to work reliably
      const STABLE_WHATSAPP_VERSION: [number, number, number] = [2, 3000, 1027934701];
      console.log('WhatsApp: Using stable version:', STABLE_WHATSAPP_VERSION.join('.'));

      console.log('WhatsApp: Creating socket...');
      this.sock = makeWASocket({
        version: STABLE_WHATSAPP_VERSION,
        auth: state,
        printQRInTerminal: false,
        logger: this.logger,
        browser: ['Dental Lab Manager', 'Desktop', '1.0.0'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined, // Prevent message history sync
      });

      console.log('WhatsApp: Socket created, setting up event listeners...');

      // Handle QR code
      this.sock.ev.on('connection.update', async (update) => {
        console.log('WhatsApp: Connection update received', { 
          hasQR: !!update.qr, 
          connection: update.connection,
          lastDisconnect: update.lastDisconnect 
        });
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('WhatsApp: QR code received, generating data URL...');
          try {
            const qrCodeDataUrl = await QRCode.toDataURL(qr, {
              width: 400,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            console.log('WhatsApp: QR code generated successfully');
            this.updateStatus({ 
              status: 'qr_ready', 
              qrCode: qrCodeDataUrl,
              error: null 
            });
            this.notifyQRCode(qrCodeDataUrl);
          } catch (error) {
            console.error('WhatsApp: Failed to generate QR code', error);
            this.logger.error({ error }, 'Failed to generate QR code');
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const errorData = (lastDisconnect?.error as Boom)?.data;
          console.log('WhatsApp: Connection closed', { 
            statusCode, 
            errorData,
            error: lastDisconnect?.error,
            isManualDisconnect: this.isManualDisconnect 
          });
          
          this.sock = null;

          // Handle error 405 - version mismatch or auth issue
          if (statusCode === 405) {
            console.log('WhatsApp: Error 405 detected - clearing auth and stopping reconnection');
            await this.clearAuthFolder();
            await this.repository.clearAuth();
            await this.repository.setConnectionStatus(false, null);
            
            this.connectionManager.cancelReconnect();
            this.connectionManager.setState('error');
            this.updateStatus({ 
              status: 'error',
              isConnected: false,
              phoneNumber: null,
              qrCode: null,
              error: 'فشل الاتصال. الرجاء الضغط على "إعادة تعيين الاتصال" ثم "الاتصال بـ WhatsApp" من جديد.'
            });
            return;
          }

          // Handle error 515 - Stream error (temporary, can reconnect)
          if (statusCode === 515) {
            console.log('WhatsApp: Error 515 detected - stream error, will retry');
            if (!this.isManualDisconnect) {
              console.log('WhatsApp: Scheduling reconnect for stream error...');
              await this.connectionManager.scheduleReconnect(() => this.performConnection());
            }
            return;
          }

          const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !this.isManualDisconnect;

          if (statusCode === DisconnectReason.loggedOut) {
            console.log('WhatsApp: Logged out, clearing auth');
            this.logger.info('Connection closed, logged out');
            await this.clearAuthFolder();
            await this.repository.clearAuth();
            await this.repository.setConnectionStatus(false, null);
            this.connectionManager.setState('disconnected');
            this.updateStatus({ 
              status: 'disconnected', 
              isConnected: false,
              phoneNumber: null,
              qrCode: null,
              error: null 
            });
          } else if (shouldReconnect) {
            console.log('WhatsApp: Scheduling reconnect...');
            this.logger.info('Connection closed unexpectedly, scheduling reconnect...');
            await this.connectionManager.scheduleReconnect(() => this.performConnection());
          } else {
            console.log('WhatsApp: Manual disconnect or other reason');
            this.logger.info('Connection closed manually');
            this.connectionManager.setState('disconnected');
            this.updateStatus({ 
              status: 'disconnected', 
              isConnected: false,
              phoneNumber: null,
              qrCode: null,
              error: null 
            });
          }
        } else if (connection === 'open') {
          this.logger.info('WhatsApp connected successfully');
          const phoneNumber = this.sock?.user?.id?.split(':')[0] || null;
          
          // Update both is_connected and is_enabled when successfully connected
          await this.repository.setConnectionStatus(true, phoneNumber);
          this.connectionManager.setState('connected', { phoneNumber });
          this.updateStatus({ 
            status: 'connected', 
            isConnected: true,
            phoneNumber,
            qrCode: null,
            error: null 
          });
          
          console.log('WhatsApp: Connected successfully, notifications enabled', { phoneNumber });
        }
      });

      // Save credentials on update
      this.sock.ev.on('creds.update', saveCreds);

    } catch (error) {
      this.logger.error({ error }, 'Failed to perform connection');
      throw error;
    }
  }

  private async clearAuthFolder(): Promise<void> {
    this.initAuthFolder();
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const authFiles = await fs.readdir(this.authFolder).catch((): string[] => []);
      for (const file of authFiles) {
        await fs.unlink(path.join(this.authFolder, file)).catch(() => {
          // Ignore errors
        });
      }
      console.log('WhatsApp: Auth folder cleared successfully');
    } catch (error) {
      console.error('WhatsApp: Error clearing auth folder', error);
    }
  }

  async disconnect(): Promise<void> {
    console.log('WhatsApp: Disconnecting...');
    this.isManualDisconnect = true;
    this.connectionManager.cancelReconnect();
    
    if (this.sock) {
      try {
        // Close connection without logging out to preserve session
        await this.sock.end(undefined);
      } catch (error) {
        console.error('WhatsApp: Error during disconnect', error);
      }
      this.sock = null;
    }
    
    // Update connection status but keep auth for reconnection
    await this.repository.setConnectionStatus(false, null);
    
    this.connectionManager.setState('disconnected');
    this.updateStatus({ 
      status: 'disconnected', 
      isConnected: false,
      phoneNumber: null,
      qrCode: null,
      error: null 
    });
    console.log('WhatsApp: Disconnected successfully (session preserved)');
  }

  /**
   * Completely reset WhatsApp connection and clear all auth data
   * Use this when you want to force a new QR code login
   */
  async resetConnection(): Promise<void> {
    console.log('WhatsApp: Resetting connection completely...');
    
    this.isManualDisconnect = true;
    this.connectionManager.cancelReconnect();
    
    // Logout and close socket if connected
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (error) {
        console.error('WhatsApp: Error during logout', error);
      }
      this.sock = null;
    }
    
    // Clear all auth data completely
    await this.repository.clearAuth();
    await this.clearAuthFolder();
    await this.repository.setConnectionStatus(false, null);
    
    // Reset connection manager
    this.connectionManager.resetReconnectAttempts();
    this.connectionManager.setState('disconnected');
    
    this.updateStatus({ 
      status: 'disconnected', 
      isConnected: false,
      phoneNumber: null,
      qrCode: null,
      error: null 
    });
    
    console.log('WhatsApp: Connection reset successfully - ready for fresh connection');
  }

  getConnectionStatus(): WhatsAppConnectionStatus {
    return { ...this.connectionStatus };
  }

  isConnected(): boolean {
    return this.sock !== null && this.connectionStatus.isConnected;
  }

  // ==================== Message Sending ====================

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.isConnected() || !this.sock) {
      return {
        success: false,
        error: 'WhatsApp غير متصل'
      };
    }

    try {
      // Validate phone number
      const validation = PhoneValidator.validate(request.phoneNumber);
      
      if (!validation.isValid || !validation.formatted) {
        return {
          success: false,
          error: validation.error || 'رقم الهاتف غير صالح'
        };
      }

      // Check rate limit
      const rateLimit = this.rateLimiter.check(validation.formatted);
      if (!rateLimit.allowed) {
        this.logger.warn({ phone: validation.formatted, retryAfter: rateLimit.retryAfter }, 'Rate limit exceeded');
        return {
          success: false,
          error: `تم تجاوز الحد المسموح. حاول مرة أخرى بعد ${rateLimit.retryAfter} ثانية`
        };
      }

      // Create JID (WhatsApp ID)
      const jid = `${validation.formatted}@s.whatsapp.net`;

      // Check if number exists on WhatsApp
      const [exists] = await this.sock.onWhatsApp(jid);
      if (!exists) {
        return {
          success: false,
          error: 'رقم الهاتف غير مسجل على WhatsApp'
        };
      }

      // Record rate limit
      this.rateLimiter.record(validation.formatted);

      // Send message
      const sentMessage = await this.sock.sendMessage(jid, { 
        text: request.message 
      });

      // Log the message with formatted phone
      await this.repository.logMessage({
        order_id: request.orderId || null,
        dentist_id: request.dentistId || null,
        phone_number: validation.formatted,
        message_type: request.messageType || 'custom',
        message_content: request.message,
        status: 'sent',
        error_message: null,
        sent_at: Math.floor(Date.now() / 1000)
      });

      return {
        success: true,
        messageId: sentMessage.key.id
      };

    } catch (error) {
      this.logger.error({ error }, 'Failed to send WhatsApp message');
      
      // Log failed message
      await this.repository.logMessage({
        order_id: request.orderId || null,
        dentist_id: request.dentistId || null,
        phone_number: request.phoneNumber,
        message_type: request.messageType || 'custom',
        message_content: request.message,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        sent_at: null
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  // ==================== Utility Methods ====================

  getRateLimiterStats() {
    return this.rateLimiter.getStats();
  }

  resetRateLimit(phoneNumber?: string) {
    if (phoneNumber) {
      const validation = PhoneValidator.validate(phoneNumber);
      if (validation.formatted) {
        this.rateLimiter.reset(validation.formatted);
      }
    } else {
      this.rateLimiter.resetAll();
    }
  }

  private updateStatus(updates: Partial<WhatsAppConnectionStatus>): void {
    this.connectionStatus = { ...this.connectionStatus, ...updates };
    this.notifyStatusListeners();
  }

  private notifyQRCode(qrCode: string): void {
    this.qrCodeListeners.forEach(listener => listener(qrCode));
  }

  private notifyStatusListeners(): void {
    this.statusListeners.forEach(listener => listener(this.connectionStatus));
  }

  // ==================== Connection Manager Integration ====================

  private handleConnectionManagerStateChange(event: ConnectionEvent): void {
    // Update status based on connection manager state
    const statusMap: Record<string, WhatsAppConnectionStatus['status']> = {
      'disconnected': 'disconnected',
      'connecting': 'connecting',
      'reconnecting': 'connecting',
      'qr_ready': 'qr_ready',
      'connected': 'connected',
      'error': 'error'
    };

    const status = statusMap[event.state] || 'disconnected';
    
    this.updateStatus({
      status,
      error: event.error || null,
      qrCode: event.qrCode || null,
      phoneNumber: event.phoneNumber || null
    });
  }

  getConnectionStats() {
    return this.connectionManager.getConnectionStats();
  }

  getConnectionHistory() {
    return this.connectionManager.getConnectionHistory();
  }

  // ==================== Event Listeners ====================

  onQRCode(listener: (qr: string) => void): () => void {
    this.qrCodeListeners.add(listener);
    return () => this.qrCodeListeners.delete(listener);
  }

  onStatusChange(listener: (status: WhatsAppConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  // ==================== Settings ====================

  async getSettings() {
    return this.repository.getSettings();
  }

  async updateSettings(updates: any) {
    return this.repository.updateSettings(updates);
  }

  async getMessageLogs(limit?: number, offset?: number) {
    return this.repository.getMessageLogs(limit, offset);
  }
}

// Singleton instance
let whatsAppServiceInstance: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!whatsAppServiceInstance) {
    whatsAppServiceInstance = new WhatsAppService();
  }
  return whatsAppServiceInstance;
}