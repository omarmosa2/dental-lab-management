"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaterialSchema = exports.createMaterialSchema = void 0;
const zod_1 = require("zod");
const sanitization_1 = require("../../utils/sanitization");
exports.createMaterialSchema = zod_1.z.object({
    code: zod_1.z.string()
        .min(1, 'الكود مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'الكود مطلوب' }),
    name: zod_1.z.string()
        .min(1, 'الاسم مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'الاسم مطلوب' }),
    quantity: zod_1.z.number()
        .min(0, 'الكمية يجب أن تكون صفر أو أكثر')
        .refine((val) => !isNaN(val) && isFinite(val), { message: 'الكمية يجب أن تكون رقم صحيح' }),
    min_quantity: zod_1.z.number()
        .min(0, 'الحد الأدنى يجب أن يكون صفر أو أكثر')
        .refine((val) => !isNaN(val) && isFinite(val), { message: 'الحد الأدنى يجب أن يكون رقم صحيح' }),
    unit: zod_1.z.string()
        .min(1, 'الوحدة مطلوبة')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'الوحدة مطلوبة' }),
    cost_per_unit: zod_1.z.number()
        .min(0, 'التكلفة يجب أن تكون صفر أو أكثر')
        .refine((val) => !isNaN(val) && isFinite(val), { message: 'التكلفة يجب أن تكون رقم صحيح' }),
    supplier: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    last_purchase_date: zod_1.z.number().optional(),
    expiry_date: zod_1.z.number().optional(),
    category: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    notes: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
}).refine((data) => {
    // Validate that expiry_date is after last_purchase_date if both are provided
    if (data.expiry_date && data.last_purchase_date) {
        return data.expiry_date > data.last_purchase_date;
    }
    return true;
}, {
    message: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ الشراء',
    path: ['expiry_date'],
});
exports.updateMaterialSchema = exports.createMaterialSchema.partial().extend({
    id: zod_1.z.number().positive('معرف غير صحيح'),
});
