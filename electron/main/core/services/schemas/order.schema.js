"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const sanitization_1 = require("../../utils/sanitization");
exports.createOrderSchema = zod_1.z.object({
    dentist_id: zod_1.z.number()
        .positive('يجب اختيار طبيب')
        .refine((val) => val > 0, { message: 'يجب اختيار طبيب' }),
    case_type: zod_1.z.string()
        .min(1, 'نوع الحالة مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'نوع الحالة مطلوب' }),
    tooth_numbers: zod_1.z.array(zod_1.z.string())
        .min(1, 'يجب اختيار رقم سن واحد على الأقل')
        .refine((arr) => arr.length > 0, { message: 'يجب اختيار رقم سن واحد على الأقل' }),
    shade: zod_1.z.string()
        .min(1, 'اللون مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'اللون مطلوب' }),
    main_material: zod_1.z.string()
        .min(1, 'المادة الأساسية مطلوبة')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'المادة الأساسية مطلوبة' }),
    finish_type: zod_1.z.string()
        .min(1, 'نوع التشطيب مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'نوع التشطيب مطلوب' }),
    notes: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    quantity: zod_1.z.number()
        .min(1, 'الكمية يجب أن تكون 1 أو أكثر')
        .refine((val) => Number.isInteger(val), { message: 'الكمية يجب أن تكون رقم صحيح' }),
    date_received: zod_1.z.number()
        .positive('تاريخ الاستلام مطلوب'),
    date_due: zod_1.z.number()
        .positive('تاريخ التسليم مطلوب'),
    urgency_level: zod_1.z.enum(['normal', 'urgent', 'emergency']).default('normal'),
    warranty_period: zod_1.z.number()
        .min(0, 'فترة الضمان يجب أن تكون صفر أو أكثر')
        .default(0),
    try_in_date: zod_1.z.number().optional(),
    remake_reason: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    price: zod_1.z.number()
        .min(0, 'السعر يجب أن يكون صفر أو أكثر')
        .refine((val) => !isNaN(val) && isFinite(val), { message: 'السعر يجب أن يكون رقم صحيح' }),
    assigned_worker_id: zod_1.z.number().optional(),
}).refine((data) => {
    // Validate that date_due is after date_received
    return data.date_due > data.date_received;
}, {
    message: 'تاريخ التسليم يجب أن يكون بعد تاريخ الاستلام',
    path: ['date_due'],
}).refine((data) => {
    // Validate that try_in_date is between date_received and date_due if provided
    if (data.try_in_date) {
        return data.try_in_date >= data.date_received && data.try_in_date <= data.date_due;
    }
    return true;
}, {
    message: 'تاريخ التجربة يجب أن يكون بين تاريخ الاستلام والتسليم',
    path: ['try_in_date'],
});
exports.updateOrderSchema = exports.createOrderSchema.partial().extend({
    id: zod_1.z.number().positive('معرف غير صحيح'),
    status: zod_1.z.enum(['pending', 'in_progress', 'completed', 'ready', 'delivered', 'cancelled']).optional(),
    date_delivered: zod_1.z.number().optional(),
    revision_count: zod_1.z.number().min(0).optional(),
}).refine((data) => {
    // Validate that date_delivered is after date_received if both are provided
    if (data.date_delivered && data.date_received) {
        return data.date_delivered >= data.date_received;
    }
    return true;
}, {
    message: 'تاريخ التسليم الفعلي يجب أن يكون بعد تاريخ الاستلام',
    path: ['date_delivered'],
});
