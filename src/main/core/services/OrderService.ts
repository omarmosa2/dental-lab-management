import { OrderRepository } from '../repositories/OrderRepository';
import { PaymentRepository } from '../repositories/PaymentRepository';
import { DentistRepository } from '../repositories/DentistRepository';
import { createOrderSchema, updateOrderSchema } from './schemas/order.schema';
import { ValidationError, BusinessRuleError } from '../utils/errors';
import type { Order, CreateOrderDto, UpdateOrderDto, OrderFilters, PaginationParams } from '../../../shared/types/api.types';
import { getWhatsAppService } from './WhatsAppService';
import { WhatsAppMessageTemplates } from './WhatsAppMessageTemplates';
import log from 'electron-log';

export class OrderService {
  private repository: OrderRepository;
  private paymentRepository: PaymentRepository;
  private dentistRepository: DentistRepository;

  constructor() {
    this.repository = new OrderRepository();
    this.paymentRepository = new PaymentRepository();
    this.dentistRepository = new DentistRepository();
  }

  async listOrders(filters?: OrderFilters, pagination?: PaginationParams): Promise<{ orders: Order[]; total: number }> {
    try {
      log.info('OrderService: Listing orders', { filters, pagination });
      const orders = this.repository.findAll(filters, pagination);
      const total = this.repository.count(filters);
      return { orders, total };
    } catch (error) {
      log.error('OrderService: Failed to list orders', error);
      throw error;
    }
  }

  async countOrders(filters?: OrderFilters): Promise<number> {
    try {
      log.info('OrderService: Counting orders', { filters });
      return this.repository.count(filters);
    } catch (error) {
      log.error('OrderService: Failed to count orders', error);
      throw error;
    }
  }

  async getOrder(id: number): Promise<Order> {
    try {
      log.info(`OrderService: Getting order ${id}`);
      const order = this.repository.findById(id);
      if (!order) {
        throw new ValidationError(`Order with id ${id} not found`);
      }
      return order;
    } catch (error) {
      log.error(`OrderService: Failed to get order ${id}`, error);
      throw error;
    }
  }

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    try {
      log.info('OrderService: Creating order', dto);
      
      // Validate input
      const validated = createOrderSchema.parse(dto);
      
      // Validate dates
      if (validated.date_due < validated.date_received) {
        throw new BusinessRuleError('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
      }
      
      const order = this.repository.create(validated);
      log.info(`OrderService: Created order ${order.id} with number ${order.order_number}`);
      
      return order;
    } catch (error) {
      log.error('OrderService: Failed to create order', error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid order data', error);
      }
      throw error;
    }
  }

  async updateOrder(dto: UpdateOrderDto): Promise<Order> {
    try {
      log.info(`OrderService: Updating order ${dto.id}`, dto);
      
      // Validate input
      const validated = updateOrderSchema.parse(dto);
      
      // Validate dates if both are provided
      if (validated.date_due && validated.date_received && validated.date_due < validated.date_received) {
        throw new BusinessRuleError('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
      }
      
      const order = this.repository.update(validated);
      log.info(`OrderService: Updated order ${order.id}`);
      
      return order;
    } catch (error) {
      log.error(`OrderService: Failed to update order ${dto.id}`, error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid order data', error);
      }
      throw error;
    }
  }

  async changeStatus(id: number, status: Order['status']): Promise<Order> {
    try {
      log.info(`OrderService: Changing order ${id} status to ${status}`);
      
      const order = await this.getOrder(id);
      const previousStatus = order.status;
      
      // Auto-set delivered date when status changes to delivered
      const updateDto: UpdateOrderDto = { id, status };
      if (status === 'delivered' && !order.date_delivered) {
        updateDto.date_delivered = Math.floor(Date.now() / 1000);
      }
      
      const updatedOrder = this.repository.update(updateDto);
      
      // Send WhatsApp notification if enabled and status changed
      if (previousStatus !== status) {
        await this.sendStatusChangeNotification(updatedOrder, status);
      }
      
      return updatedOrder;
    } catch (error) {
      log.error(`OrderService: Failed to change order ${id} status`, error);
      throw error;
    }
  }

  private async sendStatusChangeNotification(order: Order, newStatus: Order['status']): Promise<void> {
    try {
      log.info(`OrderService: Attempting to send WhatsApp notification for order ${order.id} status change to ${newStatus}`);
      
      const whatsAppService = getWhatsAppService();
      const settings = await whatsAppService.getSettings();
      
      // Check if WhatsApp settings exist
      if (!settings) {
        log.warn('WhatsApp settings not found, skipping notification');
        return;
      }
      
      log.info('WhatsApp settings loaded', { 
        is_enabled: settings.is_enabled,
        is_connected: settings.is_connected,
        phone_number: settings.phone_number,
        send_on_complete: settings.send_on_order_complete,
        send_on_ready: settings.send_on_order_ready,
        send_on_delivered: settings.send_on_order_delivered
      });
      
      // Check if WhatsApp service is actually connected
      const isConnected = whatsAppService.isConnected();
      log.info('WhatsApp connection status', { isConnected });
      
      if (!isConnected) {
        log.warn('WhatsApp service not connected, skipping notification');
        return;
      }
      
      // Note: We rely on is_connected from DB which is set when connected
      // is_enabled is automatically set to 1 when connection succeeds
      if (!settings.is_enabled && !settings.is_connected) {
        log.info('WhatsApp not enabled or connected, skipping notification', { 
          is_enabled: settings.is_enabled,
          is_connected: settings.is_connected 
        });
        return;
      }

      // Get dentist information
      const dentist = this.dentistRepository.findById(order.dentist_id);
      if (!dentist || !dentist.phone) {
        log.warn(`No phone number found for dentist ${order.dentist_id}, skipping notification`);
        return;
      }

      let shouldSend = false;
      let messageTemplate = '';
      let messageType: 'order_complete' | 'order_ready' | 'order_delivered' | 'custom' = 'custom';

      // Determine which notification to send based on status and settings
      if (newStatus === 'completed' && settings.send_on_order_complete) {
        shouldSend = true;
        messageTemplate = settings.message_template_complete;
        messageType = 'order_complete';
      } else if (newStatus === 'ready' && settings.send_on_order_ready) {
        shouldSend = true;
        messageTemplate = settings.message_template_ready;
        messageType = 'order_ready';
      } else if (newStatus === 'delivered' && settings.send_on_order_delivered) {
        shouldSend = true;
        messageTemplate = settings.message_template_delivered;
        messageType = 'order_delivered';
      }

      if (!shouldSend) {
        log.info(`No notification configured for status: ${newStatus}`);
        return;
      }

      // Generate message from template
      let message = '';
      if (messageType === 'order_complete') {
        message = WhatsAppMessageTemplates.createOrderCompleteMessage(order, dentist, messageTemplate);
      } else if (messageType === 'order_ready') {
        message = WhatsAppMessageTemplates.createOrderReadyMessage(order, dentist, messageTemplate);
      } else if (messageType === 'order_delivered') {
        message = WhatsAppMessageTemplates.createOrderDeliveredMessage(order, dentist, messageTemplate);
      }

      // Send the message
      log.info(`Sending WhatsApp notification`, {
        to: dentist.phone,
        orderNumber: order.order_number,
        messageType,
        messagePreview: message.substring(0, 50) + '...'
      });
      
      const result = await whatsAppService.sendMessage({
        phoneNumber: dentist.phone,
        message,
        orderId: order.id,
        dentistId: dentist.id,
        messageType
      });

      if (result.success) {
        log.info(`✅ WhatsApp notification sent successfully`, {
          orderNumber: order.order_number,
          messageId: result.messageId
        });
      } else {
        log.error(`❌ Failed to send WhatsApp notification`, {
          orderNumber: order.order_number,
          error: result.error
        });
      }
    } catch (error) {
      // Don't throw error, just log it - notification failure shouldn't break order status change
      log.error('Error sending WhatsApp notification:', error);
    }
  }

  async deleteOrder(id: number): Promise<void> {
    try {
      log.info(`OrderService: Deleting order ${id}`);
      
      // Check if order has payments
      const payments = this.paymentRepository.findByOrderId(id);
      if (payments.length > 0) {
        throw new BusinessRuleError('لا يمكن حذف طلب يحتوي على دفعات');
      }
      
      this.repository.delete(id);
      log.info(`OrderService: Deleted order ${id}`);
    } catch (error) {
      log.error(`OrderService: Failed to delete order ${id}`, error);
      throw error;
    }
  }

  async getOrderPaymentStatus(id: number): Promise<{ total: number; paid: number; remaining: number }> {
    try {
      const order = await this.getOrder(id);
      const paid = this.paymentRepository.getTotalPaid(id);
      const remaining = order.price - paid;
      
      return {
        total: order.price,
        paid,
        remaining,
      };
    } catch (error) {
      log.error(`OrderService: Failed to get payment status for order ${id}`, error);
      throw error;
    }
  }
}