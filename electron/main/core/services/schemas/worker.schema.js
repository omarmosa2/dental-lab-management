"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWorkerSchema = exports.createWorkerSchema = void 0;
const zod_1 = require("zod");
const sanitization_1 = require("../../utils/sanitization");
// Phone validation regex
const phoneRegex = /^[0-9+\-\s()]{10,}$/;
exports.createWorkerSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(1, 'الاسم مطلوب')
        .transform(sanitization_1.sanitizeString)
        .refine((val) => val !== null && val.length > 0, { message: 'الاسم مطلوب' }),
    phone: zod_1.z.string()
        .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
        .regex(phoneRegex, 'رقم هاتف غير صحيح')
        .transform(sanitization_1.sanitizePhone)
        .refine((val) => val !== null, { message: 'رقم الهاتف مطلوب' }),
    salary: zod_1.z.number()
        .min(0, 'الراتب يجب أن يكون صفر أو أكثر')
        .refine((val) => !isNaN(val) && isFinite(val), { message: 'الراتب يجب أن يكون رقم صحيح' }),
    hire_date: zod_1.z.number()
        .refine((val) => val > 0, { message: 'تاريخ التوظيف مطلوب' }),
    specialization: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    performance_rating: zod_1.z.number()
        .min(0, 'التقييم يجب أن يكون بين 0 و 5')
        .max(5, 'التقييم يجب أن يكون بين 0 و 5')
        .default(0),
    national_id: zod_1.z.string()
        .optional()
        .transform(sanitization_1.sanitizeNationalId)
        .refine((val) => val === null || val.length === 11, { message: 'الرقم الوطني يجب أن يكون 11 رقم' }),
    address: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
    notes: zod_1.z.string().optional().transform(sanitization_1.sanitizeString),
});
exports.updateWorkerSchema = exports.createWorkerSchema.partial().extend({
    id: zod_1.z.number().positive('معرف غير صحيح'),
    status: zod_1.z.enum(['active', 'inactive']).optional(),
});
