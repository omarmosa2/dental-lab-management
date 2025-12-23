"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
exports.createPaymentSchema = zod_1.z.object({
    order_id: zod_1.z.number().min(1, 'يجب اختيار طلب'),
    amount: zod_1.z.number().min(0, 'المبلغ يجب أن يكون صفر أو أكثر'),
    discount: zod_1.z.number().min(0, 'الخصم يجب أن يكون صفر أو أكثر'),
    date: zod_1.z.number(),
    payment_method: zod_1.z.enum(['cash', 'check', 'transfer', 'card']).default('cash'),
    receipt_number: zod_1.z.string().optional(),
    received_by: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
});
