"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDentistSchema = exports.createDentistSchema = void 0;
const zod_1 = require("zod");
const sanitization_1 = require("../../utils/sanitization");
// Phone validation regex (Syrian format)
const phoneRegex = /^[0-9+\-\s()]{10,}$/;
exports.createDentistSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, 'الاسم مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'الاسم مطلوب' }),
    gender: zod_1.z.enum(['male', 'female'], {
        message: 'الجنس مطلوب'
    }),
    residence: zod_1.z.string()
        .min(1, 'مكان الإقامة مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'مكان الإقامة مطلوب' }),
    phone: zod_1.z.string()
        .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
        .regex(phoneRegex, 'رقم هاتف غير صحيح')
        .transform(sanitization_1.sanitizePhone)
        .refine((val) => val !== null, { message: 'رقم الهاتف مطلوب' }),
    clinic_name: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    specialization: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    case_types: zod_1.z.array(zod_1.z.string()).optional().default([]),
    payment_terms: zod_1.z.enum(['immediate', '7_days', '15_days', '30_days']).optional().default('immediate'),
    discount_rate: zod_1.z.number()
        .min(0, 'نسبة الخصم يجب أن تكون بين 0 و 100')
        .max(100, 'نسبة الخصم يجب أن تكون بين 0 و 100')
        .optional()
        .default(0),
    cost: zod_1.z.number()
        .min(0, 'التكلفة يجب أن تكون صفر أو أكثر')
        .refine((val) => !isNaN(val) && isFinite(val), { message: 'التكلفة يجب أن تكون رقم صحيح' }),
    notes: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
});
exports.updateDentistSchema = exports.createDentistSchema.partial().extend({
    id: zod_1.z.number().positive('معرف غير صحيح'),
});
