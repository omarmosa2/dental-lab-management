"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExpenseSchema = void 0;
const zod_1 = require("zod");
exports.createExpenseSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, 'الوصف مطلوب'),
    amount: zod_1.z.number().min(0, 'المبلغ يجب أن يكون صفر أو أكثر'),
    category: zod_1.z.string().min(1, 'الفئة مطلوبة'),
    date: zod_1.z.number(),
    payment_method: zod_1.z.enum(['cash', 'check', 'transfer', 'card']).default('cash'),
    receipt_number: zod_1.z.string().optional(),
    vendor: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
});
