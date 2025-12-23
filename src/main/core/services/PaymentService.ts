import { PaymentRepository } from '../repositories/PaymentRepository';
import { OrderRepository } from '../repositories/OrderRepository';
import { createPaymentSchema } from './schemas/payment.schema';
import { ValidationError, BusinessRuleError } from '../utils/errors';
import type { Payment, CreatePaymentDto, PaymentFilters } from '../../../shared/types/api.types';
import log from 'electron-log';

export class PaymentService {
  private repository: PaymentRepository;
  private orderRepository: OrderRepository;

  constructor() {
    this.repository = new PaymentRepository();
    this.orderRepository = new OrderRepository();
  }

  async listPayments(filters?: PaymentFilters): Promise<Payment[]> {
    try {
      log.info('PaymentService: Listing payments', filters);
      return this.repository.findAll(filters);
    } catch (error) {
      log.error('PaymentService: Failed to list payments', error);
      throw error;
    }
  }

  async getPayment(id: number): Promise<Payment> {
    try {
      log.info(`PaymentService: Getting payment ${id}`);
      const payment = this.repository.findById(id);
      if (!payment) {
        throw new ValidationError(`Payment with id ${id} not found`);
      }
      return payment;
    } catch (error) {
      log.error(`PaymentService: Failed to get payment ${id}`, error);
      throw error;
    }
  }

  async createPayment(dto: CreatePaymentDto): Promise<Payment> {
    try {
      log.info('PaymentService: Creating payment', dto);
      
      // Validate input
      const validated = createPaymentSchema.parse(dto);
      
      // Check if order exists
      const order = this.orderRepository.findById(validated.order_id);
      if (!order) {
        throw new ValidationError(`Order with id ${validated.order_id} not found`);
      }
      
      // Check if payment amount is valid
      const totalPaid = this.repository.getTotalPaid(validated.order_id);
      const remaining = order.price - totalPaid;
      const netPayment = validated.amount - validated.discount;
      
      if (netPayment > remaining) {
        throw new BusinessRuleError(`المبلغ المدفوع (${netPayment}) أكبر من المبلغ المتبقي (${remaining})`);
      }
      
      const payment = this.repository.create(validated);
      log.info(`PaymentService: Created payment ${payment.id}`);
      
      return payment;
    } catch (error) {
      log.error('PaymentService: Failed to create payment', error);
      if (error instanceof Error && error.name === 'ZodError') {
        throw new ValidationError('Invalid payment data', error);
      }
      throw error;
    }
  }

  async deletePayment(id: number): Promise<void> {
    try {
      log.info(`PaymentService: Deleting payment ${id}`);
      this.repository.delete(id);
      log.info(`PaymentService: Deleted payment ${id}`);
    } catch (error) {
      log.error(`PaymentService: Failed to delete payment ${id}`, error);
      throw error;
    }
  }

  async getOrderPayments(orderId: number): Promise<Payment[]> {
    try {
      log.info(`PaymentService: Getting payments for order ${orderId}`);
      return this.repository.findByOrderId(orderId);
    } catch (error) {
      log.error(`PaymentService: Failed to get payments for order ${orderId}`, error);
      throw error;
    }
  }

  async computeRemaining(orderId: number): Promise<number> {
    try {
      const order = this.orderRepository.findById(orderId);
      if (!order) {
        throw new ValidationError(`Order with id ${orderId} not found`);
      }
      
      const totalPaid = this.repository.getTotalPaid(orderId);
      return order.price - totalPaid;
    } catch (error) {
      log.error(`PaymentService: Failed to compute remaining for order ${orderId}`, error);
      throw error;
    }
  }
}