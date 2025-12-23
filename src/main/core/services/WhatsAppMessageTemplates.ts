// WhatsAppMessageTemplates.ts
// Message templates for WhatsApp notifications
// Created: 2025-01-11

import type { Order, Dentist } from '../../../shared/types/api.types';

export interface TemplateVariables {
  dentist_name?: string;
  order_number?: string;
  case_type?: string;
  tooth_numbers?: string;
  material?: string;
  finish_type?: string;
  quantity?: number;
  price?: number;
  date_received?: string;
  date_due?: string;
  date_delivered?: string;
  notes?: string;
  remaining_amount?: number;
  new_due_date?: string;
}

export class WhatsAppMessageTemplates {
  // ==================== Default Templates ====================

  static readonly DEFAULT_TEMPLATES = {
    order_complete: 'مرحباً د. {dentist_name}، تم إكمال الطلب رقم {order_number} بنجاح.\n\nالتفاصيل:\n• نوع العمل: {case_type}\n• الأسنان: {tooth_numbers}\n• المادة: {material}\n\nشكراً لثقتكم.',
    
    order_ready: 'مرحباً د. {dentist_name}، الطلب رقم {order_number} جاهز للاستلام.\n\nيمكنكم المرور لاستلامه في أي وقت.\n\nشكراً.',
    
    order_delivered: 'مرحباً د. {dentist_name}، تم تسليم الطلب رقم {order_number} بنجاح.\n\nنتمنى لكم التوفيق.\n\nشكراً لثقتكم.',
    
    payment_reminder: 'مرحباً د. {dentist_name}، تذكير بالدفعة المتبقية للطلب رقم {order_number}.\n\nالمبلغ المتبقي: {remaining_amount} ل.س\n\nشكراً لتعاونكم.',
    
    order_delayed: 'مرحباً د. {dentist_name}، نعتذر عن التأخير في الطلب رقم {order_number}.\n\nالموعد الجديد: {new_due_date}\n\nنعتذر عن أي إزعاج.',
  };

  // ==================== Template Processing ====================

  static processTemplate(template: string, variables: TemplateVariables): string {
    let message = template;

    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      const replacement = value !== undefined && value !== null ? String(value) : '';
      message = message.replace(new RegExp(placeholder, 'g'), replacement);
    });

    // Clean up any remaining placeholders
    message = message.replace(/\{[^}]+\}/g, '');

    return message.trim();
  }

  // ==================== Order-based Templates ====================

  static createOrderCompleteMessage(order: Order, dentist: Dentist, customTemplate?: string): string {
    const template = customTemplate || this.DEFAULT_TEMPLATES.order_complete;
    
    const variables: TemplateVariables = {
      dentist_name: dentist.name,
      order_number: order.order_number,
      case_type: order.case_type,
      tooth_numbers: Array.isArray(order.tooth_numbers) 
        ? order.tooth_numbers.join(', ') 
        : order.tooth_numbers,
      material: order.main_material,
      finish_type: order.finish_type,
      quantity: order.quantity,
      price: order.price,
    };

    return this.processTemplate(template, variables);
  }

  static createOrderReadyMessage(order: Order, dentist: Dentist, customTemplate?: string): string {
    const template = customTemplate || this.DEFAULT_TEMPLATES.order_ready;
    
    const variables: TemplateVariables = {
      dentist_name: dentist.name,
      order_number: order.order_number,
      case_type: order.case_type,
      tooth_numbers: Array.isArray(order.tooth_numbers) 
        ? order.tooth_numbers.join(', ') 
        : order.tooth_numbers,
    };

    return this.processTemplate(template, variables);
  }

  static createOrderDeliveredMessage(order: Order, dentist: Dentist, customTemplate?: string): string {
    const template = customTemplate || this.DEFAULT_TEMPLATES.order_delivered;
    
    const variables: TemplateVariables = {
      dentist_name: dentist.name,
      order_number: order.order_number,
      case_type: order.case_type,
      date_delivered: order.date_delivered 
        ? new Date(order.date_delivered * 1000).toLocaleDateString('ar-SY')
        : '',
    };

    return this.processTemplate(template, variables);
  }

  static createPaymentReminderMessage(
    order: Order, 
    dentist: Dentist, 
    remainingAmount: number,
    customTemplate?: string
  ): string {
    const template = customTemplate || this.DEFAULT_TEMPLATES.payment_reminder;
    
    const variables: TemplateVariables = {
      dentist_name: dentist.name,
      order_number: order.order_number,
      remaining_amount: remainingAmount,
    };

    return this.processTemplate(template, variables);
  }

  static createOrderDelayedMessage(
    order: Order, 
    dentist: Dentist, 
    newDueDate: number,
    customTemplate?: string
  ): string {
    const template = customTemplate || this.DEFAULT_TEMPLATES.order_delayed;
    
    const variables: TemplateVariables = {
      dentist_name: dentist.name,
      order_number: order.order_number,
      new_due_date: new Date(newDueDate * 1000).toLocaleDateString('ar-SY'),
    };

    return this.processTemplate(template, variables);
  }

  // ==================== Custom Message ====================

  static createCustomMessage(variables: TemplateVariables, template: string): string {
    return this.processTemplate(template, variables);
  }

  // ==================== Validation ====================

  static validateTemplate(template: string): { valid: boolean; variables: string[] } {
    const variableRegex = /\{([^}]+)\}/g;
    const matches = template.match(variableRegex);
    const variables = matches ? matches.map(m => m.slice(1, -1)) : [];

    return {
      valid: template.length > 0 && template.length <= 4096, // WhatsApp message limit
      variables
    };
  }

  // ==================== Template Helpers ====================

  static getAvailableVariables(): string[] {
    return [
      'dentist_name',
      'order_number',
      'case_type',
      'tooth_numbers',
      'material',
      'finish_type',
      'quantity',
      'price',
      'date_received',
      'date_due',
      'date_delivered',
      'notes',
      'remaining_amount',
      'new_due_date'
    ];
  }

  static getTemplatePreview(templateType: keyof typeof WhatsAppMessageTemplates.DEFAULT_TEMPLATES): string {
    return this.DEFAULT_TEMPLATES[templateType];
  }
}