// WhatsApp Integration Types
// Created: 2025-01-11

export interface WhatsAppSettings {
  id: number;
  is_enabled: number; // 0 or 1
  is_connected: number; // 0 or 1
  phone_number: string | null;
  send_on_order_complete: number;
  send_on_order_ready: number;
  send_on_order_delivered: number;
  message_template_complete: string;
  message_template_ready: string;
  message_template_delivered: string;
  created_at: number;
  updated_at: number;
}

export interface WhatsAppAuth {
  id: number;
  session_data: string | null; // JSON string
  created_at: number;
  updated_at: number;
}

export interface WhatsAppMessageLog {
  id: number;
  order_id: number | null;
  dentist_id: number | null;
  phone_number: string;
  message_type: 'order_complete' | 'order_ready' | 'order_delivered' | 'custom';
  message_content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: number | null;
  created_at: number;
}

export interface WhatsAppConnectionStatus {
  isConnected: boolean;
  phoneNumber: string | null;
  qrCode: string | null; // Base64 QR code image
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'error';
  error: string | null;
}

export interface SendMessageRequest {
  phoneNumber: string;
  message: string;
  orderId?: number;
  dentistId?: number;
  messageType?: 'order_complete' | 'order_ready' | 'order_delivered' | 'custom';
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppSettingsUpdateDto {
  is_enabled?: number;
  send_on_order_complete?: number;
  send_on_order_ready?: number;
  send_on_order_delivered?: number;
  message_template_complete?: string;
  message_template_ready?: string;
  message_template_delivered?: string;
}