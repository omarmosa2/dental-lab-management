"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const OrderRepository_1 = require("../repositories/OrderRepository");
const PaymentRepository_1 = require("../repositories/PaymentRepository");
const DentistRepository_1 = require("../repositories/DentistRepository");
const order_schema_1 = require("./schemas/order.schema");
const errors_1 = require("../utils/errors");
const WhatsAppService_1 = require("./WhatsAppService");
const WhatsAppMessageTemplates_1 = require("./WhatsAppMessageTemplates");
const electron_log_1 = __importDefault(require("electron-log"));
class OrderService {
    constructor() {
        this.repository = new OrderRepository_1.OrderRepository();
        this.paymentRepository = new PaymentRepository_1.PaymentRepository();
        this.dentistRepository = new DentistRepository_1.DentistRepository();
    }
    async listOrders(filters, pagination) {
        try {
            electron_log_1.default.info('OrderService: Listing orders', { filters, pagination });
            const orders = this.repository.findAll(filters, pagination);
            const total = this.repository.count(filters);
            return { orders, total };
        }
        catch (error) {
            electron_log_1.default.error('OrderService: Failed to list orders', error);
            throw error;
        }
    }
    async countOrders(filters) {
        try {
            electron_log_1.default.info('OrderService: Counting orders', { filters });
            return this.repository.count(filters);
        }
        catch (error) {
            electron_log_1.default.error('OrderService: Failed to count orders', error);
            throw error;
        }
    }
    async getOrder(id) {
        try {
            electron_log_1.default.info(`OrderService: Getting order ${id}`);
            const order = this.repository.findById(id);
            if (!order) {
                throw new errors_1.ValidationError(`Order with id ${id} not found`);
            }
            return order;
        }
        catch (error) {
            electron_log_1.default.error(`OrderService: Failed to get order ${id}`, error);
            throw error;
        }
    }
    async createOrder(dto) {
        try {
            electron_log_1.default.info('OrderService: Creating order', dto);
            // Validate input
            const validated = order_schema_1.createOrderSchema.parse(dto);
            // Validate dates
            if (validated.date_due < validated.date_received) {
                throw new errors_1.BusinessRuleError('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
            }
            const order = this.repository.create(validated);
            electron_log_1.default.info(`OrderService: Created order ${order.id} with number ${order.order_number}`);
            return order;
        }
        catch (error) {
            electron_log_1.default.error('OrderService: Failed to create order', error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid order data', error);
            }
            throw error;
        }
    }
    async updateOrder(dto) {
        try {
            electron_log_1.default.info(`OrderService: Updating order ${dto.id}`, dto);
            // Validate input
            const validated = order_schema_1.updateOrderSchema.parse(dto);
            // Validate dates if both are provided
            if (validated.date_due && validated.date_received && validated.date_due < validated.date_received) {
                throw new errors_1.BusinessRuleError('تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام');
            }
            const order = this.repository.update(validated);
            electron_log_1.default.info(`OrderService: Updated order ${order.id}`);
            return order;
        }
        catch (error) {
            electron_log_1.default.error(`OrderService: Failed to update order ${dto.id}`, error);
            if (error instanceof Error && error.name === 'ZodError') {
                throw new errors_1.ValidationError('Invalid order data', error);
            }
            throw error;
        }
    }
    async changeStatus(id, status) {
        try {
            electron_log_1.default.info(`OrderService: Changing order ${id} status to ${status}`);
            const order = await this.getOrder(id);
            const previousStatus = order.status;
            // Auto-set delivered date when status changes to delivered
            const updateDto = { id, status };
            if (status === 'delivered' && !order.date_delivered) {
                updateDto.date_delivered = Math.floor(Date.now() / 1000);
            }
            const updatedOrder = this.repository.update(updateDto);
            // Send WhatsApp notification if enabled and status changed
            if (previousStatus !== status) {
                await this.sendStatusChangeNotification(updatedOrder, status);
            }
            return updatedOrder;
        }
        catch (error) {
            electron_log_1.default.error(`OrderService: Failed to change order ${id} status`, error);
            throw error;
        }
    }
    async sendStatusChangeNotification(order, newStatus) {
        try {
            electron_log_1.default.info(`OrderService: Attempting to send WhatsApp notification for order ${order.id} status change to ${newStatus}`);
            const whatsAppService = (0, WhatsAppService_1.getWhatsAppService)();
            const settings = await whatsAppService.getSettings();
            // Check if WhatsApp settings exist
            if (!settings) {
                electron_log_1.default.warn('WhatsApp settings not found, skipping notification');
                return;
            }
            electron_log_1.default.info('WhatsApp settings loaded', {
                is_enabled: settings.is_enabled,
                is_connected: settings.is_connected,
                phone_number: settings.phone_number,
                send_on_complete: settings.send_on_order_complete,
                send_on_ready: settings.send_on_order_ready,
                send_on_delivered: settings.send_on_order_delivered
            });
            // Check if WhatsApp service is actually connected
            const isConnected = whatsAppService.isConnected();
            electron_log_1.default.info('WhatsApp connection status', { isConnected });
            if (!isConnected) {
                electron_log_1.default.warn('WhatsApp service not connected, skipping notification');
                return;
            }
            // Note: We rely on is_connected from DB which is set when connected
            // is_enabled is automatically set to 1 when connection succeeds
            if (!settings.is_enabled && !settings.is_connected) {
                electron_log_1.default.info('WhatsApp not enabled or connected, skipping notification', {
                    is_enabled: settings.is_enabled,
                    is_connected: settings.is_connected
                });
                return;
            }
            // Get dentist information
            const dentist = this.dentistRepository.findById(order.dentist_id);
            if (!dentist || !dentist.phone) {
                electron_log_1.default.warn(`No phone number found for dentist ${order.dentist_id}, skipping notification`);
                return;
            }
            let shouldSend = false;
            let messageTemplate = '';
            let messageType = 'custom';
            // Determine which notification to send based on status and settings
            if (newStatus === 'completed' && settings.send_on_order_complete) {
                shouldSend = true;
                messageTemplate = settings.message_template_complete;
                messageType = 'order_complete';
            }
            else if (newStatus === 'ready' && settings.send_on_order_ready) {
                shouldSend = true;
                messageTemplate = settings.message_template_ready;
                messageType = 'order_ready';
            }
            else if (newStatus === 'delivered' && settings.send_on_order_delivered) {
                shouldSend = true;
                messageTemplate = settings.message_template_delivered;
                messageType = 'order_delivered';
            }
            if (!shouldSend) {
                electron_log_1.default.info(`No notification configured for status: ${newStatus}`);
                return;
            }
            // Generate message from template
            let message = '';
            if (messageType === 'order_complete') {
                message = WhatsAppMessageTemplates_1.WhatsAppMessageTemplates.createOrderCompleteMessage(order, dentist, messageTemplate);
            }
            else if (messageType === 'order_ready') {
                message = WhatsAppMessageTemplates_1.WhatsAppMessageTemplates.createOrderReadyMessage(order, dentist, messageTemplate);
            }
            else if (messageType === 'order_delivered') {
                message = WhatsAppMessageTemplates_1.WhatsAppMessageTemplates.createOrderDeliveredMessage(order, dentist, messageTemplate);
            }
            // Send the message
            electron_log_1.default.info(`Sending WhatsApp notification`, {
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
                electron_log_1.default.info(`✅ WhatsApp notification sent successfully`, {
                    orderNumber: order.order_number,
                    messageId: result.messageId
                });
            }
            else {
                electron_log_1.default.error(`❌ Failed to send WhatsApp notification`, {
                    orderNumber: order.order_number,
                    error: result.error
                });
            }
        }
        catch (error) {
            // Don't throw error, just log it - notification failure shouldn't break order status change
            electron_log_1.default.error('Error sending WhatsApp notification:', error);
        }
    }
    async deleteOrder(id) {
        try {
            electron_log_1.default.info(`OrderService: Deleting order ${id}`);
            // Check if order has payments
            const payments = this.paymentRepository.findByOrderId(id);
            if (payments.length > 0) {
                throw new errors_1.BusinessRuleError('لا يمكن حذف طلب يحتوي على دفعات');
            }
            this.repository.delete(id);
            electron_log_1.default.info(`OrderService: Deleted order ${id}`);
        }
        catch (error) {
            electron_log_1.default.error(`OrderService: Failed to delete order ${id}`, error);
            throw error;
        }
    }
    async getOrderPaymentStatus(id) {
        try {
            const order = await this.getOrder(id);
            const paid = this.paymentRepository.getTotalPaid(id);
            const remaining = order.price - paid;
            return {
                total: order.price,
                paid,
                remaining,
            };
        }
        catch (error) {
            electron_log_1.default.error(`OrderService: Failed to get payment status for order ${id}`, error);
            throw error;
        }
    }
}
exports.OrderService = OrderService;
