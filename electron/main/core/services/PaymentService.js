"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const PaymentRepository_1 = require("../repositories/PaymentRepository");
const OrderRepository_1 = require("../repositories/OrderRepository");
const payment_schema_1 = require("./schemas/payment.schema");
const errors_1 = require("../utils/errors");
const electron_log_1 = __importDefault(require("electron-log"));
class PaymentService {
    constructor() {
        this.repository = new PaymentRepository_1.PaymentRepository();
        this.orderRepository = new OrderRepository_1.OrderRepository();
    }
    async listPayments(filters) {
        try {
            electron_log_1.default.info('PaymentService: Listing payments', filters);
            return this.repository.findAll(filters);
        }
        catch (error) {
            electron_log_1.default.error('PaymentService: Failed to list payments', error);
            throw error;
        }
    }
    async getPayment(id) {
        try {
            electron_log_1.default.info(`PaymentService: Getting payment ${id}`);
            const payment = this.repository.findById(id);
            if (!payment) {
                throw new errors_1.ValidationError(`Payment with id ${id} not found`);
            }
            return payment;
        }
        catch (error) {
            electron_log_1.default.error(`PaymentService: Failed to get payment ${id}`, error);
            throw error;
        }
    }
    async createPayment(dto) {
        try {
            electron_log_1.default.info('PaymentService: Creating payment', dto);
            // Validate input
            const validated = payment_schema_1.createPaymentSchema.parse(dto);
            // Check if order exists
            const order = this.orderRepository.findById(validated.order_id);
            if (!order) {
                throw new errors_1.ValidationError(`Order with id ${validated.order_id} not found`);
            }
            // Check if payment amount is valid
            const totalPaid = this.repository.getTotalPaid(validated.order_id);
            const remaining = order.price - totalPaid;
            const netPayment = validated.amount - validated.discount;
            if (netPayment > remaining) {
                throw new errors_1.BusinessRuleError(`المبلغ المدفوع (${netPayment}) أكبر من المبلغ المتبقي (${remaining})`);
            }
            const payment = this.repository.create(validated);
            electron_log_1.default.info(`PaymentService: Created payment ${payment.id}`);
            return payment;
        }
        catch (error) {
            electron_log_1.default.error('PaymentService: Failed to create payment', error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid payment data', error);
            }
            throw error;
        }
    }
    async deletePayment(id) {
        try {
            electron_log_1.default.info(`PaymentService: Deleting payment ${id}`);
            this.repository.delete(id);
            electron_log_1.default.info(`PaymentService: Deleted payment ${id}`);
        }
        catch (error) {
            electron_log_1.default.error(`PaymentService: Failed to delete payment ${id}`, error);
            throw error;
        }
    }
    async getOrderPayments(orderId) {
        try {
            electron_log_1.default.info(`PaymentService: Getting payments for order ${orderId}`);
            return this.repository.findByOrderId(orderId);
        }
        catch (error) {
            electron_log_1.default.error(`PaymentService: Failed to get payments for order ${orderId}`, error);
            throw error;
        }
    }
    async computeRemaining(orderId) {
        try {
            const order = this.orderRepository.findById(orderId);
            if (!order) {
                throw new errors_1.ValidationError(`Order with id ${orderId} not found`);
            }
            const totalPaid = this.repository.getTotalPaid(orderId);
            return order.price - totalPaid;
        }
        catch (error) {
            electron_log_1.default.error(`PaymentService: Failed to compute remaining for order ${orderId}`, error);
            throw error;
        }
    }
}
exports.PaymentService = PaymentService;
